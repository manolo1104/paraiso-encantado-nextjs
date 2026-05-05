'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import ReservationModal from '@/components/admin/ReservationModal';
import styles from './calendario.module.css';

const SUITE_COLORS = [
  '#2d7a34','#c9a97a','#4a6e2e','#8b4a9a','#2e6b8a',
  '#8a4a2e','#6b4a8a','#2e8a7a','#8a6b2e','#4a8a6b',
  '#8a2e4a','#6b8a2e','#2e4a8a',
];

const SUITES_LIST = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla','Suite Lajas',
  'Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble','Orquídeas 3',
  'Bromelias','Helechos 1','Helechos 2',
];

function suiteColor(name: string) {
  const idx = SUITES_LIST.indexOf(name);
  return SUITE_COLORS[idx % SUITE_COLORS.length] || '#888';
}

const WEEKDAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

interface Props { initialBookings: AdminBooking[] }

export default function CalendarioClient({ initialBookings }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [modal, setModal] = useState<{ booking?: AdminBooking; defaultCheckin?: string } | null>(null);
  const [bookings, setBookings] = useState(initialBookings);

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  async function refresh() {
    const res = await fetch('/api/admin/reservas');
    if (res.ok) setBookings(await res.json());
  }

  // Días del mes
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Reservas del mes visible
  const monthBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!b.checkin || b.estado === 'CANCELADA') return false;
      const ci = new Date(b.checkin + 'T00:00:00');
      const co = b.checkout ? new Date(b.checkout + 'T00:00:00') : ci;
      const mStart = new Date(year, month, 1);
      const mEnd = new Date(year, month + 1, 1);
      return ci < mEnd && co > mStart;
    });
  }, [bookings, year, month]);

  // Obtener reservas para un día específico
  function getBookingsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return monthBookings.filter(b => {
      const ci = b.checkin;
      const co = b.checkout || ci;
      return dateStr >= ci && dateStr < co;
    });
  }

  const todayStr = now.toISOString().split('T')[0];

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendario</h1>
          <p className={styles.sub}>{monthBookings.length} reservas este mes</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={prevMonth}><ChevronLeft size={18} /></button>
          <span className={styles.monthLabel}>{MONTHS[month]} {year}</span>
          <button className={styles.iconBtn} onClick={nextMonth}><ChevronRight size={18} /></button>
          <button className={styles.primaryBtn} onClick={() => setModal({})}>
            <Plus size={15} /> Nueva
          </button>
        </div>
      </div>

      <div className={styles.calWrap}>
        {/* Cabecera días */}
        <div className={styles.weekdays}>
          {WEEKDAYS.map(d => <div key={d} className={styles.weekday}>{d}</div>)}
        </div>

        {/* Grid días */}
        <div className={styles.grid}>
          {/* Espacios vacíos al inicio */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} className={styles.dayEmpty} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayBookings = getBookingsForDay(day);
            const isToday = dateStr === todayStr;

            return (
              <div
                key={day}
                className={`${styles.day} ${isToday ? styles.today : ''}`}
                onClick={() => setModal({ defaultCheckin: dateStr })}
              >
                <span className={styles.dayNum}>{day}</span>
                <div className={styles.dayEvents}>
                  {dayBookings.slice(0, 3).map(b => (
                    <div
                      key={b.confirmacion}
                      className={styles.event}
                      style={{ background: suiteColor(b.habitaciones) }}
                      onClick={e => { e.stopPropagation(); setModal({ booking: b }); }}
                      title={`${b.cliente} — ${b.habitaciones}`}
                    >
                      {b.cliente.split(' ')[0]} · {b.habitaciones.split(' ').pop()}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className={styles.more}>+{dayBookings.length - 3} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className={styles.legend}>
        {SUITES_LIST.map((s, i) => (
          <span key={s} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: SUITE_COLORS[i] }} />
            {s}
          </span>
        ))}
      </div>

      {modal && (
        <ReservationModal
          booking={modal.booking}
          defaultCheckin={modal.defaultCheckin}
          onClose={() => setModal(null)}
          onSaved={() => { refresh(); setModal(null); }}
        />
      )}
    </div>
  );
}
