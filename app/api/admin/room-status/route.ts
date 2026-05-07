import { NextRequest, NextResponse } from 'next/server';
import { getRoomStatuses, setRoomStatus, getAllBookings } from '@/lib/admin/sheets-admin';
import type { RoomStatusType } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [statuses, bookings] = await Promise.all([
    getRoomStatuses(),
    getAllBookings(),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Derive occupied rooms from active bookings (overrides stored status)
  const occupiedMap = new Map<string, { cliente: string; checkout: string; huespedes: number }>();
  for (const b of bookings) {
    if (b.estado === 'CANCELADA' || !b.checkin || !b.checkout) continue;
    if (b.checkin <= todayStr && b.checkout > todayStr) {
      occupiedMap.set(b.habitaciones, {
        cliente: b.cliente,
        checkout: b.checkout,
        huespedes: b.huespedes,
      });
    }
  }

  const result = statuses.map(s => {
    const occupied = occupiedMap.get(s.suite);
    if (occupied && s.estado !== 'MANTENIMIENTO' && s.estado !== 'LIMPIEZA') {
      return { ...s, estado: 'OCUPADA' as RoomStatusType, ocupadaPor: occupied };
    }
    return { ...s, ocupadaPor: null };
  });

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const { suite, estado, notas } = await req.json();
  if (!suite || !estado) {
    return NextResponse.json({ error: 'suite y estado requeridos' }, { status: 400 });
  }
  await setRoomStatus(suite, estado as RoomStatusType, notas || '');
  return NextResponse.json({ ok: true });
}
