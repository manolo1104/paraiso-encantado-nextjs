'use client';

import { useCallback, useMemo, useState } from 'react';
import { RefreshCw, Trash2, Plus, Sparkles, Check, X, CalendarDays, CalendarPlus, Wand2, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import {
  BOOKING_ROOMS, calcNights, calcRoomStayTotal, formatMXN, getRoomBasePrice, getRoomNightPrice,
} from '@/lib/booking';
import { AjusteDia, ConfigPrecios, ReglaPrecio, TipoRegla, factoresAplicados } from '@/lib/precios';
import type { ImpactoPrecios } from '@/lib/admin/precios-impacto';
import type { SenalesNoche } from '@/lib/admin/demanda';
import { desglosarNoche, pctDeFactor, type DesgloseNoche } from './desglose';
import styles from './precios.module.css';

export interface HistorialFila {
  cuando: string;
  fecha: string;
  factorAnterior: number;
  factorNuevo: number;
  origen: string;
  motivo: string;
}

export interface DatosPrecios {
  config: ConfigPrecios;
  reglas: ReglaPrecio[];
  ajustes: AjusteDia[];
  historial: HistorialFila[];
  senales: SenalesNoche[];
  hoy: string;
  impacto: ImpactoPrecios;
}

// Suite de referencia del calendario: Jungla, 2 personas ($2,000). Es el precio
// más representativo del hotel (4 de las 5 suites de montaña lo comparten).
//
// 🔴 Y por eso la celda enseña el PORCENTAJE en grande y los pesos en chico: las
// bases van de $1,500 a $2,000 entre las 13 suites, así que "$2,300" solo es
// verdad para Jungla, mientras que "+15%" es verdad para las 13 por construcción.
const SUITE_REF = BOOKING_ROOMS.find(r => r.id === 4)!;
const PRECIO_REF = getRoomBasePrice(SUITE_REF, 2);
const SUITES_ACTIVAS = BOOKING_ROOMS.filter(r => !r.disabled);
const TOTAL_SUITES = SUITES_ACTIVAS.length;

const DOW = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const TIPO_LABEL: Record<TipoRegla, string> = {
  temporada: 'Temporada / puente',
  finde: 'Días de la semana',
  ocupacion: 'Por ocupación',
  ultimahora: 'Última hora vacía',
};

const QUIEN_LABEL: Record<DesgloseNoche['quien'], string> = {
  base: 'Hoy va a tu precio de lista',
  reglas: 'Lo deciden tus reglas',
  ia: 'Lo decidió la IA',
  manual: 'Lo fijaste tú, a mano',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Solo la primera letra: `text-transform: capitalize` dejaba "Octubre De 2026". */
function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** '2026-12-20' → '20 dic 26'. La tabla de reglas imprimía el ISO crudo. */
function fechaCorta(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  if (!y || !m || !d) return fecha || '—';
  return `${d} ${new Date(y, m - 1, d).toLocaleDateString('es-MX', { month: 'short' })} ${String(y).slice(2)}`;
}

function fechaLarga(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  return capitalizar(`${DIAS_LARGO[new Date(y, m - 1, d).getDay()]} ${d} de ${new Date(y, m - 1, d).toLocaleDateString('es-MX', { month: 'long' })} de ${y}`);
}

/** '2026-11-14' → 'vie 14 nov'. Para los chips de propuestas pendientes. */
function fechaChip(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DIAS_LARGO[dt.getDay()].slice(0, 3)} ${d} ${dt.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}`;
}

const REGLA_VACIA = {
  id: '',
  nombre: '',
  tipo: 'temporada' as TipoRegla,
  desde: '',
  hasta: '',
  dias: [] as number[],
  umbral: 0,
  pct: 10,
  prioridad: 1,
  activa: true,
};

export default function PreciosClient({ initial }: { initial: DatosPrecios }) {
  const [config, setConfig] = useState<ConfigPrecios>(initial.config);
  const [reglas, setReglas] = useState<ReglaPrecio[]>(initial.reglas);
  const [ajustes, setAjustes] = useState<AjusteDia[]>(initial.ajustes);
  const [historial, setHistorial] = useState<HistorialFila[]>(initial.historial);
  const [senales, setSenales] = useState<SenalesNoche[]>(initial.senales || []);
  const hoy = initial.hoy;
  // No se refresca con `refrescar()`: se recalcula al recargar la página. Medir
  // el impacto lee TODAS las reservas y no vale ese costo en cada clic.
  const impacto = initial.impacto;

  // Dos pestañas. La de «Sugerencias de la IA» murió: avisar y decidir son
  // tareas de UNA NOCHE, así que viven en el aviso de arriba y en el detalle
  // de cada noche, no en un lugar aparte al que hay que ir.
  const [tab, setTab] = useState<'calendario' | 'reglas'>('calendario');
  const [mesVista, setMesVista] = useState(() => {
    const [y, m] = initial.hoy.split('-').map(Number);
    return { y, m: m - 1 };
  });
  // Los avisos de éxito van en la página y no en un alert() del navegador: el
  // alert tapa la pantalla, obliga a un clic extra y se lleva el mensaje consigo.
  // Los errores sí siguen en alert(), como en el resto del panel.
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [analizando, setAnalizando] = useState(false);

  // La noche seleccionada y, si toca una segunda, la estancia completa. Esto
  // reemplazó al «probador de fechas»: era un formulario aparte con una tabla de
  // 5 columnas por 13 suites, o sea el bloque que peor se veía en el teléfono,
  // y contestaba lo mismo que el calendario que ya estaba en pantalla.
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [salida, setSalida] = useState<string | null>(null);
  const [personas, setPersonas] = useState(2);

  // Editor del ajuste de una noche
  const [pctDia, setPctDia] = useState(0);
  const [motivoDia, setMotivoDia] = useState('');

  // Formulario de regla
  const [formRegla, setFormRegla] = useState<typeof REGLA_VACIA | null>(null);

  // Los límites son constantes que él ya decidió, no una decisión diaria: se
  // leen como una frase y los campos solo aparecen si pulsa «cambiar».
  const [editandoLimites, setEditandoLimites] = useState(false);
  const [piso, setPiso] = useState(String(Math.abs(initial.config.pisoPct)));
  const [techo, setTecho] = useState(String(initial.config.techoPct));
  const [banda, setBanda] = useState(String(initial.config.bandaAutoPct));

  const porFecha = useMemo(() => {
    const m = new Map<string, AjusteDia>();
    for (const a of ajustes) m.set(a.fecha, a);
    return m;
  }, [ajustes]);

  const senalPorFecha = useMemo(() => {
    const m = new Map<string, SenalesNoche>();
    for (const s of senales) m.set(s.fecha, s);
    return m;
  }, [senales]);

  /** Lo que de verdad se cobra: solo los ajustes aplicados. */
  const factores = useMemo(() => factoresAplicados(ajustes), [ajustes]);

  const diasDelMes = useMemo(() => new Date(mesVista.y, mesVista.m + 1, 0).getDate(), [mesVista]);
  const primerDow = useMemo(() => new Date(mesVista.y, mesVista.m, 1).getDay(), [mesVista]);

  /** El «por qué» de una noche. Nunca calcula el precio: solo lo etiqueta. */
  const desglosar = useCallback(
    (fecha: string) => desglosarNoche(fecha, reglas, config, porFecha.get(fecha), factores[fecha] ?? 1),
    [reglas, config, porFecha, factores],
  );

  /** Lo que pagaría un huésped esa noche en cada suite, al precio real de la web. */
  function precioNoche(room: typeof SUITE_REF, fecha: string, conAjuste: boolean): number {
    return getRoomNightPrice(room, personas, fecha, conAjuste ? factores : undefined);
  }

  const detalle = useMemo(() => {
    if (!diaSel) return null;
    const esEstancia = salida !== null && calcNights(diaSel, salida) > 0;
    const noches = esEstancia ? calcNights(diaSel, salida!) : 1;
    let conAjuste = 0;
    for (let i = 0; i < noches; i++) {
      const d = new Date(`${diaSel}T12:00:00`);
      d.setDate(d.getDate() + i);
      if (factores[`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`] !== undefined) conAjuste++;
    }
    const filas = SUITES_ACTIVAS.map(room => {
      // `cabe` no es cosmético: en las suites donde no caben esas personas NO se
      // enseña precio, porque un número ahí invita a cotizar algo imposible.
      const cabe = personas <= room.maxGuests;
      const base = esEstancia
        ? calcRoomStayTotal(room, personas, diaSel, salida!)
        : precioNoche(room, diaSel, false);
      const dinamico = esEstancia
        ? calcRoomStayTotal(room, personas, diaSel, salida!, factores)
        : precioNoche(room, diaSel, true);
      return { id: room.id, nombre: room.name, cabe, base, dinamico, dif: dinamico - base };
    }).sort((a, b) => (a.cabe === b.cabe ? a.dinamico - b.dinamico : a.cabe ? -1 : 1));
    return { esEstancia, noches, conAjuste, filas };
  }, [diaSel, salida, personas, factores]);

  const propuestas = useMemo(
    () => ajustes.filter(a => a.estado === 'propuesto' && a.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [ajustes, hoy],
  );

  /**
   * Las propuestas con lo que cuesta cada decisión, y 🔴 lo que cuesta NO decidir.
   *
   * La hoja guarda UNA fila por noche, así que mientras una propuesta espera, esa
   * noche no tiene fila aplicada y la web cobra el PRECIO BASE: la temporada del
   * dueño no se cobra. Esperar no es neutral, y el panel tiene que decirlo.
   */
  const pendientes = useMemo(() => {
    const filas = propuestas.map(p => {
      const d = desglosar(p.fecha);
      const siApruebas = getRoomNightPrice(SUITE_REF, 2, p.fecha, { [p.fecha]: p.factor });
      const siRechazas = getRoomNightPrice(SUITE_REF, 2, p.fecha, { [p.fecha]: d.factorDeReglas });
      const ahora = getRoomNightPrice(SUITE_REF, 2, p.fecha, factores);
      return { ...p, desglose: d, siApruebas, siRechazas, ahora, pierde: Math.max(0, siRechazas - ahora) };
    });
    return { filas, nochesQuePierden: filas.filter(f => f.pierde > 0).length };
  }, [propuestas, desglosar, factores]);

  function mesAnterior() {
    setMesVista(v => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }));
  }
  function mesSiguiente() {
    setMesVista(v => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }));
  }
  function irAHoy() {
    const [y, m] = hoy.split('-').map(Number);
    setMesVista({ y, m: m - 1 });
  }

  const refrescar = useCallback(async () => {
    // Antes un fallo aquí era invisible: el panel seguía mostrando datos viejos
    // y el dueño creía que su cambio no había servido.
    try {
      const res = await fetch('/api/admin/precios', { cache: 'no-store' });
      if (!res.ok) {
        alert('No se pudieron leer los precios. Lo que ves en pantalla puede estar viejo.');
        return;
      }
      const d: DatosPrecios = await res.json();
      setConfig(d.config);
      setReglas(d.reglas);
      setAjustes(d.ajustes);
      setHistorial(d.historial);
      setSenales(d.senales || []);
    } catch {
      alert('Sin conexión con el servidor. Lo que ves en pantalla puede estar viejo.');
    }
  }, []);

  async function patchConfig(cambios: Partial<ConfigPrecios>) {
    const res = await fetch('/api/admin/precios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    });
    // `.catch` porque un 502 del proxy devuelve HTML y `res.json()` reventaba
    // antes de llegar al alert: el dueño no veía ni el error.
    const d = await res.json().catch(() => null as any);
    if (!res.ok) { alert(d?.error || 'No se pudo guardar.'); return; }
    setConfig(d.config);
    return d.config as ConfigPrecios;
  }

  async function alternarMaestro() {
    const encendiendo = !config.activo;
    setCargando(true);
    const nueva = await patchConfig({ activo: encendiendo });
    setCargando(false);
    if (!nueva) return;
    setAviso(
      encendiendo
        ? 'Precios dinámicos ENCENDIDOS: desde ahora la web cobra el precio del calendario. Las cotizaciones del panel y el bot de WhatsApp siguen con el precio base.'
        : 'Precios dinámicos APAGADOS: la web volvió al precio base de siempre.'
    );
  }

  /**
   * Convierte las reglas en precios.
   *
   * Dejó de ser un botón que él tiene que recordar. Antes, tres avisos distintos
   * le decían «ahora cámbiate de pestaña y pulsa Aplicar mis reglas»: tocaba una
   * regla, no pasaba nada y no había forma de saber por qué. Ahora guardar,
   * borrar o apagar una regla lo encadena solo. Devuelve el resumen para que el
   * aviso cuente lo que PASÓ en vez de encargar una tarea.
   */
  async function aplicarReglasAhora(): Promise<string | null> {
    try {
      const res = await fetch('/api/admin/precios/aplicar', { method: 'POST' });
      const d = await res.json().catch(() => null as any);
      if (!res.ok) { alert(d?.error || 'No se pudieron aplicar las reglas.'); return null; }
      await refrescar();
      const cambiadas = d.cambiadas ?? 0;
      let txt = cambiadas === 0
        ? 'ninguna noche cambió de precio'
        : `${cambiadas} ${cambiadas === 1 ? 'noche cambió' : 'noches cambiaron'} de precio`;
      if ((d.respetadas ?? 0) > 0) {
        txt += `; ${d.respetadas} ${d.respetadas === 1 ? 'quedó' : 'quedaron'} como estaban porque las fijaste a mano o las manda la IA`;
      }
      return txt;
    } catch {
      alert('Error de conexión.');
      return null;
    }
  }

  async function guardarLimites() {
    setCargando(true);
    const nueva = await patchConfig({
      pisoPct: Number(piso),
      techoPct: Number(techo),
      bandaAutoPct: Number(banda),
    });
    if (nueva) {
      setPiso(String(Math.abs(nueva.pisoPct)));
      setTecho(String(nueva.techoPct));
      setBanda(String(nueva.bandaAutoPct));
      const r = await aplicarReglasAhora();
      setEditandoLimites(false);
      setAviso(`Límites guardados${r ? `: ${r}` : ''}.`);
    }
    setCargando(false);
  }

  /** Abre una noche. El segundo toque en una noche posterior arma la estancia. */
  function tocarDia(fecha: string) {
    if (fecha < hoy) return;
    if (diaSel && !salida && fecha > diaSel) { setSalida(fecha); return; }
    setDiaSel(fecha);
    setSalida(null);
    const a = porFecha.get(fecha);
    setPctDia(a && a.estado === 'aplicado' ? pctDeFactor(a.factor) : 0);
    setMotivoDia(a?.origen === 'manual' ? a.motivo : '');
  }

  function cerrarDetalle() {
    setDiaSel(null);
    setSalida(null);
  }

  /** Salta a la noche de una propuesta, aunque esté en otro mes. */
  function irAPropuesta(fecha: string) {
    const [y, m] = fecha.split('-').map(Number);
    setTab('calendario');
    setMesVista({ y, m: m - 1 });
    setSalida(null);
    setDiaSel(fecha);
    const a = porFecha.get(fecha);
    setPctDia(a && a.estado === 'aplicado' ? pctDeFactor(a.factor) : 0);
    setMotivoDia('');
  }

  async function guardarDia(pct: number) {
    if (!diaSel) return;
    setCargando(true);
    try {
      const res = await fetch('/api/admin/precios/dia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: diaSel, pct, motivo: motivoDia }),
      });
      const d = await res.json();
      if (!res.ok) { alert(d?.error || 'No se pudo guardar la noche.'); return; }
      await refrescar();
      cerrarDetalle();
    } catch {
      alert('Error de conexión.');
    } finally {
      setCargando(false);
    }
  }

  async function resolver(fechas: string[], aprobar: boolean) {
    if (fechas.length === 0) return;
    setCargando(true);
    try {
      const res = await fetch('/api/admin/precios/dia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechas, aprobar }),
      });
      if (!res.ok) { alert('No se pudo guardar.'); return; }
      await refrescar();
      setAviso(
        aprobar
          ? `Listo: ${fechas.length} ${fechas.length === 1 ? 'noche aprobada' : 'noches aprobadas'}. Ya cobran lo que proponía la IA.`
          : `Listo: ${fechas.length} ${fechas.length === 1 ? 'noche rechazada' : 'noches rechazadas'}. Vuelven a cobrar lo que dicen tus reglas.`
      );
      // La fila dejó de estar pendiente: el detalle abierto ya no corresponde.
      if (diaSel && fechas.includes(diaSel)) cerrarDetalle();
    } catch {
      alert('Error de conexión: no se guardó.');
    } finally {
      setCargando(false);
    }
  }

  async function analizarAhora() {
    // Estado propio: la corrida tarda 30-60 s y `cargando` es un solo booleano
    // que apaga TODOS los botones de la página sin decir por qué.
    setAnalizando(true);
    try {
      const res = await fetch('/api/admin/precios/analizar', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { alert(d?.error || 'No se pudo analizar.'); return; }
      await refrescar();
      setAviso(
        `Análisis listo: ${d.revisadas ?? 0} noches revisadas · ` +
        `${d.aplicadas ?? 0} aplicadas solas (cambio chico) · ` +
        `${d.propuestas ?? 0} esperando tu visto bueno.` +
        (d.errorIA ? ` Ojo: la IA falló (${d.errorIA}); el calendario quedó con tus reglas.` : '')
      );
    } catch {
      alert('Error de conexión.');
    } finally {
      setAnalizando(false);
    }
  }

  async function sembrarTemporadas() {
    if (!confirm(
      'Voy a escribir las temporadas y puentes de México (Xantolo, Navidad, Año Nuevo, Semana Santa, ' +
      'verano y los 8 puentes oficiales) más la regla de días de semana más baratos.\n\n' +
      'Si ya las sembraste antes, se actualizan: no se duplican. Tus otras reglas no se tocan.\n\n' +
      'Esto NO enciende los precios dinámicos.'
    )) return;
    setCargando(true);
    try {
      const res = await fetch('/api/admin/precios/sembrar', { method: 'POST' });
      const d = await res.json().catch(() => null as any);
      if (!res.ok) { alert(d?.error || 'No se pudieron sembrar las temporadas.'); return; }
      const r = await aplicarReglasAhora();
      setAviso(`Calendario sembrado: ${d.creadas} reglas nuevas y ${d.actualizadas} actualizadas${r ? `; ${r}` : ''}.`);
    } catch {
      alert('Error de conexión: no se sembró nada.');
    } finally {
      setCargando(false);
    }
  }

  async function guardarRegla() {
    if (!formRegla) return;
    setCargando(true);
    try {
      const res = await fetch('/api/admin/precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formRegla),
      });
      const d = await res.json();
      if (!res.ok) { alert(d?.error || 'No se pudo guardar la regla.'); return; }
      setFormRegla(null);
      const r = await aplicarReglasAhora();
      setAviso(`Regla guardada${r ? `: ${r}` : ''}.`);
    } catch {
      alert('Error de conexión: la regla no se guardó.');
    } finally {
      setCargando(false);
    }
  }

  async function borrarRegla(r: ReglaPrecio) {
    if (!confirm(`¿Borrar la regla «${r.nombre}»?`)) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/precios?id=${encodeURIComponent(r.id)}`, { method: 'DELETE' });
      if (!res.ok) { alert('No se pudo borrar.'); return; }
      const msg = await aplicarReglasAhora();
      setAviso(`Regla «${r.nombre}» borrada${msg ? `: ${msg}` : ''}.`);
    } catch {
      alert('Error de conexión: la regla no se borró.');
    } finally {
      setCargando(false);
    }
  }

  async function alternarRegla(r: ReglaPrecio) {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...r, activa: !r.activa }),
      });
      if (!res.ok) { alert('No se pudo cambiar la regla.'); return; }
      const msg = await aplicarReglasAhora();
      setAviso(`«${r.nombre}» ${r.activa ? 'apagada' : 'encendida'}${msg ? `: ${msg}` : ''}.`);
    } catch {
      alert('Error de conexión.');
    } finally {
      setCargando(false);
    }
  }

  const desgloseSel = diaSel ? desglosar(diaSel) : null;
  const propuestaSel = diaSel ? pendientes.filas.find(p => p.fecha === diaSel) : undefined;

  /** Las noches que cubre la estancia seleccionada, para sombrearlas. */
  const nochesEnRango = useMemo(() => {
    if (!diaSel || !salida) return new Set<string>();
    const out = new Set<string>();
    const n = calcNights(diaSel, salida);
    for (let i = 0; i < n; i++) {
      const d = new Date(`${diaSel}T12:00:00`);
      d.setDate(d.getDate() + i);
      out.add(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    return out;
  }, [diaSel, salida]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Precios dinámicos</h1>
          <p className={styles.pageSub}>
            El precio base de cada suite no se toca. Esto lo multiplica noche por noche
            según tus reglas y la demanda real. Solo afecta al motor de reservas de la web.
          </p>
        </div>
        <button className={styles.secondaryBtn} onClick={refrescar} disabled={cargando}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {aviso && (
        <div className={styles.flash} role="status">
          <span>{aviso}</span>
          <button className={styles.flashClose} onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Interruptor maestro ── */}
      <div className={`${styles.masterCard} ${config.activo ? '' : styles.masterOff}`}>
        <div>
          <p className={styles.masterLabel}>
            {config.activo ? 'Precios dinámicos ENCENDIDOS' : 'Precios dinámicos APAGADOS'}
          </p>
          <p className={styles.masterHint}>
            {config.activo
              ? `La web cobra lo que dice el calendario. Nunca baja más de ${Math.abs(config.pisoPct)}% ni sube más de ${config.techoPct}% del precio base.`
              : 'La web cobra los precios base de siempre. Puedes armar tus reglas y revisar el calendario con calma antes de encenderlo.'}
          </p>
        </div>
        <div className={styles.masterActions}>
          <button className={styles.secondaryBtn} onClick={analizarAhora} disabled={cargando || analizando}>
            <Sparkles size={14} /> {analizando ? 'Analizando…' : 'Revisar la demanda'}
          </button>
          <button className={styles.switch} onClick={alternarMaestro} disabled={cargando} aria-pressed={config.activo}>
            <span className={`${styles.switchTrack} ${config.activo ? styles.switchOn : ''}`}>
              <span className={styles.switchKnob} />
            </span>
            {config.activo ? 'Apagar' : 'Encender'}
          </button>
        </div>
      </div>

      {/* ── ¿Esto está ganando dinero? ── */}
      <div className={styles.impactoCard}>
        {impacto.reservas === 0 ? (
          <p className={styles.impactoHint}>
            Todavía no hay ninguna reserva con precio dinámico en los últimos {impacto.dias} días,
            así que no se puede medir nada. En cuanto entre la primera, aquí va a decir cuántos
            pesos cobró de más o de menos que el precio de lista.
            {impacto.sinDato > 0 && ` (${impacto.sinDato} ${impacto.sinDato === 1 ? 'reserva' : 'reservas'} del periodo son anteriores a esta medición o se capturaron a mano.)`}
          </p>
        ) : (
          <>
            <p className={styles.impactoLabel}>Últimos {impacto.dias} días</p>
            <p className={`${styles.impactoCifra} ${impacto.diferencia < 0 ? styles.impactoNeg : ''}`}>
              {impacto.diferencia >= 0 ? '+' : '−'}{formatMXN(Math.abs(impacto.diferencia))}
            </p>
            <p className={styles.impactoHint}>
              {impacto.diferencia >= 0
                ? `Eso cobraste de MÁS que con el precio de lista, repartido en ${impacto.reservas} ${impacto.reservas === 1 ? 'reserva' : 'reservas'} del motor web.`
                : `Eso cobraste de MENOS que con el precio de lista, en ${impacto.reservas} ${impacto.reservas === 1 ? 'reserva' : 'reservas'}. Bajar precios puede ser lo correcto si llenó noches que iban vacías, pero conviene revisarlo.`}
              {impacto.sinDato > 0 && ` No se cuentan ${impacto.sinDato} ${impacto.sinDato === 1 ? 'reserva' : 'reservas'} sin precio dinámico (capturadas a mano o al precio base).`}
            </p>
          </>
        )}
      </div>

      {/*
        ══════════ LO QUE ESPERA SU RESPUESTA ══════════
        Va FUERA de las dos pestañas a propósito: las 14 propuestas de hoy están
        repartidas en cuatro meses distintos, así que como marca en la celda del
        mes que estás viendo, doce de ellas serían invisibles. Los chips las
        traen todas a un solo lugar y cada uno salta a su noche.
      */}
      {propuestas.length > 0 && (
        <div className={styles.pendientes}>
          <div className={styles.pendientesHead}>
            <p className={styles.pendientesLabel}>
              <Flag size={15} />{' '}
              {propuestas.length === 1
                ? 'Una noche espera tu visto bueno'
                : `${propuestas.length} noches esperan tu visto bueno`}
            </p>
            <div className={styles.pendientesBtns}>
              <button className={styles.primaryBtn} onClick={() => resolver(propuestas.map(p => p.fecha), true)} disabled={cargando}>
                <Check size={14} /> Aprobar todas
              </button>
              <button className={styles.secondaryBtn} onClick={() => resolver(propuestas.map(p => p.fecha), false)} disabled={cargando}>
                <X size={14} /> Rechazar todas
              </button>
            </div>
          </div>

          {pendientes.nochesQuePierden > 0 && (
            <p className={styles.pendientesAlerta}>
              🔴 Mientras no contestes, {pendientes.nochesQuePierden === 1
                ? 'una de esas noches cobra'
                : `${pendientes.nochesQuePierden} de esas noches cobran`}{' '}
              tu precio de lista en vez de tu temporada. La hoja guarda una sola fila por
              noche, así que una sugerencia esperando deja esa noche sin tu recargo.
              Aprobar o rechazar, cualquiera de las dos, lo arregla.
            </p>
          )}

          <div className={styles.chipScroll}>
            {pendientes.filas.map(p => (
              <button
                key={p.fecha}
                className={`${styles.chipPend} ${p.pierde > 0 ? styles.chipPendPierde : ''} ${diaSel === p.fecha ? styles.chipPendSel : ''}`}
                onClick={() => irAPropuesta(p.fecha)}
              >
                <span className={styles.chipPendFecha}>{fechaChip(p.fecha)}</span>
                <span className={styles.chipPendDelta}>
                  {p.siApruebas === p.siRechazas
                    ? 'igual que tu regla'
                    : `${p.siApruebas > p.siRechazas ? '+' : '−'}${formatMXN(Math.abs(p.siApruebas - p.siRechazas))}`}
                </span>
                {p.pierde > 0 && <span className={styles.chipPendAviso}>−{formatMXN(p.pierde)} hoy</span>}
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            La IA corre sola cada mañana con tus propios números: ocupación de esa noche,
            reservas de los últimos días y búsquedas que no encontraron lugar. Los cambios de
            hasta {config.bandaAutoPct}% los aplica sola; estos son los grandes.
            Precios de {SUITE_REF.name} para 2 personas.
          </p>
        </div>
      )}

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'calendario' ? styles.tabActive : ''}`} onClick={() => setTab('calendario')}>
          Calendario
        </button>
        <button className={`${styles.tab} ${tab === 'reglas' ? styles.tabActive : ''}`} onClick={() => setTab('reglas')}>
          Mis reglas
        </button>
      </div>

      {/* ══════════ CALENDARIO ══════════ */}
      {tab === 'calendario' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.monthNav}>
              <button className={styles.navBtn} onClick={mesAnterior} aria-label="Mes anterior">
                <ChevronLeft size={16} />
              </button>
              <span className={styles.monthLabel}>{MESES[mesVista.m]} {mesVista.y}</span>
              <button className={styles.navBtn} onClick={mesSiguiente} aria-label="Mes siguiente">
                <ChevronRight size={16} />
              </button>
              <button className={styles.secondaryBtn} onClick={irAHoy}>Hoy</button>
            </div>
          </div>

          {/*
            Un calendario por suite y por mes, en la misma rejilla de
            mini-calendarios que /admin/calendario: así los dos paneles del hotel
            se leen igual. Cada tarjeta enseña SUS propios pesos, que es lo que
            cambia de una suite a otra (las bases van de $1,500 a $2,000); el
            porcentaje es el mismo para las 13 y vive en el pie y en el recibo.
          */}
          <div className={styles.suites}>
            {SUITES_ACTIVAS.map(room => {
              const base = getRoomBasePrice(room, 2);
              return (
                <div key={room.id} className={styles.suiteCal}>
                  <div className={styles.suiteCalHead}>
                    <span className={styles.suiteCalName}>{room.name}</span>
                  </div>
                  <div className={styles.dow}>
                    {DOW.map((d, i) => <span key={i} className={styles.dowCell}>{d}</span>)}
                  </div>
                  <div className={styles.grid}>
                    {Array.from({ length: primerDow }).map((_, i) => (
                      <span key={`b${i}`} className={`${styles.cell} ${styles.cellBlank}`} />
                    ))}
                    {Array.from({ length: diasDelMes }).map((_, i) => {
                      const dia = i + 1;
                      const fecha = `${mesVista.y}-${pad(mesVista.m + 1)}-${pad(dia)}`;
                      const pasado = fecha < hoy;
                      const a = porFecha.get(fecha);
                      const propuesto = a?.estado === 'propuesto';
                      const precio = getRoomNightPrice(room, 2, fecha, factores);
                      // 🔴 Arriba o abajo lo dice el FACTOR, no dividir el precio ya
                      // redondeado: `redondear50` cae distinto en cada suite y con
                      // factor 0.92 Jungla daría −7% y Flor de Liz −8%.
                      const pct = pctDeFactor(factores[fecha] ?? 1);
                      const clases = [
                        styles.cell,
                        pasado ? styles.cellPast : '',
                        diaSel === fecha ? styles.cellSel : '',
                        nochesEnRango.has(fecha) ? styles.cellRango : '',
                        propuesto ? styles.cellProp : '',
                      ].filter(Boolean).join(' ');
                      return (
                        <button
                          key={fecha}
                          className={clases}
                          onClick={() => tocarDia(fecha)}
                          title={
                            propuesto ? `La IA sugiere un cambio para el ${dia}: toca para verlo`
                              : a ? `${a.motivo || 'Ajuste'} (${a.origen})`
                                : 'Tu precio de lista'
                          }
                        >
                          <span className={styles.cellDay}>{dia}</span>
                          <span className={`${styles.cellPesos} ${pct > 0 ? styles.cellUp : pct < 0 ? styles.cellDown : ''}`}>
                            {precio.toLocaleString('es-MX')}
                          </span>
                          {/* La marca de «espera tu respuesta» no puede ser solo color. */}
                          {propuesto && <Flag size={9} className={styles.cellFlag} />}
                        </button>
                      );
                    })}
                  </div>
                  <div className={styles.suiteCalPie}>
                    <span>2 personas</span>
                    <span>{formatMXN(base)}/n de lista</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.hint}>
            Precios para <strong>2 personas</strong>, los mismos que cobra la web. El ajuste de
            cada noche es un porcentaje que comparten las 13 suites, por eso suben y bajan juntas.
            Toca una noche para ver por qué cuesta eso; toca una segunda más adelante para cotizar
            una estancia completa.
          </p>

          {/* ── Detalle de la noche (o de la estancia) ── */}
          {diaSel && detalle && (
            <div className={styles.dayCard}>
              <div className={styles.dayHead}>
                <h3 className={styles.dayTitle}>
                  {detalle.esEstancia
                    ? `${detalle.noches} ${detalle.noches === 1 ? 'noche' : 'noches'}: llegada ${fechaCorta(diaSel)}, salida ${fechaCorta(salida!)}`
                    : fechaLarga(diaSel)}
                </h3>
                <div className={styles.dayHeadBtns}>
                  <label className={styles.personas}>
                    Personas
                    <input
                      type="number" min={1} max={6} value={personas}
                      onChange={e => setPersonas(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
                    />
                  </label>
                  {detalle.esEstancia && (
                    <button className={styles.secondaryBtn} onClick={() => setSalida(null)}>Solo esta noche</button>
                  )}
                  <button className={styles.secondaryBtn} onClick={cerrarDetalle}>Cerrar</button>
                </div>
              </div>

              {/* ── El recibo: «¿por qué cuesta esto?» ── */}
              {!detalle.esEstancia && desgloseSel && (
                <div className={styles.recibo}>
                  <p className={styles.reciboTotal}>
                    Esta noche cobra{' '}
                    <strong>{formatMXN(getRoomNightPrice(SUITE_REF, 2, diaSel, factores))}</strong>{' '}
                    en {SUITE_REF.name}
                    {desgloseSel.factorVigente !== 1 && (
                      <span className={pctDeFactor(desgloseSel.factorVigente) > 0 ? styles.reciboUp : styles.reciboDown}>
                        {' '}({pctDeFactor(desgloseSel.factorVigente) > 0 ? '+' : '−'}
                        {Math.abs(pctDeFactor(desgloseSel.factorVigente))}% sobre tu lista)
                      </span>
                    )}
                  </p>
                  <p className={styles.reciboQuien}>{QUIEN_LABEL[desgloseSel.quien]}</p>

                  {desgloseSel.reglas.length > 0 ? (
                    <ul className={styles.reciboLineas}>
                      {desgloseSel.reglas.map(r => (
                        <li key={r.nombre}>
                          <span>{r.nombre}</span>
                          <span className={r.pct !== null && r.pct > 0 ? styles.reciboUp : styles.reciboDown}>
                            {r.pct === null ? '—' : `${r.pct > 0 ? '+' : ''}${r.pct}%`}
                          </span>
                        </li>
                      ))}
                      {desgloseSel.reglas.length > 1 && (
                        <li className={styles.reciboJuntas}>
                          <span>Juntas</span>
                          <span>{pctDeFactor(desgloseSel.factorDeReglas) > 0 ? '+' : ''}{pctDeFactor(desgloseSel.factorDeReglas)}%</span>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className={styles.reciboNada}>Ninguna de tus reglas cae en esta noche.</p>
                  )}

                  {/* Solo cuando aporta algo. En una noche de reglas el `motivo` es
                      la lista de nombres de esas reglas, o sea la línea de arriba. */}
                  {desgloseSel.motivo && desgloseSel.quien !== 'reglas' && (
                    <p className={styles.reciboMotivo}>«{desgloseSel.motivo}»</p>
                  )}

                  {(desgloseSel.quien === 'ia' || desgloseSel.quien === 'manual') && desgloseSel.reglas.length > 0 && (
                    <p className={styles.reciboHint}>
                      {desgloseSel.quien === 'manual' ? 'Tu ajuste a mano manda' : 'La IA manda'} sobre tus reglas,
                      que pedían {pctDeFactor(desgloseSel.factorDeReglas) > 0 ? '+' : ''}
                      {pctDeFactor(desgloseSel.factorDeReglas)}% ({formatMXN(getRoomNightPrice(SUITE_REF, 2, diaSel, { [diaSel]: desgloseSel.factorDeReglas }))}).
                    </p>
                  )}

                  {desgloseSel.quien === 'manual' && (
                    <button className={styles.secondaryBtn} onClick={() => guardarDia(0)} disabled={cargando}>
                      Volver a automático
                    </button>
                  )}

                  {(() => {
                    const sn = senalPorFecha.get(diaSel);
                    if (!sn) return null;
                    return (
                      <p className={styles.reciboDemanda}>
                        <strong>Demanda:</strong> {sn.ocupadas} de {TOTAL_SUITES} suites ocupadas ({sn.ocupacionPct}%)
                        {' · '}{sn.ritmo7d} {sn.ritmo7d === 1 ? 'reserva' : 'reservas'} nuevas esta semana
                        {' · '}{sn.busquedas7d} {sn.busquedas7d === 1 ? 'búsqueda' : 'búsquedas'}
                        {sn.sinCupo7d > 0 && `, ${sn.sinCupo7d} sin encontrar lugar`}
                        {sn.intencion > 0 && ` · ${sn.intencion} ${sn.intencion === 1 ? 'carrito abandonado' : 'carritos abandonados'}`}
                      </p>
                    );
                  })()}
                </div>
              )}

              {/* ── La propuesta de la IA, decidida aquí mismo ── */}
              {!detalle.esEstancia && propuestaSel && (
                <div className={styles.propCard}>
                  <p className={styles.propLabel}><Flag size={14} /> La IA sugiere un cambio para esta noche</p>
                  <p className={styles.propMotivo}>«{propuestaSel.motivo}»</p>
                  <div className={styles.propComparar}>
                    <div>
                      <span className={styles.propCaso}>Si apruebas</span>
                      <strong>{formatMXN(propuestaSel.siApruebas)}</strong>
                    </div>
                    <div>
                      {/* 🔴 Se compara contra LA REGLA, no contra el precio de lista:
                          comparar contra la lista fue un bug arreglado en la auditoría. */}
                      <span className={styles.propCaso}>Si rechazas</span>
                      <strong>{formatMXN(propuestaSel.siRechazas)}</strong>
                      {desgloseSel && desgloseSel.factorDeReglas !== 1 && <span className={styles.hint}> (tu regla)</span>}
                    </div>
                    <div>
                      <span className={styles.propCaso}>Si no contestas</span>
                      <strong className={propuestaSel.pierde > 0 ? styles.reciboDown : ''}>{formatMXN(propuestaSel.ahora)}</strong>
                      {propuestaSel.pierde > 0 && <span className={styles.propPierde}> −{formatMXN(propuestaSel.pierde)}</span>}
                    </div>
                  </div>
                  <div className={styles.propBtns}>
                    <button className={styles.primaryBtn} onClick={() => resolver([diaSel], true)} disabled={cargando}>
                      <Check size={14} /> Aprobar
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => resolver([diaSel], false)} disabled={cargando}>
                      <X size={14} /> Rechazar
                    </button>
                  </div>
                </div>
              )}

              {/* ── Lo que pagaría cada suite ── */}
              <h4 className={styles.daySub}>
                {detalle.esEstancia
                  ? `Lo que pagaría cada suite por las ${detalle.noches} noches`
                  : 'Lo que pagaría cada suite esta noche'}
                {detalle.conAjuste > 0 && detalle.esEstancia && (
                  <span className={styles.hint}> · {detalle.conAjuste} de {detalle.noches} con ajuste</span>
                )}
              </h4>
              <div className={styles.suiteRows}>
                {detalle.filas.map(f => (
                  <div key={f.id} className={`${styles.suiteRow} ${f.cabe ? '' : styles.suiteRowNo}`}>
                    <span className={styles.suiteRowName}>{f.nombre}</span>
                    {f.cabe ? (
                      <>
                        <span className={styles.suiteRowPrice}>
                          {f.dif !== 0 && <s>{formatMXN(f.base)}</s>}{' '}
                          <strong>{formatMXN(f.dinamico)}</strong>
                        </span>
                        <span className={`${styles.suiteRowDif} ${f.dif > 0 ? styles.reciboUp : f.dif < 0 ? styles.reciboDown : ''}`}>
                          {f.dif === 0 ? '—' : `${f.dif > 0 ? '+' : '−'}${formatMXN(Math.abs(f.dif))}`}
                        </span>
                      </>
                    ) : (
                      <span className={styles.suiteRowPrice}>
                        <span className={styles.pill}>no caben {personas}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className={styles.hint}>
                Son los mismos números que ve el huésped en la web: salen de la misma función que
                cobra el motor de reservas. No incluye desayuno, late check-out ni cancelación flexible.
              </p>

              {/* ── Fijar el precio de esta noche a mano ── */}
              {!detalle.esEstancia && (
                <details className={styles.avanzado}>
                  <summary>Fijar el precio de esta noche a mano</summary>
                  <div className={styles.dayRow}>
                    <label className={`${styles.field} ${styles.fieldNarrow}`}>
                      Ajuste %
                      <input
                        type="number" value={pctDia} step={5}
                        min={config.pisoPct} max={config.techoPct}
                        onChange={e => setPctDia(Number(e.target.value))}
                      />
                    </label>
                    <label className={styles.field} style={{ flex: 1, minWidth: 200 }}>
                      Por qué (lo verás en el historial)
                      <input
                        type="text" value={motivoDia}
                        placeholder="Ej. Puente, boda en el pueblo…"
                        onChange={e => setMotivoDia(e.target.value)}
                      />
                    </label>
                    <span className={styles.preview}>
                      {SUITE_REF.name}: {formatMXN(getRoomNightPrice(SUITE_REF, 2, diaSel, { [diaSel]: 1 + pctDia / 100 }))}
                    </span>
                    <button className={styles.primaryBtn} onClick={() => guardarDia(pctDia)} disabled={cargando}>
                      <Check size={14} /> Fijar esta noche
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => guardarDia(0)} disabled={cargando}>
                      Quitar ajuste
                    </button>
                  </div>
                  <p className={styles.hint}>
                    Una noche fijada a mano gana sobre las reglas y sobre la IA: ya no se vuelve a
                    mover sola hasta que le quites el ajuste.
                  </p>
                </details>
              )}

              {/* ── Lo que cambió en ESTA noche ── */}
              {(() => {
                const suyos = historial.filter(h => h.fecha === diaSel).slice(0, 5);
                if (suyos.length === 0 || detalle.esEstancia) return null;
                return (
                  <div className={styles.histNoche}>
                    <p className={styles.histNocheLabel}>Lo que ha cambiado en esta noche</p>
                    {suyos.map((h, i) => (
                      <p key={i} className={styles.histNocheFila}>
                        <span>{h.cuando}</span>
                        <span>{pctDeFactor(h.factorAnterior)}% → <strong>{pctDeFactor(h.factorNuevo)}%</strong></span>
                        <span>{h.origen === 'ia' ? 'IA' : h.origen === 'manual' ? 'Tú' : 'Reglas'}</span>
                        <span className={styles.histNocheMotivo}>{h.motivo}</span>
                      </p>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* ══════════ MIS REGLAS ══════════ */}
      {tab === 'reglas' && (
        <>
          {/* Los límites son constantes que él ya decidió: una frase, no tres cajitas. */}
          <div className={styles.limitesCard}>
            {!editandoLimites ? (
              <p className={styles.limitesFrase}>
                Nunca baja de <strong>−{Math.abs(config.pisoPct)}%</strong> ni sube de{' '}
                <strong>+{config.techoPct}%</strong> de tu precio de lista. La IA mueve sola hasta{' '}
                <strong>±{config.bandaAutoPct}%</strong>; más que eso te lo pregunta.{' '}
                <button className={styles.linkBtn} onClick={() => setEditandoLimites(true)}>cambiar</button>
              </p>
            ) : (
              <>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    Puede bajar hasta % <input type="number" value={piso} min={0} max={50} onChange={e => setPiso(e.target.value)} />
                  </label>
                  <label className={styles.field}>
                    Puede subir hasta % <input type="number" value={techo} min={0} max={100} onChange={e => setTecho(e.target.value)} />
                  </label>
                  <label className={styles.field}>
                    La IA mueve sola hasta % <input type="number" value={banda} min={0} max={50} onChange={e => setBanda(e.target.value)} />
                  </label>
                </div>
                <p className={styles.hint}>
                  Con estos valores, {SUITE_REF.name} nunca se vendería por menos de{' '}
                  <strong>{formatMXN(getRoomNightPrice(SUITE_REF, 2, hoy, { [hoy]: 1 - Math.abs(Number(piso) || 0) / 100 }))}</strong> ni por más de{' '}
                  <strong>{formatMXN(getRoomNightPrice(SUITE_REF, 2, hoy, { [hoy]: 1 + (Number(techo) || 0) / 100 }))}</strong>.
                </p>
                <div className={styles.formActions}>
                  <button className={styles.secondaryBtn} onClick={() => setEditandoLimites(false)}>Cancelar</button>
                  <button className={styles.primaryBtn} onClick={guardarLimites} disabled={cargando}>Guardar límites</button>
                </div>
              </>
            )}
          </div>

          <div className={styles.toolbar}>
            <h3 className={styles.formTitle} style={{ margin: 0 }}>Tus reglas ({reglas.length})</h3>
            <button className={styles.primaryBtn} onClick={() => setFormRegla({ ...REGLA_VACIA })}>
              <Plus size={14} /> Nueva regla
            </button>
          </div>

          {formRegla && (
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>{formRegla.id ? 'Editar regla' : 'Nueva regla'}</h3>
              <div className={styles.formGrid}>
                <label className={styles.field} style={{ gridColumn: 'span 2' }}>
                  Nombre
                  <input
                    type="text" value={formRegla.nombre}
                    placeholder="Ej. Navidad y Año Nuevo"
                    onChange={e => setFormRegla({ ...formRegla, nombre: e.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  Tipo
                  <select value={formRegla.tipo} onChange={e => setFormRegla({ ...formRegla, tipo: e.target.value as TipoRegla })}>
                    {(Object.keys(TIPO_LABEL) as TipoRegla[]).map(t => (
                      <option key={t} value={t}>{TIPO_LABEL[t]}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  Ajuste %
                  <input
                    type="number" value={formRegla.pct} step={5}
                    onChange={e => setFormRegla({ ...formRegla, pct: Number(e.target.value) })}
                  />
                </label>
                {formRegla.tipo === 'temporada' && (
                  <>
                    <label className={styles.field}>
                      Desde <input type="date" value={formRegla.desde} onChange={e => setFormRegla({ ...formRegla, desde: e.target.value })} />
                    </label>
                    <label className={styles.field}>
                      Hasta (última noche) <input type="date" value={formRegla.hasta} onChange={e => setFormRegla({ ...formRegla, hasta: e.target.value })} />
                    </label>
                    <p className={styles.hint} style={{ gridColumn: 'span 2' }}>
                      «Hasta» es la <strong>última noche</strong> que se cobra con este ajuste, no la
                      fecha de salida. Para Xantolo (31 de oct y 1 de nov) se pone 1 de noviembre.
                    </p>
                  </>
                )}
                {formRegla.tipo === 'ocupacion' && (
                  <label className={styles.field}>
                    Desde qué % ocupado
                    <input type="number" value={formRegla.umbral} min={0} max={100} onChange={e => setFormRegla({ ...formRegla, umbral: Number(e.target.value) })} />
                  </label>
                )}
                {formRegla.tipo === 'ultimahora' && (
                  <label className={styles.field}>
                    Días o menos para la llegada
                    <input type="number" value={formRegla.umbral} min={0} max={30} onChange={e => setFormRegla({ ...formRegla, umbral: Number(e.target.value) })} />
                  </label>
                )}
              </div>

              {formRegla.tipo === 'finde' && (
                <label className={styles.field} style={{ marginBottom: 12 }}>
                  Días que aplica
                  <span className={styles.chips}>
                    {DIAS_LARGO.map((nombre, i) => (
                      <button
                        key={i} type="button"
                        className={`${styles.chip} ${formRegla.dias.includes(i) ? styles.chipOn : ''}`}
                        onClick={() => setFormRegla({
                          ...formRegla,
                          dias: formRegla.dias.includes(i) ? formRegla.dias.filter(d => d !== i) : [...formRegla.dias, i],
                        })}
                      >
                        {nombre}
                      </button>
                    ))}
                  </span>
                </label>
              )}

              <p className={styles.hint}>
                {formRegla.tipo === 'temporada' && 'Sube o baja todas las noches dentro del rango. Es la que más dinero mueve.'}
                {formRegla.tipo === 'finde' && 'Sube o baja según el día de la semana. Viernes y sábado son los candidatos.'}
                {formRegla.tipo === 'ocupacion' && `Solo entra cuando esa noche ya tiene vendido ese porcentaje de las ${TOTAL_SUITES} suites.`}
                {formRegla.tipo === 'ultimahora' && 'Solo entra si falta poco Y la noche sigue por debajo del 50% vendida. Empieza con −5%: es la única regla que puede enseñarle a tu cliente a esperar el descuento.'}
              </p>

              {/* La prioridad sigue decidiendo quién gana entre dos reglas del mismo
                  tipo (y entre las 17 sembradas hay traslapes de verdad: Navidad
                  contra un puente), pero es vocabulario del motor, no suyo. */}
              <details className={styles.avanzado}>
                <summary>Opciones avanzadas</summary>
                <label className={`${styles.field} ${styles.fieldNarrow}`}>
                  Prioridad
                  <input type="number" value={formRegla.prioridad} min={1} max={99} onChange={e => setFormRegla({ ...formRegla, prioridad: Number(e.target.value) })} />
                </label>
                <p className={styles.hint}>
                  Si dos reglas <strong>del mismo tipo</strong> caen en la misma noche, gana la del
                  número más bajo. Entre tipos distintos se multiplican, porque el sábado de Navidad
                  sí es la noche más cara del año.
                </p>
              </details>

              <div className={styles.formActions}>
                <button className={styles.secondaryBtn} onClick={() => setFormRegla(null)}>Cancelar</button>
                <button className={styles.primaryBtn} onClick={guardarRegla} disabled={cargando}>Guardar regla</button>
              </div>
            </div>
          )}

          {reglas.length === 0 ? (
            <div className={styles.empty}>
              <CalendarDays size={26} />
              Todavía no hay ni una regla. Empieza por una temporada: Xantolo, Navidad o Semana
              Santa — o siembra el calendario de México completo desde «Opciones de todas las reglas».
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Regla</th><th>Cuándo</th><th>Ajuste</th><th></th></tr>
                </thead>
                <tbody>
                  {reglas.map(r => (
                    <tr key={r.id} className={r.activa ? '' : styles.inactiva}>
                      <td>
                        <strong>{r.nombre}</strong>
                        {!r.activa && <span className={styles.pill} style={{ marginLeft: 8 }}>apagada</span>}
                      </td>
                      <td>
                        {r.tipo === 'temporada' && `${fechaCorta(r.desde)} → ${fechaCorta(r.hasta)}`}
                        {r.tipo === 'finde' && r.dias.map(d => DIAS_LARGO[d]).join(', ')}
                        {r.tipo === 'ocupacion' && `${r.umbral}% o más vendido`}
                        {r.tipo === 'ultimahora' && `${r.umbral} días o menos para la llegada`}
                      </td>
                      <td className={r.pct > 0 ? styles.reciboUp : styles.reciboDown} style={{ fontWeight: 600 }}>
                        {r.pct > 0 ? '+' : ''}{r.pct}%
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className={styles.chip} onClick={() => alternarRegla(r)} disabled={cargando}>
                          {r.activa ? 'Apagar' : 'Encender'}
                        </button>{' '}
                        <button className={styles.chip} onClick={() => setFormRegla({ ...r })}>Editar</button>{' '}
                        <button className={styles.dangerBtn} onClick={() => borrarRegla(r)} aria-label="Borrar">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <details className={styles.avanzado}>
            <summary>Opciones de todas las reglas</summary>
            <p className={styles.hint}>
              «Sembrar» escribe las fechas de México ya verificadas (Ley Federal del Trabajo +
              calendario escolar de la SEP) con porcentajes conservadores: Xantolo y Semana Santa
              +20%, Navidad +15%, puentes +10% y domingo a jueves −8%. Si ya las sembraste, se
              actualizan: no se duplican.
            </p>
            <div className={styles.formActions}>
              <button className={styles.secondaryBtn} onClick={sembrarTemporadas} disabled={cargando}>
                <CalendarPlus size={14} /> Sembrar temporadas y puentes
              </button>
              <button className={styles.secondaryBtn} onClick={async () => {
                setCargando(true);
                const r = await aplicarReglasAhora();
                setCargando(false);
                if (r) setAviso(`Recalculado: ${r}.`);
              }} disabled={cargando}>
                <Wand2 size={14} /> Recalcular el calendario
              </button>
            </div>
          </details>
        </>
      )}

      {/* ── El historial completo, cerrado: casi siempre se busca por una fecha,
             y eso ya se contesta en el detalle de cada noche. ── */}
      <details className={styles.avanzado}>
        <summary>Últimos cambios de precio ({historial.length})</summary>
        {historial.length === 0 ? (
          <p className={styles.hint}>Todavía no hay movimientos.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Cuándo</th><th>Noche</th><th>Cambio</th><th>Quién</th><th>Motivo</th></tr>
              </thead>
              <tbody>
                {historial.map((h, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: 'nowrap' }}>{h.cuando}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fechaCorta(h.fecha)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {pctDeFactor(h.factorAnterior)}% → <strong>{pctDeFactor(h.factorNuevo)}%</strong>
                    </td>
                    <td>{h.origen === 'ia' ? 'IA' : h.origen === 'manual' ? 'Tú' : 'Reglas'}</td>
                    <td>{h.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </div>
  );
}
