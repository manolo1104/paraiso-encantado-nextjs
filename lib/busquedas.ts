/**
 * busquedas.ts
 * Registra qué fechas busca la gente en /reservar, y si encontró lugar.
 *
 * Por qué existe: hoy las búsquedas solo se imprimen en el log de Railway y se
 * pierden. Una búsqueda que NO encontró cupo es la señal más honesta de que esa
 * noche se podía vender más caro, y era el único dato de demanda que el hotel no
 * guardaba en ninguna parte.
 *
 * Qué NO se guarda: correo, teléfono, nombre, IP. Solo fechas, cuántas personas
 * y el id de sesión del apartado (que ya se guarda en ReservasIncompletas y
 * sirve para no contar tres veces la misma búsqueda).
 *
 * Se escribe en lotes: /api/check-availability se llama varias veces por
 * búsqueda (reintenta hasta 3 veces) y una fila por llamada quemaría la cuota
 * de Google. Si el proceso se reinicia y se pierde el búfer, no pasa nada: es
 * una señal estadística, no dinero.
 */
import { getSheetsClient, sheetsCall } from '@/lib/sheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const TAB = 'Busquedas';
const HEAD = ['Cuando', 'Checkin', 'Checkout', 'Noches', 'Huespedes', 'SinCupo', 'Sesion'];

const MAX_BUFFER = 20;
const FLUSH_MS = 2 * 60 * 1000;
/** Ventana para considerar que es "la misma" búsqueda y no repetirla. */
const DEDUP_MS = 10 * 60 * 1000;

let buffer: string[][] = [];
let vistos = new Map<string, number>();
let timer: ReturnType<typeof setTimeout> | null = null;
let headerListo = false;

export interface BusquedaRegistro {
  checkin: string;
  checkout: string;
  noches: number;
  huespedes: number;
  sinCupo: boolean;
  sesion: string;
}

export interface BusquedaFila extends BusquedaRegistro {
  cuando: string;
}

async function ensureTab(): Promise<ReturnType<typeof getSheetsClient>> {
  const client = await getSheetsClient();
  if (!client) return null;
  if (headerListo) return client;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!1:1` })
    );
    if (((res.data.values?.[0] || []) as string[]).length < HEAD.length) {
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID, range: `${TAB}!A1`,
          valueInputOption: 'RAW', requestBody: { values: [HEAD] },
        })
      );
    }
  } catch {
    try {
      await sheetsCall(() =>
        client.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
        })
      );
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID, range: `${TAB}!A1`,
          valueInputOption: 'RAW', requestBody: { values: [HEAD] },
        })
      );
    } catch (e: any) {
      console.error('[busquedas] no se pudo crear la pestaña:', e?.message || e);
      return null;
    }
  }
  headerListo = true;
  return client;
}

async function flush(): Promise<void> {
  if (timer) { clearTimeout(timer); timer = null; }
  if (buffer.length === 0) return;
  const lote = buffer;
  buffer = [];
  try {
    const client = await ensureTab();
    if (!client) {
      // El lote se devuelve al buffer. Antes se vaciaba ANTES de llegar aquí, así
      // que un `ensureTab` que devolviera null se comía las búsquedas sin un log:
      // la señal más fuerte del sistema desaparecía y parecía que nadie buscaba.
      buffer = lote.concat(buffer);
      console.error('[busquedas] sin hoja para escribir — el lote se queda en espera:', lote.length);
      return;
    }
    await sheetsCall(() =>
      client.spreadsheets.values.append({
        spreadsheetId: SHEET_ID, range: `${TAB}!A:G`,
        valueInputOption: 'RAW', requestBody: { values: lote },
      })
    );
  } catch (e: any) {
    buffer = lote.concat(buffer);
    console.error('[busquedas] no se pudo guardar el lote, queda en espera:', e?.message || e);
  }
}

/** Nunca lanza ni espera: la búsqueda del huésped no puede depender de esto. */
export function registrarBusqueda(b: BusquedaRegistro): void {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.checkin) || !/^\d{4}-\d{2}-\d{2}$/.test(b.checkout)) return;
    const ahora = Date.now();
    const clave = `${b.sesion}|${b.checkin}|${b.checkout}|${b.sinCupo ? 1 : 0}`;
    const previo = vistos.get(clave);
    if (previo && ahora - previo < DEDUP_MS) return;
    vistos.set(clave, ahora);
    if (vistos.size > 2000) {
      // Poda: no dejar crecer el mapa en un proceso que vive semanas.
      vistos = new Map([...vistos].filter(([, t]) => ahora - t < DEDUP_MS));
    }
    buffer.push([
      new Date().toISOString(),
      b.checkin, b.checkout,
      String(b.noches), String(b.huespedes),
      b.sinCupo ? 'si' : 'no',
      String(b.sesion || '').slice(0, 60),
    ]);
    if (buffer.length >= MAX_BUFFER) { void flush(); return; }
    if (!timer) timer = setTimeout(() => void flush(), FLUSH_MS);
  } catch { /* jamás interrumpir la búsqueda */ }
}

/**
 * Las búsquedas guardadas, opcionalmente desde una fecha ISO.
 *
 * Usa `ensureTab` y no `getSheetsClient` a secas: antes, si la pestaña no
 * existía todavía (se creaba solo al escribir, o sea solo con tráfico real), la
 * lectura lanzaba, el catch devolvía [] sin log y el análisis de demanda veía
 * `busq7d 0 | sincupo7d 0` en las 120 noches — indistinguible de "nadie buscó",
 * cuando el prompt le vende al modelo la búsqueda sin cupo como la mejor razón
 * para subir un precio.
 */
export async function getBusquedas(desdeISO?: string): Promise<BusquedaFila[]> {
  const client = await ensureTab();
  if (!client) return [];
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!A:G` })
    );
    const rows = (res.data.values || []).slice(1);
    return rows
      .filter(r => r[1] && r[2])
      .map(r => ({
        cuando: String(r[0] || ''),
        checkin: String(r[1]),
        checkout: String(r[2]),
        noches: Number(r[3]) || 0,
        huespedes: Number(r[4]) || 0,
        sinCupo: String(r[5]) === 'si',
        sesion: String(r[6] || ''),
      }))
      .filter(b => !desdeISO || b.cuando >= desdeISO);
  } catch (e: any) {
    console.error('[busquedas] no se pudieron leer:', e?.message || e);
    return [];
  }
}
