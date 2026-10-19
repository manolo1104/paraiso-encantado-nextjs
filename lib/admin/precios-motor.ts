/**
 * precios-motor.ts
 * Convierte las REGLAS del dueño en el calendario de factores (hoja PreciosDias).
 *
 * Lo usan el botón "Aplicar mis reglas" del panel y, en la fase 3, el cron
 * diario antes de pedirle su opinión a la IA.
 *
 * Lo que este motor NUNCA pisa:
 *  - las noches del pasado (son el registro de lo que se cobró);
 *  - lo que el dueño fijó a mano (`origen: 'manual'`), y desde oct 2026 también
 *    lo que APROBÓ de la IA, que queda como fila manual «Aprobado: …»;
 *  - las filas de la IA, aplicadas o propuestas: la jerarquía es manual > IA >
 *    reglas, y las reglas llegan a esas noches por el otro camino
 *    (`planificarAjustes` las recalcula desde `factorRegla` cada corrida). A una
 *    propuesta pendiente solo le pone al día `factorVigente`: la regla que esa
 *    noche cobra mientras el dueño decide.
 *    🔴 Única excepción (17 oct 2026): con `iaSubeEntreSemana` apagado, una fila
 *    APLICADA de la IA que sube una noche protegida (`nocheProtegida`) no se
 *    conserva: es justo lo que el freno prohíbe, y si no, seguía cobrándose
 *    hasta la siguiente corrida buena de la IA.
 *
 * Un rechazo NO se conserva: la noche vuelve a las reglas en ese mismo clic y el
 * "no" vive en el historial (`getRechazosRecientes`).
 *
 * 🔴 Todo lo que aquí escribe lee la hoja con las versiones `…Estricto`: si
 * Google falla al leer, la escritura no ocurre. Antes una lectura fallida era
 * «el calendario está vacío» y `escribirAjustes`, que reescribe la hoja entera,
 * borraba lo fijado a mano, lo de la IA y el registro de lo cobrado.
 */
import {
  getAjustesEstricto, getConfigPreciosEstricto, getReglasEstricto,
  escribirAjustes, logHistorial, withPreciosLock, EntradaHistorial, MARCA_RECHAZO,
} from './precios-sheets';
import {
  AjusteDia, ConfigPrecios, MARCA_APROBADO, MARCA_VUELVE_A_REGLAS, RAZON_FRENO_SEMANA, ReglaPrecio, SenalesDia,
  factorPorReglas, factoresAplicados, nocheProtegida, recortarFactor, sumarDias,
} from '@/lib/precios';
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
  if (a.origen === 'manual') return true;  // la mano del dueño gana (y lo que aprobó)
  if (a.origen === 'ia') return true;      // jerarquía: la IA gana a las reglas
  return false;
}

/** La fila sin `factorVigente`, que solo tiene sentido en una propuesta pendiente. */
function sinVigente(a: AjusteDia): AjusteDia {
  const copia = { ...a };
  delete copia.factorVigente;
  return copia;
}

export interface EntradaReglas {
  previos: AjusteDia[];
  reglas: ReglaPrecio[];
  config: ConfigPrecios;
  senalesPorFecha: Record<string, SenalesDia>;
  hoy: string;
  /** Instante en ISO (el `analizadoEn` de las filas nuevas): dato, no reloj. */
  ahora: string;
}

export interface PlanReglas {
  nuevos: AjusteDia[];
  historial: EntradaHistorial[];
  /** Las filas que las reglas no reescribieron (pasado, mano del dueño, IA). */
  conservados: AjusteDia[];
}

/**
 * La parte PURA de `aplicarReglas`: qué calendario queda y qué va al historial.
 * Sin Sheets, para poder probarla y simularla con la hoja exportada.
 */
