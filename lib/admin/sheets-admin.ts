import { getSheetsClient } from '@/lib/sheets';
export { getSheetsClient };

const CONFIG_SHEET = 'Config';

export async function getBotStatus(): Promise<boolean> {
  const client = await getSheetsClient();
  if (!client) return true; // default: encendido si no hay conexión
  try {
    await ensureConfigSheet(client);
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${CONFIG_SHEET}!A:B`,
    });
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
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${CONFIG_SHEET}!A:A`,
    });
    const rows = res.data.values || [];
    const rowIdx = rows.findIndex(r => r[0] === 'bot_enabled');
    if (rowIdx >= 0) {
      await client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${CONFIG_SHEET}!B${rowIdx + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[String(enabled)]] },
      });
    } else {
      await client.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${CONFIG_SHEET}!A:B`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['bot_enabled', String(enabled)]] },
      });
    }
  } catch (e: any) {
    console.error('setBotStatus error:', e.message);
  }
}

async function ensureConfigSheet(client: Awaited<ReturnType<typeof getSheetsClient>>) {
  if (!client) return;
  try {
    const meta = await client.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const exists = meta.data.sheets?.some(s => s.properties?.title === CONFIG_SHEET);
    if (!exists) {
      await client.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: CONFIG_SHEET } } }] },
      });
      await client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${CONFIG_SHEET}!A1:B1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['bot_enabled', 'true']] },
      });
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
  return parseInt(String(raw).replace(/[^0-9]/g, ''), 10) || 0;
}

// ── RESERVAS ─────────────────────────────────────────────────────────────────

export async function getAllBookings(): Promise<AdminBooking[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  try {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${RESERVAS_SHEET}!A:N`,
    });
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
  total: number; notas: string;
}): Promise<string> {
  const client = await getSheetsClient();
  if (!client) throw new Error('No sheets client');

  const confirmacion = 'PE-M-' + Date.now().toString(36).toUpperCase();
  const ts = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

  await client.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${RESERVAS_SHEET}!A:N`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        ts, confirmacion, data.cliente, data.telefono, data.email,
        `$${data.total.toLocaleString('es-MX')} MXN`,
        data.checkin, data.checkout, data.noches, data.huespedes,
        data.habitacion, data.notas, 'MANUAL', '',
      ]],
    },
  });

  // Bloquear fechas en Disponibilidad
  await blockDatesForRoom(data.habitacion, data.checkin, data.checkout);

  return confirmacion;
}

export async function updateBooking(rowIndex: number, changes: Partial<{
  cliente: string; telefono: string; email: string; checkin: string;
  checkout: string; noches: number; huespedes: number; total: number;
  habitaciones: string; notas: string; estado: string;
}>): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;

  const colMap: Record<string, string> = {
    cliente: 'C', telefono: 'D', email: 'E', total: 'F',
    checkin: 'G', checkout: 'H', noches: 'I', huespedes: 'J',
    habitaciones: 'K', notas: 'L',
  };

  for (const [key, col] of Object.entries(colMap)) {
    if (key in changes) {
      const val = key === 'total'
        ? `$${(changes as any)[key].toLocaleString('es-MX')} MXN`
        : String((changes as any)[key]);
      await client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${RESERVAS_SHEET}!${col}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[val]] },
      });
    }
  }
}

export async function cancelBooking(rowIndex: number, habitaciones: string, checkin: string, checkout: string): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;

  // Marcar como CANCELADA en columna M (Payment ID usamos para estado manual)
  await client.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${RESERVAS_SHEET}!M${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['CANCELADA']] },
  });

  // Liberar fechas en Disponibilidad
  await unblockDatesForRoom(habitaciones, checkin, checkout);
}

// ── DISPONIBILIDAD ────────────────────────────────────────────────────────────

async function blockDatesForRoom(roomName: string, checkin: string, checkout: string) {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${AVAILABILITY_SHEET}!A:Z`,
    });
    const data = res.data.values || [];
    if (!data.length) return;
    const headers = data[0];
    const colIdx = headers.findIndex((h: string) => h === roomName);
    if (colIdx === -1) return;

    const start = new Date(checkin + 'T00:00:00');
    const end = new Date(checkout + 'T00:00:00');

    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      const rowDate = new Date(data[i][0].trim() + 'T00:00:00');
      if (rowDate >= start && rowDate < end) {
        const col = String.fromCharCode(65 + colIdx);
        await client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${AVAILABILITY_SHEET}!${col}${i + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['RESERVADO']] },
        });
      }
    }
  } catch (e: any) {
    console.error('blockDatesForRoom error:', e.message);
  }
}

