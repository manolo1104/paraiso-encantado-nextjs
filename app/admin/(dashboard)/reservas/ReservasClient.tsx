'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, RefreshCw, Send, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import ReservationModal from '@/components/admin/ReservationModal';
import { printBookingPDF } from '../cotizaciones/CotizacionesClient';
import styles from './reservas.module.css';

const SUITES = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla','Suite Lajas',
  'Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble','Orquídeas 3','Bromelias',
  'Helechos 1','Helechos 2',
];

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
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; booking?: AdminBooking } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter(b => {
      if (q && !b.cliente.toLowerCase().includes(q) &&
          !b.email.toLowerCase().includes(q) &&
          !b.confirmacion.toLowerCase().includes(q) &&
          !b.habitaciones.toLowerCase().includes(q)) return false;
      if (suiteFilter && !b.habitaciones.includes(suiteFilter)) return false;
      if (estadoFilter && b.estado !== estadoFilter) return false;
      if (fechaDesde && b.checkin < fechaDesde) return false;
      if (fechaHasta && b.checkin > fechaHasta) return false;
      return true;
    }).sort((a, b) => b.checkin.localeCompare(a.checkin));
  }, [bookings, search, suiteFilter, estadoFilter, fechaDesde, fechaHasta]);

  const hasActiveFilters = suiteFilter || estadoFilter || fechaDesde || fechaHasta;

  function clearFilters() {
    setSuiteFilter(''); setEstadoFilter(''); setFechaDesde(''); setFechaHasta('');
  }

  async function refresh() {
    setLoading(true);
    const res = await fetch('/api/admin/reservas');
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }

  async function sendEmail(e: React.MouseEvent, b: AdminBooking) {
    e.stopPropagation();
    if (!b.email || b.email === 'N/A') return alert('Esta reserva no tiene email registrado');
    setSendingId(b.confirmacion);
    try {
      const res = await fetch(`/api/admin/reservas/${b.confirmacion}/send-email`, { method: 'POST' });
      if (res.ok) alert(`✅ Confirmación enviada a ${b.email}`);
      else { const d = await res.json(); alert('Error: ' + (d.error || 'No se pudo enviar')); }
    } finally { setSendingId(null); }
  }

  function downloadPDF(e: React.MouseEvent, b: AdminBooking) {
    e.stopPropagation();
    printBookingPDF(b);
  }

  const totalIngresos = filtered.reduce((s, b) => s + (b.estado !== 'CANCELADA' ? b.total : 0), 0);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reservas</h1>
          <p className={styles.pageSub}>
            {filtered.length} reservas · ${totalIngresos.toLocaleString('es-MX')} MXN
            {hasActiveFilters && <span className={styles.filterBadge}>Filtros activos</span>}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={refresh} disabled={loading} title="Actualizar">
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
          </button>
          <button
            className={`${styles.iconBtn} ${showFilters ? styles.iconBtnActive : ''}`}
            onClick={() => setShowFilters(s => !s)}
            title="Filtros"
          >
            Filtros {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button className={styles.primaryBtn} onClick={() => setModal({ mode: 'new' })}>
            <Plus size={16} /> Nueva reserva
          </button>
        </div>
      </div>

      {/* Búsqueda rápida */}
      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Buscar por cliente, email, confirmación o suite…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filtersGrid}>
            <label className={styles.filterField}>
              <span>Suite</span>
              <select value={suiteFilter} onChange={e => setSuiteFilter(e.target.value)}>
                <option value="">Todas</option>
                {SUITES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Estado</span>
              <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="MANUAL">Manual</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Check-in desde</span>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </label>
            <label className={styles.filterField}>
              <span>Check-in hasta</span>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </label>
          </div>
          {hasActiveFilters && (
            <button className={styles.clearBtn} onClick={clearFilters}>Limpiar filtros</button>
          )}
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Confirmación</th><th>Cliente</th><th>Suite</th>
              <th>Check-in</th><th>Check-out</th><th>Noches</th>
              <th>Total</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className={styles.empty}>Sin reservas que mostrar</td></tr>
            ) : filtered.map(b => (
              <tr key={b.confirmacion + b.rowIndex} className={styles.row}
                onClick={() => setModal({ mode: 'edit', booking: b })}>
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
                <td onClick={e => e.stopPropagation()}>
                  <div className={styles.rowActions}>
                    <button className={styles.actionBtn} onClick={e => sendEmail(e, b)}
                      disabled={sendingId === b.confirmacion} title="Enviar confirmación por email">
                      {sendingId === b.confirmacion ? <Loader2 size={13} className={styles.spin} /> : <Send size={13} />}
                    </button>
                    <button className={styles.actionBtnPdf} onClick={e => downloadPDF(e, b)} title="Descargar PDF">
                      <Download size={13} />
                    </button>
                  </div>
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
