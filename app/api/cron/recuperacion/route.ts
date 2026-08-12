import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getPendingIncomplete, markRecoverySent, type IncompleteBooking } from '@/lib/abandoned';
import { buildRecoveryEmailHtml, recoverySubject } from '@/lib/email-recovery';

export const dynamic = 'force-dynamic';

const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';
const SITE = 'https://www.paraisoencantado.com';

// Ventanas de envío, medidas desde que el huésped dejó sus datos.
const FIRST_AFTER_MIN = 60;        // recordatorio 1: 1 hora después
const SECOND_AFTER_MIN = 24 * 60;  // recordatorio 2: 24 horas después
// Más allá de esto ya no se insiste: deja de ser un recordatorio y se vuelve spam.
const MAX_AGE_MIN = 5 * 24 * 60;   // 5 días

const MAX_PER_RUN = 25;

function minutesSince(iso: string): number {
  const t = Date.parse(iso);
  if (isNaN(t)) return Infinity;
  return (Date.now() - t) / 60000;
}

function todayMX(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/** Enlace que reconstruye el carrito tal como lo dejó el huésped. */
function resumeUrl(b: IncompleteBooking): string {
  const params = new URLSearchParams({
    checkin: b.checkin,
    checkout: b.checkout,
    adults: String(b.adultos || 2),
    recuperar: '1',
  });
  if (b.roomIds) params.set('rooms', b.roomIds);
  return `${SITE}/reservar?${params.toString()}`;
}

/**
 * Decide qué recordatorio toca (o ninguno) para una reserva incompleta.
 * Reglas duras: nunca a fechas pasadas, nunca dos veces el mismo recordatorio.
 */
function pickReminder(b: IncompleteBooking): 1 | 2 | null {
  if (!b.email.includes('@')) return null;
  if (b.checkin && b.checkin < todayMX()) return null; // la estadía ya pasó

  const age = minutesSince(b.timestamp);
  if (age > MAX_AGE_MIN) return null;

  if (!b.recordatorio1 && age >= FIRST_AFTER_MIN) return 1;
  if (b.recordatorio1 && !b.recordatorio2 && age >= SECOND_AFTER_MIN) return 2;
  return null;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const pending = await getPendingIncomplete();

  let sent = 0, skipped = 0, errors = 0;

  for (const b of pending) {
    const variant = pickReminder(b);
    if (!variant) { skipped++; continue; }
    if (sent >= MAX_PER_RUN) break;

    const data = {
      nombre: b.nombre,
      checkin: b.checkin,
      checkout: b.checkout,
      noches: b.noches,
      habitaciones: b.habitaciones,
      total: b.total,
      pagaHoy: b.pagaHoy,
      resumeUrl: resumeUrl(b),
      variant,
    };

    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: [b.email],
        subject: recoverySubject(data),
        html: buildRecoveryEmailHtml(data),
      });
      if (error) {
        console.error(`❌ recuperacion Resend: ${error.message} | to=${b.email}`);
        errors++;
        continue;
      }
      // Se marca DESPUÉS del envío: si el proceso muere antes, el peor caso es
      // repetir un correo, no perderlo en silencio.
      await markRecoverySent(b.row, variant);
      sent++;
      console.log(`📧 recuperacion #${variant} → ${b.email.slice(0, 4)}*** (${b.checkin})`);
    } catch (e: any) {
      console.error('❌ recuperacion:', e.message);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, candidatos: pending.length, sent, skipped, errors });
}
