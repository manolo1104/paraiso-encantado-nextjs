'use client';

/**
 * Calendario de estancia: cada noche enseña si hay lugar y desde cuánto.
 *
 * Hecho en casa, sin librerías (decisión del dueño, 12 oct 2026). Reemplaza
 * los <input type="date"> de los 4 buscadores: con esos el huésped elegía a
 * ciegas y el 43% de las búsquedas acababa en «Estamos llenos».
 *
 * Reglas de selección:
 *  - 1.er toque = llegada (solo en una noche con lugar).
 *  - 2.º toque, después de la llegada y antes del límite = salida. Una noche
 *    llena SÍ puede ser día de salida (esa noche ya no se duerme ahí).
 *  - Tocar antes de la llegada, o más allá del límite, vuelve a empezar desde
 *    ahí (y se avisa por qué en voz alta para lectores de pantalla).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  CALENDARIO_DIAS,
  MAX_NOCHES,
  desdeEstancia,
  diasEntre,
  infoNoche,
  limiteSalida,
  sePuedeLlegar,
  type DatosCalendario,
  type Grupo,
} from '@/lib/calendario';
import { BOOKING_ROOMS } from '@/lib/booking';
import { sumarDias } from '@/lib/precios';
import type { EstadoCalendario } from '@/hooks/useCalendario';
import { nochesMasBaratas } from './entreSemana';
import styles from './calendario.module.css';

export interface Rango {
  checkin: string;
  checkout: string;
}

interface Props {
  valor: Rango;
  onCompleto(v: Rango): void;
  onCerrar(): void;
  grupo: Grupo;
  cal: DatosCalendario | null;
  estado: EstadoCalendario;
  hoy: string;
  titulo?: string;
}

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MESES_INICIALES = 4;

export function formatoPrecio(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

/** Solo la primera letra: «octubre de 2026» → «Octubre de 2026» (CSS capitalize daba «De»). */
function mayuscula(t: string): string {
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

export function fechaCorta(f: string): string {
  if (!f) return '';
  return mayuscula(new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }));
}

function fechaLarga(f: string): string {
  return new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Primer día de cada mes desde el mes de `hoy`, `n` meses. */
function meses(hoy: string, n: number): string[] {
  const [y, m] = hoy.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
  });
}

/** Celdas del mes (null = hueco antes del día 1), con la semana empezando en lunes. */
function celdasDelMes(primero: string): (string | null)[] {
  const [y, m] = primero.split('-').map(Number);
  const dias = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // lunes = 0
  const out: (string | null)[] = Array(dow).fill(null);
  for (let d = 1; d <= dias; d++) out.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  return out;
}

