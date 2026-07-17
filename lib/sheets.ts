import { google } from 'googleapis';

const SHEET_NAME = process.env.GOOGLE_SHEET_TAB || 'Reservas';
const AVAILABILITY_SHEET = 'Disponibilidad';
const TEMP_BLOCKS_SHEET = 'BloqueosTemporal';

/**
 * Candado en-proceso para SERIALIZAR toda escritura que reescribe la matriz
 * `Disponibilidad` (sync OTA cada 15 min + reservas web `blockDates` + bloqueos
 * manuales del admin). El servidor corre en Railway con UNA sola réplica
 * (numReplicas=1), así que una cadena de promesas basta para que nunca haya dos
 * operaciones leyendo/escribiendo la hoja a la vez.
 *
 * Sin esto, cada función hacía leer→clear(TODA la hoja)→reescribir; si dos corridas
 * se traslapaban (había DOS disparadores del sync: scheduler interno + GitHub Actions),
 * una leía la hoja durante la ventana vacía del `clear` de la otra y la reescribía a
 * medias → se borraban BLOQUEADO/RESERVADO y solo sobrevivía lo último (OTA Expedia).
 */
let availabilityWriteChain: Promise<unknown> = Promise.resolve();
export function withAvailabilityLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = availabilityWriteChain.then(fn, fn); // corre pase lo que pase con la anterior
  availabilityWriteChain = run.then(() => {}, () => {}); // la cadena nunca se rompe por un error
  return run as Promise<T>;
}

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

/** Fecha de hoy en hora de México como 'YYYY-MM-DD' (evita corrimientos por el UTC del servidor). */
function mexicoTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

/** Formatea un Date como 'YYYY-MM-DD' usando sus componentes locales. */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Reservas ──────────────────────────────────────────────────

export async function addBookingToSheet(bookingData: any) {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return;
  const sid = process.env.GOOGLE_SHEET_ID;
  try {
    const { confirmation_number, customer_name, customer_phone, email, total,
            payment_intent_id, booking_details, rooms, how_did_you_hear, created_at,
            anticipo } = bookingData;

    const roomsStr = (rooms || []).map((r: any) => `${r.name} (${r.guestCount} personas)`).join(', ') || 'Estándar';
    const ts = new Date(created_at || new Date()).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    // Columna O = anticipo (lo realmente cobrado ahora). 0 si no se especifica.
    const row = [
      ts, confirmation_number, customer_name, customer_phone || 'N/A', email,
      `$${Number(total).toLocaleString('es-MX')} MXN`,
      booking_details?.checkin || 'N/A', booking_details?.checkout || 'N/A',
      booking_details?.nights || 'N/A', booking_details?.guests || 'N/A',
      roomsStr, booking_details?.notes || '', payment_intent_id || 'N/A',
      how_did_you_hear || '', Number(anticipo) || 0,
    ];

    await sheetsCall(() =>
      client.spreadsheets.values.append({
        spreadsheetId: sid,
        range: `${SHEET_NAME}!A:O`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      })
    );
    console.log('✅ Reserva guardada en Google Sheets');
  } catch (e: any) {
    console.error('❌ addBookingToSheet error:', e.message);
  }
}

/**
 * Idempotencia: devuelve el folio existente si ya hay una reserva con este
 * payment_intent_id (o null si no existe). Evita reservas duplicadas cuando el
 * webhook y la confirmación del cliente corren ambos. Columna B=folio, M=PI.
 */
