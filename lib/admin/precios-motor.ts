/**
 * precios-motor.ts
 * Convierte las REGLAS del dueño en el calendario de factores (hoja PreciosDias).
 *
 * Lo usan el botón "Aplicar mis reglas" del panel y, en la fase 3, el cron
 * diario antes de pedirle su opinión a la IA.
 *
 * Lo que este motor NUNCA pisa:
 *  - las noches del pasado (son el registro de lo que se cobró);
 *  - lo que el dueño fijó a mano (`origen: 'manual'`);
 *  - **cualquier** fila de la IA, aplicada o propuesta: la jerarquía es
 *    manual > IA > reglas, y las reglas llegan a esas noches por el otro camino
 *    (`planificarAjustes` las recalcula desde `factorRegla` cada corrida);
 *
 * Un rechazo NO se conserva: la noche vuelve a las reglas y el "no" vive en el
 * historial (`getRechazosRecientes`).
 */
import { getAjustes, getConfigPrecios, getReglas, escribirAjustes, logHistorial, withPreciosLock, EntradaHistorial, MARCA_RECHAZO } from './precios-sheets';
import { AjusteDia, ConfigPrecios, SenalesDia, factorPorReglas, recortarFactor, sumarDias } from '@/lib/precios';
import { mexicoTodayStr } from '@/lib/date-mx';
import { invalidarCachePrecios } from '@/lib/precios-vigentes';

/** Hasta dónde se calcula el calendario. Un año cubre cualquier reserva real. */
export const DIAS_HORIZONTE = 365;

export interface ResultadoAplicar {
  cambiadas: number;
  conFactor: number;
  /** Noches futuras que las reglas no movieron porque las manda la IA o la mano del dueño. */
  respetadas: number;
  config: ConfigPrecios;
}

function esIntocable(a: AjusteDia, hoy: string): boolean {
  if (a.fecha < hoy) return true;          // el pasado no se reescribe
  if (a.origen === 'manual') return true;  // la mano del dueño gana
  if (a.origen === 'ia') return true;      // jerarquía: la IA gana a las reglas
  return false;
}

/**
 * Recalcula el calendario desde las reglas.
 * `senalesPorFecha` son las señales de demanda por noche (ocupación, días para
 * la llegada). Sin ellas, las reglas de ocupación y última hora no aplican
 * —es a propósito: una regla de ocupación sin datos de ocupación no debe inventar.
 */
export async function aplicarReglas(
  senalesPorFecha: Record<string, SenalesDia> = {},
): Promise<ResultadoAplicar> {
  // Todo el ciclo leer → calcular → escribir va DENTRO del candado. Con el
  // candado solo en la escritura, dos escritores que leyeran a la vez se
  // pisaban entero (`escribirAjustes` reescribe la hoja completa) y el clic
  // más lento ganaba. Por eso aquí no se vuelve a llamar `withPreciosLock`.
  return withPreciosLock(async () => {
    const hoy = mexicoTodayStr();
    const [reglas, previos, config] = await Promise.all([getReglas(), getAjustes(), getConfigPrecios()]);

    const previoPorFecha = new Map(previos.map(a => [a.fecha, a]));
    const conservados = previos.filter(a => esIntocable(a, hoy));
    const fechasConservadas = new Set(conservados.map(a => a.fecha));

    const analizadoEn = new Date().toISOString();
    const nuevos: AjusteDia[] = [...conservados];
    const historial: EntradaHistorial[] = [];

    for (let i = 0; i < DIAS_HORIZONTE; i++) {
      const fecha = sumarDias(hoy, i);
      if (fechasConservadas.has(fecha)) continue;
      const { factor, aplicadas } = factorPorReglas(fecha, reglas, senalesPorFecha[fecha] || {}, config);
      const antes = previoPorFecha.get(fecha)?.factor ?? 1;
      if (factor !== 1) {
        nuevos.push({
          rowIndex: 0,
          fecha,
          factor,
          origen: 'regla',
          motivo: aplicadas.join(' + ') || 'Reglas',
          estado: 'aplicado',
          analizadoEn,
        });
      }
      if (Math.abs(factor - antes) > 0.0001) {
        historial.push({ fecha, factorAnterior: antes, factorNuevo: factor, origen: 'regla', motivo: aplicadas.join(' + ') || 'Sin reglas' });
      }
    }

    await escribirAjustes(nuevos);
    await logHistorial(historial);
    invalidarCachePrecios();

    return {
      cambiadas: historial.length,
      conFactor: nuevos.filter(a => a.fecha >= hoy && a.estado === 'aplicado').length,
      respetadas: conservados.filter(a => a.fecha >= hoy).length,
      config,
    };
  });
}

/** Fija (o borra) el factor de una noche a mano. `factor === 1` quita el ajuste. */
export async function fijarFactorManual(fecha: string, factor: number, motivo: string): Promise<void> {
  await withPreciosLock(async () => {
    const [previos, config] = await Promise.all([getAjustes(), getConfigPrecios()]);
    const recortado = recortarFactor(factor, config);
    const antes = previos.find(a => a.fecha === fecha)?.factor ?? 1;
    const resto = previos.filter(a => a.fecha !== fecha);
    const nuevos = recortado === 1 ? resto : [
      ...resto,
      {
        rowIndex: 0, fecha, factor: recortado, origen: 'manual' as const,
        motivo: motivo || 'Fijado a mano', estado: 'aplicado' as const,
        analizadoEn: new Date().toISOString(),
      },
    ];
    await escribirAjustes(nuevos);
    await logHistorial([{ fecha, factorAnterior: antes, factorNuevo: recortado, origen: 'manual', motivo: motivo || 'Fijado a mano' }]);
    invalidarCachePrecios();
  });
}

/** Aprueba o rechaza propuestas de la IA. Devuelve cuántas se tocaron. */
export async function resolverPropuestas(fechas: string[], aprobar: boolean): Promise<number> {
  if (fechas.length === 0) return 0;
  return withPreciosLock(async () => {
    const objetivo = new Set(fechas);
    const previos = await getAjustes();
    const historial: EntradaHistorial[] = [];
    const nuevos: AjusteDia[] = [];
    for (const a of previos) {
      if (!objetivo.has(a.fecha) || a.estado !== 'propuesto') { nuevos.push(a); continue; }
      if (aprobar) {
        nuevos.push({ ...a, estado: 'aplicado', analizadoEn: new Date().toISOString() });
        // `factorAnterior: 1` es correcto: la hoja guarda UNA fila por noche, y
        // una noche con propuesta pendiente no tiene fila aplicada, así que
        // hasta este clic se estaba cobrando el precio base.
        historial.push({ fecha: a.fecha, factorAnterior: 1, factorNuevo: a.factor, origen: 'ia', motivo: `Aprobado: ${a.motivo}` });
      } else {
        // Rechazada: la fila DESAPARECE del calendario y la noche vuelve a lo que
        // digan las reglas del dueño. El rastro para no re-proponer lo mismo queda
        // en el historial (`getRechazosRecientes`), no aquí: conservando la fila,
        // una noche de Navidad rechazada se iba a precio base en vez de al +15%
        // de su propia temporada.
        historial.push({ fecha: a.fecha, factorAnterior: a.factor, factorNuevo: 1, origen: 'ia', motivo: `${MARCA_RECHAZO} ${a.motivo}` });
      }
    }
    await escribirAjustes(nuevos);
    await logHistorial(historial);
    invalidarCachePrecios();
    return historial.length;
  });
}
