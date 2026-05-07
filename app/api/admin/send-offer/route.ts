import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { email, nombre, suitesFavoritas, ultimaEstancia, totalReservas, notas } = await req.json();

  if (!email || !nombre) {
    return NextResponse.json({ error: 'email y nombre requeridos' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Eres el asistente de comunicación de Paraíso Encantado, un hotel boutique de lujo en Xilitla, SLP.
Escribe un email personalizado de oferta especial para un huésped frecuente. El email debe:
- Ser cálido y personal, no genérico
- Mencionar su historial con el hotel
- Ofrecer una promoción atractiva (descuento del 15% en su próxima estancia, o upgrade gratuito)
- Terminar con llamada a la acción clara
- Máximo 200 palabras
- Formato: solo texto del cuerpo del email (sin asunto, sin encabezados HTML)

Datos del huésped:
- Nombre: ${nombre}
- Estancias totales: ${totalReservas}
- Última visita: ${ultimaEstancia || 'no registrada'}
- Suites que ha reservado: ${suitesFavoritas?.join(', ') || 'varias'}
- Notas internas: ${notas || 'ninguna'}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const emailBody = (response.content[0] as { type: string; text: string }).text;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2d3b2e; }
    .header { background: #2d4a3e; padding: 32px; text-align: center; }
    .header h1 { font-family: Georgia, serif; color: #C9A97A; font-size: 1.5rem; font-weight: 400; margin: 0; letter-spacing: 0.1em; }
    .body { padding: 32px; background: #FAF8F5; line-height: 1.7; font-size: 0.95rem; }
    .cta { display: inline-block; margin: 20px 0; padding: 12px 28px; background: #2d4a3e; color: #C9A97A; text-decoration: none; border-radius: 3px; font-size: 0.875rem; letter-spacing: 0.05em; }
    .footer { padding: 20px 32px; font-size: 0.75rem; color: #888; border-top: 1px solid #e4ddd3; }
  </style>
</head>
<body>
  <div class="header"><h1>Paraíso Encantado · Xilitla</h1></div>
  <div class="body">
    ${emailBody.replace(/\n/g, '<br>')}
    <br><br>
    <a class="cta" href="https://paraisoencantado.com/reservar">Reservar ahora →</a>
  </div>
  <div class="footer">Paraíso Encantado · Xilitla, San Luis Potosí, México · paraisoencantado.com</div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${nombre.split(' ')[0]}, tenemos algo especial para ti en Paraíso Encantado 🌿`,
      html,
    });
    return NextResponse.json({ ok: true, preview: emailBody });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
