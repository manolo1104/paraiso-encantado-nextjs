import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, createManualBooking } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const suite = searchParams.get('suite') || '';

  const bookings = await getAllBookings();
  const filtered = bookings.filter(b => {
    if (search && !b.cliente.toLowerCase().includes(search) &&
        !b.email.toLowerCase().includes(search) &&
        !b.confirmacion.toLowerCase().includes(search)) return false;
    if (suite && !b.habitaciones.includes(suite)) return false;
    return true;
  });

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const confirmacion = await createManualBooking(data);
    return NextResponse.json({ ok: true, confirmacion });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
