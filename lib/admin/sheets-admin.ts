import { getSheetsClient, sheetsCall } from '@/lib/sheets';
export { getSheetsClient };

const CONFIG_SHEET = 'Config';

export async function getBotStatus(): Promise<boolean> {
  const client = await getSheetsClient();
  if (!client) return true; // default: encendido si no hay conexión
  try {
    await ensureConfigSheet(client);
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${CONFIG_SHEET}!A:B` })
    );
    const rows = res.data.values || [];
    const row = rows.find(r => r[0] === 'bot_enabled');
    return row ? row[1] !== 'false' : true;
  } catch {
    return true;
  }
}

export async function setBotStatus(enabled: boolean): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    await ensureConfigSheet(client);
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${CONFIG_SHEET}!A:A` })
    );
    const rows = res.data.values || [];
    const rowIdx = rows.findIndex(r => r[0] === 'bot_enabled');
    if (rowIdx >= 0) {
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${CONFIG_SHEET}!B${rowIdx + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[String(enabled)]] },
        })
      );
    } else {
      await sheetsCall(() =>
        client.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${CONFIG_SHEET}!A:B`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['bot_enabled', String(enabled)]] },
        })
      );
    }
  } catch (e: any) {
    console.error('setBotStatus error:', e.message);
  }
}

async function ensureConfigSheet(client: Awaited<ReturnType<typeof getSheetsClient>>) {
  if (!client) return;
  try {
    const meta = await sheetsCall(() =>
      client.spreadsheets.get({ spreadsheetId: SHEET_ID })
    );
    const exists = meta.data.sheets?.some(s => s.properties?.title === CONFIG_SHEET);
    if (!exists) {
      await sheetsCall(() =>
        client.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { requests: [{ addSheet: { properties: { title: CONFIG_SHEET } } }] },
        })
      );
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${CONFIG_SHEET}!A1:B1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['bot_enabled', 'true']] },
        })
      );
    }
  } catch { /* ignorar */ }
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const RESERVAS_SHEET = process.env.GOOGLE_SHEET_TAB || 'Reservas';
const COTIZACIONES_SHEET = 'Cotizaciones';
const NOTAS_CRM_SHEET = 'NotasCRM';
const METRICAS_REDES_SHEET = 'MetricasRedes';
const AVAILABILITY_SHEET = 'Disponibilidad';

export interface AdminBooking {
  rowIndex: number;
  fecha: string;
  confirmacion: string;
  cliente: string;
  telefono: string;
  email: string;
  total: number;
  checkin: string;
  checkout: string;
  noches: number;
  huespedes: number;
  habitaciones: string;
  notas: string;
  paymentId: string;
  estado: 'CONFIRMADA' | 'CANCELADA' | 'MANUAL';
  comoNosConocio: string;
  anticipo: number;
}

export interface AdminQuote {
  rowIndex: number;
  id: string;
  fecha: string;
  cliente: string;
  telefono: string;
  email: string;
  suite: string;
  checkin: string;
  checkout: string;
  noches: number;
  precioTotal: number;
  estado: 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'EXPIRADA';
  notas: string;
}

export interface GuestStay {
  confirmacion: string;
  checkin: string;
  checkout: string;
  habitaciones: string;
  total: number;
  noches: number;
  huespedes: number;
}

export interface GuestProfile {
  email: string;
  nombre: string;
  telefono: string;
  totalReservas: number;
  totalGastado: number;
  ultimaEstancia: string;
  suitesFavoritas: string[];
  notas: string;
  historial: GuestStay[];
  waConversaciones: number;
}

function parseTotal(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  // Preservar el punto decimal: "$8,555.50 MXN" → 8555.50 (antes daba 855550).
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// ── RESERVAS ─────────────────────────────────────────────────────────────────

export async function getAllBookings(): Promise<AdminBooking[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${RESERVAS_SHEET}!A:O` })
    );
    const rows = res.data.values || [];
    if (rows.length < 2) return [];

    return rows.slice(1).map((row, i) => ({
      rowIndex: i + 2,
      fecha: row[0] || '',
      confirmacion: row[1] || '',
      cliente: row[2] || '',
      telefono: row[3] || '',
      email: row[4] || '',
      total: parseTotal(row[5]),
      checkin: row[6] || '',
      checkout: row[7] || '',
      noches: parseInt(row[8]) || 0,
      huespedes: parseInt(row[9]) || 0,
      habitaciones: row[10] || '',
      notas: row[11] || '',
      paymentId: row[12] || '',
      comoNosConocio: row[13] || '',
      anticipo: parseTotal(row[14] || '0'),
      estado: row[12] === 'CANCELADA' ? 'CANCELADA'
            : row[12] === 'MANUAL' ? 'MANUAL'
            : 'CONFIRMADA',
    }));
  } catch (e: any) {
    console.error('getAllBookings error:', e.message);
    return [];
  }
}

