/**
 * precios-impacto.ts
 * ¿Los precios dinámicos están ganando dinero?
 *
 * Era la pregunta que el sistema no podía contestar: la reserva guardaba el
 * total cobrado y nada más, así que no había contra qué compararlo. Desde el
 * 8 de oct de 2026 cada reserva del motor web guarda en la columna R de
 * `Reservas` cuántos pesos movió el precio dinámico frente al precio de lista
 * (metadata `dynamicPriceDelta` del PaymentIntent), y esta función los suma.
 *
 * Se guarda la diferencia y no las dos cifras a propósito: el total de la hoja
 * incluye add-ons y promo, así que restarlo contra un precio base de solo
 * habitaciones daría un número contaminado.
 */
import { getAllBookings, type AdminBooking } from './sheets-admin';
import { parseFechaHojaMx } from '@/lib/date-mx';

export interface ImpactoPrecios {
  /** Días hacia atrás que se midieron. */
  dias: number;
  /** Reservas del periodo que traen la cifra (las de antes del cambio no). */
  reservas: number;
  /** Pesos de más (o de menos, si es negativo) que cobró el precio dinámico. */
  diferencia: number;
  /** Reservas del periodo sin la cifra: anteriores al cambio o capturadas a mano. */
  sinDato: number;
}

export async function calcularImpacto(dias = 30): Promise<ImpactoPrecios> {
  const vacio: ImpactoPrecios = { dias, reservas: 0, diferencia: 0, sinDato: 0 };
  let bookings: AdminBooking[];
  try {
    bookings = await getAllBookings();
  } catch (e: any) {
    console.error('[precios-impacto] no se pudieron leer las reservas:', e?.message || e);
    return vacio;
  }

  // Por fecha de ALTA y no de llegada: lo que se mide es lo que se vendió
  // mientras el sistema estuvo encendido, no cuándo duerme la gente.
  const corte = Date.now() - dias * 86400000;
  let reservas = 0, diferencia = 0, sinDato = 0;

  for (const b of bookings) {
    if (b.estado === 'CANCELADA') continue;
    const alta = parseFechaHojaMx(b.fecha);
    if (!alta || alta.getTime() < corte) continue;
    if (b.deltaPrecioDinamico === 0) { sinDato++; continue; }
    reservas++;
    diferencia += b.deltaPrecioDinamico;
  }

  return { dias, reservas, diferencia: Math.round(diferencia), sinDato };
}
