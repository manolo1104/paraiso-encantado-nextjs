import { getSheetsClient } from '@/lib/sheets';
import { INITIAL_MAINTENANCE_TASKS } from './cleaning-config';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const TAB_LIMPIEZA = 'Limpieza';
const TAB_MANT = 'Mantenimiento';

function todayMX(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function ensureTab(
  client: NonNullable<Awaited<ReturnType<typeof getSheetsClient>>>,
  title: string,
  headers: string[],
) {
  try {
    await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${title}!A1` });
  } catch {
    await client.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
    await client.spreadsheets.values.update({
      spreadsheetId: SHEET_ID, range: `${title}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }
}

// ── LIMPIEZA ──────────────────────────────────────────────────────────────────

export interface ChecklistResult {
  fecha: string;
  suite: string;
  turno: 'MAÑANA' | 'TARDE';
  personal: string;
  itemsCompletados: string[];
  itemsPendientes: string[];
  observaciones: string;
  completadoEn: string;
  estado: 'EN_PROCESO' | 'COMPLETO' | 'INCOMPLETO';
}

export async function getCleaningToday(fecha?: string): Promise<ChecklistResult[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureTab(client, TAB_LIMPIEZA, ['Fecha','Suite','Turno','Personal','ItemsCompletados','ItemsPendientes','Observaciones','CompletadoEn','Estado']);
  try {
    const targetDate = fecha || todayMX();
    const res = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_LIMPIEZA}!A:I` });
    return (res.data.values || []).slice(1)
      .filter(r => r[0] === targetDate)
      .map(r => ({
        fecha: r[0] || '', suite: r[1] || '', turno: (r[2] || 'MAÑANA') as 'MAÑANA' | 'TARDE',
        personal: r[3] || '',
        itemsCompletados: r[4] ? r[4].split('|').filter(Boolean) : [],
        itemsPendientes: r[5] ? r[5].split('|').filter(Boolean) : [],
        observaciones: r[6] || '', completadoEn: r[7] || '',
        estado: (r[8] || 'EN_PROCESO') as ChecklistResult['estado'],
      }));
  } catch { return []; }
}

export async function saveChecklistResult(data: Omit<ChecklistResult, 'fecha'>): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await ensureTab(client, TAB_LIMPIEZA, ['Fecha','Suite','Turno','Personal','ItemsCompletados','ItemsPendientes','Observaciones','CompletadoEn','Estado']);
  await client.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: `${TAB_LIMPIEZA}!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[
      todayMX(), data.suite, data.turno, data.personal,
      data.itemsCompletados.join('|'), data.itemsPendientes.join('|'),
      data.observaciones, new Date().toISOString(), data.estado,
    ]] },
  });
}

// ── MANTENIMIENTO ─────────────────────────────────────────────────────────────

export interface MaintenanceRow {
  rowIndex: number;
  suite: string;
  tarea: string;
  frecuenciaDias: number;
  ultimaVez: string;
  proximaVez: string;
  notas: string;
  responsable: string;
  overdue: boolean;
  daysOverdue: number;
}

export async function getMaintenanceTasks(): Promise<MaintenanceRow[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureTab(client, TAB_MANT, ['Suite','Tarea','FrecuenciaDias','UltimaVez','ProximaVez','Notas','Responsable']);
  try {
    const res = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_MANT}!A:G` });
    const rows = (res.data.values || []).slice(1);

    // Si la tab está vacía, sembrar con tareas iniciales
    if (rows.length === 0) {
      await seedMaintenanceTasks(client);
      const res2 = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_MANT}!A:G` });
      return parseMaintRows((res2.data.values || []).slice(1));
    }
    return parseMaintRows(rows);
  } catch { return []; }
}

function parseMaintRows(rows: string[][]): MaintenanceRow[] {
  const today = todayMX();
  return rows.map((r, i) => {
    const proximaVez = r[4] || '';
    const daysDiff = proximaVez
      ? Math.round((new Date(today + 'T12:00:00').getTime() - new Date(proximaVez + 'T12:00:00').getTime()) / 86400000)
      : 0;
    return {
      rowIndex: i + 2,
      suite: r[0] || '', tarea: r[1] || '',
      frecuenciaDias: parseInt(r[2]) || 30,
      ultimaVez: r[3] || '', proximaVez,
      notas: r[5] || '', responsable: r[6] || '',
      overdue: daysDiff > 0,
      daysOverdue: Math.max(0, daysDiff),
    };
  });
}

async function seedMaintenanceTasks(client: NonNullable<Awaited<ReturnType<typeof getSheetsClient>>>) {
  const today = todayMX();
  const rows = INITIAL_MAINTENANCE_TASKS.map(t => [
    t.suite, t.tarea, t.frecuenciaDias,
    today, addDaysStr(today, t.frecuenciaDias),
    t.notas, t.responsable,
  ]);
  await client.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: `${TAB_MANT}!A:G`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  });
}

export async function markMaintenanceDone(suite: string, tarea: string, completadoPor: string): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  const res = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_MANT}!A:G` });
  const rows = res.data.values || [];
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === suite && r[1] === tarea);
  if (rowIdx < 0) return;
  const freq = parseInt(rows[rowIdx][2]) || 30;
  const today = todayMX();
  await client.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: `${TAB_MANT}!D${rowIdx + 1}:G${rowIdx + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[today, addDaysStr(today, freq), rows[rowIdx][5] || '', completadoPor]] },
  });
}

export async function addMaintenanceTask(task: { suite: string; tarea: string; frecuenciaDias: number; notas: string; responsable: string }): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await ensureTab(client, TAB_MANT, ['Suite','Tarea','FrecuenciaDias','UltimaVez','ProximaVez','Notas','Responsable']);
  const today = todayMX();
  await client.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: `${TAB_MANT}!A:G`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[task.suite, task.tarea, task.frecuenciaDias, today, addDaysStr(today, task.frecuenciaDias), task.notas, task.responsable]] },
  });
}
