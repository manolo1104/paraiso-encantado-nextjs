'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/track';
import StayDateField from '@/components/calendario/StayDateField';
import styles from './HeroDatePicker.module.css';

export default function HeroDatePicker() {
  const router = useRouter();
  // Sin fechas por omisión. Antes arrancaba en «hoy → mañana» (y calculado en
  // UTC: después de las 6 pm de México ya era mañana); quien pulsaba «Ver
  // disponibilidad» sin tocar nada llegaba a /reservar buscando una noche que
  // nunca eligió. El 53% de las sesiones del motor empezaba así (12 oct 2026).
  const [fechas, setFechas] = useState({ checkin: '', checkout: '' });
  const [guests, setGuests] = useState(2);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);

  function handleFechas(v: { checkin: string; checkout: string }) {
    setFechas(v);
    track('seleccionar_fecha', { field: 'rango', checkin: v.checkin, checkout: v.checkout });
  }

  function handleSubmit() {
    if (!fechas.checkin || !fechas.checkout) {
      setCalendarioAbierto(true);
      return;
    }
    track('ir_reservar', { checkin: fechas.checkin, checkout: fechas.checkout, guests });
    router.push(`/reservar?checkin=${fechas.checkin}&checkout=${fechas.checkout}&adults=${guests}`);
  }

  return (
    <div className={styles.picker} role="search" aria-label="Buscar disponibilidad">
      <div className={styles.fields}>
        <StayDateField
          valor={fechas}
          onChange={handleFechas}
          grupo={{ adultos: guests }}
          abierto={calendarioAbierto}
          onAbiertoChange={setCalendarioAbierto}
          etiquetas={{ llegada: 'Check-in', salida: 'Check-out', vacio: 'Elegir fecha' }}
          clases={{
            contenedor: styles.fechas,
            campo: `${styles.field} ${styles.campoFecha}`,
            etiqueta: styles.label,
            valor: styles.valor,
            vacio: styles.valorVacio,
            separador: styles.divider,
          }}
        />

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
