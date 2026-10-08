/**
 * precios-ia.ts
 * El análisis de demanda: una llamada a Claude al día.
 *
 * Reparto de trabajo, a propósito:
 *  - Las REGLAS (temporada, día de la semana, ocupación, última hora) son
 *    determinísticas y viven en lib/precios.ts. Son las que mueven el dinero.
 *  - La IA solo revisa el resultado contra las señales de demanda reales y, donde
 *    no está de acuerdo, propone otro factor CON una explicación en una línea.
 *  - Los topes los recorta el código, no el prompt: un JSON raro no puede
 *    sacar un precio del piso/techo que puso el dueño.
 *
 * Con ~6 meses de historia y 13 habitaciones no hay pronóstico que valga: por eso
 * el prompt le pide explícitamente ser conservadora y no inventar demanda.
 */
import Anthropic from '@anthropic-ai/sdk';
import { getAjustes, getConfigPrecios, getReglas, getRechazosRecientes, escribirAjustes, logHistorial, withPreciosLock, EntradaHistorial } from './precios-sheets';
import { construirSenales, ocupacionFiable, senalesParaReglas, TOTAL_SUITES, type SenalesNoche } from './demanda';
import { calendarioParaPrompt } from '@/lib/calendario-mx';
import { AjusteDia, ConfigPrecios, factorPorReglas, recortarFactor, esCambioGrande } from '@/lib/precios';
import { mexicoTodayStr } from '@/lib/date-mx';
import { invalidarCachePrecios } from '@/lib/precios-vigentes';

/** Un año es demasiado para pedirle juicio: la IA opina de lo que ya se está vendiendo. */
const DIAS_ANALISIS = 120;
const MODELO = 'claude-sonnet-5-5';
const MAX_SUGERENCIAS = 40;
/**
 * Cuánto tiene que moverse la IA respecto a lo que ella misma puso ayer para que
 * valga la pena cambiar el precio. Sin esto, una noche podía bailar
 * $2,200 → $2,150 → $2,250 día tras día solo por el ruido del modelo: el huésped
 * que la vio ayer siente que le cambian el precio en la cara y el historial se
 * llena de movimientos que no significan nada. 3 puntos porcentuales.
 */
const UMBRAL_ESTABILIDAD = 0.03;
const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export interface SugerenciaIA {
  fecha: string;
  factor: number;
  motivo: string;
}

export interface ResultadoIA {
  revisadas: number;
  aplicadas: number;
  propuestas: number;
  ignoradas: number;
  estables: number;
  modelo: string;
}

function tablaDeSenales(senales: SenalesNoche[], factorRegla: Map<string, number>): string {
  const lineas = senales.map(s => {
    const f = factorRegla.get(s.fecha) ?? 1;
    const pct = Math.round((f - 1) * 100);
    return [
      s.fecha,
      DOW[s.dow],
      `d+${s.diasParaLlegada}`,
      `ocup ${s.ocupadas}/${TOTAL_SUITES}`,
      `nuevas7d ${s.ritmo7d}`,
      `busq7d ${s.busquedas7d}`,
      `sincupo7d ${s.sinCupo7d}`,
      `carritos ${s.intencion}`,
      `reglas ${pct >= 0 ? '+' : ''}${pct}%`,
    ].join(' | ');
  });
  return lineas.join('\n');
}