export async function createManualBooking(data: {
  cliente: string; telefono: string; email: string; habitacion: string;
  checkin: string; checkout: string; noches: number; huespedes: number;
  total: number; notas: string; anticipo?: number;
}): Promise<string> {
  const client = await getSheetsClient();
  if (!client) throw new Error('No sheets client');

  const confirmacion = 'PE-M-' + Date.now().toString(36).toUpperCase();
  const ts = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

  await sheetsCall(() =>
    client.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${RESERVAS_SHEET}!A:N`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          ts, confirmacion, data.cliente, data.telefono, data.email,
          `$${data.total.toLocaleString('es-MX')} MXN`,
          data.checkin, data.checkout, data.noches, data.huespedes,
          data.habitacion, data.notas, 'MANUAL', '',
          data.anticipo || 0,
        ]],
      },
    })
  );

  // Bloquear fechas en Disponibilidad
  await blockDatesForRoom(data.habitacion, data.checkin, data.checkout);

  return confirmacion;
}

export async function updateBooking(rowIndex: number, changes: Partial<{
  cliente: string; telefono: string; email: string; checkin: string;
  checkout: string; noches: number; huespedes: number; total: number;
  habitaciones: string; notas: string; estado: string; anticipo: number;
}>): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;

  const colMap: Record<string, string> = {
    cliente: 'C', telefono: 'D', email: 'E', total: 'F',
    checkin: 'G', checkout: 'H', noches: 'I', huespedes: 'J',
    habitaciones: 'K', notas: 'L', anticipo: 'O',
  };

  for (const [key, col] of Object.entries(colMap)) {
    if (key in changes) {
      const val = key === 'total'
        ? `$${(changes as any)[key].toLocaleString('es-MX')} MXN`
        : String((changes as any)[key]);
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${RESERVAS_SHEET}!${col}${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[val]] },
        })
      );
    }
  }
}

export async function cancelBooking(rowIndex: number, habitaciones: string, checkin: string, checkout: string): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;

  // Marcar como CANCELADA en columna M (Payment ID usamos para estado manual)
  await sheetsCall(() =>
    client.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${RESERVAS_SHEET}!M${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['CANCELADA']] },
    })
  );

  // Liberar fechas en Disponibilidad
  await unblockDatesForRoom(habitaciones, checkin, checkout);
}

// ── DISPONIBILIDAD ────────────────────────────────────────────────────────────

/**
 * Actualiza el sheet Disponibilidad para una habitación individual.
 * Lee el sheet una vez y aplica todos los updates de forma secuencial.
 */
async function updateSingleRoomAvailability(
  roomName: string, checkin: string, checkout: string, value: 'RESERVADO' | ''
) {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${AVAILABILITY_SHEET}!A:Z` })
    );
    const data = res.data.values || [];
    if (!data.length) return;
    const headers = data[0];
    const colIdx = headers.findIndex((h: string) => h === roomName.trim());
    if (colIdx === -1) {
      console.warn(`updateAvailability: columna "${roomName}" no encontrada en Disponibilidad`);
      return;
    }
    const col = String.fromCharCode(65 + colIdx);
    const start = new Date(checkin + 'T00:00:00');
    const end   = new Date(checkout + 'T00:00:00');

    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      const rowDate = new Date(data[i][0].trim() + 'T00:00:00');
      if (rowDate >= start && rowDate < end) {
        await sheetsCall(() =>
          client.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${AVAILABILITY_SHEET}!${col}${i + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[value]] },
          })
        );
      }
    }
  } catch (e: any) {
    console.error(`updateSingleRoomAvailability error (${roomName}):`, e.message);
  }
}

