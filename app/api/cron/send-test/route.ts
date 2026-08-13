// Correos de prueba de TODAS las secuencias automáticas.
//
//   Enviar todo:  GET /api/cron/send-test?secret=CRON_SECRET&email=tu@correo.com
//   Solo ver uno: GET /api/cron/send-test?secret=CRON_SECRET&preview=post_day7
//
// `preview` devuelve el HTML sin enviar nada — sirve para revisar un cambio de
// texto sin llenarse la bandeja ni gastar envíos de Resend.
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildSurveyEmailHtml,
  buildReviewEmailHtml,
  buildReturnOfferEmailHtml,
  buildToursEmailHtml,
  buildWelcomeGuideEmailHtml,
} from '@/lib/email-sequences';
import { buildRecoveryEmailHtml, recoverySubject } from '@/lib/email-recovery';

export const dynamic = 'force-dynamic';

const SAMPLE = {
  customerName: 'Mario García',
  confirmacion: 'PE-M-TEST001',
  checkin: '2026-06-15',
  checkout: '2026-06-17',
  habitaciones: 'Suite Jungla',
  checkinFormatted: 'Lunes 15 de junio',
};

// Reserva incompleta de ejemplo, para los correos de recuperación de carrito
const SAMPLE_RECOVERY = {
  nombre: 'Mario García',
  checkin: '2026-06-15',
  checkout: '2026-06-17',
  noches: 2,
  habitaciones: 'Suite Jungla (2 personas)',
  total: 4000,
  pagaHoy: 2000,
  resumeUrl: 'https://www.paraisoencantado.com/reservar?checkin=2026-06-15&checkout=2026-06-17&adults=2&rooms=4:2&recuperar=1',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const toEmail = searchParams.get('email');
  const preview = searchParams.get('preview');

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!toEmail && !preview) {
    return NextResponse.json({ error: 'Falta ?email=... (o ?preview=<tipo>)' }, { status: 400 });
  }

  const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';

  let welcomePdf: Buffer | null = null;
  try {
    welcomePdf = Buffer.from(await readFile(path.join(process.cwd(), 'public', 'guia-bienvenida.pdf')));
  } catch { /* sin adjunto en prueba */ }

  const emails = [
    {
      id: 'post_day1',
      subject: '[PRUEBA] ¿Cómo fue tu estancia en Paraíso Encantado?',
      html: buildSurveyEmailHtml(SAMPLE),
    },
    {
      id: 'post_day7',
      subject: '[PRUEBA] ¿Nos dejas una reseña en Google?',
      html: buildReviewEmailHtml(SAMPLE),
    },
    {
      id: 'post_day30',
      subject: '[PRUEBA] Tu paraíso te espera — 10% de descuento exclusivo',
      html: buildReturnOfferEmailHtml({ ...SAMPLE, promoExpiry: '15 de julio de 2026' }),
    },
    {
      id: 'pre_day3',
      subject: '[PRUEBA] ¿Ya elegiste tus tours en la Huasteca?',
      html: buildToursEmailHtml(SAMPLE),
    },
    {
      id: 'pre_checkin',
      subject: '[PRUEBA] ¡Hoy es el día! — Tu suite te espera',
      html: buildWelcomeGuideEmailHtml(SAMPLE),
      attachments: welcomePdf
        ? [{ filename: 'Guia-de-Bienvenida-Paraiso-Encantado.pdf', content: welcomePdf }]
        : undefined,
    },
    {
      id: 'recuperacion_1',
      subject: `[PRUEBA] ${recoverySubject({ ...SAMPLE_RECOVERY, variant: 1 })}`,
      html: buildRecoveryEmailHtml({ ...SAMPLE_RECOVERY, variant: 1 }),
    },
    {
      id: 'recuperacion_2',
      subject: `[PRUEBA] ${recoverySubject({ ...SAMPLE_RECOVERY, variant: 2 })}`,
      html: buildRecoveryEmailHtml({ ...SAMPLE_RECOVERY, variant: 2 }),
    },
  ];

  // Modo revisión: devuelve el HTML de uno sin enviar nada
  if (preview) {
    const found = emails.find(e => e.id === preview);
    if (!found) {
      return NextResponse.json({ error: `preview inválido. Opciones: ${emails.map(e => e.id).join(', ')}` }, { status: 400 });
    }
    return new NextResponse(found.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // A partir de aquí sí se envía: el cliente se crea ahora, no antes, para que
  // `?preview=` funcione en entornos sin RESEND_API_KEY (p. ej. local).
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY no configurada — usa ?preview=<tipo> para solo ver el HTML' }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const results = [];
  for (const e of emails) {
    try {
      const res = await resend.emails.send({ from: FROM, to: toEmail!, subject: e.subject, html: e.html, attachments: e.attachments });
      results.push({ subject: e.subject, id: res.data?.id, ok: true });
    } catch (err: any) {
      results.push({ subject: e.subject, error: err.message, ok: false });
    }
    await new Promise(r => setTimeout(r, 300)); // pequeña pausa entre envíos
  }

  return NextResponse.json({ ok: true, sentTo: toEmail, results });
}
