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
import {
  getAjustesEstricto, getConfigPreciosEstricto, getReglasEstricto, getRechazosRecientesEstricto,
  escribirAjustes, logHistorial, withPreciosLock, EntradaHistorial,
} from './precios-sheets';
import { construirSenales, ocupacionFiable, senalesParaReglas, TOTAL_SUITES, type SenalesNoche } from './demanda';
import { calendarioParaPrompt } from '@/lib/calendario-mx';
import {
  AjusteDia, ConfigPrecios, MARCA_VUELVE_A_REGLAS, RAZON_FRENO_SEMANA, factorPorReglas, factoresAplicados, recortarFactor,
  esCambioGrande, nocheProtegida,
} from '@/lib/precios';
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
 * llena de movimientos que no significan nada. 6 puntos porcentuales desde oct
 * 2026: con 3, varias noches alternaban 1.10 y 1.15 un día sí y otro no.
 */
const UMBRAL_ESTABILIDAD = 0.06;
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
  /** Propuestas pendientes que se quitaron solas (noche llena, o subían una noche protegida de domingo a jueves). */
  descartadas: number;
  modelo: string;
}

/** La tabla que lee la IA, una línea por noche. Exportada para las pruebas. */
export function tablaDeSenales(
  senales: SenalesNoche[],
  factorRegla: Map<string, number>,
  /** Lo que cada noche cobra HOY (factoresAplicados): sin esto la IA no sabe qué puso ayer y baila. */
  cobraHoy: Map<string, number> = new Map(),
): string {
  const signo = (f: number) => { const p = Math.round((f - 1) * 100); return `${p >= 0 ? '+' : ''}${p}%`; };
  const lineas = senales.map(s => {
    const f = factorRegla.get(s.fecha) ?? 1;
    const vend = s.vendidas ?? 0;
    const ota = s.ota ?? 0;
    const bloq = Math.max(0, s.ocupadas - vend - ota);
    return [
      s.fecha,
      DOW[s.dow],
      `d+${s.diasParaLlegada}`,
      `${s.ocupadas >= TOTAL_SUITES ? 'LLENA · ' : ''}ocup ${s.ocupadas}/${TOTAL_SUITES} (vend ${vend} · bloq ${bloq} · ota ${ota})`,
      `nuevas7d ${s.ritmo7d}`,
      `busq7d ${s.busquedas7d}`,
      `sincupo7d ${s.sinCupo7d}`,
      `carritos ${s.intencion}`,
      `reglas ${signo(f)}`,
      `hoy ${signo(cobraHoy.get(s.fecha) ?? 1)}`,
    ].join(' | ');
  });
  return lineas.join('\n');
}

