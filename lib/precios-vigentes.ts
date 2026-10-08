/**
 * precios-vigentes.ts
 * Los factores de precio que el motor web debe cobrar AHORA.
 *
 * Un solo accesor para los tres que lo necesitan —/api/precios (lo que ve el
 * navegador), create-payment-intent y guest-info (lo que se cobra)— para que no
 * haya manera de que el huésped vea un número y el servidor calcule otro.
 *
 * Caché corta (60 s) y se invalida al guardar desde el panel: si fuera de 10
 * minutos, el dueño cambiaría un precio y jurarían que no funciona.
 */
import { getAjustes, getConfigPrecios } from '@/lib/admin/precios-sheets';
import { FactoresPorFecha, factoresAplicados, sumarDias } from '@/lib/precios';
import { mexicoTodayStr } from '@/lib/date-mx';

export interface FactoresVigentes {
  activo: boolean;
  factores: FactoresPorFecha;
}

const VACIO: FactoresVigentes = { activo: false, factores: {} };
const TTL_MS = 60 * 1000;
/** Cuántos días adelante se publican factores. Un año cubre cualquier reserva real. */
const DIAS_ADELANTE = 365;

let cache: { at: number; valor: FactoresVigentes } | null = null;

export function invalidarCachePrecios(): void {
  cache = null;
}

export async function getFactoresVigentes(): Promise<FactoresVigentes> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.valor;
  try {
    const config = await getConfigPrecios();
    if (!config.activo) {
      const valor = { activo: false, factores: {} };
      cache = { at: Date.now(), valor };
      return valor;
    }
    const hoy = mexicoTodayStr();
    const ajustes = await getAjustes(hoy, sumarDias(hoy, DIAS_ADELANTE));
    const valor: FactoresVigentes = { activo: true, factores: factoresAplicados(ajustes) };
    cache = { at: Date.now(), valor };
    return valor;
  } catch (e: any) {
    // Falla abierto: sin factores se cobra el precio base. Nunca un precio a medias.
    console.error('[precios] getFactoresVigentes:', e?.message || e);
    return VACIO;
  }
}
