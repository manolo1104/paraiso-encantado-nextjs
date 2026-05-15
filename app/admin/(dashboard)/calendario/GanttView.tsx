'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import ReservationModal from '@/components/admin/ReservationModal';

const ROOMS = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla','Suite Lajas',
  'Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble','Orquídeas 3',
  'Bromelias','Helechos 1','Helechos 2',
];

const ROOM_COLORS = [
  '#2d7a34','#c9a97a','#4a6e2e','#8b4a9a','#2e6b8a',
  '#8a4a2e','#6b4a8a','#2e8a7a','#8a6b2e','#4a8a6b',
  '#8a2e4a','#6b8a2e','#2e4a8a',
];

const CELL_W = 34;
const ROW_H  = 46;
const LABEL_W = 148;
const HEADER_H = 54;

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS_VISIBLE = 49;

interface Props { bookings: AdminBooking[]; onRefresh: () => void }

function toDate(s: string) { return new Date(s + 'T00:00:00'); }
function isoToday() { return new Date().toISOString().split('T')[0]; }

export default function GanttView({ bookings, onRefresh }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetDays, setOffsetDays] = useState(-3); // start 3 days before today
  const [modal, setModal] = useState<{ booking?: AdminBooking; defaultCheckin?: string } | null>(null);
  const todayStr = isoToday();

  // Scroll to "today" on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = Math.max(0, (3 - offsetDays) * CELL_W - 60);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rangeStart = useMemo(() => {
    const d = toDate(todayStr);
    d.setDate(d.getDate() + offsetDays);
    return d;
  }, [offsetDays, todayStr]);

  const dates = useMemo(() =>
    Array.from({ length: DAYS_VISIBLE }, (_, i) => {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      return d;
    }),
  [rangeStart]);

  const rangeStartStr = rangeStart.toISOString().split('T')[0];
  const rangeEndDate = new Date(rangeStart); rangeEndDate.setDate(rangeEndDate.getDate() + DAYS_VISIBLE);
  const rangeEndStr = rangeEndDate.toISOString().split('T')[0];

  const activeBookings = useMemo(() =>
    bookings.filter(b => b.estado !== 'CANCELADA' && b.checkin < rangeEndStr && b.checkout > rangeStartStr),
  [bookings, rangeStartStr, rangeEndStr]);

  function dayOffset(dateStr: string) {
    return Math.round((toDate(dateStr).getTime() - rangeStart.getTime()) / 86400000);
  }

  const todayOff = dayOffset(todayStr);

  // Month label spans
  const monthSpans: { label: string; start: number; span: number }[] = [];
  let i = 0;
  while (i < DAYS_VISIBLE) {
    const d = dates[i];
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    let span = 1;
    while (i + span < DAYS_VISIBLE) {
      const nd = dates[i + span];
      if (nd.getMonth() !== d.getMonth() || nd.getFullYear() !== d.getFullYear()) break;
      span++;
    }
    monthSpans.push({ label, start: i, span });
    i += span;
  }

  const totalW = LABEL_W + DAYS_VISIBLE * CELL_W;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setOffsetDays(d => d - 14)}
          style={{ background: '#fff', border: '1px solid #d4cec7', borderRadius: 4, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => setOffsetDays(-3)}
          style={{ background: '#fff', border: '1px solid #d4cec7', borderRadius: 4, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-jost, sans-serif)' }}
        >
          Hoy
        </button>
        <button
          onClick={() => setOffsetDays(d => d + 14)}
          style={{ background: '#fff', border: '1px solid #d4cec7', borderRadius: 4, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={16} />
        </button>
        <span style={{ fontSize: '0.78rem', color: '#888', marginLeft: 4 }}>
          {MONTHS[rangeStart.getMonth()]} {rangeStart.getFullYear()}
          {' — '}
          {MONTHS[rangeEndDate.getMonth()]} {rangeEndDate.getFullYear()}
        </span>
      </div>

      {/* Scrollable gantt */}
      <div
        ref={containerRef}
        style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e4ddd3', background: '#fff' }}
      >
        <div style={{ position: 'relative', width: totalW, minWidth: totalW }}>

          {/* Month row */}
          <div style={{ display: 'flex', height: 24, background: '#2a2218' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, borderRight: '2px solid rgba(255,255,255,0.1)' }} />
            {monthSpans.map(({ label, span }, mi) => (
              <div key={mi} style={{
                width: span * CELL_W, flexShrink: 0,
                fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase',
                color: '#c9a96e', padding: '0 8px', lineHeight: '24px',
                borderRight: '1px solid rgba(255,255,255,0.08)',
              }}>
                {label}
              </div>
            ))}
          </div>

          {/* Day numbers row */}
          <div style={{ display: 'flex', height: 30, background: '#f4f0e8', borderBottom: '2px solid #2a2218' }}>
            <div style={{
              width: LABEL_W, flexShrink: 0,
              fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase',
              color: '#9a9a82', padding: '0 14px', lineHeight: '30px',
              borderRight: '2px solid #d4cec7', background: '#faf7f2',
            }}>
              Habitación
            </div>
            {dates.map((d, idx) => {
              const isToday = idx === todayOff;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div key={idx} style={{
                  width: CELL_W, flexShrink: 0,
                  fontSize: 11, textAlign: 'center', lineHeight: '30px',
                  fontWeight: isToday ? 700 : 400,
                  background: isToday ? '#2d7a34' : isWeekend ? '#ede8de' : 'transparent',
                  color: isToday ? '#fff' : isWeekend ? '#7a6a52' : '#5a4e3c',
                  borderRight: '1px solid #e4ddd3',
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                  {d.getDate()}
                </div>
              );
            })}
          </div>

          {/* Room rows */}
          {ROOMS.map((room, ri) => {
            const color = ROOM_COLORS[ri];
            const roomBookings = activeBookings.filter(b =>
              b.habitaciones.split(', ').some(h => h.trim() === room)
            );

            return (
              <div key={room} style={{
                display: 'flex', height: ROW_H,
                borderBottom: '1px solid #f0ebe3',
                position: 'relative',
              }}>
                {/* Label */}
                <div style={{
                  width: LABEL_W, flexShrink: 0,
                  padding: '0 12px',
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontSize: 11.5, color: '#2a2218',
                  background: '#faf7f2',
                  borderRight: '2px solid #e4ddd3',
                  position: 'sticky', left: 0, zIndex: 2,
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {room}
                </div>

                {/* Day cells */}
                <div style={{ position: 'relative', flex: 1 }}>
                  {/* Background stripes */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                    {dates.map((d, idx) => {
                      const isToday = idx === todayOff;
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <div key={idx} style={{
                          width: CELL_W, flexShrink: 0, height: '100%',
                          background: isToday ? 'rgba(45,122,52,0.07)' : isWeekend ? '#f7f4ef' : 'transparent',
                          borderRight: '1px solid #f5f0e8',
                        }} />
                      );
                    })}
                  </div>

                  {/* Booking bars */}
                  {roomBookings.map(b => {
                    const start = Math.max(0, dayOffset(b.checkin));
                    const end   = Math.min(DAYS_VISIBLE, dayOffset(b.checkout));
                    const width = end - start;
                    if (width <= 0) return null;
                    return (
                      <div
                        key={b.confirmacion + room}
                        onClick={() => setModal({ booking: b })}
                        title={`${b.cliente} · ${b.noches}n · $${b.total.toLocaleString('es-MX')} MXN`}
                        style={{
                          position: 'absolute',
                          left: start * CELL_W + 2,
                          width: width * CELL_W - 4,
                          top: 6, height: ROW_H - 12,
                          background: color,
                          borderRadius: 4,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                          padding: '0 8px',
                          overflow: 'hidden',
                          zIndex: 1,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.1)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.filter = ''; }}
                      >
                        <span style={{
                          fontSize: 11, color: '#fff', fontWeight: 500,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          fontFamily: 'var(--font-jost, sans-serif)',
                        }}>
                          {b.cliente.split(' ')[0]}
                          {width > 2 && ` · ${b.noches}n`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Today vertical line */}
          {todayOff >= 0 && todayOff < DAYS_VISIBLE && (
            <div style={{
              position: 'absolute',
              top: HEADER_H,
              bottom: 0,
              left: LABEL_W + todayOff * CELL_W + CELL_W / 2 - 1,
              width: 2,
              background: 'rgba(45,122,52,0.5)',
              zIndex: 3,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 12 }}>
        {ROOMS.map((r, ri) => (
          <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#5a4e3c', fontFamily: 'var(--font-jost, sans-serif)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ROOM_COLORS[ri], display: 'inline-block' }} />
            {r}
          </span>
        ))}
      </div>

      {modal && (
        <ReservationModal
          booking={modal.booking}
          defaultCheckin={modal.defaultCheckin}
          onClose={() => setModal(null)}
          onSaved={() => { onRefresh(); setModal(null); }}
        />
      )}
    </div>
  );
}
