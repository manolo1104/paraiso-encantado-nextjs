/**
 * precios-scheduler.ts
 * Dispara la corrida diaria de precios dinámicos (reglas + IA) a las 6:00 de
 * México, antes de que empiece a llegar gente a la web.
 *
 * En proceso y no en el panel de Railway por lo mismo que las secuencias de
 * correo: un cron externo de Railway se ejecutó UNA vez (8 may 2026) y nunca
 * volvió, 66 días sin enviar nada y sin un solo aviso. El servicio está siempre
 * encendido con una sola réplica, así que un setInterval aquí es más confiable
 * y además no le deja a nadie un paso de configuración pendiente.
 *
 * 🔴 Disparar de más SÍ hace daño, al contrario de lo que decía este comentario:
 * cada corrida paga una llamada al modelo y reescribe el calendario. Por eso la
 * marca del día vive en la hoja (`precios_ultima_corrida`) y se consulta con
 * `?auto=1`: la variable `lastRunDate` de aquí abajo solo evita el doble
 * disparo dentro del mismo proceso, y un reinicio la borraba.
 */

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // revisa cada 30 min si toca
const FIRST_DELAY_MS = 90 * 1000;         // 90 s tras el arranque (deja asentar el deploy)
const RUN_AT_HOUR_MX = 6;                 // 6:00 hora de México

let started = false;
let lastRunDate: string | null = null;

function mxNow(): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  // `% 24`: el Node del contenedor de Railway devuelve "24" para la medianoche
  // (ciclo h24), no "00". Sin esto la guarda de la hora nunca frena y la corrida
  // sale a las 00:20 de México. Es el mismo bug que ya mordió a los correos.
  const h = parseInt(get('hour'), 10);
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number.isNaN(h) ? 0 : h % 24,
  };
}

async function tick(): Promise<void> {
  const { date, hour } = mxNow();
  if (date === lastRunDate) return;
  if (hour < RUN_AT_HOUR_MX) return;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[precios-scheduler] CRON_SECRET no configurado — no se dispara');
    return;
  }

  // Marcar ANTES del await para no disparar dos veces; se revierte si falla.
  lastRunDate = date;
  try {
    const port = process.env.PORT || '3000';
    const res = await fetch(`http://127.0.0.1:${port}/api/cron/precios?auto=1`, {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(300_000),
    });
    const body: any = await res.json().catch(() => ({}));
    console.log(
      `[precios-scheduler] corrida diaria ${date} @${hour}h MX → HTTP ${res.status}` +
      (body && body.revisadas != null
        ? ` (noches:${body.revisadas} aplicadas:${body.aplicadas} propuestas:${body.propuestas})`
        : '')
    );
    // 409 = ya había una corrida en curso (p. ej. el botón del panel). No es un
    // fallo y no hay que reintentar: esa corrida ya dejó el calendario al día.
    if (!res.ok && res.status !== 409) lastRunDate = null;
  } catch (e: any) {
    lastRunDate = null;
    console.error('[precios-scheduler] fallo al disparar:', e?.message || e);
  }
}

export function startPreciosScheduler(): void {
  if (started) return; // evita doble arranque con el hot-reload de desarrollo

  const enabled = process.env.NODE_ENV === 'production' || process.env.PRECIOS_SCHEDULER_DEV === '1';
  if (!enabled) {
    console.log('[precios-scheduler] deshabilitado fuera de producción (usa PRECIOS_SCHEDULER_DEV=1)');
    return;
  }

  started = true;
  console.log(
    `[precios-scheduler] iniciado — revisa cada ${CHECK_INTERVAL_MS / 60000} min, ` +
    `corre 1×/día desde las ${RUN_AT_HOUR_MX}:00 hora de México`
  );
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), CHECK_INTERVAL_MS);
  }, FIRST_DELAY_MS);
}
