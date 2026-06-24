import { NextResponse } from 'next/server';
import { runIcalSync } from '@/lib/ical-sync';

// Protegido por el middleware admin (sesión JWT). Permite el botón "Sync ahora"
// del panel sin exponer CRON_SECRET al cliente.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const result = await runIcalSync();
  return NextResponse.json(result);
}
