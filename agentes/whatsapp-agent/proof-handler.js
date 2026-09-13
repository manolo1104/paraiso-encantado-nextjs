/**
 * proof-handler.js
 * Comprobantes de pago (imagen o PDF) que manda el cliente por WhatsApp.
 *
 * Flujo: llega el archivo → se ubica su cotización (folio de la sesión → usuario →
 * teléfono) → se marca el comprobante en el folio → aviso con contexto al grupo
 * Control Hotel y al número del hotel (+ el archivo al hotel) → acuse al cliente con
 * total, anticipo y saldo, y "el equipo verifica y te enviamos la confirmación".
 *
 * Sin WhatsApp ni red: los envíos y el almacén de reservas se inyectan, para poder
 * probarlo con dobles. Los textos son funciones puras exportadas.
 */

import { formatMXN, formatMoney, formatDateLongEs, formatTimeMx, mxTodayYmd, nightsBetween, plural } from './format-mx.js';
import { digitsOnly, extractDigitsFromJid, normalizeMxCandidates, last10 } from './phone.js';

// ── Clasificación del archivo que llega ─────────────────────

const FISCAL_RE = /constancia|situaci[oó]n fiscal|\brfc\b|factura|cfdi/i;
// "pag" suelto atrapaba «pagina» y «pagar»: solo formas de YA haber pagado, con límites
// Unicode (\b de JS no sirve después de «é», así que «ya pagué» no entraría con \b).
const PAYMENT_RE = /(?<![\p{L}])pag(?:o|os|u[eé]|ad[oa]s?|amos|aron|aste)(?![\p{L}])|comprobante|transfer|dep[oó]sit|spei|oxxo|ticket|recibo|voucher/iu;
const BARE_FILENAME_RE = /^[^\s/\\]+\.(jpe?g|png|webp|heic|heif|pdf)$/i;

/** 'image/jpeg' → 'image', 'application/pdf' → 'pdf', lo demás → null */
export function mediaKind(mimetype) {
  const m = String(mimetype || '').toLowerCase().trim();
  if (m.startsWith('image/')) return 'image';
  if (m === 'application/pdf' || m.startsWith('application/pdf;')) return 'pdf';
  return null;
}

/**
 * ¿Qué hacer con un archivo entrante?
 *   'proof'       → comprobante: se procesa con createProofProcessor
 *   'text'        → se contesta como texto usando el caption
 *   'unsupported' → "solo leo texto, imágenes o PDF"
 * messageType (opcional, msg.type de whatsapp-web.js): un 'sticker' llega como
 * image/webp y no es un comprobante.
 */
export function classifyIncomingMedia({ mimetype, caption, hasPendingQuote = false, messageType } = {}) {
  // Un documento sin texto suele traer como body solo su nombre ("IMG_2034.jpg"): eso no es caption.
  const rawCap = String(caption || '').trim();
  const cap = BARE_FILENAME_RE.test(rawCap) && !PAYMENT_RE.test(rawCap) && !FISCAL_RE.test(rawCap) ? '' : rawCap;
  const kind = String(messageType || '').toLowerCase() === 'sticker' ? null : mediaKind(mimetype);
  if (!kind) return cap ? 'text' : 'unsupported';
  // Constancia fiscal / factura: es un trámite, no un pago. Pero si el texto también
  // habla del pago («te envío el comprobante, ¿me pueden facturar?») es un comprobante.
  if (cap && FISCAL_RE.test(cap) && !PAYMENT_RE.test(cap)) return 'text';
  if (hasPendingQuote || !cap || PAYMENT_RE.test(cap)) return 'proof';
  return cap ? 'text' : 'unsupported';
}

// ── Búsqueda de la cotización activa ────────────────────────

const isActiveQuote = (r) => Boolean(r && r.status === 'PENDIENTE_PAGO');

/**
 * Cotización PENDIENTE_PAGO de este chat, o null. Nunca devuelve REEMPLAZADA.
 * Orden: 1) folio de la sesión, 2) userId, 3) teléfono (contactNumber y dígitos del
 * userId, porque el mismo cliente puede llegar como @lid o como @c.us).
 * repo = { getByFolio, getByUser, findLatestPendingByPhone, normalizeMxCandidates?, extractDigitsFromJid? }
 */
