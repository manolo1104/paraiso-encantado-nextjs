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

const MESES_MX = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * Lee la fecha de alta de la columna A de `Reservas`.
 *
 * Hay DOS formatos conviviendo y hay que aguantar los dos:
 *  - `"7/10/2026, 14:23:45"` — lo que escribe `addBookingToSheet` (es-MX).
 *  - `"sábado, 14 de febrero de 2026"` — como lo devuelve Sheets cuando la celda
 *    quedó con formato de fecha larga. **Son 92 de las 93 filas** (oct 2026): el
 *    parser viejo solo entendía el primero, así que el ritmo de reservas de los
 *    precios dinámicos valía 0 siempre y la prueba social de /reservar contaba
 *    casi nada, sin que nadie se enterara.
 *
 * México ≈ UTC-6: se suman 6 h para aproximar UTC. Precisión de horas, que es
 * toda la que necesitan el ritmo de reservas y la prueba social.
 */
export function parseFechaHojaMx(s: string): Date | null {
  const texto = String(s || '').trim();
  if (!texto) return null;

  // ISO, por si alguna fila viene de un script
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const dt = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3], 18));
    return isNaN(dt.getTime()) ? null : dt;
  }

  // "14 de febrero de 2026" (con o sin el día de la semana delante)
  const largo = texto.toLowerCase().match(/(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/);
  if (largo) {
    const mes = MESES_MX.indexOf(largo[2]);
    if (mes >= 0) {
      const hm = texto.match(/(\d{1,2}):(\d{2})/);
      const dt = new Date(Date.UTC(+largo[3], mes, +largo[1], (hm ? +hm[1] : 12) + 6, hm ? +hm[2] : 0));
      return isNaN(dt.getTime()) ? null : dt;
    }
  }

  // "7/10/2026, 14:23:45"
  const m = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,]+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const [, d, mo, y, h, mi] = m;
  const dt = new Date(Date.UTC(+y, +mo - 1, +d, +(h ?? '12') + 6, +(mi ?? '0')));
  return isNaN(dt.getTime()) ? null : dt;
}
