/**
 * calendario-mx.ts
 * El calendario de demanda turística mexicana, escrito a mano y verificado.
 *
 * Existe por una razón concreta: antes de este archivo, las temporadas altas
 * del hotel dependían de que el modelo de IA recordara bien el calendario —el
 * prompt le decía literalmente "usa lo que sabes del calendario mexicano"—, así
 * que el precio de Navidad dependía de que acertara en qué día de la semana cae
 * el 25 de diciembre. Ahora las fechas están aquí, y de aquí salen dos cosas:
 *
 *  1. las reglas `temporada` que se siembran en la hoja `PreciosReglas`
 *     (`/api/admin/precios/sembrar`), que son las que mueven el dinero;
 *  2. el texto que se le pasa al modelo, para que no tenga que adivinar.
 *
 * ── Fuentes ───────────────────────────────────────────────
 * Descanso obligatorio: Ley Federal del Trabajo, art. 74 (primer lunes de
 * febrero, tercer lunes de marzo, tercer lunes de noviembre).
 * Vacaciones y juntas de Consejo Técnico: calendario escolar SEP 2026-2027.
 * Las juntas de CTE son viernes sin clases y son las que crean los megapuentes
 * de cuatro días; ignorarlas es perder las dos mejores fechas del año.
 *
 * ── Cómo leer `hasta` ─────────────────────────────────────
 * 🔴 `hasta` es la ÚLTIMA NOCHE que se cobra con ese ajuste, no la fecha de
 * salida. El motor compara el rango de forma inclusiva en los dos extremos
 * (`lib/precios.ts`, `reglaAplica`). Quien capture aquí una fecha de check-out
 * le cobra al huésped una noche cara de más.
 *
 * ── Mantenimiento ─────────────────────────────────────────
 * Las fechas son absolutas porque las reglas del motor también lo son (no hay
 * recurrencia anual). Esta tabla llega a diciembre de 2027: cuando el horizonte
 * de 365 días del motor rebase ese límite, hay que extenderla con el calendario
 * escolar del ciclo siguiente.
 */

/** Una temporada o puente: un rango de noches con un ajuste sugerido. */
export interface TemporadaMx {
  /** Id estable: si se vuelve a sembrar, actualiza su fila en vez de duplicarla. */
  id: string;
  nombre: string;
  /** Primera noche, 'YYYY-MM-DD'. */
  desde: string;
  /** Última noche que se cobra con el ajuste, 'YYYY-MM-DD'. */
  hasta: string;
  /** Ajuste conservador sugerido, en %. +20 sube 20%. */
  pct: number;
  /** Menor gana cuando dos temporadas se traslapan (no se suman). */
  prioridad: number;
  /** Por qué existe esta fecha. Se muestra en el panel y se le pasa a la IA. */
  porque: string;
}

/**
 * Las 16 temporadas de oct 2026 a dic 2027, con los porcentajes conservadores
 * que eligió el dueño: picos del año +20%, Navidad +15%, puentes +10%.
 */
