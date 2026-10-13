'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Lock, Unlock, RefreshCw, Loader2, X, CalendarCheck, Plus, MessageCircle } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import ReservationModal from '@/components/admin/ReservationModal';

const SUITES = [
  'Suite Flor de Liz 1', 'Suite Flor de Liz 2', 'Suite LindaVista', 'Jungla', 'Suite Lajas',
  'Lirios 1', 'Lirios 2', 'Orquídeas 2', 'Orquídeas Doble', 'Orquídeas 3',
  'Bromelias', 'Helechos 1', 'Helechos 2',
];

const SUITE_PRICES: Record<string, number> = {
  'Suite Flor de Liz 1': 1900, 'Suite Flor de Liz 2': 1900,
  'Suite LindaVista': 1900, 'Jungla': 1900, 'Suite Lajas': 1900,
  'Lirios 1': 1500, 'Lirios 2': 1500,
  'Orquídeas 2': 1500, 'Orquídeas Doble': 1500, 'Orquídeas 3': 1500,
  'Bromelias': 1500, 'Helechos 1': 1900, 'Helechos 2': 1900,
};

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DOW = ['D','L','M','M','J','V','S'];

function pad2(n: number) { return String(n).padStart(2, '0'); }
function dateStr(y: number, m: number, d: number) { return `${y}-${pad2(m+1)}-${pad2(d)}`; }

function fmtDay(ds: string) {
  const [, m, d] = ds.split('-');
  return `${parseInt(d)} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(m)-1]}`;
}

interface DayState { status: 'available' | 'booking' | 'blocked' | 'ota' | 'override'; booking?: AdminBooking }

interface ClickedDay {
  room: string;
  date: string;
  state: DayState;
}

interface Props { bookings: AdminBooking[]; onRefresh: () => void }

/** Reserva cerrada desde este calendario (ver lib/admin/reservas-calendario.ts). */
interface ReservaCal { registrada: string; id: string; suite: string; llegada: string; salida: string; noches: number; canal: string }

const CANALES_RESERVA = ['WhatsApp', 'Teléfono', 'Booking.com', 'En persona', 'Otro'];