async function unblockDatesForRoom(roomName: string, checkin: string, checkout: string) {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${AVAILABILITY_SHEET}!A:Z`,
    });
    const data = res.data.values || [];
    if (!data.length) return;
    const headers = data[0];
    const colIdx = headers.findIndex((h: string) => h === roomName);
    if (colIdx === -1) return;

    const start = new Date(checkin + 'T00:00:00');
    const end = new Date(checkout + 'T00:00:00');

    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      const rowDate = new Date(data[i][0].trim() + 'T00:00:00');
      if (rowDate >= start && rowDate < end) {
        const col = String.fromCharCode(65 + colIdx);
        await client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${AVAILABILITY_SHEET}!${col}${i + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['']] },
        });
      }
    }
  } catch (e: any) {
    console.error('unblockDatesForRoom error:', e.message);
  }
}

// ── COTIZACIONES ──────────────────────────────────────────────────────────────

export async function getAllQuotes(): Promise<AdminQuote[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  try {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${COTIZACIONES_SHEET}!A:L`,
    });
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
    const meta = await client.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const exists = meta.data.sheets?.some(s => s.properties?.title === sheetName);
    if (!exists) {
      await client.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
      });
      await client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      });
    }
  } catch (e: any) {
    console.error(`ensureSheet(${sheetName}) error:`, e.message);
  }
}

export async function createQuote(data: Omit<AdminQuote, 'rowIndex' | 'id' | 'fecha' | 'estado'>): Promise<string> {
  const client = await getSheetsClient();
  if (!client) throw new Error('Sin conexión a Google Sheets');

  await ensureSheet(COTIZACIONES_SHEET, ['ID','Fecha','Cliente','Teléfono','Email','Suite','CheckIn','CheckOut','Noches','PrecioTotal','Estado','Notas']);

  const id = 'COT-' + Date.now().toString(36).toUpperCase();
  const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

  await client.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${COTIZACIONES_SHEET}!A:L`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        id, fecha, data.cliente, data.telefono, data.email,
        data.suite, data.checkin, data.checkout, data.noches,
        data.precioTotal, 'BORRADOR', data.notas,
      ]],
    },
  });

  return id;
}

export async function updateQuoteStatus(rowIndex: number, estado: AdminQuote['estado']): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await client.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${COTIZACIONES_SHEET}!K${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[estado]] },
  });
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
    g.totalReservas++;
    g.totalGastado += b.total;
    if (!g.ultimaEstancia || b.checkin > g.ultimaEstancia) g.ultimaEstancia = b.checkin;
    if (b.habitaciones && !g.suitesFavoritas.includes(b.habitaciones)) {
      g.suitesFavoritas.push(b.habitaciones);
    }
    if (b.estado !== 'CANCELADA') {
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
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${NOTAS_CRM_SHEET}!A:C`,
    });
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
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${NOTAS_CRM_SHEET}!A:A`,
    });
    const rows = res.data.values || [];
    const rowIdx = rows.findIndex((r) => r[0]?.toLowerCase() === email.toLowerCase());
    const ts = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    if (rowIdx > 0) {
      await client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${NOTAS_CRM_SHEET}!B${rowIdx + 1}:C${rowIdx + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[notas, ts]] },
      });
    } else {
      await client.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${NOTAS_CRM_SHEET}!A:C`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[email, notas, ts]] },
      });
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
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${ROOM_STATUS_SHEET}!A:D`,
    });
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
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${ROOM_STATUS_SHEET}!A:A`,
    });
    const rows = res.data.values || [];
    const rowIdx = rows.findIndex(r => r[0] === suite);
    const ts = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    if (rowIdx > 0) {
      await client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${ROOM_STATUS_SHEET}!B${rowIdx + 1}:D${rowIdx + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[estado, notas, ts]] },
      });
    } else {
      await client.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${ROOM_STATUS_SHEET}!A:D`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[suite, estado, notas, ts]] },
      });
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
  | 'blog_publicado';

export async function logAgentActivity(tipo: AgentActivityType, detalle = ''): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  try {
    await ensureSheet(AGENT_METRICS_SHEET, ['Fecha', 'Tipo', 'Detalle']);
    const fecha = new Date().toISOString().split('T')[0];
    await client.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${AGENT_METRICS_SHEET}!A:C`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[fecha, tipo, detalle]] },
    });
  } catch (e: any) {
    console.error('logAgentActivity error:', e.message);
  }
}

export async function getAgentMetrics(): Promise<{ tipo: string; fecha: string; detalle: string }[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  try {
    await ensureSheet(AGENT_METRICS_SHEET, ['Fecha', 'Tipo', 'Detalle']);
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${AGENT_METRICS_SHEET}!A:C`,
    });
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
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${METRICAS_REDES_SHEET}!A:G`,
    });
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
  const fecha = new Date().toLocaleDateString('es-MX');
  await client.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${METRICAS_REDES_SHEET}!A:G`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        fecha, data.ig_seguidores, data.ig_alcance, data.ig_interacciones,
        data.fb_seguidores, data.fb_alcance, data.notas,
      ]],
    },
  });
}
