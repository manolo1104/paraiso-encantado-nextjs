// ============================================================
// ENTRE SEMANA — qué noches salen más baratas (lógica pura)
// ============================================================
// Lo usan el calendario de estancia (marca las noches más baratas) y el aviso
// «De lunes a jueves desde $X» (components/EntreSemanaDesde.tsx). Sin «use
// client» a propósito: es lógica pura y la pueden importar cliente y servidor.
//
// 🔴 Aquí NO se calcula ningún precio. Todos salen de `infoNoche`
// (lib/calendario.ts) → `getRoomNightPrice` (lib/booking.ts): el mismo número
// que pinta cada celda del calendario y el mismo que cobra el motor.
// Multiplicar a mano el precio base por el factor daría otro número, porque
// el redondeo a $50 cae distinto en cada suite.
//
// Tampoco hay textos fijos del tipo «entre semana cuesta menos»: los precios
// de lunes a jueves los mueven las reglas y la IA (oct 2026), y pueden dejar
// de ser los más bajos. El aviso y la marca salen solo cuando estos números
// lo dicen.

import { CALENDARIO_DIAS, infoNoche, suitesLibresEnRango, type DatosCalendario, type Grupo } from '@/lib/calendario';
import { BOOKING_ROOMS } from '@/lib/booking';
import { diaSemana, sumarDias } from '@/lib/precios';

/** Noches hacia adelante que mira el aviso: unas 6 semanas. */
export const DIAS_AVISO = 45;

/** El grupo del «Desde $1,500» de la portada: 2 adultos. */
export const GRUPO_AVISO: Grupo = { adultos: 2 };

/**
 * El «desde» de lista de esa noche para el grupo: la suite más barata en la
 * que cabe, sin precios dinámicos y sin mirar la ocupación. Es contra lo que se
 * compara para decir que una noche «sale más barata».
 */
function desdeDeLista(fecha: string, grupo: Grupo, hoy: string): number | undefined {
  return infoNoche({ desde: hoy, libres: null, factores: {} }, fecha, grupo, hoy).desde;
}

/** El «desde» que pinta la celda, solo si esa noche se puede reservar. */
function desdeConLugar(cal: DatosCalendario, fecha: string, grupo: Grupo, hoy: string): number | undefined {
  const info = infoNoche(cal, fecha, grupo, hoy);
  return info.estado === 'libre' || info.estado === 'desconocido' ? info.desde : undefined;
}

function menor(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.min(a, b);
}

/**
 * ¿La celda de esa noche enseña un precio más bajo que el de lista?
 *
 * Se compara contra la suite más barata en la que cabe el grupo, no contra la
 * suite que quedó libre: si esa noche solo queda una Jungla rebajada ($1,850),
 * no se marca, porque no es más barata que el «desde $1,500» de siempre. En
 * modo suite (ficha de una suite) es su propio precio de lista.
 */
export function esNocheMasBarata(cal: DatosCalendario, fecha: string, grupo: Grupo, hoy: string): boolean {
  const desde = desdeConLugar(cal, fecha, grupo, hoy);
  if (desde === undefined) return false;
  // Grupo que cabe en una suite del hotel pero en ninguna LIBRE esa noche: la
  // celda enseña el precio por suite (grupo repartido) y la lista es la de la
  // suite grande. No son comparables: no es una noche «más barata».
  if (cabeEnUnaSuite(grupo) && !cabeEnUnaSuiteLibre(cal, fecha, grupo)) return false;
  const lista = desdeDeLista(fecha, grupo, hoy);
  return lista !== undefined && desde < lista;
}

/** Las noches más baratas entre hoy y `dias` adelante (para marcarlas en el calendario). */
export function nochesMasBaratas(cal: DatosCalendario, grupo: Grupo, hoy: string, dias: number): Set<string> {
  const out = new Set<string>();
  const n = Math.min(Math.max(0, Math.floor(dias)), CALENDARIO_DIAS);
  let f = hoy;
  for (let k = 0; k < n; k++, f = sumarDias(f, 1)) {
    if (esNocheMasBarata(cal, f, grupo, hoy)) out.add(f);
  }
  return out;
}

