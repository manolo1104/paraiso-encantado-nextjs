/**
 * demanda.ts
 * Las señales de demanda de cada noche, con los datos que el hotel YA tiene.
 *
 * Cinco señales por noche:
 *   ocupacion   — suites cerradas esa noche (hoja Disponibilidad + Reservas), y de
 *                 ellas cuántas son VENTAS, cuántas OTA y cuántas bloqueos
 *   ritmo7d     — reservas que entraron en los últimos 7 días y cubren esa noche
 *   intencion   — carritos abandonados pendientes que pedían esa noche
 *   busquedas7d — búsquedas de huéspedes en la web que incluían esa noche
 *   sinCupo7d   — de esas, cuántas no encontraron lugar porque ESA noche estaba llena
 *
 * Ojo con los KPIs existentes: `calcKPIs` y `calcInsights` cuentan toda la
 * reserva en el mes del check-in. Para precios eso no sirve —una reserva de 3
 * noches ocupa 3 noches— así que aquí se reparte noche por noche.
 */
import { getAllBookings, type AdminBooking } from './sheets-admin';
import { getSheetsClient, sheetsCall } from '@/lib/sheets';
import { getPendingIncomplete, type IncompleteBooking } from '@/lib/abandoned';
import { getBusquedas, type BusquedaFila } from '@/lib/busquedas';
import { BOOKING_ROOMS } from '@/lib/booking';
import { splitRooms } from '@/lib/room-names';
import { parseFechaHojaMx } from '@/lib/date-mx';
import { SenalesDia, sumarDias } from '@/lib/precios';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const AVAILABILITY_SHEET = 'Disponibilidad';
/** Las ventas que el equipo registra desde /admin/calendario (WhatsApp, teléfono, Booking…). */
const RESERVAS_CALENDARIO_SHEET = 'ReservasCalendario';

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
  /** Vendidas + bloqueadas + OTA: lo que ya no se puede vender esa noche. */
  ocupadas: number;
  ocupacionPct: number;
  /**
   * Solo las VENDIDAS: RESERVADO en la matriz (la web, y desde el 12 oct las
   * reservas de WhatsApp/teléfono/Booking capturadas en el calendario), una fila
   * activa de `ReservasCalendario` o una reserva activa en `Reservas`.
   * BLOQUEADO y OTA no cuentan: pueden ser cierres.
   */
  vendidas?: number;
  ventaPct?: number;
  /**
   * Noches retenidas por una OTA («OTA (Expedia)»). Van aparte de los bloqueos
   * porque son otra cosa: el hotel dejó Expedia en ago 2026 y muchas son
   * retenciones viejas, no huéspedes (ver CLAUDE.md, «Channel manager»).
   */
  ota?: number;
  diasParaLlegada: number;
  ritmo7d: number;
  intencion: number;
  busquedas7d: number;
  sinCupo7d: number;
}

/** Celdas de la matriz que significan "esa noche ya no se puede vender". */
function celdaOcupada(valor: unknown): boolean {
  const v = String(valor ?? '').trim().toUpperCase();
  if (!v || v === 'ABIERTO') return false;
  return v === 'RESERVADO' || v === 'BLOQUEADO' || v === 'MANTENIMIENTO' || v.startsWith('OTA');
}

/** Solo una venta: RESERVADO. BLOQUEADO/OTA/MANTENIMIENTO cierran pero no venden. */
function celdaVendida(valor: unknown): boolean {
  return String(valor ?? '').trim().toUpperCase() === 'RESERVADO';
}

function celdaOta(valor: unknown): boolean {
  return String(valor ?? '').trim().toUpperCase().startsWith('OTA');
}

/** Lo que dice la matriz de UNA noche: nombre de la suite (encabezado) → celda. */
export type CeldasNoche = Record<string, string>;

