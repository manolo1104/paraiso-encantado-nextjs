import { NextResponse } from 'next/server';
import { sembrarReglas, type ReglaNueva } from '@/lib/admin/precios-sheets';
import { invalidarCachePrecios } from '@/lib/precios-vigentes';
import { REGLA_DIAS_SEMANA, TEMPORADAS_MX } from '@/lib/calendario-mx';

export const dynamic = 'force-dynamic';

/**
 * «Sembrar temporadas y puentes» del panel.
 *
 * Escribe las temporadas verificadas de `lib/calendario-mx.ts` (LFT art. 74 +
 * calendario escolar SEP 2026-2027) más la regla de día de la semana. La
 * autenticación la pone el middleware, como en todo /api/admin/*.
 *
 * Es idempotente: cada regla trae un id fijo, así que volver a apretar el botón
 * actualiza las filas existentes en vez de duplicarlas. No borra nada: una
 * temporada que el dueño haya editado a mano se sobrescribe con el valor del
 * calendario, y cualquier regla suya que no esté en la lista se queda intacta.
 *
 * No enciende el interruptor maestro a propósito: sembrar es escribir el
 * calendario, no empezar a cobrarlo.
 */
export async function POST() {
  try {
    const lote: (ReglaNueva & { id: string })[] = [
      ...TEMPORADAS_MX.map(t => ({
        id: t.id,
        nombre: t.nombre,
        tipo: 'temporada' as const,
        desde: t.desde,
        hasta: t.hasta,
        dias: [],
        umbral: 0,
        pct: t.pct,
        prioridad: t.prioridad,
        activa: true,
      })),
      {
        id: REGLA_DIAS_SEMANA.id,
        nombre: REGLA_DIAS_SEMANA.nombre,
        tipo: 'finde' as const,
        desde: '',
        hasta: '',
        dias: REGLA_DIAS_SEMANA.dias,
        umbral: 0,
        pct: REGLA_DIAS_SEMANA.pct,
        prioridad: REGLA_DIAS_SEMANA.prioridad,
        activa: true,
      },
    ];

    const { creadas, actualizadas } = await sembrarReglas(lote);
    invalidarCachePrecios();
    return NextResponse.json({ ok: true, creadas, actualizadas, total: lote.length });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'No se pudieron sembrar las temporadas' },
      { status: 500 },
    );
  }
}
