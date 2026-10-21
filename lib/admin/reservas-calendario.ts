/**
 * reservas-calendario.ts — Noches cerradas desde /admin/calendario.
 *
 * Al cerrar una fecha, el panel pregunta si es una RESERVA (llegó por WhatsApp,
 * teléfono, Booking…) o solo un BLOQUEO (mantenimiento, uso del hotel). La
 * diferencia importa por dos cosas:
 *  - la reserva escribe `RESERVADO` en la matriz y el bloqueo `BLOQUEADO` (los
 *    dos cierran la noche igual para la web y el bot);
 *  - la reserva queda apuntada en la pestaña `ReservasCalendario` y se suma al
 *    «N reservas confirmadas este mes» de /reservar (ver /api/social-proof).
 *    Antes esas ventas no existían para la prueba social: solo contaba la
 *    hoja Reservas. Desde el 20 oct 2026 salen también en el aviso de reservas
 *    recientes, sin nombre («Nueva reserva en Jungla»): no hay nombre que
 *    enseñar, y el dueño pidió que el aviso traiga las reservas más nuevas.
 *
 * Una fila por reserva (no por noche): cerrar 3 noches de una reserva cuenta 1.
 */
import { getSheetsClient, sheetsCall, withAvailabilityLock } from '@/lib/sheets';
import { sumarDias } from '@/lib/precios';
import { mexicoTodayStr } from '@/lib/date-mx';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const TAB = 'ReservasCalendario';
const MATRIZ = 'Disponibilidad';
const HEADERS = ['Registrada', 'Id', 'Suite', 'Llegada', 'Salida', 'Noches', 'Canal', 'Estado'];

export const CANALES = ['WhatsApp', 'Teléfono', 'Booking.com', 'En persona', 'Otro'] as const;
export const MAX_NOCHES_PANEL = 14;

export interface ReservaCalendario {
  registrada: string; // ISO
  id: string;
  suite: string;
  llegada: string;
  salida: string;
  noches: number;
  canal: string;
  estado: 'activa' | 'cancelada';
  /** Fila real en la hoja (1-indexada) */
  row: number;
}

type Cliente = NonNullable<Awaited<ReturnType<typeof getSheetsClient>>>;