/**
 * Cuenta una noche de la matriz. Función PURA.
 *
 * `vendidasCalendario` son las suites con una fila ACTIVA de ReservasCalendario
 * esa noche: una venta que el equipo registró. Cuenta como venta aunque alguien
 * haya cambiado después la celda a BLOQUEADO, pero solo si la celda sigue
 * cerrada: una celda libre la vende la web, y contarla haría ver lleno un cuarto
 * que se puede vender.
 */
export function contarNoche(
  celdas: CeldasNoche | undefined,
  vendidasCalendario?: Set<string>,
): { ocupadas: number; vendidas: number; ota: number } {
  let ocupadas = 0;
  let vendidas = 0;
  let ota = 0;
  for (const [suite, valor] of Object.entries(celdas ?? {})) {
    if (!celdaOcupada(valor)) continue;
    ocupadas++;
    if (celdaVendida(valor) || vendidasCalendario?.has(suite)) vendidas++;
    else if (celdaOta(valor)) ota++;
  }
  return {
    ocupadas: Math.min(TOTAL_SUITES, ocupadas),
    vendidas: Math.min(TOTAL_SUITES, vendidas),
    ota: Math.min(TOTAL_SUITES, ota),
  };
}

/**
 * La matriz Disponibilidad: fecha → celdas de esa noche.
 *
 * 🔴 Devuelve `null` si no se pudo leer (sin cliente o con error). Antes devolvía
 * un mapa vacío, así que `ocupacionFiable` nunca se enteraba del fallo y la IA
 * analizaba un hotel que solo se VEÍA vacío.
 */
async function leerMatriz(): Promise<Map<string, CeldasNoche> | null> {
  const client = await getSheetsClient();
  if (!client) {
    console.error('[demanda] sin conexión a la hoja: no se pudo leer Disponibilidad');
    return null;
  }
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${AVAILABILITY_SHEET}!A:Z` })
    );
    return matrizDeFilas((res.data.values || []) as unknown[][]);
  } catch (e: any) {
    console.error('[demanda] no se pudo leer Disponibilidad:', e?.message || e);
    return null;
  }
}

/** Las filas crudas de Disponibilidad (con encabezado) → fecha → celdas. Pura. */
export function matrizDeFilas(rows: unknown[][]): Map<string, CeldasNoche> {
  const out = new Map<string, CeldasNoche>();
  if (rows.length < 2) return out;
  const headers = (rows[0] || []).map(h => String(h ?? '').trim());
  // Solo las columnas que de verdad son una suite del hotel (con encabezado).
  const columnas: number[] = [];
  for (let c = 1; c < headers.length; c++) if (headers[c]) columnas.push(c);
  for (const r of rows.slice(1)) {
    const fecha = String(r?.[0] ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) continue;
    const celdas: CeldasNoche = {};
    for (const c of columnas) celdas[headers[c]] = String(r[c] ?? '');
    out.set(fecha, celdas);
  }
  return out;
}

/**
 * Las ventas registradas desde el calendario del panel: fecha → suites.
 * Solo lectura (no crea la pestaña). `null` si no se pudo leer; entonces las
 * ventas salen solo de la matriz, que ya trae esas noches como RESERVADO.
 */
async function leerVentasCalendario(): Promise<Map<string, Set<string>> | null> {
  const client = await getSheetsClient();
  if (!client) return null;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${RESERVAS_CALENDARIO_SHEET}!A:H` })
    );
    return ventasCalendarioDeFilas((res.data.values || []) as unknown[][]);
  } catch (e: any) {
    console.error('[demanda] no se pudo leer ReservasCalendario:', e?.message || e);
    return null;
  }
}

/**
 * Filas crudas de ReservasCalendario (con encabezado) → fecha → suites. Pura.
 * Columnas: Registrada, Id, Suite, Llegada, Salida, Noches, Canal, Estado.
 * Igual que `lib/admin/reservas-calendario.ts`: todo lo que no dice
 * «cancelada» está activo, y una fila sin Id no es una reserva.
 */
