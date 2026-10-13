// ============================================================
// CALENDARIO DE ESTANCIA — lógica pura (cliente y servidor)
// ============================================================
// El calendario de los buscadores enseña, por noche, si hay lugar y desde
// cuánto. Hasta oct 2026 las fechas se elegían a ciegas con <input type=date>
// y el 43% de las búsquedas terminaba en «Estamos llenos» teniendo noches
// libres a uno o dos días (análisis del 12 oct 2026).
//
// Formato que viaja desde /api/calendario: un número por noche desde `desde`,
// con un bit por suite (bit = id - 1). Bit en 1 = esa suite está libre esa
// noche. Al público solo le llega libre/ocupado: nunca si es reserva, bloqueo
// manual u OTA.
//
// El precio NO se calcula aquí: sale de getRoomNightPrice (lib/booking.ts),
// el mismo que cobra el motor, con los factores de /api/precios.

import { BOOKING_ROOMS, getRoomNightPrice, type BookingRoom, type FactoresPorFecha } from './booking';
import { sumarDias } from './precios';

/** Noches que cubre el calendario a partir de hoy (hora de México). */
export const CALENDARIO_DIAS = 365;
/** Tope de noches de una estancia elegida en el calendario. */
export const MAX_NOCHES = 30;
/** Desde cuántas suites libres se avisa «Quedan N». */
export const UMBRAL_QUEDAN = 3;

export function bitSuite(roomId: number): number {
  return 1 << (roomId - 1);
}

const SUITES_ACTIVAS: BookingRoom[] = BOOKING_ROOMS.filter((r) => !r.disabled);

/** Máscara con todas las suites activas libres. */
export const MASCARA_TODAS = SUITES_ACTIVAS.reduce((m, r) => m | bitSuite(r.id), 0);

export interface DatosCalendario {
  /** Primera noche del arreglo `libres` ('YYYY-MM-DD', hora de México). */
  desde: string;
  /** Una máscara por noche, o null si no se pudo verificar la disponibilidad. */
  libres: number[] | null;
  factores: FactoresPorFecha;
}

export interface Grupo {
  adultos: number;
  menores?: number;
  /** Modo suite: solo cuenta esta suite (página de una suite). */
  suiteId?: number;
}

/**
 * - `libre`: hay lugar para el grupo (en una suite, o repartido en varias).
 * - `lleno`: ninguna suite libre (en modo suite: ESA suite está ocupada).
 * - `sinCupo`: quedan suites, pero no alcanzan para todo el grupo.
 * - `desconocido`: no se pudo leer la hoja; se enseña el precio, nunca «Lleno».
 * - `pasado`: antes de hoy.
 */
export type EstadoNoche = 'libre' | 'lleno' | 'sinCupo' | 'desconocido' | 'pasado';

export interface InfoNoche {
  estado: EstadoNoche;
  /** Precio por noche de la suite libre más barata que cabe (o de ESA suite). */
  desde?: number;
  /** Suites libres esa noche, solo cuando son pocas (≤ UMBRAL_QUEDAN). */
  quedan?: number;
}

