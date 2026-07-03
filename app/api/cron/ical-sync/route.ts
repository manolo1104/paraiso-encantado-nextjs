import { NextRequest, NextResponse } from 'next/server';
import { runIcalSync } from '@/lib/ical-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  // Sin CRON_SECRET configurado → cerrado (antes "Bearer undefined" pasaba)
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runIcalSync();
  return NextResponse.json(result);
}
