/**
 * precios-sheets.ts
 * Las hojas de los precios dinámicos. Tres pestañas nuevas + 4 llaves en Config.
 *
 *   PreciosReglas     — lo que el dueño configura (temporadas, finde, ocupación, última hora)
 *   PreciosDias       — el calendario: un factor por noche, con su origen y estado
 *   PreciosHistorial  — append-only, para poder contestar "¿esto sirvió?" en 3 meses
 *
 * Reglas de la casa que se respetan aquí:
 * - Toda llamada va envuelta en `sheetsCall()` (10 s de tope + reinicia el
 *   cliente si Google revoca el token).
 * - NUNCA clear(hoja) antes de escribir: esa ventana vacía es el bug documentado
 *   en lib/sheets.ts:14-25. Se sobrescribe en sitio y solo se limpia la cola.
 * - Lectura que falla devuelve vacío: sin factores, el motor cobra el precio base.
 */
import { getSheetsClient, sheetsCall } from '@/lib/sheets';
import { parseFechaHojaMx, toMexicoDateStr } from '@/lib/date-mx';
import {
  AjusteDia, ConfigPrecios, CONFIG_PRECIOS_DEFAULT, DIAS_RECHAZO_VIGENTE, OrigenPrecio, EstadoAjuste,
  ReglaPrecio, TipoRegla, factorSeguro,
} from '@/lib/precios';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const CONFIG_SHEET = 'Config';
const TAB_REGLAS = 'PreciosReglas';
const TAB_DIAS = 'PreciosDias';
const TAB_HIST = 'PreciosHistorial';

const HEAD_REGLAS = ['Id', 'Nombre', 'Tipo', 'Desde', 'Hasta', 'Dias', 'Umbral', 'Pct', 'Prioridad', 'Activa'];
const HEAD_DIAS = ['Fecha', 'Factor', 'Origen', 'Motivo', 'Estado', 'AnalizadoEn'];
const HEAD_HIST = ['Cuando', 'Fecha', 'FactorAnterior', 'FactorNuevo', 'Origen', 'Motivo'];

type Client = NonNullable<Awaited<ReturnType<typeof getSheetsClient>>>;

// ── Serialización de escrituras ───────────────────────────
// Mismo motivo que `withAvailabilityLock` en lib/sheets.ts: Railway corre UNA
// réplica, así que una cadena de promesas en memoria basta para que el cron y
// un clic del panel no se pisen al reescribir el calendario.
let cadenaPrecios: Promise<unknown> = Promise.resolve();
export function withPreciosLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = cadenaPrecios.then(fn, fn);
  cadenaPrecios = run.then(() => {}, () => {});
  return run as Promise<T>;
}

/**
 * Crea la pestaña si no existe y COMPLETA el encabezado si le faltan columnas
 * (variante de lib/email-tracking.ts: al crecer el esquema, los datos nuevos
 * caían en columnas sin nombre).
 */
async function ensureTab(client: Client, title: string, headers: string[]): Promise<void> {
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${title}!1:1` })
    );
    const actuales = (res.data.values?.[0] || []) as string[];
    if (actuales.length < headers.length) {
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${title}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [headers] },
        })
      );
    }
  } catch {
    try {
      await sheetsCall(() =>
        client.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { requests: [{ addSheet: { properties: { title } } }] },
        })
      );
    } catch { /* otra corrida la creó primero */ }
    await sheetsCall(() =>
      client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      })
    ).catch(() => {});
  }
}

// ── Config (interruptor maestro, piso, techo, banda) ──────

const LLAVES: Record<keyof ConfigPrecios, string> = {
  activo: 'precios_activo',
  pisoPct: 'precios_piso_pct',
  techoPct: 'precios_techo_pct',
  bandaAutoPct: 'precios_banda_pct',
};

export async function getConfigPrecios(): Promise<ConfigPrecios> {
  const client = await getSheetsClient();
  if (!client) return CONFIG_PRECIOS_DEFAULT;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${CONFIG_SHEET}!A:B` })
    );
    const rows = res.data.values || [];
    const leer = (llave: string): string | undefined => rows.find(r => r[0] === llave)?.[1];
    const num = (llave: string, def: number): number => {
      const n = Number(leer(llave));
      return Number.isFinite(n) ? n : def;
    };
    return {
      // Apagado por omisión: si la llave no existe todavía, el sitio cobra lo de siempre.
      // Se aceptan TRUE/1/sí porque la celda se edita a mano en Google Sheets y
      // un `TRUE` (que es lo que pone la hoja al marcar una casilla) apagaba
      // todo el sistema en silencio cuando aquí se exigía la cadena 'true'.
      activo: /^(true|1|si|sí|verdadero)$/i.test(String(leer(LLAVES.activo) ?? '').trim()),
      pisoPct: num(LLAVES.pisoPct, CONFIG_PRECIOS_DEFAULT.pisoPct),
      techoPct: num(LLAVES.techoPct, CONFIG_PRECIOS_DEFAULT.techoPct),
      bandaAutoPct: num(LLAVES.bandaAutoPct, CONFIG_PRECIOS_DEFAULT.bandaAutoPct),
    };
  } catch {
    return CONFIG_PRECIOS_DEFAULT;
  }
}

