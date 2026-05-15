'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle, AlertTriangle, Loader2, Users, Minus, Plus } from 'lucide-react';

interface Props {
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
  suiteName,
  maxGuests = 8,
  initialCheckin = '',
  initialCheckout = '',
  initialGuests = 2,
  onDatesSelected,
}: Props) {
  const today = new Date().toISOString().split('T')[0];

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

  function handleCheckin(v: string) {
    setCheckin(v);
    setStatus('idle');
    if (v && checkout && v < checkout) checkAvailability(v, checkout);
    if (checkout && v >= checkout) setCheckout('');
  }

  function handleCheckout(v: string) {
    setCheckout(v);
    setStatus('idle');
    if (checkin && v && checkin < v) checkAvailability(checkin, v);
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
        {/* Date inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={labelSx}>Check-in</span>
            <input type="date" value={checkin} min={today}
              onChange={e => handleCheckin(e.target.value)}
              style={inputSx} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={labelSx}>Check-out</span>
            <input type="date" value={checkout} min={checkin || today}
              onChange={e => handleCheckout(e.target.value)}
              style={inputSx} />
          </label>
        </div>

        {/* Personas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={14} style={{ color: '#9a8a74', flexShrink: 0 }} />
          <span style={{ ...labelSx, flex: 1 }}>
            {guests} persona{guests !== 1 ? 's' : ''} <span style={{ color: '#c4b8a8', fontWeight: 400 }}>(máx {maxGuests})</span>
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
const inputSx: React.CSSProperties = {
  padding: '8px 10px', border: '1px solid #d4cec7', borderRadius: 4,
  fontSize: '0.875rem', fontFamily: 'var(--font-jost, sans-serif)',
  background: '#fff', color: '#1a2218', outline: 'none', cursor: 'pointer', width: '100%',
};
const statusBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '8px 12px', background: '#f4f0e8',
  borderRadius: 4, fontSize: '0.78rem', color: '#6a6a58',
  fontFamily: 'var(--font-jost, sans-serif)',
};
