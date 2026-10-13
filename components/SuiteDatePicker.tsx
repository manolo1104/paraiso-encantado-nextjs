'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle, AlertTriangle, Loader2, Users, Minus, Plus } from 'lucide-react';
import StayDateField from '@/components/calendario/StayDateField';
import { SUITE_ID_TO_ROOM_ID } from '@/lib/booking';
import styles from './SuiteDatePicker.module.css';

interface Props {
  /** Slug de la suite (data/suites.ts): con él, el calendario enseña SU ocupación y SU precio. */
  suiteId?: string;
  suiteName: string;
  maxGuests?: number;
  initialCheckin?: string;
  initialCheckout?: string;
  initialGuests?: number;
  onDatesSelected: (checkin: string, checkout: string, guests: number) => void;
}

function nightsBetween(a: string, b: string): number {
  return Math.max(0, Math.round(
    (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000
  ));
}

function fmt(d: string) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(day)} ${months[parseInt(m)-1]}`;
}

export default function SuiteDatePicker({
  suiteId,
  suiteName,
  maxGuests = 8,
  initialCheckin = '',
  initialCheckout = '',
  initialGuests = 2,
  onDatesSelected,
}: Props) {
  const [checkin, setCheckin]   = useState(initialCheckin);
  const [checkout, setCheckout] = useState(initialCheckout);
  const [guests, setGuests]     = useState(Math.min(maxGuests, Math.max(1, initialGuests)));
  const [status, setStatus]     = useState<'idle' | 'loading' | 'available' | 'unavailable'>('idle');
  const [autoChecked, setAutoChecked] = useState(false);

  // Auto-check if dates were passed from the listing page (already verified there)
  useEffect(() => {
    if (initialCheckin && initialCheckout && initialCheckin < initialCheckout && !autoChecked) {
      setAutoChecked(true);
      checkAvailability(initialCheckin, initialCheckout, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAvailability(ci: string, co: string, silent = false) {
    if (!ci || !co || ci >= co) return;
    if (!silent) setStatus('loading');
    try {
      const res = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin: ci, checkout: co, rooms: [{ name: suiteName }] }),
      });
      if (res.ok) {
        const d = await res.json();
        const avail = d.unavailableRooms?.length === 0;
        setStatus(avail ? 'available' : 'unavailable');
        if (avail) onDatesSelected(ci, co, guests);
      } else {
        setStatus('idle');
      }
    } catch {
      setStatus('idle');
    }
  }

  // El calendario ya solo deja elegir noches libres de esta suite; la consulta
  // al servidor se conserva como verificación final (apartados de otros
  // huéspedes y reservas que aún no llegan a la matriz).
  function handleRange(v: { checkin: string; checkout: string }) {
    setCheckin(v.checkin);
    setCheckout(v.checkout);
    setStatus('idle');
    if (v.checkin && v.checkout && v.checkin < v.checkout) checkAvailability(v.checkin, v.checkout);
  }

  function changeGuests(delta: number) {
    const next = Math.min(maxGuests, Math.max(1, guests + delta));
    setGuests(next);
    if (status === 'available') onDatesSelected(checkin, checkout, next);
  }

  const nights = nightsBetween(checkin, checkout);

  return (
    <div style={{
      border: '1px solid #e4ddd3',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 16,
      background: '#faf8f5',
      minWidth: 0,
      boxSizing: 'border-box',
      width: '100%',
    }}>
      {/* Header */}
      <div style={{
        background: '#1a2e1a', padding: '11px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <CalendarDays size={14} style={{ color: '#c9a97a', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-jost, sans-serif)',
          fontSize: '0.75rem', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#f5f0e8',
        }}>
          Selecciona fechas y personas
        </span>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Fechas: calendario propio en modo suite (precio y ocupación de ESTA suite) */}
        <StayDateField
          valor={{ checkin, checkout }}
          onChange={handleRange}
          grupo={{ adultos: guests, suiteId: suiteId ? SUITE_ID_TO_ROOM_ID[suiteId] : undefined }}
          titulo={`¿Cuándo vienes a ${suiteName}?`}
          etiquetas={{ llegada: 'Check-in', salida: 'Check-out', vacio: 'Elegir fecha' }}
          clases={{
            contenedor: styles.fechas,
            campo: styles.campo,
            etiqueta: styles.etiqueta,
            valor: styles.valor,
            vacio: styles.vacio,
          }}
        />

        {/* Personas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={14} style={{ color: '#9a8a74', flexShrink: 0 }} />
          <span style={{ ...labelSx, flex: 1 }}>
            {guests} persona{guests !== 1 ? 's' : ''} <span style={{ color: '#7a6e60', fontWeight: 400 }}>(máx {maxGuests})</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #d4cec7', borderRadius: 4, overflow: 'hidden' }}>
            <button onClick={() => changeGuests(-1)} disabled={guests <= 1}
              style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: guests > 1 ? 'pointer' : 'not-allowed', color: guests > 1 ? '#1a2218' : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Minus size={13} />
            </button>
            <span style={{ minWidth: 24, textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#1a2218', fontFamily: 'var(--font-jost, sans-serif)' }}>
              {guests}
            </span>
            <button onClick={() => changeGuests(1)} disabled={guests >= maxGuests}
              style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: guests < maxGuests ? 'pointer' : 'not-allowed', color: guests < maxGuests ? '#1a2218' : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Nights summary */}
        {checkin && checkout && checkin < checkout && (
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#6a6a58', fontFamily: 'var(--font-jost, sans-serif)', textAlign: 'center' }}>
            {fmt(checkin)} → {fmt(checkout)} · <strong>{nights} noche{nights !== 1 ? 's' : ''}</strong>
          </p>
        )}

        {/* Status */}
        {status === 'loading' && (
          <div style={statusBase}>
            <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            Verificando disponibilidad…
          </div>
        )}
        {status === 'available' && (
          <div style={{ ...statusBase, background: '#e6f4e8', color: '#1a6b22', fontWeight: 500 }}>
            <CheckCircle size={13} style={{ flexShrink: 0 }} />
            ¡Disponible! Confirma tu reserva abajo.
          </div>
        )}
        {status === 'unavailable' && (
          <div style={{ ...statusBase, background: '#fde8e8', color: '#8a1a1a', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <strong>Ocupada en esas fechas.</strong>
            </div>
            <span style={{ fontSize: '0.72rem' }}>Prueba otras fechas o elige una suite similar abajo.</span>
          </div>
        )}
      </div>
    </div>
  );
}

const labelSx: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: '#9a8a74',
  fontFamily: 'var(--font-jost, sans-serif)',
};
const statusBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '8px 12px', background: '#f4f0e8',
  borderRadius: 4, fontSize: '0.78rem', color: '#6a6a58',
  fontFamily: 'var(--font-jost, sans-serif)',
};