export async function setConfigPrecios(cambios: Partial<ConfigPrecios>): Promise<void> {
  const client = await getSheetsClient();
  if (!client) throw new Error('Sin conexión a la hoja: no se pudo guardar la configuración');
  const entradas = (Object.keys(cambios) as (keyof ConfigPrecios)[])
    .filter(k => cambios[k] !== undefined)
    .map(k => ({ llave: LLAVES[k], valor: String(cambios[k]) }));
  if (entradas.length === 0) return;
  await withPreciosLock(async () => {
    try {
      const res = await sheetsCall(() =>
        client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${CONFIG_SHEET}!A:A` })
      );
      const rows = res.data.values || [];
      const updates: { range: string; values: string[][] }[] = [];
      const nuevas: string[][] = [];
      for (const { llave, valor } of entradas) {
        const idx = rows.findIndex(r => r[0] === llave);
        if (idx >= 0) updates.push({ range: `${CONFIG_SHEET}!B${idx + 1}`, values: [[valor]] });
        else nuevas.push([llave, valor]);
      }
      if (updates.length) {
        await sheetsCall(() =>
          client.spreadsheets.values.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { valueInputOption: 'RAW', data: updates },
          })
        );
      }
      if (nuevas.length) {
        await sheetsCall(() =>
          client.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${CONFIG_SHEET}!A:B`,
            valueInputOption: 'RAW',
            requestBody: { values: nuevas },
          })
        );
      }
    } catch (e: any) {
      // Se RE-LANZA a propósito. Antes se tragaba el error, el PATCH respondía
      // 200 y el panel pintaba "ENCENDIDOS" mientras la hoja seguía apagada.
      console.error('[precios] setConfigPrecios:', e?.message || e);
      throw e;
    }
  });
}

// ── Marca de la última corrida diaria ─────────────────────

const LLAVE_ULTIMA_CORRIDA = 'precios_ultima_corrida';

/**
 * 'YYYY-MM-DD' (hora de México) de la última corrida automática, o '' si nunca.
 *
 * Vive en la hoja y no en memoria porque el scheduler guardaba la marca en una
 * variable del proceso: cada reinicio (un deploy, un crash, los reintentos de
 * Railway) la ponía en null y 90 s después volvía a correr el análisis completo
 * —otra llamada al modelo y otra reescritura del calendario— sin que nada lo
 * delatara. Tres deploys en una tarde eran tres corridas.
 */
