/**
 * claude-handler.js
 * Claude AI con tools para disponibilidad, precios y reservas por WhatsApp.
 */

import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { HOTEL_SYSTEM_PROMPT, ROOMS, TOURS, RESTAURANT_MENU } from './hotel-knowledge.js';
import { createQuote, getByUser, getByFolio, getLocallyReservedBackendNames } from './reservations.js';
import { getUnavailableRoomsFromGoogleSheet, appendTempBlockToSheet, getReservationByFolioFromSheet, getReservationsByNameFromSheet, findAlternativeDates, getPerNightUnavailableFromSheet } from './google-sheets.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 4,    // reintentos ante 429/529/errores transitorios (default 2) — evita que un blip pase a "Tuve un problema técnico"
  timeout: 60000,   // 60s por intento (default 10 min) para no colgar el manejador del mensaje
});
const BOOKING_API = process.env.BOOKING_API_URL || 'https://paraisoencantado.com';

// Token de servicio para autenticar las llamadas del agente a las APIs admin del sitio.
// El middleware del sitio exige JWT en /api/admin/*; con este header el agente se
// autentica como servicio interno. Debe coincidir con AGENT_API_TOKEN en el sitio.
const AGENT_API_TOKEN = process.env.AGENT_API_TOKEN || '';
function adminHeaders(extra = {}) {
  return { ...(AGENT_API_TOKEN ? { 'x-agent-token': AGENT_API_TOKEN } : {}), ...extra };
}

// ── Estado del bot (caché 30s para no saturar la API) ─────
let botEnabledCache = { value: true, expiresAt: 0 };

