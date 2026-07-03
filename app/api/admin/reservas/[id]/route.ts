import { NextRequest, NextResponse } from 'next/server';
import { updateBooking, cancelBooking, blockRooms, unblockRooms, getAllBookings } from '@/lib/admin/sheets-admin';
import { checkAvailability } from '@/lib/sheets';
import { splitRooms } from '@/lib/room-names';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await req.json();

  // Bug fix: el modal envía "habitacion" (singular) pero updateBooking espera "habitaciones"
  if (raw.habitacion && !raw.habitaciones) {
    raw.habitaciones = raw.habitacion;
    delete raw.habitacion;
  }

  const bookings = await getAllBookings();
  const booking = bookings.find(b => b.confirmacion === id);
  if (!booking) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  // Detectar si cambiaron habitaciones o fechas → reasignar Disponibilidad
  const oldRooms    = booking.habitaciones || '';
  const oldCheckin  = booking.checkin || '';
  const oldCheckout = booking.checkout || '';
  const newRooms    = raw.habitaciones ?? oldRooms;
  const newCheckin  = raw.checkin  ?? oldCheckin;
  const newCheckout = raw.checkout ?? oldCheckout;

  const roomsChanged = newRooms !== oldRooms;
  const datesChanged = newCheckin !== oldCheckin || newCheckout !== oldCheckout;

  if ((roomsChanged || datesChanged) && oldRooms && oldCheckin && oldCheckout) {
    // 1. Liberar bloqueo anterior
    await unblockRooms(oldRooms, oldCheckin, oldCheckout);

    if (newRooms && newCheckin && newCheckout) {
      // 2. Verificar disponibilidad del nuevo rango ANTES de bloquear (excluyendo
      //    esta misma reserva). Antes se bloqueaba a ciegas → sobreventa silenciosa.
      const rooms = splitRooms(newRooms);
      const avail = await checkAvailability(newCheckin, newCheckout, rooms, null, id);
      if (avail.unavailableRooms.length > 0) {
        // Rollback: restaurar el bloqueo anterior y no tocar la reserva.
        await blockRooms(oldRooms, oldCheckin, oldCheckout);
        return NextResponse.json(
          { error: `${avail.unavailableRooms.join(', ')} no disponible(s) del ${newCheckin} al ${newCheckout}. La reserva no se modificó.` },
          { status: 409 }
        );
      }
      // 3. Aplicar nuevo bloqueo
      await blockRooms(newRooms, newCheckin, newCheckout);
    }
    console.log(`✅ Reasignación Disponibilidad: [${oldRooms}] → [${newRooms}]`);
  }

  await updateBooking(booking.rowIndex, raw);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const bookings = await getAllBookings();
  const booking = bookings.find(b => b.confirmacion === id);
  if (!booking) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  // cancelBooking marca CANCELADA en Sheets Y llama unblockRooms (ya corregido para CSV)
  await cancelBooking(booking.rowIndex, booking.habitaciones, booking.checkin, booking.checkout);
  return NextResponse.json({ ok: true });
}
