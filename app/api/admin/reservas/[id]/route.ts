import { NextRequest, NextResponse } from 'next/server';
import { updateBooking, cancelBooking, getAllBookings } from '@/lib/admin/sheets-admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const changes = await req.json();

  const bookings = await getAllBookings();
  const booking = bookings.find(b => b.confirmacion === id);
  if (!booking) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  await updateBooking(booking.rowIndex, changes);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const bookings = await getAllBookings();
  const booking = bookings.find(b => b.confirmacion === id);
  if (!booking) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  await cancelBooking(booking.rowIndex, booking.habitaciones, booking.checkin, booking.checkout);
  return NextResponse.json({ ok: true });
}
