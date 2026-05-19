import { google } from 'googleapis';

const SHEET_NAME = process.env.GOOGLE_SHEET_TAB || 'Reservas';
const AVAILABILITY_SHEET = 'Disponibilidad';
const TEMP_BLOCKS_SHEET = 'BloqueosTemporal';

const ROOM_NAMES = [
  'Suite Flor de Liz 1', 'Suite Flor de Liz 2', 'Suite LindaVista', 'Jungla',
  'Suite Lajas', 'Lirios 1', 'Lirios 2', 'Orquídeas 2', 'Orquídeas Doble',
  'Orquídeas 3', 'Bromelias', 'Helechos 1', 'Helechos 2',
];

const ROOM_NAME_ALIASES: Record<string, string> = {
  'Suite Jungla': 'Jungla',
  // Variantes "Lis" vs "Liz" — data/suites.ts usa "Lis", sheets usa "Liz"
  'Suite Flor de Lis 1': 'Suite Flor de Liz 1',
  'Suite Flor de Lis 2': 'Suite Flor de Liz 2',
  'Flor de Lis 1': 'Suite Flor de Liz 1',
  'Flor de Lis 2': 'Suite Flor de Liz 2',
  'Flor de Liz 1': 'Suite Flor de Liz 1',
  'Flor de Liz 2': 'Suite Flor de Liz 2',
  // Orquídeas sin acento
  'Orquideas 2': 'Orquídeas 2',
  'Orquideas 3': 'Orquídeas 3',
  'Orquideas Doble': 'Orquídeas Doble',
};

function normalizeRoomName(name: string): string {
  const trimmed = String(name).trim();
  return ROOM_NAME_ALIASES[trimmed] || trimmed;
}

// ── Singleton ─────────────────────────────────────────────
let sheetsClient: ReturnType<typeof google.sheets> | null = null;

const SHEETS_TIMEOUT_MS = 10_000;

/**
 * Envuelve cualquier llamada a la Sheets API con:
 * - AbortController abortado al vencer el timeout de 10 s
 * - Promise.race que garantiza que el await no cuelga más de 10 s
 * - Reset del singleton al detectar 401/403/invalid_grant → fuerza re-auth
 */
export async function sheetsCall<T>(fn: () => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timerId!: ReturnType<typeof setTimeout>;

  const timeoutP = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      controller.abort();
      reject(Object.assign(new Error('Google Sheets timeout (10 s)'), { code: 'ETIMEOUT' }));
    }, SHEETS_TIMEOUT_MS);
  });

  try {
    return await Promise.race([fn(), timeoutP]);
  } catch (e: any) {
    const status = e?.status ?? e?.code;
    const msg = String(e?.message ?? '');
    if (
      status === 401 || status === 403 ||
      /invalid_grant|UNAUTHENTICATED|token.*expir/i.test(msg)
    ) {
      sheetsClient = null;
      console.warn('🔄 Sheets auth error → singleton reset, reautenticando en próxima llamada');
    }
    throw e;
  } finally {
    clearTimeout(timerId);
  }
}

function loadCredentials() {
  const raw = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (raw) {
    try { return JSON.parse(raw); } catch {}
    try { return JSON.parse(raw.replace(/\\n/g, '\n')); } catch {}
  }
  return null;
}

export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const credentials = loadCredentials();
  if (!credentials || !process.env.GOOGLE_SHEET_ID) return null;
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    sheetsClient = google.sheets({ version: 'v4', auth: authClient as any });
    return sheetsClient;
  } catch (e: any) {
    console.error('❌ Google Sheets init error:', e.message);
    return null;
  }
}

