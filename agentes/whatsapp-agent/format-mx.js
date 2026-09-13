/**
 * format-mx.js
 * Formatos compartidos para los textos que ve el huésped y el equipo:
 * dinero en pesos, fechas y horas en zona de México. Sin dependencias ni estado,
 * para que cualquier módulo (cotización, comprobante, avisos) diga lo mismo.
 */

export const MX_TZ = 'America/Mexico_City';

/** 5400 → "$5,400 MXN" */
export function formatMXN(amount) {
  const n = Math.round(Number(amount) || 0);
  return `$${n.toLocaleString('es-MX')} MXN`;
}

/** 5400 → "$5,400" (sin la moneda, para renglones de desglose) */
export function formatMoney(amount) {
  const n = Math.round(Number(amount) || 0);
  return `$${n.toLocaleString('es-MX')}`;
}

/** "2026-10-09" → "viernes 9 de octubre" (sin año; con año si withYear) */
export function formatDateLongEs(ymd, { withYear = false } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ymd || ''))) return String(ymd || '');
  // Mediodía UTC: la fecha no se corre de día al pasarla a la zona de México.
  const d = new Date(`${ymd}T12:00:00Z`);
  return d.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  }).replace(',', '');
}

/** ISO/Date/ms → "6:45 p.m." en hora de México */
export function formatTimeMx(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: MX_TZ });
}

/** Fecha de hoy en México como "YYYY-MM-DD" (now inyectable para pruebas) */
export function mxTodayYmd(now = new Date()) {
  return new Date(now).toLocaleDateString('sv-SE', { timeZone: MX_TZ });
}

/** Noches entre dos "YYYY-MM-DD" (0 si alguna es inválida) */
export function nightsBetween(checkin, checkout) {
  const ok = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  if (!ok(checkin) || !ok(checkout)) return 0;
  const n = Math.round((new Date(`${checkout}T12:00:00Z`) - new Date(`${checkin}T12:00:00Z`)) / 86400000);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** "a" + "s" según cantidad: plural(1,'noche') → "1 noche", plural(2,'noche') → "2 noches" */
export function plural(n, singular, pluralForm = `${singular}s`) {
  return `${n} ${Number(n) === 1 ? singular : pluralForm}`;
}
