import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, createManualBooking } from '@/lib/admin/sheets-admin';
import { checkAvailability } from '@/lib/sheets';

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

    // Verificar disponibilidad en Google Sheets antes de crear
    if (data.checkin && data.checkout && data.habitacion) {
      const avail = await checkAvailability(data.checkin, data.checkout, [data.habitacion]);
      if (avail.unavailableRooms.length > 0) {
        return NextResponse.json(
          { error: `${data.habitacion} no está disponible del ${data.checkin} al ${data.checkout}. Verifica el calendario.` },
          { status: 409 }
        );
      }
    }

    const confirmacion = await createManualBooking(data);
    return NextResponse.json({ ok: true, confirmacion });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
