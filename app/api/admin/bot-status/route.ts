import { NextRequest, NextResponse } from 'next/server';
import { getBotStatus, setBotStatus } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const enabled = await getBotStatus();
  return NextResponse.json({ enabled });
}

export async function POST(req: NextRequest) {
  const { enabled } = await req.json();
  await setBotStatus(Boolean(enabled));
  return NextResponse.json({ ok: true, enabled: Boolean(enabled) });
}
