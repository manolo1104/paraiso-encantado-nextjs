'use client';

/**
 * «De lunes a jueves desde $X la noche · viernes y sábado desde $Y».
 *
 * Pedido de Manolo (13 oct 2026): vender más de lunes a jueves. El huésped
 * tiene que VER que entre semana sale más barato, pero sin prometerle un
 * precio fijo: esos precios los mueven las reglas y la IA cada mañana. Por eso
 * aquí no hay ni un número escrito a mano. X es el precio por noche más bajo
 * que el calendario enseña de lunes a jueves en las próximas 6 semanas (la
 * suite más barata con lugar, con los precios dinámicos vigentes) y Y, lo
 * mismo en viernes y sábado. Si entre semana deja de salir más barato, o no
 * hay datos, el aviso no sale. Las cuentas viven en
 * components/calendario/entreSemana.ts y no calculan precios: los leen de
 * `infoNoche` → `getRoomNightPrice`, lo mismo que pinta el calendario y que
 * cobra el motor.
 *
 * Dónde vive:
 *  - /reservar, bajo el buscador y SOLO mientras no hay fechas elegidas (la
 *    condición está en la página): el botón abre el calendario de la página.
 *    A quien ya eligió un fin de semana no se le ofrece cambiarlo por uno más
 *    barato: los viernes y sábados normales tienen lugar de sobra y ese cambio
 *    solo le quita dinero al hotel (revisor de negocio, 13 oct).
 *  - Portada, dentro de la franja de PromoStrip, APAGADO con un interruptor
 *    (PromoStrip.tsx): el mismo revisor pidió no poner la tarifa en la portada,
 *    que recibe los anuncios y la ven los clientes de WhatsApp y Booking, hasta
 *    que Manolo decida. Encendido, «Ver fechas» abre ahí mismo el calendario y
 *    al elegir lleva a /reservar con esas fechas (mismo camino y mismos eventos
 *    que el buscador del hero); sin JavaScript, el enlace lleva a /reservar.
 *
 * Sin constantes exportadas a propósito: un Server Component (PromoStrip) lo
 * importa, y una constante de un archivo «use client» le llegaría como
 * [object Object] sin que el build ni tsc avisen.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import StayDateField from '@/components/calendario/StayDateField';
import { formatoPrecio } from '@/components/calendario/StayCalendar';
import { GRUPO_AVISO, resumenEntreSemana } from '@/components/calendario/entreSemana';
import { useCalendario } from '@/hooks/useCalendario';
import { mexicoTodayStr } from '@/lib/date-mx';
import type { Grupo } from '@/lib/calendario';
import { track } from '@/lib/track';
import styles from './EntreSemanaDesde.module.css';

interface Props {
  /** Para medir de dónde viene el clic: 'portada', 'reservar'… */
  origen: string;
  /** 'franja': letra crema sobre la franja verde de la portada. 'claro': tarjeta sobre fondo claro. */
  variante?: 'franja' | 'claro';
  /** Grupo del buscador. Por omisión 2 adultos, el del «Desde $1,500» de la portada. */
  grupo?: Grupo;
  /** Si se pasa, «Ver fechas» abre ESE calendario (el de /reservar) en vez de uno propio. */
  onVerFechas?: () => void;
  /**
   * Pedir los datos solo cuando el aviso se acerca a la pantalla. En la portada
   * la franja queda a varias pantallas del inicio: no tiene caso competir con
   * la carga del hero por algo que la mayoría no llega a ver.
   */
  diferido?: boolean;
}

const SIN_FECHAS = { checkin: '', checkout: '' };