async function asegurarPestana(): Promise<Cliente | null> {
  const client = await getSheetsClient();
  if (!client || !SHEET_ID) return null;
  try {
    await sheetsCall(() => client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!A1` }));
  } catch {
    try {
      await client.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
      });
    } catch { /* ya existía (carrera) */ }
    await sheetsCall(() => client.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    }));
  }
  return client;
}

function aFila(r: string[], row: number): ReservaCalendario {
  return {
    registrada: r[0] || '',
    id: r[1] || '',
    suite: r[2] || '',
    llegada: r[3] || '',
    salida: r[4] || '',
    noches: Number(r[5]) || 0,
    canal: r[6] || '',
    estado: (r[7] === 'cancelada' ? 'cancelada' : 'activa'),
    row,
  };
}

export async function getReservasCalendario(soloLeer = false): Promise<ReservaCalendario[]> {
  // `soloLeer`: la ruta pública de prueba social nunca crea la pestaña; si aún
  // no existe (nadie ha cerrado una reserva desde el panel), son 0.
  const client = soloLeer ? await getSheetsClient() : await asegurarPestana();
  if (!client || !SHEET_ID) return [];
  if (soloLeer) {
    try {
      const res = await sheetsCall(() => client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!A:H` }));
      return (res.data.values || []).slice(1).map((r, i) => aFila(r as string[], i + 2)).filter((r) => r.id);
    } catch {
      return [];
    }
  }
  const res = await sheetsCall(() => client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!A:H` }));
  const filas = res.data.values || [];
  return filas.slice(1).map((r, i) => aFila(r as string[], i + 2)).filter((r) => r.id);
}

/** 'YYYY-MM-DD' de la columna A de la matriz, venga como venga. */
function aISO(raw: unknown): string | null {
  const s = String(raw ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function letraColumna(i: number): string {
  let n = i + 1;
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** Libre para cerrarla: vacía o liberada a mano (ABIERTO). */
function celdaLibre(v: unknown): boolean {
  const s = String(v ?? '').toUpperCase().trim();
  return s === '' || s === 'ABIERTO';
}

export type ResultadoCierre = { ok: true; id?: string } | { ok: false; status: number; error: string };

/**
 * Cierra `noches` noches de una suite desde `llegada`, como reserva o bloqueo.
 * Todo o nada: si alguna noche ya está ocupada no se escribe ninguna (antes,
 * bloquear escribía encima de lo que hubiera en la celda).
 */
export async function cerrarNoches(input: {
  suite: string;
  llegada: string;
  noches: number;
  tipo: 'reserva' | 'bloqueo';
  canal?: string;
}): Promise<ResultadoCierre> {
  const { suite, llegada, tipo } = input;
  const noches = Math.max(1, Math.min(MAX_NOCHES_PANEL, Math.floor(Number(input.noches) || 1)));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(llegada)) return { ok: false, status: 400, error: 'Fecha de llegada inválida' };
  if (llegada < mexicoTodayStr()) return { ok: false, status: 400, error: 'No se pueden cerrar noches que ya pasaron' };
  const canal = CANALES.includes(input.canal as typeof CANALES[number]) ? input.canal! : 'WhatsApp';

  const client = tipo === 'reserva' ? await asegurarPestana() : await getSheetsClient();
  if (!client || !SHEET_ID) return { ok: false, status: 500, error: 'Sin conexión con Google Sheets' };

  const fechas = Array.from({ length: noches }, (_, i) => sumarDias(llegada, i));
  const salida = sumarDias(llegada, noches);
  const valor = tipo === 'reserva' ? 'RESERVADO' : 'BLOQUEADO';

  return withAvailabilityLock(async (): Promise<ResultadoCierre> => {
    try {
      const res = await sheetsCall(() => client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${MATRIZ}!A:Z` }));
      const filas = res.data.values || [];
      const col = (filas[0] || []).findIndex((h: unknown) => String(h ?? '').trim() === suite);
      if (col === -1) return { ok: false, status: 404, error: 'Habitación no encontrada en Disponibilidad' };

      const celdas: string[] = [];
      for (const f of fechas) {
        const r = filas.findIndex((fila, i) => i > 0 && aISO(fila?.[0]) === f);
        if (r === -1) return { ok: false, status: 404, error: `La fecha ${f} no está en la hoja de disponibilidad` };
        if (!celdaLibre(filas[r][col])) {
          return { ok: false, status: 409, error: `La noche del ${f} ya está ocupada (${String(filas[r][col]).trim()}). No se cerró ninguna noche.` };
        }
        celdas.push(`${MATRIZ}!${letraColumna(col)}${r + 1}`);
      }

      await sheetsCall(() => client.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { valueInputOption: 'USER_ENTERED', data: celdas.map((range) => ({ range, values: [[valor]] })) },
      }));

      if (tipo === 'bloqueo') return { ok: true };

      const id = `CAL-${Date.now().toString(36).toUpperCase()}`;
      await sheetsCall(() => client.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB}!A:H`,
        valueInputOption: 'RAW',
        requestBody: { values: [[new Date().toISOString(), id, suite, llegada, salida, String(noches), canal, 'activa']] },
      }));
      return { ok: true, id };
    } catch (e: any) {
      return { ok: false, status: 500, error: e?.message || 'Error al guardar' };
    }
  });
}

/**
 * Cancela una reserva hecha desde el calendario: libera sus noches (solo las
 * que siguen en RESERVADO, para no borrar algo que se haya escrito encima) y
 * la marca `cancelada`, así deja de contar en la prueba social.
 */
export async function cancelarReservaCalendario(id: string): Promise<ResultadoCierre> {
  const client = await asegurarPestana();
  if (!client) return { ok: false, status: 500, error: 'Sin conexión con Google Sheets' };
  const reserva = (await getReservasCalendario()).find((r) => r.id === id);
  if (!reserva) return { ok: false, status: 404, error: 'No se encontró esa reserva del calendario' };
  if (reserva.estado === 'cancelada') return { ok: true };

  return withAvailabilityLock(async (): Promise<ResultadoCierre> => {
    try {
      const res = await sheetsCall(() => client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${MATRIZ}!A:Z` }));
      const filas = res.data.values || [];
      const col = (filas[0] || []).findIndex((h: unknown) => String(h ?? '').trim() === reserva.suite);
      const data: { range: string; values: string[][] }[] = [];
      if (col !== -1) {
        for (let f = reserva.llegada, guard = 0; f < reserva.salida && guard < 60; f = sumarDias(f, 1), guard++) {
          const r = filas.findIndex((fila, i) => i > 0 && aISO(fila?.[0]) === f);
          if (r !== -1 && String(filas[r][col] ?? '').toUpperCase().trim() === 'RESERVADO') {
            data.push({ range: `${MATRIZ}!${letraColumna(col)}${r + 1}`, values: [['']] });
          }
        }
      }
      if (data.length > 0) {
        await sheetsCall(() => client.spreadsheets.values.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { valueInputOption: 'USER_ENTERED', data },
        }));
      }
      await sheetsCall(() => client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB}!H${reserva.row}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['cancelada']] },
      }));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, status: 500, error: e?.message || 'Error al cancelar' };
    }
  });
}
