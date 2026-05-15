'use client';

import { useState } from 'react';
import { Plus, CalendarDays, GanttChartSquare } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import ReservationModal from '@/components/admin/ReservationModal';
import GanttView from './GanttView';
import AvailabilityCalendar from './AvailabilityCalendar';
import styles from './calendario.module.css';

interface Props { initialBookings: AdminBooking[] }

export default function CalendarioClient({ initialBookings }: Props) {
  const [view, setView] = useState<'calendario' | 'gantt'>('calendario');
  const [bookings, setBookings] = useState(initialBookings);
  const [modal, setModal] = useState<{ booking?: AdminBooking; defaultCheckin?: string } | null>(null);

  async function refresh() {
    const res = await fetch('/api/admin/reservas');
    if (res.ok) setBookings(await res.json());
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendario</h1>
          <p className={styles.sub}>
            {bookings.filter(b => b.estado !== 'CANCELADA').length} reservas activas
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${view === 'calendario' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('calendario')}
            >
              <CalendarDays size={14} /> Disponibilidad
            </button>
            <button
              className={`${styles.viewBtn} ${view === 'gantt' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('gantt')}
            >
              <GanttChartSquare size={14} /> Timeline
            </button>
          </div>
          <button className={styles.primaryBtn} onClick={() => setModal({})}>
            <Plus size={15} /> Nueva reserva
          </button>
        </div>
      </div>

      {view === 'calendario' && (
        <AvailabilityCalendar bookings={bookings} onRefresh={refresh} />
      )}

      {view === 'gantt' && (
        <GanttView bookings={bookings} onRefresh={refresh} />
      )}

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
