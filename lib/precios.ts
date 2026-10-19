/**
 * precios.ts
 * Precios dinámicos por fecha — LÓGICA PURA, sin I/O.
 *
 * La separación importa: este archivo lo importan tanto componentes de cliente
 * (a través de lib/booking.ts) como el servidor y el cron. Nada de googleapis
 * aquí dentro. Las hojas viven en lib/admin/precios-sheets.ts.
 *
 * El modelo es un FACTOR por noche, compartido por las 13 suites:
 *   precio de la noche = redondear50( precio base de la suite × factor )
 * Un porcentaje respeta la diferencia que ya existe entre una Flor de Liz
 * ($2,000) y unos Lirios ($1,500), y es un solo número por día: lo que el dueño
 * puede leer de un vistazo en el calendario del panel.
 */

// ── Rangos absolutos de cordura ───────────────────────────
// Último filtro contra una celda corrupta en la hoja o un JSON raro de la IA:
// pase lo que pase, el precio de una noche nunca se multiplica por menos de 0.5
// ni por más de 2. El piso/techo que configura el dueño es más estrecho que
// esto y se aplica ANTES, al guardar; esto es solo la red de seguridad.
export const FACTOR_MIN_ABS = 0.5;
export const FACTOR_MAX_ABS = 2;

export type OrigenPrecio = 'regla' | 'ia' | 'manual';
export type EstadoAjuste = 'aplicado' | 'propuesto' | 'rechazado';
export type TipoRegla = 'temporada' | 'finde' | 'ocupacion' | 'ultimahora';

/** Mapa 'YYYY-MM-DD' → factor. Solo trae las fechas que se mueven. */
export type FactoresPorFecha = Record<string, number>;

export interface ReglaPrecio {
  rowIndex: number;
  id: string;
  nombre: string;
  tipo: TipoRegla;
  /** temporada: rango de fechas inclusivo. Vacío en los otros tipos. */
  desde: string;
  hasta: string;
  /**
   * finde: días de la semana que aplica (0 = domingo … 6 = sábado).
   * ocupacion y ultimahora: OPCIONAL — si trae días, la regla solo entra esos
   * días (vacío = todos). Así una rebaja de última hora puede ser solo de lunes
   * a jueves sin tocar un sábado que se vende solo.
   */
  dias: number[];
  /** ocupacion: % de ocupación desde el que aplica. ultimahora: días para la llegada. */
  umbral: number;
  /** +20 sube 20%, -5 baja 5%. */
  pct: number;
  /** Dentro de un mismo tipo gana la de número más chico (1 antes que 2). */
  prioridad: number;
  activa: boolean;
}

export interface AjusteDia {
  rowIndex: number;
  fecha: string;
  factor: number;
  origen: OrigenPrecio;
  motivo: string;
  estado: EstadoAjuste;
  analizadoEn: string;
  /**
   * Solo en filas «propuesto»: el factor de las REGLAS del dueño, que es lo que
   * se cobra mientras él decide. Antes una propuesta pendiente dejaba la noche a
   * precio de lista (la hoja guarda una sola fila por noche): el domingo 25 y el
   * lunes 2 nov perdieron así su −8% sin que nadie lo decidiera.
   * Una propuesta escrita antes de oct 2026 no la trae y cobra lista hasta la
   * siguiente corrida de las reglas, que se la pone (columna G de PreciosDias).
   */
  factorVigente?: number;
}