function sumarDiasISO(ds: string, n: number): string {
  const d = new Date(`${ds}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function AvailabilityCalendar({ bookings, onRefresh }: Props) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  // Record<room, Record<dateISO, 'RESERVADO'|'BLOQUEADO'|...>>
  const [sheetData, setSheetData] = useState<Record<string, Record<string, string>>>({});
  const [loadingSheet, setLoadingSheet] = useState(true);
  const [clicked, setClicked] = useState<ClickedDay | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editBooking, setEditBooking] = useState<AdminBooking | null>(null);
  const [newBookingParams, setNewBookingParams] = useState<{ room: string; date: string } | null>(null);
  // Cerrar noches: primero el motivo (¿reserva o solo bloqueo?), luego cuántas.
  // Una reserva cuenta en «N reservas confirmadas este mes» de /reservar.
  const [cierre, setCierre] = useState<'reserva' | 'bloqueo' | null>(null);
  const [cierreNoches, setCierreNoches] = useState(1);
  const [cierreCanal, setCierreCanal] = useState('WhatsApp');
  const [reservasCal, setReservasCal] = useState<ReservaCal[]>([]);

  const loadSheet = useCallback(async () => {
    setLoadingSheet(true);
    try {
      const [res, resCal] = await Promise.all([
        fetch('/api/admin/disponibilidad'),
        fetch('/api/admin/reservas-calendario').catch(() => null),
      ]);
      if (res.ok) setSheetData(await res.json());
      if (resCal?.ok) setReservasCal((await resCal.json()).reservas || []);
    } catch {}
    setLoadingSheet(false);
  }, []);

  // Cada vez que se abre (o cierra) otra noche, el cierre empieza de cero.
  useEffect(() => { setCierre(null); setCierreNoches(1); setCierreCanal('WhatsApp'); }, [clicked]);

  function reservaCalDe(room: string, ds: string): ReservaCal | undefined {
    return reservasCal.find(r => r.suite === room && ds >= r.llegada && ds < r.salida);
  }

  useEffect(() => { loadSheet(); }, [loadSheet]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  // Compute day state for a specific room+date
  function getDayState(room: string, ds: string): DayState {
    const booking = bookings.find(b =>
      b.estado !== 'CANCELADA' &&
      b.habitaciones.split(', ').some(h => h.replace(/\s*\([^)]*\)/g,'').trim() === room) &&
      ds >= b.checkin && ds < b.checkout
    );
    if (booking) return { status: 'booking', booking };

    const roomSheet = sheetData[room] || {};
    const val = roomSheet[ds]?.toUpperCase();
    if (val?.startsWith('OTA')) return { status: 'ota' }; // "OTA" o "OTA (EXPEDIA)"
    if (val === 'ABIERTO') return { status: 'override' }; // liberada a mano (era OTA)
    if (val === 'BLOQUEADO' || val === 'MANTENIMIENTO') return { status: 'blocked' };
    if (val === 'RESERVADO') {
      // Reservado en sheets pero sin booking en admin — puede ser reserva pública
      return { status: 'booking', booking: undefined };
    }
    return { status: 'available' };
  }

  function countFree(room: string) {
    const dim = new Date(year, month + 1, 0).getDate();
    let n = 0;
    for (let d = 1; d <= dim; d++) {
      const ds = dateStr(year, month, d);
      if (getDayState(room, ds).status === 'available') n++;
    }
    return n;
  }

  /** Cierra 1..14 noches desde la fecha tocada, como reserva o como bloqueo. */
  async function handleCerrar() {
    if (!clicked || !cierre) return;
    setSaving(true); setSaveError('');
    const res = await fetch('/api/admin/reservas-calendario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suite: clicked.room, llegada: clicked.date, noches: cierreNoches, tipo: cierre, canal: cierreCanal }),
    });
    if (res.ok) {
      await loadSheet();
      setClicked(null);
    } else {
      const d = await res.json().catch(() => ({}));
      setSaveError(d.error || 'No se pudo cerrar la fecha');
    }
    setSaving(false);
  }

  /** Cancela una reserva hecha desde el calendario y libera sus noches. */
  async function handleCancelarReservaCal(id: string) {
    setSaving(true); setSaveError('');
    const res = await fetch('/api/admin/reservas-calendario', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      await loadSheet();
      setClicked(null);
    } else {
      const d = await res.json().catch(() => ({}));
      setSaveError(d.error || 'No se pudo cancelar');
    }
    setSaving(false);
  }

  async function handleUnblock() {
    if (!clicked) return;
    setSaving(true); setSaveError('');
    const res = await fetch('/api/admin/disponibilidad', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: clicked.room, date: clicked.date }),
    });
    if (res.ok) {
      await loadSheet();
      setClicked(null);
    } else {
      const d = await res.json();
      setSaveError(d.error || 'Error al desbloquear');
    }
    setSaving(false);
  }

  // Libera una fecha ocupada por OTA (escribe el centinela 'ABIERTO').
  // No la libera en la OTA de origen: eso se hace en su extranet.
  async function handleOpenOta() {
    if (!clicked) return;
    setSaving(true); setSaveError('');
    const res = await fetch('/api/admin/disponibilidad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: clicked.room, date: clicked.date, status: 'ABIERTO' }),
    });
    if (res.ok) {
      await loadSheet();
      setClicked(null);
    } else {
      const d = await res.json();
      setSaveError(d.error || 'Error al liberar la fecha');
    }
    setSaving(false);
  }

  // Deshace la liberación: la fecha vuelve a quedar ocupada por OTA. Escribe el
  // valor de vuelta en la hoja — ya no hay sincronización que lo repinte sola.
  async function handleRestoreOta() {
    if (!clicked) return;
    setSaving(true); setSaveError('');
    const res = await fetch('/api/admin/disponibilidad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: clicked.room, date: clicked.date, status: 'OTA' }),
    });
    if (res.ok) {
      await loadSheet();
      setClicked(null);
    } else {
      const d = await res.json();
      setSaveError(d.error || 'Error al restaurar el bloqueo');
    }
    setSaving(false);
  }

  /**
   * «Cerrar esta fecha»: pregunta primero si es una reserva o solo un bloqueo
   * (antes solo existía «Bloquear» y las reservas de WhatsApp se perdían para
   * la prueba social de la web), y deja cerrar varias noches de un jalón.
   */
  function panelCierre() {
    if (!clicked) return null;
    const btn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-jost,sans-serif)' };
    if (!cierre) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, background: '#fff' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-jost,sans-serif)' }}>
            Cerrar esta fecha: ¿es una reserva o solo un bloqueo?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => setCierre('reserva')} style={{ ...btn, background: '#1a1a1a', color: '#fff' }}>
              <MessageCircle size={14} /> Es una reserva (WhatsApp, teléfono…)
            </button>
            <button onClick={() => setCierre('bloqueo')} style={{ ...btn, background: '#fff', color: '#1a1a1a', border: '1px solid #d1d5db' }}>
              <Lock size={14} /> Solo bloqueo (mantenimiento, uso del hotel…)
            </button>
          </div>
        </div>
      );
    }
    const salida = sumarDiasISO(clicked.date, cierreNoches);
    const campo: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-jost,sans-serif)', background: '#fff', color: '#1a1a1a' };
    const etiqueta: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 4px', fontFamily: 'var(--font-jost,sans-serif)' };
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-jost,sans-serif)' }}>
          {cierre === 'reserva' ? 'Reserva que llegó por otro canal' : 'Bloqueo (no cuenta como reserva)'}
        </p>
        <label>
          <span style={etiqueta}>Noches</span>
          <select value={cierreNoches} onChange={e => setCierreNoches(Number(e.target.value))} style={campo}>
            {Array.from({ length: 14 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n} noche{n !== 1 ? 's' : ''} · sale el {fmtDay(sumarDiasISO(clicked.date, n))}</option>
            ))}
          </select>
        </label>
        {cierre === 'reserva' && (
          <label>
            <span style={etiqueta}>¿Por dónde llegó?</span>
            <select value={cierreCanal} onChange={e => setCierreCanal(e.target.value)} style={campo}>
              {CANALES_RESERVA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
        <button onClick={handleCerrar} disabled={saving} style={{ ...btn, background: cierre === 'reserva' ? '#2d7a34' : '#1a1a1a', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Lock size={14} />}
          {cierre === 'reserva' ? `Guardar reserva (${fmtDay(clicked.date)} → ${fmtDay(salida)})` : `Bloquear ${cierreNoches} noche${cierreNoches !== 1 ? 's' : ''}`}
        </button>
        <button onClick={() => setCierre(null)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-jost,sans-serif)', textDecoration: 'underline' }}>
          Atrás
        </button>
      </div>
    );
  }

  const dim = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={16} /></button>
          <span style={{ fontFamily: 'var(--font-cormorant,Georgia,serif)', fontSize: '1.3rem', fontWeight: 400, color: 'var(--forest)', minWidth: 180, textAlign: 'center' }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} style={navBtnStyle}><ChevronRight size={16} /></button>
          <button
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
            style={{ ...navBtnStyle, padding: '5px 12px', fontSize: '0.78rem', fontFamily: 'var(--font-jost,sans-serif)' }}
          >
            Hoy
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={legendItem}><span style={{ ...dot, background: '#3B6D11' }} />Libre</span>
            <span style={legendItem}><span style={{ ...dot, background: '#A32D2D' }} />Ocupada</span>
            <span style={legendItem}><span style={{ ...dot, background: '#7a5a00' }} />Bloqueada</span>
            <span style={legendItem}><span style={{ ...dot, background: '#7C3AED' }} />Ocupada en OTA</span>
            <span style={legendItem}><span style={{ ...dot, background: '#0284C7' }} />Liberada (OTA)</span>
          </div>
          <button
            onClick={() => { loadSheet(); onRefresh(); }}
            disabled={loadingSheet}
            style={{ ...navBtnStyle, color: loadingSheet ? '#aaa' : undefined }}
            title="Actualizar"
          >
            <RefreshCw size={14} className={loadingSheet ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid of mini-calendars */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: 1,
        background: '#e5e7eb',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {SUITES.map(room => {
          const free = countFree(room);
          return (
            <div key={room} style={{ background: '#f9fafb', padding: '14px 14px 10px' }}>
              {/* Suite name */}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 8, letterSpacing: '0.3px', fontFamily: 'var(--font-jost,sans-serif)' }}>
                {room}
              </div>

              {/* Day-of-week header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 3 }}>
                {DOW.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 9, color: '#9ca3af', fontWeight: 500, fontFamily: 'var(--font-jost,sans-serif)', padding: '1px 0' }}>{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`e${i}`} style={{ aspectRatio: '1' }} />
                ))}
                {Array.from({ length: dim }).map((_, i) => {
                  const d = i + 1;
                  const ds = dateStr(year, month, d);
                  const isPast = ds < todayStr;
                  const isToday = ds === todayStr;
                  const state = getDayState(room, ds);

                  const bg = isPast ? 'transparent'
                    : state.status === 'available' ? '#EAF3DE'
                    : state.status === 'override' ? '#E0F2FE'
                    : state.status === 'blocked' ? '#FAEEDA'
                    : state.status === 'ota' ? '#F1E9FA'
                    : '#FCEBEB';

                  const color = isPast ? '#ccc'
                    : state.status === 'available' ? '#27500A'
                    : state.status === 'override' ? '#075985'
                    : state.status === 'blocked' ? '#633806'
                    : state.status === 'ota' ? '#5B2C91'
                    : '#791F1F';

                  return (
                    <div
                      key={d}
                      onClick={() => {
                        if (isPast) return;
                        setSaveError('');
                        setClicked({ room, date: ds, state });
                      }}
                      style={{
                        aspectRatio: '1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, borderRadius: 4,
                        cursor: isPast ? 'default' : 'pointer',
                        background: bg, color,
                        outline: isToday ? '2px solid #2d7a34' : undefined,
                        outlineOffset: isToday ? -1 : undefined,
                        opacity: isPast ? 0.3 : 1,
                        fontFamily: 'var(--font-jost,sans-serif)',
                        fontWeight: isToday ? 700 : 400,
                        transition: 'opacity 0.1s',
                      }}
                      onMouseEnter={e => { if (!isPast) (e.currentTarget as HTMLDivElement).style.opacity = '0.75'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = isPast ? '0.3' : '1'; }}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'var(--font-jost,sans-serif)' }}>
                  <span style={{ color: '#3B6D11', fontWeight: 600 }}>{free}</span> libres
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--font-jost,sans-serif)' }}>
                  ${SUITE_PRICES[room]?.toLocaleString('es-MX')}/n
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day click modal */}
      {clicked && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setClicked(null); setSaveError(''); } }}
        >
          <div style={{ background: '#f9fafb', borderRadius: 8, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', fontFamily: 'var(--font-jost,sans-serif)' }}>
                {clicked.state.status === 'available' ? 'Fecha disponible'
                  : clicked.state.status === 'override' ? 'Fecha liberada (OTA)'
                  : clicked.state.status === 'blocked' ? 'Fecha bloqueada'
                  : clicked.state.status === 'ota' ? 'Ocupada en OTA'
                  : 'Fecha ocupada'}
              </span>
              <button onClick={() => { setClicked(null); setSaveError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px 6px', fontSize: 18 }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '16px' }}>
              {/* Status tag */}
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, marginBottom: 10,
                background: clicked.state.status === 'available' ? '#EAF3DE' : clicked.state.status === 'override' ? '#E0F2FE' : clicked.state.status === 'blocked' ? '#FAEEDA' : clicked.state.status === 'ota' ? '#F1E9FA' : '#FCEBEB',
                color: clicked.state.status === 'available' ? '#27500A' : clicked.state.status === 'override' ? '#075985' : clicked.state.status === 'blocked' ? '#633806' : clicked.state.status === 'ota' ? '#5B2C91' : '#791F1F',
                fontFamily: 'var(--font-jost,sans-serif)',
              }}>
                {clicked.state.status === 'available' ? '● Disponible' : clicked.state.status === 'override' ? '● Liberada (OTA)' : clicked.state.status === 'blocked' ? '● Bloqueada' : clicked.state.status === 'ota' ? '● Ocupada en OTA' : '● Ocupada'}
              </span>

              {/* Suite + date */}
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 2, fontFamily: 'var(--font-cormorant,Georgia,serif)' }}>{clicked.room}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, fontFamily: 'var(--font-jost,sans-serif)' }}>{fmtDay(clicked.date)}, {year}</div>

              {/* Booking info */}
              {clicked.state.status === 'booking' && clicked.state.booking && (
                <div style={{ background: '#f9fafb', borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
                  {[
                    ['Huésped', clicked.state.booking.cliente],
                    ['Check-in', clicked.state.booking.checkin],
                    ['Check-out', clicked.state.booking.checkout],
                    ['Noches', String(clicked.state.booking.noches)],
                    ['Total', `$${clicked.state.booking.total.toLocaleString('es-MX')} MXN`],
                    ['Folio', clicked.state.booking.confirmacion],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', fontFamily: 'var(--font-jost,sans-serif)' }}>
                      <span style={{ color: '#9ca3af' }}>{label}</span>
                      <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reserva cerrada desde este calendario (WhatsApp, teléfono…) */}
              {clicked.state.status === 'booking' && !clicked.state.booking && reservaCalDe(clicked.room, clicked.date) && (() => {
                const rc = reservaCalDe(clicked.room, clicked.date)!;
                return (
                  <div style={{ background: '#EAF3DE', borderLeft: '3px solid #2d7a34', padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#374151', lineHeight: 1.6, fontFamily: 'var(--font-jost,sans-serif)' }}>
                    <strong>Reserva por {rc.canal}</strong>, cerrada desde el calendario el {fmtDay(rc.registrada.slice(0, 10))}.<br />
                    {fmtDay(rc.llegada)} → {fmtDay(rc.salida)} · {rc.noches} noche{rc.noches !== 1 ? 's' : ''}.<br />
                    <span style={{ color: '#6b7280' }}>Cuenta en «reservas confirmadas este mes» de la web.</span>
                  </div>
                );
              })()}

              {/* Booking without admin record */}
              {clicked.state.status === 'booking' && !clicked.state.booking && !reservaCalDe(clicked.room, clicked.date) && (
                <div style={{ background: '#fde8e8', borderRadius: 6, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#791F1F', fontFamily: 'var(--font-jost,sans-serif)' }}>
                  Esta fecha está marcada como RESERVADO en Google Sheets. No se encontró reserva en el panel admin (puede ser una reserva de la web pública o creada directamente en Sheets).
                </div>
              )}

              {/* Blocked info */}
              {clicked.state.status === 'blocked' && (
                <div style={{ background: '#fff8ee', borderLeft: '3px solid #52b788', padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#6b7280', lineHeight: 1.6, fontFamily: 'var(--font-jost,sans-serif)' }}>
                  Fecha bloqueada manualmente. Puedes desbloquearla para que vuelva a estar disponible.
                </div>
              )}

              {/* OTA info */}
              {clicked.state.status === 'ota' && (
                <div style={{ background: '#F1E9FA', borderLeft: '3px solid #7C3AED', padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#6b7280', lineHeight: 1.6, fontFamily: 'var(--font-jost,sans-serif)' }}>
                  Fecha ocupada por una reserva de OTA (Expedia). Ya no hay sincronización automática: este bloqueo se queda hasta que tú lo cambies aquí.<br /><br />
                  Si sabes que en realidad está libre (p. ej. el huésped canceló en Expedia), puedes <strong>liberarla</strong> y volverá a venderse en tu web y tu bot.<br />
                  <span style={{ color: '#b45309' }}>⚠️ Ojo: esto NO la libera en Expedia — si Expedia sí la tenía vendida, hay riesgo de doble reserva. Para liberarla también en Expedia, cancélala en su extranet.</span>
                </div>
              )}

              {/* Override (liberada a mano) info */}
              {clicked.state.status === 'override' && (
                <div style={{ background: '#E0F2FE', borderLeft: '3px solid #0284C7', padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#6b7280', lineHeight: 1.6, fontFamily: 'var(--font-jost,sans-serif)' }}>
                  Fecha que estaba ocupada en una OTA y <strong>liberaste manualmente</strong>. Vuelve a estar disponible en tu web y tu bot.<br /><br />
                  Puedes crear una reserva aquí, bloquearla, o restaurar el bloqueo de OTA (vuelve a quedar ocupada de inmediato).
                </div>
              )}

              {saveError && (
                <div style={{ background: '#fde8e8', borderRadius: 4, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#8a1a1a', fontFamily: 'var(--font-jost,sans-serif)' }}>
                  {saveError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clicked.state.status === 'available' && (
                  <>
                    <button
                      onClick={() => { setNewBookingParams({ room: clicked.room, date: clicked.date }); setClicked(null); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: '#2d7a34', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-jost,sans-serif)', fontWeight: 600 }}
                    >
                      <Plus size={14} /> Nueva Reserva
                    </button>
                    {panelCierre()}
                  </>
                )}

                {clicked.state.status === 'blocked' && (
                  <button
                    onClick={handleUnblock}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: '#3d6e40', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'var(--font-jost,sans-serif)', opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Unlock size={14} />}
                    Desbloquear esta fecha
                  </button>
                )}

                {clicked.state.status === 'ota' && (
                  <button
                    onClick={handleOpenOta}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: '#0284C7', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'var(--font-jost,sans-serif)', opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Unlock size={14} />}
                    Liberar / abrir esta fecha
                  </button>
                )}

                {clicked.state.status === 'override' && (
                  <>
                    <button
                      onClick={() => { setNewBookingParams({ room: clicked.room, date: clicked.date }); setClicked(null); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: '#2d7a34', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-jost,sans-serif)', fontWeight: 600 }}
                    >
                      <Plus size={14} /> Nueva Reserva
                    </button>
                    {panelCierre()}
                    <button
                      onClick={handleRestoreOta}
                      disabled={saving}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: 'transparent', color: '#5B2C91', border: '1px solid #7C3AED', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'var(--font-jost,sans-serif)', opacity: saving ? 0.6 : 1 }}
                    >
                      Restaurar bloqueo de OTA
                    </button>
                  </>
                )}

                {clicked.state.status === 'booking' && !clicked.state.booking && reservaCalDe(clicked.room, clicked.date) && (
                  <button
                    onClick={() => handleCancelarReservaCal(reservaCalDe(clicked.room, clicked.date)!.id)}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: 'transparent', color: '#8a1a1a', border: '1px solid #e8b4b4', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'var(--font-jost,sans-serif)', opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Unlock size={14} />}
                    Cancelar esta reserva y liberar sus noches
                  </button>
                )}

                {clicked.state.status === 'booking' && clicked.state.booking && (
                  <button
                    onClick={() => { setEditBooking(clicked.state.booking!); setClicked(null); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: '#2e6b8a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-jost,sans-serif)' }}
                  >
                    <CalendarCheck size={14} />
                    Ver / editar reserva
                  </button>
                )}

                <button
                  onClick={() => { setClicked(null); setSaveError(''); }}
                  style={{ padding: '9px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#6b7280', fontFamily: 'var(--font-jost,sans-serif)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit booking modal */}
      {editBooking && (
        <ReservationModal
          booking={editBooking}
          onClose={() => setEditBooking(null)}
          onSaved={() => { onRefresh(); setEditBooking(null); loadSheet(); }}
        />
      )}

      {/* Nueva reserva desde fecha del calendario — pre-carga habitación y fecha */}
      {newBookingParams && (
        <ReservationModal
          defaultCheckin={newBookingParams.date}
          defaultRoom={newBookingParams.room}
          onClose={() => setNewBookingParams(null)}
          onSaved={() => { onRefresh(); setNewBookingParams(null); loadSheet(); }}
        />
      )}
    </div>
  );
}

// ── Shared micro-styles ───────────────────────────────────────────────────────

const navBtnStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4,
  padding: '5px 8px', cursor: 'pointer', color: '#6b7280',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'border-color 0.15s',
};

const legendItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 11, color: '#6b7280',
  fontFamily: 'var(--font-jost,sans-serif)',
};

const dot: React.CSSProperties = {
  width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
};