export async function getUltimaCorrida(): Promise<string> {
  const client = await getSheetsClient();
  if (!client) return '';
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${CONFIG_SHEET}!A:B` })
    );
    const fila = (res.data.values || []).find(r => r[0] === LLAVE_ULTIMA_CORRIDA);
    return String(fila?.[1] || '').trim();
  } catch (e: any) {
    console.error('[precios] getUltimaCorrida:', e?.message || e);
    return '';
  }
}

/** Deja escrito que el día `fecha` ya se analizó. Un fallo aquí no tumba la corrida. */
export async function marcarCorrida(fecha: string): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await withPreciosLock(async () => {
    try {
      const res = await sheetsCall(() =>
        client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${CONFIG_SHEET}!A:A` })
      );
      const rows = res.data.values || [];
      const idx = rows.findIndex(r => r[0] === LLAVE_ULTIMA_CORRIDA);
      if (idx >= 0) {
        await sheetsCall(() =>
          client.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${CONFIG_SHEET}!B${idx + 1}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[fecha]] },
          })
        );
      } else {
        await sheetsCall(() =>
          client.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${CONFIG_SHEET}!A:B`,
            valueInputOption: 'RAW',
            requestBody: { values: [[LLAVE_ULTIMA_CORRIDA, fecha]] },
          })
        );
      }
    } catch (e: any) {
      // Peor caso si falla: mañana corre dos veces. No vale tumbar el análisis.
      console.error('[precios] marcarCorrida:', e?.message || e);
    }
  });
}

// ── Reglas ────────────────────────────────────────────────

const TIPOS: TipoRegla[] = ['temporada', 'finde', 'ocupacion', 'ultimahora'];

/**
 * Normaliza la fecha de una regla a 'YYYY-MM-DD'.
 *
 * El motor compara las temporadas como TEXTO (`fecha >= desde`), así que una
 * celda que Google Sheets reformateó a `24/12/2026` o a `jueves, 24 de
 * diciembre de 2026` deja la temporada muda: no aplica y no hay ni un error.
 * `parseFechaHojaMx` ya sabe leer los tres formatos que devuelve la hoja.
 */
function fechaReglaIso(raw: unknown): string {
  const texto = String(raw ?? '').trim();
  if (!texto) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const d = parseFechaHojaMx(texto);
  if (!d) {
    console.warn('[precios] fecha de regla ilegible, la temporada no va a aplicar:', texto);
    return '';
  }
  return toMexicoDateStr(d);
}

function parseDias(raw: string): number[] {
  return String(raw || '')
    .split(/[,\s]+/)
    .map(n => parseInt(n, 10))
    .filter(n => Number.isFinite(n) && n >= 0 && n <= 6);
}

export async function getReglas(): Promise<ReglaPrecio[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureTab(client, TAB_REGLAS, HEAD_REGLAS);
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_REGLAS}!A:J` })
    );
    const rows = (res.data.values || []).slice(1);
    return rows
      // El rowIndex se calcula ANTES de filtrar. Al revés —filtrar y luego
      // numerar— una sola fila en blanco o sin Id corre todos los índices, y
      // entonces `saveRegla` edita y `deleteRegla` BORRA la regla equivocada.
      .map((r, i) => ({ r, rowIndex: i + 2 }))
      .filter(({ r }) => r[0])
      .map(({ r, rowIndex }) => ({
        rowIndex,
        id: String(r[0]),
        nombre: String(r[1] || 'Sin nombre'),
        tipo: (TIPOS.includes(r[2] as TipoRegla) ? r[2] : 'temporada') as TipoRegla,
        desde: fechaReglaIso(r[3]),
        hasta: fechaReglaIso(r[4]),
        dias: parseDias(r[5]),
        umbral: Number(r[6]) || 0,
        pct: Number(r[7]) || 0,
        prioridad: Number(r[8]) || 1,
        activa: String(r[9]) !== 'false',
      }));
  } catch {
    return [];
  }
}

export type ReglaNueva = Omit<ReglaPrecio, 'rowIndex' | 'id'> & { id?: string };

function filaDeRegla(r: ReglaPrecio | (ReglaNueva & { id: string })): string[] {
  return [
    r.id, r.nombre, r.tipo, r.desde || '', r.hasta || '',
    (r.dias || []).join(','), String(r.umbral ?? 0), String(r.pct ?? 0),
    String(r.prioridad ?? 1), String(r.activa !== false),
  ];
}