async function isBotEnabled() {
  const now = Date.now();
  if (now < botEnabledCache.expiresAt) return botEnabledCache.value;
  try {
    const res = await fetch(`${BOOKING_API}/api/admin/bot-status`, { headers: adminHeaders(), signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const { enabled } = await res.json();
      botEnabledCache = { value: Boolean(enabled), expiresAt: now + 30_000 };
      return botEnabledCache.value;
    }
  } catch { /* si falla, asumir encendido */ }
  return botEnabledCache.value;
}

const conversations = new Map();
const MAX_HISTORY = 15; // 15 mensajes — contexto amplio para no perder fechas

// Datos de sesión por usuario — persisten fuera del historial de Claude
// para que las fechas/nombre/email no se pierdan cuando el historial se trunca.
const sessionData = new Map(); // userId -> { checkin, checkout, guestName, guestEmail, phone, rooms }

function getSession(userId) {
  if (!sessionData.has(userId)) sessionData.set(userId, {});
  return sessionData.get(userId);
}
function updateSession(userId, data) {
  const s = getSession(userId);
  Object.assign(s, data);
}

// Solo escalar cuando el cliente PIDE hablar con alguien — palabras sueltas como
// "recepción" o "gerente" en preguntas normales ("¿la recepción abre 24 h?") NO escalan.
const HUMAN_REQUEST_REGEX = /\b(humano|asesor)\b|\b(hablar|comun[ií]came|comunicarme|p[aá]same|transfi[eé]reme|con[eé]ctame|atienda)\b.{0,30}\b(persona|humano|recepci[oó]n|gerente|manager|ejecutivo|asesor|agente|equipo|alguien)\b|quiero hablar con|human support|real person/i;
const ESCALATION_RESPONSE_REGEX = /te comunico con nuestro equipo|en breve te contactan|te contacta nuestro equipo|te atiende una persona/i;

const TOUR_BOOKING_INTENT_REGEX = /\b(quiero|quisiera|me interesa|me gustar[íi]a|podemos|podría|puedo|reservar|contratar|apartar|tomar|agendar)\b.{0,40}\b(tour|tours|excursion|excursiones|recorrido|paquete)\b|\b(tour|tours)\b.{0,40}\b(reservar|contratar|apartar|pagar|agendar|incluir)\b/i;

function needsHumanIntervention(userText = '', assistantText = '') {
  return HUMAN_REQUEST_REGEX.test(userText) || ESCALATION_RESPONSE_REGEX.test(assistantText);
}

function wantsTourBooking(userText = '', assistantText = '') {
  return TOUR_BOOKING_INTENT_REGEX.test(userText) ||
    /huasteca-potosina\.com|para reservar.*tour|tour.*reservar/i.test(assistantText);
}

function parseFirstInteger(value = '') {
  const match = String(value).match(/\b(\d{1,3})\b/);
  return match ? Number(match[1]) : null;
}

// Calcula precio por noche considerando personas extra (ej. Helechos 5-6 personas)
function getRoomPricePerNight(room, guests) {
  if (!room) return 1900;
  const g = Number(guests || 2);
  if (g <= 2) return room.price_2 || 1900;
  if (g <= 4) return room.price_3_4 || room.price_2 || 1900;
  // 5-6 personas: precio base (4p) + extra_person por cada persona adicional
  const base = room.price_3_4 || room.price_2 || 1900;
  const extra = room.extra_person || 0;
  return base + (g - 4) * extra;
}

// ── Propuesta de estancia con cambio de suite (split-stay) ─────────────────
// Preferencia para desempatar cuando dos suites cubren igual número de noches.
function splitRoomRank(room) {
  const id = String(room?.id || '');
  if (id === 'suite-jungla' || /jungla/i.test(room?.name || '')) return 0;
  if (id === 'suite-lindavista' || /lindavista/i.test(room?.name || '')) return 1;
  return 2;
}

// Algoritmo PURO: dada la lista de noches y las suites libres por noche, arma segmentos
// consecutivos MINIMIZANDO los cambios de suite (greedy "tramo más largo desde la izquierda",
// que es óptimo en número de segmentos). No hace I/O — fácil de probar.
export function buildSplitSegments(nights, freeRoomsPerNight, guests) {
  const k = nights.length;
  const g = Number(guests) || 2;
  if (k === 0) return { feasible: false, reason: 'no_nights' };

  const segments = [];
  let i = 0;
  let guard = 0;
  while (i < k && guard < 200) {
    guard++;
    const free = freeRoomsPerNight[i] || [];
    if (free.length === 0) {
      return { feasible: false, reason: 'night_full', nightDate: nights[i].date };
    }
    // Elegir la suite libre desde i que se extienda MÁS noches consecutivas.
    let best = null;
    let bestEnd = i; // exclusivo
    for (const room of free) {
      let j = i;
      while (j < k && (freeRoomsPerNight[j] || []).some(r => r.id === room.id)) j++;
      const extension = j - i;
      const bestExtension = bestEnd - i;
      if (extension > bestExtension) {
        best = room; bestEnd = j;
      } else if (best && extension === bestExtension) {
        // Desempate: primero suite recomendada, luego más barata.
        if (splitRoomRank(room) < splitRoomRank(best)) best = room;
        else if (splitRoomRank(room) === splitRoomRank(best) &&
                 getRoomPricePerNight(room, g) < getRoomPricePerNight(best, g)) best = room;
      }
    }
    if (!best) return { feasible: false, reason: 'no_room', nightDate: nights[i].date };

    const nightsInSeg = bestEnd - i;
    const perNight = getRoomPricePerNight(best, g);
    segments.push({
      room_id: best.id,
      room_name: best.name,
      guests: g,
      checkin: nights[i].date,
      checkout: nights[bestEnd - 1].checkout,
      nights: nightsInSeg,
      price_per_night: perNight,
      subtotal: perNight * nightsInSeg
    });
    i = bestEnd;
  }

  const total = segments.reduce((s, seg) => s + seg.subtotal, 0);
  return { feasible: true, guests: g, segments, changes: segments.length - 1, total_price: total };
}

// Calcula la propuesta split-stay para un rango sin una sola suite libre todas las noches.
// Considera TODAS las suites con capacidad suficiente y combina las 3 fuentes de verdad
// (Google Sheets + backend + reservas locales confirmadas), noche por noche.
async function computeSplitStayProposal({ checkin, checkout, guests, allRooms }) {
  const g = Number(guests) || 2;
  const candidateRooms = (allRooms || []).filter(r => (r.max_occupancy || 2) >= g);
  if (candidateRooms.length === 0) return { feasible: false, reason: 'no_capacity' };

  let perNightSheet;
  try {
    perNightSheet = await getPerNightUnavailableFromSheet({ checkin, checkout, requestedRooms: candidateRooms });
  } catch (err) {
    console.warn('⚠️ Split-stay: no se pudo leer disponibilidad por noche:', err.message);
    return { feasible: false, reason: 'sheet_error' };
  }
  if (!perNightSheet.length) return { feasible: false, reason: 'no_nights' };

  const backendNamesAll = candidateRooms.map(r => r.backendName);
  const perNightBlocked = await Promise.all(perNightSheet.map(async (night) => {
    const blocked = new Set(night.blockedBackendNames);
    // Backend (bloqueos temporales de otras cotizaciones en curso)
    try {
      const res = await fetch(`${BOOKING_API}/api/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin: night.date, checkout: night.checkout, rooms: backendNamesAll })
      });
      const data = await res.json();
      for (const n of (data.unavailableRooms || [])) blocked.add(n);
    } catch { /* la hoja ya cubre lo principal */ }
    // Reservas WhatsApp confirmadas localmente
    try {
      for (const n of getLocallyReservedBackendNames({ checkin: night.date, checkout: night.checkout, requestedRooms: candidateRooms })) blocked.add(n);
    } catch { /* ignore */ }
    return blocked;
  }));

  const freeRoomsPerNight = perNightSheet.map((night, i) =>
    candidateRooms.filter(r => !perNightBlocked[i].has(r.backendName))
  );

  return buildSplitSegments(perNightSheet, freeRoomsPerNight, g);
}

// Carta individual del restaurante — respuesta oficial a preguntas de comida/menú
// (el buffet grupal solo se ofrece a grupos de 20+; ver hotel-knowledge.js)
function buildCartaMessage() {
  const desayunos = RESTAURANT_MENU.desayunos.map(i => `${i.name} $${i.price}`).join(' · ');
  const principales = RESTAURANT_MENU.principales.map(i => `${i.name} $${i.price}`).join(' · ');
  const bebidas = RESTAURANT_MENU.bebidas.map(i => `${i.name} $${i.price}`).join(' · ');
  return `Nuestro restaurante *El Papán Huasteco* (8:00 AM – 8:00 PM) 🍽️\n\n*Desayunos:* ${desayunos}\n*Platillos principales:* ${principales}\n*Bebidas:* ${bebidas}\n\nAbierto todos los días para huéspedes y público general. 🌿\n\n¿Te ayudo también con tu reserva de hospedaje?`;
}

function getDeterministicResponse(userText = '', session = {}) {
  const text = normalizeText(userText);

  if (!text) return null;

  if (HUMAN_REQUEST_REGEX.test(userText)) {
    return 'Te comunico con nuestro equipo, en breve te contactan. 🤝📞';
  }

  // "mi reserva/reservación" — si hay folio activo en sesión, mostrar datos sin pedir folio.
  // Si el cliente ya incluyó un identificador (folio WA-/PE- o "a nombre de ..."), NO
  // cortamos aquí: dejamos que el modelo use lookup_reservation para buscarla.
  const hasFolioLike = /\b(wa|pe)[- ]?[a-z0-9]{4,}\b/i.test(userText);
  const hasNameIndicator = /\ba nombre de\b|\bnombre de la reserva|\bmi nombre es\b|\bse llama\b/i.test(text);
  if ((text.includes('mi reserva') || text.includes('mi reservacion') || text.includes('mi reservación') || text.includes('detalles de mi reserva')) && !text.includes('cancel') && !hasFolioLike && !hasNameIndicator) {
    if (session.lastFolio && session.checkin && session.checkout) {
      return `Tu cotización activa:\n📋 *Folio:* ${session.lastFolio}\n📅 Check-in: ${session.checkin}\n📅 Check-out: ${session.checkout}\n\n¿Tienes alguna duda o ya enviaste el comprobante? 🌿`;
    }
    return 'Para ver los detalles de tu reserva compárteme uno de estos datos: tu *folio de WhatsApp* (WA-XXXXXXXX), tu *número de confirmación de la página* (PE-XXXXXXXX) o el *nombre* de la reservación (ej. Manolo Covarrubias). 🧾📌';
  }

  if ((text.includes('quiero reservar') || text.includes('reservar por whatsapp')) && !text.includes('check-in') && !text.includes('check out')) {
    const urlMotor = (session.checkin && session.checkout)
      ? `https://paraisoencantado.com/reservar?checkin=${session.checkin}&checkout=${session.checkout}`
      : 'https://paraisoencantado.com/reservar';
    return `Tenemos *dos formas fáciles de reservar*: 📱 *Opción 1 — Por WhatsApp:* cotización + pago por SPEI u OXXO. 🌐 *Opción 2 — Motor en línea:* ${urlMotor} (tarjeta, confirmación instantánea). ¿Me compartes tu *check-in y check-out* y cuántos huéspedes serían? 🌿📅`;
  }

  // Grupo real: mención explícita de "grupo", 5+ personas, o 3+ habitaciones.
  // (Antes cualquier "para 2 personas" caía aquí y secuestraba la consulta normal.)
  const peopleNearMatch = text.match(/(\d{1,3})\s*personas/);
  const roomsNearMatch = text.match(/(\d{1,3})\s*habitacion/);
  const looksGroupFlow =
    text.includes('grupo') ||
    (peopleNearMatch && Number(peopleNearMatch[1]) >= 5) ||
    (roomsNearMatch && Number(roomsNearMatch[1]) >= 3) ||
    (text.includes('somos ') && (parseFirstInteger(text) || 0) >= 5);
  if (looksGroupFlow && (text.includes('cotizacion') || text.includes('reservar') || text.includes('disponibilidad'))) {
    return '¡Claro! Para tu *reserva de grupo* te ayudo paso a paso. 🌿\n\n1) ¿Cuántas personas son en total?\n2) Compárteme *check-in y check-out* para revisar disponibilidad real.\n3) Te muestro las habitaciones libres y el catálogo de precios del hotel.\n4) Me compartes la distribución por habitación (cuántas personas en cada suite) y te genero *una sola cotización global*.';
  }

  const asksAvailability = text.includes('disponible') || text.includes('disponibilidad') || text.includes('hay habitaciones');
  const hasMonthName = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)/.test(text);
  const hasIsoDate = /\b\d{4}-\d{2}-\d{2}\b/.test(text);
  const hasSlashDate = /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/.test(text);
  const hasDateHint = hasMonthName || hasIsoDate || hasSlashDate;
  const hasCheckinWord = text.includes('check-in') || text.includes('check in') || text.includes('llegada') || text.includes('entrada');
  const hasCheckoutWord = text.includes('check-out') || text.includes('check out') || text.includes('salida');

  // Nunca afirmar disponibilidad con una sola fecha suelta.
  // (Si el mensaje ya trae DOS fechas completas, dejar que Claude verifique con la herramienta.)
  if (asksAvailability && hasDateHint && !(hasCheckinWord && hasCheckoutWord) && extractDates(text).length < 2) {
    return '¡Con gusto te lo confirmo! ✅ Para validar *disponibilidad real en ese momento* necesito ambas fechas: *check-in y check-out*.\n\nCompártemelas junto con el número de huéspedes y te digo exactamente qué suites están libres. 📅🏡';
  }

  if (text.includes('nino de 5 anos') || text.includes('nina de 5 anos') || text.includes('como cuentan los ninos')) {
    return 'Los *menores de 6 años* no cuentan como huéspedes y su hospedaje es *gratis*. 🌿 En tu caso, el niño de 5 años no suma al precio, así que *cuentan solo 2 adultos*. ¿Qué fechas de *check-in y check-out* tienes en mente? 📅✨';
  }

  const asksAboutFood = text.includes('desayuno') || text.includes('buffet') || text.includes('comida') || text.includes('cena') || text.includes('cenas') || text.includes('restaurante') || text.includes('menu') || text.includes('platillo') || text.includes('desayunar') || text.includes('almuerzo');

  if (asksAboutFood && (text.includes('somos') || text.includes('personas'))) {
    const peopleCount = parseFirstInteger(text);
    if ((text.includes('desayuno') || text.includes('buffet')) && peopleCount && peopleCount >= 3 && peopleCount < 20) {
      return `El servicio grupal de desayunos (buffet) aplica a partir de *20 personas*. 🍽️ Pero pueden desayunar sin problema en nuestro restaurante con la carta individual 👇\n\n${buildCartaMessage()}`;
    }
    if ((text.includes('cena') || text.includes('cenas')) && peopleCount && peopleCount >= 30) {
      return 'Para grupos de *30 personas o más* tenemos cenas como *Antojitos Mexicanos*, *Tacos de Cecina*, *Enchiladas Suizas*, *Enchiladas Huastecas* y *Ensalada Verde con Pollo*. 🍽️ Incluye aguas frescas, café y pan dulce, y se requiere *50% de anticipo* para asegurar el servicio. 📌';
    }
  }

  // Preguntas sobre precios del restaurante (individuales o sin cantidad específica)
  // → siempre la carta individual; el buffet grupal (20+) lo maneja Claude con el prompt
  if (asksAboutFood && (text.includes('precio') || text.includes('cuanto') || text.includes('costo') || text.includes('tarifa') || text.includes('aproximado') || text.includes('cuestan'))) {
    return buildCartaMessage();
  }

  // Solicitud directa del menú/carta del restaurante (sin palabras de precio)
  if (text.includes('menu') || /\bcarta\b/.test(text) || ((text.includes('restaurante') || text.includes('platillo')) && (text.includes('tienen') || text.includes('hay') || text.includes('cual') || text.includes('que ')))) {
    return buildCartaMessage();
  }

  if (text.includes('otra pagina vi la habitacion mas barata') || text.includes('me respetas ese precio') || text.includes('mas barata')) {
    return 'El *precio oficial* es el del hotel y no podemos respetar tarifas de otras plataformas. 💰 Si quieres, te comunico con nuestro *equipo* para revisar cualquier duda. 🤝';
  }

  if ((text.includes('agregar') || text.includes('persona extra')) && text.includes('tour')) {
    return '¡Claro! 🌿 Para ajustar tours de una reserva existente, compárteme tu *folio* (WA-XXXXXXXX) y te ayudo con el *ajuste* de participantes y precio.';
  }

  const asksPrice = text.includes('precio') || text.includes('cuanto cuesta') || text.includes('costo') || text.includes('tarifa');
  const mentionsSpecificRoom = /(jungla|lindavista|lajas|flor de liz|lirios|orquideas|bromelias|helechos|suite)/.test(text);
  const isPostConfirmationChange = text.includes('reserva confirmada') || text.includes('agregar 1 huesped') || text.includes('agregar un huesped') || text.includes('cambia el precio');
  const isExternalPriceDispute = text.includes('mas barata') || text.includes('respetas ese precio') || text.includes('otra pagina');
  const asksAboutTourOrPackage = text.includes('tour') || text.includes('paquete') || text.includes('excursion');
  if (asksPrice && !mentionsSpecificRoom && !isPostConfirmationChange && !isExternalPriceDispute && !asksAboutFood && !asksAboutTourOrPackage) {
    return 'Nuestras tarifas por noche 🌿\n\n🏔️ *Con vista a las montañas + spa privado:*\n$1,900 MXN (2 personas) · $2,400 MXN (3–4 personas)\n· Piscina spa o tina de hidromasaje privada\n· Terrazas con vista panorámica a Xilitla y la selva\n· Suite Jungla · Flor de Liz 1 & 2 · LindaVista · Lajas\n\n🌿 *Con vista a los jardines:*\n$1,500 MXN (2 personas) · $1,900 MXN (3–4 personas)\n· Balcón privado · jardines tropicales · tranquilidad\n· Lirios 1 & 2 · Orquídeas · Bromelias\n\n👨‍👩‍👧‍👦 *Suites Familiares (hasta 6 personas):*\n$1,900 MXN (2p) · $2,400 MXN (3–4p) · $2,700 MXN (5p) · $3,000 MXN (6p)\n· Helechos 1 & 2\n\nTodo incluye WiFi, AC y acceso a la alberca. Estamos a *5 min del Jardín de Edward James* 📍\n\n¿Para qué fechas y cuántos serían? Te reviso disponibilidad ahora 📅';
  }

  if (text.includes('perrito') || text.includes('mascota') || text.includes('perro')) {
    return 'Las *mascotas no están permitidas* en el hotel. 🐾🌿 ¿Te ayudo a buscar la suite ideal para tu visita?';
  }

  // Solo responder con el horario si el cliente PREGUNTA por el check-in, no si está DANDO fechas
  const mentionsMonthInCheckin = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2})/i.test(userText);
  if (!mentionsMonthInCheckin && (text.includes('checkin') || text.includes('check in') || text.includes('hora de llegada') || text.includes('a que hora entro') || text.includes('a que hora es la entrada'))) {
    return 'Check-in: *3:00 PM* · Check-out: *12:00 PM* 📅\nLlegada anticipada sujeta a disponibilidad. ¿Tienes fechas en mente?';
  }

  // Cubre "desayuno incluido", "¿está incluido el desayuno?", "¿incluye desayuno?"
  if (text.includes('desayuno') && text.includes('inclu') && !text.includes('tour') && !text.includes('paquete')) {
    return 'El desayuno *no está incluido* en la tarifa de hospedaje. 🍳 Lo puedes tomar en nuestro restaurante *El Papán Huasteco* (8:00 AM – 8:00 PM) — aprox. $100–$200 MXN por persona. ¿Te ayudo con tu reserva?';
  }

  const politicaOtraCosa = text.includes('nino') || text.includes('mascota') || text.includes('perro') || text.includes('fumar');
  if (text.includes('cancelacion') || text.includes('cancelación') || text.includes('puedo cancelar') || (text.includes('politica') && !politicaOtraCosa)) {
    return '📋 *Política de cancelación:*\n· +7 días antes: reembolso del *100%*\n· 3–7 días antes: reembolso del *50%*\n· Menos de 3 días o no-show: *sin reembolso* — solo *cambio de fecha*\n\n¿Tienes alguna duda adicional? 🌿';
  }

  if (text.includes('wifi') || text.includes('internet')) {
    return 'Sí, todas las suites tienen *WiFi Starlink* de alta velocidad incluido. 📶✨';
  }

  if (text.includes('estacionamiento') || text.includes('estacionar') || text.includes('parking') || text.includes('puedo llegar en carro')) {
    return 'Sí, contamos con *estacionamiento privado y seguro* incluido sin costo. 🚗🌿 ¿Te ayudo con tu reserva?';
  }

  // Precio específico de una suite sin fechas — responder localmente
  const suiteKeywords = {
    'jungla': '*Suite Jungla* — $1,900/noche (2 personas) · $2,400/noche (3–4 personas)\n✦ Piscina privada · vistas a montañas · la más solicitada 🌿\n🔗 paraisoencantado.com/habitaciones/jungla',
    'lindavista': '*Suite LindaVista* — $1,900/noche (2 personas) · $2,400/noche (3–4 personas)\n✦ Tina de hidromasaje · vistas al bosque · terraza privada 🌺',
    'flor de liz': '*Suite Flor de Liz* — $1,900/noche (2 personas) · $2,400/noche (3–4 personas)\n✦ Piscina spa privada · vistas panorámicas ✨',
    'lajas': '*Suite Lajas* — $1,900/noche (2 personas) · $2,400/noche (3–4 personas)\n✦ Sala de estar · terraza panorámica · 2 baños 🏡',
    'helechos': '*Helechos Familiar* — $1,900/noche (2p) · $2,400/noche (3–4p) · $2,700/noche (5p) · $3,000/noche (6p)\n✦ Hasta 6 personas · múltiples camas · ideal para familias 👨‍👩‍👧‍👦',
    'lirios': '*Lirios* — $1,500/noche (2 personas) · $1,900/noche (3–4 personas)\n✦ Vistas al jardín · balcón privado · tranquilidad 🌿',
    'orquideas': '*Orquídeas 2 y 3* (cama King, solo 2 personas) — $1,500/noche\n*Orquídeas Doble* — $1,500/noche (2 personas) · $1,900/noche (3–4 personas)\n✦ Frente a la piscina · vista a la selva ✨',
    'bromelias': '*Bromelias* — $1,500/noche (2 personas) · $1,900/noche (3–4 personas)\n✦ Planta baja · acceso directo a piscina · fácil acceso 🏊',
  };
  if (asksPrice && !hasDateHint) {
    for (const [keyword, response] of Object.entries(suiteKeywords)) {
      if (text.includes(keyword)) {
        return `${response}\n\n¿Para cuántas personas y qué fechas tienes en mente? 📅`;
      }
    }
  }

  if (text.includes('que tours tienen') || text.includes('que tours manejan') || text.includes('tours tienen') || (text.includes('tours') && (text.includes('tienen') || text.includes('ofrecen') || text.includes('manejan')))) {
    return '🌊 Nuestros tours por la Huasteca:\n\n· *Expedición Tamul* — Sótano de las Huahuas + Cascada de Tamul — $1,450/persona\n· *Ruta Surrealista (Edward James)* — Jardín + Huichihuayán — $1,300/persona\n· *Cascadas del Meco* — Meco + Mirador + Salto — $1,600/persona\n· *Paraíso Escalonado* — Minas Viejas + Micos — $1,500/persona\n· *Ruta Acuática* — Puente de Dios + 7 Cascadas — $1,500/persona\n\n🔗 huasteca-potosina.com · ¿Te ayudo a reservar hospedaje primero? 🏡';
  }

  if ((text.includes('agregar 1 huesped') || text.includes('agregar un huesped') || text.includes('agregar huespedes') || text.includes('cambia el precio')) && text.includes('reserva confirmada')) {
    return 'Sí, *al aumentar huéspedes cambia la tarifa y el total*. 📌 Si pasas de 2 a *3–4 personas*, aplica la tarifa correspondiente a *3–4 personas*. Compárteme tu *folio* y revisamos el ajuste. 🧾';
  }

  // Detectar solicitudes de descripciones, comparaciones y fotos de habitaciones
  if (text.includes('describe') || text.includes('descripcion') || text.includes('como es') || text.includes('que tiene')) {
    const roomNames = ['flor de liz', 'lindavista', 'lajas', 'jungla', 'lirios', 'orquideas', 'helechos', 'bromelias'];
    if (roomNames.some(r => text.includes(r))) {
      const matched = ROOMS.find(r => normalizeText(r.name).includes(roomNames.find(rn => text.includes(rn))));
      if (matched) {
        return `*${matched.name}* 🌿\n"${matched.description}"\n\n📍 ${matched.highlights.join(' · ')}\n\n🏠 Incluye: ${matched.features.join(', ')}\n\n✨ Desde $${matched.price_2.toLocaleString('es-MX')} MXN/noche (2 personas)\n\n🔗 Ver fotos y detalles completos: ${matched.url}`;
      }
    }
  }

  // Solo disparar videos si el mensaje trata principalmente de eso
  // (evitar falsos positivos como "3. En YouTube" en formularios)
  const isNumberedListItem = /^\s*\d+[\.\)]\s/.test(userText); // ej: "3. En YouTube"
  const isShortVideoMention = text.length > 60 && !text.includes('video') && !text.includes('reel');
  if (!isNumberedListItem && !isShortVideoMention && !text.includes('videollamada') && !text.includes('video llamada') && (text.includes('video') || text.includes('videos') || (text.includes('youtube') && text.length < 80) || text.includes('reel') || text.includes('reels'))) {
    const videoLinks = [
      '🎬 *AMLO en Paraíso Encantado:* https://www.youtube.com/watch?v=Y8h8CuTNLcA&t=1s',
      '🌺 *Brenda Catalán en Xilitla:* https://www.youtube.com/watch?v=v2cc-49uYEU&t=15s',
      '✨ *Experiencia Paraíso Encantado:* https://www.youtube.com/watch?v=hD7LbX9Xoqw',
      '🏨 *Tour Paraíso Encantado:* https://www.youtube.com/watch?v=i3R_OBwoucw&t=1s',
      '🍽️ *Restaurante El Papán Huasteco:* https://www.youtube.com/watch?v=SrZ8ZtcacKc&t=1s',
    ];
    return `Aquí algunos videos del hotel 🎥\n\n${videoLinks.join('\n\n')}\n\n¿Alguna pregunta sobre las suites o fechas? 🌿`;
  }

  // "foto"/"imagen" NO debe secuestrar mensajes sobre comprobantes de pago
  const mentionsPaymentProof = text.includes('comprobante') || text.includes('transferencia') || text.includes('pago') || text.includes('deposito') || text.includes('ticket') || text.includes('recibo');
  if (!mentionsPaymentProof && (text.includes('fotos') || text.includes('foto') || text.includes('imagenes') || text.includes('imagen') || text.includes('ver fotos'))) {
    const roomNames = ['flor de liz', 'lindavista', 'lajas', 'jungla', 'lirios', 'orquideas', 'helechos', 'bromelias'];
    if (roomNames.some(r => text.includes(r))) {
      const matched = ROOMS.find(r => normalizeText(r.name).includes(roomNames.find(rn => text.includes(rn))));
      if (matched) {
        return `Aquí están las fotos y detalles completos de *${matched.name}*:\n🔗 ${matched.url}\n\n¿Alguna duda sobre la suite? 📸`;
      }
    }
    return `Puedes ver *todas nuestras suites* con fotos en:\n🔗 paraisoencantado.com/habitaciones\n\n¿Alguna en particular que te llame la atención? 🏠✨`;
  }

  if (text.includes('compara') || text.includes('cual es mejor') || text.includes('cual me recomiendas') || text.includes('diferencia entre')) {
    const roomNames = ['flor de liz', 'lindavista', 'lajas', 'jungla', 'lirios', 'orquideas', 'helechos', 'bromelias'];
    const found = roomNames.filter(r => text.includes(r));
    if (found.length >= 2) {
      const rooms = found.map(name => ROOMS.find(r => normalizeText(r.name).includes(name))).filter(Boolean);
      if (rooms.length >= 2) {
        const comparison = rooms.map(r => `*${r.name}* (${r.category})\n"${r.description}"\n💰 $${r.price_2.toLocaleString('es-MX')} (2 personas)${r.price_3_4 ? ` / $${r.price_3_4.toLocaleString('es-MX')} (3-4)` : ' · solo 2 personas'}\n✨ ${r.highlights.join(' · ')}\n🔗 ${r.url}`).join('\n\n');
        return `Aquí está la comparación:\n\n${comparison}\n\n¿Cuál te atrae más? ✨`;
      }
    }
  }

  return null;
}

function extractDates(text = '') {
  const out = [];
  const nowYear = new Date().getFullYear();
  const monthMap = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
  };

  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];
  for (const d of iso) out.push(d);

  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g) || [];
  for (const item of slash) {
    const m = item.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (!m) continue;
    const day = Number(m[1]);
    const month = Number(m[2]);
    let year = m[3] ? Number(m[3]) : nowYear;
    if (year < 100) year += 2000; // "26" → 2026, no año 26
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      out.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
  }

  const wordsRegex = /(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/g;
  let match;
  while ((match = wordsRegex.exec(text)) !== null) {
    const day = Number(match[1]);
    const month = monthMap[match[2]];
    const year = Number(match[3] || nowYear);
    if (day >= 1 && day <= 31 && month) {
      out.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
  }

  return [...new Set(out)].slice(0, 2);
}

function findLastCheckinInHistory(history = []) {
  const userMessages = [...history].reverse().filter(h => h?.role === 'user');
  for (const msg of userMessages) {
    const text = normalizeText(msg?.content || '');
    if (!(text.includes('check in') || text.includes('check-in') || text.includes('llegada') || text.includes('entrada'))) continue;
    const dates = extractDates(text);
    if (dates.length === 1) {
      return { date: dates[0], confirmed: false };
    }
  }
  return null;
}

function parseDateIntent(message, conversationHistory = []) {
  const cleaned = String(message || '')
    .replace(/^0+\s/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  const dates = extractDates(cleaned);

  if (dates.length === 2) {
    return {
      checkin: dates[0],
      checkout: dates[1],
      confidence: 'high'
    };
  }

  if (dates.length === 1) {
    const previousCheckin = findLastCheckinInHistory(conversationHistory);
    if (previousCheckin && !previousCheckin.confirmed) {
      return {
        checkin: previousCheckin.date,
        checkout: dates[0],
        confidence: 'medium',
        needsConfirmation: true
      };
    }
  }

  return null;
}

function formatDateEs(dateYmd = '') {
  const d = new Date(`${dateYmd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateYmd;
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City'
  });
}

function parseMxPrice(value = '') {
  const n = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Compara ids/nombres de habitaci\u00f3n tolerando guiones y el prefijo "suite"
// (Claude a veces manda 'suite-jungla' aunque el id oficial sea 'jungla').
function roomKeyNorm(value = '') {
  return normalizeText(String(value).replace(/-/g, ' ')).replace(/^suite\s+/, '').trim();
}

function getMexicoCityNowData() {
  const now = new Date();
  const tz = 'America/Mexico_City';
  const date = now.toLocaleDateString('sv-SE', { timeZone: tz }); // YYYY-MM-DD
  const time24 = now.toLocaleTimeString('es-MX', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const pretty = now.toLocaleString('es-MX', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return {
    timezone: tz,
    date,
    time_24h: time24,
    datetime_pretty_es_mx: pretty,
    iso: now.toISOString()
  };
}

// Fecha de hoy del hotel (America/Mexico_City) como 'YYYY-MM-DD'.
function mxTodayISO() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Mexico_City' });
}

// Calendario de los próximos N días (zona MX) con día de semana + fecha ISO.
// El modelo es malo calculando "este viernes" a partir de solo la fecha de hoy;
// con la tabla ya resuelta, traducir fechas relativas es una consulta, no aritmética.
function buildUpcomingCalendarLine(days = 14) {
  const tz = 'America/Mexico_City';
  const parts = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const iso = d.toLocaleDateString('sv-SE', { timeZone: tz });
    const wd = d.toLocaleDateString('es-MX', { weekday: 'long', timeZone: tz });
    parts.push(`${wd} = ${iso}${i === 0 ? ' (HOY)' : ''}`);
  }
  return parts.join(' · ');
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Si el cliente da un año ya pasado (típico typo: pide "julio 2025" en 2026), la
// hoja no tiene esas filas y TODO saldría "disponible" (falso). Reencuadramos las
// fechas al próximo año válido conservando la duración de la estancia, y marcamos
// `corrected` para que el bot le confirme al cliente las fechas exactas que cotiza.
export function rollDatesForwardIfPast(checkin, checkout) {
  if (!ISO_DATE_RE.test(String(checkin || '')) || !ISO_DATE_RE.test(String(checkout || ''))) {
    return { checkin, checkout, corrected: false, valid: false };
  }
  const today = mxTodayISO();
  const nights = Math.round(
    (new Date(`${checkout}T12:00:00`) - new Date(`${checkin}T12:00:00`)) / 86400000
  );
  if (nights <= 0) return { checkin, checkout, corrected: false, valid: false };
  if (checkin >= today) return { checkin, checkout, corrected: false, valid: true };

  const [, m, d] = checkin.split('-').map(Number);
  const todayYear = Number(today.slice(0, 4));
  let year = Number(checkin.slice(0, 4));
  const build = (y) => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  while (build(year) < today && year <= todayYear + 2) year++;

  const ci = build(year);
  const co = new Date(`${ci}T12:00:00`);
  co.setDate(co.getDate() + nights);
  const coISO = co.toISOString().slice(0, 10);
  return { checkin: ci, checkout: coISO, corrected: ci !== checkin, valid: ci >= today };
}

function sanitizeHistoryForAnthropic(history = []) {
  const cleaned = [];

  for (const item of history) {
    const role = item?.role;
    if (role !== 'user' && role !== 'assistant') continue;

    const content = typeof item?.content === 'string'
      ? item.content.trim()
      : String(item?.content || '').trim();

    if (!content) continue;
    cleaned.push({ role, content });
  }

  // Anthropic funciona mejor cuando la secuencia inicia con user.
  while (cleaned.length > 0 && cleaned[0].role !== 'user') cleaned.shift();

  return cleaned;
}

export function sanitizeMessagesPayload(messages = []) {
  const cleaned = [];

  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;

    // Caso texto simple
    if (typeof m.content === 'string') {
      const text = m.content.trim();
      if (!text) continue;
      cleaned.push({ role: m.role, content: text });
      continue;
    }

    // Caso bloques (tool_use/tool_result)
    if (Array.isArray(m.content)) {
      if (m.content.length === 0) continue;
      cleaned.push({ role: m.role, content: m.content });
    }
  }

  // Anthropic exige que los roles alternen (user/assistant). Tras una intervención
  // humana pueden quedar varios mensajes del mismo rol seguidos (p.ej. varios 'user').
  // Fusionamos los consecutivos del mismo rol cuando AMBOS son texto; si alguno trae
  // bloques (tool_use/tool_result) no se fusiona para no romper esos pares.
  const merged = [];
  for (const m of cleaned) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.role === m.role &&
      typeof last.content === 'string' &&
      typeof m.content === 'string'
    ) {
      last.content = `${last.content}\n${m.content}`;
    } else {
      merged.push({ ...m });
    }
  }

  // Anthropic EXIGE que el primer mensaje sea de 'user' ("first message must use the
  // 'user' role"). El recorte del historial por MAX_HISTORY (shift) puede dejar un
  // 'assistant' al frente → error 400 → el bot respondía "Tuve un problema técnico".
  // Esta es la ÚLTIMA compuerta antes de llamar a la API, así que aquí lo garantizamos.
  while (merged.length && merged[0].role !== 'user') merged.shift();

  return merged;
}

// ── Herramientas ──────────────────────────────────────────

const TOOLS = [
  {
    name: 'check_availability',
    description: 'Verifica disponibilidad de habitaciones para fechas específicas. Úsala SIEMPRE que el cliente mencione fechas o pregunte si una habitación específica está disponible, aunque ya hayas verificado antes en la misma conversación. La disponibilidad cambia en tiempo real.',
    input_schema: {
      type: 'object',
      properties: {
        checkin:  { type: 'string', description: 'Fecha de llegada YYYY-MM-DD' },
        checkout: { type: 'string', description: 'Fecha de salida YYYY-MM-DD' },
        guests:   { type: 'number', description: 'Número de huéspedes (para filtrar por capacidad y calcular propuesta por noche si no hay una sola suite todas las noches). Default 2.' },
        room_ids: { type: 'array', items: { type: 'string' }, description: 'IDs a verificar. Vacío = todas.' }
      },
      required: ['checkin', 'checkout']
    }
  },
  {
    name: 'get_price',
    description: 'Precio exacto de una habitación para fechas y número de huéspedes específicos.',
    input_schema: {
      type: 'object',
      properties: {
        room_id:  { type: 'string' },
        checkin:  { type: 'string', description: 'YYYY-MM-DD' },
        checkout: { type: 'string', description: 'YYYY-MM-DD' },
        guests:   { type: 'number', description: 'Número de huéspedes (default 2)' }
      },
      required: ['room_id', 'checkin', 'checkout']
    }
  },
  {
    name: 'get_current_time',
    description: 'Devuelve la fecha y hora actual del hotel en la zona horaria America/Mexico_City. Úsala cuando el cliente pregunte la hora, hoy, mañana, o para validar horarios de atención.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'lookup_reservation',
    description: 'Consulta una reserva existente en Google Sheets. Úsala cuando el cliente ya tiene reserva y proporcionó un identificador: su FOLIO de WhatsApp (WA-XXXXXXXX), su NÚMERO DE CONFIRMACIÓN de la página (PE-XXXXXXXX) o el NOMBRE de la reservación (ej. Manolo Covarrubias). Pasa "folio" si dio un folio o confirmación (WA- o PE-), o "name" si solo dio un nombre. Nunca la llames sin que el cliente haya dado alguno de estos datos.',
    input_schema: {
      type: 'object',
      properties: {
        folio: { type: 'string', description: 'Folio de WhatsApp (WA-...) o número de confirmación de la página (PE-...) que dio el cliente' },
        name:  { type: 'string', description: 'Nombre completo de la reservación, cuando el cliente no tiene su folio a la mano (ej. "Manolo Covarrubias")' }
      }
    }
  },
  {
    name: 'get_guest_notes',
    description: 'Consulta las notas internas del staff sobre un huésped por número de teléfono o email. Úsala cuando el cliente ya se identificó para personalizar la atención. Las notas pueden incluir preferencias, restricciones especiales, VIP status, etc.',
    input_schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Número de teléfono del huésped (sin espacios ni guiones)' },
        email: { type: 'string', description: 'Email del huésped (opcional, si se conoce)' }
      },
      required: ['phone']
    }
  },
  {
    name: 'create_reservation_quote',
    description: 'Genera UNA sola cotización con UN solo folio para toda la reserva (hospedaje + tours, o solo hospedaje). SIEMPRE llama esta herramienta UNA sola vez por reserva; incluye todas las habitaciones en "rooms" y todos los tours en "tours". No usar cuando el cliente elija Opción 2 (motor de reservas).',
    input_schema: {
      type: 'object',
      properties: {
        guest_name:  { type: 'string', description: 'Nombre completo del huésped principal' },
        guest_email: { type: 'string', description: 'Correo del huésped (OPCIONAL — NO lo pidas; omítelo si el cliente no lo da espontáneamente)' },
        how_found:   { type: 'string', description: '¿Cómo nos encontraste? Opciones: Google, Página web, Recomendación, Redes' },
        checkin:     { type: 'string', description: 'YYYY-MM-DD' },
        checkout:    { type: 'string', description: 'YYYY-MM-DD' },
        nights:      { type: 'number', description: 'Número de noches' },
        rooms: {
          type: 'array',
          description: 'Lista de habitaciones a reservar (una o más). NUNCA llames esta herramienta varias veces para la misma reserva. Para estancia con CAMBIO DE SUITE (split-stay), incluye cada suite con SUS propias fechas checkin/checkout (las noches que le tocan); usa exactamente los segmentos que devolvió split_stay.',
          items: {
            type: 'object',
            properties: {
              room_id:   { type: 'string', description: 'ID de la habitación' },
              room_name: { type: 'string', description: 'Nombre de la habitación' },
              guests:    { type: 'number', description: 'Huéspedes en esta habitación' },
              price:     { type: 'number', description: 'Precio total de esta habitación (noches × tarifa oficial)' },
              checkin:   { type: 'string', description: 'YYYY-MM-DD — SOLO para split-stay: noche de entrada a ESTA suite. Omitir si toda la reserva usa el mismo rango.' },
              checkout:  { type: 'string', description: 'YYYY-MM-DD — SOLO para split-stay: salida de ESTA suite. Omitir si toda la reserva usa el mismo rango.' }
            },
            required: ['room_id', 'room_name', 'guests', 'price']
          }
        },
        tours: {
          type: 'array',
          description: 'Lista de tours seleccionados por el huésped (cero, uno o varios).',
          items: {
            type: 'object',
            properties: {
              tour_id:      { type: 'string', description: 'ID del tour (preferido)' },
              tour_name:    { type: 'string', description: 'Nombre del tour (si no se envía id)' },
              participants: { type: 'number', description: 'Participantes del tour' },
              price:        { type: 'number', description: 'Precio total del tour (si no se puede inferir)' }
            },
            required: ['participants']
          }
        },
        total_price:    { type: 'number', description: 'Suma total global (habitaciones + tours) en MXN' },
        deposit_amount: { type: 'number', description: 'Anticipo (ej. 50% para 2+ noches). Omitir si es pago completo.' }
      },
      required: ['guest_name', 'how_found', 'rooms', 'checkin', 'checkout', 'nights', 'total_price']
    }
  }
];

// ── Ejecutar herramienta ───────────────────────────────────

async function executeTool(toolName, toolInput, userId, userName) {
  console.log(`🔧 ${toolName}`, JSON.stringify(toolInput));

  try {
    if (toolName === 'check_availability') {
      const { checkin: rawCheckin, checkout: rawCheckout, room_ids, guests: guestsIn } = toolInput;
      // Si el cliente dio un año ya pasado (typo típico: pide "julio 2025" estando en
      // 2026), la hoja no tiene esas filas y TODO saldría "disponible" (falso positivo).
      // Reencuadramos al próximo año válido y avisamos para que el bot confirme fechas.
      const rolled = rollDatesForwardIfPast(rawCheckin, rawCheckout);
      const checkin = rolled.checkin;
      const checkout = rolled.checkout;
      const datesCorrected = rolled.corrected;
      // Guardar fechas CORREGIDAS (y huéspedes) en sesión para que no se pierdan al truncar el historial
      if (checkin && checkout) updateSession(userId, { checkin, checkout });
      if (guestsIn) updateSession(userId, { guests: Number(guestsIn) });
      const rooms = (room_ids?.length > 0) ? room_ids : ROOMS.map(r => r.id);
      const requestedRooms = ROOMS.filter(r => rooms.includes(r.id));
      if (requestedRooms.length === 0) {
        return { available: false, message: 'No se encontraron habitaciones válidas para verificar.' };
      }
      const unavailableNames = new Set();
      const hasGoogleConfig = Boolean(process.env.GOOGLE_SHEETS_CREDENTIALS || (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY));
      let sheetReadOk = false;
      let dispReadOk = false; // ¿se pudo leer la matriz Disponibilidad (única fuente de OTA)?
      let backendOk = false;  // ¿respondió el backend del sitio (que también ve OTA)?

      // 1) Verificar reservas directas en Google Sheets
      try {
        const sheetResult = await getUnavailableRoomsFromGoogleSheet({
          checkin,
          checkout,
          requestedRooms
        });
        sheetReadOk = true;
        dispReadOk = sheetResult.dispReadOk !== false;
        for (const room of sheetResult.unavailableRooms) {
          unavailableNames.add(room.backendName);
        }
      } catch (sheetErr) {
        console.warn('⚠️ No se pudo leer Google Sheets:', sheetErr.message);
        if (hasGoogleConfig) {
          return {
            available: false,
            message: 'No pude verificar disponibilidad en tiempo real en este momento. Intenta nuevamente en un minuto o pide apoyo del equipo humano.',
            error: 'google_sheets_unavailable'
          };
        }
      }

      // 2) Complementar con backend para bloqueos temporales / consistencia operativa
      try {
        const roomsToCheck = requestedRooms.map(r => r.backendName);
        const res = await fetch(`${BOOKING_API}/api/check-availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkin, checkout, rooms: roomsToCheck })
        });
        const data = await res.json();
        backendOk = res.ok;
        for (const backendRoom of (data.unavailableRooms || [])) {
          unavailableNames.add(backendRoom);
        }
      } catch (backendErr) {
        console.warn('⚠️ No se pudo consultar backend de disponibilidad:', backendErr.message);
      }

      // 3) Complementar con reservas WhatsApp confirmadas localmente (estado RESERVADO)
      try {
        const locallyReserved = getLocallyReservedBackendNames({
          checkin,
          checkout,
          requestedRooms
        });
        for (const backendRoom of locallyReserved) {
          unavailableNames.add(backendRoom);
        }
      } catch (localErr) {
        console.warn('⚠️ No se pudo cargar reservas locales confirmadas:', localErr.message);
      }

      // Si hay configuración de Google y no se pudo leer, nunca afirmar disponibilidad
      if (hasGoogleConfig && !sheetReadOk) {
        return {
          available: false,
          message: 'No pude verificar disponibilidad en tiempo real en este momento. Intenta nuevamente en un minuto o pide apoyo del equipo humano.',
          error: 'google_sheets_unavailable'
        };
      }

      // Los bloqueos de OTA (Expedia/Booking) viven SOLO en la matriz Disponibilidad.
      // Si ni la lectura directa de esa matriz NI el backend del sitio la pudieron
      // verificar, quedamos ciegos a OTA → nunca afirmar disponibilidad (fail-closed).
      if (hasGoogleConfig && !dispReadOk && !backendOk) {
        return {
          available: false,
          message: 'No pude verificar disponibilidad en tiempo real en este momento (bloqueos de OTA no confirmados). Intenta nuevamente en un minuto o pide apoyo del equipo humano.',
          error: 'ota_source_unavailable'
        };
      }

      const available = requestedRooms.filter(r => !unavailableNames.has(r.backendName));

      if (available.length > 0) {
        return {
          available: true,
          // Si corregimos un año pasado, el bot DEBE confirmarle al cliente estas fechas.
          ...(datesCorrected ? { dates_corrected: true, checkin, checkout } : {}),
          available_rooms: available.map(r => ({
            id: r.id, name: r.name, category: r.category,
            url: r.url,
            price_2: r.price_2, price_3_4: r.price_3_4,
            max_occupancy: r.max_occupancy,
            highlights: r.highlights
          }))
        };
      }

      const unavailableRooms = requestedRooms
        .filter(r => unavailableNames.has(r.backendName))
        .map(r => ({ id: r.id, name: r.name, category: r.category, url: r.url }));

      // Ninguna suite libre para TODO el rango. Antes de descartar, intentar cubrir la
      // estancia completa con cambio(s) de suite (split-stay). Solo aplica si son 2+ noches.
      const sessionForSplit = getSession(userId);
      const guestsForSplit = Number(guestsIn || sessionForSplit.guests || 2);
      const spanNights = (checkin && checkout)
        ? Math.round((new Date(`${checkout}T12:00:00`) - new Date(`${checkin}T12:00:00`)) / 86400000)
        : 0;

      let splitStay = null;
      if (spanNights >= 2 && spanNights <= 21) {
        try {
          const proposal = await computeSplitStayProposal({
            checkin, checkout, guests: guestsForSplit, allRooms: ROOMS
          });
          // Solo ofrecer si es factible y realmente implica cambio(s) de suite (>=1).
          if (proposal?.feasible && proposal.segments?.length > 1) {
            splitStay = proposal;
          }
        } catch (splitErr) {
          console.warn('⚠️ No se pudo calcular propuesta split-stay:', splitErr.message);
        }
      }

      const alternatives = await findAlternativeDates(checkin, checkout, requestedRooms, 5).catch(() => ({ alternatives: [] }));

      return {
        available: false,
        ...(datesCorrected ? { dates_corrected: true, checkin, checkout } : {}),
        message: splitStay
          ? 'No hay una sola suite libre todas las noches, pero la estancia SÍ se puede cubrir con cambio de suite (ver split_stay).'
          : 'No hay disponibilidad para las fechas solicitadas.',
        unavailable_rooms: unavailableRooms,
        ...(splitStay ? { split_stay: splitStay } : {}),
        alternative_dates: alternatives?.alternatives || []
      };
    }

    if (toolName === 'get_guest_notes') {
      const { phone } = toolInput;
      try {
        const cleanPhone = String(phone || '').replace(/\D/g, '');
        const res = await fetch(`${BOOKING_API}/api/admin/guest-notes?phone=${encodeURIComponent(cleanPhone)}`, {
          headers: adminHeaders(),
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          const data = await res.json();
          return { found: data.found, notas: data.notas || '', nombre: data.nombre || '' };
        }
      } catch { /* si no hay conexión, continuar sin notas */ }
      return { found: false, notas: '' };
    }

    if (toolName === 'get_price') {
      const { room_id, checkin, checkout, guests = 2 } = toolInput;
      const room = ROOMS.find(r => r.id === room_id || roomKeyNorm(r.id) === roomKeyNorm(room_id) || roomKeyNorm(r.name) === roomKeyNorm(room_id));
      if (!room) {
        return {
          error: 'room_not_found',
          message: `No existe ninguna habitación "${room_id}". No inventes el precio: usa uno de estos IDs oficiales y vuelve a consultar.`,
          valid_room_ids: ROOMS.map(r => r.id)
        };
      }
      const g = Number(guests);
      if (g > room.max_occupancy) {
        return {
          error: 'exceeds_capacity',
          message: `${room.name} admite máximo ${room.max_occupancy} personas (consultaste ${g}). Ofrece otra habitación o divide al grupo en más habitaciones.`
        };
      }
      const pricePerNight = getRoomPricePerNight(room, g);
      const nights = checkin && checkout
        ? Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000))
        : 1;
      return {
        room_name: room?.name || room_id,
        checkin, checkout, guests,
        price_per_night: pricePerNight,
        total_price: pricePerNight * nights,
        nights
      };
    }

    if (toolName === 'get_current_time') {
      return getMexicoCityNowData();
    }

    if (toolName === 'lookup_reservation') {
      const { folio, name } = toolInput;
      const hasFolio = folio && String(folio).trim();
      const hasName = name && String(name).trim();

      // 1) Por folio / número de confirmación (WA-... o PE-... viven en la misma columna)
      if (hasFolio) {
        const sheetResult = await getReservationByFolioFromSheet(folio);
        if (sheetResult.found) return sheetResult;
        // Respaldo: si dio también nombre, intentar por nombre
        if (hasName) {
          const byName = await getReservationsByNameFromSheet(name);
          if (byName.found) return { by: 'name', ...byName };
        }
        return {
          found: false,
          folio,
          message: 'No encontré ninguna reserva con ese folio o número de confirmación. Verifica que sea correcto (WA-XXXXXXXX o PE-XXXXXXXX), o compárteme el nombre de la reservación.'
        };
      }

      // 2) Por nombre de la reservación
      if (hasName) {
        const byName = await getReservationsByNameFromSheet(name);
        if (byName.found) return { by: 'name', ...byName };
        return {
          found: false,
          name,
          message: `No encontré una reserva a nombre de "${name}". ¿Me confirmas el nombre tal como lo registraste al reservar, o me compartes tu folio (WA-XXXXXXXX) o número de confirmación de la página (PE-XXXXXXXX)?`
        };
      }

      return {
        found: false,
        message: 'Para buscar tu reserva necesito uno de estos datos: tu folio de WhatsApp (WA-XXXXXXXX), tu número de confirmación de la página (PE-XXXXXXXX) o el nombre de la reservación.'
      };
    }

    if (toolName === 'create_reservation_quote') {
      // Recuperar fechas de la sesión si Claude no las incluyó bien
      const session = getSession(userId);
      const {
        guest_name,
        guest_email,
        how_found,
        rooms: inputRooms,
        tours: inputTours,
        checkin: rawCheckin,
        checkout: rawCheckout,
        nights,
        deposit_amount
      } = toolInput;

      // Usar fechas de la sesión si las de Claude no coinciden con lo que el cliente dijo
      const checkin = (session.checkin && rawCheckin !== session.checkin) ? session.checkin : rawCheckin;
      const checkout = (session.checkout && rawCheckout !== session.checkout) ? session.checkout : rawCheckout;

      // Noches SIEMPRE recalculadas de las fechas finales — el precio debe corresponder
      // a las fechas que quedan guardadas, no al número de noches que diga Claude.
      const nightsFromDates = (checkin && checkout)
        ? Math.round((new Date(`${checkout}T12:00:00`) - new Date(`${checkin}T12:00:00`)) / 86400000)
        : null;
      const nightsFinal = (Number.isFinite(nightsFromDates) && nightsFromDates > 0)
        ? nightsFromDates
        : Math.max(1, Number(nights || 1));

      // Guardar datos del huésped en sesión (incluyendo folio cuando se cree)
      updateSession(userId, {
        checkin, checkout,
        guestName: guest_name,
        guestEmail: guest_email,
      });

      const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
      // Normalizar rooms: mapear IDs a datos de ROOMS y calcular precio oficial.
      // Soporta fechas por habitación (split-stay): si la habitación trae su propio
      // checkin/checkout válido, se usa; si no, hereda el rango global de la reserva.
      const resolvedRooms = (inputRooms || []).map(r => {
        // Buscar por id exacto o por nombre normalizado (ej: 'suite-jungla' → 'jungla')
        const known = ROOMS.find(k =>
          k.id === r.room_id ||
          roomKeyNorm(k.id) === roomKeyNorm(r.room_id || '') ||
          roomKeyNorm(k.name) === roomKeyNorm(r.room_id || '') ||
          roomKeyNorm(k.name) === roomKeyNorm(r.room_name || '') ||
          roomKeyNorm(k.id) === roomKeyNorm(r.room_name || '')
        );
        const g = Number(r.guests || 2);
        // Fechas por habitación (split-stay) o rango global de la reserva.
        const roomCheckin = isYmd(r.checkin) ? r.checkin : checkin;
        const roomCheckout = isYmd(r.checkout) ? r.checkout : checkout;
        const roomNightsFromDates = (isYmd(roomCheckin) && isYmd(roomCheckout))
          ? Math.round((new Date(`${roomCheckout}T12:00:00`) - new Date(`${roomCheckin}T12:00:00`)) / 86400000)
          : null;
        const nightsNum = (Number.isFinite(roomNightsFromDates) && roomNightsFromDates > 0)
          ? roomNightsFromDates
          : nightsFinal;
        const pricePerNight = known ? getRoomPricePerNight(known, g) : null;
        // Sanity check: precio máximo razonable por habitación por estancia = $99,999
        const rawPrice = pricePerNight ? pricePerNight * nightsNum : Number(r.price || 0);
        const officialPrice = rawPrice > 99999 ? (pricePerNight ? pricePerNight * nightsNum : rawPrice / 100) : rawPrice;
        return {
          id: r.room_id,
          name: known?.name || r.room_name,
          backendName: known?.backendName || r.room_name,
          guests: g,
          checkin: roomCheckin,
          checkout: roomCheckout,
          nights: nightsNum,
          price: officialPrice
        };
      });

      const resolvedTours = (inputTours || []).map(t => {
        const normalizedTourName = normalizeText(t.tour_name || '');
        const knownTour = TOURS.find(k =>
          (t.tour_id && k.id === t.tour_id) ||
          (normalizedTourName && normalizeText(k.name) === normalizedTourName)
        );

        const participants = Math.max(1, Number(t.participants || 1));
        const officialPerPerson = knownTour ? parseMxPrice(knownTour.price) : 0;
        const officialTotal = officialPerPerson > 0 ? officialPerPerson * participants : Number(t.price || 0);

        return {
          id: knownTour?.id || t.tour_id || normalizedTourName || 'tour-manual',
          name: knownTour?.name || t.tour_name || 'Tour',
          url: knownTour?.url || null,
          participants,
          price: officialTotal
        };
      });

      const roomsTotal = resolvedRooms.reduce((sum, r) => sum + r.price, 0);
      const toursTotal = resolvedTours.reduce((sum, t) => sum + t.price, 0);
      const officialTotal = roomsTotal + toursTotal;

      // Anticipo — SIEMPRE calculado por regla fija del hotel; NUNCA se confía en el
      // número crudo del modelo (evita errores de dinero como cobrar $2,400 en vez de
      // $3,000 en una reserva de $6,000). El modelo solo señala la INTENCIÓN:
      //   · Grupo (8+ habitaciones): anticipo fijo de $5,000 MXN para apartar.
      //   · 1 noche: siempre 100% del total.
      //   · 2+ noches: 100% si el cliente paga completo (deposit_amount omitido, según
      //     el contrato del schema: "Omitir si es pago completo"), o 50% si eligió
      //     anticipo (deposit_amount presente) — pero el MONTO lo fija la regla, no el modelo.
      const GROUP_MIN_ROOMS = 8;
      const GROUP_DEPOSIT = 5000;
      let depositFinal;
      if (resolvedRooms.length >= GROUP_MIN_ROOMS) {
        depositFinal = GROUP_DEPOSIT;                       // grupo = $5,000 fijo
      } else if (nightsFinal < 2) {
        depositFinal = officialTotal;                       // 1 noche = 100%
      } else if (deposit_amount == null) {
        depositFinal = officialTotal;                       // omitido = pago completo
      } else {
        depositFinal = Math.round(officialTotal * 0.5);     // presente = anticipo 50% (recalculado)
      }
      depositFinal = Math.min(officialTotal, depositFinal); // nunca mayor al total

      const quote = createQuote({
        userId, userName,
        guestName: guest_name,
        guestEmail: guest_email,
        howFound: how_found,
        rooms: resolvedRooms,
        tours: resolvedTours,
        checkin, checkout, nights: nightsFinal,
        roomsTotal,
        toursTotal,
        totalPrice: officialTotal,
        depositAmount: depositFinal
      });

      updateSession(userId, { lastFolio: quote.folio });
      const sessionId = `wa-${quote.folio}`;
      const roomNamesForBackend = resolvedRooms.map(r => r.backendName);

      let temporaryBlock = {
        success: false,
        message: 'No se pudo crear bloqueo temporal en este momento.',
        rooms: roomNamesForBackend,
        checkin, checkout,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 180
      };

      // Backend: agrupar por rango de fechas (soporta split-stay: cada suite bloquea
      // solo SUS noches). En una reserva normal hay un solo grupo = rango global.
      const blockGroups = new Map(); // "checkin|checkout" -> [backendName]
      for (const r of resolvedRooms) {
        const key = `${r.checkin}|${r.checkout}`;
        if (!blockGroups.has(key)) blockGroups.set(key, []);
        blockGroups.get(key).push(r.backendName);
      }
      let backendBlockOk = false;
      for (const [key, names] of blockGroups) {
        const [ci, co] = key.split('|');
        try {
          const blockRes = await fetch(`${BOOKING_API}/api/create-temporary-block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkin: ci, checkout: co, rooms: names, sessionId })
          });
          const blockData = await blockRes.json();
          if (blockData?.success) backendBlockOk = true;
        } catch (blockErr) {
          console.warn('⚠️ No se pudo crear bloqueo temporal en backend:', blockErr.message);
        }
      }
      temporaryBlock = { ...temporaryBlock, success: backendBlockOk, message: backendBlockOk ? 'Bloqueo temporal procesado.' : temporaryBlock.message };

      // Registrar bloqueo de CADA habitación en pestaña Disponibilidad (con sus fechas)
      let sheetBlockOk = false;
      for (const r of resolvedRooms) {
        try {
          const dispResult = await appendTempBlockToSheet({ room: r, checkin: r.checkin, checkout: r.checkout, folio: quote.folio, sessionId });
          if (!dispResult.success) console.warn(`⚠️ Bloqueo Disponibilidad (${r.name}):`, dispResult.reason);
          else { sheetBlockOk = true; console.log(`🔒 Bloqueo temporal: ${r.name} (${r.checkin}→${r.checkout}) — ${quote.folio}`); }
        } catch (dispErr) {
          console.warn(`⚠️ Error bloqueo Disponibilidad (${r.name}):`, dispErr.message);
        }
      }

      // A1: si NINGÚN bloqueo (backend ni Sheets) quedó confirmado, no afirmar que la
      // suite está apartada — el equipo debe validar disponibilidad antes de aceptar pago.
      const blockConfirmed = Boolean(temporaryBlock.success) || sheetBlockOk;
      if (!blockConfirmed) {
        console.warn(`⚠️ Cotización ${quote.folio} SIN bloqueo confirmado — requiere validación manual.`);
      }

      // ── Integración con ecosistema admin ─────────────────
      // 1) Guardar cotización en Google Sheets (pestaña Cotizaciones)
      let adminCotizacionId = null;
      if (guest_email) {
        try {
          const suiteNames = resolvedRooms.map(r => r.name).join(', ');
          const cotRes = await fetch(`${BOOKING_API}/api/admin/cotizaciones`, {
            method: 'POST',
            headers: adminHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              cliente: guest_name,
              telefono: '',
              email: guest_email,
              suite: suiteNames,
              checkin,
              checkout,
              noches: nightsFinal,
              precioTotal: officialTotal,
              notas: `Cotización generada por WhatsApp · Folio WA: ${quote.folio}`,
            })
          });
          if (cotRes.ok) {
            const cotData = await cotRes.json();
            adminCotizacionId = cotData.id;
            console.log(`📋 Cotización guardada en admin: ${adminCotizacionId}`);

            // 2) Enviar email de cotización
            const emailRes = await fetch(`${BOOKING_API}/api/admin/cotizaciones/${adminCotizacionId}/send-email`, {
              method: 'POST',
              headers: adminHeaders({ 'Content-Type': 'application/json' })
            });
            if (emailRes.ok) {
              console.log(`📧 Email de cotización enviado a ${guest_email}`);
            } else {
              const emailErr = await emailRes.json().catch(() => ({}));
              console.warn(`⚠️ No se pudo enviar email de cotización:`, emailErr.error || emailRes.status);
            }
          } else {
            const errData = await cotRes.json().catch(() => ({}));
            console.warn(`⚠️ No se pudo guardar cotización en admin:`, errData.error || cotRes.status);
          }
        } catch (ecoErr) {
          console.warn(`⚠️ Error integrando con ecosistema admin:`, ecoErr.message);
        }
      }

      return {
        ...quote,
        rooms: resolvedRooms,
        tours: resolvedTours,
        // Sin bloqueo confirmado NO entregar expiración/duración — Claude no debe
        // decirle al cliente "queda bloqueada 3 horas" si el bloqueo falló.
        temporaryBlock: blockConfirmed
          ? temporaryBlock
          : { ...temporaryBlock, success: false, expiresAt: null, durationMinutes: 0 },
        blockConfirmed,
        ...(blockConfirmed ? {} : {
          block_warning: 'No se pudo asegurar el bloqueo de la(s) suite(s). Aún no confirmes disponibilidad como garantizada: pide al cliente que espere validación del equipo antes de pagar.'
        }),
        emailSent: Boolean(adminCotizacionId && guest_email)
      };
    }

  } catch (err) {
    console.error(`❌ Error en ${toolName}:`, err.message);
    return { error: err.message };
  }
}

// ── Manejar mensaje de texto ───────────────────────────────

export async function handleMessage(userId, userText, userName = '') {
  // Verificar si el bot está activo
  const enabled = await isBotEnabled();
  if (!enabled) {
    console.log(`🔴 Bot pausado — mensaje de ${userName || userId} ignorado`);
    return null; // null = no responder
  }

  if (!conversations.has(userId)) conversations.set(userId, []);
  const history = conversations.get(userId);
  const session = getSession(userId); // debe ir antes de getDeterministicResponse

  // Transparencia: en el PRIMER mensaje del bot en la conversación, aclarar que es
  // un asistente virtual. Si el bot ya respondió antes (hay 'assistant' en el
  // historial), no se repite.
  const botHasReplied = history.some(m => m.role === 'assistant');
  const VIRTUAL_ASSISTANT_DISCLOSURE = '🤖 _Soy *Camila*, la asistente virtual del Hotel Paraíso Encantado. Con gusto te ayudo; si en cualquier momento prefieres hablar con una persona del equipo, solo dímelo._';
  const withDisclosure = (text) =>
    (botHasReplied || !text) ? text : `${VIRTUAL_ASSISTANT_DISCLOSURE}\n\n${text}`;

  const incomingText = typeof userText === 'string' ? userText.trim() : String(userText || '').trim();
  if (!incomingText) {
    return {
      text: withDisclosure('¿Me compartes tu mensaje en texto para ayudarte mejor? 🌿'),
      requiresHumanIntervention: false, requiresTourNotification: false
    };
  }

  const parsedDates = parseDateIntent(incomingText, history);
  if (parsedDates?.confidence === 'medium' && parsedDates?.needsConfirmation) {
    const confirmationText = `Perfecto, déjame confirmar:\n📅 Llegada: *${formatDateEs(parsedDates.checkin)}*\n📅 Salida: *${formatDateEs(parsedDates.checkout)}*\n\n¿Correcto? ✅`;
    history.push({ role: 'user', content: incomingText });
    history.push({ role: 'assistant', content: confirmationText });
    while (history.length > MAX_HISTORY) history.shift();
    return { text: withDisclosure(confirmationText), requiresHumanIntervention: false, requiresTourNotification: false };
  }

  const deterministicResponse = getDeterministicResponse(incomingText, session);
  if (deterministicResponse) {
    history.push({ role: 'user', content: incomingText });
    history.push({ role: 'assistant', content: deterministicResponse });
    while (history.length > MAX_HISTORY) history.shift();
    console.log(`💬 [${userName || userId}]: ${incomingText}`);
    console.log(`🤖 → ${deterministicResponse.slice(0, 100)}...`);
    return {
      text: withDisclosure(deterministicResponse),
      requiresHumanIntervention: needsHumanIntervention(incomingText, deterministicResponse), requiresTourNotification: wantsTourBooking(incomingText, deterministicResponse)
    };
  }

  history.push({ role: 'user', content: incomingText });

  const sanitizedHistory = sanitizeHistoryForAnthropic(history);
  conversations.set(userId, sanitizedHistory);

  const effectiveHistory = conversations.get(userId);
  while (effectiveHistory.length > MAX_HISTORY) effectiveHistory.shift();

  console.log(`💬 [${userName || userId}]: ${incomingText}`);

  const messages = [...effectiveHistory];

  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Mexico_City'
  });
  const sessionLines = [];
  if (session.checkin && session.checkout) {
    sessionLines.push(`⚠️ FECHAS CONFIRMADAS DEL HUÉSPED (usa ESTAS, no inventes otras): check-in ${session.checkin}, check-out ${session.checkout}.`);
    sessionLines.push(`URL del motor de reservas con fechas del huésped (usa SIEMPRE esta URL cuando el cliente quiera reservar en línea): https://paraisoencantado.com/reservar?checkin=${session.checkin}&checkout=${session.checkout}`);
  }
  if (session.guestName) sessionLines.push(`Nombre del huésped: ${session.guestName}.`);
  if (session.guestEmail) sessionLines.push(`Email del huésped: ${session.guestEmail}.`);
  const dynamicContext = `Hoy es ${hoy} (${mxTodayISO()}). Usa esta fecha como referencia para calcular disponibilidad, cancelaciones y plazos.
📅 CALENDARIO PRÓXIMOS 14 DÍAS (día de semana = fecha exacta): ${buildUpcomingCalendarLine()}
⚠️ FECHAS RELATIVAS: cuando el cliente diga "hoy", "mañana", "este viernes", "el próximo sábado", etc., NO calcules el día tú: búscalo en el calendario de arriba y usa esa fecha exacta. Al confirmar o cotizar menciona SIEMPRE día de semana + número + mes (p. ej. "viernes 24 de julio") y verifica que coincidan con el calendario.
⚠️ FECHAS: nunca cotices ni afirmes disponibilidad para fechas en el pasado. Si el cliente da un año que ya pasó (p. ej. pide "julio 2025" estando en un año posterior), es casi siempre un error de dedo: interprétalo como la próxima ocurrencia de esa fecha (el año en curso o el siguiente) y CONFIRMA con el cliente las fechas exactas antes de avanzar. Si check_availability devuelve \`dates_corrected: true\`, dile explícitamente al cliente las fechas corregidas (check-in y check-out) que estás cotizando.${userName ? `\nEl huésped se llama *${userName}*.` : ''}${sessionLines.length ? '\n' + sessionLines.join('\n') : ''}`;

  // El prompt estático se cachea (bloque 1); la fecha/nombre cambian pero son pequeños (bloque 2).
  const systemBlocks = [
    { type: 'text', text: HOTEL_SYSTEM_PROMPT(), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicContext }
  ];

  // Cachear también las definiciones de herramientas (son fijas entre llamadas).
  const cachedTools = [
    ...TOOLS.slice(0, -1),
    { ...TOOLS[TOOLS.length - 1], cache_control: { type: 'ephemeral' } }
  ];

  // Tope de iteraciones de tools para que un encadenamiento de herramientas
  // (o un stop_reason inesperado) nunca produzca un bucle infinito de llamadas a la API.
  const MAX_TOOL_ITERATIONS = 6;
  let iterations = 0;

  // Señal REAL de cotización: solo se marca cuando se ejecuta create_reservation_quote
  // y devuelve un folio nuevo. Evita falsos positivos por folios repetidos en el texto
  // (confirmaciones, "mi folio es WA-...", etc.).
  let createdQuote = null;

  while (true) {
    iterations++;
    const safeMessages = sanitizeMessagesPayload(messages);
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000, // subido de 1500: cotizaciones con varias suites/tours y el split-stay generan JSON de herramienta grande y se truncaban → respuesta vacía → "Hubo un problema temporal". El costo solo aplica a lo que realmente genera.
      system: systemBlocks,
      tools: cachedTools,
      messages: safeMessages
    });

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
      if (toolUseBlocks.length === 0) {
        // Claude respondió stop_reason=tool_use sin bloques — puede ocurrir en reservas complejas.
        // Extraer cualquier texto parcial y devolverlo en lugar de un error genérico.
        const partialText = response.content.find(b => b.type === 'text')?.text?.trim();
        if (partialText) {
          console.warn('⚠️ Claude: tool_use sin bloques; usando texto parcial como respuesta.');
          effectiveHistory.push({ role: 'assistant', content: partialText });
          return { text: withDisclosure(partialText), requiresHumanIntervention: needsHumanIntervention(userText, partialText), requiresTourNotification: wantsTourBooking(userText, partialText), quoteCreated: Boolean(createdQuote), quoteFolio: createdQuote?.folio || null };
        }
        console.warn('⚠️ Claude devolvió stop_reason=tool_use pero sin bloques tool_use; se omite ese turno.');
        const fallback = 'Hubo un problema temporal al procesar tu solicitud. ¿Me lo repites por favor? 🌿';
        effectiveHistory.push({ role: 'assistant', content: fallback });
        return { text: withDisclosure(fallback), requiresHumanIntervention: false, requiresTourNotification: false, quoteCreated: Boolean(createdQuote), quoteFolio: createdQuote?.folio || null };
      }
      messages.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const tb of toolUseBlocks) {
        const result = await executeTool(tb.name, tb.input, userId, userName);
        // Registrar cotización realmente creada (folio nuevo, sin error).
        if (tb.name === 'create_reservation_quote' && result && !result.error && result.folio) {
          createdQuote = result;
        }
        toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify(result) });
      }
      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }

      // Salvaguarda anti-bucle: si se excede el tope de iteraciones, escalar a humano.
      if (iterations >= MAX_TOOL_ITERATIONS) {
        console.warn(`⚠️ Tope de iteraciones (${MAX_TOOL_ITERATIONS}) alcanzado; escalando a humano.`);
        const partial = response.content.find(b => b.type === 'text')?.text?.trim()
          || 'Déjame confirmar unos detalles con el equipo y te respondo en breve. 🌿';
        effectiveHistory.push({ role: 'assistant', content: partial });
        return { text: withDisclosure(partial), requiresHumanIntervention: true, requiresTourNotification: false, quoteCreated: Boolean(createdQuote), quoteFolio: createdQuote?.folio || null };
      }

      continue;
    }

    // end_turn — y CUALQUIER otro stop_reason (max_tokens, stop_sequence, refusal,
    // pause_turn): devolver el texto disponible y terminar. NUNCA repetir el request,
    // para evitar bucles infinitos y costo descontrolado de API.
    const text = response.content.find(b => b.type === 'text')?.text?.trim() || '';
    const finalText = text || 'Hubo un problema temporal al responder. ¿Me repites tu mensaje, por favor? 🌿';
    effectiveHistory.push({ role: 'assistant', content: finalText });
    if (response.stop_reason && response.stop_reason !== 'end_turn') {
      console.warn(`⚠️ stop_reason inesperado: ${response.stop_reason} — devolviendo texto disponible.`);
    }
    console.log(`🤖 → ${finalText.slice(0, 100)}...`);
    // Detector de cotización fantasma: la respuesta menciona un folio pero la
    // herramienta create_reservation_quote NUNCA corrió en esta interacción →
    // no hay bloqueo de habitación, ni registro, ni aviso al grupo. (Pasó el
    // 20 jul 2026: folio inventado WA-MC072026.)
    if (!createdQuote && /\bWA-[A-Z0-9]{4,}\b/i.test(finalText)) {
      const fake = finalText.match(/\bWA-[A-Z0-9]{4,}\b/i)?.[0];
      let known = null;
      try { known = getByFolio(fake); } catch { /* sin registro local */ }
      if (!known) {
        console.warn(`🚨 COTIZACIÓN FANTASMA: Camila mencionó el folio ${fake} SIN ejecutar create_reservation_quote (sin bloqueo, sin registro, sin aviso al grupo).`);
      }
    }
    return {
      text: withDisclosure(finalText),
      requiresHumanIntervention: needsHumanIntervention(userText, finalText),
      requiresTourNotification: wantsTourBooking(userText, finalText),
      quoteCreated: Boolean(createdQuote),
      quoteFolio: createdQuote?.folio || null
    };
  }
}

