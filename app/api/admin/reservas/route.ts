import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, createManualBooking } from '@/lib/admin/sheets-admin';
import { checkAvailability } from '@/lib/sheets';
import { checkAndEnrollLoyalty } from '@/lib/admin/loyalty';
import { Resend } from 'resend';

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

    // Fire-and-forget: loyalty check + email de notificación al equipo
    const allBookings = await getAllBookings();
    const guestBookings = allBookings.filter(
      b => b.email?.toLowerCase() === (data.email || '').toLowerCase() && b.estado !== 'CANCELADA'
    );
    checkAndEnrollLoyalty(data.email || '', guestBookings.length).catch(() => {});

    // Notificación por email al equipo del hotel
    notifyTeamNewBooking({ confirmacion, ...data }).catch(() => {});

    return NextResponse.json({ ok: true, confirmacion });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function notifyTeamNewBooking(data: {
  confirmacion: string; cliente?: string; habitacion?: string;
  checkin?: string; checkout?: string; total?: number; email?: string;
}) {
  const hotelEmail = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: hotelEmail,
      to: hotelEmail,
      subject: `🏨 Nueva reserva: ${data.confirmacion} — ${data.cliente || 'Sin nombre'}`,
      html: `<div style="font-family:sans-serif;padding:24px;max-width:480px;">
        <h2 style="color:#2a2218;margin:0 0 16px;">🏨 Nueva reserva creada</h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Folio</td><td style="padding:8px 0;font-weight:600;">${data.confirmacion}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Cliente</td><td style="padding:8px 0;">${data.cliente || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Suite</td><td style="padding:8px 0;">${data.habitacion || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Check-in</td><td style="padding:8px 0;">${data.checkin || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Check-out</td><td style="padding:8px 0;">${data.checkout || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Total</td><td style="padding:8px 0;font-weight:600;color:#2d7a34;">$${Number(data.total || 0).toLocaleString('es-MX')} MXN</td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#aaa;">Reserva creada desde el panel admin.</p>
      </div>`,
    });
  } catch { /* non-blocking */ }
}