function construirPrompt(
  config: { pisoPct: number; techoPct: number },
  ocupMedia: number,
  calendario: string,
): string {
  return `Eres el revenue manager de Paraíso Encantado, un hotel boutique de ${TOTAL_SUITES} habitaciones en Xilitla, Huasteca Potosina, México. Vende sobre todo a familias y parejas del centro del país (CDMX, Monterrey, San Luis Potosí, Querétaro, Guadalajara) que llegan en coche.

Tu trabajo: revisar el precio que las reglas del dueño proponen para cada noche y señalar SOLO las noches donde te parezca equivocado, con una razón de una línea.

Datos que recibes por noche (una línea por noche):
- fecha y día de la semana
- d+N: días entre hoy y esa noche
- ocup X/${TOTAL_SUITES}: habitaciones ya vendidas o bloqueadas esa noche
- nuevas7d: reservas que entraron en los últimos 7 días y cubren esa noche (ritmo)
- busq7d: búsquedas en la web que incluían esa noche en los últimos 7 días
- sincupo7d: de esas búsquedas, cuántas NO encontraron ninguna habitación libre
- carritos: carritos abandonados pendientes que pedían esa noche
- reglas: el ajuste que ya proponen las reglas del dueño sobre el precio base

Límites que NO puedes rebasar: el precio nunca baja más de ${Math.abs(config.pisoPct)}% ni sube más de ${config.techoPct}% del precio base. La ocupación media de los próximos 30 días es ${ocupMedia}%.

Reglas de criterio:
1. Este hotel es chico y tiene pocos meses de historia. Con poca señal, NO propongas nada. El silencio es una respuesta válida y preferible.
2. Lo que más justifica subir: ocupación alta para esa noche, ritmo de reservas fuerte, o búsquedas que no encontraron lugar (sincupo7d > 0). Son datos reales, no corazonadas.
3. Para bajar necesitas lo contrario Y que falte poco: ocupación muy baja con d+ pequeño. Nunca bajes una noche a más de 30 días: todavía hay tiempo de venderla al precio normal.
4. El calendario de fechas especiales viene ABAJO, verificado. Úsalo ese y no tu memoria: no inventes puentes, no supongas en qué día de la semana cae una fecha, y no "corrijas" el calendario.
5. NUNCA inventes eventos, clima, competencia ni datos que no estén en la tabla ni en el calendario de abajo. Si no tienes razón, no propongas.
6. No propongas una noche solo porque las reglas ya la movieron bien: solo donde difieras más de 2 puntos porcentuales.

Devuelve ÚNICAMENTE un arreglo JSON, sin texto alrededor y sin cercas de código, con máximo ${MAX_SUGERENCIAS} objetos, el más importante primero:
[{"fecha":"YYYY-MM-DD","pct":15,"motivo":"texto corto en español"}]

donde "pct" es el ajuste TOTAL que recomiendas sobre el precio base (no un delta sobre las reglas) y "motivo" tiene 90 caracteres o menos, en español, nombrando el dato que lo justifica. Si no hay nada que sugerir, devuelve [].

CALENDARIO MEXICANO VERIFICADO (Ley Federal del Trabajo art. 74 + calendario escolar SEP; las fechas son noches, inclusive en los dos extremos):
${calendario}`;
}

function parsearSugerencias(texto: string): { fecha: string; pct: number; motivo: string }[] {
  const limpio = texto.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const ini = limpio.indexOf('[');
  const fin = limpio.lastIndexOf(']');
  if (ini < 0 || fin <= ini) return [];
  try {
    const arr = JSON.parse(limpio.slice(ini, fin + 1));
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((o: any) => o && /^\d{4}-\d{2}-\d{2}$/.test(String(o.fecha)) && Number.isFinite(Number(o.pct)))
      .map((o: any) => ({
        fecha: String(o.fecha),
        pct: Number(o.pct),
        motivo: String(o.motivo || '').slice(0, 120),
      }));
  } catch {
    return [];
  }
}

export interface EntradaPlanificar {
  sugerencias: { fecha: string; pct: number; motivo: string }[];
  senales: SenalesNoche[];
  factorRegla: Map<string, number>;
  motivoRegla: Map<string, string>;
  previos: AjusteDia[];
  config: ConfigPrecios;
  hoy: string;
  /**
   * Instante de la corrida en ISO. Entra como dato y no se lee del reloj aquí
   * dentro para que la función sea de verdad pura y se pueda fijar en una
   * prueba: de él sale el `analizadoEn` de las filas nuevas.
   */
  ahora: string;
  /**
   * Lo que el dueño rechazó hace poco (fecha → factor rechazado), leído del
   * historial. No se deduce de `previos` a propósito: un rechazo ya no deja fila
   * en el calendario, para que esa noche cobre la regla del dueño y no el precio
   * base.
   */
  rechazos: Map<string, number>;
}

export interface PlanAjustes {
  nuevos: AjusteDia[];
  historial: EntradaHistorial[];
  aplicadas: number;
  propuestas: number;
  ignoradas: number;
  /** Noches que la IA quiso mover apenas y se dejaron como estaban. */
  estables: number;
}

/**
 * Decide qué entra al calendario. Función PURA: ni Sheets ni modelo, para poder
 * probar las tres decisiones que de verdad importan —qué se aplica solo, qué
 * espera visto bueno y qué no se vuelve a proponer— sin gastar una llamada.
 *
 * Jerarquía: lo fijado a mano gana sobre la IA, y la IA sobre las reglas.
 */
