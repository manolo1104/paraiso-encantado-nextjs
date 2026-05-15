'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, Loader2, Sliders } from 'lucide-react';
import type { Suite } from '@/data/suites';
import HabitacionesClient from './HabitacionesClient';

interface Props {
  groups: Record<string, Suite[]>;
  allSuites: Suite[];
}

type GuestFilter = '' | '1-2' | '3-4' | '5-8';
type SpaFilter = '' | 'spa' | 'no-spa';

export default function AvailabilityFilterClient({ groups, allSuites }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [checkin, setCheckin]   = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests]     = useState<GuestFilter>('');
  const [spa, setSpa]           = useState<SpaFilter>('');
  const [priceMax, setPriceMax] = useState(3000);
  const [checking, setChecking] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [checked, setChecked]   = useState(false);

  const hasSpa = (s: Suite) =>
    s.amenities.some(a => /spa|piscina|hidro/i.test(a)) ||
    s.features.some(f => /spa|piscina|hidro/i.test(f));

  const guestMatch = (s: Suite): boolean => {
    if (!guests) return true;
    if (guests === '1-2') return s.maxOccupancy >= 2;
    if (guests === '3-4') return s.maxOccupancy >= 3;
    if (guests === '5-8') return s.maxOccupancy >= 5;
    return true;
  };

  async function checkDates() {
    if (!checkin || !checkout || checkin >= checkout) return;
    setChecking(true);
    setChecked(false);
    try {
      const res = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin, checkout,
          rooms: allSuites.map(s => ({ name: s.name })),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setUnavailable(d.unavailableRooms || []);
        setChecked(true);
      }
    } catch { /* ignore */ }
    setChecking(false);
  }

  // Rebuild groups applying all filters
  const filteredGroups = useMemo(() => {
    const result: Record<string, Suite[]> = {};
    for (const [group, suiteList] of Object.entries(groups)) {
      const filtered = suiteList.filter(s => {
        if (!guestMatch(s)) return false;
        if (spa === 'spa' && !hasSpa(s)) return false;
        if (spa === 'no-spa' && hasSpa(s)) return false;
        if (s.price > priceMax) return false;
        return true;
      });
      if (filtered.length > 0) result[group] = filtered;
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, guests, spa, priceMax]);

  const totalVisible = Object.values(filteredGroups).flat().length;
  const activeFilters = [guests, spa, priceMax < 3000].filter(Boolean).length;

  return (
    <>
      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e4ddd3',
        padding: '20px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          {/* Fechas */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flex: '0 0 auto' }}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Check-in</span>
              <input type="date" value={checkin} min={today}
                onChange={e => { setCheckin(e.target.value); setChecked(false); setUnavailable([]); if (checkout && e.target.value >= checkout) setCheckout(''); }}
                style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Check-out</span>
              <input type="date" value={checkout} min={checkin || today}
                onChange={e => { setCheckout(e.target.value); setChecked(false); setUnavailable([]); }}
                style={inputStyle} />
            </label>
            <button
              onClick={checkDates}
              disabled={!checkin || !checkout || checkin >= checkout || checking}
              style={{
                height: 38, padding: '0 14px',
                background: checkin && checkout && checkin < checkout ? '#1a2e1a' : '#d4cec7',
                color: '#fff', border: 'none', borderRadius: 4,
                fontFamily: 'var(--font-jost, sans-serif)',
                fontSize: '0.78rem', fontWeight: 600,
                cursor: checkin && checkout ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.15s',
              }}
            >
              {checking
                ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                : <Search size={14} />
              }
              {checking ? 'Buscando…' : 'Ver disponibilidad'}
            </button>
          </div>

          {/* Divisor */}
          <div style={{ width: 1, height: 32, background: '#e4ddd3', alignSelf: 'center' }} />

          {/* Personas */}
          <div style={labelStyle}>
            <span style={labelTextStyle}>Personas</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['', '1-2', '3-4', '5-8'] as GuestFilter[]).map(g => (
                <button key={g} onClick={() => setGuests(g)}
                  style={{
                    padding: '5px 10px', borderRadius: 4, border: '1px solid',
                    borderColor: guests === g ? '#1a2e1a' : '#d4cec7',
                    background: guests === g ? '#1a2e1a' : '#fff',
                    color: guests === g ? '#fff' : '#5a4e3c',
                    fontSize: '0.75rem', fontFamily: 'var(--font-jost, sans-serif)',
                    cursor: 'pointer', fontWeight: guests === g ? 600 : 400,
                  }}
                >
                  {g || 'Todos'}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div style={labelStyle}>
            <span style={labelTextStyle}>Tipo</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['', 'spa', 'no-spa'] as SpaFilter[]).map(t => (
                <button key={t} onClick={() => setSpa(t)}
                  style={{
                    padding: '5px 10px', borderRadius: 4, border: '1px solid',
                    borderColor: spa === t ? '#1a2e1a' : '#d4cec7',
                    background: spa === t ? '#1a2e1a' : '#fff',
                    color: spa === t ? '#fff' : '#5a4e3c',
                    fontSize: '0.75rem', fontFamily: 'var(--font-jost, sans-serif)',
                    cursor: 'pointer', fontWeight: spa === t ? 600 : 400,
                  }}
                >
                  {t === '' ? 'Todas' : t === 'spa' ? 'Con spa' : 'Sin spa'}
                </button>
              ))}
            </div>
          </div>

          {/* Precio */}
          <div style={labelStyle}>
            <span style={labelTextStyle}>Precio máx: <strong>${priceMax.toLocaleString('es-MX')}</strong></span>
            <input type="range" min={1200} max={3000} step={100} value={priceMax}
              onChange={e => setPriceMax(Number(e.target.value))}
              style={{ width: 120, accentColor: '#1a2e1a', cursor: 'pointer' }} />
          </div>

          {/* Resultado */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeFilters > 0 && (
              <button onClick={() => { setGuests(''); setSpa(''); setPriceMax(3000); }}
                style={{ fontSize: '0.75rem', color: '#c9484a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost, sans-serif)' }}>
                Limpiar filtros
              </button>
            )}
            <span style={{ fontSize: '0.78rem', color: '#9a8a74', fontFamily: 'var(--font-jost, sans-serif)' }}>
              {totalVisible} suite{totalVisible !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Resultado de disponibilidad */}
        {checked && (
          <div style={{ maxWidth: 1280, margin: '10px auto 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {allSuites.map(s => (
              <span key={s.id} style={{
                fontSize: '0.72rem', padding: '3px 9px', borderRadius: 20,
                fontFamily: 'var(--font-jost, sans-serif)', fontWeight: 500,
                background: unavailable.includes(s.name) ? '#fde8e8' : '#e6f4e8',
                color: unavailable.includes(s.name) ? '#8a1a1a' : '#1a6b22',
                border: `1px solid ${unavailable.includes(s.name) ? '#f0b0b0' : '#a3d9a5'}`,
              }}>
                {s.name}: {unavailable.includes(s.name) ? 'Ocupada' : 'Disponible'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid de suites (con datos de disponibilidad pasados) ── */}
      <HabitacionesClient
        groups={filteredGroups}
        unavailableNames={checked ? unavailable : []}
        checkin={checkin}
        checkout={checkout}
      />
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4,
};
const labelTextStyle: React.CSSProperties = {
  fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: '#9a8a74',
  fontFamily: 'var(--font-jost, sans-serif)',
};
const inputStyle: React.CSSProperties = {
  height: 38, padding: '0 10px',
  border: '1px solid #d4cec7', borderRadius: 4,
  fontFamily: 'var(--font-jost, sans-serif)',
  fontSize: '0.875rem', color: '#1a2218',
  background: '#fff', outline: 'none', cursor: 'pointer',
};
