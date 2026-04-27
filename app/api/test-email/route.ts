import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  const to = email || 'daftpunkmanolo@gmail.com';

  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'onboarding@paraisoencantado.com';

  if (!key) return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: 'Email de prueba — Paraíso Encantado',
    html: '<p>Si recibes esto, el sistema de email funciona correctamente.</p>',
  });

  return NextResponse.json({
    from,
    to,
    key_prefix: key.slice(0, 8) + '...',
    resend_data: data,
    resend_error: error,
  });
}
