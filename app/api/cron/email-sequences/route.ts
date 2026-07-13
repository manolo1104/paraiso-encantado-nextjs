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
// Lookback máximo: no enviar post-stay a reservas con más de 45 días de antigüedad
const MAX_LOOKBACK_DAYS = 45;
// La encuesta "¿cómo fue tu estancia?" pierde sentido si llega tarde: solo se
// envía dentro de los primeros días tras el checkout (ventana [checkout+1,
// checkout+SURVEY_MAX_DAYS]). Así el lote de recuperación no manda encuestas
// atrasadas a estancias de hace semanas (la reseña y la oferta sí se envían).
const SURVEY_MAX_DAYS = 4;

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

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function promoExpiry(): string {
  return addDays(new Date(), 30).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City',
  });
}

const BATCH_SIZE = 50;
const WALL_CLOCK_MS = 25_000;

export async function GET(req: NextRequest) {
  // Autenticación: Railway envía Authorization: Bearer $CRON_SECRET
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // cursor: offset de bookings elegibles para esta ejecución
  const cursorParam = req.nextUrl.searchParams.get('cursor');
  const cursor = Math.max(0, parseInt(cursorParam ?? '0', 10) || 0);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const today = todayMX();
  const maxPastDate = shiftDate(today, -MAX_LOOKBACK_DAYS);
  const deadline = Date.now() + WALL_CLOCK_MS;

  const [bookings, sentSet] = await Promise.all([
    getAllBookings(),
    getEmailsSent(),
  ]);

  // Cargar PDF de guía de bienvenida (adjunto para el email del día de checkin)
  let welcomePdf: Buffer | null = null;
  try {
    welcomePdf = Buffer.from(
      await readFile(path.join(process.cwd(), 'public', 'guia-bienvenida.pdf'))
    );
  } catch {
    console.warn('[cron] No se pudo cargar guia-bienvenida.pdf — se enviará sin adjunto');
  }

  // Filtrar elegibles primero, luego paginar con cursor
  const eligible = bookings.filter(b =>
    b.estado !== 'CANCELADA' &&
    b.email && b.email !== 'N/A' &&
    b.checkin && b.checkout &&
    b.checkout >= maxPastDate
  );
  const page = eligible.slice(cursor, cursor + BATCH_SIZE);
  // nextCursor se calcula DESPUÉS del bucle según cuántas reservas se procesaron
  // realmente (el corte por wall-clock puede detenerse a media página).
  let processedInPage = 0;

  const results = { sent: 0, skipped: 0, errors: 0, cutByTime: false, details: [] as string[] };

  async function send(
    confirmacion: string,
    email: string,
    emailType: EmailSequenceType,
    subject: string,
    html: string,
    attachments?: { filename: string; content: Buffer }[],
  ) {
    const key = `${confirmacion}:${emailType}`;
    if (sentSet.has(key)) { results.skipped++; return; }

    try {
      // Resend v4 NO lanza excepción cuando el envío falla: devuelve { data, error }.
      // Hay que revisar `error` explícitamente; si no, un fallo se registraría como
      // "enviado" y el cliente nunca recibiría el correo (sin reintento).
      const { data, error } = await resend.emails.send({ from: FROM, to: email, subject, html, attachments });
      if (error) {
        results.errors++;
        results.details.push(`✗ ${emailType} → ${email}: ${error.message}`);
        return; // No marcar como enviado → se reintenta en la próxima corrida (ventana por rango)
      }
      await markEmailSent({
        confirmacion, emailType,
        enviadoAt: new Date().toISOString(),
        emailDestino: email,
        resendId: data?.id || '',
      });
      // Evita reenvíos dentro de la misma corrida (p.ej. varias secuencias para la misma reserva)
      sentSet.add(key);
      results.sent++;
      results.details.push(`✓ ${emailType} → ${email} (${confirmacion})`);
    } catch (e: any) {
      results.errors++;
      results.details.push(`✗ ${emailType} → ${email}: ${e.message}`);
    }
  }

  for (const b of page) {
    // Cortar si se superó el límite de tiempo
    if (Date.now() > deadline) {
      results.cutByTime = true;
      const remaining = eligible.length - cursor - processedInPage;
      console.warn(`[cron/email-sequences] Wall-clock de 25 s superado — ${remaining} bookings pendientes`);
      break;
    }
    processedInPage++;

    const checkin  = b.checkin;  // YYYY-MM-DD
    const checkout = b.checkout; // YYYY-MM-DD

    const first = b.cliente.trim().split(' ')[0];

    // ── Regla: "en o después del día objetivo, mientras no se haya enviado"
    // El sentSet dentro de send() impide duplicados. Esta lógica permite
    // que el cron recupere envíos perdidos si falló un día.

    // Pre-llegada: ventana [-3, -1) días antes del checkin (no enviar después de que ya llegaron)
    if (shiftDate(checkin, -3) <= today && today < checkin) {
      await send(
        b.confirmacion, b.email, 'pre_day3',
        `${first}, ¿una cena especial en El Papán Huasteco?`,
        buildRestaurantEmailHtml({
          customerName: b.cliente, confirmacion: b.confirmacion,
          checkin, checkinFormatted: formatDateEs(checkin),
        }),
      );
    }

    // Día del checkin: ventana [0, +1) para recuperar si el cron no corrió exactamente ese día
    if (checkin <= today && today <= shiftDate(checkin, 1)) {
      const attachments = welcomePdf
        ? [{ filename: 'Guia-de-Bienvenida-Paraiso-Encantado.pdf', content: welcomePdf }]
        : undefined;
      await send(
        b.confirmacion, b.email, 'pre_checkin',
        `¡Hoy es el día, ${first}! — Tu suite te espera`,
        buildWelcomeGuideEmailHtml({
          customerName: b.cliente, confirmacion: b.confirmacion,
          checkin, habitaciones: b.habitaciones,
        }),
        attachments,
      );
    }

    // Post-estancia: encuesta solo si la salida es reciente (ventana corta),
    // para no mandar encuestas atrasadas en el lote de recuperación.
    if (shiftDate(checkout, 1) <= today && today <= shiftDate(checkout, SURVEY_MAX_DAYS)) {
      await send(
        b.confirmacion, b.email, 'post_day1',
        `${first}, ¿cómo fue tu estancia en Paraíso Encantado?`,
        buildSurveyEmailHtml({
          customerName: b.cliente, confirmacion: b.confirmacion,
          checkin, checkout, habitaciones: b.habitaciones,
        }),
      );
    }

    // ── Post-estancia: +7 días ───────────────────────────────────────────
    if (shiftDate(checkout, 7) <= today) {
      await send(
        b.confirmacion, b.email, 'post_day7',
        `${first}, ¿nos dejas una reseña en Google?`,
        buildReviewEmailHtml({
          customerName: b.cliente, confirmacion: b.confirmacion, checkin,
        }),
      );
    }

    // ── Post-estancia: +30 días ──────────────────────────────────────────
    if (shiftDate(checkout, 30) <= today) {
      await send(
        b.confirmacion, b.email, 'post_day30',
        `${first}, tu paraíso te espera — 10% de descuento exclusivo`,
        buildReturnOfferEmailHtml({
          customerName: b.cliente, confirmacion: b.confirmacion,
          promoExpiry: promoExpiry(),
        }),
      );
    }
  }

  // Cursor real según lo procesado (cubre el corte por wall-clock a media página)
  const advanced = cursor + processedInPage;
  const nextCursor = advanced < eligible.length ? advanced : null;

  // ── Encadenar la siguiente página automáticamente ─────────────────────────
  // El cron externo (Railway) llama a este endpoint UNA vez sin cursor. Para
  // cubrir TODAS las reservas (no solo las primeras 50), disparamos la próxima
  // página nosotros mismos: fire-and-forget al mismo endpoint con ?cursor=N.
  // Railway mantiene el proceso vivo, así que el fetch en segundo plano termina.
  // El sentSet + ventanas por rango hacen esto idempotente y auto-recuperable.
  if (nextCursor !== null) {
    const nextUrl = new URL(req.nextUrl.pathname, req.nextUrl.origin);
    nextUrl.searchParams.set('cursor', String(nextCursor));
    void fetch(nextUrl.toString(), { headers: { authorization: `Bearer ${secret}` } })
      .catch((e: any) => console.error('[cron/email-sequences] fallo al encadenar cursor:', e?.message || e));
  }

  console.log(
    `[cron/email-sequences] ${today} cursor:${cursor}→${nextCursor ?? 'fin'} ` +
    `sent:${results.sent} skipped:${results.skipped} errors:${results.errors}` +
    (results.cutByTime ? ' ⚠️ cortado por tiempo' : '')
  );
  return NextResponse.json({
    ok: true,
    date: today,
    cursor,
    nextCursor,
    processed: processedInPage,
    pending: nextCursor !== null ? eligible.length - advanced : 0,
    ...results,
  });
}