export function ventasCalendarioDeFilas(rows: unknown[][]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const r of rows.slice(1)) {
    const id = String(r?.[1] ?? '').trim();
    const suite = String(r?.[2] ?? '').trim();
    const llegada = String(r?.[3] ?? '').trim();
    const salida = String(r?.[4] ?? '').trim();
    if (!id || !suite || String(r?.[7] ?? '').trim() === 'cancelada') continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(llegada) || !/^\d{4}-\d{2}-\d{2}$/.test(salida)) continue;
    for (let f = llegada, guard = 0; f < salida && guard < 60; f = sumarDias(f, 1), guard++) {
      if (!out.has(f)) out.set(f, new Set());
      out.get(f)!.add(suite);
    }
  }
  return out;
}

/**
 * ¿La búsqueda la hizo un huésped? Función PURA.
 *
 * /api/check-availability la llaman cuatro pantallas y solo dos son huéspedes
 * buscando dónde dormir. La ficha de una suite pregunta por UNA suite: si esa
 * está ocupada salía «sin cupo» aunque quedaran 12 libres. Y el panel pregunta
 * al capturar una reserva. Las dos llegaban sin huéspedes ni sesión, y eran el
 * 35% de los «sin cupo» que la IA leía como demanda.
 *
 * Si la búsqueda trae `origen` (cuando /api/check-availability lo guarde), manda
 * ese; sin él, solo cuentan las que traen huéspedes y sesión, que hoy solo las
 * manda /reservar (/habitaciones tampoco los manda: queda fuera hasta que
 * exista `origen`).
 */
export function esBusquedaDeHuesped(b: { huespedes: number; sesion: string; origen?: string }): boolean {
  const origen = String(b.origen ?? '').trim();
  if (origen) return origen === 'reservar' || origen === 'habitaciones';
  return Number(b.huespedes) > 0 && String(b.sesion ?? '').trim() !== '';
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

/** Lo que `calcularSenales` necesita, ya leído. `null` = esa fuente falló. */
export interface FuentesDemanda {
  bookings: AdminBooking[] | null;
  matriz: Map<string, CeldasNoche> | null;
  ventasCalendario: Map<string, Set<string>> | null;
  incompletas: IncompleteBooking[] | null;
  busquedas: (BusquedaFila & { origen?: string })[] | null;
}

/**
 * Las señales de `dias` noches desde `desde`, a partir de lo ya leído. Función
 * PURA (las pruebas y la simulación la usan con la hoja exportada).
 * `ahoraMs` marca el corte de 7 días.
 */
export function calcularSenales(f: FuentesDemanda, desde: string, dias: number, ahoraMs: number): SenalesNoche[] {
  const hace7d = new Date(ahoraMs - 7 * 86400000);

  const activas = (f.bookings ?? []).filter(activa);
  const recientes = activas.filter(b => {
    const creada = parseFechaHojaMx(b.fecha);
    return creada !== null && creada >= hace7d;
  });

  // `timestamp` lo escribe `saveIncompleteBooking` como ISO con valueInputOption
  // RAW, así que `Date.parse` basta. Una fila sin fecha legible se conserva: no
  // vale perder una señal real por una celda rara.
  const corte = hace7d.getTime();
  const incompletasRecientes = (f.incompletas ?? []).filter(inc => {
    const t = Date.parse(inc.timestamp);
    return Number.isFinite(t) ? t >= corte : true;
  });

  // Solo las búsquedas de huéspedes: ni el panel ni la ficha de una suite.
  const busquedas = (f.busquedas ?? []).filter(esBusquedaDeHuesped);

  const out: SenalesNoche[] = [];
  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(desde, i);

    let porReservas = 0;
    for (const b of activas) if (cubre(b.checkin, b.checkout, fecha)) porReservas += cuartosDe(b);

    const enMatriz = contarNoche(f.matriz?.get(fecha), f.ventasCalendario?.get(fecha));
    const ocupadas = Math.min(TOTAL_SUITES, Math.max(enMatriz.ocupadas, porReservas));
    // Una reserva de la web también es RESERVADO en la matriz: el máximo, y no
    // la suma, para no contarla dos veces.
    const vendidas = Math.min(ocupadas, Math.max(enMatriz.vendidas, porReservas));
    const ota = Math.min(enMatriz.ota, ocupadas - vendidas);

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
    for (const bq of busquedas) {
      if (!cubre(bq.checkin, bq.checkout, fecha)) continue;
      busquedas7d++;
      // «Sin cupo» solo en la noche que de verdad estaba LLENA. Una búsqueda del
      // 1 al 3 nov sale sin cupo porque el 1 nov está 13/13, y antes ese «sin
      // cupo» también caía en el 2 nov, que tenía 5 libres: la IA subía el
      // precio de una noche vacía.
      if (bq.sinCupo && ocupadas >= TOTAL_SUITES) sinCupo7d++;
    }

    out.push({
      fecha,
      dow: new Date(`${fecha}T12:00:00`).getDay(),
      ocupadas,
      ocupacionPct: Math.round((ocupadas / TOTAL_SUITES) * 100),
      vendidas,
      ventaPct: Math.round((vendidas / TOTAL_SUITES) * 100),
      ota,
      diasParaLlegada: i,
      ritmo7d,
      intencion,
      busquedas7d,
      sinCupo7d,
    });
  }
  return out;
}