export const TEMPORADAS_MX: TemporadaMx[] = [
  {
    id: 'xantolo-2026', nombre: 'Xantolo / Día de Muertos 2026',
    desde: '2026-10-29', hasta: '2026-11-01', pct: 20, prioridad: 1,
    porque: 'Megapuente de 4 días: viernes 30 de oct sin clases (junta de Consejo Técnico) + lunes 2 de nov. Es la fecha más fuerte de la Huasteca.',
  },
  {
    id: 'puente-revolucion-2026', nombre: 'Puente de la Revolución 2026',
    desde: '2026-11-13', hasta: '2026-11-15', pct: 10, prioridad: 20,
    porque: 'Descanso obligatorio el lunes 16 de nov (tercer lunes, LFT art. 74).',
  },
  {
    id: 'navidad-2026', nombre: 'Navidad 2026',
    desde: '2026-12-20', hasta: '2026-12-26', pct: 15, prioridad: 5,
    porque: 'Vacaciones de invierno SEP desde el 21 de dic; 25 de dic en viernes.',
  },
  {
    id: 'ano-nuevo-2027', nombre: 'Año Nuevo y Reyes 2027',
    desde: '2026-12-27', hasta: '2027-01-05', pct: 20, prioridad: 4,
    porque: 'Vacaciones de invierno SEP hasta el 5 de ene; 1 de ene en viernes y Reyes el 6.',
  },
  {
    id: 'megapuente-constitucion-2027', nombre: 'Megapuente de la Constitución 2027',
    desde: '2027-01-28', hasta: '2027-01-31', pct: 10, prioridad: 20,
    porque: 'Megapuente de 4 días: viernes 29 de ene sin clases (Consejo Técnico) + lunes 1 de feb de descanso obligatorio.',
  },
  {
    id: 'puente-juarez-2027', nombre: 'Puente de Benito Juárez 2027',
    desde: '2027-03-12', hasta: '2027-03-14', pct: 10, prioridad: 20,
    porque: 'Descanso obligatorio el lunes 15 de mar (tercer lunes, LFT art. 74).',
  },
  {
    id: 'semana-santa-2027', nombre: 'Semana Santa 2027',
    desde: '2027-03-20', hasta: '2027-03-28', pct: 20, prioridad: 2,
    porque: 'Vacaciones SEP del 22 de mar al 3 de abr; Pascua el 28 de mar, Jueves y Viernes Santo el 25 y 26.',
  },
  {
    id: 'pascua-2027', nombre: 'Semana de Pascua 2027',
    desde: '2027-03-29', hasta: '2027-04-04', pct: 10, prioridad: 10,
    porque: 'Segunda semana de las vacaciones escolares de primavera. Siempre más floja que la primera.',
  },
  {
    id: 'puente-mayo-2027', nombre: 'Puente del 1.º de mayo 2027',
    desde: '2027-04-29', hasta: '2027-05-01', pct: 10, prioridad: 20,
    porque: 'Viernes 30 de abr sin clases (Consejo Técnico) + sábado 1 de mayo de descanso obligatorio.',
  },
  {
    id: 'dia-madres-2027', nombre: 'Día de las Madres 2027',
    desde: '2027-05-07', hasta: '2027-05-09', pct: 10, prioridad: 20,
    porque: 'El 10 de mayo cae en lunes: fin de semana largo familiar, de los más fuertes del año para hoteles.',
  },
  {
    id: 'verano-2027', nombre: 'Verano 2027',
    desde: '2027-07-10', hasta: '2027-08-07', pct: 10, prioridad: 10,
    porque: 'El ciclo escolar termina el 9 de jul. Primeras cuatro semanas de vacaciones, que son las que se llenan.',
  },
  {
    id: 'puente-independencia-2027', nombre: 'Puente de la Independencia 2027',
    desde: '2027-09-15', hasta: '2027-09-18', pct: 10, prioridad: 20,
    porque: 'Noche del Grito el 15 y descanso obligatorio el jueves 16 de sep; muchos estiran al fin de semana.',
  },
  {
    id: 'xantolo-2027', nombre: 'Xantolo / Día de Muertos 2027',
    desde: '2027-10-29', hasta: '2027-11-01', pct: 20, prioridad: 1,
    porque: 'Día de Muertos el lunes 1 y martes 2 de nov: cuatro noches corridas de demanda alta.',
  },
  {
    id: 'puente-revolucion-2027', nombre: 'Puente de la Revolución 2027',
    desde: '2027-11-12', hasta: '2027-11-14', pct: 10, prioridad: 20,
    porque: 'Descanso obligatorio el lunes 15 de nov (tercer lunes, LFT art. 74).',
  },
  {
    id: 'navidad-2027', nombre: 'Navidad 2027',
    desde: '2027-12-19', hasta: '2027-12-25', pct: 15, prioridad: 5,
    porque: 'Vacaciones de invierno; 25 de dic en sábado.',
  },
  {
    id: 'ano-nuevo-2028', nombre: 'Año Nuevo 2028',
    desde: '2027-12-26', hasta: '2027-12-31', pct: 20, prioridad: 4,
    porque: 'Semana entre Navidad y Año Nuevo, la de ocupación más alta del año.',
  },
];

/**
 * La regla de día de la semana que decidió el dueño: domingo a jueves más
 * barato, viernes y sábado al precio de lista.
 *
 * 🔴 El tipo `finde` del motor IGNORA `desde`/`hasta`: aplica los 365 días del
 * horizonte, también dentro de las temporadas altas, donde se multiplica con
 * ellas (el techo lo frena). Es a propósito, pero hay que saberlo.
 */
export const REGLA_DIAS_SEMANA = {
  id: 'dias-semana',
  nombre: 'Días de semana más baratos',
  /** 0 = domingo … 6 = sábado. Quitar el 0 lo deja en lunes-jueves. */
  dias: [0, 1, 2, 3, 4],
  pct: -8,
  prioridad: 1,
  porque: 'Llenar los días muertos sin tocar el precio del fin de semana. Reemplaza al viejo descuento de $300 de lunes a jueves, apagado en jun 2026, con algo más suave (−8%).',
};

/**
 * El calendario en texto, para el prompt del análisis de demanda.
 * Solo las fechas que todavía no pasaron, para no gastar contexto en historia.
 */
export function calendarioParaPrompt(hoy: string, diasAdelante = 120): string {
  const limite = new Date(`${hoy}T12:00:00`);
  limite.setDate(limite.getDate() + diasAdelante);
  const hasta = limite.toISOString().slice(0, 10);

  const vigentes = TEMPORADAS_MX.filter(t => t.hasta >= hoy && t.desde <= hasta);
  if (vigentes.length === 0) return 'Sin fechas especiales del calendario mexicano en esta ventana.';
  return vigentes
    .map(t => `- ${t.desde} a ${t.hasta} · ${t.nombre} (el dueño ya puso ${t.pct > 0 ? '+' : ''}${t.pct}%): ${t.porque}`)
    .join('\n');
}