export function findActiveQuoteForChat({ userId, contactNumber, sessionFolio } = {}, repo = {}) {
  if (sessionFolio && typeof repo.getByFolio === 'function') {
    const r = repo.getByFolio(sessionFolio);
    if (isActiveQuote(r)) return r;
  }
  if (userId && typeof repo.getByUser === 'function') {
    const r = repo.getByUser(userId);
    if (isActiveQuote(r)) return r;
  }
  if (typeof repo.findLatestPendingByPhone === 'function') {
    const toCandidates = repo.normalizeMxCandidates || normalizeMxCandidates;
    const jidDigits = repo.extractDigitsFromJid || extractDigitsFromJid;
    const candidates = new Set([
      ...toCandidates(contactNumber || ''),
      ...(userId ? toCandidates(jidDigits(userId)) : []),
    ]);
    if (candidates.size) {
      const r = repo.findLatestPendingByPhone([...candidates]);
      if (isActiveQuote(r)) return r;
    }
  }
  return null;
}

// ── Helpers de texto ────────────────────────────────────────

function firstName(...names) {
  for (const raw of names) {
    const word = String(raw || '').trim().split(/\s+/)[0] || '';
    const clean = word.replace(/[^\p{L}'-]/gu, '');
    if (clean.length >= 2) return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return '';
}

function roomsOf(r) {
  if (Array.isArray(r?.rooms) && r.rooms.length) return r.rooms.filter(Boolean);
  return r?.room ? [r.room] : [];
}

function isSplitStay(r) {
  return roomsOf(r).some(x =>
    (x.checkin && x.checkin !== r.checkin) || (x.checkout && x.checkout !== r.checkout));
}

function nightsOf(r) {
  return Number(r?.nights) || nightsBetween(r?.checkin, r?.checkout);
}

function guestsOf(r) {
  return Number(r?.guests) || roomsOf(r).reduce((s, x) => s + Number(x?.guests || 0), 0);
}

function moneyOf(r) {
  const total = Number(r?.totalPrice || 0);
  const deposit = Number(r?.depositAmount || 0);
  const saved = Number(r?.saldo);
  const saldo = (r?.saldo != null && r.saldo !== '' && Number.isFinite(saved))
    ? Math.max(0, saved)
    : Math.max(0, total - deposit);
  return { total, deposit, saldo };
}

function kindLabel(kind) {
  if (kind === 'pdf') return '📄 PDF';
  if (kind === 'image') return '🖼️ imagen';
  return '📎 archivo';
}

function waLine(waDigits) {
  const d = digitsOnly(waDigits);
  return d ? `📱 wa.me/${d}` : '📱 (número no visible, revisa el chat)';
}

// Dígitos de WhatsApp para el enlace wa.me: número del contacto, el guardado en la
// reserva o el del JID si es @c.us (un @lid NO es un número de teléfono).
function resolveWaDigits({ contactNumber, reservation, chatId }) {
  const fromContact = digitsOnly(contactNumber);
  if (fromContact) return fromContact;
  const fromRecord = digitsOnly(reservation?.waNumber);
  if (fromRecord) return fromRecord;
  for (const jid of [chatId, reservation?.userId]) {
    if (String(jid || '').endsWith('@c.us')) return extractDigitsFromJid(jid);
  }
  return '';
}

// ── Textos al cliente ───────────────────────────────────────

/** Acuse al cliente con el contexto de su reserva. Sin tours ni upsell. */
export function buildProofAck(reservation, { userName } = {}) {
  const r = reservation || {};
  const name = firstName(r.userName, userName);
  const nights = nightsOf(r);
  const { total, deposit, saldo } = moneyOf(r);
  const rooms = roomsOf(r);
  const split = isSplitStay(r);

  const lines = [
    name ? `✅ *¡Gracias, ${name}! Recibimos tu comprobante.*` : '✅ *¡Gracias! Recibimos tu comprobante.*',
    '',
    `🧾 *Folio:* ${r.folio}`,
  ];
  if (r.checkin && r.checkout) {
    lines.push(`📅 *Fechas:* ${formatDateLongEs(r.checkin)} → ${formatDateLongEs(r.checkout)}${nights ? ` (${plural(nights, 'noche')})` : ''}`);
  }
  const roomText = (x) => {
    const people = Number(x?.guests) ? ` (${plural(Number(x.guests), 'persona')})` : '';
    const dates = split && x?.checkin && x?.checkout
      ? ` · ${formatDateLongEs(x.checkin)} → ${formatDateLongEs(x.checkout)}`
      : '';
    return `${x?.name || 'Habitación'}${people}${dates}`;
  };
  if (rooms.length === 1) {
    lines.push(`🏨 *Habitación:* ${roomText(rooms[0])}`);
  } else if (rooms.length > 1) {
    lines.push('🏨 *Habitaciones:*', ...rooms.map(x => `· ${roomText(x)}`));
  }
  lines.push(
    '',
    `💰 *Total:* ${formatMXN(total)}`,
    `💳 *Anticipo:* ${formatMXN(deposit)}`,
    saldo > 0
      ? `🏡 *Saldo a pagar al llegar al hotel:* ${formatMXN(saldo)}`
      : '🏡 *Saldo al llegar:* $0 (pagado completo)',
    '',
    '🔎 Nuestro equipo va a verificar tu pago y, en cuanto quede verificado, te enviamos por aquí la *confirmación de tu reserva*. 🌿',
  );
  return lines.join('\n');
}

/** Acuse cuando no hay cotización activa para este chat. */
export function buildProofAckNoQuote() {
  return [
    '✅ *¡Gracias! Recibimos tu archivo.*',
    '',
    'Si es el comprobante de una reserva, el equipo lo revisa y te escribe por aquí. 🌿',
    'Para ubicarla más rápido, compárteme tu folio (WA-…) o el nombre de la reservación.',
  ].join('\n');
}

// ── Textos al equipo ────────────────────────────────────────

/** Aviso al grupo Control Hotel / número del hotel con todo el contexto para confirmar. */
export function buildProofGroupAlert(reservation, { userName, waDigits, kind, now = Date.now(), count } = {}) {
  const r = reservation || {};
  const nights = nightsOf(r);
  const guests = guestsOf(r);
  const { total, deposit, saldo } = moneyOf(r);
  const rooms = roomsOf(r);
  const split = isSplitStay(r);

  const guestName = String(r.userName || '').trim();
  const waName = String(userName || '').trim();
  const guestLine = guestName && waName && guestName.toLowerCase() !== waName.toLowerCase()
    ? `${guestName} · WhatsApp: ${waName}`
    : (guestName || waName || 'Sin nombre');

  const lines = [
    `🔔 *Comprobante de pago recibido* · ${kindLabel(kind)}`,
  ];
  if (Number(count) > 1) lines.push(`(archivo #${Number(count)} de este folio)`);
  lines.push(
    '',
    `🧾 *Folio:* ${r.folio}`,
    `👤 *Huésped:* ${guestLine}`,
    waLine(waDigits),
    `📅 *Check-in:* ${formatDateLongEs(r.checkin)} | *Check-out:* ${formatDateLongEs(r.checkout)}`,
    `🌙 *Noches:* ${nights || '—'} · 👥 *Huéspedes:* ${guests || '—'}`,
  );
  if (split) lines.push('⚠️ *Estancia con cambio de suite* (fechas por suite abajo)');
  if (rooms.length) {
    lines.push('', '🏨 *Habitaciones:*', ...rooms.map(x => {
      const people = Number(x?.guests) ? ` (${plural(Number(x.guests), 'persona')})` : '';
      const dates = split && x?.checkin && x?.checkout ? ` · 📅 ${x.checkin} → ${x.checkout}` : '';
      const price = Number(x?.price) ? ` — ${formatMXN(x.price)}` : '';
      return `· ${x?.name || 'Habitación'}${people}${dates}${price}`;
    }));
  }
  if (Number(r.discount) > 0) lines.push(`🎉 *Descuento de grupo:* −${formatMoney(r.discount)}`);
  lines.push(
    '',
    `💰 *Total:* ${formatMXN(total)}`,
    `💳 *Anticipo:* ${formatMXN(deposit)}`,
    `🏡 *Saldo al llegar:* ${formatMXN(saldo)}`,
  );

  // Estado del apartado: si ya venció, la suite pudo venderse por la web.
  const holdLine = (() => {
    if (r.blockConfirmed === false) return '🚨 *SIN apartado confirmado* — valida disponibilidad antes de confirmar';
    // Sin hora de apartado (folios de antes del apartado de 3 h): nadie garantiza la suite.
    const noHoldTime = r.blockConfirmed !== true ? '⚠️ Sin hora de apartado — valida disponibilidad antes de confirmar' : '';
    if (!r.holdExpiresAt) return noHoldTime;
    const expires = new Date(r.holdExpiresAt).getTime();
    if (!Number.isFinite(expires)) return noHoldTime;
    if (expires <= Number(now)) return '⚠️ *Apartado VENCIDO* — valida disponibilidad antes de confirmar';
    const sameDay = mxTodayYmd(new Date(expires)) === mxTodayYmd(new Date(Number(now)));
    const day = sameDay ? '' : ` del ${formatDateLongEs(mxTodayYmd(new Date(expires)))}`;
    return `⏳ Apartado vigente hasta ${formatTimeMx(expires)}${day}`;
  })();
  if (holdLine) lines.push('', holdLine);

  lines.push('', `👉 Verifica el pago y confirma con */confirmar ${r.folio}*`);
  return lines.join('\n');
}

/** Aviso cuando llega un archivo y no hay cotización activa para ese chat. */
export function buildNoQuoteProofAlert({ userName, waDigits, kind, caption } = {}) {
  const cap = String(caption || '').trim();
  const lines = [
    `📎 *Archivo/comprobante recibido SIN cotización activa* · ${kindLabel(kind)}`,
    '',
    `👤 *WhatsApp:* ${String(userName || '').trim() || 'Sin nombre'}`,
    waLine(waDigits),
  ];
  if (cap) lines.push(`💬 *Texto:* "${cap.length > 200 ? `${cap.slice(0, 200)}…` : cap}"`);
  lines.push('', 'No hay un folio pendiente de pago ligado a este chat. Revisen el chat y, si es un pago, ubiquen la reserva antes de confirmar.');
  return lines.join('\n');
}

// ── ¿El cliente solo habló del pago? ────────────────────────
// Si en la ráfaga del comprobante el cliente solo dijo "ya pagué / ahí va / gracias",
// basta con el acuse. Si preguntó o habló de otra cosa, Camila también le contesta.

const CHATTER_WORDS = new Set(`
  ya le te les se lo la el los las de del mi su tu un una y e con por para al a en que
  aqui ahi alli alla va van esta estan queda quedo quedamos listo lista listos listas
  ok okay oki okey vale sale va perfecto perfecta excelente super genial claro si
  gracias muchas mil muy amable amables saludos hola buen buena buenas buenos dia dias tardes noches
  pague pagado pagada pago pagos deposite deposito depositado transferi transferencia transferido
  hice hecho hecha realice realizado realizada envie enviado enviada enviados mande mandado mando envio
  comparto compartido paso adjunto adjunta adjuntos comprobante comprobantes captura capturas foto fotos
  pdf archivo ficha voucher recibo ticket spei oxxo anticipo reserva reservacion
  atento atenta atentos pendiente pendientes espero confirmacion favor porfa porfavor
  bendiciones igualmente ahorita momento seria todo eso
`.trim().split(/\s+/));

function normalizeChatter(line) {
  return String(line)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function isPaymentChatterOnly(texts = []) {
  const lines = (Array.isArray(texts) ? texts : [texts])
    .flatMap(t => String(t ?? '').split(/\n+/))
    .map(l => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    if (/[?¿]/.test(line)) return false; // cualquier pregunta se contesta
    const words = normalizeChatter(line)
      .replace(/[^a-z0-9ñ\s]/g, ' ') // emojis y signos fuera
      .split(/\s+/)
      .filter(Boolean);
    if (words.some(w => !CHATTER_WORDS.has(w))) return false;
  }
  return true;
}

// ── Procesador ──────────────────────────────────────────────

/**
 * createProofProcessor({ repo, sendToHotel, sendToGroup, log, now, dedupeWindowMs, noQuoteRateLimitMs, mediaToGroup })
 *   repo = { getByFolio, getByUser, findLatestPendingByPhone, markPaymentProofReceived,
 *            normalizeMxCandidates?, extractDigitsFromJid? }
 *   sendToHotel(content, options?) / sendToGroup(content, options?): async; content es
 *   un texto o el media de whatsapp-web.js. Con media se pasa { caption } como 2º argumento.
 *   Un envío que lanza o devuelve false se registra y no frena a los demás.
 *
 * process({ chatId, userName, contactNumber, sessionFolio, media, mimetype, caption, paused })
 *   → { ackText: string|null, folio: string|null, reservation: object|null, duplicate: boolean }
 */
export function createProofProcessor({
  repo,
  sendToHotel,
  sendToGroup,
  log = console,
  now = () => Date.now(),
  dedupeWindowMs = 10 * 60 * 1000,
  noQuoteRateLimitMs = 30 * 60 * 1000,
  mediaToGroup = false,
} = {}) {
  const lastAlertByFolio = new Map(); // folio -> ms del último aviso al grupo
  const lastNoQuoteByChat = new Map(); // chat -> ms del último aviso "sin cotización"

  const warn = (...args) => { try { (log?.warn || log?.log)?.call(log, ...args); } catch { /* sin log */ } };

  async function safeSend(label, sender, content, options) {
    if (typeof sender !== 'function') return false;
    try {
      const ok = await (options ? sender(content, options) : sender(content));
      if (ok === false) warn(`⚠️ Comprobante: el envío "${label}" no se entregó`);
      return ok !== false;
    } catch (err) {
      warn(`⚠️ Comprobante: falló el envío "${label}":`, String(err?.message || err).split('\n')[0]);
      return false;
    }
  }

  function prune(map, windowMs, t) {
    for (const [k, at] of map) if (t - at >= windowMs) map.delete(k);
  }

  async function processProof({ chatId, userName, contactNumber, sessionFolio, media, mimetype, caption, paused = false } = {}) {
    const t = Number(now());
    const kind = mediaKind(mimetype) || mediaKind(media?.mimetype);

    let reservation = null;
    try {
      reservation = findActiveQuoteForChat({ userId: chatId, contactNumber, sessionFolio }, repo);
    } catch (err) {
      warn('⚠️ Comprobante: no se pudo buscar la cotización:', String(err?.message || err).split('\n')[0]);
    }

    // ── Con cotización activa ──
    if (reservation) {
      const folio = reservation.folio;
      let updated = reservation;
      try {
        updated = repo.markPaymentProofReceived({ folio }) || reservation;
      } catch (err) {
        warn(`⚠️ Comprobante: no se pudo marcar ${folio}:`, String(err?.message || err).split('\n')[0]);
      }

      // Varios archivos seguidos del mismo folio = UN aviso al grupo. Se decide antes
      // de cualquier await para que dos archivos simultáneos no avisen dos veces.
      prune(lastAlertByFolio, dedupeWindowMs, t);
      const duplicate = lastAlertByFolio.has(folio);
      if (!duplicate) lastAlertByFolio.set(folio, t);

      const waDigits = resolveWaDigits({ contactNumber, reservation: updated, chatId });
      if (!duplicate) {
        const alert = buildProofGroupAlert(updated, { userName, waDigits, kind, now: t, count: updated.proofCount });
        await safeSend('grupo · aviso', sendToGroup, alert);
        await safeSend('hotel · aviso', sendToHotel, alert);
      } else {
        // Sin repetir el aviso completo, el equipo sí ve en el grupo que llegó otro
        // archivo (p. ej. el anticipo en 2 transferencias).
        const n = Number(updated.proofCount);
        await safeSend('grupo · archivo repetido', sendToGroup, `📎 ${folio}: llegó otro archivo de comprobante${n > 0 ? ` (#${n})` : ''}`);
      }
      if (media) {
        const options = { caption: `Comprobante ${folio}${Number(updated.proofCount) > 1 ? ` (#${updated.proofCount})` : ''}` };
        await safeSend('hotel · archivo', sendToHotel, media, options);
        if (mediaToGroup) await safeSend('grupo · archivo', sendToGroup, media, options);
      }

      // Al cliente SIEMPRE se le contesta (salvo en pausa): el dedupe es solo del aviso
      // al grupo. Un 2º archivo recibe un acuse corto en vez del resumen completo.
      const ackText = paused
        ? null
        : duplicate
          ? `📎 Recibí también este archivo para tu folio *${folio}*. Nuestro equipo lo revisa junto con el anterior. 🌿`
          : buildProofAck(updated, { userName });
      return { ackText, folio, reservation: updated, duplicate };
    }

    // ── Sin cotización activa ──
    const chatKey = String(chatId || last10(contactNumber) || 'desconocido');
    prune(lastNoQuoteByChat, noQuoteRateLimitMs, t);
    const limited = lastNoQuoteByChat.has(chatKey);
    if (!limited) lastNoQuoteByChat.set(chatKey, t);

    const waDigits = resolveWaDigits({ contactNumber, reservation: null, chatId });
    if (!limited) {
      const alert = buildNoQuoteProofAlert({ userName, waDigits, kind, caption });
      await safeSend('grupo · aviso sin cotización', sendToGroup, alert);
      await safeSend('hotel · aviso sin cotización', sendToHotel, alert);
    }
    if (media) {
      const options = { caption: 'Archivo sin cotización activa' };
      await safeSend('hotel · archivo sin cotización', sendToHotel, media, options);
      if (mediaToGroup) await safeSend('grupo · archivo sin cotización', sendToGroup, media, options);
    }

    const ackText = paused
      ? null
      : limited
        ? '📎 Recibí también este archivo; el equipo lo revisa junto con el anterior. 🌿'
        : buildProofAckNoQuote();
    return { ackText, folio: null, reservation: null, duplicate: limited };
  }

  return { process: processProof };
}
