/**
 * instrumentation.ts
 * Next ejecuta `register()` una sola vez al iniciar el servidor. Lo usamos para
 * arrancar el temporizador de sincronización OTA/iCal (ver lib/ical-scheduler).
 *
 * El import va DENTRO del guard `NEXT_RUNTIME === 'nodejs'` (patrón oficial de
 * Next): así webpack excluye googleapis del bundle del runtime edge, donde no
 * existe el módulo `http` y rompería la compilación.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startIcalScheduler } = await import('@/lib/ical-scheduler');
    startIcalScheduler();
  }
}