export async function findConfirmationByPaymentIntent(paymentIntentId: string): Promise<string | null> {
  if (!paymentIntentId) return null;
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return null;
  const sid = process.env.GOOGLE_SHEET_ID;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_NAME}!A:O` })
    );
    const data = res.data.values || [];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i]?.[12] ?? '').trim() === paymentIntentId) {
        return String(data[i]?.[1] ?? '') || 'PE-EXIST';
      }
    }
    return null;
  } catch (e: any) {
    console.error('❌ findConfirmationByPaymentIntent error:', e.message);
    return null;
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

    const today = mexicoTodayStr();                    // 'YYYY-MM-DD' en hora de México
    const cutoffDate = new Date(today + 'T00:00:00');
    cutoffDate.setMonth(cutoffDate.getMonth() + monthsAhead);
    const cutoff = ymd(cutoffDate);
    const fullyBooked: string[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row?.[0]) continue;
      // Las fechas se guardan como 'YYYY-MM-DD'; comparamos como texto (sin convertir a UTC).
      const raw = String(row[0]).trim();
      let dateStr = raw.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const d = new Date(raw);
        if (isNaN(d.getTime())) continue;
        dateStr = ymd(d);
      }
      if (dateStr < today || dateStr > cutoff) continue;

      const allUnavailable = roomCols.every(col => {
        const val = (row[col] || '').toUpperCase().trim();
        return val === 'RESERVADO' || val === 'BLOQUEADO' || val === 'MANTENIMIENTO' || val.startsWith('OTA');
      });
      if (allUnavailable) fullyBooked.push(dateStr);
    }
    return fullyBooked;
  } catch (e: any) {
    console.error('❌ getFullyBookedDates error:', e.message);
    return [];
  }
}

// Rangos de fechas bloqueadas MANUALMENTE de una habitación (BLOQUEADO o
// MANTENIMIENTO), para exportarlos en el feed iCal que consumen las OTAs. Así,
// cerrar una fecha en el panel /calendario también le llega a Expedia/Booking.
// A propósito NO exporta:
//   - RESERVADO: las reservas directas ya se exportan desde la hoja Reservas.
//   - OTA (…): reexportar a una OTA un bloqueo que vino de ella misma podría crear
//     un lazo (bloqueo fantasma) con algunos gestores de canal. Los bloqueos de
//     una OTA ya los conoce esa OTA; el cruce entre OTAs no se maneja por aquí.
//   - 'ABIERTO': fecha liberada a mano → queda vendible.
export async function getRoomBlockedRanges(
  roomName: string,
): Promise<Array<{ checkin: string; checkout: string }>> {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return [];
  const sid = process.env.GOOGLE_SHEET_ID;
  const normalized = normalizeRoomName(roomName);
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: sid, range: `${AVAILABILITY_SHEET}!A:Z` })
    );
    const data = res.data.values || [];
    if (data.length < 2) return [];
    const headers = data[0];
    const col = headers.findIndex((h: string) => h === normalized);
    if (col === -1) return [];

    const dates: string[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row?.[0]) continue;
      let dateStr = String(row[0]).trim().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const d = new Date(String(row[0]).trim());
        if (isNaN(d.getTime())) continue;
        dateStr = ymd(d);
      }
      const val = (row[col] || '').toUpperCase().trim();
      if (val === 'BLOQUEADO' || val === 'MANTENIMIENTO') {
        dates.push(dateStr);
      }
    }
    if (dates.length === 0) return [];

    // Agrupar fechas consecutivas en rangos [checkin, checkout) (DTEND exclusivo en iCal).
    dates.sort((a, b) => a.localeCompare(b));
    const nextDay = (d: string) => { const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() + 1); return ymd(dt); };
    const ranges: Array<{ checkin: string; checkout: string }> = [];
    let start = dates[0];
    let prev = dates[0];
    for (let i = 1; i < dates.length; i++) {
      if (dates[i] === nextDay(prev)) { prev = dates[i]; continue; }
      ranges.push({ checkin: start, checkout: nextDay(prev) });
      start = dates[i]; prev = dates[i];
    }
    ranges.push({ checkin: start, checkout: nextDay(prev) });
    return ranges;
  } catch (e: any) {
    console.error('❌ getRoomBlockedRanges error:', e.message);
    return [];
  }
}

export async function checkAvailability(
  checkin: string, checkout: string,
  rooms: (string | { name: string })[],
  sessionId: string | null = null,
  excludeConfirmacion?: string,
): Promise<{ available: boolean; unavailableRooms: string[]; degraded?: boolean }> {
  const client = await getSheetsClient();
  // Fail-OPEN solo si Google NO está configurado (entorno local sin hoja).
  // Si SÍ está configurado pero el cliente falló (credenciales rotas/cuota),
  // fail-CLOSED: mejor pedir reintento que vender un cuarto ocupado.
  // `degraded: true` = el resultado viene de un error, NO de disponibilidad real;
  // permite a la UI distinguir "hotel lleno" de "no pudimos verificar".
  if (!process.env.GOOGLE_SHEET_ID) return { available: true, unavailableRooms: [] };
  if (!client) {
    console.error('❌ checkAvailability: Sheets configurado pero cliente nulo — fail-closed');
    return { available: false, unavailableRooms: rooms.map(r => typeof r === 'string' ? r : r.name), degraded: true };
  }
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
          if (status === 'RESERVADO' || status === 'BLOQUEADO' || status === 'MANTENIMIENTO' || status.startsWith('OTA')) {
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
    const reservasConflicts = await checkReservasForConflicts(checkin, checkout, normalizedRooms, excludeConfirmacion);
    for (const r of reservasConflicts) {
      if (!unavailableRooms.includes(r)) unavailableRooms.push(r);
    }

    return { available: unavailableRooms.length === 0, unavailableRooms };
  } catch (e: any) {
    console.error('❌ checkAvailability error:', e.message);
    // FAIL-CLOSED: ante error/timeout de Sheets NO afirmamos disponibilidad.
    // Sobrevender (doble reserva) es peor que pedir reintentar. Marcamos todas
    // las habitaciones solicitadas como no disponibles.
    const requested = rooms.map(r => typeof r === 'string' ? r : r.name);
    return { available: false, unavailableRooms: requested, degraded: true };
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
  excludeConfirmacion?: string,
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

      // Excluir la propia reserva (al editar sus fechas no debe chocar consigo misma)
      if (excludeConfirmacion && String(row[1] ?? '').trim() === excludeConfirmacion) continue;

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

/**
 * Renueva el apartado de una sesión: purga sus filas anteriores (y de paso
 * TODAS las filas ya expiradas de cualquier sesión) y escribe filas frescas
 * con expiración a 10 min. Con rooms vacío solo libera. Devuelve la
 * expiración ISO de las filas nuevas, o null si no se creó apartado.
 */
export async function renewTemporaryBlock(
  checkin: string, checkout: string,
  rooms: (string | { name: string })[], sessionId: string,
): Promise<string | null> {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return null;
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
    const kept = data.filter((row, i) => {
      if (i === 0) return true;                 // encabezado
      if (row[3] === sessionId) return false;   // filas viejas de esta sesión
      const exp = new Date(row[2] || '');
      return !isNaN(exp.getTime()) && exp > now; // purga expiradas
    });

    const normalizedRooms = rooms
      .map(r => typeof r === 'string' ? { name: normalizeRoomName(r) } : { name: normalizeRoomName(r.name) })
      .filter(r => ROOM_NAMES.includes(r.name));
    const dateRange = getDateRange(checkin, checkout);
    const expiration = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    for (const date of dateRange) {
      for (const room of normalizedRooms) {
        kept.push([date, room.name, expiration, sessionId]);
      }
    }

    await sheetsCall(() =>
      client.spreadsheets.values.clear({
        spreadsheetId: sid,
        range: `${TEMP_BLOCKS_SHEET}!A:D`,
      })
    );
    if (kept.length > 0) {
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: sid,
          range: `${TEMP_BLOCKS_SHEET}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: kept },
        })
      );
    }
    return normalizedRooms.length > 0 && dateRange.length > 0 ? expiration : null;
  } catch (e: any) {
    console.error('❌ renewTemporaryBlock error:', e.message);
    return null;
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
  return withAvailabilityLock(async () => {
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
    const prevRowCount = data.length; // filas que había ANTES de crecer (para limpiar sobrantes)
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
        if (colIdx > 0) {
          // No pisar estados especiales (mantenimiento) puestos manualmente.
          const current = String(data[rowIdx][colIdx] || '').toUpperCase().trim();
          if (current !== 'MANTENIMIENTO') data[rowIdx][colIdx] = 'RESERVADO';
        }
      }
    }

    const sorted = [headers, ...data.slice(1).sort((a, b) =>
      new Date(a[0] || '1970-01-01').getTime() - new Date(b[0] || '1970-01-01').getTime()
    )];

    // Escribir SIN ventana vacía: sobrescribimos en sitio (update) y solo limpiamos las
    // filas sobrantes si la hoja quedó más corta (aquí nunca encoge, pero es defensivo).
    // Ya no usamos clear(A:Z) antes del update — esa ventana vacía era lo que otra
    // corrida podía leer y reescribir a medias.
    await sheetsCall(() =>
      client.spreadsheets.values.update({
        spreadsheetId: sid,
        range: `${AVAILABILITY_SHEET}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: sorted },
      })
    );
    if (prevRowCount > sorted.length) {
      await sheetsCall(() =>
        client.spreadsheets.values.clear({
          spreadsheetId: sid,
          range: `${AVAILABILITY_SHEET}!A${sorted.length + 1}:Z${prevRowCount}`,
        })
      );
    }
    console.log(`✅ Fechas bloqueadas: ${dateRange.length} noches`);
   } catch (e: any) {
    console.error('❌ blockDates error:', e.message);
   }
  });
}

/**
 * Replaces all OTA blocks for a room with the new set of date ranges.
 * Clears previous OTA values for that room, then writes new ones.
 * This way, OTA cancellations are automatically removed on the next sync.
 */
export async function updateOTABlocks(
  roomName: string,
  dateRanges: Array<{ checkin: string; checkout: string }>,
  platform?: 'booking_com' | 'expedia',
): Promise<number> {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) return 0;
  const sid = process.env.GOOGLE_SHEET_ID;
  const normalizedRoom = normalizeRoomName(roomName);
  if (!ROOM_NAMES.includes(normalizedRoom)) return 0;

  // Valor de celda que ESPECIFICA la OTA de origen (ej. "OTA (Expedia)"). Mantiene
  // el prefijo "OTA" para que la detección de disponibilidad y el formato condicional
  // morado sigan funcionando.
  const otaLabel = platform === 'expedia' ? 'Expedia' : platform === 'booking_com' ? 'Booking' : '';
  const otaCellValue = otaLabel ? `OTA (${otaLabel})` : 'OTA';

  return withAvailabilityLock(async () => {
   try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: sid, range: `${AVAILABILITY_SHEET}!A:Z` })
    );
    let data: string[][] = res.data.values || [];
    const prevRowCount = data.length; // filas que había ANTES de crecer (para limpiar sobrantes)
    const headers: string[] = data[0] || ['Fecha', ...ROOM_NAMES];
    if (data.length === 0) data = [headers];

    const colIdx = headers.findIndex(h => h === normalizedRoom);
    if (colIdx === -1) return 0;

    // Clear existing OTA blocks for this room (cualquier "OTA (…)")
    for (let i = 1; i < data.length; i++) {
      if ((data[i][colIdx] || '').toUpperCase().startsWith('OTA')) {
        data[i][colIdx] = '';
      }
    }

    // Compute all dates to block
    const newDates = new Set<string>();
    for (const { checkin, checkout } of dateRanges) {
      for (const d of getDateRange(checkin, checkout)) newDates.add(d);
    }

    // Write new OTA blocks
    let blocked = 0;
    for (const date of newDates) {
      let rowIdx = data.findIndex(row => row[0] === date);
      if (rowIdx === -1) {
        data.push([date, ...Array(ROOM_NAMES.length).fill('')]);
        rowIdx = data.length - 1;
      }
      // Only mark OTA if not already a real reservation
      const current = (data[rowIdx][colIdx] || '').toUpperCase();
      if (!current || current.startsWith('OTA')) {
        data[rowIdx][colIdx] = otaCellValue;
        blocked++;
      }
    }

    const sorted = [headers, ...data.slice(1).sort((a, b) =>
      new Date(a[0] || '1970-01-01').getTime() - new Date(b[0] || '1970-01-01').getTime()
    )];

    // Escribir SIN ventana vacía (ya no clear(A:Z) antes del update): sobrescribimos en
    // sitio y solo limpiamos filas sobrantes si la hoja quedó más corta (defensivo).
    await sheetsCall(() =>
      client.spreadsheets.values.update({
        spreadsheetId: sid,
        range: `${AVAILABILITY_SHEET}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: sorted },
      })
    );
    if (prevRowCount > sorted.length) {
      await sheetsCall(() =>
        client.spreadsheets.values.clear({
          spreadsheetId: sid,
          range: `${AVAILABILITY_SHEET}!A${sorted.length + 1}:Z${prevRowCount}`,
        })
      );
    }

    // Pintar de morado en la propia hoja las celdas OTA (regla de formato condicional
    // idempotente: se agrega una sola vez y se aplica sola en cada sync).
    await ensureOTAConditionalFormat(client, sid).catch(err =>
      console.warn('⚠️ No se pudo aplicar el formato morado OTA:', err?.message)
    );

    return blocked;
   } catch (e: any) {
    console.error('❌ updateOTABlocks error:', e.message);
    return 0;
   }
  });
}