export default function EntreSemanaDesde({
  origen, variante = 'claro', grupo = GRUPO_AVISO, onVerFechas, diferido = false,
}: Props) {
  const router = useRouter();
  const centinelaRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLAnchorElement>(null);
  const [cerca, setCerca] = useState(!diferido);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  // Misma descarga que los buscadores (/api/calendario, compartida y con 2 min
  // de vida): en /reservar no agrega ninguna petición.
  const { cal, estado } = useCalendario(cerca);

  useEffect(() => {
    if (cerca) return;
    const el = centinelaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setCerca(true);
      return;
    }
    // 1,200 px antes de que se vea: cuando llega a la pantalla ya cargó y no
    // empuja lo de abajo frente al huésped.
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setCerca(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px 1200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cerca]);

  const adultos = Math.max(1, grupo.adultos || 1);
  const menores = Math.max(0, grupo.menores || 0);
  const resumen = useMemo(() => {
    // 'sin-verificar' sí sirve (precios sin ocupación, igual que el calendario);
    // 'error' llega sin `desde` y no se enseña nada. Un grupo que no cabe en
    // una sola suite tampoco ve el aviso (ver resumenEntreSemana).
    if (!cal || !cal.desde || estado === 'cargando') return null;
    return resumenEntreSemana(cal, mexicoTodayStr(), { adultos, menores });
  }, [cal, estado, adultos, menores]);

  if (!resumen?.mostrar || resumen.semana === undefined) {
    // Mientras no se acerque, un píxel que el IntersectionObserver pueda vigilar.
    return cerca ? null : <div ref={centinelaRef} className={styles.centinela} aria-hidden="true" />;
  }

  const semana = resumen.semana;
  const finde = resumen.finde;
  const personas = adultos + menores;

  function verFechas(e: React.MouseEvent) {
    track('entre_semana_ver_fechas', { origen, desde: semana, finde: finde ?? null, personas });
    if (onVerFechas) {
      onVerFechas();
      return;
    }
    // Con JavaScript se abre el calendario aquí; sin él, el enlace lleva a /reservar.
    e.preventDefault();
    setCalendarioAbierto(true);
  }

  function alElegir(v: { checkin: string; checkout: string }) {
    track('seleccionar_fecha', { field: 'rango', origen: 'entre_semana', checkin: v.checkin, checkout: v.checkout });
    track('ir_reservar', { checkin: v.checkin, checkout: v.checkout, guests: adultos, origen: 'entre_semana' });
    router.push(`/reservar?checkin=${v.checkin}&checkout=${v.checkout}&adults=${adultos}`);
  }

  function alAbrirOCerrar(abierto: boolean) {
    setCalendarioAbierto(abierto);
    // Devolver el foco al enlace que lo abrió (teclado y lectores de pantalla).
    if (!abierto) requestAnimationFrame(() => botonRef.current?.focus());
  }

  // Dos renglones: lo que se afirma y, abajo y más tenue, contra qué. Así
  // «viernes y sábado desde $1,500» nunca se parte a media frase en el
  // teléfono. El punto oculto es para que el lector de pantalla haga la pausa.
  const linea1 = (
    <span className={styles.linea}>
      De lunes a jueves desde <strong className={styles.precio}>{formatoPrecio(semana)}</strong> la noche
      {personas > 2 ? ` para ${personas} personas` : ''}
      <span className={styles.soloLector}>. </span>
    </span>
  );
  const comparacion = finde !== undefined ? <>Viernes y sábado desde {formatoPrecio(finde)}</> : null;

  // Calendario propio (portada). Va FUERA del enlace o botón: los clics dentro
  // de un portal suben por el árbol de React y volverían a disparar «Ver fechas».
  const calendarioPropio = onVerFechas ? null : (
    <StayDateField
      sinCampo
      valor={SIN_FECHAS}
      onChange={alElegir}
      grupo={{ adultos, menores }}
      abierto={calendarioAbierto}
      onAbiertoChange={alAbrirOCerrar}
    />
  );

  if (variante === 'claro') {
    // Toda la tarjeta es el botón: blanco grande para el dedo, y en el
    // teléfono ocupa dos renglones (no cuatro) antes de los resultados.
    const contenido = (
      <>
        <CalendarDays className={styles.icono} size={16} strokeWidth={1.6} aria-hidden="true" />
        <span className={styles.texto}>
          {linea1}
          <span className={`${styles.linea} ${styles.comparacion}`}>
            {comparacion}
            {comparacion ? ' ' : null}
            <span className={styles.accion}>Ver fechas</span> <span className="pe-arrow" aria-hidden="true">›</span>
          </span>
        </span>
      </>
    );
    return (
      <div className={styles.marcoClaro}>
        {onVerFechas ? (
          <button type="button" className={`${styles.aviso} ${styles.claro}`} onClick={verFechas} aria-haspopup="dialog">
            {contenido}
          </button>
        ) : (
          <a href="/reservar" ref={botonRef} className={`${styles.aviso} ${styles.claro}`} onClick={verFechas} aria-haspopup="dialog">
            {contenido}
          </a>
        )}
        {calendarioPropio}
      </div>
    );
  }

  return (
    <div className={`${styles.aviso} ${styles.franja}`}>
      <p className={styles.texto}>
        {linea1}
        {comparacion ? <span className={`${styles.linea} ${styles.comparacion}`}>{comparacion}</span> : null}
      </p>
      {onVerFechas ? (
        <button type="button" className={styles.boton} onClick={verFechas} aria-haspopup="dialog">
          Ver fechas <span className="pe-arrow" aria-hidden="true">→</span>
        </button>
      ) : (
        <a href="/reservar" ref={botonRef} className={styles.boton} onClick={verFechas} aria-haspopup="dialog">
          Ver fechas <span className="pe-arrow" aria-hidden="true">→</span>
        </a>
      )}
      {calendarioPropio}
    </div>
  );
}
