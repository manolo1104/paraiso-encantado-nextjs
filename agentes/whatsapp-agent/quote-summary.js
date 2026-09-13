/**
 * quote-summary.js
 * Textos de una cotización de WhatsApp armados en código (no por el modelo):
 *  - buildQuoteSummary: el resumen que se le manda TAL CUAL al cliente.
 *  - buildQuoteGroupAlert: el aviso al grupo Control Hotel.
 * Así el total, el anticipo, el saldo y la hora del apartado siempre cuadran
 * con lo que quedó guardado en el folio.
 */

import {
  formatMXN, formatMoney, formatDateLongEs, formatTimeMx, mxTodayYmd, nightsBetween, plural,
} from './format-mx.js';
import { GROUP_DISCOUNT_RATE } from './pricing.js';

// Horarios del hotel (hotel-knowledge.js: "Check-in: 3:00 PM | Check-out: 12:00 PM")
export const CHECKIN_TIME_TEXT = '3:00 p.m.';
export const CHECKOUT_TIME_TEXT = '12:00 p.m.';

/**
 * Forma de la cotización que reciben estas funciones (la guarda reservations.js):
 *
 * @typedef {Object} QuoteRoom
 * @property {string} name
 * @property {number} guests
 * @property {string} [checkin]        "YYYY-MM-DD" (split-stay: fechas del tramo)
 * @property {string} [checkout]       "YYYY-MM-DD"
 * @property {number} [nights]
 * @property {number} [pricePerNight]
 * @property {number} [price]          total de ese cuarto en su tramo
 *
 * @typedef {Object} Quote
 * @property {string} folio            "WA-XXXX"
 * @property {string} guestName
 * @property {string} checkin          "YYYY-MM-DD" (primera llegada)
 * @property {string} checkout         "YYYY-MM-DD" (última salida)
 * @property {number} nights
 * @property {number} guests
 * @property {QuoteRoom[]} rooms
 * @property {number} subtotal         hospedaje antes de descuento
 * @property {number} discount         descuento de grupo (0 si no aplica)
 * @property {number} totalPrice
 * @property {number} depositAmount
 * @property {number} saldo
 * @property {'grupo'|'una_noche'|'50'} depositRule
 * @property {string|null} holdExpiresAt  ISO de fin del apartado (null si no hay)
 * @property {boolean} blockConfirmed     false = la suite NO quedó apartada
 * @property {string} [howFound]
 * @property {string} [guestEmail]
 * @property {string} [supersedes]        folio al que reemplaza
 *
 * @typedef {Object} BankInfo            (mismas llaves que reservations.js)
 * @property {string} [banco]
 * @property {string} [titular]
 * @property {string} [clabe]
 * @property {string} [cuenta]            tarjeta/cuenta para depósito en OXXO
 */

const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

// "2026-10-09" → "vie 9" (con mes si se pide: "vie 9 oct"). Hecho a mano para que
// no cambie entre versiones de Node/ICU.
function formatDateShortEs(ymd, { withMonth = false } = {}) {
  if (!isYmd(ymd)) return String(ymd || '');
  const d = new Date(`${ymd}T12:00:00Z`);
  const base = `${WEEKDAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()}`;
  return withMonth ? `${base} ${MONTHS_SHORT[d.getUTCMonth()]}` : base;
}

// "del vie 9 al sáb 10" (con mes si el tramo cruza de mes)
function formatRangeShortEs(checkin, checkout) {
  const withMonth = String(checkin).slice(0, 7) !== String(checkout).slice(0, 7);
  return `del ${formatDateShortEs(checkin, { withMonth })} al ${formatDateShortEs(checkout, { withMonth })}`;
}

function quoteRooms(quote) {
  return Array.isArray(quote?.rooms) ? quote.rooms.filter(Boolean) : [];
}

// Alguna habitación tiene fechas propias distintas al rango global
function isSplitStay(quote) {
  return quoteRooms(quote).some(r =>
    (isYmd(r.checkin) && r.checkin !== quote.checkin) ||
    (isYmd(r.checkout) && r.checkout !== quote.checkout)
  );
}

function quoteNights(quote) {
  const n = Number(quote?.nights);
  return n > 0 ? n : nightsBetween(quote?.checkin, quote?.checkout);
}

