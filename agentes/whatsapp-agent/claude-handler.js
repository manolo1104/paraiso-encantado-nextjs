/**
 * claude-handler.js
 * Claude AI con tools para disponibilidad, precios y reservas por WhatsApp.
 */

import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { HOTEL_SYSTEM_PROMPT, ROOMS, RESTAURANT_MENU } from './hotel-knowledge.js';
import {
  createQuote, getByUser, getByFolio, getPending, getLocallyReservedBackendNames,
  updateReservation, supersedeQuote, findLatestPendingByPhone
} from './reservations.js';
import { getUnavailableRoomsFromGoogleSheet, getReservationByFolioFromSheet, getReservationsByNameFromSheet, findAlternativeDates, getPerNightUnavailableFromSheet } from './google-sheets.js';
import { getRoomPricePerNight, computeQuoteAmounts } from './pricing.js';
import { createAvailabilityService } from './availability.js';
import { suggestRoomCombos } from './room-combos.js';
import { buildQuoteSummary } from './quote-summary.js';
import { getBankInfo } from './bank-info.js';
import { buildToursCatalogMessage, ensureToursContact, mentionsTours } from './tours-helpers.js';
import { TOURS_WHATSAPP, TOURS_LIST_URL } from './tours-data.js';
import {
  resolveQuoteDates, isQuoteStale, planSupersede, ownHoldSessionId,
  shouldBypassShortcuts, detectDateMentions, PEOPLE_COUNT_REGEX
} from './quote-flow.js';
import { formatMXN, formatDateLongEs, formatTimeMx, mxTodayYmd, nightsBetween } from './format-mx.js';
import { digitsOnly, extractDigitsFromJid, normalizeMxCandidates } from './phone.js';

// Compatibilidad: buildSplitSegments vivía aquí; ahora está en availability.js.
export { buildSplitSegments } from './availability.js';

let anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 4,    // reintentos ante 429/529/errores transitorios (default 2) — evita que un blip pase a "Tuve un problema técnico"
  timeout: 60000,   // 60s por intento (default 10 min) para no colgar el manejador del mensaje
});
// ⚠️ SIEMPRE con "www". El apex (paraisoencantado.com) responde 301 hacia www, y en un
// 301 el fetch convierte el POST en GET y tira el cuerpo → la ruta contesta 405 sin
// cuerpo → `res.json()` revienta con "Unexpected end of JSON input". Eso rompía TODAS
// las llamadas del bot al backend (disponibilidad, bloqueos temporales, cotizaciones).
// Normalizamos aquí para que un BOOKING_API_URL mal puesto en Railway no lo repita.
function normalizeBookingApi(raw) {
  const base = String(raw || '').trim().replace(/\/+$/, '');
  if (!base) return 'https://www.paraisoencantado.com';
  return base.replace(/^https?:\/\/paraisoencantado\.com/i, 'https://www.paraisoencantado.com');
}
const BOOKING_API = normalizeBookingApi(process.env.BOOKING_API_URL);

// Token de servicio para autenticar las llamadas del agente a las APIs admin del sitio.
// El middleware del sitio exige JWT en /api/admin/*; con este header el agente se
// autentica como servicio interno. Debe coincidir con AGENT_API_TOKEN en el sitio.
const AGENT_API_TOKEN = process.env.AGENT_API_TOKEN || '';
function adminHeaders(extra = {}) {
  return { ...(AGENT_API_TOKEN ? { 'x-agent-token': AGENT_API_TOKEN } : {}), ...extra };
}

// Servicio de disponibilidad (availability.js). Mismas 3 fuentes y reglas fail-closed de
// siempre; manda el token para que la página excluya el apartado 'wa-<folio>' propio.
const availability = createAvailabilityService({
  rooms: ROOMS,
  fetchImpl: fetch,
  bookingApi: BOOKING_API,
  getHeaders: () => adminHeaders({ 'Content-Type': 'application/json' }),
  // Función (no boolean) para evaluar las variables en cada consulta, igual que antes.
  hasGoogleConfig: () => Boolean(process.env.GOOGLE_SHEETS_CREDENTIALS || (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)),
  getUnavailableRoomsFromGoogleSheet,
  getLocallyReservedBackendNames,
  findAlternativeDates,
  getPerNightUnavailableFromSheet,
  getRoomPricePerNight
});

// Estados que ya NO cuentan como cotización del cliente.
const INACTIVE_STATUSES = new Set(['REEMPLAZADA', 'CANCELADA']);
const CONFIRMED_STATUSES = new Set(['RESERVADO', 'CONFIRMADA']);
const isActiveRecord = (r) => Boolean(r) && !INACTIVE_STATUSES.has(String(r.status || '').toUpperCase());

// Dígitos del WhatsApp real del cliente: el contactNumber que manda index.js, o el
// userId si es @c.us (un @lid NO trae el número).
function waDigitsFor(userId = '', contactNumber = '') {
  const fromContact = digitsOnly(contactNumber);
  if (fromContact) return fromContact;
  return /@c\.us$/i.test(String(userId)) ? extractDigitsFromJid(userId) : '';
}

// Cotización/reserva vigente del cliente (la más reciente que no esté reemplazada ni
// cancelada). Orden: folio de la sesión → último registro del usuario → su
// PENDIENTE_PAGO más reciente → por teléfono (arregla el cambio @lid/@c.us).
function findActiveQuote(userId, contactNumber = '') {
  try {
    const session = sessionData.get(userId);
    if (session?.lastFolio) {
      const bySession = getByFolio(session.lastFolio);
      if (isActiveRecord(bySession)) return bySession;
    }
    const byUser = getByUser(userId);
    if (isActiveRecord(byUser)) return byUser;
    // El último registro puede ser una cotización cancelada por choque de apartado:
    // la PENDIENTE_PAGO anterior sigue vigente.
    const pendingOwn = getPending()
      .filter(r => r.userId === userId)
      .sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0))[0];
    if (pendingOwn) return pendingOwn;
    const candidates = [
      ...normalizeMxCandidates(contactNumber),
      ...(/@c\.us$/i.test(String(userId)) ? normalizeMxCandidates(extractDigitsFromJid(userId)) : [])
    ];
    return candidates.length ? findLatestPendingByPhone(candidates) : null;
  } catch (err) {
    console.warn('⚠️ No se pudo buscar la cotización vigente:', err.message);
    return null;
  }
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

// ── Máquina de estados de la conversación (reporte P1: "memoria de estado") ──
// Deriva la etapa REAL del cliente del dato duro (reserva en reservations.json +
// sesión), NO de que el modelo la adivine. Se inyecta al prompt dinámico para que
// Camila deje de tratar a un cliente que ya cotizó/pagó/reservó como si fuera nuevo,
// y deje de re-preguntar datos que ya dio (hallazgos 4.1, 4.4 y parte de 4.5).
// Una cotización PENDIENTE_PAGO vieja (más de 7 días) o con check-in pasado ya no cuenta
// (isQuoteStale). Una reserva confirmada o con comprobante NO caduca por antigüedad
// (igual que planSupersede): solo deja de contar cuando su llegada/salida ya pasó.
function deriveConversationStage(userId, { contactNumber = '' } = {}) {
  const r = findActiveQuote(userId, contactNumber);
  const s = getSession(userId);
  if (r) {
    const status = String(r.status || '').toUpperCase();
    const today = mxTodayYmd();
    if (CONFIRMED_STATUSES.has(status)) {
      // Sigue siendo "su reserva" mientras no haya salido (puede estar hospedado).
      if (String(r.checkout || r.checkin || '') >= today) return { stage: 'reserva_confirmada', r };
    } else if (status === 'PENDIENTE_PAGO') {
      if (r.proofReceivedAt) {
        if (String(r.checkin || '') >= today) return { stage: 'pago_en_verificacion', r };
      } else if (!isQuoteStale(r)) {
        return { stage: 'cotizacion_pendiente_pago', r };
      }
    }
  }
  if (s.checkin && s.checkout) return { stage: 'cotizando', r: null };
  return { stage: 'nuevo', r: null };
}

// Texto de la hora del apartado de una cotización guardada (para el prompt dinámico).
function holdStatusText(r) {
  if (!r) return '';
  if (r.blockConfirmed === false) return 'SIN apartado confirmado (el equipo valida disponibilidad antes de que pague)';
  // Sin hora (folios de antes del apartado de 3 h) no hay apartado que se pueda garantizar.
  if (!r.holdExpiresAt) return 'sin hora de apartado registrada: no cuenta como apartado vigente';
  const expires = new Date(r.holdExpiresAt);
  if (Number.isNaN(expires.getTime())) return 'sin hora de apartado registrada: no cuenta como apartado vigente';
  const when = `${formatTimeMx(expires)}${mxTodayYmd(expires) === mxTodayYmd() ? ' de hoy' : ` del ${formatDateLongEs(mxTodayYmd(expires))}`}`;
  return expires.getTime() > Date.now()
    ? `apartada hasta las ${when}`
    : `el apartado VENCIÓ (${when}): si quiere pagar, vuelve a revisar disponibilidad con check_availability antes`;
}

