/**
 * claude-handler.js
 * Claude AI con tools para disponibilidad, precios y reservas por WhatsApp.
 */

import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { HOTEL_SYSTEM_PROMPT, ROOMS, TOURS } from './hotel-knowledge.js';
import { createQuote, getByUser, getLocallyReservedBackendNames } from './reservations.js';
import { getUnavailableRoomsFromGoogleSheet, appendTempBlockToSheet, getReservationByFolioFromSheet, findAlternativeDates } from './google-sheets.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BOOKING_API = process.env.BOOKING_API_URL || 'https://booking-paraisoencantado.up.railway.app';

const conversations = new Map();
const MAX_HISTORY = 10;

const HUMAN_REQUEST_REGEX = /\b(humano|asesor|agente|recepcion|recepción|gerente|manager|ejecutivo)\b|hablar con (alguien|una persona)|quiero hablar con|human support|real person/i;
const ESCALATION_RESPONSE_REGEX = /te comunico con nuestro equipo|en breve te contactan|te contacta nuestro equipo|te atiende una persona/i;

function needsHumanIntervention(userText = '', assistantText = '') {
  return HUMAN_REQUEST_REGEX.test(userText) || ESCALATION_RESPONSE_REGEX.test(assistantText);
}

function parseFirstInteger(value = '') {
  const match = String(value).match(/\b(\d{1,3})\b/);
  return match ? Number(match[1]) : null;
}