/** Las instrucciones de la IA. Exportada para las pruebas. */
export function construirPrompt(
  config: { pisoPct: number; techoPct: number; iaSubeEntreSemana: boolean },
  medias: { ventaMedia: number; ocupMedia: number },
  calendario: string,
): string {
  // La regla de entre semana sale del interruptor `precios_ia_sube_entre_semana`.
  // El código la hace cumplir igual (`planificarAjustes`); decírsela al modelo
  // solo ahorra propuestas que se iban a tirar. Desde el 17 oct 2026 el freno es
  // solo FUERA de temporada (`nocheProtegida`): en Navidad, Año Nuevo o Semana
  // Santa un martes puede subir como un sábado.
  const extra = [
    ...(config.iaSubeEntreSemana ? [] : [
      'De domingo a jueves FUERA de temporada SOLO puedes BAJAR. El dueño quiere vender esas noches y su rebaja va a propósito: no propongas para ellas nada por encima de lo que dicen las reglas, ni quitar ni reducir su rebaja, aunque veas ventas. El sistema descarta cualquier propuesta que suba una de esas noches. En las noches de domingo a jueves que caen en una temporada que sube (Navidad, Año Nuevo, Semana Santa, puentes) sí puedes proponer subir, con razón.',
    ]),
    'No propongas nada para una noche LLENA: ya no queda nada que vender. El sistema la descarta.',
  ].map((txt, i) => `\n${7 + i}. ${txt}`).join('');
  return `Eres el revenue manager de Paraíso Encantado, un hotel boutique de ${TOTAL_SUITES} habitaciones en Xilitla, Huasteca Potosina, México. Vende sobre todo a familias y parejas del centro del país (CDMX, Monterrey, San Luis Potosí, Querétaro, Guadalajara) que llegan en coche.

Tu trabajo: revisar el precio que las reglas del dueño proponen para cada noche y señalar SOLO las noches donde te parezca equivocado, con una razón de una línea.

Datos que recibes por noche (una línea por noche):
- fecha y día de la semana
- d+N: días entre hoy y esa noche
- ocup X/${TOTAL_SUITES} (vend V · bloq B · ota O): habitaciones que ya no se pueden vender esa noche. «vend» son VENTAS de verdad (la web, WhatsApp, teléfono). «bloq» son noches cerradas a mano, que pueden ser una venta por otro canal o un simple cierre: NO las cuentes como demanda. «ota» son noches retenidas por Expedia, canal que el hotel dejó en agosto: pueden ser reservas viejas o retenciones sin huésped, así que tampoco las cuentes como demanda. LLENA = no queda ninguna habitación libre esa noche.
- nuevas7d: reservas que entraron en los últimos 7 días y cubren esa noche (ritmo)
- busq7d: búsquedas de huéspedes en la web que incluían esa noche en los últimos 7 días
- sincupo7d: de esas búsquedas, cuántas no encontraron lugar porque ESA noche estaba llena
- carritos: carritos abandonados pendientes que pedían esa noche
- reglas: el ajuste que ya proponen las reglas del dueño sobre el precio base
- hoy: lo que esa noche cobra HOY (incluye lo que tú ajustaste ayer). Si sigues de acuerdo con un ajuste tuyo, repítelo: si te callas, la noche vuelve a la regla del dueño.

Límites que NO puedes rebasar: el precio nunca baja más de ${Math.abs(config.pisoPct)}% ni sube más de ${config.techoPct}% del precio base. En los próximos 30 días el hotel tiene VENDIDO, en promedio, el ${medias.ventaMedia}% de sus habitaciones por noche (${medias.ocupMedia}% si sumas bloqueos y OTA, que no son demanda).

Reglas de criterio:
1. Este hotel es chico y tiene pocos meses de historia. Con poca señal, NO propongas nada. El silencio es una respuesta válida y preferible.
2. Lo que más justifica subir: ventas reales altas para esa noche (vend), ritmo de reservas fuerte, o búsquedas que no encontraron lugar (sincupo7d > 0). Son datos reales, no corazonadas. Las bloqueadas y las de OTA no son ventas.
3. Para BAJAR tú por debajo de las reglas necesitas lo contrario Y que falte poco: pocas ventas (vend) con d+ pequeño. No propongas bajadas tuyas a más de 30 días. OJO: esto habla solo de bajadas TUYAS. Las rebajas que ya trae la columna «reglas» (por ejemplo, el precio más bajo de domingo a jueves) las puso el dueño a propósito: respetarlas no es bajar, y que falten más de 30 días NUNCA es razón para quitarlas ni reducirlas.
4. El calendario de fechas especiales viene ABAJO, verificado. Úsalo ese y no tu memoria: no inventes puentes, no supongas en qué día de la semana cae una fecha, y no "corrijas" el calendario.
5. NUNCA inventes eventos, clima, competencia ni datos que no estén en la tabla ni en el calendario de abajo. Si no tienes razón, no propongas.
6. No propongas una noche solo porque las reglas ya la movieron bien: solo donde difieras más de 2 puntos porcentuales.${extra}

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
  /**
   * Noches que protege el freno de semana (`nocheProtegida`: domingo a jueves
   * con la rebaja del dueño y sin temporada que suba). Con el interruptor
   * apagado, ahí la IA solo puede bajar. Entra como dato, igual que
   * `factorRegla`, porque sale de las mismas reglas (`analizarDemanda`).
   */
  protegidas: Set<string>;
}

export interface PlanAjustes {
  nuevos: AjusteDia[];
  historial: EntradaHistorial[];
  aplicadas: number;
  propuestas: number;
  ignoradas: number;
  /** Noches que la IA quiso mover apenas y se dejaron como estaban. */
  estables: number;
  /** Propuestas pendientes que se quitaron solas: noche llena, o subían una noche protegida de domingo a jueves. */
  descartadas: number;
}

/**
 * Decide qué entra al calendario. Función PURA: ni Sheets ni modelo, para poder
 * probar las tres decisiones que de verdad importan —qué se aplica solo, qué
 * espera visto bueno y qué no se vuelve a proponer— sin gastar una llamada.
 *
 * Jerarquía: lo fijado a mano gana sobre la IA, y la IA sobre las reglas. Lo
 * que el dueño aprueba queda como fila `manual` (`resolverPropuestas`), así que
 * esta función ya no lo deshace a la mañana siguiente.
 *
 * Dos frenos que no dependen del modelo:
 *  - 🔴 De domingo a jueves FUERA de temporada (`protegidas`) la IA solo puede
 *    BAJAR la regla del dueño, salvo que él encienda
 *    `precios_ia_sube_entre_semana` (`config.iaSubeEntreSemana`). En sus 5
 *    primeros días la IA le quitó el −8% 27 veces en 16 noches. En temporada
 *    (un martes de Navidad) sí puede subir: ahí la demanda es de verdad.
 *  - En una noche LLENA (sin cuartos libres) la IA no propone nada: 7 de las 9
 *    propuestas que esperaban su visto bueno el 13 oct eran de noches 13/13.
 */
export function planificarAjustes(e: EntradaPlanificar): PlanAjustes {
  const { sugerencias, senales, factorRegla, motivoRegla, previos, config, hoy, ahora, rechazos } = e;
  // Sin el dato (una llamada de JS que no lo conoce) no se protege ninguna noche;
  // el tipo lo exige, así que el código de la app siempre lo pasa.
  const protegidas = e.protegidas ?? new Set<string>();

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
  let descartadas = 0;

  const sugPorFecha = new Map(sugerencias.map(s => [s.fecha, s]));

  for (const s of senales) {
    const fecha = s.fecha;
    if (fechasIntocables.has(fecha)) continue;

    const base = factorRegla.get(fecha) ?? 1;
    const sug = sugPorFecha.get(fecha);
    const antes = previoPorFecha.get(fecha);
    // Lo que esa noche COBRABA: una propuesta pendiente cobra la regla
    // (`factorVigente`), no la lista. Antes se ponía 1 y el historial mentía.
    const factorAntes = !antes ? 1
      : antes.estado === 'aplicado' ? antes.factor
      : antes.estado === 'propuesto' ? (antes.factorVigente ?? 1)
      : 1;
    // Sin cuartos libres no hay nada que vender: ni subir ni bajar.
    const llena = s.ocupadas >= TOTAL_SUITES;
    // De domingo a jueves fuera de temporada, con el interruptor apagado, nada
    // por ENCIMA de la regla.
    const soloBajar = !config.iaSubeEntreSemana && protegidas.has(fecha);
    const subeSobreLaRegla = (f: number) => f > base + 1e-9;
    // ¿Esta noche la mandaba un ajuste propio de la IA? Si hoy vuelve a la
    // regla, el historial tiene que decir por qué (y el correo lo cuenta).
    const laPusoLaIA = antes?.origen === 'ia' && antes.estado === 'aplicado';
    /** Por qué la sugerencia de hoy no entró, si no entró. */
    let porQueNo: string | null = null;

    // ── Una propuesta que el dueño todavía no revisa se conserva ──
    // Es una decisión suya pendiente, no ruido del modelo: solo se reemplaza si
    // la IA trae una opinión NUEVA y distinta. Antes caía al camino de abajo y se
    // convertía en una fila de regla, o sea: se perdía sin rastro.
    // Salvo dos casos en que ya no hay nada que decidir y la noche cobra su regla:
    // la noche se llenó, o la propuesta SUBE una noche protegida de domingo a
    // jueves (freno de arriba).
    const caduca = antes?.estado === 'propuesto' && (llena || (soloBajar && subeSobreLaRegla(antes.factor)));
    if (caduca) descartadas++;
    if (antes && antes.estado === 'propuesto' && !caduca) {
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
        // Mientras espera, cobra la regla de HOY (si el dueño cambió su regla,
        // la propuesta pendiente no se queda con la vieja).
        nuevos.push({ ...antes, factorVigente: base });
        if (repiteLoMismo) ignoradas++;
        if (Math.abs(base - factorAntes) > 0.0001) {
          historial.push({ fecha, factorAnterior: factorAntes, factorNuevo: base, origen: 'regla', motivo: `${motivoRegla.get(fecha) || 'Precio de lista'} (mientras decides la propuesta)` });
        }
        continue;
      }
    }

    let factor = base;
    let origen: AjusteDia['origen'] = 'regla';
    let motivo = motivoRegla.get(fecha) || 'Reglas';
    let estado: AjusteDia['estado'] = 'aplicado';

    if (sug) {
      const propuesto = recortarFactor(1 + sug.pct / 100, config);
      const yaRechazado = rechazos.get(fecha);
      // 🔴 Lo que la IA puso ayer, recortado al piso y techo de HOY: si el dueño
      // bajó su techo de +30% a +25%, el +30% de ayer no puede seguir cobrándose
      // solo porque la IA repite su número (con el umbral de 6 puntos, cualquier
      // apretón de menos de 6 se colaba por el camino de la estabilidad).
      const ayer = laPusoLaIA ? recortarFactor(antes!.factor, config) : null;
      // Los dos frenos van PRIMERO, antes que el camino de la estabilidad: así
      // una fila vieja de la IA (el +5% del mar 27 oct) tampoco sobrevive por ahí.
      if (llena) {
        ignoradas++;  // noche sin cuartos libres: la sugerencia no vende nada
        porQueNo = 'la noche está llena (no queda cuarto que vender)';
      } else if (soloBajar && subeSobreLaRegla(propuesto)) {
        ignoradas++;  // de domingo a jueves la noche se queda con la rebaja del dueño
        porQueNo = RAZON_FRENO_SEMANA;
      } else if (yaRechazado !== undefined && Math.abs(propuesto - yaRechazado) < 0.02) {
        ignoradas++;  // ya dijo que no a este número: la noche se queda con las reglas
        porQueNo = 'la IA volvió a pedir algo que ya rechazaste';
      } else if (Math.abs(propuesto - base) < 0.02) {
        ignoradas++;  // coincide con las reglas: no es una sugerencia
        porQueNo = 'la IA ya pide lo mismo que tus reglas';
      } else if (
        ayer !== null && Math.abs(propuesto - ayer) < UMBRAL_ESTABILIDAD &&
        // Lo de ayer solo se conserva si hoy también estaría permitido.
        !(soloBajar && subeSobreLaRegla(ayer))
      ) {
        // Se mueve menos de 6 puntos respecto a lo que ella misma puso: se queda
        // como estaba (dentro de los límites de hoy). El precio solo cambia
        // cuando hay una razón de verdad.
        factor = ayer;
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

    // Una decisión de la IA se guarda AUNQUE sea factor 1 (precio de lista): sin
    // fila, al día siguiente `aplicarReglas` volvía a poner la regla, la IA la
    // volvía a quitar y el precio bailaba a diario (mar 27 oct: 10 cambios en
    // 6 días), y el UMBRAL_ESTABILIDAD nunca la veía.
    if (factor !== 1 || estado === 'propuesto' || origen === 'ia') {
      nuevos.push({
        rowIndex: 0, fecha, factor, origen, motivo, estado, analizadoEn,
        ...(estado === 'propuesto' ? { factorVigente: base } : {}),
      });
    }
    // Al historial lo que cambia el precio cobrado (una propuesta cobra la regla
    // mientras espera), y además toda propuesta que se retira sola: aunque lo
    // cobrado no cambie, sin esa línea desaparecía del panel sin rastro.
    const factorDespues = estado === 'aplicado' ? factor : base;
    const cambia = Math.abs(factorDespues - factorAntes) > 0.0001;
    // En el historial, una noche sin ninguna regla dice lo que cobra: la lista.
    const deRegla = motivoRegla.get(fecha) || 'Precio de lista';
    const fila = { fecha, factorAnterior: factorAntes, factorNuevo: factorDespues };
    if (estado !== 'aplicado') {
      if (cambia) historial.push({ ...fila, origen: 'regla', motivo: `${deRegla} (mientras decides la propuesta)` });
    } else if (origen === 'regla' && antes?.estado === 'propuesto') {
      // Una propuesta pendiente que se fue sola (sin que el dueño contestara).
      const pedia = Math.round((antes.factor - 1) * 100);
      // Si no caducó y la IA trajo un número nuevo, lo que se retiró es la
      // propuesta VIEJA porque la IA cambió de opinión; el freno (o el rechazo)
      // es de lo que pide hoy. Antes una propuesta que BAJABA se retiraba
      // «porque de domingo a jueves la IA solo puede bajar», que era falso.
      const hoyPide = sug ? Math.round(sug.pct) : null;
      const razon = caduca
        ? (llena ? 'la noche se llenó (no queda cuarto que vender)' : RAZON_FRENO_SEMANA)
        : hoyPide !== null && porQueNo
          ? `la IA cambió de opinión (hoy pidió ${hoyPide >= 0 ? '+' : ''}${hoyPide}%) y ${porQueNo}`
          : porQueNo ?? 'ya pedía casi lo mismo que tus reglas';
      historial.push({
        ...fila, origen: 'regla',
        motivo: `${deRegla} (${MARCA_VUELVE_A_REGLAS}: se retiró la propuesta de la IA de ${pedia >= 0 ? '+' : ''}${pedia}% porque ${razon})`,
      });
    } else if (origen === 'regla' && laPusoLaIA && cambia) {
      // La noche tenía un ajuste propio de la IA y hoy vuelve a la regla.
      historial.push({ ...fila, origen: 'regla', motivo: `${deRegla} (${MARCA_VUELVE_A_REGLAS}: ${porQueNo ?? 'la IA ya no pidió su ajuste'})` });
    } else if (cambia) {
      historial.push({ ...fila, origen, motivo });
    }
  }

  // Las noches más allá del horizonte de análisis conservan lo que tenían.
  const ultima = senales[senales.length - 1]?.fecha ?? hoy;
  for (const a of previos) {
    if (a.fecha > ultima && a.fecha >= hoy && !fechasIntocables.has(a.fecha)) nuevos.push(a);
  }

  return { nuevos, historial, aplicadas, propuestas, ignoradas, estables, descartadas };
}

/**
 * Corre el análisis completo y deja el calendario escrito.
 * Las noches fijadas a mano no se tocan nunca; las que la IA no menciona se
 * quedan con lo que digan las reglas.
 *
 * 🔴 Todo lo que lee de la hoja es la versión `…Estricto`: si Google falla al
 * leer, esto LANZA antes de escribir nada (y antes de pagar la llamada al
 * modelo, salvo `previos`, que se lee dentro del candado). La ruta del cron lo
 * atrapa y el correo del día dice «la revisión falló».
 */
export async function analizarDemanda(): Promise<ResultadoIA> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY: la IA no puede analizar.');

  const hoy = mexicoTodayStr();
  // `previos` NO se lee aquí: se lee dentro del candado, después de la llamada
  // al modelo. Leerlo antes abría una ventana de 20-60 s entre la lectura y la
  // escritura (que reescribe la hoja entera), y cualquier clic del panel en ese
  // hueco se perdía completo. Lo de hoy (`ajustesHoy`) es solo para enseñarle
  // a la IA qué cobra cada noche; no se escribe de vuelta.
  const [config, reglas, senales, ajustesHoy] = await Promise.all([
    getConfigPreciosEstricto(),
    getReglasEstricto(),
    construirSenales(hoy, DIAS_ANALISIS),
    getAjustesEstricto(hoy),
  ]);

  // Sin ocupación real no hay análisis: un hotel que se ve vacío por un error de
  // red hace que el modelo recomiende bajar precios. Mejor quedarse con las
  // reglas, que ya se aplicaron, y gritarlo en el log.
  if (!ocupacionFiable()) {
    throw new Error('No se pudo leer la ocupación (la matriz de disponibilidad falló): no se analiza con datos falsos.');
  }

  const senalesReglas = senalesParaReglas(senales);
  const factorRegla = new Map<string, number>();
  const motivoRegla = new Map<string, string>();
  // Las noches que protege el freno de semana, con las MISMAS reglas y señales
  // que el factor: domingo a jueves con la rebaja del dueño y sin temporada que suba.
  const protegidas = new Set<string>();
  for (const s of senales) {
    const r = factorPorReglas(s.fecha, reglas, senalesReglas[s.fecha], config);
    factorRegla.set(s.fecha, r.factor);
    motivoRegla.set(s.fecha, r.aplicadas.join(' + '));
    if (nocheProtegida(s.fecha, r)) protegidas.add(s.fecha);
  }
  // Lo que cada noche cobra hoy, para que la IA vea lo que puso ayer.
  const cobraHoy = new Map(Object.entries(factoresAplicados(ajustesHoy)));

  const prim30 = senales.slice(0, 30);
  const media = (valor: (s: SenalesNoche) => number) => prim30.length
    ? Math.round(prim30.reduce((a, s) => a + valor(s), 0) / prim30.length)
    : 0;
  const medias = { ventaMedia: media(s => s.ventaPct ?? 0), ocupMedia: media(s => s.ocupacionPct) };

  const client = new Anthropic({ apiKey });
  const respuesta = await client.messages.create({
    model: MODELO,
    // 8192 y no 4096: Sonnet 5.5 razona por omisión y el razonamiento cuenta
    // dentro de max_tokens. Con el tope justo, el JSON se cortaba a la mitad y
    // el análisis fallaba en silencio.
    max_tokens: 8192,
    system: construirPrompt(config, medias, calendarioParaPrompt(hoy, DIAS_ANALISIS)),
    messages: [{
      role: 'user',
      content: `Hoy es ${hoy}. Estas son las próximas ${senales.length} noches:\n\n${tablaDeSenales(senales, factorRegla, cobraHoy)}`,
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
    const [previos, rechazos] = await Promise.all([getAjustesEstricto(), getRechazosRecientesEstricto()]);
    const p = planificarAjustes({
      sugerencias, senales, factorRegla, motivoRegla, previos, config, hoy,
      ahora: new Date().toISOString(), rechazos, protegidas,
    });
    await escribirAjustes(p.nuevos);
    return p;
  });
  const { historial, aplicadas, propuestas, ignoradas, estables, descartadas } = plan;

  await logHistorial(historial);
  invalidarCachePrecios();

  console.log(
    `[precios-ia] ${hoy} modelo:${MODELO} noches:${senales.length} ` +
    `sugerencias:${sugerencias.length} aplicadas:${aplicadas} propuestas:${propuestas} ` +
    `estables:${estables} ignoradas:${ignoradas} descartadas:${descartadas} ` +
    `sube-dom-jue:${config.iaSubeEntreSemana ? 'sí' : 'no'}`
  );

  return { revisadas: senales.length, aplicadas, propuestas, ignoradas, estables, descartadas, modelo: MODELO };
}
