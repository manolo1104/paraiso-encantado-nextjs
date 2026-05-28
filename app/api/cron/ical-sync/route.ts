import { NextRequest, NextResponse } from 'next/server';
import { getAllOTACalendars, updateOTASyncResult } from '@/lib/admin/sheets-admin';
import { updateOTABlocks } from '@/lib/sheets';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Minimal iCal parser ───────────────────────────────────────────────────────

function parseIcalDate(val: string): string {
  // Handles: 20260601 or 20260601T120000Z
  const clean = val.split('T')[0].replace(/\D/g, '');
  if (clean.length >= 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  return '';
}

interface IcalEvent {
  start: string;
  end: string;
}

function parseIcal(text: string): IcalEvent[] {
  const events: IcalEvent[] = [];
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let inEvent = false;
  let start = '';
  let end = '';

  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'BEGIN:VEVENT') { inEvent = true; start = ''; end = ''; continue; }
    if (line === 'END:VEVENT') {
      if (inEvent && start && end) events.push({ start, end });
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    if (line.startsWith('DTSTART')) {
      const val = line.split(':').slice(1).join(':');
      start = parseIcalDate(val);
    } else if (line.startsWith('DTEND')) {
      const val = line.split(':').slice(1).join(':');
      end = parseIcalDate(val);
    }
  }
  return events;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const calendars = await getAllOTACalendars();
  const active = calendars.filter(c => c.active && c.icalUrl);

  const results: Array<{ id: string; roomName: string; platform: string; blocks: number; error?: string }> = [];

  for (const cal of active) {
    try {
      const res = await fetch(cal.icalUrl, {
        headers: { 'User-Agent': 'ParaisoEncantado-ChannelManager/1.0' },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      const events = parseIcal(text);

      const dateRanges = events
        .filter(e => e.start && e.end)
        .map(e => ({ checkin: e.start, checkout: e.end }));

      const blocked = await updateOTABlocks(cal.roomName, dateRanges);
      await updateOTASyncResult(cal.id, 'ok', blocked);
      results.push({ id: cal.id, roomName: cal.roomName, platform: cal.platform, blocks: blocked });
    } catch (e: any) {
      console.error(`iCal sync error [${cal.roomName}/${cal.platform}]:`, e.message);
      await updateOTASyncResult(cal.id, 'error', 0);
      results.push({ id: cal.id, roomName: cal.roomName, platform: cal.platform, blocks: 0, error: e.message });
    }
  }

  return NextResponse.json({
    synced: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
