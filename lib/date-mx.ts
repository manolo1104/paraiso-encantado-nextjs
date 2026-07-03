/**
 * date-mx.ts
 * Helpers de fecha en zona horaria del hotel (America/Mexico_City).
 * Funcionan igual en el servidor (Railway corre en UTC) y en el navegador,
 * porque Intl/toLocaleDateString respetan la zona indicada en ambos.
 *
 * Motivo: usar `new Date().toISOString()` para "hoy" toma la fecha UTC; de
 * las 18:00 a medianoche hora de México eso ya es "mañana", y todo el panel
 * (ocupación, check-ins de hoy, ingresos del mes, línea de "hoy" del
 * calendario) se corría un día. Estos helpers dan siempre la fecha local MX.
 */

export const MX_TZ = 'America/Mexico_City';

/** 'YYYY-MM-DD' de hoy en hora de México. */
export function mexicoTodayStr(): string {
  // 'en-CA' produce el formato ISO 'YYYY-MM-DD'.
  return new Date().toLocaleDateString('en-CA', { timeZone: MX_TZ });
}

/** 'YYYY-MM-DD' de una fecha dada, en hora de México. */
export function toMexicoDateStr(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: MX_TZ });
}

/** Año, mes (0-based) y día de hoy en hora de México. */
export function mexicoTodayParts(): { year: number; month: number; day: number } {
  const [y, m, d] = mexicoTodayStr().split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}
