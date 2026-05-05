'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import ReservationModal from '@/components/admin/ReservationModal';
import styles from './reservas.module.css';

const ESTADO_COLOR: Record<string, string> = {
  CONFIRMADA: '#2d7a34',
  MANUAL:     '#2d7a34',
  CANCELADA:  '#c9484a',
};

interface Props { initialBookings: AdminBooking[] }

export default function ReservasClient({ initialBookings }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [search, setSearch] = useState('');
  const [suiteFilter, setSuiteFilter] = useState('');
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; booking?: AdminBooking } | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter(b => {
      if (q && !b.cliente.toLowerCase().includes(q) &&
          !b.email.toLowerCase().includes(q) &&
          !b.confirmacion.toLowerCase().includes(q)) return false;
      if (suiteFilter && !b.habitaciones.includes(suiteFilter)) return false;
      return true;
    }).sort((a, b) => b.checkin.localeCompare(a.checkin));
  }, [bookings, search, suiteFilter]);

  async function refresh() {
    setLoading(true);
    const res = await fetch('/api/admin/reservas');
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }

  const totalIngresos = filtered.reduce((s, b) => s + (b.estado !== 'CANCELADA' ? b.total : 0), 0);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reservas</h1>
          <p className={styles.pageSub}>{filtered.length} reservas · ${totalIngresos.toLocaleString('es-MX')} MXN</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={refresh} disabled={loading} title="Actualizar">
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
          </button>
          <button className={styles.primaryBtn} onClick={() => setModal({ mode: 'new' })}>
            <Plus size={16} /> Nueva reserva
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por cliente, email o confirmación…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={styles.select} value={suiteFilter} onChange={e => setSuiteFilter(e.target.value)}>
          <option value="">Todas las suites</option>
          {['Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla','Suite Lajas',
            'Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble','Orquídeas 3','Bromelias',
            'Helechos 1','Helechos 2'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Confirmación</th>
              <th>Cliente</th>
              <th>Suite</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Noches</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className={styles.empty}>Sin reservas que mostrar</td></tr>
            ) : filtered.map(b => (
              <tr
                key={b.confirmacion + b.rowIndex}
                className={styles.row}
                onClick={() => setModal({ mode: 'edit', booking: b })}
              >
                <td className={styles.mono}>{b.confirmacion || '—'}</td>
                <td>
                  <div className={styles.clienteName}>{b.cliente}</div>
                  {b.email && b.email !== 'N/A' && <div className={styles.clienteEmail}>{b.email}</div>}
                </td>
                <td>{b.habitaciones}</td>
                <td>{b.checkin}</td>
                <td>{b.checkout}</td>
                <td>{b.noches}</td>
                <td className={styles.total}>${b.total.toLocaleString('es-MX')}</td>
                <td>
                  <span className={styles.badge} style={{ color: ESTADO_COLOR[b.estado] || '#888' }}>
                    {b.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ReservationModal
          booking={modal.mode === 'edit' ? modal.booking : undefined}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
