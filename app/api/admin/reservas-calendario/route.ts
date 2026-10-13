import { NextRequest, NextResponse } from 'next/server';
import {
  CANALES,
  cancelarReservaCalendario,
  cerrarNoches,
  getReservasCalendario,
} from '@/lib/admin/reservas-calendario';

export const dynamic = 'force-dynamic';

/**
 * Cerrar noches desde /admin/calendario preguntando el motivo (ver
 * lib/admin/reservas-calendario.ts). Protegida por el middleware de /api/admin.
 *
 * GET    → reservas del calendario ACTIVAS (para enseñarlas al tocar la noche).
 * POST   { suite, llegada, noches, tipo: 'reserva' | 'bloqueo', canal? }
 * DELETE { id } → cancela una reserva del calendario y libera sus noches.
 */
export async function GET() {
  try {
    const filas = await getReservasCalendario();
    return NextResponse.json({
      reservas: filas.filter((r) => r.estado === 'activa').map(({ row: _row, ...r }) => r),
      canales: CANALES,
    });
  } catch (e: any) {
    return NextResponse.json({ reservas: [], canales: CANALES, error: e?.message }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const { suite, llegada, noches, tipo, canal } = await req.json();
  if (!suite || !llegada || (tipo !== 'reserva' && tipo !== 'bloqueo')) {
    return NextResponse.json({ error: 'suite, llegada y tipo (reserva | bloqueo) son requeridos' }, { status: 400 });
  }
  const r = await cerrarNoches({ suite: String(suite), llegada: String(llegada), noches: Number(noches) || 1, tipo, canal });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, id: r.id });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id || typeof id !== 'string') return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  const r = await cancelarReservaCalendario(id);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true });
}