export interface ResumenEntreSemana {
  /** Precio por noche más bajo de lunes a jueves, en una noche con lugar. */
  semana?: number;
  /** Lo mismo para las noches de viernes y sábado (contra lo que se compara). */
  finde?: number;
  /**
   * true solo si de lunes a jueves sale de verdad más barato: contra viernes y
   * sábado o, si esos ya no tienen lugar en la ventana, contra el precio de lista.
   */
  mostrar: boolean;
}

/**
 * ¿El grupo cabe en UNA suite? Si no (p. ej. 8 personas), el «desde» del
 * calendario es por suite y el aviso diría «desde $1,400 la noche para 8
 * personas» cuando necesitan dos o tres suites: ahí el aviso no sale.
 */
function cabeEnUnaSuite(grupo: Grupo): boolean {
  const personas = Math.max(1, (grupo.adultos || 0) + (grupo.menores || 0));
  return BOOKING_ROOMS.some((r) => !r.disabled && r.maxGuests >= personas);
}

/**
 * ¿Esa noche queda LIBRE alguna suite donde quepa el grupo entero? Si no, el
 * «desde» de infoNoche es por suite (grupo repartido en varias) y no sirve para
 * decir «desde $X la noche para N personas». Sin ocupación (hoja caída) o en
 * modo suite, se da por buena: infoNoche ya usa solo las suites que caben.
 */
function cabeEnUnaSuiteLibre(cal: DatosCalendario, fecha: string, grupo: Grupo): boolean {
  if (grupo.suiteId) return true;
  const libres = suitesLibresEnRango(cal, fecha, sumarDias(fecha, 1));
  if (!libres) return true;
  const personas = Math.max(1, (grupo.adultos || 0) + (grupo.menores || 0));
  return BOOKING_ROOMS.some((r) => !r.disabled && r.maxGuests >= personas && libres.has(r.id));
}

/**
 * Lo que dice el aviso «De lunes a jueves desde $X · viernes y sábado desde $Y».
 * El domingo no cuenta en ninguno de los dos lados.
 */
export function resumenEntreSemana(
  cal: DatosCalendario,
  hoy: string,
  grupo: Grupo = GRUPO_AVISO,
  dias = DIAS_AVISO,
): ResumenEntreSemana {
  if (!cabeEnUnaSuite(grupo)) return { mostrar: false };
  let semana: number | undefined;
  let finde: number | undefined;
  let lista: number | undefined;
  let f = hoy;
  for (let k = 0; k < dias; k++, f = sumarDias(f, 1)) {
    const dow = diaSemana(f);
    const esSemana = dow !== null && dow >= 1 && dow <= 4;
    const esFinde = dow === 5 || dow === 6;
    if (!esSemana && !esFinde) continue;
    const desde = desdeConLugar(cal, f, grupo, hoy);
    if (desde === undefined) continue;
    // El aviso habla de UNA suite: una noche donde el grupo tendría que
    // repartirse no cuenta, ni de lunes a jueves ni en fin de semana.
    if (!cabeEnUnaSuiteLibre(cal, f, grupo)) continue;
    if (esFinde) {
      finde = menor(finde, desde);
    } else {
      semana = menor(semana, desde);
      lista = menor(lista, desdeDeLista(f, grupo, hoy));
    }
  }
  const contra = finde ?? lista;
  // Sin factores (precios caídos o apagados) no hay «entre semana más barato»
  // que anunciar: si sale, sería solo por ocupación, y eso ya lo enseña el calendario.
  const hayPrecios = Object.keys(cal.factores || {}).length > 0;
  return { semana, finde, mostrar: hayPrecios && semana !== undefined && contra !== undefined && semana < contra };
}
