import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { checkin, checkout, rooms } = await req.json();
    if (!checkin || !checkout || !rooms || !Array.isArray(rooms)) {
      return NextResponse.json({ error: 'checkin, checkout y rooms son requeridos' }, { status: 400 });
    }
    const result = await checkAvailability(checkin, checkout, rooms);
    return NextResponse.json({
      available: result.available,
      unavailableRooms: result.unavailableRooms,
      message: result.available
        ? 'Habitaciones disponibles'
        : `No disponibles: ${result.unavailableRooms.join(', ')}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