export interface ConfigPrecios {
  /** Interruptor maestro: apagado = precio base en todo el motor web. */
  activo: boolean;
  /** Cuánto puede BAJAR del precio de hoy, en % (negativo). */
  pisoPct: number;
  /** Cuánto puede SUBIR, en %. */
  techoPct: number;
  /** Hasta cuánto puede separarse la IA de las reglas sin pedir permiso, en %. */
  bandaAutoPct: number;
  /**
   * `precios_ia_sube_entre_semana`. Apagado (lo normal): de domingo a jueves
   * FUERA de temporada (ver `nocheProtegida`) la IA solo puede BAJAR el precio
   * de las reglas, nunca subirlo ni quitarle al dueño su rebaja de semana. En
   * temporada (Navidad, Año Nuevo, Semana Santa…) sí puede subir, como un
   * sábado. Encendido: la IA se porta como hasta oct 2026.
   * Existe porque en sus 5 primeros días la IA le quitó el −8% 27 veces en 16
   * noches, contando bloqueos y noches de Expedia como si fueran ventas.
   */
  iaSubeEntreSemana: boolean;
  /**
   * `precios_semana_cede_a_temporada`. Apagado (lo normal): las rebajas de
   * semana se multiplican con la temporada, como siempre (martes de Navidad =
   * +15% × −8%). Encendido: en una noche que cae dentro de una temporada, las
   * rebajas de semana (días de la semana y última hora) NO entran y manda la
   * temporada sola. Ver `factorPorReglas`.
   */
  semanaCedeATemporada: boolean;
}

export const CONFIG_PRECIOS_DEFAULT: ConfigPrecios = {
  activo: false,
  pisoPct: -15,
  techoPct: 30,
  bandaAutoPct: 10,
  iaSubeEntreSemana: false,
  semanaCedeATemporada: false,
};

/** Señales de demanda de UNA noche, para las reglas que no son de calendario. */
export interface SenalesDia {
  /** % de las 13 suites ya cerradas esa noche (vendidas + bloqueadas + OTA). */
  ocupacionPct?: number;
  /**
   * % de las 13 suites VENDIDAS de verdad (RESERVADO o reserva registrada), sin
   * BLOQUEADO ni OTA. En la matriz, BLOQUEADO es tanto una venta por otro canal
   * como un cierre; contarlo como venta apagaba la rebaja de última hora justo
   * en las noches vacías (mar 27 oct: 8 bloqueadas, 0 vendidas).
   */
  ventaPct?: number;
  /** Días entre hoy y esa noche. */
  diasParaLlegada?: number;
}

// ── Utilidades ────────────────────────────────────────────

/**
 * Día de la semana de 'YYYY-MM-DD' (0 = domingo). Se parsea al mediodía a
 * propósito: `new Date('2026-12-24')` es medianoche UTC, que en México es el
 * día 23 y correría todo el calendario un día.
 */
export function diaSemana(fecha: string): number | null {
  const d = new Date(`${fecha}T12:00:00`);
  return isNaN(d.getTime()) ? null : d.getDay();
}

/**
 * Redondeo a $50: el hotel nunca ha publicado un precio como $1,607.
 *
 * 🔴 El `Math.round(n * 100) / 100` no es adorno. `n` llega de multiplicar en
 * coma flotante y `1500 × 1.15` da 1724.9999999999998: al dividir entre 50 eso
 * cae JUSTO por debajo de .5 y redondeaba hacia abajo, así que una temporada de
 * +15% se cobraba como +13.3% ($1,700 en vez de $1,750) y el hotel perdía $50
 * por noche sin que nada lo delatara. Normalizar a centavos primero lo arregla.
 */
export function redondear50(n: number): number {
  return Math.round(Math.round(n * 100) / 100 / 50) * 50;
}

/** Descarta cualquier factor que no sea un número usable. 1 = sin cambio. */
export function factorSeguro(f: unknown): number {
  const n = typeof f === 'number' ? f : Number(f);
  if (!Number.isFinite(n) || n < FACTOR_MIN_ABS || n > FACTOR_MAX_ABS) return 1;
  return n;
}

/**
 * Recorta un factor al piso y techo que configuró el dueño.
 *
 * Aquí NO se usa `factorSeguro`: su trabajo es descartar basura al LEER (una
 * celda corrupta no debe cobrarse), pero al escribir conviene recortar. Si la IA
 * dice +200%, lo que el dueño quiere es su techo, no que el disparate se
 * convierta en "sin cambio" mientras un +95% sí se recorta: ese escalón
 * escondido hacía que el resultado dependiera de qué tan equivocado estuviera
 * el modelo. Un valor que ni siquiera es número sí vuelve a 1.
 */
