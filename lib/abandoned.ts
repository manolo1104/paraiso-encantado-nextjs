/**
 * abandoned.ts — Reservas incompletas (carritos abandonados).
 *
 * El checkout está partido en dos pasos: /reservar/checkout captura los datos de
 * contacto y /reservar/pago cobra. Al terminar el paso de datos guardamos aquí la
 * reserva a medias, así que si el huésped no paga tenemos su nombre, correo y
 * teléfono para el correo de recuperación (ver /api/cron/recuperacion).
 *
 * Se guarda en la pestaña `ReservasIncompletas` de la misma hoja. Una fila por
 * sesión: si el huésped corrige sus datos y vuelve a enviar, se actualiza la fila.
 */
import { getSheetsClient } from '@/lib/sheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const TAB = 'ReservasIncompletas';

const HEADERS = [
  'Timestamp', 'SessionId', 'Nombre', 'Email', 'Telefono',
  'Checkin', 'Checkout', 'Noches', 'Adultos', 'Menores',
  'Habitaciones', 'RoomIds', 'Total', 'PagaHoy', 'PromoCode',
  'Notas', 'ComoNosConocio', 'Estado', 'Recordatorio1', 'Recordatorio2',
];

export interface IncompleteBooking {
  timestamp: string;
  sessionId: string;
  nombre: string;
  email: string;
  telefono: string;
  checkin: string;
  checkout: string;
  noches: number;
  adultos: number;
  menores: number;
  habitaciones: string;
  roomIds: string;
  total: number;
  pagaHoy: number;
  promoCode: string;
  notas: string;
  comoNosConocio: string;
  estado: 'pendiente' | 'reservado';
  recordatorio1: string;
  recordatorio2: string;
  /** Fila real en la hoja (1-indexada) — para poder escribir de vuelta */
  row: number;
}

async function ensureTab(): Promise<ReturnType<typeof getSheetsClient> extends Promise<infer T> ? T : never> {
  const client = await getSheetsClient();
  if (!client || !SHEET_ID) return null as any;
  try {
    await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!A1` });
  } catch {
    try {
      await client.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
      });
    } catch { /* ya existía (carrera) */ }
    await client.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
  return client as any;
}

/** Serializa escrituras: la hoja se lee entera y se escribe por fila. */
let writeChain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(() => {}, () => {});
  return run as Promise<T>;
}

function rowToBooking(r: string[], rowNumber: number): IncompleteBooking {
  return {
    timestamp: r[0] || '',
    sessionId: r[1] || '',
    nombre: r[2] || '',
    email: (r[3] || '').trim().toLowerCase(),
    telefono: r[4] || '',
    checkin: r[5] || '',
    checkout: r[6] || '',
    noches: Number(r[7]) || 0,
    adultos: Number(r[8]) || 0,
    menores: Number(r[9]) || 0,
    habitaciones: r[10] || '',
    roomIds: r[11] || '',
    total: Number(r[12]) || 0,
    pagaHoy: Number(r[13]) || 0,
    promoCode: r[14] || '',
    notas: r[15] || '',
    comoNosConocio: r[16] || '',
    estado: (r[17] || 'pendiente') as IncompleteBooking['estado'],
    recordatorio1: r[18] || '',
    recordatorio2: r[19] || '',
    row: rowNumber,
  };
}

export type IncompleteInput = Omit<IncompleteBooking, 'timestamp' | 'estado' | 'recordatorio1' | 'recordatorio2' | 'row'>;

/**
 * Guarda (o actualiza) la reserva incompleta de una sesión. Nunca reabre una
 * fila ya marcada como `reservado`: si el huésped ya pagó y vuelve al paso de
 * datos, no queremos volver a meterlo en la cola de recuperación.
 */
export async function saveIncompleteBooking(data: IncompleteInput): Promise<void> {
  const client = await ensureTab();
  if (!client) return;

  await withLock(async () => {
    try {
      const res = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!A:T` });
      const rows: string[][] = res.data.values || [];

      const now = new Date().toISOString();
      const values = [
        now, data.sessionId, data.nombre, data.email, data.telefono,
        data.checkin, data.checkout, String(data.noches), String(data.adultos), String(data.menores),
        data.habitaciones, data.roomIds, String(data.total), String(data.pagaHoy), data.promoCode,
        data.notas, data.comoNosConocio, 'pendiente', '', '',
      ];

      const idx = rows.findIndex((r, i) => i > 0 && (r[1] || '') === data.sessionId);
      if (idx > 0) {
        if ((rows[idx][17] || '') === 'reservado') return; // ya pagó: no reabrir
        // Conserva los recordatorios ya enviados para no repetirlos.
        values[18] = rows[idx][18] || '';
        values[19] = rows[idx][19] || '';
        await client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${TAB}!A${idx + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [values] },
        });
      } else {
        await client.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${TAB}!A:T`,
          valueInputOption: 'RAW',
          requestBody: { values: [values] },
        });
      }
    } catch (e: any) {
      console.error('❌ saveIncompleteBooking:', e.message);
    }
  });
}

/** Devuelve las reservas incompletas que siguen `pendiente`. */
export async function getPendingIncomplete(): Promise<IncompleteBooking[]> {
  const client = await ensureTab();
  if (!client) return [];
  try {
    const res = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!A:T` });
    const rows: string[][] = res.data.values || [];
    return rows
      .map((r, i) => (i === 0 ? null : rowToBooking(r, i + 1)))
      .filter((b): b is IncompleteBooking => Boolean(b && b.sessionId && b.estado === 'pendiente'));
  } catch (e: any) {
    console.error('❌ getPendingIncomplete:', e.message);
    return [];
  }
}

/**
 * Marca como `reservado` toda fila que corresponda a una reserva ya pagada, por
 * sesión o por correo+checkin (el pago puede llegar por el webhook de Stripe, sin
 * sessionId). Así el cron nunca le escribe a alguien que ya reservó.
 */
export async function markIncompleteAsBooked(opts: { sessionId?: string; email?: string; checkin?: string }): Promise<void> {
  const client = await ensureTab();
  if (!client) return;
  const sid = (opts.sessionId || '').trim();
  const email = (opts.email || '').trim().toLowerCase();
  if (!sid && !email) return;

  await withLock(async () => {
    try {
      const res = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!A:T` });
      const rows: string[][] = res.data.values || [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if ((r[17] || '') === 'reservado') continue;
        const bySession = sid && (r[1] || '') === sid;
        const byEmail = email && (r[3] || '').trim().toLowerCase() === email &&
          (!opts.checkin || (r[5] || '') === opts.checkin);
        if (!bySession && !byEmail) continue;
        await client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${TAB}!R${i + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [['reservado']] },
        });
      }
    } catch (e: any) {
      console.error('❌ markIncompleteAsBooked:', e.message);
    }
  });
}

/** Anota que ya se envió el recordatorio 1 o 2 de una fila. */
export async function markRecoverySent(row: number, which: 1 | 2): Promise<void> {
  const client = await ensureTab();
  if (!client) return;
  const col = which === 1 ? 'S' : 'T';
  try {
    await client.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!${col}${row}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[new Date().toISOString()]] },
    });
  } catch (e: any) {
    console.error('❌ markRecoverySent:', e.message);
  }
}
