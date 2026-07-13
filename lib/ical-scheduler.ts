/**
 * ical-scheduler.ts
 * Temporizador dentro del proceso del servidor Next para sincronizar los
 * calendarios OTA (Expedia/iCal) cada 15 minutos.
 *
 * Por qué en-proceso: el cron vivía en GitHub Actions (`.github/workflows/
 * ical-sync.yml`), pero GitHub estrangula los crons programados y en la práctica
 * corría cada ~1–4 h en vez de cada 15 min → ventana de sobreventa. El servicio
 * de Railway está siempre encendido (sleepApplication=false) y con una sola
 * réplica (numReplicas=1), así que un setInterval aquí dispara de forma
 * confiable y sin duplicados. El workflow de GitHub queda como respaldo.
 *
 * Se arranca desde instrumentation.ts (`register`), que Next ejecuta una vez al
 * iniciar el servidor.
 */

const INTERVAL_MS = 15 * 60 * 1000; // 15 minutos
const FIRST_DELAY_MS = 20 * 1000;   // primera corrida 20s tras el arranque (deja asentar el deploy)

let started = false;

export function startIcalScheduler(): void {
  // Evita doble arranque (p.ej. hot-reload en desarrollo).
  if (started) return;

  // Solo en producción, salvo que se fuerce explícitamente para pruebas locales.
  const enabled = process.env.NODE_ENV === 'production' || process.env.ICAL_SCHEDULER_DEV === '1';
  if (!enabled) {
    console.log('[ical-scheduler] deshabilitado fuera de producción (usa ICAL_SCHEDULER_DEV=1 para probar)');
    return;
  }

  started = true;

  async function tick() {
    try {
      // Import dinámico: mantiene las dependencias Node (googleapis) fuera de
      // cualquier bundle que no sea el runtime de servidor.
      const { runIcalSync } = await import('@/lib/ical-sync');
      const r = await runIcalSync();
      const errores = r.results.filter(x => x.error);
      console.log(`[ical-scheduler] sync OK — ${r.synced} calendario(s), ${errores.length} con error @ ${r.timestamp}`);
      for (const e of errores) {
        console.error(`[ical-scheduler] error en ${e.roomName}/${e.platform}: ${e.error}`);
      }
    } catch (e: any) {
      // Nunca dejar que un fallo de sync tumbe el proceso del servidor.
      console.error('[ical-scheduler] fallo inesperado:', e?.message || e);
    }
  }

  console.log(`[ical-scheduler] iniciado — sincroniza OTA/iCal cada ${INTERVAL_MS / 60000} min`);
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), INTERVAL_MS);
  }, FIRST_DELAY_MS);
}