function getDateRange(checkin: string, checkout: string): string[] {
  if (!checkin || !checkout) return [];
  const start = new Date(checkin + 'T00:00:00');
  const end   = new Date(checkout + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  const dates: string[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

// ── Reservas ──────────────────────────────────────────────────

export async function addBookingToSheet(bookingData: any) {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return;
  const sid = process.env.GOOGLE_SHEET_ID;
  try {
    const { confirmation_number, customer_name, customer_phone, email, total,
            payment_intent_id, booking_details, rooms, how_did_you_hear, created_at } = bookingData;

    const roomsStr = (rooms || []).map((r: any) => `${r.name} (${r.guestCount} personas)`).join(', ') || 'Estándar';
    const ts = new Date(created_at || new Date()).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    const row = [
      ts, confirmation_number, customer_name, customer_phone || 'N/A', email,
      `$${Number(total).toLocaleString('es-MX')} MXN`,
      booking_details?.checkin || 'N/A', booking_details?.checkout || 'N/A',
      booking_details?.nights || 'N/A', booking_details?.guests || 'N/A',
      roomsStr, booking_details?.notes || '', payment_intent_id || 'N/A',
      how_did_you_hear || '',
    ];

    await sheetsCall(() =>
      client.spreadsheets.values.append({
        spreadsheetId: sid,
        range: `${SHEET_NAME}!A:N`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      })
    );
    console.log('✅ Reserva guardada en Google Sheets');
  } catch (e: any) {
    console.error('❌ addBookingToSheet error:', e.message);
  }
}

// ── Disponibilidad ────────────────────────────────────────────

export async function getFullyBookedDates(monthsAhead = 6): Promise<string[]> {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return [];
  const sid = process.env.GOOGLE_SHEET_ID;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${AVAILABILITY_SHEET}!A:Z`,
      })
    );
    const data = res.data.values || [];
    if (data.length < 2) return [];

    const headers = data[0];
    const activeRooms = ROOM_NAMES.filter(n => n !== 'Habitación de Prueba');
    const roomCols = activeRooms.map(n => headers.findIndex((h: string) => h === n)).filter(i => i !== -1);
    if (roomCols.length === 0) return [];

    const todayMs = new Date().setHours(0, 0, 0, 0);
    const cutoff  = new Date(todayMs);
    cutoff.setMonth(cutoff.getMonth() + monthsAhead);
    const fullyBooked: string[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row?.[0]) continue;
      let dateStr: string;
      try {
        const d = new Date(String(row[0]).trim() + 'T00:00:00');
        if (isNaN(d.getTime()) || d.getTime() < todayMs || d > cutoff) continue;
        dateStr = d.toISOString().split('T')[0];
      } catch { continue; }

      const allUnavailable = roomCols.every(col => {
        const val = (row[col] || '').toUpperCase().trim();
        return val === 'RESERVADO' || val === 'BLOQUEADO' || val === 'MANTENIMIENTO';
      });
      if (allUnavailable) fullyBooked.push(dateStr);
    }
    return fullyBooked;
  } catch (e: any) {
    console.error('❌ getFullyBookedDates error:', e.message);
    return [];
  }
}

export async function checkAvailability(
  checkin: string, checkout: string,
  rooms: (string | { name: string })[],
  sessionId: string | null = null,
): Promise<{ available: boolean; unavailableRooms: string[] }> {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return { available: true, unavailableRooms: [] };
  const sid = process.env.GOOGLE_SHEET_ID;

  try {
    const dateRange = getDateRange(checkin, checkout);
    if (dateRange.length === 0) return { available: false, unavailableRooms: [] };

    const normalizedRooms = rooms.map(r =>
      typeof r === 'string' ? { name: normalizeRoomName(r) } : { ...r, name: normalizeRoomName(r.name) }
    );
    const activeRooms = normalizedRooms.filter(r => ROOM_NAMES.includes(r.name));

    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${AVAILABILITY_SHEET}!A:Z`,
      })
    );
    const data = res.data.values || [];
    if (data.length === 0) return { available: true, unavailableRooms: [] };

    const headers = data[0];
    const unavailableRooms: string[] = [];

    for (const room of activeRooms) {
      const colIdx = headers.findIndex((h: string) => h === room.name);
      if (colIdx === -1) continue;

      for (const date of dateRange) {
        const rowIdx = data.findIndex((row: string[], i: number) => {
          if (i === 0 || !row[0]) return false;
          const s = row[0].trim();
          if (s === date || s.startsWith(date)) return true;
          try { return new Date(s + 'T00:00:00').toISOString().split('T')[0] === date; } catch { return false; }
        });
        if (rowIdx > 0) {
          const status = (data[rowIdx][colIdx] || '').toUpperCase().trim();
          if (status === 'RESERVADO' || status === 'BLOQUEADO' || status === 'MANTENIMIENTO') {
            if (!unavailableRooms.includes(room.name)) unavailableRooms.push(room.name);
            break;
          }
        }
      }
    }

    const tempBlocked = await checkTemporaryBlocks(dateRange, normalizedRooms, sessionId);
    for (const r of tempBlocked) {
      if (!unavailableRooms.includes(r)) unavailableRooms.push(r);
    }

    // Cross-check contra hoja Reservas (fuente de verdad real)
    // Captura reservas del admin y reservas web aunque Disponibilidad esté desincronizado
    const reservasConflicts = await checkReservasForConflicts(checkin, checkout, normalizedRooms);
    for (const r of reservasConflicts) {
      if (!unavailableRooms.includes(r)) unavailableRooms.push(r);
    }

    return { available: unavailableRooms.length === 0, unavailableRooms };
  } catch (e: any) {
    console.error('❌ checkAvailability error:', e.message);
    return { available: true, unavailableRooms: [] };
  }
}