/**
 * Bloquea habitaciones en Disponibilidad (acepta string CSV de nombres).
 * Exported para uso en el PATCH handler de reservas.
 */
export async function blockRooms(habitacionesStr: string, checkin: string, checkout: string) {
  const rooms = habitacionesStr.split(',').map(r => r.replace(/\s*\([^)]*\)/g, '').trim()).filter(Boolean);
  for (const room of rooms) {
    await updateSingleRoomAvailability(room, checkin, checkout, 'RESERVADO');
  }
}

/**
 * Desbloquea habitaciones en Disponibilidad (acepta string CSV de nombres).
 * Exported para uso en cancelaciones y cambios.
 */
export async function unblockRooms(habitacionesStr: string, checkin: string, checkout: string) {
  const rooms = habitacionesStr.split(',').map(r => r.replace(/\s*\([^)]*\)/g, '').trim()).filter(Boolean);
  for (const room of rooms) {
    await updateSingleRoomAvailability(room, checkin, checkout, '');
  }
}

// Compat aliases usados internamente
async function blockDatesForRoom(roomName: string, checkin: string, checkout: string) {
  await blockRooms(roomName, checkin, checkout);
}
async function unblockDatesForRoom(roomName: string, checkin: string, checkout: string) {
  await unblockRooms(roomName, checkin, checkout);
}

// ── COTIZACIONES ──────────────────────────────────────────────────────────────

export async function getAllQuotes(): Promise<AdminQuote[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${COTIZACIONES_SHEET}!A:L` })
    );
    const rows = res.data.values || [];
    if (rows.length < 2) return [];

    return rows.slice(1).map((row, i) => ({
      rowIndex: i + 2,
      id: row[0] || '',
      fecha: row[1] || '',
      cliente: row[2] || '',
      telefono: row[3] || '',
      email: row[4] || '',
      suite: row[5] || '',
      checkin: row[6] || '',
      checkout: row[7] || '',
      noches: parseInt(row[8]) || 0,
      precioTotal: parseTotal(row[9]),
      estado: (row[10] || 'BORRADOR') as AdminQuote['estado'],
      notas: row[11] || '',
    }));
  } catch {
    return [];
  }
}

async function ensureSheet(sheetName: string, headers: string[]) {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    const meta = await sheetsCall(() =>
      client.spreadsheets.get({ spreadsheetId: SHEET_ID })
    );
    const exists = meta.data.sheets?.some(s => s.properties?.title === sheetName);
    if (!exists) {
      await sheetsCall(() =>
        client.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
        })
      );
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [headers] },
        })
      );
    }
  } catch (e: any) {
    console.error(`ensureSheet(${sheetName}) error:`, e.message);
  }
}

export async function createQuote(data: Omit<AdminQuote, 'rowIndex' | 'id' | 'fecha' | 'estado'>): Promise<string> {
  const client = await getSheetsClient();
  if (!client) throw new Error('Sin conexión a Google Sheets. Verifica que GOOGLE_SHEETS_CREDENTIALS y GOOGLE_SHEET_ID estén configurados.');

  const id = 'COT-' + Date.now().toString(36).toUpperCase();
  const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
  const row = [
    id, fecha, data.cliente, data.telefono, data.email,
    data.suite, data.checkin, data.checkout, data.noches,
    data.precioTotal, 'BORRADOR', data.notas,
  ];

  const appendRow = () => sheetsCall(() =>
    client.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${COTIZACIONES_SHEET}!A:L`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    })
  );

  try {
    await appendRow();
  } catch (firstErr: any) {
    const msg = String(firstErr?.message ?? '');
    // Si la pestaña no existe, crearla y reintentar
    if (msg.includes('parse range') || msg.includes('Unable to') || msg.includes('notFound') || msg.includes('404')) {
      // Crear la pestaña
      await sheetsCall(() =>
        client.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { requests: [{ addSheet: { properties: { title: COTIZACIONES_SHEET } } }] },
        })
      ).catch(() => {}); // Ignorar si ya existe (race condition)

      // Agregar encabezados
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${COTIZACIONES_SHEET}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['ID','Fecha','Cliente','Teléfono','Email','Suite','CheckIn','CheckOut','Noches','PrecioTotal','Estado','Notas']] },
        })
      ).catch(() => {});

      // Reintentar
      await appendRow();
    } else {
      throw firstErr;
    }
  }

  return id;
}

