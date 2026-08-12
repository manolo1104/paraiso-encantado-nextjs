/**
 * recovery-scheduler.ts
 * Dispara los correos de recuperación de reservas incompletas cada 30 min.
 *
 * Va en-proceso por la misma razón que el de secuencias (ver lib/email-scheduler):
 * el servicio de Railway está siempre encendido con una sola réplica, y un cron
 * externo ya nos falló en silencio una vez. La deduplicación real vive en la hoja
 * (columnas Recordatorio1/Recordatorio2), así que un disparo de más no reenvía nada.
 *
 * Cada 30 min y no cada hora porque el primer recordatorio sale a los 60 min de
 * abandonar: con media hora de resolución, nadie lo recibe más de 1.5 h después.
 */

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const FIRST_DELAY_MS = 60 * 1000; // 1 min tras el arranque (deja asentar el deploy)

let started = false;

async function tick(): Promise<void> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[recovery-scheduler] CRON_SECRET no configurado — no se dispara');
    return;
  }
  try {
    const port = process.env.PORT || '3000';
    const res = await fetch(`http://127.0.0.1:${port}/api/cron/recuperacion`, {
      headers: { authorization: `Bearer ${secret}` },
    });
    const body: any = await res.json().catch(() => ({}));
    if (body?.sent || body?.errors) {
      console.log(
        `[recovery-scheduler] HTTP ${res.status} — candidatos:${body.candidatos} ` +
        `enviados:${body.sent} saltados:${body.skipped} errores:${body.errors}`
      );
    }
  } catch (e: any) {
    console.error('[recovery-scheduler] fallo al disparar:', e?.message || e);
  }
}

export function startRecoveryScheduler(): void {
  if (started) return; // evita doble arranque (hot-reload en desarrollo)

  const enabled = process.env.NODE_ENV === 'production' || process.env.RECOVERY_SCHEDULER_DEV === '1';
  if (!enabled) {
    console.log('[recovery-scheduler] deshabilitado fuera de producción (usa RECOVERY_SCHEDULER_DEV=1)');
    return;
  }

  started = true;
  console.log(`[recovery-scheduler] iniciado — revisa cada ${CHECK_INTERVAL_MS / 60000} min`);
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), CHECK_INTERVAL_MS);
  }, FIRST_DELAY_MS);
}