export function recortarFactor(factor: number, config: ConfigPrecios): number {
  const min = 1 + Math.min(0, config.pisoPct) / 100;
  const max = 1 + Math.max(0, config.techoPct) / 100;
  const n = typeof factor === 'number' ? factor : Number(factor);
  if (!Number.isFinite(n)) return 1;
  return Math.min(max, Math.max(min, n));
}

/** Precio final de una noche: base × factor, recortado y redondeado a $50. */
export function aplicarFactor(base: number, factor: number, config?: ConfigPrecios): number {
  const f = config ? recortarFactor(factor, config) : factorSeguro(factor);
  return Math.max(0, redondear50(base * f));
}

/** ¿El factor propuesto se separa del de las reglas más de lo permitido? */
export function esCambioGrande(propuesto: number, referencia: number, bandaPct: number): boolean {
  const ref = referencia || 1;
  return Math.abs(propuesto - ref) / ref > Math.abs(bandaPct) / 100;
}

// ── El motor de reglas ────────────────────────────────────

/**
 * ¿Aplica esta regla a esta noche?
 * `temporada` y `finde` solo miran el calendario; `ocupacion` y `ultimahora`
 * necesitan las señales de demanda y se quedan dormidas sin ellas.
 */
function reglaAplica(regla: ReglaPrecio, fecha: string, senales: SenalesDia): boolean {
  if (!regla.activa) return false;
  // `dias` también limita a ocupacion y ultimahora (vacío = todos los días).
  // Las temporadas sembradas traen `dias` vacío, así que no les cambia nada.
  if ((regla.tipo === 'ocupacion' || regla.tipo === 'ultimahora') && regla.dias.length > 0) {
    const dow = diaSemana(fecha);
    if (dow === null || !regla.dias.includes(dow)) return false;
  }
  switch (regla.tipo) {
    case 'temporada':
      if (!regla.desde || !regla.hasta) return false;
      return fecha >= regla.desde && fecha <= regla.hasta;
    case 'finde': {
      const dow = diaSemana(fecha);
      return dow !== null && regla.dias.includes(dow);
    }
    case 'ocupacion':
      return senales.ocupacionPct !== undefined && senales.ocupacionPct >= regla.umbral;
    case 'ultimahora': {
      // Solo si de verdad está vacía: bajar el precio de una noche que ya se
      // está vendiendo sola es regalar dinero. Se mira lo VENDIDO (ventaPct):
      // un BLOQUEADO puede ser un cierre y no dice que la noche se venda sola.
      const vendido = senales.ventaPct ?? senales.ocupacionPct;
      return (
        senales.diasParaLlegada !== undefined &&
        senales.diasParaLlegada >= 0 &&
        senales.diasParaLlegada <= regla.umbral &&
        (vendido === undefined || vendido < 50)
      );
    }
    default:
      return false;
  }
}

export interface ResultadoReglas {
  factor: number;
  /** Nombres de las reglas que entraron, para explicarlo en el panel. */
  aplicadas: string[];
  /**
   * true si esa noche ENTRÓ una rebaja de semana del dueño (días de la semana o
   * última hora, con % negativo) y la temporada que manda no sube (no hay, o es
   * de 0% o menos). Es lo que protege el freno de la IA (`nocheProtegida`): un
   * martes normal con su −8% sí; un martes 22 dic con Navidad +15% no (plan T2,
   * oct 2026). Una «cola de Xantolo» en 0% deja la noche protegida.
   */
  rebajaDelDueno: boolean;
}

/** ¿Es una rebaja de semana? Días de la semana o última hora, con % negativo. */
function esRebajaDeSemana(r: ReglaPrecio): boolean {
  return r.pct < 0 && (r.tipo === 'finde' || r.tipo === 'ultimahora');
}