// Personas del grupo. En split-stay los tramos son las MISMAS personas, así que el
// respaldo solo suma los cuartos que arrancan la primera noche.
function quoteGuests(quote) {
  const n = Number(quote?.guests);
  if (n > 0) return n;
  const rooms = quoteRooms(quote);
  const firstNight = rooms.filter(r => !isYmd(r.checkin) || r.checkin === quote.checkin);
  return (firstNight.length ? firstNight : rooms).reduce((s, r) => s + (Number(r.guests) || 0), 0);
}

function roomNights(room, quote) {
  const n = Number(room.nights);
  if (n > 0) return n;
  const fromDates = nightsBetween(room.checkin, room.checkout);
  return fromDates > 0 ? fromDates : quoteNights(quote);
}

function roomAmounts(room, quote) {
  const nights = roomNights(room, quote);
  let perNight = Number(room.pricePerNight) || 0;
  let price = Number(room.price) || 0;
  if (!price && perNight) price = perNight * nights;
  if (!perNight && price && nights) perNight = Math.round(price / nights);
  return { nights, perNight, price };
}

function amounts(quote) {
  const total = Math.max(0, Number(quote?.totalPrice) || 0);
  const deposit = Math.max(0, Number(quote?.depositAmount) || 0);
  const discount = Math.max(0, Number(quote?.discount) || 0);
  const subtotal = Number(quote?.subtotal) > 0 ? Number(quote.subtotal) : total + discount;
  const saldo = quote?.saldo != null && Number.isFinite(Number(quote.saldo))
    ? Math.max(0, Number(quote.saldo))
    : Math.max(0, total - deposit);
  return { total, deposit, discount, subtotal, saldo };
}

const discountPercentText = () => `${Math.round(GROUP_DISCOUNT_RATE * 100)}%`;

// "· Suite Jungla (2 personas) [del vie 9 al sáb 10] — $1,900 × 2 noches = $3,800"
function roomLine(room, quote, split) {
  const { nights, perNight, price } = roomAmounts(room, quote);
  const guests = Number(room.guests) || 0;
  const who = guests > 0 ? ` (${plural(guests, 'persona')})` : '';
  const dates = split && isYmd(room.checkin) && isYmd(room.checkout)
    ? ` ${formatRangeShortEs(room.checkin, room.checkout)}`
    : '';
  const money = perNight
    ? ` — ${formatMoney(perNight)} × ${plural(nights, 'noche')} = ${formatMoney(price)}`
    : (price ? ` — ${formatMoney(price)}` : '');
  return `· ${room.name || 'Habitación'}${who}${dates}${money}`;
}

function holdTimeParts(holdExpiresAt) {
  if (!holdExpiresAt) return null;
  const d = new Date(holdExpiresAt);
  if (Number.isNaN(d.getTime())) return null;
  const time = formatTimeMx(d);
  // "hasta la 1:15 p.m." / "hasta las 6:45 p.m."
  const article = /^1:/.test(time) ? 'la' : 'las';
  return { time, article, ymd: mxTodayYmd(d) };
}

// 16 dígitos (tarjeta) en bloques de 4 para dictarlo en la caja; lo demás tal cual.
function formatCardNumber(value) {
  const digits = String(value || '').replace(/\s+/g, '');
  return /^\d{16}$/.test(digits) ? digits.replace(/(\d{4})(?=\d)/g, '$1 ') : String(value || '').trim();
}

function paymentBlock(bankInfo, folio) {
  const banco = String(bankInfo?.banco || '').trim();
  const titular = String(bankInfo?.titular || '').trim();
  const clabe = String(bankInfo?.clabe || '').trim();
  const cuenta = String(bankInfo?.cuenta || '').trim();
  if (!clabe && !cuenta) return [];

  const lines = ['*Datos para tu pago:*'];
  if (clabe) {
    const parts = [`🏦 Transferencia SPEI${banco ? ` — ${banco}` : ''}`];
    if (titular) parts.push(`Titular: ${titular}`);
    parts.push(`CLABE: ${clabe}`);
    lines.push(parts.join(' · '));
  }
  if (cuenta) {
    const holder = !clabe && titular ? ` · Titular: ${titular}` : '';
    lines.push(`🏪 Depósito en OXXO: ${formatCardNumber(cuenta)}${holder}`);
  }
  if (folio) lines.push(`📝 Concepto: ${folio}`);
  return lines;
}

