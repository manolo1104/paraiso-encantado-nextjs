import { NextRequest, NextResponse } from 'next/server';
import { getRedMetricas, saveRedMetrica } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getRedMetricas();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  await saveRedMetrica(data);
  return NextResponse.json({ ok: true });
}
