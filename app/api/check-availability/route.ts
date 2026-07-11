import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { checkin, checkout, rooms, sessionId } = await req.json();
    if (!checkin || !checkout || !rooms || !Array.isArray(rooms)) {
      return NextResponse.json({ error: 'checkin, checkout y rooms son requeridos' }, { status: 400 });
    }
    // sessionId (opcional): excluye el apartado temporal del propio visitante
    const result = await checkAvailability(checkin, checkout, rooms, typeof sessionId === 'string' ? sessionId : null);
    return NextResponse.json({
      available: result.available,
      unavailableRooms: result.unavailableRooms,
      degraded: result.degraded ?? false,
      message: result.degraded
        ? 'No se pudo verificar la disponibilidad — reintenta'
        : result.available
          ? 'Habitaciones disponibles'
          : `No disponibles: ${result.unavailableRooms.join(', ')}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