/**
 * Cross-check directo contra la hoja Reservas.
 * Detecta conflictos aunque la hoja Disponibilidad no esté sincronizada.
 * Columnas: A=timestamp, B=confirmacion, C=cliente, D=tel, E=email,
 *           F=total, G=checkin, H=checkout, I=noches, J=huespedes, K=habitaciones
 */
async function checkReservasForConflicts(
  checkin: string,
  checkout: string,
  rooms: { name: string }[],
): Promise<string[]> {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return [];
  const sid = process.env.GOOGLE_SHEET_ID;

  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${SHEET_NAME}!A:N`,
      })
    );
    const data = res.data.values || [];
    if (data.length < 2) return [];

    const conflicting: string[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 11) continue;

      const bCheckin  = String(row[6]  ?? '').trim();
      const bCheckout = String(row[7]  ?? '').trim();
      const bRooms    = String(row[10] ?? '').trim().toLowerCase();
      // Saltar filas sin fechas o canceladas
      if (!bCheckin || !bCheckout || bCheckin === 'n/a' || bCheckout === 'n/a') continue;
      const bState = String(row[12] ?? '').toUpperCase();
      if (bState === 'CANCELADA' || bState === 'CANCELADO') continue;

      // Solape: [bCheckin, bCheckout) ∩ [checkin, checkout) ≠ ∅
      if (bCheckin >= checkout || bCheckout <= checkin) continue;

      // Comprobar si alguna suite solicitada está en esta reserva
      // "Jungla (2 personas)" → "jungla" | "Suite Flor de Liz 1 (2 personas)" → "suite flor de liz 1"
      const roomsInBooking = bRooms
        .split(',')
        .map((r) => r.replace(/\s*\([^)]*\)/g, '').trim());

      for (const room of rooms) {
        const normalizedReq = room.name.toLowerCase();
        // Coincidencia exacta o contenida (p.ej. "jungla" ⊂ "suite jungla")
        const match = roomsInBooking.some(
          (r) => r === normalizedReq || r.includes(normalizedReq) || normalizedReq.includes(r)
        );
        if (match && !conflicting.includes(room.name)) {
          conflicting.push(room.name);
        }
      }
    }

    return conflicting;
  } catch (e: any) {
    console.error('❌ checkReservasForConflicts error:', e.message);
    return [];
  }
}

async function checkTemporaryBlocks(
  dates: string[], rooms: { name: string }[], excludeSessionId: string | null,
): Promise<string[]> {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return [];
  const sid = process.env.GOOGLE_SHEET_ID;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${TEMP_BLOCKS_SHEET}!A:D`,
      })
    );
    const data = res.data.values || [];
    const now = new Date();
    const blockedRooms: string[] = [];

    for (let i = 1; i < data.length; i++) {
      const [date, roomName, expiration, sessionId] = data[i];
      if (excludeSessionId && sessionId === excludeSessionId) continue;
      if (new Date(expiration) > now && dates.includes(date)) {
        if (rooms.find(r => r.name === roomName) && !blockedRooms.includes(roomName)) {
          blockedRooms.push(roomName);
        }
      }
    }
    return blockedRooms;
  } catch { return []; }
}

