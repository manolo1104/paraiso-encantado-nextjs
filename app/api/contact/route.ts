import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, email, telefono, fechaTentativa, noches, mensaje, _hp } = body;

    // Honeypot antispam — si este campo tiene valor, es un bot
    if (_hp) return NextResponse.json({ ok: true });

    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: 'Nombre, email y mensaje son requeridos' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';

    // Email al equipo del hotel
    await resend.emails.send({
      from: FROM,
      to: 'reservas@paraisoencantado.com',
      replyTo: email,
      subject: `Nuevo mensaje de contacto — ${nombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;padding:24px">
          <h2 style="color:#1a2e1a;margin:0 0 20px">Nuevo mensaje desde /contacto</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;font-size:13px;width:140px">Nombre</td><td style="padding:8px 0;font-weight:600">${nombre}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#1a2e1a">${email}</a></td></tr>
            ${telefono ? `<tr><td style="padding:8px 0;color:#888;font-size:13px">Teléfono</td><td style="padding:8px 0"><a href="tel:${telefono}" style="color:#1a2e1a">${telefono}</a></td></tr>` : ''}
            ${fechaTentativa ? `<tr><td style="padding:8px 0;color:#888;font-size:13px">Fecha tentativa</td><td style="padding:8px 0">${fechaTentativa}</td></tr>` : ''}
            ${noches ? `<tr><td style="padding:8px 0;color:#888;font-size:13px">Noches</td><td style="padding:8px 0">${noches}</td></tr>` : ''}
          </table>
          <div style="margin-top:20px;background:#f5f5f0;padding:16px;border-left:3px solid #c9a97a">
            <p style="margin:0;color:#333;line-height:1.7;white-space:pre-wrap">${mensaje}</p>
          </div>
          <p style="margin-top:16px;font-size:11px;color:#aaa">Enviado desde paraisoencantado.com/contacto</p>
        </div>
      `,
    });

    // Confirmación automática al usuario
    resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Recibimos tu mensaje — Paraíso Encantado',
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
          <div style="background:#1a2e1a;padding:32px;text-align:center">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,169,110,.8)">Hotel Paraíso Encantado</p>
            <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-style:italic;font-weight:300;color:#f5f0e8">Hola, ${nombre}.</h1>
          </div>
          <div style="padding:32px;background:#faf8f5">
            <p style="font-size:15px;color:#4a3f30;line-height:1.8;margin:0 0 20px">
              Recibimos tu mensaje y te responderemos en <strong>menos de 2 horas</strong> — por este correo o por WhatsApp si nos dejaste tu número.
            </p>
            <p style="font-size:14px;color:#7a7060;line-height:1.7;margin:0 0 24px">
              Si necesitas una respuesta urgente, escríbenos directamente por WhatsApp:
            </p>
            <a href="https://wa.me/524891007679" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 28px;font-size:13px;letter-spacing:1px">
              WhatsApp: +52 489-100-7679
            </a>
          </div>
          <div style="background:#f0ece3;padding:20px;text-align:center;font-size:11px;color:#9a9a82">
            Paraíso Encantado · Xilitla, San Luis Potosí · paraisoencantado.com
          </div>
        </div>
      `,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Contact form error:', e.message);
    return NextResponse.json({ error: 'Error al enviar el mensaje' }, { status: 500 });
  }
}