export default function StayCalendar({ valor, onCompleto, onCerrar, grupo, cal, estado, hoy, titulo }: Props) {
  const [sel, setSel] = useState<Rango>(valor);
  const [aviso, setAviso] = useState('');
  const [nMeses, setNMeses] = useState(MESES_INICIALES);
  const cuerpoRef = useRef<HTMLDivElement>(null);

  // Datos vacíos mientras carga: la rejilla se pinta igual (sin precios) y se
  // puede elegir; nunca se bloquea al huésped por una descarga lenta.
  // Memorizado para que los cálculos de abajo no se repitan en cada render.
  const datos: DatosCalendario = useMemo(
    () => (cal && cal.desde ? cal : { desde: hoy, libres: null, factores: {} }),
    [cal, hoy],
  );
  const cargando = estado === 'cargando';

  const limite = useMemo(
    () => (sel.checkin && !sel.checkout ? limiteSalida(datos, sel.checkin, grupo, hoy) : ''),
    [datos, sel.checkin, sel.checkout, grupo, hoy],
  );

  const totalMeses = Math.min(13, Math.ceil(CALENDARIO_DIAS / 30) + 1);
  const listaMeses = useMemo(() => meses(hoy, Math.min(nMeses, totalMeses)), [hoy, nMeses, totalMeses]);

  // Noches con precio más bajo que el de lista (16 oct 2026: que el huésped
  // VEA cuándo cuesta menos). No se recalcula ningún precio: se compara el
  // mismo «desde» que pinta la celda (ver ./entreSemana.ts). Mientras carga no
  // se marca nada, y sin precios dinámicos no sale ninguna. Depende de los
  // números del grupo y no del objeto: los buscadores lo crean en cada render.
  const finListado = meses(hoy, listaMeses.length + 1)[listaMeses.length];
  const { adultos, menores, suiteId } = grupo;
  const masBaratas = useMemo(
    () => (cargando
      ? new Set<string>()
      : nochesMasBaratas(datos, { adultos, menores, suiteId }, hoy, diasEntre(hoy, finListado))),
    [cargando, datos, adultos, menores, suiteId, hoy, finListado],
  );

  // Abrir en el mes de la llegada elegida (o de la primera noche con lugar).
  useEffect(() => {
    const objetivo = valor.checkin || hoy;
    const mes = objetivo.slice(0, 7);
    const idx = meses(hoy, totalMeses).findIndex((m) => m.startsWith(mes));
    if (idx >= nMeses) setNMeses(idx + 2);
    requestAnimationFrame(() => {
      const el = cuerpoRef.current?.querySelector<HTMLElement>(`[data-mes="${mes}"]`);
      if (el && idx > 0) el.scrollIntoView({ block: 'start' });
      const foco =
        cuerpoRef.current?.querySelector<HTMLButtonElement>(`button[data-fecha="${valor.checkin}"]`) ||
        cuerpoRef.current?.querySelector<HTMLButtonElement>('button[data-fecha]:not([aria-disabled="true"])');
      foco?.focus({ preventScroll: true });
    });
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tocar(f: string) {
    const llegar = sePuedeLlegar(datos, f, grupo, hoy);
    if (!sel.checkin || sel.checkout || f <= sel.checkin) {
      if (!llegar) {
        setAviso(`El ${fechaLarga(f)} ya no hay lugar para llegar. Elige otra noche.`);
        return;
      }
      setSel({ checkin: f, checkout: '' });
      setAviso('Ahora elige tu salida.');
      return;
    }
    // Hay llegada y se está eligiendo la salida.
    if (f > limite) {
      if (llegar) {
        setSel({ checkin: f, checkout: '' });
        setAviso('Entre esas fechas hay una noche sin lugar; empezamos de nuevo desde aquí. Elige tu salida.');
      } else {
        setAviso(`No hay lugar todas las noches hasta el ${fechaLarga(f)}. Elige una salida más cercana.`);
      }
      return;
    }
    const completo = { checkin: sel.checkin, checkout: f };
    setSel(completo);
    setAviso('');
    onCompleto(completo);
  }

  // Teclado: flechas por día y semana, Inicio/Fin de semana, Re/Av Pág por mes.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const actual = (e.target as HTMLElement).dataset?.fecha;
    if (!actual) return;
    const pasos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, PageUp: -30, PageDown: 30 };
    let destino: string | null = null;
    if (e.key in pasos) destino = sumarDias(actual, pasos[e.key]);
    if (e.key === 'Home' || e.key === 'End') {
      const dow = (new Date(`${actual}T12:00:00`).getDay() + 6) % 7;
      destino = sumarDias(actual, e.key === 'Home' ? -dow : 6 - dow);
    }
    if (!destino) return;
    e.preventDefault();
    if (destino < hoy) return;
    const mes = destino.slice(0, 7);
    const idx = meses(hoy, totalMeses).findIndex((m) => m.startsWith(mes));
    if (idx >= nMeses) setNMeses(idx + 1);
    requestAnimationFrame(() => {
      cuerpoRef.current?.querySelector<HTMLButtonElement>(`button[data-fecha="${destino}"]`)?.focus();
    });
  }

  const suite = grupo.suiteId ? BOOKING_ROOMS.find((r) => r.id === grupo.suiteId) : undefined;
  const personas = Math.max(1, (grupo.adultos || 0) + (grupo.menores || 0));
  const noches = sel.checkin && sel.checkout ? diasEntre(sel.checkin, sel.checkout) : 0;
  const total = noches > 0 && cal?.desde ? desdeEstancia(datos, sel.checkin, sel.checkout, grupo) : undefined;

  return (
    <div className={styles.panel}>
      <header className={styles.cabecera}>
        <div>
          <h2 className={styles.titulo} id="calendario-titulo">{titulo || '¿Cuándo vienes?'}</h2>
          <p className={styles.leyenda}>
            {suite
              ? <>Precio por noche de <strong>{suite.name}</strong></>
              : <>Precio por noche desde, para <strong>{personas} {personas === 1 ? 'persona' : 'personas'}</strong></>}
            {estado === 'sin-verificar' || estado === 'error'
              ? <span className={styles.leyendaAviso}> · No pudimos revisar la ocupación; la confirmamos al buscar.</span>
              : null}
          </p>
          {/* Siempre ocupa su renglón (invisible si no hay ninguna): al llegar
              los precios no empuja la rejilla bajo el dedo del huésped. */}
          <p className={`${styles.leyendaBarata} ${masBaratas.size > 0 ? '' : styles.leyendaOculta}`}>
            <span className={styles.muestraBarata} aria-hidden="true">$</span>
            Noches con precio más bajo
          </p>
        </div>
        <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar calendario">
          <X size={20} strokeWidth={1.6} />
        </button>
      </header>

      <div className={styles.semana} aria-hidden="true">
        {DIAS_SEMANA.map((d, i) => <span key={i}>{d}</span>)}
      </div>

      <div className={styles.cuerpo} ref={cuerpoRef} onKeyDown={onKeyDown}>
        {listaMeses.map((primero) => {
          const nombre = mayuscula(new Date(`${primero}T12:00:00`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }));
          return (
            <section key={primero} className={styles.mes} data-mes={primero.slice(0, 7)} aria-label={nombre}>
              <h3 className={styles.mesTitulo}>{nombre}</h3>
              <div className={styles.mesSemana} aria-hidden="true">
                {DIAS_SEMANA.map((d, i) => <span key={i}>{d}</span>)}
              </div>
              <div className={styles.rejilla} role="group" aria-label={nombre}>
                {celdasDelMes(primero).map((f, i) => {
                  if (!f) return <span key={`v${i}`} className={styles.vacio} aria-hidden="true" />;
                  const fuera = diasEntre(hoy, f) >= CALENDARIO_DIAS;
                  const info = infoNoche(datos, f, grupo, hoy);
                  const esLlegada = f === sel.checkin;
                  const esSalida = f === sel.checkout;
                  const enRango = sel.checkin && sel.checkout && f > sel.checkin && f < sel.checkout;
                  const eligiendoSalida = !!sel.checkin && !sel.checkout;
                  // Mientras se elige la salida, las noches hasta el límite se
                  // pueden tocar aunque estén llenas (la última es día de salida).
                  const salidaValida = eligiendoSalida && f > sel.checkin && f <= limite;
                  const pasado = info.estado === 'pasado';
                  const sinLugar = info.estado === 'lleno' || info.estado === 'sinCupo';
                  const apagado = pasado || fuera || (sinLugar && !salidaValida);
                  const lejos = eligiendoSalida && f > limite && !sinLugar && !pasado;
                  const masBarata = !apagado && !sinLugar && masBaratas.has(f);

                  const etiquetaLugar = info.estado === 'lleno'
                    ? (suite ? 'Ocupada' : 'Lleno')
                    : info.estado === 'sinCupo' ? 'Sin cupo' : '';
                  const partesAria = [fechaLarga(f)];
                  if (info.desde && !sinLugar && !pasado) partesAria.push(`desde ${formatoPrecio(info.desde)}`);
                  if (masBarata) partesAria.push('precio más bajo');
                  if (info.quedan) partesAria.push(`quedan ${info.quedan} suites`);
                  if (etiquetaLugar) partesAria.push(etiquetaLugar.toLowerCase());
                  if (esLlegada) partesAria.push('llegada');
                  if (esSalida) partesAria.push('salida');

                  return (
                    <button
                      key={f}
                      type="button"
                      data-fecha={f}
                      className={[
                        styles.dia,
                        apagado ? styles.diaApagado : '',
                        sinLugar ? styles.diaLleno : '',
                        lejos ? styles.diaLejos : '',
                        masBarata ? styles.diaMasBarata : '',
                        enRango ? styles.diaEnRango : '',
                        esLlegada ? styles.diaLlegada : '',
                        esSalida ? styles.diaSalida : '',
                        salidaValida && sinLugar ? styles.diaSoloSalida : '',
                      ].filter(Boolean).join(' ')}
                      aria-disabled={apagado || undefined}
                      aria-pressed={esLlegada || esSalida || undefined}
                      aria-label={partesAria.join(', ')}
                      onClick={() => { if (!pasado && !fuera) tocar(f); }}
                    >
                      <span className={styles.diaNumero}>{Number(f.slice(8))}</span>
                      {pasado || fuera ? null : sinLugar && !salidaValida ? (
                        <span className={styles.diaEtiqueta}>{etiquetaLugar}</span>
                      ) : salidaValida && sinLugar ? (
                        <span className={styles.diaEtiqueta}>Salida</span>
                      ) : cargando ? (
                        <span className={styles.diaPrecioCargando} aria-hidden="true" />
                      ) : info.desde ? (
                        <span className={styles.diaPrecio}>{formatoPrecio(info.desde)}</span>
                      ) : null}
                      {info.quedan && !apagado && !esLlegada && !esSalida ? (
                        <span className={styles.diaQuedan}>Quedan {info.quedan}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        {nMeses < totalMeses && (
          <button type="button" className={styles.masMeses} onClick={() => setNMeses((n) => Math.min(totalMeses, n + 4))}>
            Ver más meses <ChevronDown size={16} strokeWidth={1.6} />
          </button>
        )}
      </div>

      <footer className={styles.pie}>
        <p className={styles.resumen} aria-live="polite">
          {aviso && !(sel.checkin && sel.checkout) ? (
            <span className={styles.resumenAviso}>{aviso}</span>
          ) : sel.checkin && sel.checkout ? (
            <>
              <strong>{fechaCorta(sel.checkin)} → {fechaCorta(sel.checkout)}</strong>
              <span>
                {noches} {noches === 1 ? 'noche' : 'noches'}
                {total ? <> · desde <strong>{formatoPrecio(total)}</strong></> : null}
              </span>
            </>
          ) : sel.checkin ? (
            <span>Llegada <strong>{fechaCorta(sel.checkin)}</strong> · elige tu salida (máx. {MAX_NOCHES} noches)</span>
          ) : (
            <span>Toca tu noche de llegada</span>
          )}
        </p>
        <div className={styles.pieAcciones}>
          {(sel.checkin || sel.checkout) && (
            <button type="button" className={styles.borrar} onClick={() => { setSel({ checkin: '', checkout: '' }); setAviso(''); }}>
              Borrar
            </button>
          )}
          <button
            type="button"
            className={styles.listo}
            onClick={() => (sel.checkin && sel.checkout ? onCompleto(sel) : onCerrar())}
          >
            {sel.checkin && sel.checkout ? 'Listo' : 'Cerrar'}
          </button>
        </div>
      </footer>
    </div>
  );
}