export function planificarAjustes(e: EntradaPlanificar): PlanAjustes {
  const { sugerencias, senales, factorRegla, motivoRegla, previos, config, hoy, ahora, rechazos } = e;

  const previoPorFecha = new Map(previos.map(a => [a.fecha, a]));
  // Intocables de entrada: solo el pasado (es el registro de lo que se cobró) y
  // la mano del dueño. Las propuestas pendientes y los rechazos vigentes se
  // conservan más abajo, dentro del bucle, porque ahí sí se les puede dar una
  // opinión nueva sin perderlos.
  const intocables = previos.filter(a => a.fecha < hoy || a.origen === 'manual');
  const fechasIntocables = new Set(intocables.map(a => a.fecha));

  const analizadoEn = ahora;
  const nuevos: AjusteDia[] = [...intocables];
  const historial: EntradaHistorial[] = [];
  let aplicadas = 0;
  let propuestas = 0;
  let ignoradas = 0;
  let estables = 0;

  const sugPorFecha = new Map(sugerencias.map(s => [s.fecha, s]));

  for (const s of senales) {
    const fecha = s.fecha;
    if (fechasIntocables.has(fecha)) continue;

    const base = factorRegla.get(fecha) ?? 1;
    const sug = sugPorFecha.get(fecha);
    const antes = previoPorFecha.get(fecha);
    const factorAntes = antes && antes.estado === 'aplicado' ? antes.factor : 1;

    // ── Una propuesta que el dueño todavía no revisa se conserva ──
    // Es una decisión suya pendiente, no ruido del modelo: solo se reemplaza si
    // la IA trae una opinión NUEVA y distinta. Antes caía al camino de abajo y se
    // convertía en una fila de regla, o sea: se perdía sin rastro.
    if (antes && antes.estado === 'propuesto') {
      const propuesto = sug ? recortarFactor(1 + sug.pct / 100, config) : null;
      // Si lo que la propuesta pide ya es lo que dicen las reglas del dueño, no
      // hay nada que decidir: deja de esperar permiso y la noche cobra la regla.
      // Sin esto, una propuesta vieja hecha cuando no había reglas se quedaba
      // esperando para siempre y tapaba la temporada: el +15% de Navidad no se
      // cobraba y la noche iba a precio base.
      const yaEsLaRegla = Math.abs(antes.factor - base) < 0.02 &&
        (propuesto === null || Math.abs(propuesto - base) < 0.02);
      const repiteLoMismo = propuesto !== null && Math.abs(propuesto - antes.factor) < 0.02;
      if (!yaEsLaRegla && (propuesto === null || repiteLoMismo)) {
        nuevos.push(antes);
        if (repiteLoMismo) ignoradas++;
        continue;
      }
    }

    let factor = base;
    let origen: AjusteDia['origen'] = 'regla';
    let motivo = motivoRegla.get(fecha) || 'Reglas';
    let estado: AjusteDia['estado'] = 'aplicado';

    if (sug) {
      const propuesto = recortarFactor(1 + sug.pct / 100, config);
      const laPusoLaIA = antes?.origen === 'ia' && antes.estado === 'aplicado';
      const yaRechazado = rechazos.get(fecha);
      if (yaRechazado !== undefined && Math.abs(propuesto - yaRechazado) < 0.02) {
        ignoradas++;  // ya dijo que no a este número: la noche se queda con las reglas
      } else if (Math.abs(propuesto - base) < 0.02) {
        ignoradas++;  // coincide con las reglas: no es una sugerencia
      } else if (laPusoLaIA && Math.abs(propuesto - antes!.factor) < UMBRAL_ESTABILIDAD) {
        // Se mueve menos de 3 puntos respecto a lo que ella misma puso: se queda
        // como estaba. El precio solo cambia cuando hay una razón de verdad.
        factor = antes!.factor;
        origen = 'ia';
        motivo = antes!.motivo;
        estables++;
      } else {
        factor = propuesto;
        origen = 'ia';
        motivo = sug.motivo || 'Análisis de demanda';
        if (esCambioGrande(propuesto, base, config.bandaAutoPct)) {
          estado = 'propuesto';
          propuestas++;
        } else {
          estado = 'aplicado';
          aplicadas++;
        }
      }
    }

    if (factor !== 1 || estado === 'propuesto') {
      nuevos.push({ rowIndex: 0, fecha, factor, origen, motivo, estado, analizadoEn });
    }
    // Al historial solo lo que de verdad cambia el precio cobrado.
    const factorDespues = estado === 'aplicado' ? factor : factorAntes;
    if (Math.abs(factorDespues - factorAntes) > 0.0001) {
      historial.push({ fecha, factorAnterior: factorAntes, factorNuevo: factorDespues, origen, motivo });
    }
  }

  // Las noches más allá del horizonte de análisis conservan lo que tenían.
  const ultima = senales[senales.length - 1]?.fecha ?? hoy;
  for (const a of previos) {
    if (a.fecha > ultima && a.fecha >= hoy && !fechasIntocables.has(a.fecha)) nuevos.push(a);
  }

  return { nuevos, historial, aplicadas, propuestas, ignoradas, estables };
}

/**
 * Corre el análisis completo y deja el calendario escrito.
 * Las noches fijadas a mano no se tocan nunca; las que la IA no menciona se
 * quedan con lo que digan las reglas.
 */