export async function updateQuoteStatus(rowIndex: number, estado: AdminQuote['estado']): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await sheetsCall(() =>
    client.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${COTIZACIONES_SHEET}!K${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[estado]] },
    })
  );
}

// ── CRM ───────────────────────────────────────────────────────────────────────

export async function buildCRM(bookings: AdminBooking[]): Promise<GuestProfile[]> {
  const map = new Map<string, GuestProfile>();

  for (const b of bookings) {
    if (!b.email || b.email === 'N/A') continue;
    const key = b.email.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        email: b.email,
        nombre: b.cliente,
        telefono: b.telefono,
        totalReservas: 0,
        totalGastado: 0,
        ultimaEstancia: '',
        suitesFavoritas: [],
        notas: '',
        historial: [],
        waConversaciones: 0,
      });
    }
    const g = map.get(key)!;
    // Las reservas CANCELADAS no cuentan para gasto/estadías/ranking del CRM
    // (antes inflaban "total gastado" y el estatus VIP, contradiciendo lealtad).
    if (b.estado !== 'CANCELADA') {
      g.totalReservas++;
      g.totalGastado += b.total;
      if (!g.ultimaEstancia || b.checkin > g.ultimaEstancia) g.ultimaEstancia = b.checkin;
      if (b.habitaciones && !g.suitesFavoritas.includes(b.habitaciones)) {
        g.suitesFavoritas.push(b.habitaciones);
      }
      g.historial.push({
        confirmacion: b.confirmacion,
        checkin: b.checkin,
        checkout: b.checkout,
        habitaciones: b.habitaciones,
        total: b.total,
        noches: b.noches,
        huespedes: b.huespedes,
      });
    }
  }

  // Sort historial by date desc
  for (const g of map.values()) {
    g.historial.sort((a, b) => b.checkin.localeCompare(a.checkin));
  }

  // Cargar notas
  const notas = await getGuestNotes();
  for (const [email, nota] of Object.entries(notas)) {
    const profile = map.get(email.toLowerCase());
    if (profile) profile.notas = nota;
  }

  return Array.from(map.values()).sort((a, b) => b.totalGastado - a.totalGastado);
}

