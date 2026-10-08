/**
 * demanda.ts
 * Las señales de demanda de cada noche, con los datos que el hotel YA tiene.
 *
 * Cinco señales por noche:
 *   ocupacion   — suites vendidas o bloqueadas esa noche (hoja Disponibilidad + Reservas)
 *   ritmo7d     — reservas que entraron en los últimos 7 días y cubren esa noche
 *   intencion   — carritos abandonados pendientes que pedían esa noche
 *   busquedas7d — búsquedas en /reservar que incluían esa noche
 *   sinCupo7d   — de esas, cuántas no encontraron ni una suite libre
 *
 * Ojo con los KPIs existentes: `calcKPIs` y `calcInsights` cuentan toda la
 * reserva en el mes del check-in. Para precios eso no sirve —una reserva de 3
 * noches ocupa 3 noches— así que aquí se reparte noche por noche.
 */
import { getAllBookings, type AdminBooking } from './sheets-admin';
import { getSheetsClient, sheetsCall } from '@/lib/sheets';
import { getPendingIncomplete } from '@/lib/abandoned';
import { getBusquedas } from '@/lib/busquedas';
import { BOOKING_ROOMS } from '@/lib/booking';
import { splitRooms } from '@/lib/room-names';
import { parseFechaHojaMx } from '@/lib/date-mx';
import { SenalesDia, sumarDias } from '@/lib/precios';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const AVAILABILITY_SHEET = 'Disponibilidad';

export const TOTAL_SUITES = BOOKING_ROOMS.filter(r => !r.disabled).length;

/**
 * ¿La última llamada a `construirSenales` pudo leer la ocupación de verdad?
 *
 * Lo consulta `analizarDemanda` antes de gastar una llamada al modelo: analizar
 * con un hotel falsamente vacío es peor que no analizar.
 */
let ultimaOcupacionFiable = true;
export function ocupacionFiable(): boolean {
  return ultimaOcupacionFiable;
}

export interface SenalesNoche extends SenalesDia {
  fecha: string;
  dow: number;
  ocupadas: number;
  ocupacionPct: number;
  diasParaLlegada: number;
  ritmo7d: number;
  intencion: number;
  busquedas7d: number;
  sinCupo7d: number;
}

/** Celdas de la matriz que significan "esa noche ya no se puede vender". */
function celdaOcupada(valor: string): boolean {
  const v = String(valor || '').trim().toUpperCase();
  if (!v || v === 'ABIERTO') return false;
  return v === 'RESERVADO' || v === 'BLOQUEADO' || v === 'MANTENIMIENTO' || v.startsWith('OTA');
}

