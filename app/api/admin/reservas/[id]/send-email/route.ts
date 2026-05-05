import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings } from '@/lib/admin/sheets-admin';
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

  const fmtDate = (d: string) => {
    if (!d) return d;
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:'Jost',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf8f5;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#1e3012;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#c9a97a;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Paraíso Encantado · Xilitla</p>
            <h1 style="margin:8px 0 4px;color:#faf8f5;font-size:26px;font-weight:300;">✓ Reserva Confirmada</h1>
            <p style="margin:0;color:rgba(250,248,245,0.7);font-size:13px;">${b.confirmacion}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#2a2218;font-size:16px;margin:0 0 24px;">Hola <strong>${b.cliente}</strong>,</p>
            <p style="color:#3d2b14;font-size:15px;margin:0 0 32px;">Tu reserva está confirmada. Aquí tienes todos los detalles:</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;border-radius:6px;padding:24px;margin-bottom:32px;">
              <tr><td style="padding:7px 0;color:#624820;font-size:13px;">Suite</td><td style="padding:7px 0;color:#1e3012;font-weight:600;text-align:right;">${b.habitaciones}</td></tr>
              <tr><td style="padding:7px 0;color:#624820;font-size:13px;">Check-in</td><td style="padding:7px 0;color:#1e3012;font-weight:600;text-align:right;">${fmtDate(b.checkin)} — 15:00 hrs</td></tr>
              <tr><td style="padding:7px 0;color:#624820;font-size:13px;">Check-out</td><td style="padding:7px 0;color:#1e3012;font-weight:600;text-align:right;">${fmtDate(b.checkout)} — 12:00 hrs</td></tr>
              <tr><td style="padding:7px 0;color:#624820;font-size:13px;">Noches</td><td style="padding:7px 0;color:#1e3012;font-weight:600;text-align:right;">${b.noches}</td></tr>
              <tr><td style="padding:7px 0;color:#624820;font-size:13px;">Huéspedes</td><td style="padding:7px 0;color:#1e3012;font-weight:600;text-align:right;">${b.huespedes} personas</td></tr>
              ${b.notas ? `<tr><td style="padding:7px 0;color:#624820;font-size:13px;">Notas</td><td style="padding:7px 0;color:#1e3012;text-align:right;font-size:13px;">${b.notas}</td></tr>` : ''}
              <tr style="border-top:1px solid #e4ddd3;">
                <td style="padding:14px 0 6px;color:#1e3012;font-size:16px;font-weight:700;">Total</td>
                <td style="padding:14px 0 6px;color:#1e3012;font-size:22px;font-weight:700;text-align:right;">$${b.total.toLocaleString('es-MX')} MXN</td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:10px;background:#f0f7f0;border-radius:4px;font-size:13px;color:#2d7a34;">✓ Cancelación gratuita hasta 48 hrs antes</td>
              </tr>
              <tr><td style="height:8px"></td></tr>
              <tr>
                <td style="padding:10px;background:#f0f7f0;border-radius:4px;font-size:13px;color:#2d7a34;">✓ Estacionamiento privado gratuito</td>
              </tr>
              <tr><td style="height:8px"></td></tr>
              <tr>
                <td style="padding:10px;background:#f0f7f0;border-radius:4px;font-size:13px;color:#2d7a34;">✓ WiFi de alta velocidad incluido</td>
              </tr>
            </table>

            <p style="color:#624820;font-size:13px;margin:0 0 12px;">¿Tienes alguna pregunta? Escríbenos:</p>
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="https://wa.me/524891007679"
                 style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:600;">
                💬 WhatsApp +52 489-100-7679
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="background:#1e3012;padding:24px 40px;text-align:center;">
            <p style="color:#c9a97a;font-size:12px;margin:0 0 4px;">Hotel Paraíso Encantado · Xilitla, San Luis Potosí</p>
            <p style="color:rgba(250,248,245,0.5);font-size:11px;margin:0;">paraisoencantado.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: b.email,
      subject: `✓ Reserva confirmada ${b.confirmacion} — Paraíso Encantado`,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