async function getGuestNotes(): Promise<Record<string, string>> {
  const client = await getSheetsClient();
  if (!client) return {};
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${NOTAS_CRM_SHEET}!A:C` })
    );
    const rows = res.data.values || [];
    const result: Record<string, string> = {};
    for (const row of rows.slice(1)) {
      if (row[0]) result[row[0].toLowerCase()] = row[1] || '';
    }
    return result;
  } catch {
    return {};
  }
}

export async function saveGuestNote(email: string, notas: string): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await ensureSheet(NOTAS_CRM_SHEET, ['Email','Notas','UltimaActualizacion']);
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${NOTAS_CRM_SHEET}!A:A` })
    );
    const rows = res.data.values || [];
    const rowIdx = rows.findIndex((r) => r[0]?.toLowerCase() === email.toLowerCase());
    const ts = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    if (rowIdx > 0) {
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${NOTAS_CRM_SHEET}!B${rowIdx + 1}:C${rowIdx + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[notas, ts]] },
        })
      );
    } else {
      await sheetsCall(() =>
        client.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${NOTAS_CRM_SHEET}!A:C`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[email, notas, ts]] },
        })
      );
    }
  } catch (e: any) {
    console.error('saveGuestNote error:', e.message);
  }
}

// ── ROOM STATUS ───────────────────────────────────────────────────────────────

const ROOM_STATUS_SHEET = 'RoomStatus';

export type RoomStatusType = 'DISPONIBLE' | 'OCUPADA' | 'MANTENIMIENTO' | 'LIMPIEZA';

export interface RoomStatus {
  suite: string;
  estado: RoomStatusType;
  notas: string;
  actualizacion: string;
}

const ALL_SUITES = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla','Suite Lajas',
  'Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble','Orquídeas 3',
  'Bromelias','Helechos 1','Helechos 2',
];

export async function getRoomStatuses(): Promise<RoomStatus[]> {
  const client = await getSheetsClient();
  if (!client) return ALL_SUITES.map(s => ({ suite: s, estado: 'DISPONIBLE', notas: '', actualizacion: '' }));
  try {
    await ensureSheet(ROOM_STATUS_SHEET, ['Suite','Estado','Notas','Actualizacion']);
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${ROOM_STATUS_SHEET}!A:D` })
    );
    const rows = res.data.values || [];
    const map = new Map<string, RoomStatus>();
    for (const row of rows.slice(1)) {
      if (row[0]) map.set(row[0], {
        suite: row[0],
        estado: (row[1] as RoomStatusType) || 'DISPONIBLE',
        notas: row[2] || '',
        actualizacion: row[3] || '',
      });
    }
    return ALL_SUITES.map(s => map.get(s) ?? { suite: s, estado: 'DISPONIBLE', notas: '', actualizacion: '' });
  } catch {
    return ALL_SUITES.map(s => ({ suite: s, estado: 'DISPONIBLE', notas: '', actualizacion: '' }));
  }
}

export async function setRoomStatus(suite: string, estado: RoomStatusType, notas = ''): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    await ensureSheet(ROOM_STATUS_SHEET, ['Suite','Estado','Notas','Actualizacion']);
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${ROOM_STATUS_SHEET}!A:A` })
    );
    const rows = res.data.values || [];
    const rowIdx = rows.findIndex(r => r[0] === suite);
    const ts = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    if (rowIdx > 0) {
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${ROOM_STATUS_SHEET}!B${rowIdx + 1}:D${rowIdx + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[estado, notas, ts]] },
        })
      );
    } else {
      await sheetsCall(() =>
        client.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${ROOM_STATUS_SHEET}!A:D`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[suite, estado, notas, ts]] },
        })
      );
    }
  } catch (e: any) {
    console.error('setRoomStatus error:', e.message);
  }
}

// ── AGENT METRICS ─────────────────────────────────────────────────────────────

const AGENT_METRICS_SHEET = 'AgentMetrics';

export type AgentActivityType =
  | 'whatsapp_conv'
  | 'email_confirmacion'
  | 'email_preestancia'
  | 'email_postestancia'
  | 'blog_publicado'
  | 'cotizacion_auto_enviada';

