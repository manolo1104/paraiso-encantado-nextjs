/**
 * instrumentation.ts
 * Next ejecuta `register()` una sola vez al iniciar el servidor. Lo usamos para
 * arrancar los temporizadores en-proceso.
 *
 * Los imports van DENTRO del guard `NEXT_RUNTIME === 'nodejs'` (patrón oficial de
 * Next): así webpack excluye googleapis del bundle del runtime edge, donde no
 * existe el módulo `http` y rompería la compilación.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Disparo diario de las secuencias de email (antes dependía de un cron
    // externo de Railway que murió en silencio). Ver lib/email-scheduler.ts.
    const { startEmailScheduler } = await import('@/lib/email-scheduler');
    startEmailScheduler();

    // Correos de recuperación de reservas incompletas (cada 30 min).
    // Ver lib/recovery-scheduler.ts.
    const { startRecoveryScheduler } = await import('@/lib/recovery-scheduler');
    startRecoveryScheduler();
  }
}