export async function createTemporaryBlock(
  checkin: string, checkout: string,
  rooms: (string | { name: string })[], sessionId: string,
) {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return;
  const sid = process.env.GOOGLE_SHEET_ID;
  try {
    const normalizedRooms = rooms
      .map(r => typeof r === 'string' ? { name: normalizeRoomName(r) } : { name: normalizeRoomName(r.name) })
      .filter(r => ROOM_NAMES.includes(r.name));

    const dateRange = getDateRange(checkin, checkout);
    const expiration = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const rows: string[][] = [];
    for (const date of dateRange) {
      for (const room of normalizedRooms) {
        rows.push([date, room.name, expiration, sessionId]);
      }
    }
    await sheetsCall(() =>
      client.spreadsheets.values.append({
        spreadsheetId: sid,
        range: `${TEMP_BLOCKS_SHEET}!A:D`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
      })
    );
    console.log(`✅ Bloqueo temporal creado: sesión ${sessionId}`);
  } catch (e: any) {
    console.error('❌ createTemporaryBlock error:', e.message);
  }
}

export async function removeTemporaryBlock(sessionId: string) {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return;
  const sid = process.env.GOOGLE_SHEET_ID;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${TEMP_BLOCKS_SHEET}!A:D`,
      })
    );
    const data = res.data.values || [];
    const filtered = data.filter((row, i) => i === 0 || row[3] !== sessionId);

    await sheetsCall(() =>
      client.spreadsheets.values.clear({
        spreadsheetId: sid,
        range: `${TEMP_BLOCKS_SHEET}!A:D`,
      })
    );
    if (filtered.length > 0) {
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: sid,
          range: `${TEMP_BLOCKS_SHEET}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: filtered },
        })
      );
    }
    console.log(`✅ Bloqueo temporal removido: sesión ${sessionId}`);
  } catch (e: any) {
    console.error('❌ removeTemporaryBlock error:', e.message);
  }
}

export async function addLead(email: string) {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return;
  const sid = process.env.GOOGLE_SHEET_ID;
  try {
    const ts = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    await sheetsCall(() =>
      client.spreadsheets.values.append({
        spreadsheetId: sid,
        range: 'Leads!A:B',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[ts, email]] },
      })
    );
    console.log(`✅ Lead guardado: ${email.slice(0, 4)}***`);
  } catch (e: any) {
    console.error('❌ addLead error:', e.message);
  }
}

export async function blockDates(
  checkin: string, checkout: string,
  rooms: (string | { name: string })[],
) {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return;
  const sid = process.env.GOOGLE_SHEET_ID;
  try {
    const normalizedRooms = rooms
      .map(r => typeof r === 'string' ? { name: normalizeRoomName(r) } : { name: normalizeRoomName(r.name) })
      .filter(r => ROOM_NAMES.includes(r.name));

    const dateRange = getDateRange(checkin, checkout);
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${AVAILABILITY_SHEET}!A:Z`,
      })
    );

    let data: string[][] = res.data.values || [];
    const headers = data[0] || ['Fecha', ...ROOM_NAMES];
    if (data.length === 0) data = [headers];

    for (const date of dateRange) {
      let rowIdx = data.findIndex(row => row[0] === date);
      if (rowIdx === -1) {
        data.push([date, ...Array(ROOM_NAMES.length).fill('')]);
        rowIdx = data.length - 1;
      }
      for (const room of normalizedRooms) {
        const colIdx = headers.findIndex((h: string) => h === room.name);
        if (colIdx > 0) data[rowIdx][colIdx] = 'RESERVADO';
      }
    }

    const sorted = [headers, ...data.slice(1).sort((a, b) =>
      new Date(a[0] || '1970-01-01').getTime() - new Date(b[0] || '1970-01-01').getTime()
    )];

    await sheetsCall(() =>
      client.spreadsheets.values.clear({
        spreadsheetId: sid,
        range: `${AVAILABILITY_SHEET}!A:Z`,
      })
    );
    await sheetsCall(() =>
      client.spreadsheets.values.update({
        spreadsheetId: sid,
        range: `${AVAILABILITY_SHEET}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: sorted },
      })
    );
    console.log(`✅ Fechas bloqueadas: ${dateRange.length} noches`);
  } catch (e: any) {
    console.error('❌ blockDates error:', e.message);
  }
}