export async function logAgentActivity(tipo: AgentActivityType, detalle = ''): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    await ensureSheet(AGENT_METRICS_SHEET, ['Fecha', 'Tipo', 'Detalle']);
    const fecha = new Date().toISOString().split('T')[0];
    await sheetsCall(() =>
      client.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${AGENT_METRICS_SHEET}!A:C`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[fecha, tipo, detalle]] },
      })
    );
  } catch (e: any) {
    console.error('logAgentActivity error:', e.message);
  }
}

export async function getAgentMetrics(): Promise<{ tipo: string; fecha: string; detalle: string }[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  try {
    await ensureSheet(AGENT_METRICS_SHEET, ['Fecha', 'Tipo', 'Detalle']);
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${AGENT_METRICS_SHEET}!A:C` })
    );
    const rows = res.data.values || [];
    return rows.slice(1).map(r => ({
      fecha: r[0] || '',
      tipo: r[1] || '',
      detalle: r[2] || '',
    }));
  } catch {
    return [];
  }
}

// ── MÉTRICAS REDES ────────────────────────────────────────────────────────────

export interface RedMetrica {
  fecha: string;
  ig_seguidores: number;
  ig_alcance: number;
  ig_interacciones: number;
  fb_seguidores: number;
  fb_alcance: number;
  notas: string;
}

export async function getRedMetricas(): Promise<RedMetrica[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${METRICAS_REDES_SHEET}!A:G` })
    );
    const rows = res.data.values || [];
    return rows.slice(1).map((r) => ({
      fecha: r[0] || '',
      ig_seguidores: parseInt(r[1]) || 0,
      ig_alcance: parseInt(r[2]) || 0,
      ig_interacciones: parseInt(r[3]) || 0,
      fb_seguidores: parseInt(r[4]) || 0,
      fb_alcance: parseInt(r[5]) || 0,
      notas: r[6] || '',
    })).reverse();
  } catch {
    return [];
  }
}

export async function saveRedMetrica(data: Omit<RedMetrica, 'fecha'>): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await ensureSheet(METRICAS_REDES_SHEET, ['Fecha','IG_Seguidores','IG_Alcance','IG_Interacciones','FB_Seguidores','FB_Alcance','Notas']);
  // Fecha en hora de México (antes toLocaleDateString sin zona → saltaba de día
  // tras las 6pm). RAW para que las notas de texto libre no se interpreten como
  // fórmula si empiezan con "=".
  const fecha = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
  await sheetsCall(() =>
    client.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${METRICAS_REDES_SHEET}!A:G`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          fecha, data.ig_seguidores, data.ig_alcance, data.ig_interacciones,
          data.fb_seguidores, data.fb_alcance, data.notas,
        ]],
      },
    })
  );
}

// ── OTA CALENDARS ─────────────────────────────────────────────────────────────

const OTA_CALENDARS_SHEET = 'OTA_Calendars';
const OTA_HEADERS = ['id', 'roomName', 'platform', 'icalUrl', 'active', 'lastSync', 'status', 'blocksFound'];

export interface OTACalendar {
  id: string;
  roomName: string;
  platform: 'booking_com' | 'expedia';
  icalUrl: string;
  active: boolean;
  lastSync: string;
  status: 'ok' | 'error' | 'pending';
  blocksFound: number;
}

