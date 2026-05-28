import { NextRequest, NextResponse } from 'next/server';
import { getAllOTACalendars, saveOTACalendar } from '@/lib/admin/sheets-admin';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const calendars = await getAllOTACalendars();
  return NextResponse.json(calendars);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomName, platform, icalUrl, active = true, id } = body;
  if (!roomName || !platform || !icalUrl) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }
  await saveOTACalendar({ id: id || randomUUID(), roomName, platform, icalUrl, active });
  return NextResponse.json({ ok: true });
}