/**
 * Resumen de cotización para el cliente (se manda tal cual por WhatsApp).
 * @param {Quote} quote
 * @param {{ bankInfo?: BankInfo, now?: Date }} [opts]
 * @returns {string}
 */
export function buildQuoteSummary(quote, { bankInfo, now = new Date() } = {}) {
  const q = quote || {};
  const rooms = quoteRooms(q);
  const split = isSplitStay(q);
  const nights = quoteNights(q);
  const guests = quoteGuests(q);
  const { total, deposit, discount, subtotal, saldo } = amounts(q);
  const blockFailed = q.blockConfirmed === false;

  const lines = [];
  lines.push(q.folio ? `🧾 *Tu cotización — Folio ${q.folio}*` : '🧾 *Tu cotización*');
  lines.push('');
  if (q.guestName) lines.push(`👤 A nombre de: *${q.guestName}*`);
  if (isYmd(q.checkin)) lines.push(`📅 Llegada: *${formatDateLongEs(q.checkin)}* (check-in ${CHECKIN_TIME_TEXT})`);
  if (isYmd(q.checkout)) lines.push(`📅 Salida: *${formatDateLongEs(q.checkout)}* (check-out ${CHECKOUT_TIME_TEXT})`);
  const stayBits = [];
  if (nights > 0) stayBits.push(`🌙 ${plural(nights, 'noche')}`);
  if (guests > 0) stayBits.push(`👥 ${plural(guests, 'persona')}`);
  if (stayBits.length) lines.push(stayBits.join(' · '));

  if (rooms.length) {
    lines.push('');
    lines.push('🏨 *Hospedaje:*');
    for (const room of rooms) lines.push(roomLine(room, q, split));
    if (discount > 0) {
      lines.push(`· Subtotal: ${formatMoney(subtotal)}  ·  Descuento de grupo (${discountPercentText()}): −${formatMoney(discount)}`);
    }
  }

  lines.push('');
  lines.push(`💰 *Total: ${formatMXN(total)}*`);
  if (q.depositRule === 'una_noche') {
    lines.push(`💳 *Pago para reservar: ${formatMXN(deposit)}* (100%, estancia de 1 noche)`);
  } else if (q.depositRule === 'grupo') {
    lines.push(`💳 *Anticipo para apartar (grupo): ${formatMXN(deposit)}*`);
  } else if (q.depositRule === '50') {
    lines.push(`💳 *Anticipo para apartar: ${formatMXN(deposit)}* (50%)`);
  } else if (total > 0 && deposit >= total) {
    lines.push(`💳 *Pago para reservar: ${formatMXN(deposit)}* (100%)`);
  } else {
    lines.push(`💳 *Anticipo para apartar: ${formatMXN(deposit)}*`);
  }
  lines.push(saldo > 0
    ? `🏡 *Saldo a pagar al llegar al hotel: ${formatMXN(saldo)}*`
    : '🏡 *Saldo al llegar: $0* (queda pagado completo)');

  const distinctRooms = new Set(rooms.map(r => r.name)).size;
  const what = distinctRooms > 1 ? 'las habitaciones' : 'la habitación';

  lines.push('');
  if (blockFailed) {
    // Sin apartado no hay que cobrar: el equipo valida la disponibilidad primero.
    lines.push(`⚠️ Aún no pude apartar ${what} en el sistema. *Todavía no hagas el pago*: nuestro equipo te confirma la disponibilidad en unos minutos. 🙏`);
    return lines.join('\n');
  }

  lines.push('✅ Tu reserva queda *confirmada* cuando nos envíes tu comprobante de pago y nuestro equipo lo verifique.');
  const hold = holdTimeParts(q.holdExpiresAt);
  if (hold) {
    const when = hold.ymd === mxTodayYmd(now) ? 'de hoy' : `del ${formatDateLongEs(hold.ymd)}`;
    lines.push(`⏳ Te apartamos ${what} hasta ${hold.article} *${hold.time}* ${when}.`);
  }

  const payment = paymentBlock(bankInfo, q.folio);
  if (payment.length) {
    lines.push('');
    lines.push(...payment);
  }

  lines.push('');
  lines.push('📲 Cuando pagues, mándame aquí la *foto o el PDF de tu comprobante*.');
  return lines.join('\n');
}

