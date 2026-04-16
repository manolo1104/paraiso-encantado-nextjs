'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/track';
import styles from './HeroDatePicker.module.css';

export default function HeroDatePicker() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkin, setCheckin] = useState(today);
  const [checkout, setCheckout] = useState(tomorrow);
  const [guests, setGuests] = useState(2);

  function handleCheckinChange(value: string) {
    setCheckin(value);
    let newCheckout = checkout;
    if (value >= checkout) {
      const next = new Date(value);
      next.setDate(next.getDate() + 1);
      newCheckout = next.toISOString().split('T')[0];
      setCheckout(newCheckout);
    }
    track('seleccionar_fecha', { field: 'checkin', checkin: value, checkout: newCheckout });
  }

  function handleCheckoutChange(value: string) {
    setCheckout(value);
    track('seleccionar_fecha', { field: 'checkout', checkin, checkout: value });
  }

  function handleSubmit() {
    track('ir_reservar', { checkin, checkout, guests });
    router.push(`/reservar?checkin=${checkin}&checkout=${checkout}&adults=${guests}`);
  }

  return (
    <div className={styles.picker} role="search" aria-label="Buscar disponibilidad">
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Check-in</span>
          <input
            type="date"
            className={styles.input}
            value={checkin}
            min={today}
            onChange={(e) => handleCheckinChange(e.target.value)}
            aria-label="Fecha de llegada"
          />
        </label>

        <div className={styles.divider} aria-hidden="true" />

        <label className={styles.field}>
          <span className={styles.label}>Check-out</span>
          <input
            type="date"
            className={styles.input}
            value={checkout}
            min={checkin ? (() => { const d = new Date(checkin); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() : tomorrow}
            onChange={(e) => handleCheckoutChange(e.target.value)}
            aria-label="Fecha de salida"
          />
        </label>

        <div className={styles.divider} aria-hidden="true" />

        <label className={styles.field}>
          <span className={styles.label}>Personas</span>
          <select
            className={styles.select}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            aria-label="Número de personas"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
            ))}
          </select>
        </label>
      </div>

      <button className={styles.btn} onClick={handleSubmit} aria-label="Ver disponibilidad">
        Ver disponibilidad
      </button>
    </div>
  );
}
