import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, logAgentActivity } from '@/lib/admin/sheets-admin';
import { buildEmailHtml } from '@/lib/email';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';

  const bookings = await getAllBookings();
  const b = bookings.find(x => x.confirmacion === id);
  if (!b) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  if (!b.email || b.email === 'N/A') return NextResponse.json({ error: 'Sin email registrado' }, { status: 400 });

  // Strip "(X personas)" suffix from room names stored by web flow
  const rawRooms = b.habitaciones.split(',').map(s => s.trim()).filter(Boolean);
  const toursTotal = 0; // reservas don't track per-tour prices separately here
  const habsTotal = b.total;
  const pricePerRoom = rawRooms.length > 0 ? Math.round(habsTotal / rawRooms.length) : b.total;

  const rooms = rawRooms.map(raw => {
    const guestsMatch = raw.match(/\((\d+)\s*persona/i);
    const guestCount = guestsMatch ? parseInt(guestsMatch[1]) : Math.max(1, Math.round(b.huespedes / rawRooms.length));
    const name = raw.replace(/\s*\([^)]*\)/g, '').trim();
    return { name, guestCount, totalPrice: pricePerRoom };
  });

  // Extract client-visible notes (before ||INTERNO||)
  const notasCliente = (b.notas || '').split('||INTERNO||')[0].split('||TOURS||')[0].split('||PAQUETES||')[0].trim();

  const html = buildEmailHtml({
    customerName:       b.cliente,
    confirmationNumber: b.confirmacion,
    checkin:            b.checkin,
    checkout:           b.checkout,
    nights:             b.noches,
    guests:             b.huespedes,
    total:              b.total,
    rooms,
    paymentIntentId:    b.paymentId || 'MANUAL',
    anticipo:           b.anticipo || 0,
    notas:              notasCliente,
  });

  try {
    const adminTo = process.env.ADMIN_EMAIL || FROM;
    const bcc = Array.from(new Set([adminTo, 'marioarturocovarrubias@hotmail.com']));
    await resend.emails.send({
      from: FROM,
      to: b.email,
      bcc,
      subject: `Tu estadía está confirmada — ${b.confirmacion}`,
      html,
    });
    await logAgentActivity('email_confirmacion', b.confirmacion);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