export function planificarReglas(e: EntradaReglas): PlanReglas {
  const { previos, reglas, config, senalesPorFecha, hoy, ahora } = e;
  const previoPorFecha = new Map(previos.map(a => [a.fecha, a]));
  const historial: EntradaHistorial[] = [];

  // El freno de semana también aquí: una fila aplicada de la IA por ENCIMA de la
  // regla en una noche protegida no se conserva y la noche vuelve a su regla
  // (la escribió el código de antes del freno, o la IA con el interruptor
  // encendido). Sin esto, «Recalcular el calendario» no la tocaba y, si ese día
  // fallaba la IA, se seguía cobrando.
  const contraElFreno = new Set(
    config.iaSubeEntreSemana ? [] : previos.filter(a => {
      if (a.fecha < hoy || a.origen !== 'ia' || a.estado !== 'aplicado') return false;
      const r = factorPorReglas(a.fecha, reglas, senalesPorFecha[a.fecha] || {}, config);
      return nocheProtegida(a.fecha, r) && a.factor > r.factor + 1e-9;
    }).map(a => a.fecha),
  );

  // Una propuesta pendiente se conserva, pero cobra la regla de HOY mientras
  // espera: si el dueño acaba de cambiar su regla, se refresca aquí mismo. Que
  // cambie lo cobrado va al historial (la primera corrida tras oct 2026 pasa
  // de precio de lista a la regla las propuestas que ya esperaban).
  const conservados = previos.filter(a => esIntocable(a, hoy) && !contraElFreno.has(a.fecha)).map(a => {
    if (a.estado !== 'propuesto' || a.fecha < hoy) return a;
    const r = factorPorReglas(a.fecha, reglas, senalesPorFecha[a.fecha] || {}, config);
    const cobraba = a.factorVigente ?? 1;
    if (Math.abs(r.factor - cobraba) > 0.0001) {
      historial.push({
        fecha: a.fecha, factorAnterior: cobraba, factorNuevo: r.factor, origen: 'regla',
        motivo: `${r.aplicadas.join(' + ') || 'Precio de lista'} (mientras decides la propuesta)`,
      });
    }
    return { ...a, factorVigente: r.factor };
  });
  const fechasConservadas = new Set(conservados.map(a => a.fecha));

  const nuevos: AjusteDia[] = [...conservados];
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
        analizadoEn: ahora,
      });
    }
    if (Math.abs(factor - antes) > 0.0001) {
      // Con la marca, el correo la cuenta en «Volvieron a tus reglas».
      const motivo = contraElFreno.has(fecha)
        ? `${aplicadas.join(' + ') || 'Precio de lista'} (${MARCA_VUELVE_A_REGLAS}: ${RAZON_FRENO_SEMANA})`
        : aplicadas.join(' + ') || 'Sin reglas';
      historial.push({ fecha, factorAnterior: antes, factorNuevo: factor, origen: 'regla', motivo });
    }
  }
  return { nuevos, historial, conservados };
}

/** ¿Hay alguna regla encendida que necesite la ocupación para decidir? */
export function hayReglasDeDemanda(reglas: ReglaPrecio[]): boolean {
  return reglas.some(r => r.activa && (r.tipo === 'ocupacion' || r.tipo === 'ultimahora'));
}

/**
 * Recalcula el calendario desde las reglas.
 * `senalesPorFecha` son las señales de demanda por noche (ocupación, días para
 * la llegada). Sin ellas, las reglas de ocupación y última hora no aplican
 * —es a propósito: una regla de ocupación sin datos de ocupación no debe inventar.
 *
 * 🔴 `null` = la ocupación NO se pudo leer (la matriz falló). Con reglas de
 * ocupación o de última hora encendidas, entonces NO se escribe nada y lanza:
 * recalcular sin ellas quitaría la rebaja de última hora de todas las noches
 * por un error de Google, y la corrida quedaría marcada como hecha hasta
 * mañana. Sin esas reglas las señales no cambian ni un peso y se sigue normal.
 */