/**
 * Aviso de cotización nueva para el grupo Control Hotel.
 * @param {Quote} quote
 * @param {{ userName?: string, waDigits?: string, supersededFolio?: string,
 *           supersededCheckin?: string, supersededCheckout?: string }} [opts]
 * @returns {string}
 */
export function buildQuoteGroupAlert(quote, {
  userName, waDigits, supersededFolio, supersededCheckin, supersededCheckout,
} = {}) {
  const q = quote || {};
  const rooms = quoteRooms(q);
  const split = isSplitStay(q);
  const nights = quoteNights(q);
  const guests = quoteGuests(q);
  const { total, deposit, discount, subtotal, saldo } = amounts(q);

  const guestName = String(q.guestName || '').trim();
  const waName = String(userName || '').trim();
  let clientText = guestName || waName || 'Sin nombre';
  if (guestName && waName && guestName.toLowerCase() !== waName.toLowerCase()) {
    clientText += ` · WhatsApp: ${waName}`;
  }
  const digits = String(waDigits || '').replace(/\D/g, '');

  const lines = ['📋 *NUEVA COTIZACIÓN — WhatsApp*', ''];
  lines.push(`👤 *Cliente:* ${clientText}`);
  lines.push(digits ? `📱 *WhatsApp:* +${digits} · wa.me/${digits}` : '📱 *WhatsApp:* (sin número)');
  if (q.guestEmail) lines.push(`📧 *Email:* ${q.guestEmail}`);
  if (q.howFound) lines.push(`🔎 *Nos encontró por:* ${q.howFound}`);

  lines.push('');
  lines.push(`🧾 *Folio:* ${q.folio || '—'}`);
  lines.push(`📅 *Check-in:* ${isYmd(q.checkin) ? formatDateLongEs(q.checkin) : '—'}  |  *Check-out:* ${isYmd(q.checkout) ? formatDateLongEs(q.checkout) : '—'}`);
  lines.push(`🌙 *Noches:* ${nights > 0 ? nights : '—'}  ·  👥 *Huéspedes:* ${guests > 0 ? guests : '—'}`);
  if (split) lines.push('⚠️ *Estancia con cambio de suite* (fechas por suite abajo)');

  lines.push('');
  lines.push('🏨 *Habitaciones:*');
  if (rooms.length) {
    for (const room of rooms) lines.push(roomLine(room, q, split));
  } else {
    lines.push('(ver folio)');
  }

  lines.push('');
  if (discount > 0) {
    lines.push(`🧮 *Subtotal:* ${formatMXN(subtotal)}  ·  🎁 *Descuento de grupo (${discountPercentText()}):* −${formatMXN(discount)}`);
  }
  lines.push(`💰 *Total: ${formatMXN(total)}*`);
  const ruleText = q.depositRule === 'grupo' ? ' (grupo)'
    : q.depositRule === 'una_noche' ? ' (100%, 1 noche)'
      : q.depositRule === '50' ? ' (50%)' : '';
  lines.push(`💳 *Anticipo: ${formatMXN(deposit)}*${ruleText}`);
  lines.push(`🏡 *Saldo al llegar: ${formatMXN(saldo)}*`);

  lines.push('');
  if (q.blockConfirmed === false) {
    // Sin bloqueo confirmado la suite NO está apartada: cualquiera puede
    // reservarla por el motor web mientras el cliente decide.
    lines.push('🚨 *SIN BLOQUEO CONFIRMADO* — la(s) suite(s) NO quedaron apartadas.');
    lines.push('👉 Validen disponibilidad a mano ANTES de aceptar el pago.');
  } else {
    const hold = holdTimeParts(q.holdExpiresAt);
    lines.push(hold
      ? `⏳ *Apartado hasta:* ${hold.time} del ${formatDateLongEs(hold.ymd)}`
      : '⏳ *Apartado:* confirmado (sin hora de vencimiento)');
  }

  if (supersededFolio) {
    const before = isYmd(supersededCheckin) && isYmd(supersededCheckout)
      ? ` (antes ${formatDateLongEs(supersededCheckin)} → ${formatDateLongEs(supersededCheckout)})`
      : '';
    lines.push(`🔁 *Reemplaza folio:* ${supersededFolio}${before} — apartado anterior liberado`);
  }

  return lines.join('\n');
}
