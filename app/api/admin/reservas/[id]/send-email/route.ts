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

  const html = buildEmailHtml({
    customerName: b.cliente,
    confirmationNumber: b.confirmacion,
    checkin: b.checkin,
    checkout: b.checkout,
    nights: b.noches,
    adults: b.huespedes,
    total: b.total,
    rooms: [{ name: b.habitaciones, guestCount: b.huespedes, totalPrice: b.total }],
    paymentIntentId: b.paymentId || 'MANUAL',
  });

  try {
    await resend.emails.send({
      from: FROM,
      to: b.email,
      subject: `✓ Reserva confirmada ${b.confirmacion} — Paraíso Encantado`,
      html,
    });
    await logAgentActivity('email_confirmacion', b.confirmacion);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