/**
 * Agrega (una sola vez) una regla de formato condicional a la hoja Disponibilidad:
 * cualquier celda cuyo texto empiece con "OTA" se pinta de morado (#7C3AED), igual
 * que el calendario del admin. Idempotente: si la regla ya existe, no hace nada.
 */
async function ensureOTAConditionalFormat(
  client: NonNullable<Awaited<ReturnType<typeof getSheetsClient>>>,
  sid: string,
): Promise<void> {
  const meta = await sheetsCall(() =>
    client.spreadsheets.get({
      spreadsheetId: sid,
      fields: 'sheets(properties(sheetId,title),conditionalFormats)',
    })
  );
  const sheet = (meta.data.sheets || []).find(
    (s: any) => s.properties?.title === AVAILABILITY_SHEET
  );
  if (!sheet?.properties) return;
  const sheetId = sheet.properties.sheetId;

  const alreadyExists = (sheet.conditionalFormats || []).some((cf: any) => {
    const cond = cf.booleanRule?.condition;
    return cond?.type === 'TEXT_STARTS_WITH' &&
      String(cond.values?.[0]?.userEnteredValue || '').toUpperCase() === 'OTA';
  });
  if (alreadyExists) return;

  await sheetsCall(() =>
    client.spreadsheets.batchUpdate({
      spreadsheetId: sid,
      requestBody: {
        requests: [{
          addConditionalFormatRule: {
            index: 0,
            rule: {
              // Columnas B en adelante (todas las habitaciones), todas las filas.
              ranges: [{ sheetId, startColumnIndex: 1 }],
              booleanRule: {
                condition: { type: 'TEXT_STARTS_WITH', values: [{ userEnteredValue: 'OTA' }] },
                format: {
                  backgroundColor: { red: 124 / 255, green: 58 / 255, blue: 237 / 255 }, // #7C3AED
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
                },
              },
            },
          },
        }],
      },
    })
  );
  console.log('🎨 Regla de formato condicional morado para OTA agregada a Disponibilidad.');
}
