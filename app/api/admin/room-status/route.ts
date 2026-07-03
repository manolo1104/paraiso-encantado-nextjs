import { NextRequest, NextResponse } from 'next/server';
import { getRoomStatuses, setRoomStatus, getAllBookings } from '@/lib/admin/sheets-admin';
import type { RoomStatusType } from '@/lib/admin/sheets-admin';
import { mexicoTodayStr } from '@/lib/date-mx';
import { roomKey, splitRooms } from '@/lib/room-names';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [statuses, bookings] = await Promise.all([
    getRoomStatuses(),
    getAllBookings(),
  ]);

  const todayStr = mexicoTodayStr();

  // Ocupación derivada de reservas activas — keyed por CADA cuarto normalizado,
  // no por el CSV crudo (antes una reserva web "Jungla (2 personas)" o multi-cuarto
  // nunca matcheaba el nombre limpio del panel → cuartos ocupados salían libres).
  const occupiedMap = new Map<string, { cliente: string; checkout: string; huespedes: number }>();
  for (const b of bookings) {
    if (b.estado === 'CANCELADA' || !b.checkin || !b.checkout) continue;
    if (b.checkin <= todayStr && b.checkout > todayStr) {
      for (const room of splitRooms(b.habitaciones)) {
        occupiedMap.set(roomKey(room), {
          cliente: b.cliente,
          checkout: b.checkout,
          huespedes: b.huespedes,
        });
      }
    }
  }

  const result = statuses.map(s => {
    const occupied = occupiedMap.get(roomKey(s.suite));
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
