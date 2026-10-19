import { NextResponse } from 'next/server';
import { aplicarReglas, DIAS_HORIZONTE } from '@/lib/admin/precios-motor';
import { construirSenales, ocupacionFiable, senalesParaReglas } from '@/lib/admin/demanda';
import { mexicoTodayStr } from '@/lib/date-mx';

export const dynamic = 'force-dynamic';

// "Aplicar mis reglas": recalcula el calendario del próximo año desde las reglas.
// No toca el pasado, lo que el dueño fijó a mano, ni las propuestas pendientes
// (a esas solo les pone al día la regla que cobran mientras esperan).
// Si la hoja no se deja leer, responde 500 y no escribe nada.
export async function POST() {
  try {
    // Las reglas de ocupación y de última hora necesitan las señales de demanda.
    // Si la ocupación no se pudo leer (`null`), `aplicarReglas` no escribe nada
    // cuando hay reglas de ese tipo, y sin ellas usa solo el calendario
    // (temporada y día de la semana): nunca inventa una ocupación que no midió.
    const senales = await construirSenales(mexicoTodayStr(), Math.min(DIAS_HORIZONTE, 120)).catch(() => null);
    const r = await aplicarReglas(senales && ocupacionFiable() ? senalesParaReglas(senales) : null);
    return NextResponse.json({ ok: true, ...r });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudieron aplicar las reglas' }, { status: 500 });
  }
}