// Traduce la etapa a una instrucción clara para el prompt (bloque dinámico, no cacheado).
function buildStageLine(userId, { contactNumber = '' } = {}) {
  const { stage, r } = deriveConversationStage(userId, { contactNumber });
  const money = (n) => formatMXN(n);
  const roomsTxt = r && Array.isArray(r.rooms) && r.rooms.length
    ? r.rooms.map(x => x?.name ? `${x.name}${x.guests ? ` (${x.guests}p)` : ''}` : '').filter(Boolean).join(', ')
    : (r?.room?.name || '');
  const meta = r ? `folio ${r.folio}${roomsTxt ? `, ${roomsTxt}` : ''}${r.checkin && r.checkout ? `, ${r.checkin} → ${r.checkout}` : ''}` : '';
  switch (stage) {
    case 'reserva_confirmada':
      return `\n🔑 ESTADO DEL CLIENTE = *RESERVA CONFIRMADA* (${meta}). NO le ofrezcas cotizar ni le preguntes si quiere reservar — YA reservó. Ayúdale con lo de después: llegada/check-in, cómo llegar, tours, restaurante y servicios. Si quiere modificar la reserva (fechas o personas), NO generes cotización: dile que lo ve el equipo y te comunicas con ellos.`;
    case 'pago_en_verificacion':
      return `\n🔑 ESTADO DEL CLIENTE = *PAGO EN VERIFICACIÓN* (${meta}, total ${money(r.totalPrice)}, anticipo ${money(r.depositAmount)}, saldo al llegar ${money(r.saldo ?? Math.max(0, Number(r.totalPrice || 0) - Number(r.depositAmount || 0)))}). YA envió su comprobante y el equipo lo está verificando; en cuanto quede verificado le mandan la confirmación. NO le pidas pagar otra vez ni le preguntes si quiere reservar; puedes resolver dudas de su estancia. Si quiere CAMBIAR fechas, personas o habitaciones: NO cotices; dile que el equipo lo ajusta y te comunicas con ellos.`;
    case 'cotizacion_pendiente_pago': {
      const saldo = r.saldo ?? Math.max(0, Number(r.totalPrice || 0) - Number(r.depositAmount || 0));
      // Solo se afirma "apartada" si el apartado se confirmó y su hora no ha pasado. Vencido,
      // sin hora o folio viejo: primero se revisa disponibilidad y se re-aparta cotizando otra vez.
      const exp = r.holdExpiresAt ? new Date(r.holdExpiresAt).getTime() : NaN;
      const holdActive = r.blockConfirmed === true && Number.isFinite(exp) && exp > Date.now();
      let payLine;
      if (r.blockConfirmed === false) {
        // Sin apartado confirmado NO se empuja el pago: el equipo valida disponibilidad primero.
        payLine = 'Su habitación NO quedó apartada en el sistema: NO le des datos bancarios ni le pidas pagar; dile que el equipo le confirma la disponibilidad en unos minutos.';
      } else if (holdActive) {
        payLine = 'Ya tiene su cotización con los datos de pago; ayúdale a completar el pago (anticipo + comprobante). Si pide pagar con tarjeta o reservar en línea, NO le mandes el motor web (su suite está apartada a su folio y en la página aparecería ocupada): usa el link de pago con tarjeta si está en tus instrucciones, con el monto exacto de su anticipo, o dile que el equipo se lo manda.';
      } else {
        payLine = 'Su apartado YA NO está vigente: NO digas que su suite sigue apartada ni le pidas pagar todavía. Primero llama check_availability con sus mismas fechas y personas. Si siguen libres y quiere pagar, llama create_reservation_quote con los mismos datos para apartarla de nuevo (la anterior se reemplaza sola). Si ya no hay, dile y ofrece alternativas.';
      }
      // Con el apartado vencido SÍ se vuelve a cotizar (para re-apartar): ahí no aplica "NO la generes de nuevo".
      const noRegenerate = (r.blockConfirmed === false || holdActive)
        ? 'NO la generes de nuevo ni vuelvas a pedir fechas/personas que ya dio.'
        : 'NO vuelvas a pedir fechas/personas que ya dio.';
      return `\n🔑 ESTADO DEL CLIENTE = *COTIZACIÓN ESPERANDO PAGO* (${meta}, total ${money(r.totalPrice)}, anticipo ${money(r.depositAmount)}, saldo al llegar ${money(saldo)}; ${holdStatusText(r)}). ${noRegenerate} Resuelve dudas. ${payLine}
Si el cliente quiere CAMBIAR fechas, personas o habitaciones: 1) llama check_availability con lo nuevo (el sistema excluye su propio apartado); 2) dile claramente si SÍ o NO hay disponibilidad (mira cotizacion_vigente.mismas_habitaciones_disponibles del resultado); 3) si sí y acepta, llama create_reservation_quote (la cotización anterior se reemplaza sola y se libera su apartado). Si no hay, NO cotices: ofrece alternativas; su cotización actual sigue vigente.`;
    }
    case 'cotizando':
      return `\n🔑 ESTADO DEL CLIENTE = *EN COTIZACIÓN* (ya dio fechas). NO vuelvas a preguntar lo que ya tienes; continúa desde donde iban.`;
    default:
      return '';
  }
}

// Solo escalar cuando el cliente PIDE hablar con alguien — palabras sueltas como
// "recepción" o "gerente" en preguntas normales ("¿la recepción abre 24 h?") NO escalan.
const HUMAN_REQUEST_REGEX = /\b(humano|asesor)\b|\b(hablar|comun[ií]came|comunicarme|p[aá]same|transfi[eé]reme|con[eé]ctame|atienda)\b.{0,30}\b(persona|humano|recepci[oó]n|gerente|manager|ejecutivo|asesor|agente|equipo|alguien)\b|quiero hablar con|human support|real person/i;
const ESCALATION_RESPONSE_REGEX = /te comunico con nuestro equipo|en breve te contactan|te contacta nuestro equipo|te atiende una persona/i;

// "agrégame / añade el tour…" también es intención de reservar un tour (no "¿qué incluye el tour?").
const TOUR_BOOKING_INTENT_REGEX = /\b(quiero|quisiera|me interesa|me gustar[íi]a|podemos|podría|puedo|reservar|contratar|apartar|tomar|agendar|agr[eé]g\w*|a[nñ]ad\w*)\b.{0,40}\b(tour|tours|excursion|excursiones|recorrido|paquete)\b|\b(tour|tours)\b.{0,40}\b(reservar|contratar|apartar|pagar|agendar|incluir|agregar|a[nñ]adir)\b/i;

function needsHumanIntervention(userText = '', assistantText = '') {
  return HUMAN_REQUEST_REGEX.test(userText) || ESCALATION_RESPONSE_REGEX.test(assistantText);
}

// Aviso al equipo de tours: solo por INTENCIÓN del CLIENTE de reservar un tour. El texto
// de Camila ya NO cuenta: ahora toda respuesta de tours trae el link y "para organizarlo
// o reservarlo escríbele…" (plantilla del prompt + ensureToursContact), y eso avisaría
// al equipo de tours en cada mensaje informativo.
function wantsTourBooking(userText = '', assistantText = '') {
  return TOUR_BOOKING_INTENT_REGEX.test(userText);
}

function parseFirstInteger(value = '') {
  const match = String(value).match(/\b(\d{1,3})\b/);
  return match ? Number(match[1]) : null;
}

// Carta individual del restaurante — respuesta oficial a preguntas de comida/menú
// (el buffet grupal solo se ofrece a grupos de 20+; ver hotel-knowledge.js)
function buildCartaMessage() {
  const desayunos = RESTAURANT_MENU.desayunos.map(i => `${i.name} $${i.price}`).join(' · ');
  const principales = RESTAURANT_MENU.principales.map(i => `${i.name} $${i.price}`).join(' · ');
  const bebidas = RESTAURANT_MENU.bebidas.map(i => `${i.name} $${i.price}`).join(' · ');
  return `Nuestro restaurante *El Papán Huasteco* (8:00 AM – 8:00 PM) 🍽️\n\n*Desayunos:* ${desayunos}\n*Platillos principales:* ${principales}\n*Bebidas:* ${bebidas}\n\nAbierto todos los días para huéspedes y público general. 🌿\n\n¿Te ayudo también con tu reserva de hospedaje?`;
}

// Texto de "mi reserva / mi cotización" armado con el registro REAL del folio (su status,
// montos y apartado), no con lo que recuerde la sesión. null si no hay nada que mostrar.
function buildMyReservationText(record) {
  if (!record || !isActiveRecord(record)) return null;
  const status = String(record.status || '').toUpperCase();
  const rooms = (Array.isArray(record.rooms) && record.rooms.length ? record.rooms : (record.room ? [record.room] : []))
    .map(r => `· ${r.name}${r.guests ? ` (${r.guests} ${Number(r.guests) === 1 ? 'persona' : 'personas'})` : ''}`)
    .join('\n');
  const total = Number(record.totalPrice || 0);
  const deposit = Number(record.depositAmount || 0);
  const saldo = record.saldo ?? Math.max(0, total - deposit);
  const lines = [];
  if (CONFIRMED_STATUSES.has(status)) {
    lines.push(`✅ Tu reserva está *confirmada* — Folio *${record.folio}*`);
  } else if (status === 'PENDIENTE_PAGO' && record.proofReceivedAt) {
    lines.push(`🔎 Tu reserva — Folio *${record.folio}*`, 'Ya recibimos tu comprobante: nuestro equipo lo está verificando y en cuanto quede verificado te enviamos la *confirmación de tu reserva*.');
  } else if (status === 'PENDIENTE_PAGO') {
    if (isQuoteStale(record)) return null;
    lines.push(`🧾 Tu cotización — Folio *${record.folio}* (pendiente de pago)`);
  } else {
    return null;
  }
  lines.push('');
  if (record.checkin) lines.push(`📅 Llegada: *${formatDateLongEs(record.checkin)}*`);
  if (record.checkout) lines.push(`📅 Salida: *${formatDateLongEs(record.checkout)}*`);
  if (rooms) lines.push(`🏨 Hospedaje:\n${rooms}`);
  if (total > 0) {
    lines.push(`💰 Total: *${formatMXN(total)}*`);
    lines.push(`💳 Anticipo: *${formatMXN(deposit)}* · 🏡 Saldo al llegar: *${formatMXN(saldo)}*`);
  }
  if (status === 'PENDIENTE_PAGO' && !record.proofReceivedAt) {
    const expires = record.blockConfirmed !== false && record.holdExpiresAt ? new Date(record.holdExpiresAt) : null;
    if (record.blockConfirmed === false) {
      lines.push('⚠️ Nuestro equipo te confirma la disponibilidad antes de que hagas el pago.');
    } else if (expires && !Number.isNaN(expires.getTime())) {
      const when = `${formatTimeMx(expires)}${mxTodayYmd(expires) === mxTodayYmd() ? ' de hoy' : ` del ${formatDateLongEs(mxTodayYmd(expires))}`}`;
      lines.push(expires.getTime() > Date.now()
        ? `⏳ Te apartamos la habitación hasta las *${when}*.`
        : `⏳ El apartado venció (${when}); antes de pagar te confirmo que siga disponible.`);
    }
    lines.push('', 'Tu reserva queda *confirmada* cuando nos envíes tu comprobante y el equipo lo verifique. ¿Tienes alguna duda? 🌿');
  } else {
    lines.push('', '¿En qué más te ayudo? 🌿');
  }
  return lines.join('\n');
}

