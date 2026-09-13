/**
 * quote-flow.js
 * Reglas PURAS del cambio de fechas con una cotización existente (sección 6 del plan).
 * Sin I/O ni estado: claude-handler.js las usa para decidir qué fechas cotizar, si la
 * cotización anterior sigue vigente, si se reemplaza o se escala al equipo, y cuándo
 * un mensaje debe saltarse los atajos fijos.
 */

import { mxTodayYmd } from './format-mx.js';

const QUOTE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // una cotización de más de 7 días ya no cuenta
const CONFIRMED_STATUSES = new Set(['RESERVADO', 'CONFIRMADA']);
const PENDING_STAGES = new Set(['cotizacion_pendiente_pago', 'pago_en_verificacion']);

// "YYYY-MM-DD" que además sea una fecha real (descarta 2026-02-30).
function isValidYmd(value) {
  const s = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function statusOf(record) {
  return String(record?.status || '').trim().toUpperCase();
}

/**
 * Fechas con las que se cotiza. Mandan las del modelo (son las que el cliente acaba de
 * dar); la sesión solo rellena si faltan o vienen mal. Antes era al revés y las fechas
 * viejas de la sesión pisaban el cambio de fechas.
 * → { checkin, checkout, source: 'model' | 'session' }  (null si la sesión tampoco tiene)
 */
export function resolveQuoteDates({ rawCheckin, rawCheckout, session } = {}) {
  if (isValidYmd(rawCheckin) && isValidYmd(rawCheckout) && rawCheckout > rawCheckin) {
    return { checkin: rawCheckin, checkout: rawCheckout, source: 'model' };
  }
  // Nunca mezclar: si el modelo no dio un rango completo y válido, se usa el de la sesión entero.
  return {
    checkin: session?.checkin || null,
    checkout: session?.checkout || null,
    source: 'session'
  };
}

// ¿La llegada ya pasó? (hoy en México). Sin checkin válido cuenta como pasada.
function isCheckinPast(record, now) {
  if (!isValidYmd(record?.checkin)) return true;
  return record.checkin < mxTodayYmd(now);
}

/**
 * Una cotización deja de contar como vigente si su llegada ya pasó (hora de México) o
 * si se creó hace más de 7 días (campo `createdAt` de reservations.js; `timestamp` de
 * respaldo). Sin registro → stale. Sin fecha de creación legible → solo cuenta la llegada.
 */
export function isQuoteStale(record, { now = new Date() } = {}) {
  if (!record) return true;
  if (isCheckinPast(record, now)) return true;
  const createdRaw = record.createdAt ?? record.timestamp;
  if (createdRaw == null || createdRaw === '') return false;
  const createdMs = new Date(createdRaw).getTime();
  if (Number.isNaN(createdMs)) return false;
  return new Date(now).getTime() - createdMs > QUOTE_MAX_AGE_MS;
}

/**
 * Qué hacer con la cotización/reserva anterior al crear una nueva.
 * → { action: 'none' | 'supersede' | 'requires_team', prevFolio }
 *   · none: no hay anterior, el modelo dijo que NO la reemplaza, ya está REEMPLAZADA,
 *     otro estado (cancelada…), o ya no está vigente.
 *   · requires_team: ya mandó comprobante o la reserva está confirmada y su llegada no
 *     ha pasado → cambiar fechas lo resuelve el equipo (Camila escala).
 *     (Aquí NO aplica el tope de 7 días: una reserva pagada hace 2 semanas sigue viva.)
 *   · supersede: PENDIENTE_PAGO vigente sin comprobante → la nueva la reemplaza y se
 *     libera su apartado.
 */
export function planSupersede(prev, { replacesPrevious = true, now = new Date() } = {}) {
  const prevFolio = prev?.folio || null;
  if (!prev) return { action: 'none', prevFolio };
  if (replacesPrevious === false) return { action: 'none', prevFolio };

  const status = statusOf(prev);
  if (status === 'REEMPLAZADA') return { action: 'none', prevFolio };

  if (CONFIRMED_STATUSES.has(status)) {
    return { action: isCheckinPast(prev, now) ? 'none' : 'requires_team', prevFolio };
  }
  if (status !== 'PENDIENTE_PAGO') return { action: 'none', prevFolio };

  if (prev.proofReceivedAt) {
    return { action: isCheckinPast(prev, now) ? 'none' : 'requires_team', prevFolio };
  }
  if (isQuoteStale(prev, { now })) return { action: 'none', prevFolio };
  return { action: 'supersede', prevFolio };
}

/**
 * sessionId del apartado propio en la página ('wa-<folio>'), para que la verificación
 * de disponibilidad no le marque "ocupada" su propia suite. null si no hay apartado vigente.
 */
export function ownHoldSessionId(prev, { now = new Date() } = {}) {
  if (!prev?.folio) return null;
  if (statusOf(prev) !== 'PENDIENTE_PAGO') return null;
  if (isQuoteStale(prev, { now })) return null;
  return `wa-${prev.folio}`;
}

// Palabras de cambio de fechas ("mejor del 12 al 14", "una noche más", "posponer"…).
export const DATE_CHANGE_REGEX = /cambi|mover|recorr|otras? fecha|mejor (el|del|para)|en (vez|lugar) de|adelantar|posponer|extender|una noche m[aá]s|otro d[ií]a/i;

// Número de personas ("somos 5", "4 adultos", "somos cuatro").
export const PEOPLE_COUNT_REGEX = /\b\d+\s*(personas|adultos|hu[eé]spedes|pax)\b|\bsomos\s+\d+|\bsomos\s+(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/i;

const MONTHS = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';
const SIMPLE_DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/g,                                   // 2026-10-12
  /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,                       // 12/10 o 12/10/2026
  new RegExp(`\\b\\d{1,2}\\s*(?:de\\s+)?(?:${MONTHS})\\b`, 'g'), // 12 de octubre
  /\bdel?\s+\d{1,2}\s+al?\s+\d{1,2}\b/g                        // del 9 al 11
];

function normalizeForMatch(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Detector simple de fechas en español (default de shouldBypassShortcuts).
 * Devuelve los FRAGMENTOS encontrados (no fechas ISO): solo importa cuántos hay.
 */
export function detectDateMentions(text = '') {
  const t = normalizeForMatch(text);
  const found = [];
  for (const re of SIMPLE_DATE_PATTERNS) {
    for (const m of t.match(re) || []) found.push(m.trim());
  }
  return [...new Set(found)];
}

/**
 * ¿El mensaje debe saltarse los atajos fijos (getDeterministicResponse) y parseDateIntent?
 *   · En cualquier etapa: si trae fechas o número de personas (no tragarse la ráfaga).
 *   · Con cotización vigente o pago en verificación: también si habla de cambiar fechas.
 * extractDates se inyecta (el de claude-handler); recibe el texto en minúsculas y sin acentos.
 */
export function shouldBypassShortcuts(text, { stage, extractDates = detectDateMentions } = {}) {
  const raw = String(text || '');
  if (!raw.trim()) return false;
  const norm = normalizeForMatch(raw);

  let dateCount = 0;
  try { dateCount = (extractDates(norm) || []).length; } catch { dateCount = 0; }
  if (dateCount >= 1) return true;
  if (PEOPLE_COUNT_REGEX.test(raw) || PEOPLE_COUNT_REGEX.test(norm)) return true;

  if (PENDING_STAGES.has(stage) && (DATE_CHANGE_REGEX.test(raw) || DATE_CHANGE_REGEX.test(norm))) {
    return true;
  }
  return false;
}
