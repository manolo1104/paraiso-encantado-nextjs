/**
 * «¿Por qué esta noche cuesta esto?» en una sola estructura.
 *
 * Reemplaza a la leyenda de puntos de color, al párrafo del motivo y a la tabla
 * de historial: las tres existían para contestar esta misma pregunta y ninguna
 * la contestaba sola.
 *
 * 🔴 REGLA DE ORO: este módulo NO calcula el precio. El precio sale de
 * `getRoomNightPrice()`, que es la misma función que cobra el motor web, y el
 * factor vigente sale del mismo mapa que alimenta al calendario. Aquí solo se
 * ETIQUETA ese número con sus causas. Si el recibo hiciera su propia cuenta,
 * tarde o temprano enseñaría un total distinto al que paga el huésped —
 * `redondear50` y las señales de demanda bastan para desviarla — y un recibo
 * equivocado cuesta más confianza que la leyenda que vino a reemplazar.
 */
import { AjusteDia, ConfigPrecios, ReglaPrecio, factorPorReglas } from '@/lib/precios';

/** Quién manda en el precio que la web cobra AHORA por esta noche. */
export type QuienDecide = 'base' | 'reglas' | 'ia' | 'manual';

export interface LineaRegla {
  nombre: string;
  /** `null` cuando dos reglas comparten nombre con porcentajes distintos: se
   *  enseña el nombre sin número antes que enseñar un número que puede ser otro. */
  pct: number | null;
}

export interface DesgloseNoche {
  quien: QuienDecide;
  /** El factor que la web cobra ahora. 1 = precio base. */
  factorVigente: number;
  /** Las reglas del dueño que caen en esta noche, y el factor que piden entre todas. */
  reglas: LineaRegla[];
  factorDeReglas: number;
  /** El «por qué» que escribió la IA o el dueño, si el precio no lo mandan las reglas. */
  motivo: string;
  /** Una sugerencia de la IA esperando respuesta. */
  propuesta: AjusteDia | null;
  /**
   * 🔴 La propuesta pendiente ocupa la única fila de esa fecha, así que
   * mientras espera NO se cobra la regla del dueño. Si su regla pedía más, el
   * hotel está cobrando de menos sin que nadie lo vea.
   */
  propuestaTapaLaRegla: boolean;
}

/** nombre → pct, o `null` si el nombre es ambiguo. */
function pctPorNombre(reglas: ReglaPrecio[]): Map<string, number | null> {
  const m = new Map<string, number | null>();
  for (const r of reglas) {
    if (!m.has(r.nombre)) m.set(r.nombre, r.pct);
    else if (m.get(r.nombre) !== r.pct) m.set(r.nombre, null);
  }
  return m;
}

export function desglosarNoche(
  fecha: string,
  reglas: ReglaPrecio[],
  config: ConfigPrecios,
  ajuste: AjusteDia | undefined,
  /** Del mismo mapa `factoresAplicados` que pinta el calendario: así el recibo
   *  y la celda no pueden discrepar. */
  factorVigente: number,
): DesgloseNoche {
  // `aplicadas` son los nombres de las reglas que de verdad entraron. Lo
  // devuelve `factorPorReglas` desde que se escribió «para explicarlo en el
  // panel» y hasta ahora nadie lo había enseñado.
  const porReglas = factorPorReglas(fecha, reglas, {}, config);
  const pcts = pctPorNombre(reglas);
  const lineas: LineaRegla[] = porReglas.aplicadas.map(nombre => ({
    nombre,
    pct: pcts.get(nombre) ?? null,
  }));

  const propuesta = ajuste?.estado === 'propuesto' ? ajuste : null;
  const vigente = ajuste?.estado === 'aplicado' ? ajuste : undefined;

  const quien: QuienDecide =
    factorVigente === 1 && !vigente ? 'base'
      : vigente?.origen === 'manual' ? 'manual'
        : vigente?.origen === 'ia' ? 'ia'
          : 'reglas';

  return {
    quien,
    factorVigente,
    reglas: lineas,
    factorDeReglas: porReglas.factor,
    motivo: vigente?.motivo ?? '',
    propuesta,
    propuestaTapaLaRegla:
      propuesta !== null && Math.abs(factorVigente - porReglas.factor) > 1e-9,
  };
}

/** 1.104 → 10 (el entero que se enseña, igual que en el resto del panel). */
export function pctDeFactor(factor: number): number {
  return Math.round((factor - 1) * 100);
}