/** Días entre dos fechas 'YYYY-MM-DD' (b - a), sin husos horarios. */
export function diasEntre(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

function personas(g: Grupo): number {
  return Math.max(1, (g.adultos || 0) + (g.menores || 0));
}

/** Máscara de la noche, o null si no se sabe (hoja caída o fuera de la ventana). */
function mascara(cal: DatosCalendario, fecha: string): number | null {
  if (!cal.libres) return null;
  const i = diasEntre(cal.desde, fecha);
  if (i < 0 || i >= cal.libres.length) return null;
  return cal.libres[i];
}

function suitesLibres(m: number): BookingRoom[] {
  return SUITES_ACTIVAS.filter((r) => (m & bitSuite(r.id)) !== 0);
}

/** El precio se cobra por adultos (así arma el carrito /reservar); la capacidad cuenta a todos. */
function precioNoche(room: BookingRoom, g: Grupo, fecha: string, factores: FactoresPorFecha): number {
  return getRoomNightPrice(room, Math.max(1, Math.min(g.adultos || 1, room.maxGuests)), fecha, factores);
}

function masBarata(rooms: BookingRoom[], g: Grupo, fecha: string, factores: FactoresPorFecha): number | undefined {
  let min: number | undefined;
  for (const r of rooms) {
    const p = precioNoche(r, g, fecha, factores);
    if (min === undefined || p < min) min = p;
  }
  return min;
}

/** ¿Las suites de la máscara alcanzan para el grupo (en una o repartido)? */
function alcanza(m: number, g: Grupo): boolean {
  if (g.suiteId) {
    const room = SUITES_ACTIVAS.find((r) => r.id === g.suiteId);
    return !!room && (m & bitSuite(room.id)) !== 0;
  }
  const total = suitesLibres(m).reduce((s, r) => s + r.maxGuests, 0);
  return total >= personas(g);
}

export function infoNoche(cal: DatosCalendario, fecha: string, g: Grupo, hoy: string): InfoNoche {
  if (fecha < hoy) return { estado: 'pasado' };
  const m = mascara(cal, fecha);

  if (g.suiteId) {
    const room = SUITES_ACTIVAS.find((r) => r.id === g.suiteId);
    if (!room) return { estado: 'desconocido' };
    const desde = precioNoche(room, g, fecha, cal.factores);
    if (m === null) return { estado: 'desconocido', desde };
    return (m & bitSuite(room.id)) !== 0 ? { estado: 'libre', desde } : { estado: 'lleno' };
  }

  const n = personas(g);
  if (m === null) {
    const caben = SUITES_ACTIVAS.filter((r) => r.maxGuests >= n);
    return { estado: 'desconocido', desde: masBarata(caben.length ? caben : SUITES_ACTIVAS, g, fecha, cal.factores) };
  }
  const libres = suitesLibres(m);
  if (libres.length === 0) return { estado: 'lleno' };
  if (!alcanza(m, g)) return { estado: 'sinCupo' };
  const caben = libres.filter((r) => r.maxGuests >= n);
  return {
    estado: 'libre',
    // Si ninguna suite sola alcanza (grupo grande repartido), el «desde» es por suite.
    desde: masBarata(caben.length ? caben : libres, g, fecha, cal.factores),
    quedan: libres.length <= UMBRAL_QUEDAN ? libres.length : undefined,
  };
}

/** ¿Se puede LLEGAR esa noche? (Una noche llena sí puede ser día de salida.) */
export function sePuedeLlegar(cal: DatosCalendario, fecha: string, g: Grupo, hoy: string): boolean {
  const e = infoNoche(cal, fecha, g, hoy).estado;
  return e === 'libre' || e === 'desconocido';
}

/**
 * Última fecha de SALIDA posible llegando en `checkin`: se recorren las noches
 * cruzando las máscaras, porque el grupo tiene que poder quedarse en las mismas
 * suites todas las noches. Devuelve `checkin` si ni siquiera se puede llegar.
 */
export function limiteSalida(cal: DatosCalendario, checkin: string, g: Grupo, hoy: string, maxNoches = MAX_NOCHES): string {
  if (!sePuedeLlegar(cal, checkin, g, hoy)) return checkin;
  let corriendo = MASCARA_TODAS;
  let salida = checkin;
  for (let k = 0; k < maxNoches; k++) {
    const noche = sumarDias(checkin, k);
    const m = mascara(cal, noche);
    if (m !== null) {
      corriendo &= m;
      if (!alcanza(corriendo, g)) break;
    } else if (cal.libres && diasEntre(cal.desde, noche) >= cal.libres.length) {
      break; // fuera de la ventana conocida
    }
    salida = sumarDias(noche, 1);
  }
  return salida;
}

/**
 * Precio total más bajo de la estancia en UNA suite libre todas las noches
 * (la que se enseña en «3 noches · desde $5,550»). undefined si el grupo no cabe
 * en una sola suite o si no hay ninguna libre todo el rango.
 */
export function desdeEstancia(cal: DatosCalendario, checkin: string, checkout: string, g: Grupo): number | undefined {
  const noches = diasEntre(checkin, checkout);
  if (noches <= 0) return undefined;
  let m = MASCARA_TODAS;
  for (let k = 0; k < noches; k++) {
    const mk = mascara(cal, sumarDias(checkin, k));
    if (mk !== null) m &= mk;
  }
  const n = personas(g);
  const candidatas = g.suiteId
    ? SUITES_ACTIVAS.filter((r) => r.id === g.suiteId && (m & bitSuite(r.id)) !== 0)
    : suitesLibres(m).filter((r) => r.maxGuests >= n);
  let min: number | undefined;
  for (const r of candidatas) {
    let total = 0;
    for (let k = 0; k < noches; k++) total += precioNoche(r, g, sumarDias(checkin, k), cal.factores);
    if (min === undefined || total < min) min = total;
  }
  return min;
}

export interface Alternativa {
  checkin: string;
  checkout: string;
  desde?: number;
}

/**
 * Rangos con lugar del mismo largo, lo más cerca posible de lo que pidió
 * (±1, ±2… hasta ±7 días). Es lo que se ofrece en «Estamos llenos»: el 12 oct
 * 2026, las 20 sesiones que nunca vieron un cuarto libre tenían noches libres
 * a 3 días o menos.
 */
export function alternativas(cal: DatosCalendario, checkin: string, noches: number, g: Grupo, hoy: string, max = 4): Alternativa[] {
  if (!cal.libres || noches <= 0) return [];
  const out: Alternativa[] = [];
  for (let d = 1; d <= 7 && out.length < max; d++) {
    for (const off of [d, -d]) {
      if (out.length >= max) break;
      const ci = sumarDias(checkin, off);
      if (ci < hoy) continue;
      const co = sumarDias(ci, noches);
      if (limiteSalida(cal, ci, g, hoy, noches) < co) continue;
      out.push({ checkin: ci, checkout: co, desde: desdeEstancia(cal, ci, co, g) });
    }
  }
  return out.sort((a, b) => a.checkin.localeCompare(b.checkin));
}

/**
 * Suites libres TODO el rango (para /habitaciones y el modo suite). Con la hoja
 * caída devuelve null: quien llama decide (normalmente preguntarle al servidor).
 */
export function suitesLibresEnRango(cal: DatosCalendario, checkin: string, checkout: string): Set<number> | null {
  if (!cal.libres) return null;
  const noches = diasEntre(checkin, checkout);
  let m = MASCARA_TODAS;
  for (let k = 0; k < noches; k++) {
    const mk = mascara(cal, sumarDias(checkin, k));
    if (mk === null) return null;
    m &= mk;
  }
  return new Set(suitesLibres(m).map((r) => r.id));
}
