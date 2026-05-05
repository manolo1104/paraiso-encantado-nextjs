import { NextRequest, NextResponse } from 'next/server';
import { getAllQuotes, updateQuoteStatus } from '@/lib/admin/sheets-admin';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quotes = await getAllQuotes();
  const quote = quotes.find(q => q.id === id);
  if (!quote) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });

  const formatDate = (d: string) => {
    if (!d) return d;
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:'Jost',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf8f5;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#1e3012;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#c9a97a;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Paraíso Encantado · Xilitla</p>
            <h1 style="margin:8px 0 0;color:#faf8f5;font-size:28px;font-weight:300;">Tu Cotización</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#2a2218;font-size:16px;margin:0 0 24px;">Hola <strong>${quote.cliente}</strong>,</p>
            <p style="color:#3d2b14;font-size:15px;margin:0 0 32px;">Con gusto te compartimos la cotización que solicitaste para el Hotel Paraíso Encantado.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;border-radius:6px;padding:24px;margin-bottom:32px;">
              <tr><td style="padding:6px 0;color:#624820;font-size:13px;">Suite</td><td style="padding:6px 0;color:#1e3012;font-weight:600;text-align:right;">${quote.suite}</td></tr>
              <tr><td style="padding:6px 0;color:#624820;font-size:13px;">Check-in</td><td style="padding:6px 0;color:#1e3012;font-weight:600;text-align:right;">${formatDate(quote.checkin)}</td></tr>
              <tr><td style="padding:6px 0;color:#624820;font-size:13px;">Check-out</td><td style="padding:6px 0;color:#1e3012;font-weight:600;text-align:right;">${formatDate(quote.checkout)}</td></tr>
              <tr><td style="padding:6px 0;color:#624820;font-size:13px;">Noches</td><td style="padding:6px 0;color:#1e3012;font-weight:600;text-align:right;">${quote.noches}</td></tr>
              <tr style="border-top:1px solid #e4ddd3;">
                <td style="padding:12px 0 6px;color:#1e3012;font-size:15px;font-weight:700;">Total</td>
                <td style="padding:12px 0 6px;color:#1e3012;font-size:20px;font-weight:700;text-align:right;">$${quote.precioTotal.toLocaleString('es-MX')} MXN</td>
              </tr>
            </table>

            ${quote.notas ? `<p style="color:#3d2b14;font-size:14px;margin:0 0 32px;padding:16px;background:#f0ebe3;border-radius:6px;">${quote.notas}</p>` : ''}

            <p style="color:#624820;font-size:13px;margin:0 0 24px;">Esta cotización es válida por <strong>48 horas</strong>. Para confirmar tu reserva:</p>

            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="https://www.paraisoencantado.com/reservar?checkin=${quote.checkin}&checkout=${quote.checkout}"
                 style="display:inline-block;background:#1e3012;color:#faf8f5;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:600;">
                Confirmar mi reserva
              </a>
            </td></tr></table>

            <p style="color:#6b8e4e;font-size:13px;text-align:center;margin:24px 0 0;">
              También puedes escribirnos por WhatsApp:<br>
              <a href="https://wa.me/524891007679" style="color:#1e3012;font-weight:600;">+52 489 100 7679</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#1e3012;padding:24px 40px;text-align:center;">
            <p style="color:#c9a97a;font-size:12px;margin:0;">Hotel Paraíso Encantado · Xilitla, San Luis Potosí</p>
            <p style="color:rgba(250,248,245,0.5);font-size:11px;margin:4px 0 0;">paraisoencantado.com</p>
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
      to: quote.email,
      subject: `Tu cotización — ${quote.suite} · Paraíso Encantado`,
      html,
    });

    await updateQuoteStatus(quote.rowIndex, 'ENVIADA');
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
