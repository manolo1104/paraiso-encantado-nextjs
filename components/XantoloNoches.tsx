'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import styles from './XantoloSection.module.css';

const NOCHES = [
  { fecha: '2026-10-31', dia: '31', mes: 'oct', semana: 'sábado' },
  { fecha: '2026-11-01', dia: '1', mes: 'nov', semana: 'domingo' },
  { fecha: '2026-11-02', dia: '2', mes: 'nov', semana: 'lunes' },
];

function nocheSiguiente(fecha: string) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Disponibilidad REAL de cada noche, de la misma hoja que usa el motor de reservas.
// /api/fully-booked-dates devuelve las noches con las 13 suites ocupadas. Si la hoja
// falla, esa ruta responde una lista vacía; como en seis meses siempre hay alguna
// noche llena, una lista vacía se trata como «no sé» y no se anuncia nada. Prometer
// «hay suites» sin saberlo sería peor que no decir nada.
export default function XantoloNoches() {
  const [llenas, setLlenas] = useState<Set<string> | null>(null);
  const [sinDato, setSinDato] = useState(false);

  useEffect(() => {
    let vivo = true;
    fetch('/api/fully-booked-dates')
      .then((r) => r.json())
      .then((d: { blockedDates?: string[] }) => {
        if (!vivo) return;
        const lista = d.blockedDates ?? [];
        if (lista.length === 0) setSinDato(true);
        else setLlenas(new Set(lista));
      })
      .catch(() => vivo && setSinDato(true));
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <ul className={styles.noches} aria-label="Noches del Xantolo 2026">
      {NOCHES.map((n, i) => (
        <li key={n.fecha} className={styles.noche} style={{ '--i': i } as CSSProperties}>
          <span className={styles.dia}>{n.dia}</span>
          <span className={styles.mes}>{n.mes}</span>
          <span className={styles.semana}>{n.semana}</span>
          <span className={styles.estado} aria-live="polite">
            {sinDato ? null : llenas === null ? (
              <span className={styles.consultando}>Consultando…</span>
            ) : llenas.has(n.fecha) ? (
              <span className={styles.completo}>Hotel completo</span>
            ) : (
              <Link
                href={`/reservar?checkin=${n.fecha}&checkout=${nocheSiguiente(n.fecha)}&adults=2`}
                className={styles.libre}
              >
                Hay suites
              </Link>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