export async function analizarDemanda(): Promise<ResultadoIA> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY: la IA no puede analizar.');

  const hoy = mexicoTodayStr();
  // `previos` NO se lee aquí: se lee dentro del candado, después de la llamada
  // al modelo. Leerlo antes abría una ventana de 20-60 s entre la lectura y la
  // escritura (que reescribe la hoja entera), y cualquier clic del panel en ese
  // hueco se perdía completo.
  const [config, reglas, senales] = await Promise.all([
    getConfigPrecios(),
    getReglas(),
    construirSenales(hoy, DIAS_ANALISIS),
  ]);

  const senalesReglas = senalesParaReglas(senales);
  const factorRegla = new Map<string, number>();
  for (const s of senales) {
    factorRegla.set(s.fecha, factorPorReglas(s.fecha, reglas, senalesReglas[s.fecha], config).factor);
  }
  const motivoRegla = new Map<string, string>();
  for (const s of senales) {
    motivoRegla.set(s.fecha, factorPorReglas(s.fecha, reglas, senalesReglas[s.fecha], config).aplicadas.join(' + '));
  }

  // Sin ocupación real no hay análisis: un hotel que se ve vacío por un error de
  // red hace que el modelo recomiende bajar precios. Mejor quedarse con las
  // reglas, que ya se aplicaron, y gritarlo en el log.
  if (!ocupacionFiable()) {
    throw new Error('No se pudo leer la ocupación (reservas y matriz fallaron): no se analiza con datos falsos.');
  }

  const prim30 = senales.slice(0, 30);
  const ocupMedia = prim30.length
    ? Math.round(prim30.reduce((a, s) => a + s.ocupacionPct, 0) / prim30.length)
    : 0;

  const client = new Anthropic({ apiKey });
  const respuesta = await client.messages.create({
    model: MODELO,
    // 8192 y no 4096: Sonnet 5.5 razona por omisión y el razonamiento cuenta
    // dentro de max_tokens. Con el tope justo, el JSON se cortaba a la mitad y
    // el análisis fallaba en silencio.
    max_tokens: 8192,
    system: construirPrompt(config, ocupMedia, calendarioParaPrompt(hoy, DIAS_ANALISIS)),
    messages: [{
      role: 'user',
      content: `Hoy es ${hoy}. Estas son las próximas ${senales.length} noches:\n\n${tablaDeSenales(senales, factorRegla)}`,
    }],
  });

  // Sonnet 5.5 razona por omisión: el arreglo `content` puede traer bloques de
  // pensamiento antes del texto. Solo nos quedamos con el texto.
  const texto = respuesta.content
    .map(b => (b.type === 'text' ? b.text : ''))
    .filter(Boolean)
    .join('\n');
  const sugerencias = parsearSugerencias(texto).slice(0, MAX_SUGERENCIAS);
  if (respuesta.stop_reason === 'max_tokens') {
    console.warn('[precios-ia] la respuesta se cortó por max_tokens — puede faltar parte del análisis');
  }
  // Un rechazo del modelo llega como 200 sin bloques de texto, o sea: idéntico a
  // "hoy no hay nada que sugerir". Sin este aviso, el día en que Claude declina
  // el hotel se queda con las reglas y nadie se enteraría nunca.
  if (respuesta.stop_reason === 'refusal') {
    throw new Error('El modelo declinó responder (stop_reason: refusal) — el calendario se queda con las reglas.');
  }
  if (sugerencias.length === 0 && texto.trim().length === 0) {
    console.warn('[precios-ia] el modelo no devolvió texto. stop_reason:', respuesta.stop_reason);
  }
  if (sugerencias.length === 0 && texto.trim().length > 0 && !texto.includes('[]')) {
    // No tumbamos la corrida: sin sugerencias válidas el calendario se queda con
    // las reglas, que es el comportamiento correcto. Pero hay que poder verlo.
    console.warn('[precios-ia] no se pudo leer ninguna sugerencia del modelo. Respuesta:', texto.slice(0, 300));
  }

  // Candado corto: leer el estado fresco, decidir y escribir sin que nadie se
  // cuele en medio. La llamada al modelo ya quedó fuera.
  const plan = await withPreciosLock(async () => {
    const [previos, rechazos] = await Promise.all([getAjustes(), getRechazosRecientes()]);
    const p = planificarAjustes({
      sugerencias, senales, factorRegla, motivoRegla, previos, config, hoy,
      ahora: new Date().toISOString(), rechazos,
    });
    await escribirAjustes(p.nuevos);
    return p;
  });
  const { historial, aplicadas, propuestas, ignoradas, estables } = plan;

  await logHistorial(historial);
  invalidarCachePrecios();

  console.log(
    `[precios-ia] ${hoy} modelo:${MODELO} noches:${senales.length} ` +
    `sugerencias:${sugerencias.length} aplicadas:${aplicadas} propuestas:${propuestas} ` +
    `estables:${estables} ignoradas:${ignoradas}`
  );

  return { revisadas: senales.length, aplicadas, propuestas, ignoradas, estables, modelo: MODELO };
}
