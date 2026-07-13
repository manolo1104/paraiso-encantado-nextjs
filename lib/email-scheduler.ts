/**
 * email-scheduler.ts
 * Temporizador dentro del proceso del servidor Next para disparar las secuencias
 * de email UNA vez al día.
 *
 * Por qué en-proceso: el disparo vivía en un cron externo de Railway que se
 * ejecutó una sola vez (8 may 2026) y nunca volvió → 66 días sin enviar ningún
 * correo, en silencio. Es el mismo problema que ya resolvimos con el sync
 * OTA/iCal (ver lib/ical-scheduler.ts): el servicio de Railway está siempre
 * encendido (sleepApplication=false) con una sola réplica (numReplicas=1), así
 * que un setInterval aquí dispara de forma confiable y no puede morir en
 * silencio. La deduplicación (pestaña EmailsEnviados) evita cualquier reenvío.
 *
 * Se arranca desde instrumentation.ts (`register`), que Next ejecuta una vez al
 * iniciar el servidor.
 *
 * No duplica la lógica del cron: hace un fetch interno al endpoint existente
 * `/api/cron/email-sequences`, que ya trae autenticación, paginación por cursor
 * (se encadena solo) y el manejo correcto de errores de Resend.
 */

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // revisa cada 30 min si toca correr
const FIRST_DELAY_MS = 30 * 1000;         // primera revisión 30s tras el arranque
const RUN_AT_HOUR_MX = 8;                 // dispara a partir de las 8:00 (hora de México)

let started = false;
let lastRunDate: string | null = null; // 'YYYY-MM-DD' en hora de México de la última corrida

function mxNow(): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: parseInt(get('hour'), 10) || 0 };
}

async function tick(): Promise<void> {
  const { date, hour } = mxNow();
  if (date === lastRunDate) return;   // ya se disparó hoy
  if (hour < RUN_AT_HOUR_MX) return;  // aún es muy temprano en México

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[email-scheduler] CRON_SECRET no configurado — no se dispara la secuencia');
    return;
  }

  // Marcar ANTES del await para evitar disparos reentrantes; si falla se revierte.
  lastRunDate = date;
  try {
    const port = process.env.PORT || '3000';
    const url = `http://127.0.0.1:${port}/api/cron/email-sequences`;
    const res = await fetch(url, { headers: { authorization: `Bearer ${secret}` } });
    const body: any = await res.json().catch(() => ({}));
    console.log(
      `[email-scheduler] disparo diario ${date} @${hour}h MX → HTTP ${res.status}` +
      (body && body.sent != null ? ` (sent:${body.sent} skipped:${body.skipped} errors:${body.errors})` : '')
    );
    if (!res.ok) lastRunDate = null; // permite reintento en el próximo tick
  } catch (e: any) {
    lastRunDate = null; // el disparo falló (p.ej. servidor aún levantando) → reintenta
    console.error('[email-scheduler] fallo al disparar la secuencia:', e?.message || e);
  }
}

export function startEmailScheduler(): void {
  if (started) return; // evita doble arranque (p.ej. hot-reload en desarrollo)

  const enabled = process.env.NODE_ENV === 'production' || process.env.EMAIL_SCHEDULER_DEV === '1';
  if (!enabled) {
    console.log('[email-scheduler] deshabilitado fuera de producción (usa EMAIL_SCHEDULER_DEV=1 para probar)');
    return;
  }

  started = true;
  console.log(
    `[email-scheduler] iniciado — revisa cada ${CHECK_INTERVAL_MS / 60000} min, ` +
    `dispara 1×/día desde las ${RUN_AT_HOUR_MX}:00 hora de México`
  );
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), CHECK_INTERVAL_MS);
  }, FIRST_DELAY_MS);
}
