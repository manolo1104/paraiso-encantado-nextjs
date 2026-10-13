'use client';

/**
 * Campo «Llegada / Salida» que abre el calendario de estancia.
 *
 * El mismo en los 4 buscadores (portada, /reservar, ficha de suite y
 * /habitaciones). Cada uno conserva su look: las clases de los botones llegan
 * por `clases`, así el campo se ve como el resto de su barra.
 *
 * El calendario se pinta en un portal sobre todo el sitio: en celular es una
 * hoja que sube desde abajo; en escritorio, una ventana centrada. Un popover
 * anclado se recortaba con el `overflow: hidden` de las barras y del video
 * de la portada.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import StayCalendar, { fechaCorta, type Rango } from './StayCalendar';
import { cargarCalendario, useCalendario } from '@/hooks/useCalendario';
import { mexicoTodayStr } from '@/lib/date-mx';
import type { Grupo } from '@/lib/calendario';
import styles from './calendario.module.css';

export interface ClasesCampo {
  contenedor?: string;
  campo?: string;
  icono?: string;
  /** Envoltura de etiqueta + valor (para barras con ícono a la izquierda). */
  texto?: string;
  etiqueta?: string;
  valor?: string;
  vacio?: string;
  separador?: string;
}

interface Props {
  valor: Rango;
  onChange(v: Rango): void;
  grupo: Grupo;
  /** Control externo de la apertura (p. ej. /reservar lo abre al entrar sin fechas). */
  abierto?: boolean;
  onAbiertoChange?(abierto: boolean): void;
  clases?: ClasesCampo;
  etiquetas?: { llegada?: string; salida?: string; vacio?: string };
  titulo?: string;
  /** Pintar solo el calendario controlado desde fuera, sin los dos botones. */
  sinCampo?: boolean;
  icono?: React.ReactNode;
}

export default function StayDateField({
  valor, onChange, grupo, abierto, onAbiertoChange, clases = {}, etiquetas = {}, titulo, sinCampo, icono,
}: Props) {
  const [abiertoLocal, setAbiertoLocal] = useState(false);
  const estaAbierto = abierto ?? abiertoLocal;
  const [montado, setMontado] = useState(false);
  const [hoy, setHoy] = useState('');
  const disparadorRef = useRef<HTMLButtonElement | null>(null);
  const hojaRef = useRef<HTMLDivElement>(null);
  const { cal, estado } = useCalendario(estaAbierto);

  useEffect(() => { setMontado(true); }, []);

  const cambiarAbierto = useCallback((v: boolean) => {
    if (abierto === undefined) setAbiertoLocal(v);
    onAbiertoChange?.(v);
  }, [abierto, onAbiertoChange]);

  // «Hoy» en hora de México, calculado al abrir (una pestaña abierta desde
  // ayer no debe ofrecer como llegada una noche que ya pasó).
  useEffect(() => {
    if (!estaAbierto) return;
    setHoy(mexicoTodayStr());
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, [estaAbierto]);

  // Escape cierra; Tab no se sale de la hoja mientras está abierta.
  useEffect(() => {
    if (!estaAbierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab' || !hojaRef.current) return;
      const focos = hojaRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (focos.length === 0) return;
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estaAbierto]);

  function abrir(e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) disparadorRef.current = e.currentTarget;
    cambiarAbierto(true);
  }

  function cerrar() {
    cambiarAbierto(false);
    // Devolver el foco a quien abrió (teclado y lectores de pantalla).
    requestAnimationFrame(() => disparadorRef.current?.focus());
  }

  function completo(v: Rango) {
    onChange(v);
    // Un respiro para que se vea el rango marcado antes de cerrar.
    window.setTimeout(cerrar, 260);
  }

  const vacio = etiquetas.vacio ?? 'Elegir fecha';

  function contenidoCampo(etiqueta: string, fecha: string) {
    const texto = (
      <>
        <span className={clases.etiqueta}>{etiqueta}</span>
        <span className={fecha ? clases.valor : (clases.vacio ?? clases.valor)}>
          {fecha ? fechaCorta(fecha) : vacio}
        </span>
      </>
    );
    return (
      <>
        {icono ? <span className={clases.icono} aria-hidden="true">{icono}</span> : null}
        {clases.texto ? <span className={clases.texto}>{texto}</span> : texto}
      </>
    );
  }

  return (
    <>
      {!sinCampo && (
        <div className={clases.contenedor}>
          <button
            type="button"
            className={clases.campo}
            onClick={abrir}
            onPointerEnter={() => { cargarCalendario(); }}
            onFocus={() => { cargarCalendario(); }}
            aria-haspopup="dialog"
          >
            {contenidoCampo(etiquetas.llegada ?? 'Llegada', valor.checkin)}
          </button>
          {clases.separador ? <span className={clases.separador} aria-hidden="true" /> : null}
          <button
            type="button"
            className={clases.campo}
            onClick={abrir}
            onPointerEnter={() => { cargarCalendario(); }}
            aria-haspopup="dialog"
          >
            {contenidoCampo(etiquetas.salida ?? 'Salida', valor.checkout)}
          </button>
        </div>
      )}

      {montado && estaAbierto && hoy && createPortal(
        <div className={styles.capa} onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
          <div
            className={styles.hoja}
            ref={hojaRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendario-titulo"
          >
            <StayCalendar
              valor={valor}
              onCompleto={completo}
              onCerrar={cerrar}
              grupo={grupo}
              cal={cal}
              estado={estado}
              hoy={hoy}
              titulo={titulo}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
