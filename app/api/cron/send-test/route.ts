// Endpoint temporal para enviar correos de prueba de las 5 secuencias
// GET /api/cron/send-test?secret=CRON_SECRET&email=tumail@gmail.com
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildSurveyEmailHtml,
  buildReviewEmailHtml,
  buildReturnOfferEmailHtml,
  buildRestaurantEmailHtml,
  buildWelcomeGuideEmailHtml,
} from '@/lib/email-sequences';

export const dynamic = 'force-dynamic';

const SAMPLE = {
  customerName: 'Mario García',
  confirmacion: 'PE-M-TEST001',
  checkin: '2026-06-15',
  checkout: '2026-06-17',
  habitaciones: 'Suite Jungla',
  checkinFormatted: 'Lunes 15 de junio',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const toEmail = searchParams.get('email');

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!toEmail) {
    return NextResponse.json({ error: 'Falta ?email=...' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';

  let welcomePdf: Buffer | null = null;
  try {
    welcomePdf = Buffer.from(await readFile(path.join(process.cwd(), 'public', 'guia-bienvenida.pdf')));
  } catch { /* sin adjunto en prueba */ }

  const emails = [
    {
      subject: '[PRUEBA] ¿Cómo fue tu estancia en Paraíso Encantado?',
      html: buildSurveyEmailHtml(SAMPLE),
    },
    {
      subject: '[PRUEBA] ¿Nos dejas una reseña en Google?',
      html: buildReviewEmailHtml(SAMPLE),
    },
    {
      subject: '[PRUEBA] Tu paraíso te espera — 10% de descuento exclusivo',
      html: buildReturnOfferEmailHtml({ ...SAMPLE, promoExpiry: '15 de julio de 2026' }),
    },
    {
      subject: '[PRUEBA] ¿Una cena especial en El Papán Huasteco?',
      html: buildRestaurantEmailHtml(SAMPLE),
    },
    {
      subject: '[PRUEBA] ¡Hoy es el día! — Tu suite te espera',
      html: buildWelcomeGuideEmailHtml(SAMPLE),
      attachments: welcomePdf
        ? [{ filename: 'Guia-de-Bienvenida-Paraiso-Encantado.pdf', content: welcomePdf }]
        : undefined,
    },
  ];

  const results = [];
  for (const e of emails) {
    try {
      const res = await resend.emails.send({ from: FROM, to: toEmail, subject: e.subject, html: e.html, attachments: e.attachments });
      results.push({ subject: e.subject, id: res.data?.id, ok: true });
    } catch (err: any) {
      results.push({ subject: e.subject, error: err.message, ok: false });
    }
    await new Promise(r => setTimeout(r, 300)); // pequeña pausa entre envíos
  }

  return NextResponse.json({ ok: true, sentTo: toEmail, results });
}