export async function getAllOTACalendars(): Promise<OTACalendar[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  try {
    await ensureSheet(OTA_CALENDARS_SHEET, OTA_HEADERS);
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${OTA_CALENDARS_SHEET}!A:H` })
    );
    const rows = res.data.values || [];
    // Filas de datos válidas: ignora el encabezado (r[0]==='id') y filas basura (sin id/habitación/plataforma).
    // NO asume que la fila 0 es encabezado (la hoja pudo quedar sin encabezado).
    const mapped = rows
      .filter(r => r[0] && r[0] !== 'id' && r[1] && r[2])
      .map(r => ({
        id: r[0] as string,
        roomName: r[1] as string,
        platform: (r[2] || 'booking_com') as OTACalendar['platform'],
        icalUrl: r[3] || '',
        // Google Sheets con USER_ENTERED convierte 'false' → booleano y lo devuelve
        // como 'FALSE'; comparar en minúsculas para que "pausar" sí funcione.
        active: String(r[4] ?? '').toLowerCase() !== 'false',
        lastSync: r[5] || '',
        status: (r[6] || 'pending') as OTACalendar['status'],
        blocksFound: parseInt(r[7]) || 0,
      }));

    // Deduplicar por habitación+plataforma (conserva la última) — limpia filas repetidas de reintentos
    const byKey = new Map<string, OTACalendar>();
    for (const c of mapped) byKey.set(`${c.roomName}|${c.platform}`, c);
    return [...byKey.values()];
  } catch (e: any) {
    console.error('getAllOTACalendars error:', e.message);
    return [];
  }
}

export async function saveOTACalendar(cal: Omit<OTACalendar, 'lastSync' | 'status' | 'blocksFound'>): Promise<void> {
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets no está configurado (faltan credenciales en el entorno).');
  await ensureSheet(OTA_CALENDARS_SHEET, OTA_HEADERS);

  const res = await sheetsCall(() =>
    client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${OTA_CALENDARS_SHEET}!A:H` })
  );
  const rows = res.data.values || [];

  // Upsert por id; si no, por (habitación + plataforma) para que los reintentos NO dupliquen.
  // Ignora encabezado (r[0]==='id') y filas basura (sin id); NO asume que la fila 0 sea encabezado.
  const isData = (r: any[]) => r[0] && r[0] !== 'id';
  let rowIdx = rows.findIndex(r => isData(r) && r[0] === cal.id);
  if (rowIdx < 0) {
    rowIdx = rows.findIndex(r => isData(r) && r[1] === cal.roomName && r[2] === cal.platform);
  }

  const row = [cal.id, cal.roomName, cal.platform, cal.icalUrl, String(cal.active), '', 'pending', '0'];

  if (rowIdx >= 0) {
    row[0] = rows[rowIdx][0] || cal.id; // conservar el id existente
    const upd = await sheetsCall(() =>
      client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${OTA_CALENDARS_SHEET}!A${rowIdx + 1}:H${rowIdx + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      })
    );
    if (!upd.data?.updatedCells) throw new Error('La actualización en Google Sheets no escribió ninguna celda.');
  } else {
    const app = await sheetsCall(() =>
      client.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${OTA_CALENDARS_SHEET}!A:H`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      })
    );
    if (!app.data?.updates?.updatedRows) throw new Error('El guardado en Google Sheets no agregó ninguna fila.');
  }
}

export async function deleteOTACalendar(id: string): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${OTA_CALENDARS_SHEET}!A:A` })
    );
    const rows = res.data.values || [];
    const rowIdx = rows.findIndex(r => r[0] === id);
    if (rowIdx <= 0) return;

    const meta = await sheetsCall(() => client.spreadsheets.get({ spreadsheetId: SHEET_ID }));
    const sheet = meta.data.sheets?.find(s => s.properties?.title === OTA_CALENDARS_SHEET);
    if (!sheet?.properties?.sheetId) return;

    await sheetsCall(() =>
      client.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheet.properties!.sheetId,
                dimension: 'ROWS',
                startIndex: rowIdx,
                endIndex: rowIdx + 1,
              },
            },
          }],
        },
      })
    );
  } catch (e: any) {
    console.error('deleteOTACalendar error:', e.message);
  }
}

export async function updateOTASyncResult(
  id: string,
  status: 'ok' | 'error',
  blocksFound: number,
): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${OTA_CALENDARS_SHEET}!A:A` })
    );
    const rows = res.data.values || [];
    const rowIdx = rows.findIndex(r => r[0] === id);
    if (rowIdx <= 0) return;

    await sheetsCall(() =>
      client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${OTA_CALENDARS_SHEET}!F${rowIdx + 1}:H${rowIdx + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[new Date().toISOString(), status, String(blocksFound)]] },
      })
    );
  } catch (e: any) {
    console.error('updateOTASyncResult error:', e.message);
  }
}
