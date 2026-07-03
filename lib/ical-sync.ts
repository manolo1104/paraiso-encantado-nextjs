import { getAllOTACalendars, updateOTASyncResult } from '@/lib/admin/sheets-admin';
import { updateOTABlocks } from '@/lib/sheets';

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

// ── Sync runner (shared by the public cron and the admin "Sync ahora" button) ──

export interface IcalSyncResult {
  id: string;
  roomName: string;
  platform: string;
  blocks: number;
  error?: string;
}

export async function runIcalSync(): Promise<{
  synced: number;
  results: IcalSyncResult[];
  timestamp: string;
}> {
  const calendars = await getAllOTACalendars();
  const active = calendars.filter(c => c.active && c.icalUrl);

  const results: IcalSyncResult[] = [];

  for (const cal of active) {
    try {
      const res = await fetch(cal.icalUrl, {
        headers: { 'User-Agent': 'ParaisoEncantado-ChannelManager/1.0' },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();

      // Validar que la respuesta sea REALMENTE un iCal antes de tocar los bloqueos.
      // Si la OTA responde 200 con HTML (página de mantenimiento/login), un feed
      // sin VCALENDAR daría 0 eventos y borraríamos todos los bloqueos de ese
      // cuarto → sobreventa. En ese caso conservamos los bloqueos y marcamos error.
      if (!/BEGIN:VCALENDAR/i.test(text)) {
        throw new Error('Respuesta no es un iCal válido (sin VCALENDAR) — se conservan los bloqueos previos');
      }

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

  return {
    synced: results.length,
    results,
    timestamp: new Date().toISOString(),
  };
}