/**
 * Señales de `dias` noches a partir de `desde` (inclusive).
 *
 * 🔴 Un fallo al leer ya NO se degrada a 0 en silencio. Antes los cuatro
 * `.catch(() => [])` no dejaban rastro, y si fallaba la lectura de reservas la
 * ocupación caía a 0: o sea, el hotel se veía vacío por un error de red y la IA
 * bajaba precios por eso. Ahora cada fallo se registra y, si la matriz de
 * ocupación no se pudo leer, `ocupacionFiable` queda en false para que quien
 * decida precios lo sepa y pueda abortar.
 */
export async function construirSenales(desde: string, dias: number): Promise<SenalesNoche[]> {
  const hace7d = new Date(Date.now() - 7 * 86400000);
  const avisar = (que: string) => (e: any) => {
    console.error(`[demanda] no se pudo leer ${que}:`, e?.message || e);
    return null;
  };
  const [bookings, matriz, ventasCalendario, incompletas, busquedas] = await Promise.all([
    getAllBookings().catch(avisar('las reservas')) as Promise<AdminBooking[] | null>,
    leerMatriz().catch(avisar('la matriz de disponibilidad')),
    leerVentasCalendario().catch(avisar('las reservas del calendario')),
    getPendingIncomplete().catch(avisar('los carritos abandonados')),
    getBusquedas(hace7d.toISOString()).catch(avisar('las búsquedas')),
  ]);

  // La fiabilidad la da la MATRIZ: es la única fuente con todo lo que cierra una
  // noche (ventas de la web y de otros canales, bloqueos, OTA). `getAllBookings`
  // no sirve de prueba: si falla devuelve [] igual que una hoja vacía. Antes la
  // condición era «reservas o matriz» y, como ninguna de las dos devolvía null
  // nunca, esto siempre decía true.
  ultimaOcupacionFiable = matriz !== null;

  return calcularSenales({ bookings, matriz, ventasCalendario, incompletas, busquedas }, desde, dias, Date.now());
}

/** El formato que pide `factorPorReglas`: solo lo que las reglas miran. */
export function senalesParaReglas(senales: SenalesNoche[]): Record<string, SenalesDia> {
  const out: Record<string, SenalesDia> = {};
  for (const s of senales) {
    out[s.fecha] = { ocupacionPct: s.ocupacionPct, ventaPct: s.ventaPct, diasParaLlegada: s.diasParaLlegada };
  }
  return out;
}