/**
 * Factor que piden las reglas para una noche.
 *
 * Dentro de un mismo tipo gana UNA sola regla (la de prioridad más baja): dos
 * temporadas que se traslapan no se suman. Entre tipos distintos sí se
 * multiplican, porque el sábado de Navidad es legítimamente la noche más cara
 * del año. El piso y el techo se encargan de que no se vaya de las manos.
 *
 * 🔴 EXCEPCIÓN con interruptor (`config.semanaCedeATemporada`, Config
 * `precios_semana_cede_a_temporada`, APAGADO por omisión): encendido, en una
 * noche que cae dentro de una temporada activa las rebajas de semana (días de
 * la semana y última hora, con % negativo) NO entran y manda la temporada sola.
 * Apagado, se multiplican como siempre: con −8% eso es aceptable (martes de
 * Navidad +5.8%), pero con −15% o −20% el martes de Navidad quedaría casi en
 * lista y el de Semana Santa por DEBAJO (1.2 × 0.8 = 0.96). Cuenta cualquier
 * temporada, también una de 0%: así una «cola de Xantolo» en 0% protege de la
 * rebaja a unas noches que se venden solas.
 */
export function factorPorReglas(
  fecha: string,
  reglas: ReglaPrecio[],
  senales: SenalesDia = {},
  config: ConfigPrecios = CONFIG_PRECIOS_DEFAULT,
): ResultadoReglas {
  const aplican = reglas.filter(r => reglaAplica(r, fecha, senales));
  // `=== true` y no solo truthy: un config viejo sin la llave se porta como hoy.
  const cedeATemporada = config.semanaCedeATemporada === true && aplican.some(r => r.tipo === 'temporada');

  const porTipo = new Map<TipoRegla, ReglaPrecio>();
  for (const regla of aplican) {
    if (cedeATemporada && esRebajaDeSemana(regla)) continue;
    const previa = porTipo.get(regla.tipo);
    if (!previa || regla.prioridad < previa.prioridad) porTipo.set(regla.tipo, regla);
  }
  let factor = 1;
  const aplicadas: string[] = [];
  for (const regla of porTipo.values()) {
    factor *= 1 + regla.pct / 100;
    aplicadas.push(regla.nombre);
  }
  // Solo cuentan las reglas que ganaron en su tipo (las que de verdad entraron).
  const temporada = porTipo.get('temporada');
  const rebajaDelDueno = [...porTipo.values()].some(esRebajaDeSemana) && !(temporada && temporada.pct > 0);
  return { factor: recortarFactor(factor, config), aplicadas, rebajaDelDueno };
}

/**
 * Prefijo del motivo de una propuesta de la IA que el dueño APROBÓ. Al aprobarla
 * queda como fila `manual` para que ni la IA ni las reglas la deshagan a la
 * mañana siguiente; con esta marca el panel la distingue de un ajuste a mano.
 * Vive aquí (lógica pura) porque la usan el panel, que es de cliente, y el motor.
 */
export const MARCA_APROBADO = 'Aprobado:';

/** ¿Esta fila es una propuesta de la IA que el dueño aprobó? */
export function esAprobacion(a: { origen: OrigenPrecio; motivo: string } | undefined | null): boolean {
  return Boolean(a && a.origen === 'manual' && a.motivo.startsWith(MARCA_APROBADO));
}

/**
 * Marca, dentro del motivo del historial, de una noche que la corrida de la IA
 * devolvió a las reglas del dueño (la IA dejó de pedir su ajuste, o un freno se
 * lo quitó). El correo diario la busca para contarlas: antes esos cambios de
 * precio no salían en ninguna parte.
 */
export const MARCA_VUELVE_A_REGLAS = 'volvió a tus reglas';

/**
 * El porqué del freno de semana en el historial y en el correo. Un solo texto
 * para los dos escritores (`planificarAjustes` y `planificarReglas`).
 */
export const RAZON_FRENO_SEMANA = 'de domingo a jueves, fuera de temporada, la IA solo puede bajar';

/** ¿Es noche de domingo a jueves? */
export function esDomingoAJueves(fecha: string): boolean {
  const dow = diaSemana(fecha);
  return dow !== null && dow <= 4;
}