function getDeterministicResponse(userText = '', session = {}, { stage = null } = {}) {
  const text = normalizeText(userText);

  if (!text) return null;

  if (HUMAN_REQUEST_REGEX.test(userText)) {
    return 'Te comunico con nuestro equipo, en breve te contactan. 🤝📞';
  }

  // ¿El mensaje ya trae fechas o número de personas? Entonces los atajos genéricos
  // ("dame tus fechas", tabla de precios) se tragarían la ráfaga: lo contesta el modelo.
  // (handleMessage ya salta los atajos con shouldBypassShortcuts; esto es la red extra.)
  const hasStayData = PEOPLE_COUNT_REGEX.test(userText) || extractDates(text).length > 0 || detectDateMentions(text).length > 0;

  // "mi reserva/reservación/cotización" — armado desde el folio REAL de la sesión con su
  // status. Si el cliente ya incluyó un identificador (folio WA-/PE- o "a nombre de ..."),
  // o no hay folio en sesión, NO cortamos aquí: el modelo usa lookup_reservation.
  const hasFolioLike = /\b(wa|pe)[- ]?[a-z0-9]{4,}\b/i.test(userText);
  const hasNameIndicator = /\ba nombre de\b|\bnombre de la reserva|\bmi nombre es\b|\bse llama\b/i.test(text);

  // Tours a la reserva ("agrégame el tour de Tamul a mi reserva"): los tours ya NO van
  // en la cotización del hotel; lo ve el equipo de tours. Va ANTES de "mi reserva",
  // que si no se tragaba el mensaje y contestaba solo con la cotización.
  const mentionsTourWord = /\btours?\b|excursion/.test(text);
  if (mentionsTourWord && /\bagreg|\banad|\bsumar|persona extra/.test(text)) {
    return `¡Claro! 🌿 Los tours los organiza nuestro equipo de tours (no van en la cotización del hotel). Para agregarlos o ajustar participantes escríbeles al *${TOURS_WHATSAPP}* 📲\n🔗 ${TOURS_LIST_URL}`;
  }

  // "Mi reserva" sin más: se muestra el folio. Si además pide cambiar algo o habla de
  // tours/paquetes, lo resuelve el modelo (no basta con repetir la cotización).
  const asksSomethingElse = mentionsTourWord || /paquete|agreg|cambi|mover|recorr/.test(text);
  if ((text.includes('mi reserva') || text.includes('mi reservacion') || text.includes('mi cotizacion') || text.includes('detalles de mi reserva')) && !text.includes('cancel') && !hasFolioLike && !hasNameIndicator && !asksSomethingElse) {
    if (session.lastFolio) {
      let record = null;
      try { record = getByFolio(session.lastFolio); } catch { /* sin registro local */ }
      const mine = buildMyReservationText(record);
      if (mine) return mine;
    }
    // Sin folio real en sesión: lo resuelve el modelo (pide identificador / lookup_reservation).
  }

  // "Quiero reservar" sin fechas ni personas y sin nada en curso → pedir personas + fechas.
  const noStayInProgress = !stage || stage === 'nuevo';
  if ((text.includes('quiero reservar') || text.includes('reservar por whatsapp')) && !text.includes('check-in') && !text.includes('check out') && !hasStayData && noStayInProgress && !session.checkin) {
    return '¡Perfecto! 🌿 ¿Cuántas personas serían y qué fechas de llegada y salida? Reviso la disponibilidad al momento. 📅';
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
  // Con fechas o personas en el texto (p. ej. ráfaga "del 9 al 11" + "somos 5") no se usa: lo ve el modelo.
  if (asksAvailability && hasDateHint && !hasStayData && !(hasCheckinWord && hasCheckoutWord) && extractDates(text).length < 2) {
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

  const asksPrice = text.includes('precio') || text.includes('cuanto cuesta') || text.includes('costo') || text.includes('tarifa');
  const mentionsSpecificRoom = /(jungla|lindavista|lajas|flor de liz|lirios|orquideas|bromelias|helechos|suite)/.test(text);
  const isPostConfirmationChange = text.includes('reserva confirmada') || text.includes('agregar 1 huesped') || text.includes('agregar un huesped') || text.includes('cambia el precio');
  const isExternalPriceDispute = text.includes('mas barata') || text.includes('respetas ese precio') || text.includes('otra pagina');
  const asksAboutTourOrPackage = text.includes('tour') || text.includes('paquete') || text.includes('excursion') || mentionsTours(text);
  if (asksPrice && !hasStayData && !mentionsSpecificRoom && !isPostConfirmationChange && !isExternalPriceDispute && !asksAboutFood && !asksAboutTourOrPackage) {
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
  if (text.includes('desayuno') && text.includes('inclu') && !text.includes('tour') && !text.includes('paquete') && !mentionsTours(text)) {
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
  if (asksPrice && !hasDateHint && !hasStayData) {
    for (const [keyword, response] of Object.entries(suiteKeywords)) {
      if (text.includes(keyword)) {
        return `${response}\n\n¿Para cuántas personas y qué fechas tienes en mente? 📅`;
      }
    }
  }

  if (text.includes('que tours tienen') || text.includes('que tours manejan') || text.includes('tours tienen') || (text.includes('tours') && (text.includes('tienen') || text.includes('ofrecen') || text.includes('manejan')))) {
    // Catálogo con precios al día (tours-data.js) + WhatsApp del equipo de tours.
    return buildToursCatalogMessage();
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
      '🏨 *Recorrido por Paraíso Encantado:* https://www.youtube.com/watch?v=i3R_OBwoucw&t=1s',
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
    description: 'Verifica disponibilidad de habitaciones para fechas específicas y, para grupos, propone cómo repartirlos (room_options). Úsala SIEMPRE que el cliente dé o cambie fechas, personas o pregunte si una habitación está disponible, aunque ya hayas verificado antes en la misma conversación. La disponibilidad cambia en tiempo real.',
    input_schema: {
      type: 'object',
      properties: {
        checkin:  { type: 'string', description: 'Fecha de llegada YYYY-MM-DD' },
        checkout: { type: 'string', description: 'Fecha de salida YYYY-MM-DD' },
        guests:   { type: 'number', description: 'Personas que cuentan: adultos + niños de 6 años o más (los menores de 6 no cuentan). OBLIGATORIO: si no lo sabes, pregúntalo antes de llamar.' },
        room_ids: { type: 'array', items: { type: 'string' }, description: 'IDs a verificar. Vacío = todas.' }
      },
      required: ['checkin', 'checkout', 'guests']
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
    description: 'Genera UNA sola cotización de HOSPEDAJE con UN solo folio para toda la reserva (los tours NO van aquí). El sistema calcula precios, total, anticipo y saldo, verifica disponibilidad, aparta las habitaciones y le manda al cliente el resumen completo. Llámala UNA sola vez por reserva, con todas las habitaciones en "rooms", cuando ya tengas fechas, habitaciones con sus personas y el nombre completo del huésped. Si ya tenía una cotización pendiente y cambia fechas/personas/habitaciones, llámala de nuevo: la anterior se reemplaza sola.',
    input_schema: {
      type: 'object',
      properties: {
        guest_name:  { type: 'string', description: 'Nombre completo del huésped principal (pídeselo al cliente; no inventes uno)' },
        guest_email: { type: 'string', description: 'Correo del huésped (OPCIONAL — NO lo pidas; omítelo si el cliente no lo da espontáneamente)' },
        how_found:   { type: 'string', description: 'OPCIONAL. ¿Cómo nos encontró? (Google, Página web, Recomendación, Redes). No interrumpas para preguntarlo.' },
        checkin:     { type: 'string', description: 'YYYY-MM-DD — las fechas que el cliente pidió en ESTA conversación (si las cambió, las nuevas)' },
        checkout:    { type: 'string', description: 'YYYY-MM-DD' },
        rooms: {
          type: 'array',
          description: 'Habitaciones a reservar (una o más), cada una con sus personas. Si check_availability devolvió room_options y el cliente eligió una, usa EXACTAMENTE esas suites y ese reparto. Para estancia con CAMBIO DE SUITE (split-stay), incluye cada suite con SUS propias fechas checkin/checkout; usa exactamente los segmentos de split_stay.',
          items: {
            type: 'object',
            properties: {
              room_id:   { type: 'string', description: 'ID de la habitación' },
              room_name: { type: 'string', description: 'Nombre de la habitación' },
              guests:    { type: 'number', description: 'Personas en esta habitación (adultos + niños de 6 años o más), de 1 a su capacidad máxima' },
              checkin:   { type: 'string', description: 'YYYY-MM-DD — SOLO para split-stay: noche de entrada a ESTA suite. Omitir si toda la reserva usa el mismo rango.' },
              checkout:  { type: 'string', description: 'YYYY-MM-DD — SOLO para split-stay: salida de ESTA suite. Omitir si toda la reserva usa el mismo rango.' }
            },
            required: ['room_id', 'guests']
          }
        },
        replaces_previous: { type: 'boolean', description: 'Default true: esta cotización REEMPLAZA la cotización pendiente anterior del cliente (cambio de fechas, personas o habitaciones). Pon false SOLO si el cliente quiere una reserva ADICIONAL aparte y conservar la anterior.' }
      },
      required: ['guest_name', 'rooms', 'checkin', 'checkout']
    }
  }
];

// ── Ayudantes de disponibilidad y cotización ─────────────────

const isYmdStr = (s) => ISO_DATE_RE.test(String(s || ''));

// Suite del catálogo por id, nombre o backendName (tolera 'suite-jungla', mayúsculas, acentos).
function findCatalogRoom(key) {
  if (!key) return null;
  const exact = ROOMS.find(r => r.id === key || r.backendName === key);
  if (exact) return exact;
  const k = roomKeyNorm(key);
  if (!k) return null;
  return ROOMS.find(r => roomKeyNorm(r.id) === k || roomKeyNorm(r.name) === k || roomKeyNorm(r.backendName) === k) || null;
}

// Opciones de habitaciones en una línea cada una, para recordarlas en la sesión
// ("la opción 2" no queda ambigua cuando se trunca el historial).
function compactRoomOptions(options) {
  if (!Array.isArray(options) || !options.length) return null;
  return options.map(o => {
    const rooms = (o.rooms || []).map(r => `${r.name} (${r.guests}p, $${Number(r.price_per_night || 0).toLocaleString('es-MX')}/noche)`).join(' + ');
    return `${o.option}) ${rooms} → $${Number(o.total_per_night || 0).toLocaleString('es-MX')}/noche, $${Number(o.total_stay || 0).toLocaleString('es-MX')} total`;
  });
}

// Agrega al resultado de disponibilidad las propuestas para el grupo (room-combos.js):
// room_options, fits_alone por suite y group_fits. Si las suites libres no alcanzan
// para todos, busca fechas cercanas donde el grupo SÍ quepa.
async function addGroupOptions(result, { guests, checkin, checkout, roomIdsGiven = false } = {}) {
  if (!result?.available || !Array.isArray(result.available_rooms)) return result;
  const g = Math.floor(Number(guests) || 0);
  const nights = nightsBetween(checkin, checkout) || 1;
  const availableIds = new Set(result.available_rooms.map(r => r.id));
  const entries = ROOMS.filter(r => availableIds.has(r.id)); // en el orden de ROOMS
  const out = {
    ...result,
    guests: g || null,
    nights,
    available_rooms: result.available_rooms.map(r => ({ ...r, fits_alone: g > 0 ? Number(r.max_occupancy || 0) >= g : true }))
  };
  if (g <= 0) return out;

  const combos = suggestRoomCombos(entries, g, { nights });
  if (combos?.feasible) {
    out.group_fits = true;
    out.room_options = combos.options;
    out.room_options_note = 'Presenta estas opciones TAL CUAL, numeradas (suites, personas por suite y precios exactos). No inventes otras combinaciones ni repitas una suite.';
    return out;
  }
  if (combos && combos.feasible === false) {
    out.group_fits = false;
    out.capacity_available = combos.capacity;
    let alternatives = [];
    if (!roomIdsGiven) {
      try {
        const alt = await findAlternativeDates(checkin, checkout, ROOMS, 5);
        alternatives = (alt?.alternatives || [])
          .map(a => ({
            checkin: a.checkin, checkout: a.checkout, nights: a.nights, dayName: a.dayName, formattedDate: a.formattedDate,
            capacity: (a.availableRooms || []).reduce((s, r) => s + Number(findCatalogRoom(r.id)?.max_occupancy || 0), 0)
          }))
          .filter(a => a.capacity >= g);
      } catch { /* sin alternativas */ }
    }
    out.alternative_dates = alternatives;
    out.message = roomIdsGiven
      ? `Las habitaciones consultadas NO alcanzan para ${g} personas (capacidad libre: ${combos.capacity}). Vuelve a consultar sin room_ids para ver cómo repartir al grupo.`
      : `Hay suites libres, pero NO alcanzan para las ${g} personas en esas fechas (capacidad libre: ${combos.capacity} personas). No hay cupo para todo el grupo: NO cotices. Díselo claro y ofrece alternative_dates (fechas cercanas donde sí caben) si vienen; si no hay, pasa el caso al equipo.`;
    return out;
  }
  // null = una sola suite alcanza (≤4 personas): el modelo recomienda 2–3 con fits_alone.
  out.group_fits = true;
  return out;
}

// Versión corta de las opciones para un error no_disponible (sin descripciones largas).
function compactAvailabilityForModel(result) {
  if (!result) return null;
  if (result.verification_failed) return { verification_failed: true, message: result.message };
  const compact = {
    available: Boolean(result.available),
    ...(result.message ? { message: result.message } : {})
  };
  if (Array.isArray(result.available_rooms)) {
    compact.available_rooms = result.available_rooms.map(r => ({
      id: r.id, name: r.name, max_occupancy: r.max_occupancy, price_2: r.price_2, price_3_4: r.price_3_4, fits_alone: r.fits_alone
    }));
  }
  for (const key of ['group_fits', 'capacity_available', 'room_options', 'split_stay', 'alternative_dates']) {
    if (result[key] !== undefined) compact[key] = result[key];
  }
  return compact;
}

// Pico de habitaciones y personas en una misma noche. En split-stay los tramos son las
// MISMAS personas cambiando de suite: no se suman como si fueran cuartos distintos.
function occupancyPeak(rooms, checkin, checkout) {
  const n = Math.min(nightsBetween(checkin, checkout), 366);
  const start = new Date(`${checkin}T12:00:00Z`).getTime();
  let peakRooms = 0;
  let peakGuests = 0;
  for (let i = 0; i < n; i++) {
    const day = new Date(start + i * 86400000).toISOString().slice(0, 10);
    const tonight = rooms.filter(r => r.checkin <= day && day < r.checkout);
    peakRooms = Math.max(peakRooms, tonight.length);
    peakGuests = Math.max(peakGuests, tonight.reduce((s, r) => s + r.guests, 0));
  }
  return {
    rooms: peakRooms || rooms.length,
    guests: peakGuests || rooms.reduce((s, r) => s + r.guests, 0)
  };
}

// POST a las rutas de apartado de la página, con token, timeout y status revisado.
async function postHoldApi(path, body) {
  const res = await fetch(`${BOOKING_API}${path}`, {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${path} respondió ${res.status}${text ? ` — ${text.slice(0, 200)}` : ''}`);
  }
  return res.json();
}

// Tramos del apartado: habitaciones agrupadas por rango de fechas (split-stay = varios).
function buildHoldSegments(rooms) {
  const groups = new Map();
  for (const r of rooms) {
    const key = `${r.checkin}|${r.checkout}`;
    if (!groups.has(key)) groups.set(key, { checkin: r.checkin, checkout: r.checkout, rooms: [] });
    const g = groups.get(key);
    if (!g.rooms.includes(r.backendName)) g.rooms.push(r.backendName);
  }
  return [...groups.values()].sort((a, b) => a.checkin.localeCompare(b.checkin) || a.checkout.localeCompare(b.checkout));
}

// Apartado de 3 h ('wa-<folio>') en UNA sola llamada con todos los tramos (antes cada
// tramo borraba el apartado del anterior). checkin/checkout/rooms sueltos = primer tramo,
// para que funcione aunque la página todavía no conozca `segments`.
async function createWaHold(folio, rooms) {
  const segments = buildHoldSegments(rooms);
  if (!segments.length) return { success: false, expiresAt: null, conflicts: [], message: 'sin habitaciones' };
  const first = segments[0];
  try {
    const data = await postHoldApi('/api/create-temporary-block', {
      checkin: first.checkin,
      checkout: first.checkout,
      rooms: first.rooms,
      sessionId: `wa-${folio}`,
      segments
    });
    return {
      success: data?.success === true,
      expiresAt: data?.expiresAt || null,
      conflicts: Array.isArray(data?.conflicts) ? data.conflicts : [],
      message: data?.message || ''
    };
  } catch (err) {
    console.warn(`⚠️ No se pudo crear el apartado de ${folio}:`, err.message);
    return { success: false, expiresAt: null, conflicts: [], message: err.message };
  }
}

export async function releaseWaHold(folio) {
  try {
    await postHoldApi('/api/remove-temporary-block', { sessionId: `wa-${folio}` });
    console.log(`🔓 Apartado liberado: wa-${folio}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ No se pudo liberar el apartado wa-${folio}:`, err.message);
    return false;
  }
}

// Habitaciones de un registro guardado en la forma que usa el apartado.
function recordRoomsForHold(record) {
  const list = Array.isArray(record?.rooms) && record.rooms.length ? record.rooms : (record?.room ? [record.room] : []);
  return list.map(r => {
    const known = findCatalogRoom(r?.id) || findCatalogRoom(r?.backendName) || findCatalogRoom(r?.name);
    return {
      backendName: known?.backendName || r?.backendName || r?.name,
      checkin: isYmdStr(r?.checkin) ? r.checkin : record.checkin,
      checkout: isYmdStr(r?.checkout) ? r.checkout : record.checkout
    };
  }).filter(r => r.backendName && isYmdStr(r.checkin) && isYmdStr(r.checkout));
}

// ¿Algún choque del apartado nuevo es contra el apartado de la cotización anterior del
// MISMO cliente? (p. ej. misma suite y fechas encimadas, solo cambió el número de personas)
function conflictsTouchRecord(conflicts, record) {
  const rooms = recordRoomsForHold(record);
  return (conflicts || []).some(c => rooms.some(r =>
    roomKeyNorm(r.backendName) === roomKeyNorm(c?.room || '') &&
    r.checkin <= String(c?.date || '') && String(c?.date || '') < r.checkout
  ));
}

// Para check_availability con otras fechas: ¿las habitaciones de la cotización vigente
// (PENDIENTE_PAGO, sin comprobante, no vieja) están libres en el rango consultado?
// null si no hay cotización vigente, si son las mismas fechas o si no se pudo verificar.
// Si la consulta fue solo de OTRAS habitaciones (room_ids), el resultado no dice nada de
// las suyas: se revisan aparte con las mismas fechas, personas y apartado propio excluido.
async function describeCurrentQuoteRooms(prev, result, { checkin, checkout, roomIds, guests, excludeSessionId } = {}) {
  if (!prev || String(prev.status || '').toUpperCase() !== 'PENDIENTE_PAGO') return null;
  if (prev.proofReceivedAt || isQuoteStale(prev)) return null;
  if (!result || result.verification_failed) return null;
  if (prev.checkin === checkin && prev.checkout === checkout) return null;
  const rooms = recordRoomsForHold(prev)
    .map(r => findCatalogRoom(r.backendName))
    .filter(Boolean);
  if (!rooms.length) return null;
  const askedIds = Array.isArray(roomIds) ? roomIds.filter(Boolean) : [];
  let source = result;
  if (askedIds.length) {
    const checked = new Set(askedIds.map(id => findCatalogRoom(id)?.id).filter(Boolean));
    if (!rooms.every(r => checked.has(r.id))) {
      try {
        source = await availability.computeAvailability({
          checkin, checkout, roomIds: rooms.map(r => r.id), guests, excludeSessionId
        });
      } catch (err) {
        console.warn('⚠️ No se pudieron revisar las habitaciones de la cotización vigente:', err.message);
        return null;
      }
      if (!source || source.verification_failed) return null;
    }
  }
  const availableIds = new Set((source.available_rooms || []).map(r => r.id));
  const allFree = source.available !== false && rooms.every(r => availableIds.has(r.id));
  const names = [...new Set(rooms.map(r => r.name))].join(', ');
  return {
    folio: prev.folio,
    fechas_actuales: `${prev.checkin} → ${prev.checkout}`,
    habitaciones: names,
    mismas_habitaciones_disponibles: allFree,
    nota: allFree
      ? `Las habitaciones de su cotización vigente (${names}) SÍ están libres en estas fechas. Díselo claro; si acepta el cambio, cotiza con ellas (la cotización anterior se reemplaza sola).`
      : `Las habitaciones de su cotización vigente (${names}) NO están disponibles en estas fechas. Díselo claro primero ("no está disponible del … al …") y aclara que su cotización actual sigue vigente; después, si hay, ofrece otras opciones.`
  };
}

// Si se soltó el apartado de la cotización anterior y la nueva no se pudo apartar, se le
// devuelve el suyo (su cotización sigue vigente).
async function restoreHold(record) {
  const rooms = recordRoomsForHold(record);
  if (!rooms.length) return;
  const hold = await createWaHold(record.folio, rooms);
  if (hold.success && !hold.conflicts.length) {
    updateReservation(record.folio, { holdExpiresAt: hold.expiresAt, blockConfirmed: true });
  } else {
    updateReservation(record.folio, { blockConfirmed: false });
    console.warn(`🚨 No se pudo restaurar el apartado de ${record.folio}: queda SIN apartado.`);
  }
}

// ── Ejecutar herramienta ───────────────────────────────────

async function executeTool(toolName, toolInput, userId, userName, opts = {}) {
  console.log(`🔧 ${toolName}`, JSON.stringify(toolInput));
  const contactNumber = String(opts?.contactNumber || '');

  try {
    if (toolName === 'check_availability') {
      const { checkin: rawCheckin, checkout: rawCheckout, room_ids, guests: guestsIn } = toolInput || {};
      // Si el cliente dio un año ya pasado (typo típico: pide "julio 2025" estando en
      // 2026), la hoja no tiene esas filas y TODO saldría "disponible" (falso positivo).
      // Reencuadramos al próximo año válido y avisamos para que el bot confirme fechas.
      const rolled = rollDatesForwardIfPast(rawCheckin, rawCheckout);
      const checkin = rolled.checkin;
      const checkout = rolled.checkout;
      const session = getSession(userId);

      // Personas que cuentan (adultos + niños de 6+). Si el modelo no las manda, las de la sesión.
      const guests = Number(guestsIn) > 0
        ? Math.floor(Number(guestsIn))
        : (Number(session.guests) > 0 ? Number(session.guests) : null);
      if (!guests) {
        return {
          error: 'faltan_personas',
          message: 'Antes de revisar disponibilidad pregunta cuántas personas son (adultos + niños de 6 años o más; los menores de 6 no cuentan).'
        };
      }

      // Con cotización vigente, la página excluye SU propio apartado ('wa-<folio>') para
      // que su suite no le salga "ocupada" al cambiar de fechas o de personas.
      const prev = findActiveQuote(userId, contactNumber);
      const excludeSessionId = ownHoldSessionId(prev);

      const base = await availability.computeAvailability({
        checkin, checkout,
        roomIds: Array.isArray(room_ids) ? room_ids : [],
        guests,
        excludeSessionId,
        datesCorrected: rolled.corrected
      });
      const withOptions = await addGroupOptions(base, {
        guests, checkin, checkout,
        roomIdsGiven: Array.isArray(room_ids) && room_ids.length > 0
      });
      // Cambio de fechas con cotización vigente: se dice en el resultado si SUS habitaciones
      // siguen libres, para que el modelo conteste "sí hay / no hay" sin tener que deducirlo.
      const currentQuote = await describeCurrentQuoteRooms(prev, withOptions, {
        checkin, checkout, roomIds: room_ids, guests, excludeSessionId
      });
      const result = currentQuote ? { ...withOptions, cotizacion_vigente: currentQuote } : withOptions;

      // "Últimas fechas consultadas" (fechas CORREGIDAS) + personas + opciones ofrecidas,
      // para que no se pierdan al truncar el historial. No son fechas confirmadas.
      if (rolled.valid || (isYmdStr(checkin) && isYmdStr(checkout) && checkout > checkin)) {
        updateSession(userId, { checkin, checkout, guests, lastRoomOptions: compactRoomOptions(result?.room_options) });
      }
      return result;
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
      return await createReservationQuote(toolInput || {}, { userId, userName, contactNumber });
    }

  } catch (err) {
    console.error(`❌ Error en ${toolName}:`, err.message);
    return { error: err.message };
  }
}


// ── Cotización de hospedaje (create_reservation_quote) ───────
// Todo el dinero sale del código (pricing.js), nunca del modelo. Antes de crear folio:
// valida datos, decide si reemplaza la cotización anterior y verifica disponibilidad.
// Con folio: aparta 3 h en la página ('wa-<folio>'), reemplaza/libera la anterior y arma
// el resumen que se le manda TAL CUAL al cliente (quote-summary.js).

const NO_DISPONIBLE_MESSAGE = 'Esas habitaciones NO están disponibles en esas fechas. No se generó cotización. Díselo claro al cliente y ofrece otras opciones; su cotización anterior (si tiene) sigue vigente.';

async function buildNoDisponible({ unavailable, checkin, checkout, guests, excludeSessionId, previousQuote, reason = null }) {
  let otherOptions = null;
  try {
    const base = await availability.computeAvailability({ checkin, checkout, guests, excludeSessionId });
    otherOptions = compactAvailabilityForModel(await addGroupOptions(base, { guests, checkin, checkout }));
  } catch (err) {
    console.warn('⚠️ No se pudieron calcular otras opciones:', err.message);
  }
  return {
    error: 'no_disponible',
    quote_created: false,
    ...(reason ? { reason } : {}),
    unavailable,
    message: NO_DISPONIBLE_MESSAGE,
    other_options: otherOptions,
    previous_quote: previousQuote
  };
}

async function createReservationQuote(toolInput, { userId, userName, contactNumber = '' }) {
  const session = getSession(userId);
  const {
    guest_name,
    guest_email,
    how_found,
    rooms: inputRooms,
    checkin: rawCheckin,
    checkout: rawCheckout,
    replaces_previous
  } = toolInput;

  // 1) Nombre completo (mínimo 3 letras). Sin nombre no hay folio.
  const guestName = String(guest_name || '').trim().replace(/\s+/g, ' ');
  if ((guestName.match(/\p{L}/gu) || []).length < 3) {
    return {
      error: 'falta_nombre',
      quote_created: false,
      message: 'Falta el nombre completo del huésped. Pídeselo al cliente (solo el nombre) y vuelve a llamar. No se generó folio.'
    };
  }

  // 2) Fechas: mandan las del modelo (las que el cliente acaba de dar); la sesión solo
  //    rellena si faltan. Antes era al revés y un cambio de fechas se cotizaba con las viejas.
  const { checkin, checkout } = resolveQuoteDates({ rawCheckin, rawCheckout, session });
  if (!isYmdStr(checkin) || !isYmdStr(checkout) || checkout <= checkin) {
    return {
      error: 'fechas_invalidas',
      quote_created: false,
      message: 'Faltan las fechas de llegada y salida (YYYY-MM-DD, salida después de la llegada). Confírmalas con el cliente. No se generó folio.'
    };
  }
  if (checkin < mxTodayYmd()) {
    return {
      error: 'fechas_pasadas',
      quote_created: false,
      message: `La llegada (${checkin}) ya pasó. Confirma con el cliente las fechas correctas y verifica disponibilidad. No se generó folio.`
    };
  }
  const nights = nightsBetween(checkin, checkout);

  // 3) Habitaciones: catálogo, personas por cuarto, fechas por cuarto (split-stay) y precio oficial.
  const list = Array.isArray(inputRooms) ? inputRooms.filter(Boolean) : [];
  if (!list.length) {
    return { error: 'faltan_habitaciones', quote_created: false, message: 'Indica al menos una habitación con sus personas. No se generó folio.' };
  }
  const resolvedRooms = [];
  for (const r of list) {
    const key = r.room_id || r.room_name || '';
    const known = findCatalogRoom(r.room_id) || findCatalogRoom(r.room_name);
    if (!known) {
      return {
        error: 'habitacion_desconocida',
        quote_created: false,
        room: key,
        valid_room_ids: ROOMS.map(x => x.id),
        message: `No existe la habitación "${key}". Usa uno de los IDs oficiales (valid_room_ids). No se generó folio.`
      };
    }
    const g = Number(r.guests);
    if (!Number.isInteger(g) || g < 1) {
      return {
        error: 'huespedes_invalidos',
        quote_created: false,
        room: known.name,
        message: `Indica cuántas personas van en ${known.name} (de 1 a ${known.max_occupancy}). No se generó folio.`
      };
    }
    if (g > known.max_occupancy) {
      return {
        error: 'capacidad_excedida',
        quote_created: false,
        room: known.name,
        guests: g,
        max_occupancy: known.max_occupancy,
        message: `${known.name} admite máximo ${known.max_occupancy} personas (pediste ${g}). Reparte al grupo en más habitaciones (usa room_options de check_availability). No se generó folio.`
      };
    }
    const hasOwnDates = isYmdStr(r.checkin) && isYmdStr(r.checkout) && r.checkout > r.checkin;
    const roomCheckin = hasOwnDates ? r.checkin : checkin;
    const roomCheckout = hasOwnDates ? r.checkout : checkout;
    if (roomCheckin < checkin || roomCheckout > checkout) {
      return {
        error: 'fechas_habitacion_invalidas',
        quote_created: false,
        room: known.name,
        message: `Las fechas de ${known.name} (${roomCheckin} → ${roomCheckout}) quedan fuera de la estancia (${checkin} → ${checkout}). Usa las fechas nuevas del cliente. No se generó folio.`
      };
    }
    const roomNights = nightsBetween(roomCheckin, roomCheckout);
    const pricePerNight = getRoomPricePerNight(known, g);
    resolvedRooms.push({
      id: known.id,
      name: known.name,
      backendName: known.backendName,
      guests: g,
      checkin: roomCheckin,
      checkout: roomCheckout,
      nights: roomNights,
      pricePerNight,
      price: pricePerNight * roomNights
    });
  }
  // Solo hay 1 suite de cada nombre: la misma suite no puede ir dos veces en noches encimadas.
  for (let i = 0; i < resolvedRooms.length; i++) {
    for (let j = i + 1; j < resolvedRooms.length; j++) {
      const a = resolvedRooms[i];
      const b = resolvedRooms[j];
      if (a.id === b.id && a.checkin < b.checkout && b.checkin < a.checkout) {
        return {
          error: 'habitacion_repetida',
          quote_created: false,
          room: a.name,
          message: `${a.name} viene repetida: solo hay una suite con ese nombre. Reparte al grupo en suites distintas (usa room_options). No se generó folio.`
        };
      }
    }
  }

  // Cada noche de la estancia necesita al menos una habitación. Si el modelo movió el
  // checkout global ("una noche más") y dejó las fechas viejas por cuarto, esa noche
  // quedaría sin cobrar, sin verificar y sin apartar.
  const missingNights = [];
  {
    const start = new Date(`${checkin}T12:00:00Z`).getTime();
    for (let i = 0; i < Math.min(nights, 366); i++) {
      const night = new Date(start + i * 86400000).toISOString().slice(0, 10);
      if (!resolvedRooms.some(r => r.checkin <= night && night < r.checkout)) missingNights.push(night);
    }
  }
  if (missingNights.length) {
    return {
      error: 'noches_sin_habitacion',
      quote_created: false,
      missing_nights: missingNights,
      message: `Las habitaciones no cubren todas las noches de la estancia (faltan: ${missingNights.join(', ')}). Usa las fechas nuevas del cliente para cada suite (u omite las fechas por habitación si no es cambio de suite). No se generó folio.`
    };
  }

  // 4) Montos (descuento de grupo, anticipo y saldo) en código.
  const peak = occupancyPeak(resolvedRooms, checkin, checkout);
  const roomsSubtotal = resolvedRooms.reduce((s, r) => s + r.price, 0);
  const amounts = computeQuoteAmounts({ roomsSubtotal, nights, roomsCount: peak.rooms });

  // 5) ¿Reemplaza la cotización anterior o la ve el equipo?
  const prev = findActiveQuote(userId, contactNumber);
  const plan = planSupersede(prev, { replacesPrevious: replaces_previous !== false });
  if (plan.action === 'requires_team') {
    const paid = String(prev.status || '').toUpperCase() === 'PENDIENTE_PAGO';
    return {
      error: 'modificacion_requiere_equipo',
      quote_created: false,
      requires_human: true,
      previous_folio: prev.folio,
      previous_status: paid ? 'comprobante_recibido' : 'reserva_confirmada',
      message: `El cliente ${paid ? 'ya envió su comprobante' : 'ya tiene su reserva confirmada'} (folio ${prev.folio}). Los cambios de fechas, personas o habitaciones los resuelve el equipo: NO generes otra cotización. Dile que le comunicas con el equipo para ajustar su reserva. (Solo si pide una reserva ADICIONAL aparte, vuelve a llamar con replaces_previous:false.)`
    };
  }
  // Solo se excluye el apartado propio cuando esta cotización lo va a reemplazar; una
  // reserva ADICIONAL no puede usar las suites que ya tiene apartadas.
  const ownHold = plan.action === 'supersede' ? ownHoldSessionId(prev) : null;
  const previousQuote = (prev && String(prev.status || '').toUpperCase() === 'PENDIENTE_PAGO' && !prev.proofReceivedAt && !isQuoteStale(prev))
    ? { folio: prev.folio, checkin: prev.checkin, checkout: prev.checkout, total: prev.totalPrice, sigue_vigente: true }
    : null;

  // 6) Verificación OBLIGATORIA de disponibilidad antes de crear folio.
  const verification = await availability.verifyRoomsAvailable({ rooms: resolvedRooms, excludeSessionId: ownHold });
  if (verification.verification_failed) {
    return {
      error: 'verificacion_fallida',
      verification_failed: true,
      quote_created: false,
      reason: verification.reason,
      message: 'NO SE PUDO VERIFICAR la disponibilidad (falla técnica). No se generó cotización. No afirmes ni niegues disponibilidad: dile al cliente que el equipo le confirma en unos minutos.'
    };
  }
  if (!verification.ok) {
    return buildNoDisponible({
      unavailable: verification.unavailable, checkin, checkout, guests: peak.guests,
      excludeSessionId: ownHold, previousQuote
    });
  }

  // 7) Folio.
  const waNumber = waDigitsFor(userId, contactNumber) || null;
  const quote = createQuote({
    userId, userName,
    guestName,
    guestEmail: guest_email || undefined,
    howFound: how_found || 'WhatsApp',
    rooms: resolvedRooms,
    tours: [],
    checkin, checkout, nights,
    roomsTotal: amounts.total,
    toursTotal: 0,
    subtotal: amounts.subtotal,
    discount: amounts.discount,
    totalPrice: amounts.total,
    depositAmount: amounts.deposit,
    saldo: amounts.saldo,
    depositRule: amounts.depositRule,
    waNumber,
    supersedes: plan.action === 'supersede' ? prev.folio : null
  });
  const folio = quote.folio;

  // 8) Apartado de 3 h en la página (una sola llamada con todos los tramos).
  let hold = await createWaHold(folio, resolvedRooms);
  let prevHoldReleased = false;
  if (hold.conflicts.length && ownHold && conflictsTouchRecord(hold.conflicts, prev)) {
    // Choca con el apartado de SU cotización anterior (misma suite, noches encimadas):
    // se suelta el anterior y se reintenta una vez.
    console.log(`🔁 El apartado de ${folio} choca con el apartado propio de ${prev.folio}: se libera y se reintenta.`);
    prevHoldReleased = await releaseWaHold(prev.folio);
    if (prevHoldReleased) hold = await createWaHold(folio, resolvedRooms);
  }
  if (hold.conflicts.length) {
    // Otra sesión apartó esas noches entre la verificación y el apartado: sin folio vigente.
    updateReservation(folio, { status: 'CANCELADA', cancelReason: 'apartado_en_conflicto', blockConfirmed: false, holdConflicts: hold.conflicts });
    console.warn(`⚠️ Cotización ${folio} CANCELADA: el apartado chocó con otra sesión`, JSON.stringify(hold.conflicts));
    if (prevHoldReleased) await restoreHold(prev);
    return buildNoDisponible({
      unavailable: hold.conflicts.map(c => ({ name: c.room, date: c.date })),
      checkin, checkout, guests: peak.guests,
      excludeSessionId: ownHold, previousQuote, reason: 'apartado_en_conflicto'
    });
  }

  const blockConfirmed = hold.success === true;
  const holdExpiresAt = blockConfirmed ? hold.expiresAt : null;
  updateReservation(folio, { holdExpiresAt, blockConfirmed });
  if (blockConfirmed) {
    console.log(`🔒 Apartado ${folio} hasta ${holdExpiresAt || '(sin hora)'} — ${resolvedRooms.map(r => `${r.name} ${r.checkin}→${r.checkout}`).join(', ')}`);
  } else {
    console.warn(`⚠️ Cotización ${folio} SIN apartado confirmado — requiere validación manual.`);
  }

  updateSession(userId, {
    checkin, checkout,
    guests: peak.guests,
    guestName,
    ...(guest_email ? { guestEmail: guest_email } : {}),
    lastFolio: folio
  });

  // 9) Reemplazo: la anterior queda REEMPLAZADA y se libera su apartado.
  let supersededFolio = null;
  if (plan.action === 'supersede' && prev?.folio) {
    const replaced = supersedeQuote(prev.folio, folio);
    if (replaced) {
      supersededFolio = prev.folio;
      if (!prevHoldReleased) await releaseWaHold(prev.folio);
      console.log(`🔁 ${prev.folio} REEMPLAZADA por ${folio}`);
    } else {
      console.warn(`⚠️ No se pudo marcar ${prev.folio} como REEMPLAZADA (cambió de estado).`);
    }
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
          cliente: guestName,
          telefono: '',
          email: guest_email,
          suite: suiteNames,
          checkin,
          checkout,
          noches: nights,
          precioTotal: amounts.total,
          notas: `Cotización generada por WhatsApp · Folio WA: ${folio} · Anticipo $${amounts.deposit.toLocaleString('es-MX')} · Saldo al llegar $${amounts.saldo.toLocaleString('es-MX')}${amounts.discount > 0 ? ` · Descuento de grupo $${amounts.discount.toLocaleString('es-MX')}` : ''}`,
        }),
        signal: AbortSignal.timeout(15000)
      });
      if (cotRes.ok) {
        const cotData = await cotRes.json();
        adminCotizacionId = cotData.id;
        console.log(`📋 Cotización guardada en admin: ${adminCotizacionId}`);

        // 2) Enviar email de cotización
        const emailRes = await fetch(`${BOOKING_API}/api/admin/cotizaciones/${adminCotizacionId}/send-email`, {
          method: 'POST',
          headers: adminHeaders({ 'Content-Type': 'application/json' }),
          signal: AbortSignal.timeout(15000)
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

  // 10) Resumen para el cliente (forma de quote-summary.js) y resultado compacto al modelo.
  const quoteView = {
    folio,
    guestName,
    checkin,
    checkout,
    nights,
    guests: peak.guests,
    rooms: resolvedRooms.map(r => ({
      name: r.name, guests: r.guests, checkin: r.checkin, checkout: r.checkout,
      nights: r.nights, pricePerNight: r.pricePerNight, price: r.price
    })),
    subtotal: amounts.subtotal,
    discount: amounts.discount,
    totalPrice: amounts.total,
    depositAmount: amounts.deposit,
    saldo: amounts.saldo,
    depositRule: amounts.depositRule,
    holdExpiresAt,
    blockConfirmed,
    howFound: how_found || 'WhatsApp',
    guestEmail: guest_email || null,
    supersedes: supersededFolio
  };
  const resumen = buildQuoteSummary(quoteView, { bankInfo: getBankInfo() });

  let holdText = null;
  if (blockConfirmed && holdExpiresAt) {
    const expires = new Date(holdExpiresAt);
    if (!Number.isNaN(expires.getTime())) {
      holdText = `${formatTimeMx(expires)}${mxTodayYmd(expires) === mxTodayYmd() ? ' de hoy' : ` del ${formatDateLongEs(mxTodayYmd(expires))}`}`;
    }
  }

  return {
    quote_created: true,
    folio,
    total: amounts.total,
    anticipo: amounts.deposit,
    saldo: amounts.saldo,
    deposit_rule: amounts.depositRule,
    hold_expires_at: holdText,
    block_confirmed: blockConfirmed,
    superseded_folio: supersededFolio,
    instruccion: 'El sistema ya le envía al cliente el resumen completo de la cotización (habitaciones, total, anticipo, saldo, datos de pago y hora del apartado). Tú responde SOLO 1–2 líneas cálidas, sin repetir montos, folio, CLABE ni fechas.',
    ...(blockConfirmed ? {} : {
      block_warning: 'No se pudo apartar la(s) habitación(es) en el sistema. NO digas que quedó apartada ni pidas el pago: el resumen ya le pide esperar a que el equipo confirme la disponibilidad.'
    }),
    // Solo para handleMessage (se quita antes de mandarlo al modelo).
    _turn: {
      quoteView,
      resumen,
      supersededFolio,
      supersededCheckin: supersededFolio ? prev.checkin || null : null,
      supersededCheckout: supersededFolio ? prev.checkout || null : null
    }
  };
}

// ── Manejar mensaje de texto ───────────────────────────────

// Si el modelo repite la CLABE, el folio, o el total o el saldo de ESA cotización junto
// al resumen, se descarta su texto: el resumen armado en código es la única fuente de esos
// datos. El monto del anticipo sí pasa (el link de pago con tarjeta lo lleva), igual que
// los precios de tours: antes cualquier '$' tiraba la respuesta y el cliente no recibía el link.
const QUOTE_REPEAT_REGEX = /CLABE|WA-[A-Z0-9]{4,}/i;

// "$5,400", "$5400", "5,400.00 MXN" del número n, sin atrapar "$15,400" ni "5,4001".
function amountMentionRegex(n) {
  const body = Number(n).toLocaleString('en-US').replace(/\./g, '\\.').replace(/,/g, ',?');
  return new RegExp(`(?<![\\d.,])\\$?\\s?${body}(?![,.]?\\d{3})(?!\\d)`);
}

function repeatsQuoteData(text, quoteView) {
  const t = String(text || '');
  if (QUOTE_REPEAT_REGEX.test(t)) return true;
  const deposit = Number(quoteView?.depositAmount);
  return [quoteView?.totalPrice, quoteView?.saldo]
    .map(Number)
    .filter(n => Number.isFinite(n) && n > 0 && n !== deposit)
    .some(n => amountMentionRegex(n).test(t));
}
const QUOTE_FALLBACK_LINE = '¿Tienes alguna duda sobre tu reserva? 🌿';
// Sin apartado confirmado el resumen ya dice "todavía no hagas el pago": el modelo no debe contradecirlo.
const QUOTE_NO_HOLD_LINE = 'Nuestro equipo te confirma la disponibilidad en unos minutos y te avisamos por aquí. 🌿';
const HUMAN_ESCALATION_TEXT = 'Te comunico con nuestro equipo, en breve te contactan. 🤝📞';

// Extractor de fechas para shouldBypassShortcuts: el de este archivo + "del 9 al 11" sin mes.
const extractDatesForBypass = (t) => [...extractDates(t), ...detectDateMentions(t)];

/**
 * @param {string} userId
 * @param {string} userText
 * @param {string} [userName]
 * @param {{ contactNumber?: string }} [opts]  número real del cliente (chats @lid)
 * @returns {Promise<null | { text: string, requiresHumanIntervention: boolean,
 *   requiresTourNotification: boolean, quoteCreated: boolean, quoteFolio: string|null,
 *   quoteBlockConfirmed: boolean|null, quote: object|null, supersededFolio: string|null,
 *   supersededCheckin: string|null, supersededCheckout: string|null }>}
 */
export async function handleMessage(userId, userText, userName = '', opts = {}) {
  const contactNumber = String(opts?.contactNumber || '');

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

  // Forma FIJA del resultado (contrato con index.js).
  const buildResult = ({ text, requiresHumanIntervention = false, requiresTourNotification = false, turnQuote = null }) => ({
    text,
    requiresHumanIntervention: Boolean(requiresHumanIntervention),
    requiresTourNotification: Boolean(requiresTourNotification),
    quoteCreated: Boolean(turnQuote),
    quoteFolio: turnQuote?.quoteView?.folio || null,
    quoteBlockConfirmed: turnQuote ? turnQuote.quoteView.blockConfirmed !== false : null,
    quote: turnQuote?.quoteView || null,
    supersededFolio: turnQuote?.supersededFolio || null,
    supersededCheckin: turnQuote?.supersededCheckin || null,
    supersededCheckout: turnQuote?.supersededCheckout || null
  });

  const incomingText = typeof userText === 'string' ? userText.trim() : String(userText || '').trim();
  if (!incomingText) {
    return buildResult({ text: withDisclosure('¿Me compartes tu mensaje en texto para ayudarte mejor? 🌿') });
  }

  // Un mensaje con fechas o personas (o, con cotización vigente, que habla de cambiar
  // fechas) salta los atajos fijos y la confirmación de fechas: lo resuelve el modelo con
  // check_availability. La petición de hablar con una persona se respeta siempre.
  const { stage } = deriveConversationStage(userId, { contactNumber });
  const bypassShortcuts = shouldBypassShortcuts(incomingText, { stage, extractDates: extractDatesForBypass });

  if (!bypassShortcuts) {
    const parsedDates = parseDateIntent(incomingText, history);
    if (parsedDates?.confidence === 'medium' && parsedDates?.needsConfirmation) {
      const confirmationText = `Perfecto, déjame confirmar:\n📅 Llegada: *${formatDateEs(parsedDates.checkin)}*\n📅 Salida: *${formatDateEs(parsedDates.checkout)}*\n\n¿Correcto? ✅`;
      history.push({ role: 'user', content: incomingText });
      history.push({ role: 'assistant', content: confirmationText });
      while (history.length > MAX_HISTORY) history.shift();
      return buildResult({ text: withDisclosure(confirmationText) });
    }
  }

  const deterministicResponse = bypassShortcuts
    ? (HUMAN_REQUEST_REGEX.test(incomingText) ? HUMAN_ESCALATION_TEXT : null)
    : getDeterministicResponse(incomingText, session, { stage });
  if (deterministicResponse) {
    // El aviso al equipo de tours se calcula ANTES del pie de contacto.
    const tourNotify = wantsTourBooking(incomingText, deterministicResponse);
    const replyText = ensureToursContact(deterministicResponse);
    history.push({ role: 'user', content: incomingText });
    history.push({ role: 'assistant', content: replyText });
    while (history.length > MAX_HISTORY) history.shift();
    console.log(`💬 [${userName || userId}]: ${incomingText}`);
    console.log(`🤖 → ${replyText.slice(0, 100)}...`);
    return buildResult({
      text: withDisclosure(replyText),
      requiresHumanIntervention: needsHumanIntervention(incomingText, replyText),
      requiresTourNotification: tourNotify
    });
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
    sessionLines.push(`📅 Últimas fechas consultadas: check-in ${session.checkin}, check-out ${session.checkout}. Úsalas solo si el cliente no ha dado otras; si menciona fechas nuevas, mandan las nuevas y hay que verificar disponibilidad otra vez.`);
  }
  if (Number(session.guests) > 0) sessionLines.push(`👥 Personas de la última consulta: ${session.guests}.`);
  if (Array.isArray(session.lastRoomOptions) && session.lastRoomOptions.length) {
    sessionLines.push(`Opciones ofrecidas: ${session.lastRoomOptions.join(' | ')}`);
  }
  const stageForEngine = deriveConversationStage(userId, { contactNumber }).stage;
  if (session.checkin && session.checkout && !['cotizacion_pendiente_pago', 'pago_en_verificacion', 'reserva_confirmada'].includes(stageForEngine)) {
    sessionLines.push(`Solo si el cliente pide pagar con tarjeta o reservar en línea, el link del motor con sus fechas es: https://paraisoencantado.com/reservar?checkin=${session.checkin}&checkout=${session.checkout}`);
  }
  if (session.guestName) sessionLines.push(`Nombre del huésped: ${session.guestName}.`);
  if (session.guestEmail) sessionLines.push(`Email del huésped: ${session.guestEmail}.`);
  const dynamicContext = `Hoy es ${hoy} (${mxTodayISO()}). Usa esta fecha como referencia para calcular disponibilidad, cancelaciones y plazos.
📅 CALENDARIO PRÓXIMOS 14 DÍAS (día de semana = fecha exacta): ${buildUpcomingCalendarLine()}
⚠️ FECHAS RELATIVAS: cuando el cliente diga "hoy", "mañana", "este viernes", "el próximo sábado", etc., NO calcules el día tú: búscalo en el calendario de arriba y usa esa fecha exacta. Al confirmar o cotizar menciona SIEMPRE día de semana + número + mes (p. ej. "viernes 24 de julio") y verifica que coincidan con el calendario.
⚠️ FECHAS: nunca cotices ni afirmes disponibilidad para fechas en el pasado. Si el cliente da un año que ya pasó (p. ej. pide "julio 2025" estando en un año posterior), es casi siempre un error de dedo: interprétalo como la próxima ocurrencia de esa fecha (el año en curso o el siguiente) y CONFIRMA con el cliente las fechas exactas antes de avanzar. Si check_availability devuelve \`dates_corrected: true\`, dile explícitamente al cliente las fechas corregidas (check-in y check-out) que estás cotizando.${userName ? `\nEl huésped se llama *${userName}*.` : ''}${sessionLines.length ? '\n' + sessionLines.join('\n') : ''}${buildStageLine(userId, { contactNumber })}`;

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
  // (confirmaciones, "mi folio es WA-...", etc.). Si hubo varias, cuenta la última.
  let turnQuote = null;
  let toolNeedsHuman = false; // alguna herramienta no pudo verificar → escalar sí o sí

  // Texto final del turno: resumen de la cotización (si hubo) + 1–2 líneas del modelo,
  // pie de tours si aplica, y al historial el texto combinado (Camila recuerda folio y montos).
  const finalize = (modelText, { fallback, forceHuman = false } = {}) => {
    const cleanModelText = String(modelText || '').trim();
    // Aviso al equipo de tours sobre el texto del cliente/modelo, ANTES del pie.
    const tourNotify = wantsTourBooking(incomingText, cleanModelText);
    let combined;
    if (turnQuote) {
      const line = turnQuote.quoteView?.blockConfirmed === false
        ? QUOTE_NO_HOLD_LINE
        : ((!cleanModelText || repeatsQuoteData(cleanModelText, turnQuote.quoteView)) ? QUOTE_FALLBACK_LINE : cleanModelText);
      combined = `${turnQuote.resumen}\n\n${line}`;
    } else {
      combined = cleanModelText || fallback || 'Hubo un problema temporal al responder. ¿Me repites tu mensaje, por favor? 🌿';
    }
    combined = ensureToursContact(combined);
    effectiveHistory.push({ role: 'assistant', content: combined });
    return buildResult({
      text: withDisclosure(combined),
      requiresHumanIntervention: forceHuman || toolNeedsHuman || needsHumanIntervention(incomingText, cleanModelText),
      requiresTourNotification: tourNotify,
      turnQuote
    });
  };

  while (true) {
    iterations++;
    const safeMessages = sanitizeMessagesPayload(messages);
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5', // Sonnet 5: mejor razonamiento (menos errores de contexto/cálculo del reporte). Antes claude-haiku-4-5.
      max_tokens: 3000, // subido de 1500: cotizaciones con varias suites y el split-stay generan JSON de herramienta grande y se truncaban → respuesta vacía → "Hubo un problema temporal". El costo solo aplica a lo que realmente genera.
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
          return finalize(partialText);
        }
        console.warn('⚠️ Claude devolvió stop_reason=tool_use pero sin bloques tool_use; se omite ese turno.');
        return finalize('', { fallback: 'Hubo un problema temporal al procesar tu solicitud. ¿Me lo repites por favor? 🌿' });
      }
      messages.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const tb of toolUseBlocks) {
        const result = await executeTool(tb.name, tb.input, userId, userName, { contactNumber });
        // Lo interno del turno (resumen, quote para el aviso al grupo) NO va al modelo.
        let forModel = result;
        if (result && typeof result === 'object' && result._turn) {
          const { _turn, ...rest } = result;
          forModel = rest;
          // Registrar cotización realmente creada (folio nuevo, sin error).
          if (tb.name === 'create_reservation_quote' && rest.quote_created && rest.folio) turnQuote = _turn;
        }
        // Una herramienta que no pudo verificar, una cotización que salió sin apartado o un
        // cambio que le toca al equipo siempre pasa a manos humanas.
        if (forModel && (forModel.verification_failed || forModel.block_confirmed === false || forModel.requires_human)) {
          toolNeedsHuman = true;
        }
        toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify(forModel) });
      }
      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }

      // Salvaguarda anti-bucle: si se excede el tope de iteraciones, escalar a humano.
      if (iterations >= MAX_TOOL_ITERATIONS) {
        console.warn(`⚠️ Tope de iteraciones (${MAX_TOOL_ITERATIONS}) alcanzado; escalando a humano.`);
        const partial = response.content.find(b => b.type === 'text')?.text?.trim()
          || 'Déjame confirmar unos detalles con el equipo y te respondo en breve. 🌿';
        return finalize(partial, { forceHuman: true });
      }

      continue;
    }

    // end_turn — y CUALQUIER otro stop_reason (max_tokens, stop_sequence, refusal,
    // pause_turn): devolver el texto disponible y terminar. NUNCA repetir el request,
    // para evitar bucles infinitos y costo descontrolado de API.
    const text = response.content.find(b => b.type === 'text')?.text?.trim() || '';
    if (response.stop_reason && response.stop_reason !== 'end_turn') {
      console.warn(`⚠️ stop_reason inesperado: ${response.stop_reason} — devolviendo texto disponible.`);
    }
    console.log(`🤖 → ${(text || '(sin texto)').slice(0, 100)}...`);
    // Detector de cotización fantasma: la respuesta menciona un folio pero la
    // herramienta create_reservation_quote NUNCA corrió en esta interacción →
    // no hay bloqueo de habitación, ni registro, ni aviso al grupo. (Pasó el
    // 20 jul 2026: folio inventado WA-MC072026.)
    // El placeholder literal "WA-XXXXXXXX" (con el que Camila le PIDE el folio al
    // cliente) no es una cotización inventada — excluirlo o la alerta se vuelve ruido.
    const folioMatches = (text.match(/\bWA-[A-Z0-9]{4,}\b/gi) || [])
      .filter(f => !/^WA-X+$/i.test(f));
    if (!turnQuote && folioMatches.length > 0) {
      const fake = folioMatches[0];
      let known = null;
      try { known = getByFolio(fake); } catch { /* sin registro local */ }
      if (!known) {
        console.warn(`🚨 COTIZACIÓN FANTASMA: Camila mencionó el folio ${fake} SIN ejecutar create_reservation_quote (sin bloqueo, sin registro, sin aviso al grupo).`);
      }
    }
    return finalize(text);
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

// ── Folio de la sesión ─────────────────────────────────────
// (Los comprobantes de pago ya no pasan por aquí: los atiende proof-handler.js.)

/** Folio de la última cotización creada en la sesión de este chat, o null. */
export function getSessionFolio(userId) {
  return sessionData.get(userId)?.lastFolio || null;
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

// ── Solo para pruebas (tests/handler-integration.test.js) ────
// Expone funciones internas sin cambiar el comportamiento del bot.
export const __test = {
  executeTool,
  getDeterministicResponse,
  deriveConversationStage,
  buildStageLine,
  repeatsQuoteData,
  /** Reemplaza el cliente de Anthropic por uno falso (sin red). */
  setAnthropicClient(client) { anthropic = client; },
  /** Limpia historial, sesiones y el caché del interruptor del bot. */
  resetState() {
    conversations.clear();
    sessionData.clear();
    botEnabledCache = { value: true, expiresAt: 0 };
  }
};