/** Alta o edición de una regla. Devuelve su id. */
export async function saveRegla(regla: ReglaNueva): Promise<string> {
  const client = await getSheetsClient();
  if (!client) throw new Error('Sin conexión a la hoja');
  await ensureTab(client, TAB_REGLAS, HEAD_REGLAS);
  const id = regla.id || `R-${Date.now().toString(36).toUpperCase()}`;
  const fila = filaDeRegla({ ...regla, id });
  return withPreciosLock(async () => {
    const existentes = await getReglas();
    const previa = existentes.find(r => r.id === id);
    if (previa) {
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${TAB_REGLAS}!A${previa.rowIndex}:J${previa.rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: { values: [fila] },
        })
      );
    } else {
      await sheetsCall(() =>
        client.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${TAB_REGLAS}!A:J`,
          valueInputOption: 'RAW',
          requestBody: { values: [fila] },
        })
      );
    }
    return id;
  });
}

/**
 * Siembra (o re-siembra) un lote de reglas con id fijo en UNA pasada.
 *
 * `saveRegla` en bucle haría una lectura completa de la hoja y un candado por
 * regla: con 17 reglas son 34 llamadas a Google y medio minuto de espera. Aquí
 * se lee una vez y se escribe en dos llamadas. Es idempotente por el id: volver
 * a sembrar actualiza las filas que ya existen y no duplica nada.
 */
export async function sembrarReglas(
  reglas: (ReglaNueva & { id: string })[],
): Promise<{ creadas: number; actualizadas: number }> {
  const client = await getSheetsClient();
  if (!client) throw new Error('Sin conexión a la hoja');
  await ensureTab(client, TAB_REGLAS, HEAD_REGLAS);
  return withPreciosLock(async () => {
    const existentes = await getReglas();
    const porId = new Map(existentes.map(r => [r.id, r]));
    const updates: { range: string; values: string[][] }[] = [];
    const nuevas: string[][] = [];

    for (const regla of reglas) {
      const fila = filaDeRegla(regla);
      const previa = porId.get(regla.id);
      if (previa) updates.push({ range: `${TAB_REGLAS}!A${previa.rowIndex}:J${previa.rowIndex}`, values: [fila] });
      else nuevas.push(fila);
    }

    if (updates.length) {
      await sheetsCall(() =>
        client.spreadsheets.values.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { valueInputOption: 'RAW', data: updates },
        })
      );
    }
    if (nuevas.length) {
      await sheetsCall(() =>
        client.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${TAB_REGLAS}!A:J`,
          valueInputOption: 'RAW',
          requestBody: { values: nuevas },
        })
      );
    }
    return { creadas: nuevas.length, actualizadas: updates.length };
  });
}

export async function deleteRegla(id: string): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await withPreciosLock(async () => {
    const reglas = await getReglas();
    const regla = reglas.find(r => r.id === id);
    if (!regla) return;
    const meta = await sheetsCall(() => client.spreadsheets.get({ spreadsheetId: SHEET_ID }));
    const sheetId = meta.data.sheets?.find(s => s.properties?.title === TAB_REGLAS)?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) return;
    await sheetsCall(() =>
      client.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              // rowIndex es 1-based (fila de la hoja); deleteDimension es 0-based.
              range: { sheetId, dimension: 'ROWS', startIndex: regla.rowIndex - 1, endIndex: regla.rowIndex },
            },
          }],
        },
      })
    );
  });
}

// ── Calendario (PreciosDias) ──────────────────────────────

const ESTADOS: EstadoAjuste[] = ['aplicado', 'propuesto', 'rechazado'];
const ORIGENES: OrigenPrecio[] = ['regla', 'ia', 'manual'];

/** Todo el calendario guardado. `desde` recorta el pasado (opcional). */
export async function getAjustes(desde?: string, hasta?: string): Promise<AjusteDia[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureTab(client, TAB_DIAS, HEAD_DIAS);
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_DIAS}!A:F` })
    );
    const rows = (res.data.values || []).slice(1);
    return rows
      .filter(r => /^\d{4}-\d{2}-\d{2}$/.test(String(r[0] || '')))
      .map((r, i) => ({
        rowIndex: i + 2,
        fecha: String(r[0]),
        factor: factorSeguro(r[1]),
        origen: (ORIGENES.includes(r[2] as OrigenPrecio) ? r[2] : 'regla') as OrigenPrecio,
        motivo: String(r[3] || ''),
        estado: (ESTADOS.includes(r[4] as EstadoAjuste) ? r[4] : 'aplicado') as EstadoAjuste,
        analizadoEn: String(r[5] || ''),
      }))
      .filter(a => (!desde || a.fecha >= desde) && (!hasta || a.fecha <= hasta));
  } catch {
    return [];
  }
}

/**
 * Reescribe el calendario completo en UNA llamada.
 *
 * Sobrescribe en sitio (`update` desde A1) y solo limpia la cola si la hoja
 * quedó más corta — nunca `clear` primero. Es el mismo patrón de `blockDates`
 * en lib/sheets.ts:783-802, y es lo que permite escribir 120 noches sin
 * quemar la cuota de Google ni abrir una ventana vacía.
 */
export async function escribirAjustes(ajustes: AjusteDia[]): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await ensureTab(client, TAB_DIAS, HEAD_DIAS);
  const ordenados = [...ajustes].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const filas = [
    HEAD_DIAS,
    ...ordenados.map(a => [
      a.fecha, String(a.factor), a.origen, a.motivo || '', a.estado, a.analizadoEn || '',
    ]),
  ];
  try {
    const previo = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_DIAS}!A:A` })
    );
    const previoFilas = (previo.data.values || []).length;
    await sheetsCall(() =>
      client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_DIAS}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: filas },
      })
    );
    if (previoFilas > filas.length) {
      await sheetsCall(() =>
        client.spreadsheets.values.clear({
          spreadsheetId: SHEET_ID,
          range: `${TAB_DIAS}!A${filas.length + 1}:F${previoFilas}`,
        })
      );
    }
  } catch (e: any) {
    console.error('[precios] escribirAjustes:', e?.message || e);
    throw e;
  }
}

