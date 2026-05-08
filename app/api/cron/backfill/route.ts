// Procesa reservas históricas que ya están en la BD
// Solo envía emails que todavía tienen sentido (post-stay dentro de 45 días,
// o pre-llegada futura). No reenvía lo que ya fue enviado.
// GET /api/cron/backfill?secret=CRON_SECRET&dryRun=true
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getAllBookings } from '@/lib/admin/sheets-admin';
import { getEmailsSent, markEmailSent, type EmailSequenceType } from '@/lib/email-tracking';
import {
  buildSurveyEmailHtml,
  buildReviewEmailHtml,
  buildReturnOfferEmailHtml,
  buildRestaurantEmailHtml,
  buildWelcomeGuideEmailHtml,
} from '@/lib/email-sequences';

export const dynamic = 'force-dynamic';

const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';

function todayMX(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateEs(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const f = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  return f.charAt(0).toUpperCase() + f.slice(1);
}

function promoExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const dryRun = searchParams.get('dryRun') !== 'false';
  const skipEmails = new Set(
    (searchParams.get('skipEmails') || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  );

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const today = todayMX();

  let welcomePdf: Buffer | null = null;
  try {
    welcomePdf = Buffer.from(await readFile(path.join(process.cwd(), 'public', 'guia-bienvenida.pdf')));
  } catch { /* sin adjunto */ }

  const [bookings, sentSet] = await Promise.all([getAllBookings(), getEmailsSent()]);

  const plan: { confirmacion: string; email: string; type: EmailSequenceType; reason: string; willSend: boolean }[] = [];
  const sent: string[] = [];
  const errors: string[] = [];

  for (const b of bookings) {
    if (b.estado === 'CANCELADA') continue;
    if (!b.email || b.email === 'N/A') continue;
    if (!b.checkin || !b.checkout) continue;
    if (skipEmails.has(b.email.toLowerCase())) continue;

    const checkin = b.checkin;
    const checkout = b.checkout;
    const first = b.cliente.trim().split(' ')[0];

    // Helper para registrar o enviar
    async function handle(
      type: EmailSequenceType,
      reason: string,
      subject: string,
      html: string,
      attachments?: { filename: string; content: Buffer }[],
    ) {
      const key = `${b.confirmacion}:${type}`;
      const alreadySent = sentSet.has(key);
      plan.push({ confirmacion: b.confirmacion, email: b.email, type, reason, willSend: !alreadySent && !dryRun });

      if (alreadySent || dryRun) return;
      try {
        const res = await resend.emails.send({ from: FROM, to: b.email, subject, html, attachments });
        await markEmailSent({
          confirmacion: b.confirmacion, emailType: type,
          enviadoAt: new Date().toISOString(),
          emailDestino: b.email,
          resendId: res.data?.id || '',
        });
        sent.push(`${type} → ${b.email} (${b.confirmacion})`);
        await new Promise(r => setTimeout(r, 200));
      } catch (e: any) {
        errors.push(`${type} → ${b.email}: ${e.message}`);
      }
    }

    // Post-estancia +1: checkout fue hace 1 día o más, hasta 45 días atrás
    const post1Date = shiftDate(checkout, 1);
    if (post1Date <= today && post1Date >= shiftDate(today, -45)) {
      await handle('post_day1', `checkout fue ${checkout}`,
        `${first}, ¿cómo fue tu estancia en Paraíso Encantado?`,
        buildSurveyEmailHtml({ customerName: b.cliente, confirmacion: b.confirmacion, checkin, checkout, habitaciones: b.habitaciones }));
    }

    // Post-estancia +7: checkout fue hace 7+ días, hasta 45 días
    const post7Date = shiftDate(checkout, 7);
    if (post7Date <= today && post7Date >= shiftDate(today, -45)) {
      await handle('post_day7', `checkout fue ${checkout}`,
        `${first}, ¿nos dejas una reseña en Google?`,
        buildReviewEmailHtml({ customerName: b.cliente, confirmacion: b.confirmacion, checkin }));
    }

    // Post-estancia +30: checkout fue hace 30+ días, hasta 45 días
    const post30Date = shiftDate(checkout, 30);
    if (post30Date <= today && post30Date >= shiftDate(today, -45)) {
      await handle('post_day30', `checkout fue ${checkout}`,
        `${first}, tu paraíso te espera — 10% de descuento exclusivo`,
        buildReturnOfferEmailHtml({ customerName: b.cliente, confirmacion: b.confirmacion, promoExpiry: promoExpiry() }));
    }

    // Pre-llegada -3: checkin es en 3+ días (futuro)
    const pre3Date = shiftDate(checkin, -3);
    if (pre3Date >= today && checkin > today) {
      await handle('pre_day3', `checkin el ${checkin}`,
        `${first}, ¿una cena especial en El Papán Huasteco?`,
        buildRestaurantEmailHtml({ customerName: b.cliente, confirmacion: b.confirmacion, checkin, checkinFormatted: formatDateEs(checkin) }));
    }

    // Pre-llegada: día del checkin (futuro o hoy)
    if (checkin >= today) {
      const attachments = welcomePdf
        ? [{ filename: 'Guia-de-Bienvenida-Paraiso-Encantado.pdf', content: welcomePdf }]
        : undefined;
      await handle('pre_checkin', `checkin el ${checkin}`,
        `¡Hoy es el día, ${first}! — Tu suite te espera`,
        buildWelcomeGuideEmailHtml({ customerName: b.cliente, confirmacion: b.confirmacion, checkin, habitaciones: b.habitaciones }),
        attachments);
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    today,
    totalBookings: bookings.length,
    plannedEmails: plan.length,
    sentEmails: sent.length,
    errors: errors.length,
    plan: dryRun ? plan : undefined,
    sent: dryRun ? undefined : sent,
    errorDetails: errors,
  });
}
