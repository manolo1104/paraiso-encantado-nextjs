'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, Loader2, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import type { Suite } from '@/data/suites';
import HabitacionesClient from './HabitacionesClient';

interface Props {
  groups: Record<string, Suite[]>;
  allSuites: Suite[];
}

type GuestFilter = '' | '1-2' | '3-4' | '5-8';
type SpaFilter = '' | 'spa' | 'no-spa';

// Only Jungla, Flor de Liz 1 & 2 have a private spa pool.
// LindaVista has a jacuzzi (hidromasaje) — different category.
// Lajas and others have no spa/jacuzzi.
function hasSpa(s: Suite): boolean {
  return (
    s.amenities.some(a => /piscina spa|spa privad/i.test(a)) ||
    s.features.some(f => /piscina spa|spa privad/i.test(f))
  );
}

export default function AvailabilityFilterClient({ groups, allSuites }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [checkin, setCheckin]       = useState('');
  const [checkout, setCheckout]     = useState('');
  const [guestCount, setGuestCount] = useState(2); // actual count for checkout URL
  const [guests, setGuests]         = useState<GuestFilter>(''); // range filter
  const [spa, setSpa]               = useState<SpaFilter>('');
  const [priceMax, setPriceMax]     = useState(3000);
  const [checking, setChecking]     = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [checked, setChecked]       = useState(false);
  const [filterOpen, setFilterOpen] = useState(false); // mobile collapse

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
  const activeFilters = [guests, spa, priceMax < 3000, checkin].filter(Boolean).length;

  // Build suite link with dates + guest count
  const suiteLinkParams = checkin && checkout
    ? `?checkin=${checkin}&checkout=${checkout}&guests=${guestCount}`
    : '';

  return (
    <>
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e4ddd3',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        maxWidth: '100vw',
      }}>
        {/* Mobile toggle row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={15} style={{ color: '#5a4e3c' }} />
            <span style={{ fontFamily: 'var(--font-jost, sans-serif)', fontSize: '0.82rem', fontWeight: 600, color: '#1a2218' }}>
              Filtrar suites
            </span>
            {activeFilters > 0 && (
              <span style={{ background: '#1a2e1a', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 10, fontFamily: 'var(--font-jost, sans-serif)' }}>
                {activeFilters}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.75rem', color: '#9a8a74', fontFamily: 'var(--font-jost, sans-serif)' }}>
              {totalVisible} suite{totalVisible !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setFilterOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: filterOpen ? '#1a2e1a' : '#fff',
                color: filterOpen ? '#fff' : '#1a2218',
                border: '1px solid #d4cec7',
                borderRadius: 4, padding: '6px 12px',
                fontFamily: 'var(--font-jost, sans-serif)',
                fontSize: '0.78rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              aria-expanded={filterOpen}
            >
              {filterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {filterOpen ? 'Cerrar' : 'Abrir filtros'}
            </button>
          </div>
        </div>

        {/* Filter body — collapsible on mobile, always visible on desktop */}
        <div style={{
          overflow: 'hidden',
          maxHeight: filterOpen ? '1000px' : '0',
          transition: 'max-height 0.3s ease',
        }}>
          <div style={{
            padding: '0 20px 16px',
            display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end',
            borderTop: '1px solid #f0ebe3',
            paddingTop: 14,
          }}>
            {/* Fechas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', minWidth: 0, overflow: 'hidden' }}>
              <label style={{ ...labelStyle, minWidth: 0 }}>
                <span style={labelTextStyle}>Check-in</span>
                <input type="date" value={checkin} min={today}
                  onChange={e => { setCheckin(e.target.value); setChecked(false); setUnavailable([]); if (checkout && e.target.value >= checkout) setCheckout(''); }}
                  style={{ ...inputStyle, width: 140 }} />
              </label>
              <label style={{ ...labelStyle, minWidth: 0 }}>
                <span style={labelTextStyle}>Check-out</span>
                <input type="date" value={checkout} min={checkin || today}
                  onChange={e => { setCheckout(e.target.value); setChecked(false); setUnavailable([]); }}
                  style={{ ...inputStyle, width: 140 }} />
              </label>
              <label style={{ ...labelStyle, minWidth: 0 }}>
                <span style={labelTextStyle}>Personas</span>
                <select value={guestCount} onChange={e => setGuestCount(Number(e.target.value))} style={{ ...inputStyle, minWidth: 60, width: 70 }}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button
                onClick={checkDates}
                disabled={!checkin || !checkout || checkin >= checkout || checking}
                style={{
                  height: 38, padding: '0 16px',
                  background: checkin && checkout && checkin < checkout ? '#1a2e1a' : '#d4cec7',
                  color: '#fff', border: 'none', borderRadius: 4,
                  fontFamily: 'var(--font-jost, sans-serif)',
                  fontSize: '0.8rem', fontWeight: 600,
                  cursor: checkin && checkout && checkin < checkout ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.15s',
                }}
              >
                {checking ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Search size={14} />}
                {checking ? 'Buscando…' : 'Verificar'}
              </button>
            </div>

            {/* Divisor */}
            <div style={{ width: 1, height: 32, background: '#e4ddd3', alignSelf: 'center', flexShrink: 0 }} />

            {/* Personas (range para filtrar) */}
            <div style={labelStyle}>
              <span style={labelTextStyle}>Capacidad</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(['', '1-2', '3-4', '5-8'] as GuestFilter[]).map(g => (
                  <button key={g} onClick={() => setGuests(g)} style={chipStyle(guests === g)}>
                    {g || 'Todas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de suite — etiqueta sutil y precisa */}
            <div style={labelStyle}>
              <span style={labelTextStyle}>Tipo</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button onClick={() => setSpa('')} style={chipStyle(spa === '')}>Todas</button>
                <button onClick={() => setSpa('spa')} style={chipStyle(spa === 'spa')} title="Con piscina spa privada (Jungla, Flor de Liz 1 & 2)">Con spa privado</button>
                <button onClick={() => setSpa('no-spa')} style={chipStyle(spa === 'no-spa')}>Sin spa</button>
              </div>
            </div>

            {/* Precio */}
            <div style={labelStyle}>
              <span style={labelTextStyle}>Precio máx: <strong>${priceMax.toLocaleString('es-MX')}</strong></span>
              <input type="range" min={1200} max={3000} step={100} value={priceMax}
                onChange={e => setPriceMax(Number(e.target.value))}
                style={{ width: 120, accentColor: '#1a2e1a', cursor: 'pointer' }} />
            </div>

            {/* Limpiar */}
            {activeFilters > 0 && (
              <button onClick={() => { setGuests(''); setSpa(''); setPriceMax(3000); setCheckin(''); setCheckout(''); setChecked(false); setUnavailable([]); }}
                style={{ fontSize: '0.75rem', color: '#c9484a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost, sans-serif)', alignSelf: 'flex-end', paddingBottom: 2 }}>
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Availability result chips */}
          {checked && (
            <div style={{ padding: '0 20px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {allSuites.map(s => (
                <span key={s.id} style={{
                  fontSize: '0.7rem', padding: '2px 9px', borderRadius: 20,
                  fontFamily: 'var(--font-jost, sans-serif)', fontWeight: 500,
                  background: unavailable.includes(s.name) ? '#fde8e8' : '#e6f4e8',
                  color: unavailable.includes(s.name) ? '#8a1a1a' : '#1a6b22',
                  border: `1px solid ${unavailable.includes(s.name) ? '#f0b0b0' : '#a3d9a5'}`,
                }}>
                  {s.name.replace('Suite ', '')}: {unavailable.includes(s.name) ? 'Ocupada' : 'Libre'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid de suites */}
      <HabitacionesClient
        groups={filteredGroups}
        unavailableNames={checked ? unavailable : []}
        checkin={checkin}
        checkout={checkout}
        suiteLinkSuffix={suiteLinkParams}
      />
    </>
  );
}

// ── Shared micro-styles ─────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
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
  boxSizing: 'border-box', minWidth: 0,
};
const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: '5px 11px', borderRadius: 4, border: '1px solid',
  borderColor: active ? '#1a2e1a' : '#d4cec7',
  background: active ? '#1a2e1a' : '#fff',
  color: active ? '#fff' : '#5a4e3c',
  fontSize: '0.75rem', fontFamily: 'var(--font-jost, sans-serif)',
  cursor: 'pointer', fontWeight: active ? 600 : 400,
  transition: 'all 0.12s',
});