function getDeterministicResponse(userText = '') {
  const text = normalizeText(userText);

  if (!text) return null;

  if (HUMAN_REQUEST_REGEX.test(userText)) {
    return 'Te comunico con nuestro equipo, en breve te contactan. 🤝📞';
  }

  if ((text.includes('detalles de mi reserva') || text.includes('datlles de mi reserva') || text.includes('mi reserva')) && !/wa-[a-z0-9]{4,}/i.test(userText)) {
    return 'Para mostrarte los detalles de tu reserva necesito tu *número de folio* — formato *WA-XXXXXXXX*. 🧾📌';
  }

  if ((text.includes('quiero reservar') || text.includes('reservar por whatsapp')) && !text.includes('check-in') && !text.includes('check out')) {
    return 'Tenemos *dos formas fáciles de reservar*: 📱 *Opción 1 — Por WhatsApp:* cotización + pago por SPEI u OXXO. 🏠 *Opción 2 — Motor en línea:* https://paraisoencantado.com/reservar (simple y rápido). ¿Me compartes tu *check-in y check-out* y cuántos huéspedes serían? 🌿📅';
  }

  const looksGroupFlow =
    text.includes('grupo') ||
    text.includes('somos ') ||
    text.includes('personas') ||
    text.includes('habitaciones');
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
  if (asksAvailability && hasDateHint && !(hasCheckinWord && hasCheckoutWord)) {
    return '¡Con gusto te lo confirmo! ✅ Para validar *disponibilidad real en ese momento* necesito ambas fechas: *check-in y check-out*.\n\nCompártemelas junto con el número de huéspedes y te digo exactamente qué suites están libres. 📅🏡';
  }

  if (text.includes('nino de 5 anos') || text.includes('nina de 5 anos') || text.includes('como cuentan los ninos')) {
    return 'Los *menores de 6 años* no cuentan como huéspedes y su hospedaje es *gratis*. 🌿 En tu caso, el niño de 5 años no suma al precio, así que *cuentan solo 2 adultos*. ¿Qué fechas de *check-in y check-out* tienes en mente? 📅✨';
  }

  if ((text.includes('desayuno') || text.includes('buffet')) && (text.includes('somos') || text.includes('personas'))) {
    const peopleCount = parseFirstInteger(text);
    if (peopleCount && peopleCount < 30) {
      return 'El servicio grupal de desayunos está pensado para *30 personas o más*. 🍽️ Si son menos, nuestro equipo puede revisar opciones especiales para ustedes. 🤝';
    }
  }

  if ((text.includes('cena') || text.includes('cenas')) && (text.includes('somos') || text.includes('personas'))) {
    const peopleCount = parseFirstInteger(text);
    if (peopleCount && peopleCount >= 30) {
      return 'Para grupos de *30 personas o más* tenemos cenas como *Antojitos Mexicanos*, *Tacos de Cecina*, *Enchiladas Suizas*, *Enchiladas Huastecas* y *Ensalada Verde con Pollo*. 🍽️ Incluye aguas frescas, café y pan dulce, y se requiere *50% de anticipo* para asegurar el servicio. 📌';
    }
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
  if (asksPrice && !mentionsSpecificRoom && !isPostConfirmationChange && !isExternalPriceDispute) {
    return 'Para cotizarte el precio exacto, necesito:\n\n📅 *Fechas* (check-in y check-out)\n🏠 *Tipo de suite* que te interesa:\n\n💎 *Suites Master* ($1,900/noche)\n· Jungla, LindaVista, Flor de Liz\n· Piscina/tina privada\n\n🌿 *Suites Plus* ($1,500/noche)\n· Lirios, Orquídeas, Bromelias\n· Balcón privado\n\n👨‍👩‍👧‍👦 *Suites Familiares* (desde $1,900/noche)\n· Helechos (hasta 6 personas)\n\n¿Cuál te interesa? 🤔';
  }

  if (text.includes('perrito') || text.includes('mascota') || text.includes('perro')) {
    return 'Las *mascotas no permitidas* forman parte de la política del hotel. 🐾🌿 Si quieres, te ayudo a encontrar la mejor opción de habitación para tu viaje.';
  }

  if (text.includes('que tours tienen') || text.includes('que tours manejan') || text.includes('tours tienen')) {
    return 'Tenemos tours increíbles por la Huasteca: *Expedición Tamul* — Destinos: Sótano de las Huahuas + Cascada de Tamul — https://www.huasteca-potosina.com/tours/expedicion-tamul. 🌿 *Ruta Surrealista* — Destinos: Jardín Edward James + Huichihuayán — https://www.huasteca-potosina.com/tours/ruta-surrealista-edward-james. ¿Cuál te interesa más? ✨';
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

  if (text.includes('fotos') || text.includes('foto') || text.includes('imagenes') || text.includes('imagen') || text.includes('ver fotos')) {
    const roomNames = ['flor de liz', 'lindavista', 'lajas', 'jungla', 'lirios', 'orquideas', 'helechos', 'bromelias'];
    if (roomNames.some(r => text.includes(r))) {
      const matched = ROOMS.find(r => normalizeText(r.name).includes(roomNames.find(rn => text.includes(rn))));
      if (matched) {
        return `Aquí están las fotos y detalles completos de *${matched.name}*:\n🔗 ${matched.url}\n\n✨ Verás las imágenes, descripción, características y disponibilidad. 📸`;
      }
    } else {
      return `Puedes ver *todas nuestras habitaciones* con fotos en:\n🔗 https://paraisoencantado.com/habitaciones\n\n¿Alguna en particular que te llame la atención? 🏠✨`;
    }
  }

  if (text.includes('compara') || text.includes('cual es mejor') || text.includes('cual me recomiendas') || text.includes('diferencia entre')) {
    const roomNames = ['flor de liz', 'lindavista', 'lajas', 'jungla', 'lirios', 'orquideas', 'helechos', 'bromelias'];
    const found = roomNames.filter(r => text.includes(r));
    if (found.length >= 2) {
      const rooms = found.map(name => ROOMS.find(r => normalizeText(r.name).includes(name))).filter(Boolean);
      if (rooms.length >= 2) {
        const comparison = rooms.map(r => `*${r.name}* (${r.category})\n"${r.description}"\n💰 $${r.price_2.toLocaleString('es-MX')} (2) / $${r.price_3_4.toLocaleString('es-MX')} (3-4)\n✨ ${r.highlights.join(' · ')}\n🔗 ${r.url}`).join('\n\n');
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
    const year = Number(m[3] || nowYear);
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

function sanitizeMessagesPayload(messages = []) {
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

  return cleaned;
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
    name: 'get_booked_dates',
    description: 'Fechas en que el hotel está completamente lleno.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_current_time',
    description: 'Devuelve la fecha y hora actual del hotel en la zona horaria America/Mexico_City. Úsala cuando el cliente pregunte la hora, hoy, mañana, o para validar horarios de atención.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'lookup_reservation',
    description: 'Consulta los detalles de una reserva existente en Google Sheets usando el folio. SOLO usar cuando el cliente haya proporcionado explícitamente su folio (formato WA-XXXXXXXX). Nunca llamar sin que el cliente haya dado el folio primero.',
    input_schema: {
      type: 'object',
      properties: {
        folio: { type: 'string', description: 'Folio de reserva proporcionado por el cliente (ej. WA-MN8M9X77)' }
      },
      required: ['folio']
    }
  },
  {
    name: 'create_reservation_quote',
    description: 'Genera UNA sola cotización con UN solo folio para toda la reserva (hospedaje + tours, o solo hospedaje). SIEMPRE llama esta herramienta UNA sola vez por reserva; incluye todas las habitaciones en "rooms" y todos los tours en "tours". No usar cuando el cliente elija Opción 2 (motor de reservas).',
    input_schema: {
      type: 'object',
      properties: {
        guest_name:  { type: 'string', description: 'Nombre completo del huésped principal' },
        guest_email: { type: 'string', description: 'Correo del huésped principal' },
        how_found:   { type: 'string', description: '¿Cómo nos encontraste? Opciones: Google, Página web, Recomendación, Redes' },
        checkin:     { type: 'string', description: 'YYYY-MM-DD' },
        checkout:    { type: 'string', description: 'YYYY-MM-DD' },
        nights:      { type: 'number', description: 'Número de noches' },
        rooms: {
          type: 'array',
          description: 'Lista de habitaciones a reservar (una o más). NUNCA llames esta herramienta varias veces para la misma reserva.',
          items: {
            type: 'object',
            properties: {
              room_id:   { type: 'string', description: 'ID de la habitación' },
              room_name: { type: 'string', description: 'Nombre de la habitación' },
              guests:    { type: 'number', description: 'Huéspedes en esta habitación' },
              price:     { type: 'number', description: 'Precio total de esta habitación (noches × tarifa oficial)' }
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
      required: ['guest_name', 'guest_email', 'how_found', 'rooms', 'checkin', 'checkout', 'nights', 'total_price']
    }
  }
];

// ── Ejecutar herramienta ───────────────────────────────────

async function executeTool(toolName, toolInput, userId, userName) {
  console.log(`🔧 ${toolName}`, JSON.stringify(toolInput));

  try {
    if (toolName === 'check_availability') {
      const { checkin, checkout, room_ids } = toolInput;
      const rooms = (room_ids?.length > 0) ? room_ids : ROOMS.map(r => r.id);
      const requestedRooms = ROOMS.filter(r => rooms.includes(r.id));
      if (requestedRooms.length === 0) {
        return { available: false, message: 'No se encontraron habitaciones válidas para verificar.' };
      }
      const unavailableNames = new Set();
      const hasGoogleConfig = Boolean(process.env.GOOGLE_SHEETS_CREDENTIALS || (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY));
      let sheetReadOk = false;

      // 1) Verificar reservas directas en Google Sheets
      try {
        const sheetResult = await getUnavailableRoomsFromGoogleSheet({
          checkin,
          checkout,
          requestedRooms
        });
        sheetReadOk = true;
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

      const available = requestedRooms.filter(r => !unavailableNames.has(r.backendName));

      if (available.length > 0) {
        return {
          available: true,
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

      const alternatives = await findAlternativeDates(checkin, checkout, requestedRooms, 5).catch(() => ({ alternatives: [] }));

      return {
        available: false,
        message: 'No hay disponibilidad para las fechas solicitadas.',
        unavailable_rooms: unavailableRooms,
        alternative_dates: alternatives?.alternatives || []
      };
    }

    if (toolName === 'get_price') {
      const { room_id, checkin, checkout, guests = 2 } = toolInput;
      const room = ROOMS.find(r => r.id === room_id);

      // Precio autoritativo desde hotel-knowledge.js — siempre tiene prioridad
      const g = Number(guests);
      const authPrice = room
        ? (g <= 2 ? room.price_2 : (room.price_3_4 ?? room.price_2))
        : null;

      // Llamada al backend solo para referencia dinámica (temporadas, etc.)
      let backendPrice = null;
      try {
        const res = await fetch(`${BOOKING_API}/get-dynamic-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: room_id, checkinDate: checkin, checkoutDate: checkout, guests })
        });
        if (res.ok) {
          const data = await res.json();
          backendPrice = data?.total_price || data?.price_per_night || null;
        }
      } catch { /* ignorar */ }

      const finalPrice = authPrice ?? backendPrice;
      return {
        room_name: room?.name || room_id,
        checkin, checkout, guests,
        price_per_night: finalPrice,
        total_price: finalPrice,
        source: authPrice != null ? 'hotel-knowledge (autoritativo)' : 'backend'
      };
    }

    if (toolName === 'get_booked_dates') {
      const res = await fetch(`${BOOKING_API}/api/fully-booked-dates`);
      return await res.json();
    }

    if (toolName === 'get_current_time') {
      return getMexicoCityNowData();
    }

    if (toolName === 'lookup_reservation') {
      const { folio } = toolInput;
      // Buscar primero en Google Sheets (fuente principal)
      const sheetResult = await getReservationByFolioFromSheet(folio);
      if (sheetResult.found) return sheetResult;

      return { found: false, folio, message: 'No se encontró ninguna reserva con ese folio. Verifica que sea correcto.' };
    }

    if (toolName === 'create_reservation_quote') {
      const {
        guest_name,
        guest_email,
        how_found,
        rooms: inputRooms,
        tours: inputTours,
        checkin,
        checkout,
        nights,
        deposit_amount
      } = toolInput;

      // Normalizar rooms: mapear IDs a datos de ROOMS y calcular precio oficial
      const resolvedRooms = (inputRooms || []).map(r => {
        const known = ROOMS.find(k => k.id === r.room_id);
        const g = Number(r.guests || 2);
        const officialPrice = known
          ? (g <= 2 ? known.price_2 : (known.price_3_4 ?? known.price_2)) * Number(nights || 1)
          : r.price;
        return {
          id: r.room_id,
          name: known?.name || r.room_name,
          backendName: known?.backendName || r.room_name,
          guests: g,
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

      const quote = createQuote({
        userId, userName,
        guestName: guest_name,
        guestEmail: guest_email,
        howFound: how_found,
        rooms: resolvedRooms,
        tours: resolvedTours,
        checkin, checkout, nights,
        roomsTotal,
        toursTotal,
        totalPrice: officialTotal,
        depositAmount: deposit_amount ?? officialTotal
      });

      const sessionId = `wa-${quote.folio}`;
      const roomNamesForBackend = resolvedRooms.map(r => r.backendName);

      let temporaryBlock = {
        success: false,
        message: 'No se pudo crear bloqueo temporal en este momento.',
        rooms: roomNamesForBackend,
        checkin, checkout,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        durationMinutes: 60
      };

      try {
        const blockRes = await fetch(`${BOOKING_API}/api/create-temporary-block`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkin, checkout, rooms: roomNamesForBackend, sessionId })
        });
        const blockData = await blockRes.json();
        temporaryBlock = { ...temporaryBlock, success: Boolean(blockData?.success), message: blockData?.message || 'Bloqueo temporal procesado.' };
      } catch (blockErr) {
        console.warn('⚠️ No se pudo crear bloqueo temporal en backend:', blockErr.message);
      }

      // Registrar bloqueo de CADA habitación en pestaña Disponibilidad
      for (const r of resolvedRooms) {
        try {
          const dispResult = await appendTempBlockToSheet({ room: r, checkin, checkout, folio: quote.folio, sessionId });
          if (!dispResult.success) console.warn(`⚠️ Bloqueo Disponibilidad (${r.name}):`, dispResult.reason);
          else console.log(`🔒 Bloqueo temporal: ${r.name} — ${quote.folio}`);
        } catch (dispErr) {
          console.warn(`⚠️ Error bloqueo Disponibilidad (${r.name}):`, dispErr.message);
        }
      }

      return {
        ...quote,
        rooms: resolvedRooms,
        tours: resolvedTours,
        temporaryBlock
      };
    }

  } catch (err) {
    console.error(`❌ Error en ${toolName}:`, err.message);
    return { error: err.message };
  }
}

// ── Manejar mensaje de texto ───────────────────────────────

export async function handleMessage(userId, userText, userName = '') {
  if (!conversations.has(userId)) conversations.set(userId, []);
  const history = conversations.get(userId);

  const incomingText = typeof userText === 'string' ? userText.trim() : String(userText || '').trim();
  if (!incomingText) {
    return {
      text: '¿Me compartes tu mensaje en texto para ayudarte mejor? 🌿',
      requiresHumanIntervention: false
    };
  }

  const parsedDates = parseDateIntent(incomingText, history);
  if (parsedDates?.confidence === 'medium' && parsedDates?.needsConfirmation) {
    const confirmationText = `Perfecto, déjame confirmar:\n📅 Llegada: *${formatDateEs(parsedDates.checkin)}*\n📅 Salida: *${formatDateEs(parsedDates.checkout)}*\n\n¿Correcto? ✅`;
    history.push({ role: 'user', content: incomingText });
    history.push({ role: 'assistant', content: confirmationText });
    while (history.length > MAX_HISTORY) history.shift();
    return { text: confirmationText, requiresHumanIntervention: false };
  }

  const deterministicResponse = getDeterministicResponse(incomingText);
  if (deterministicResponse) {
    history.push({ role: 'user', content: incomingText });
    history.push({ role: 'assistant', content: deterministicResponse });
    while (history.length > MAX_HISTORY) history.shift();
    console.log(`💬 [${userName || userId}]: ${incomingText}`);
    console.log(`🤖 → ${deterministicResponse.slice(0, 100)}...`);
    return {
      text: deterministicResponse,
      requiresHumanIntervention: needsHumanIntervention(incomingText, deterministicResponse)
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
  const dynamicContext = `Hoy es ${hoy}. Usa esta fecha como referencia para calcular disponibilidad, cancelaciones y plazos.${userName ? `\nEl huésped se llama *${userName}*.` : ''}`;

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

  while (true) {
    const safeMessages = sanitizeMessagesPayload(messages);
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemBlocks,
      tools: cachedTools,
      messages: safeMessages
    });

    if (response.stop_reason === 'end_turn') {
      const text = response.content.find(b => b.type === 'text')?.text?.trim() || '';
      const finalText = text || 'Hubo un problema temporal al responder. ¿Me repites tu mensaje, por favor? 🌿';
      effectiveHistory.push({ role: 'assistant', content: finalText });
      console.log(`🤖 → ${text.slice(0, 100)}...`);
      return {
        text: finalText,
        requiresHumanIntervention: needsHumanIntervention(userText, finalText)
      };
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
      if (toolUseBlocks.length === 0) {
        // Claude respondió stop_reason=tool_use sin bloques — puede ocurrir en reservas complejas.
        // Extraer cualquier texto parcial y devolverlo en lugar de un error genérico.
        const partialText = response.content.find(b => b.type === 'text')?.text?.trim();
        if (partialText) {
          console.warn('⚠️ Claude: tool_use sin bloques; usando texto parcial como respuesta.');
          effectiveHistory.push({ role: 'assistant', content: partialText });
          return { text: partialText, requiresHumanIntervention: needsHumanIntervention(userText, partialText) };
        }
        console.warn('⚠️ Claude devolvió stop_reason=tool_use pero sin bloques tool_use; se omite ese turno.');
        const fallback = 'Hubo un problema temporal al procesar tu solicitud. ¿Me lo repites por favor? 🌿';
        effectiveHistory.push({ role: 'assistant', content: fallback });
        return { text: fallback, requiresHumanIntervention: false };
      }
      messages.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const tb of toolUseBlocks) {
        const result = await executeTool(tb.name, tb.input, userId, userName);
        toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify(result) });
      }
      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }
    }
  }
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

    return {
      hasPendingReservation: true,
      reservation: pending,
      message: `✅ ¡Comprobante recibido!\n\n*Folio:* ${pending.folio}\n${roomsSection}${toursSection}\n\n📅 Check-in: ${pending.checkin}\n📅 Check-out: ${pending.checkout}\n💰 *Total: $${pending.totalPrice.toLocaleString('es-MX')} MXN*\n\nNuestro equipo verificará tu pago y te enviaremos la confirmación final en breve. ¡Te esperamos en el Paraíso Encantado! 🌿`
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
