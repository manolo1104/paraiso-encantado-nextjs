import { NextRequest, NextResponse } from 'next/server';
import { fijarFactorManual, resolverPropuestas } from '@/lib/admin/precios-motor';
import { mexicoTodayStr } from '@/lib/date-mx';

export const dynamic = 'force-dynamic';

/**
 * Una noche en concreto:
 *  { fecha, pct }                  → la fija a mano (pct 0 la devuelve al precio base)
 *  { fechas: [...], aprobar: bool } → aprueba o rechaza propuestas de la IA
 */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();

    if (Array.isArray(b?.fechas)) {
      const fechas = b.fechas.filter((f: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(f))).map(String);
      const n = await resolverPropuestas(fechas, b?.aprobar !== false);
      return NextResponse.json({ ok: true, resueltas: n });
    }

    const fecha = String(b?.fecha || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
    }
    // El pasado es el registro de lo que se cobró y el motor nunca lo reescribe;
    // este camino sí podía, y entonces el historial dejaba de cuadrar con los
    // cobros reales. El calendario del panel ya bloquea el clic, la API no.
    if (fecha < mexicoTodayStr()) {
      return NextResponse.json({ error: 'Esa noche ya pasó: no se puede cambiar lo que ya se cobró' }, { status: 400 });
    }
    const pct = Number(b?.pct);
    if (!Number.isFinite(pct)) return NextResponse.json({ error: 'Porcentaje inválido' }, { status: 400 });
    if (pct < -50 || pct > 100) {
      return NextResponse.json({ error: 'El porcentaje tiene que estar entre −50% y +100%' }, { status: 400 });
    }
    await fijarFactorManual(fecha, 1 + pct / 100, String(b?.motivo || '').slice(0, 120));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudo guardar la noche' }, { status: 500 });
  }
}