/** Suites ocupadas por fecha según la matriz Disponibilidad. */
async function ocupadasPorMatriz(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const client = await getSheetsClient();
  if (!client) return out;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${AVAILABILITY_SHEET}!A:Z` })
    );
    const rows = res.data.values || [];
    if (rows.length < 2) return out;
    const headers = rows[0] as string[];
    // Solo las columnas que de verdad son una suite del hotel.
    const columnas: number[] = [];
    for (let c = 1; c < headers.length; c++) {
      if (String(headers[c] || '').trim()) columnas.push(c);
    }
    for (const r of rows.slice(1)) {
      const fecha = String(r[0] || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) continue;
      let n = 0;
      for (const c of columnas) if (celdaOcupada(r[c])) n++;
      out.set(fecha, Math.min(TOTAL_SUITES, n));
    }
  } catch (e: any) {
    console.error('[demanda] no se pudo leer Disponibilidad:', e?.message || e);
  }
  return out;
}

function activa(b: AdminBooking): boolean {
  return b.estado !== 'CANCELADA';
}

function cubre(checkin: string, checkout: string, fecha: string): boolean {
  return Boolean(checkin) && Boolean(checkout) && checkin <= fecha && fecha < checkout;
}

function cuartosDe(b: AdminBooking): number {
  const n = splitRooms(b.habitaciones || '').length;
  return n > 0 ? n : 1;
}

/**
 * Señales de `dias` noches a partir de `desde` (inclusive).
 *
 * 🔴 Un fallo al leer ya NO se degrada a 0 en silencio. Antes los cuatro
 * `.catch(() => [])` no dejaban rastro, y si fallaba la lectura de reservas la
 * ocupación caía a 0: o sea, el hotel se veía vacío por un error de red y la IA
 * bajaba precios por eso. Ahora cada fallo se registra y, si la fuente de
 * ocupación no se pudo leer, `ocupacionFiable` queda en false para que quien
 * decida precios lo sepa y pueda abortar.
 */
export async function construirSenales(desde: string, dias: number): Promise<SenalesNoche[]> {
  const hace7d = new Date(Date.now() - 7 * 86400000);
  const avisar = (que: string) => (e: any) => {
    console.error(`[demanda] no se pudo leer ${que}:`, e?.message || e);
    return null;
  };
  const [bookings, matriz, incompletas, busquedas] = await Promise.all([
    getAllBookings().catch(avisar('las reservas')) as Promise<AdminBooking[] | null>,
    ocupadasPorMatriz().catch(avisar('la matriz de disponibilidad')),
    getPendingIncomplete().catch(avisar('los carritos abandonados')),
    getBusquedas(hace7d.toISOString()).catch(avisar('las búsquedas')),
  ]);

  // La ocupación sale de dos fuentes; basta una para tener un número usable,
  // pero si las DOS fallaron, cualquier cifra que devolvamos es inventada.
  ultimaOcupacionFiable = bookings !== null || matriz !== null;

  const activas = (bookings ?? []).filter(activa);
  const recientes = activas.filter(b => {
    const creada = parseFechaHojaMx(b.fecha);
    return creada !== null && creada >= hace7d;
  });

  // `timestamp` lo escribe `saveIncompleteBooking` como ISO con valueInputOption
  // RAW, así que `Date.parse` basta. Una fila sin fecha legible se conserva: no
  // vale perder una señal real por una celda rara.
  const corte = hace7d.getTime();
  const incompletasRecientes = (incompletas ?? []).filter(inc => {
    const t = Date.parse(inc.timestamp);
    return Number.isFinite(t) ? t >= corte : true;
  });

  const out: SenalesNoche[] = [];
  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(desde, i);

    let porReservas = 0;
    for (const b of activas) if (cubre(b.checkin, b.checkout, fecha)) porReservas += cuartosDe(b);

    const ocupadas = Math.min(TOTAL_SUITES, Math.max(matriz?.get(fecha) ?? 0, porReservas));

    let ritmo7d = 0;
    for (const b of recientes) if (cubre(b.checkin, b.checkout, fecha)) ritmo7d++;

    // Solo los carritos de los últimos 7 días. `getPendingIncomplete` no caduca
    // nada (un carrito sigue "pendiente" para siempre), así que uno de hace
    // cuatro meses contaba como intención de compra viva para su noche: era la
    // única de las cinco señales sin recorte de recencia.
    let intencion = 0;
    for (const inc of incompletasRecientes) if (cubre(inc.checkin, inc.checkout, fecha)) intencion++;

    let busquedas7d = 0;
    let sinCupo7d = 0;
    for (const bq of busquedas ?? []) {
      if (!cubre(bq.checkin, bq.checkout, fecha)) continue;
      busquedas7d++;
      if (bq.sinCupo) sinCupo7d++;
    }

    out.push({
      fecha,
      dow: new Date(`${fecha}T12:00:00`).getDay(),
      ocupadas,
      ocupacionPct: Math.round((ocupadas / TOTAL_SUITES) * 100),
      diasParaLlegada: i,
      ritmo7d,
      intencion,
      busquedas7d,
      sinCupo7d,
    });
  }
  return out;
}

/** El formato que pide `factorPorReglas`: solo lo que las reglas miran. */
export function senalesParaReglas(senales: SenalesNoche[]): Record<string, SenalesDia> {
  const out: Record<string, SenalesDia> = {};
  for (const s of senales) {
    out[s.fecha] = { ocupacionPct: s.ocupacionPct, diasParaLlegada: s.diasParaLlegada };
  }
  return out;
}