/**
 * ¿Esta noche la protege el freno de semana? De domingo a jueves, con la rebaja
 * de semana del dueño en vigor y sin una temporada que suba (`rebajaDelDueno`).
 * Con `iaSubeEntreSemana` apagado, ahí la IA solo puede BAJAR.
 *
 * Hasta el 17 oct 2026 el freno valía para TODO domingo a jueves, también en
 * temporada: un martes de Navidad, el 27, 28 y 30 dic o el martes de Semana
 * Santa no podían subir aunque se estuvieran llenando, y el plan (T2) decía lo
 * contrario. 🔴 La usan los DOS escritores del calendario: `planificarAjustes`
 * (a través de `protegidas`) y `planificarReglas`, para que digan lo mismo.
 */
export function nocheProtegida(fecha: string, r: Pick<ResultadoReglas, 'rebajaDelDueno'>): boolean {
  return esDomingoAJueves(fecha) && r.rebajaDelDueno;
}

// ── Memoria de los rechazos del dueño ─────────────────────

/**
 * Cuánto dura un "no" del dueño. Una propuesta rechazada no se vuelve a
 * proponer igual durante este tiempo; pasado eso, la demanda ya es otra y la IA
 * tiene derecho a volver a opinar. Sin caducidad la fila viviría para siempre y
 * un rechazo de temporada baja bloquearía la misma fecha el año entrante.
 */
export const DIAS_RECHAZO_VIGENTE = 45;

/**
 * ¿Este rechazo todavía cuenta?
 *
 * Lo usan los DOS escritores del calendario (`aplicarReglas` y
 * `planificarAjustes`) para decidir si la fila se conserva. Tiene que ser la
 * misma respuesta en los dos: si uno la conserva y el otro la borra, el rechazo
 * se olvida en la primera corrida y la IA re-propone lo que el dueño ya dijo
 * que no.
 */
export function esRechazoVigente(a: AjusteDia, ahoraMs: number): boolean {
  if (a.estado !== 'rechazado') return false;
  const t = Date.parse(a.analizadoEn);
  if (!Number.isFinite(t)) return true; // sin fecha legible se respeta: el "no" del dueño no se pierde por una celda rara
  return ahoraMs - t < DIAS_RECHAZO_VIGENTE * 86400000;
}

/**
 * Los factores que el motor web debe cobrar: los ajustes aplicados y, en las
 * noches con una propuesta pendiente, la REGLA del dueño (`factorVigente`), no
 * el precio de lista.
 */
export function factoresAplicados(ajustes: AjusteDia[]): FactoresPorFecha {
  const out: FactoresPorFecha = {};
  for (const a of ajustes) {
    const f = a.estado === 'aplicado' ? factorSeguro(a.factor)
      : a.estado === 'propuesto' && a.factorVigente !== undefined ? factorSeguro(a.factorVigente)
      : 1;
    if (f !== 1) out[a.fecha] = f;
  }
  return out;
}

/**
 * Solo los factores de las noches de esta estancia.
 *
 * Lo que viaja en sessionStorage y en la respuesta del cobro debe ser el precio
 * de ESTA reserva, no el calendario completo del año: así el estado pesa cuatro
 * entradas y comparar "¿cambió el precio?" es exacto.
 */
export function recortarFactores(
  factores: FactoresPorFecha,
  checkin: string,
  checkout: string,
): FactoresPorFecha {
  const out: FactoresPorFecha = {};
  for (const fecha of rangoDeFechas(checkin, checkout)) {
    const f = factorSeguro(factores[fecha]);
    if (f !== 1) out[fecha] = f;
  }
  return out;
}

/** 'YYYY-MM-DD' + n días, sin tocar husos horarios. */
export function sumarDias(fecha: string, n: number): string {
  const d = new Date(`${fecha}T12:00:00`);
  if (isNaN(d.getTime())) return fecha;
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Noches entre dos fechas, inclusivo en `desde` y exclusivo en `hasta`. */
export function rangoDeFechas(desde: string, hasta: string): string[] {
  const out: string[] = [];
  let cursor = desde;
  let guard = 0;
  while (cursor < hasta && guard++ < 1000) {
    out.push(cursor);
    cursor = sumarDias(cursor, 1);
  }
  return out;
}
