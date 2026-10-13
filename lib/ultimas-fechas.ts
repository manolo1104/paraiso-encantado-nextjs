/**
 * Las últimas fechas que el huésped eligió en esta visita (sessionStorage
 * `pe_last_dates`, la escribe /reservar). Solo se devuelven si siguen siendo
 * válidas: llegada de hoy en adelante (hora de México) y salida posterior.
 *
 * Antes, cada botón «Reservar» de las suites caía en «hoy → mañana» calculado
 * en UTC cuando no había fechas: el huésped llegaba al motor buscando una noche
 * que nunca eligió (o, después de las 6 pm, la de mañana).
 */
import { mexicoTodayStr } from './date-mx';

export interface UltimasFechas {
  checkin: string;
  checkout: string;
  adults: string;
}

export function leerUltimasFechas(): UltimasFechas | null {
  try {
    const raw = sessionStorage.getItem('pe_last_dates');
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<UltimasFechas>;
    const ok = /^\d{4}-\d{2}-\d{2}$/;
    if (!d.checkin || !d.checkout || !ok.test(d.checkin) || !ok.test(d.checkout)) return null;
    if (d.checkin < mexicoTodayStr() || d.checkout <= d.checkin) return null;
    return { checkin: d.checkin, checkout: d.checkout, adults: d.adults || '2' };
  } catch {
    return null;
  }
}

/**
 * Liga al motor con la suite preseleccionada. Sin fechas válidas no se
 * inventan: /reservar abre el calendario en modo suite.
 */
export function urlReservarSuite(suiteId: string, fechas?: { checkin?: string; checkout?: string; adults?: number | string }): string {
  const guardadas = leerUltimasFechas();
  const ci = fechas?.checkin || guardadas?.checkin || '';
  const co = fechas?.checkout || guardadas?.checkout || '';
  const adults = String(fechas?.adults || guardadas?.adults || 2);
  const p = new URLSearchParams();
  if (ci && co) { p.set('checkin', ci); p.set('checkout', co); }
  p.set('adults', adults);
  p.set('suiteId', suiteId);
  p.set('autoselect', '1');
  return `/reservar?${p.toString()}`;
}