export async function aplicarReglas(
  senalesPorFecha: Record<string, SenalesDia> | null = {},
): Promise<ResultadoAplicar> {
  // Todo el ciclo leer → calcular → escribir va DENTRO del candado. Con el
  // candado solo en la escritura, dos escritores que leyeran a la vez se
  // pisaban entero (`escribirAjustes` reescribe la hoja completa) y el clic
  // más lento ganaba. Por eso aquí no se vuelve a llamar `withPreciosLock`.
  return withPreciosLock(async () => {
    const hoy = mexicoTodayStr();
    const [reglas, previos, config] = await Promise.all([
      getReglasEstricto(), getAjustesEstricto(), getConfigPreciosEstricto(),
    ]);
    if (senalesPorFecha === null && hayReglasDeDemanda(reglas)) {
      throw new Error(
        'No se pudo leer la ocupación (matriz de disponibilidad) y tienes reglas de ocupación o de última hora: ' +
        'no se recalculó el calendario, se queda como estaba.',
      );
    }

    const { nuevos, historial, conservados } = planificarReglas({
      previos, reglas, config, senalesPorFecha: senalesPorFecha ?? {}, hoy, ahora: new Date().toISOString(),
    });

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

export interface EntradaFijar {
  previos: AjusteDia[];
  fecha: string;
  factor: number;
  motivo: string;
  /**
   * true = «Fijar esta noche» del panel: deja fila manual AUNQUE sea 0% (precio
   * de lista), que ni la IA ni las reglas tocan. false = «Quitar ajuste» o
   * «Volver a automático»: con factor 1 la noche vuelve a sus reglas.
   */
  fijar: boolean;
  reglas: ReglaPrecio[];
  config: ConfigPrecios;
  /** Instante en ISO (el `analizadoEn` de la fila): dato, no reloj. */
  ahora: string;
}

/**
 * La parte PURA de `fijarFactorManual`: qué calendario queda y qué va al historial.
 *
 * Con factor 1 y sin `fijar` le quita el ajuste: la noche vuelve a sus reglas en
 * ese momento, sin esperar a la corrida de las 6:00 (antes se quedaba a precio
 * de lista hasta entonces). 🔴 Con `fijar` (17 oct 2026), 0% deja una fila
 * manual en 1: hasta entonces «Fijar esta noche» en 0% era lo mismo que «Quitar
 * ajuste», y un martes no había forma de cobrar el precio de lista a propósito
 * (la noche regresaba a su −8%).
 */
export function decidirFijar(e: EntradaFijar): { nuevos: AjusteDia[]; historial: EntradaHistorial[] } {
  const { previos, fecha, factor, motivo, fijar, reglas, config, ahora } = e;
  const recortado = recortarFactor(factor, config);
  // Lo que esa noche cobraba DE VERDAD: una propuesta pendiente cobra su regla,
  // no lo que propone (antes el historial anotaba lo propuesto).
  const antes = factoresAplicados(previos.filter(a => a.fecha === fecha))[fecha] ?? 1;
  const resto = previos.filter(a => a.fecha !== fecha);

  if (recortado !== 1 || fijar) {
    const m = motivo || 'Fijado a mano';
    return {
      nuevos: [
        ...resto,
        { rowIndex: 0, fecha, factor: recortado, origen: 'manual', motivo: m, estado: 'aplicado', analizadoEn: ahora },
      ],
      historial: [{ fecha, factorAnterior: antes, factorNuevo: recortado, origen: 'manual', motivo: m }],
    };
  }
  // Sin señales de demanda: las reglas de ocupación y de última hora vuelven
  // a entrar en la corrida de las 6:00, que sí las mide.
  const r = factorPorReglas(fecha, reglas, {}, config);
  const deRegla = r.aplicadas.join(' + ') || 'Reglas';
  return {
    nuevos: r.factor === 1 ? resto : [
      ...resto,
      { rowIndex: 0, fecha, factor: r.factor, origen: 'regla', motivo: deRegla, estado: 'aplicado', analizadoEn: ahora },
    ],
    historial: [{
      fecha, factorAnterior: antes, factorNuevo: r.factor, origen: 'manual',
      motivo: `Quitaste el ajuste: vuelve a tus reglas (${r.aplicadas.join(' + ') || 'precio de lista'})`,
    }],
  };
}

/**
 * Fija el factor de una noche a mano (ver `decidirFijar`). `fijar` = el botón
 * «Fijar esta noche»; sin él, factor 1 («Quitar ajuste», «Volver a
 * automático») devuelve la noche a sus reglas.
 */
export async function fijarFactorManual(fecha: string, factor: number, motivo: string, fijar = false): Promise<void> {
  await withPreciosLock(async () => {
    const [previos, config, reglas] = await Promise.all([
      getAjustesEstricto(), getConfigPreciosEstricto(), getReglasEstricto(),
    ]);
    const { nuevos, historial } = decidirFijar({
      previos, fecha, factor, motivo, fijar, reglas, config, ahora: new Date().toISOString(),
    });
    await escribirAjustes(nuevos);
    await logHistorial(historial);
    invalidarCachePrecios();
  });
}

/**
 * La parte PURA de `resolverPropuestas`: aprobar o rechazar propuestas de la IA.
 *
 * 🔴 Aprobar deja la fila como `manual` con motivo «Aprobado: …». Antes quedaba
 * como fila de la IA y la corrida de la mañana siguiente la recalculaba como a
 * cualquier otra: 17 de 21 aprobaciones volvieron a la regla en menos de un día.
 * Una fila manual no la tocan ni la IA ni las reglas, y «Volver a automático»
 * en el panel la deshace. En el historial sigue contando como de la IA.
 *
 * Rechazar quita la propuesta y la noche cobra su regla en ese mismo momento
 * (`factorVigente`, o `reglaDe` en una propuesta vieja que no lo trae).
 */
export function decidirPropuestas(
  previos: AjusteDia[],
  fechas: string[],
  aprobar: boolean,
  ahora: string,
  reglaDe: (fecha: string) => { factor: number; motivo: string } = () => ({ factor: 1, motivo: 'Reglas' }),
): { nuevos: AjusteDia[]; historial: EntradaHistorial[] } {
  const objetivo = new Set(fechas);
  const historial: EntradaHistorial[] = [];
  const nuevos: AjusteDia[] = [];
  for (const a of previos) {
    if (!objetivo.has(a.fecha) || a.estado !== 'propuesto') { nuevos.push(a); continue; }
    if (aprobar) {
      nuevos.push({ ...sinVigente(a), origen: 'manual', estado: 'aplicado', motivo: `${MARCA_APROBADO} ${a.motivo}`, analizadoEn: ahora });
      // Mientras esperaba, la noche cobraba la regla (`factorVigente`); las
      // propuestas viejas sin esa columna cobraban el precio base (1).
      historial.push({ fecha: a.fecha, factorAnterior: a.factorVigente ?? 1, factorNuevo: a.factor, origen: 'ia', motivo: `${MARCA_APROBADO} ${a.motivo}` });
    } else {
      // Rechazada: la propuesta DESAPARECE del calendario y la noche vuelve a lo
      // que digan las reglas del dueño. El rastro para no re-proponer lo mismo
      // queda en el historial (`getRechazosRecientes`), no aquí: conservando la
      // fila, una noche de Navidad rechazada se iba a precio base en vez de al
      // +15% de su propia temporada.
      const regla = reglaDe(a.fecha);
      const factorRegla = a.factorVigente ?? regla.factor;
      // `factorAnterior` = lo rechazado: de ahí lo lee getRechazosRecientes.
      historial.push({ fecha: a.fecha, factorAnterior: a.factor, factorNuevo: factorRegla, origen: 'ia', motivo: `${MARCA_RECHAZO} ${a.motivo}` });
      // La noche cobra su regla YA, no a las 6:00 de mañana: sin esta fila
      // quedaba a precio de lista hasta la siguiente corrida.
      if (factorRegla !== 1) {
        nuevos.push({
          ...sinVigente(a), factor: factorRegla, origen: 'regla', estado: 'aplicado',
          motivo: `${regla.motivo} (rechazaste la propuesta)`, analizadoEn: ahora,
        });
      }
    }
  }
  return { nuevos, historial };
}

/** Aprueba o rechaza propuestas de la IA. Devuelve cuántas se tocaron. */
export async function resolverPropuestas(fechas: string[], aprobar: boolean): Promise<number> {
  if (fechas.length === 0) return 0;
  return withPreciosLock(async () => {
    const [previos, reglas, config] = await Promise.all([
      getAjustesEstricto(), getReglasEstricto(), getConfigPreciosEstricto(),
    ]);
    const reglaDe = (fecha: string) => {
      const r = factorPorReglas(fecha, reglas, {}, config);
      return { factor: r.factor, motivo: r.aplicadas.join(' + ') || 'Reglas' };
    };
    const { nuevos, historial } = decidirPropuestas(previos, fechas, aprobar, new Date().toISOString(), reglaDe);
    // Nada que resolver (otra pestaña ya lo hizo): no se reescribe la hoja.
    if (historial.length === 0) return 0;
    await escribirAjustes(nuevos);
    await logHistorial(historial);
    invalidarCachePrecios();
    return historial.length;
  });
}
