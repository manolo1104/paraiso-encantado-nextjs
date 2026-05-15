'use client';

import { useState } from 'react';
import { CalendarDays, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  suiteName: string;
  onDatesSelected: (checkin: string, checkout: string) => void;
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

export default function SuiteDatePicker({ suiteName, onDatesSelected }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'available' | 'unavailable'>('idle');

  async function checkAvailability(ci: string, co: string) {
    if (!ci || !co || ci >= co) return;
    setStatus('loading');
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
        if (avail) onDatesSelected(ci, co);
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
        background: '#1a2e1a', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <CalendarDays size={15} style={{ color: '#c9a97a', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-jost, sans-serif)',
          fontSize: '0.78rem', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#f5f0e8',
        }}>
          Selecciona tus fechas
        </span>
      </div>

      {/* Date inputs */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9a8a74', fontFamily: 'var(--font-jost, sans-serif)' }}>
              Check-in
            </span>
            <input
              type="date"
              value={checkin}
              min={today}
              onChange={e => handleCheckin(e.target.value)}
              style={{
                padding: '9px 10px', border: '1px solid #d4cec7',
                borderRadius: 4, fontSize: '0.875rem',
                fontFamily: 'var(--font-jost, sans-serif)',
                background: '#fff', color: '#1a2218', outline: 'none',
                cursor: 'pointer',
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9a8a74', fontFamily: 'var(--font-jost, sans-serif)' }}>
              Check-out
            </span>
            <input
              type="date"
              value={checkout}
              min={checkin || today}
              onChange={e => handleCheckout(e.target.value)}
              style={{
                padding: '9px 10px', border: '1px solid #d4cec7',
                borderRadius: 4, fontSize: '0.875rem',
                fontFamily: 'var(--font-jost, sans-serif)',
                background: '#fff', color: '#1a2218', outline: 'none',
                cursor: 'pointer',
              }}
            />
          </label>
        </div>

        {/* Nights summary */}
        {checkin && checkout && checkin < checkout && (
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#6a6a58', fontFamily: 'var(--font-jost, sans-serif)', textAlign: 'center' }}>
            {fmt(checkin)} → {fmt(checkout)} · <strong>{nights} noche{nights !== 1 ? 's' : ''}</strong>
          </p>
        )}

        {/* Availability status */}
        {status === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: '#f4f0e8', borderRadius: 4, fontSize: '0.78rem', color: '#6a6a58', fontFamily: 'var(--font-jost, sans-serif)' }}>
            <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            Verificando disponibilidad…
          </div>
        )}
        {status === 'available' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: '#e6f4e8', borderRadius: 4, fontSize: '0.78rem', color: '#1a6b22', fontFamily: 'var(--font-jost, sans-serif)', fontWeight: 500 }}>
            <CheckCircle size={13} style={{ flexShrink: 0 }} />
            ¡Disponible! Confirma tu reserva abajo.
          </div>
        )}
        {status === 'unavailable' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 12px', background: '#fde8e8', borderRadius: 4, fontSize: '0.78rem', color: '#8a1a1a', fontFamily: 'var(--font-jost, sans-serif)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <strong>Ocupada en esas fechas.</strong>
            </div>
            <span>Prueba otras fechas o elige una suite similar abajo.</span>
          </div>
        )}
      </div>
    </div>
  );
}
