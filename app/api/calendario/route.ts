import { NextResponse } from 'next/server';
import { leerCalendario, versionDeDisponibilidad } from '@/lib/sheets';
import { getFactoresVigentes } from '@/lib/precios-vigentes';
import { mexicoTodayStr } from '@/lib/date-mx';

export const dynamic = 'force-dynamic';

/**
 * Calendario público de los buscadores: qué noches tienen lugar y los factores
 * de precio, en UNA respuesta (el navegador hace una sola descarga).
 *
 * Respuesta: { v, desde, libres, estado, activo, factores }
 *  - `libres`: una máscara por noche desde `desde` (bit = id de suite - 1,
 *    1 = libre). Solo libre/ocupado: el motivo (reserva, bloqueo, OTA) es
 *    operación interna y no sale de aquí.
 *  - `libres: null` + `estado: 'sin-verificar'`: la hoja no respondió y no hay
 *    copia reciente. El calendario enseña precios sin «Lleno»; la búsqueda del
 *    motor sigue siendo la que decide.
 *
 * Caché en memoria de 3 min (una sola réplica en Railway), una sola lectura en
 * vuelo aunque lleguen veinte visitas juntas, y se tira sola cuando el hotel
 * escribe la matriz o entra una reserva (`versionDeDisponibilidad`). Si la
 * hoja falla se sirve la última copia buena de hasta 30 min.
 */
const TTL_MS = 3 * 60_000;
const COPIA_VIEJA_MS = 30 * 60_000;

type Calendario = { desde: string; libres: number[] };
let cache: { datos: Calendario; en: number; version: number } | null = null;
let enVuelo: Promise<Calendario> | null = null;

async function obtener(): Promise<{ datos: Calendario | null; estado: 'ok' | 'sin-verificar' }> {
  const hoy = mexicoTodayStr();
  const version = versionDeDisponibilidad();
  if (cache && cache.version === version && cache.datos.desde === hoy && Date.now() - cache.en < TTL_MS) {
    return { datos: cache.datos, estado: 'ok' };
  }
  if (!enVuelo) {
    enVuelo = leerCalendario()
      .then((datos) => {
        // Se guarda con la versión de ANTES de leer: si alguien escribió
        // mientras tanto, la próxima visita ve otra versión y vuelve a leer.
        cache = { datos, en: Date.now(), version };
        return datos;
      })
      .finally(() => { enVuelo = null; });
  }
  try {
    return { datos: await enVuelo, estado: 'ok' };
  } catch (e: any) {
    console.error('❌ /api/calendario:', e?.message || e);
    if (cache && Date.now() - cache.en < COPIA_VIEJA_MS) return { datos: cache.datos, estado: 'ok' };
    return { datos: null, estado: 'sin-verificar' };
  }
}

export async function GET() {
  const [{ datos, estado }, precios] = await Promise.all([obtener(), getFactoresVigentes()]);
  return NextResponse.json(
    {
      v: 1,
      desde: datos?.desde ?? mexicoTodayStr(),
      libres: datos?.libres ?? null,
      estado,
      activo: precios.activo,
      factores: precios.activo ? precios.factores : {},
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
