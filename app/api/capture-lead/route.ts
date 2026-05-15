import { NextRequest, NextResponse } from 'next/server';
import { addLead } from '@/lib/sheets';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();

    // 1. Save to Google Sheets (fire-and-forget)
    addLead(cleanEmail).catch(() => {});

    // 2. Send welcome email with the "Guía Secreta de Xilitla"
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';
      resend.emails.send({
        from: FROM,
        to: cleanEmail,
        subject: 'Tu Guía Secreta de Xilitla 🌿 — Paraíso Encantado',
        html: buildWelcomeEmail(),
      }).catch(() => {});
    }

    console.log(`💰 LEAD_CAPTURED  email=${cleanEmail.slice(0, 4)}***`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

function buildWelcomeEmail(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu Guía Secreta de Xilitla</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#faf8f5;border-radius:4px;overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:#1c2b1e;padding:40px 48px;text-align:center;">
    <p style="margin:0 0 8px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(201,169,110,0.8);font-family:inherit;">Bienvenido a</p>
    <h1 style="margin:0;font-size:28px;font-weight:300;color:#f5f0e8;line-height:1.2;font-family:Georgia,serif;">Paraíso <em style="font-style:italic;color:#c9a96e;">Encantado</em></h1>
    <p style="margin:8px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(138,158,140,0.8);font-family:inherit;">Xilitla · Huasteca Potosina</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:48px;">
    <p style="margin:0 0 24px;font-size:24px;font-weight:300;color:#1c2b1e;line-height:1.2;font-family:Georgia,serif;">Tu guía secreta <em style="font-style:italic;">está aquí.</em></p>
    <p style="margin:0 0 20px;font-size:15px;color:#5a5a4a;line-height:1.8;">Gracias por suscribirte. Aquí van los datos que la mayoría de los viajeros no encuentra en las guías de turismo:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f2ec;border-left:3px solid #c9a96e;margin:0 0 28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;font-family:inherit;">Xilitla sin filtros</p>
        <ul style="margin:0;padding:0 0 0 16px;font-size:13px;color:#5a5a4a;line-height:2.2;">
          <li><strong>Las Pozas</strong> — entra de mañana temprano (9:00–10:00 AM) para evitar grupos y tener la luz perfecta para fotos.</li>
          <li><strong>Mejor época</strong> — Octubre a Abril: clima fresco (18–24°C), menos lluvia, cascadas con buen nivel de agua.</li>
          <li><strong>Sendero secreto</strong> — a 10 min caminando del hotel está el mirador con la mejor vista panorámica de Xilitla. Pregúntanos en recepción.</li>
          <li><strong>Tarde perfecta</strong> — Regresa de Las Pozas a las 2 PM, come en nuestro restaurante El Papán Huasteco, y llega a tu spa privado con luz de tarde.</li>
          <li><strong>Tip local</strong> — el mercado de Xilitla los domingos (7–11 AM) tiene el mejor café de olla y tamales de la sierra.</li>
        </ul>
      </td></tr>
    </table>

    <p style="margin:0 0 28px;font-size:13px;color:#5a5a4a;line-height:1.8;">Como suscriptor eres el primero en enterarse de <strong>tarifas exclusivas y paquetes especiales</strong> antes de que salgan al público.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px;">
      <tr><td style="background:#1c2b1e;padding:14px 32px;border-radius:2px;text-align:center;">
        <a href="https://www.paraisoencantado.com/reservar" style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a96e;text-decoration:none;font-family:inherit;">Ver disponibilidad y reservar</a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:12px;color:#9a9a82;line-height:1.6;text-align:center;">¿Tienes preguntas? Escríbenos por <a href="https://wa.me/524891007679" style="color:#5a7a5c;">WhatsApp +52 489 100 7679</a></p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f0ece3;padding:24px 48px;text-align:center;border-top:1px solid #e8e4da;">
    <p style="margin:0 0 6px;font-size:13px;font-style:italic;color:#7a7a6a;font-family:Georgia,serif;">Paraíso Encantado</p>
    <p style="margin:0;font-size:11px;color:#9a9a82;line-height:1.8;">Xilitla, San Luis Potosí 79910 · México<br>A 5 min del Jardín de Edward James</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