// ── Historial ─────────────────────────────────────────────

export interface EntradaHistorial {
  fecha: string;
  factorAnterior: number;
  factorNuevo: number;
  origen: OrigenPrecio;
  motivo: string;
}

/** Append-only. Varias filas en una sola llamada. */
export async function logHistorial(entradas: EntradaHistorial[]): Promise<void> {
  if (entradas.length === 0) return;
  const client = await getSheetsClient();
  if (!client) return;
  await ensureTab(client, TAB_HIST, HEAD_HIST);
  const cuando = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
  try {
    await sheetsCall(() =>
      client.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB_HIST}!A:F`,
        valueInputOption: 'RAW',
        requestBody: {
          values: entradas.map(e => [
            cuando, e.fecha, String(e.factorAnterior), String(e.factorNuevo), e.origen, e.motivo || '',
          ]),
        },
      })
    );
  } catch (e: any) {
    // El historial es para auditoría: que falle no debe tumbar un cambio de precio.
    console.error('[precios] logHistorial:', e?.message || e);
  }
}

/** Prefijo con el que `resolverPropuestas` marca un rechazo en el historial. */
export const MARCA_RECHAZO = 'Rechazado:';

/**
 * Las propuestas que el dueño rechazó en los últimos `dias`, fecha → factor.
 *
 * La memoria de los rechazos vive en el HISTORIAL, no en `PreciosDias`. Guardarla
 * en el calendario obligaba a conservar una fila por noche rechazada, y esa fila
 * no cobra nada: una noche de Navidad cuya propuesta él rechazara se iba a precio
 * base en vez de a su propia regla de +15%. Rechazar la opinión de la IA no puede
 * borrarle al dueño su temporada.
 */
export async function getRechazosRecientes(dias = DIAS_RECHAZO_VIGENTE): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const client = await getSheetsClient();
  if (!client) return out;
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_HIST}!A:F` })
    );
    const corte = Date.now() - dias * 86400000;
    for (const r of (res.data.values || []).slice(1)) {
      if (!r[1] || !String(r[5] || '').startsWith(MARCA_RECHAZO)) continue;
      const cuando = parseFechaHojaMx(String(r[0] || ''));
      if (cuando && cuando.getTime() < corte) continue;
      // `factorAnterior` es el valor que se rechazó (lo escribe resolverPropuestas).
      const factor = Number(r[2]);
      if (Number.isFinite(factor)) out.set(String(r[1]), factor);
    }
  } catch (e: any) {
    console.error('[precios] getRechazosRecientes:', e?.message || e);
  }
  return out;
}

export async function getHistorial(limite = 100): Promise<(EntradaHistorial & { cuando: string })[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_HIST}!A:F` })
    );
    const rows = (res.data.values || []).slice(1);
    return rows
      .filter(r => r[1])
      .map(r => ({
        cuando: String(r[0] || ''),
        fecha: String(r[1]),
        factorAnterior: Number(r[2]) || 1,
        factorNuevo: Number(r[3]) || 1,
        origen: (ORIGENES.includes(r[4] as OrigenPrecio) ? r[4] : 'manual') as OrigenPrecio,
        motivo: String(r[5] || ''),
      }))
      .reverse()
      .slice(0, limite);
  } catch {
    return [];
  }
}
