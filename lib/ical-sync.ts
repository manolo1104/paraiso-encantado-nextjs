import { getAllOTACalendars, updateOTASyncResult } from '@/lib/admin/sheets-admin';
import { updateOTABlocks } from '@/lib/sheets';

// ── Minimal iCal parser ───────────────────────────────────────────────────────

function parseIcalDate(val: string): string {
  // Handles: 20260601 or 20260601T120000Z
  const clean = val.split('T')[0].replace(/\D/g, '');
  if (clean.length < 8) return '';
  const y = Number(clean.slice(0, 4));
  const m = Number(clean.slice(4, 6));
  const d = Number(clean.slice(6, 8));
  // Validar que sea una fecha REAL. Sin esto, un DTSTART/DTEND corrupto (ej.
  // "20261305" o "00000000") producía un string que new Date() DESBORDABA a otra
  // fecha válida (2026-13-05 → 2027-01-05) → rangos gigantes de celdas OTA.
  if (y < 2020 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return '';
  const iso = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  const dt = new Date(`${iso}T00:00:00`);
  if (isNaN(dt.getTime()) || dt.getFullYear() !== y || dt.getMonth() + 1 !== m || dt.getDate() !== d) return '';
  return iso;
}

// Ningún evento iCal legítimo bloquea más de ~un horizonte de OTA (~13 meses) de
// un solo jalón. Un evento más largo es casi seguro basura/parseo corrupto y, sin
// tope, llenaría de morado años enteros de la hoja → se descarta.
const MAX_EVENT_DAYS = 400;

function eventDays(checkin: string, checkout: string): number {
  const a = new Date(`${checkin}T00:00:00`).getTime();
  const b = new Date(`${checkout}T00:00:00`).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

interface IcalEvent {
  start: string;
  end: string;
}

export function parseIcal(text: string): IcalEvent[] {
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

// Candado anti-traslape: evita que dos corridas del sync se pisen (scheduler interno
// + cron de GitHub, o una corrida lenta que rebasa los 15 min). Ambos disparadores
// llaman a esta misma función en el mismo proceso (una sola réplica en Railway).
let syncInProgress = false;

export async function runIcalSync(): Promise<{
  synced: number;
  results: IcalSyncResult[];
  timestamp: string;
  skipped?: boolean;
}> {
  if (syncInProgress) {
    console.warn('[ical-sync] ya hay una sincronización en curso — se omite esta corrida.');
    return { synced: 0, results: [], timestamp: new Date().toISOString(), skipped: true };
  }
  syncInProgress = true;
  try {
    return await runIcalSyncInner();
  } finally {
    syncInProgress = false;
  }
}

async function runIcalSyncInner(): Promise<{
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
        .filter(e => {
          const days = eventDays(e.start, e.end);
          if (days > MAX_EVENT_DAYS) {
            console.warn(`[ical-sync] evento descartado por rango sospechoso (${days} días) [${cal.roomName}/${cal.platform}]: ${e.start} → ${e.end}`);
            return false;
          }
          return days > 0; // descarta también DTEND <= DTSTART
        })
        .map(e => ({ checkin: e.start, checkout: e.end }));

      // Guarda anti-sobreventa: si el feed es VÁLIDO pero devuelve 0 eventos aunque
      // el sync anterior había encontrado varios bloqueos, es casi seguro un glitch
      // temporal de la OTA (no una cancelación masiva real). Borrar todo abriría el
      // cuarto a sobreventa → conservamos los bloqueos previos y lo marcamos para
      // revisión. (Un conteo bajo sí se deja limpiar: suele ser un bloqueo que venció.)
      if (dateRanges.length === 0 && (cal.blocksFound || 0) >= 5) {
        console.warn(`[ical-sync] feed VÁLIDO sin eventos pero antes tenía ${cal.blocksFound} bloqueos [${cal.roomName}/${cal.platform}] — se conservan (posible glitch de la OTA)`);
        await updateOTASyncResult(cal.id, 'error', cal.blocksFound);
        results.push({ id: cal.id, roomName: cal.roomName, platform: cal.platform, blocks: cal.blocksFound, error: 'feed vacío — bloqueos conservados (revisar en la OTA)' });
        continue;
      }

      const blocked = await updateOTABlocks(cal.roomName, dateRanges, cal.platform);
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