// ── Resumen de conversación para escalación humana ──────────

export function getConversationSummary(userId, maxMessages = 6) {
  const history = conversations.get(userId) || [];
  const recent = history.slice(-maxMessages);
  if (!recent.length) return '';
  return recent
    .filter(m => m.role && typeof m.content === 'string')
    .map(m => `${m.role === 'user' ? '👤' : '🤖'} ${String(m.content).slice(0, 120)}`)
    .join('\n');
}

// ── Manejar comprobante de pago (imagen) ───────────────────

export async function handlePaymentProof(userId, userName, caption = '') {
  // Buscar si este usuario tiene una reserva pendiente
  const pending = getByUser(userId);

  if (pending && pending.status === 'PENDIENTE_PAGO') {
    console.log(`💳 Comprobante recibido para folio ${pending.folio} de ${userName}`);
    
    const roomLines = (Array.isArray(pending.rooms) && pending.rooms.length > 0
      ? pending.rooms
      : (pending.room ? [pending.room] : [])
    ).map(r => `· ${r.name}${r.guests ? ` (${r.guests} huésped${Number(r.guests) === 1 ? '' : 'es'})` : ''}`)
      .join('\n');

    const tourLines = (Array.isArray(pending.tours) && pending.tours.length > 0)
      ? pending.tours.map(t => `· ${t.name} (${t.participants} persona${Number(t.participants) === 1 ? '' : 's'})`).join('\n')
      : '';

    const roomsSection = roomLines ? `🏨 *Hospedaje:*\n${roomLines}` : '';
    const toursSection = tourLines ? `\n\n🌊 *Tours:*\n${tourLines}` : '';

    const toursUpsell = !tourLines
      ? `\n\n🌊 *¿Quieres agregar un tour a tu estadía?*\n· Expedición Tamul — $1,450/persona\n· Ruta Surrealista (Edward James) — $1,300/persona\n· Cascadas del Meco — $1,600/persona\n· Paraíso Escalonado — $1,500/persona\n· Ruta Acuática — $1,500/persona\n\nRespóndeme "sí" con el nombre del tour y número de personas para agregarlo. 🏞️`
      : '';

    return {
      hasPendingReservation: true,
      reservation: pending,
      message: `✅ ¡Comprobante recibido!\n\n*Folio:* ${pending.folio}\n${roomsSection}${toursSection}\n\n📅 Check-in: ${pending.checkin}\n📅 Check-out: ${pending.checkout}\n💰 *Total: $${pending.totalPrice.toLocaleString('es-MX')} MXN*\n\nNuestro equipo verificará tu pago y te enviará la *confirmación final* en breve. ¡Te esperamos en el Paraíso Encantado! 🌿${toursUpsell}`
    };
  }

  return {
    hasPendingReservation: false,
    message: 'Gracias por tu imagen. Si tienes una reserva pendiente o alguna duda, escríbeme y con gusto te ayudo. 🏨'
  };
}

export function clearHistory(userId) { conversations.delete(userId); }

export function getStats() {
  return { active_conversations: conversations.size };
}

/**
 * Agrega un mensaje al historial sin disparar respuesta del bot.
 * Usado para rastrear mensajes durante intervención humana.
 */
export function addToHistory(userId, role, content) {
  if (!content?.trim()) return;
  if (!conversations.has(userId)) conversations.set(userId, []);
  const history = conversations.get(userId);
  history.push({ role, content: content.trim() });
  while (history.length > MAX_HISTORY) history.shift();
}
