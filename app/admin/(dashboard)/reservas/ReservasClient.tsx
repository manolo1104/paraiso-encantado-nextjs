'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, RefreshCw, Send, Download, Loader2, ChevronDown, ChevronUp, Sun, MessageSquare, Users, Wallet, FileSpreadsheet, Gift, StickyNote, X } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import ReservationModal from '@/components/admin/ReservationModal';
import { normalizeMxPhone } from '@/lib/phone';
import { parseNotas } from '@/lib/notas';
import { printBookingPDF } from '../cotizaciones/CotizacionesClient';
import styles from './reservas.module.css';

const SUITES = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla','Suite Lajas',
  'Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble','Orquídeas 3','Bromelias',
  'Helechos 1','Helechos 2',
];

// ── Operational state ────────────────────────────────────────────────────────

type OpsState = 'CHECK_IN_HOY' | 'CHECK_OUT_HOY' | 'EN_CASA' | 'PROXIMA' | 'COMPLETADA' | 'CANCELADA' | 'NO_SHOW';

function getOpsState(b: AdminBooking, today: string): OpsState {
  if (b.estado === 'CANCELADA') return 'CANCELADA';
  const ci = b.checkin;
  const co = b.checkout;
  if (!ci) return 'PROXIMA';
  if (ci === today) return 'CHECK_IN_HOY';
  if (co === today) return 'CHECK_OUT_HOY';
  if (ci < today && co > today) return 'EN_CASA';
  if (co < today) return 'COMPLETADA';
  return 'PROXIMA';
}

const OPS_LABEL: Record<OpsState, string> = {
  CHECK_IN_HOY:  'Check-in Hoy',
  CHECK_OUT_HOY: 'Check-out Hoy',
  EN_CASA:       'En Casa',
  PROXIMA:       'Próxima',
  COMPLETADA:    'Completada',
  CANCELADA:     'Cancelada',
  NO_SHOW:       'No Show',
};

const OPS_COLOR: Record<OpsState, { bg: string; color: string }> = {
  CHECK_IN_HOY:  { bg: '#e6f4e8', color: '#1a6b22' },
  CHECK_OUT_HOY: { bg: '#fff3d4', color: '#7a5a00' },
  EN_CASA:       { bg: '#e0f0f8', color: '#0d5070' },
  PROXIMA:       { bg: '#f9fafb', color: '#6b7280' },
  COMPLETADA:    { bg: '#f0f0f0', color: '#888' },
  CANCELADA:     { bg: '#fde8e8', color: '#8a1a1a' },
  NO_SHOW:       { bg: '#f8e0e8', color: '#7a0030' },
};

// ── Days to arrival ──────────────────────────────────────────────────────────

function daysToArrival(checkin: string, today: string): number {
  return Math.round(
    (new Date(checkin + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000
  );
}

function DaysChip({ days }: { days: number }) {
  if (!Number.isFinite(days)) return <span className={styles.daysChip} style={{ background: '#f9fafb', color: '#aaa' }}>—</span>;
  if (days < 0)  return <span className={styles.daysChip} style={{ background: '#f0f0f0', color: '#aaa' }}>Pasada</span>;
  if (days === 0) return <span className={styles.daysChip} style={{ background: '#e6f4e8', color: '#1a6b22', fontWeight: 700 }}>Hoy</span>;
  if (days === 1) return <span className={styles.daysChip} style={{ background: '#fff3d4', color: '#7a5a00', fontWeight: 700 }}>Mañana</span>;
  if (days <= 3)  return <span className={styles.daysChip} style={{ background: '#fff3d4', color: '#7a5a00' }}>{days}d</span>;
  if (days <= 7)  return <span className={styles.daysChip} style={{ background: '#fdf6e8', color: '#8a6830' }}>{days}d</span>;
  if (days <= 14) return <span className={styles.daysChip} style={{ background: '#f0f7f0', color: '#3d6e40' }}>{days}d</span>;
  return <span className={styles.daysChip} style={{ background: '#f9fafb', color: '#888' }}>{days}d</span>;
}

// ── Pagos: total / anticipo / pendiente ──────────────────────────────────────
// total = precio completo de la estancia (columna F)
// anticipo = lo realmente cobrado / depósito (columna O)
// pendiente = lo que falta por cobrar al huésped

function pagoOf(b: AdminBooking) {
  const total = b.total || 0;
  const anticipo = b.anticipo || 0;
  const pendiente = Math.max(0, total - anticipo);
  const pagado = total > 0 && pendiente <= 0;
  return { total, anticipo, pendiente, pagado };
}

const money = (n: number) => `$${Math.round(n).toLocaleString('es-MX')}`;

function PagoChip({ total, pendiente, pagado }: { total: number; pendiente: number; pagado: boolean }) {
  if (total <= 0) return <span className={styles.pagoNeutral}>—</span>;
  if (pagado)     return <span className={styles.pagoPagado}>✓ Pagado</span>;
  return <span className={styles.pagoFalta}>Falta {money(pendiente)}</span>;
}

// ── Indicadores: extras (tours/paquetes) y notas / peticiones ─────────────────

function ReservaTags({ notas }: { notas: string }) {
  const n = parseNotas(notas);
  const addons = [
    ...n.tours.map(t => (t as any).nombre),
    ...n.paquetes.map(p => (p as any).nombre),
    ...n.extras.map(e => e.nombre),
  ].filter(Boolean) as string[];
  const nota = n.cliente || n.interno;
  if (addons.length === 0 && !nota) return null;
  return (
    <div className={styles.reservaTags}>
      {addons.length > 0 && (
        <span className={styles.tagAddon} title={`Extras: ${addons.join(', ')}`}>
          <Gift size={11} /> {addons.length}
        </span>
      )}
      {nota && (
        <span className={styles.tagNote} title={`Petición: ${nota}`}>
          <StickyNote size={11} />
        </span>
      )}
    </div>
  );
}

// ── Registrar pago / cobrar saldo ─────────────────────────────────────────────

function CobrarModal({ booking, onClose, onSaved }: {
  booking: AdminBooking; onClose: () => void; onSaved: () => void;
}) {
  const p = pagoOf(booking);
  const [monto, setMonto] = useState(p.pendiente);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nuevoAnticipo = Math.min(p.total, p.anticipo + (monto || 0));
  const nuevoPendiente = Math.max(0, p.total - nuevoAnticipo);

  async function submit() {
    if (loading) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/reservas/${booking.confirmacion}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anticipo: nuevoAnticipo }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'No se pudo registrar el pago');
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.cobrarOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.cobrarModal}>
        <div className={styles.cobrarHeader}>
          <span className={styles.cobrarTitle}>Registrar pago</span>
          <button className={styles.cobrarClose} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={styles.cobrarBody}>
          <div className={styles.cobrarClient}>{booking.cliente} · {booking.confirmacion}</div>
          <div className={styles.cobrarRow}><span>Total</span><strong>{money(p.total)}</strong></div>
          <div className={styles.cobrarRow}><span>Ya cobrado</span><strong>{money(p.anticipo)}</strong></div>
          <div className={styles.cobrarRow}><span>Pendiente</span><strong className={styles.cobrarPend}>{money(p.pendiente)}</strong></div>

          <label className={styles.cobrarField}>
            <span>Monto que se cobra ahora (MXN)</span>
            <input
              type="number" min={0} max={p.pendiente} value={monto}
              autoFocus
              onChange={e => setMonto(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </label>
          <button type="button" className={styles.cobrarTodo} onClick={() => setMonto(p.pendiente)}>
            Cobrar todo el saldo ({money(p.pendiente)})
          </button>

          <div className={styles.cobrarResult}>
            Quedará: cobrado <strong>{money(nuevoAnticipo)}</strong> · pendiente{' '}
            <strong className={nuevoPendiente <= 0 ? styles.cobrarOk : styles.cobrarPend}>
              {nuevoPendiente <= 0 ? '$0 (pagado)' : money(nuevoPendiente)}
            </strong>
          </div>

          {error && <p className={styles.cobrarError}>{error}</p>}

          <div className={styles.cobrarActions}>
            <button type="button" className={styles.cobrarCancel} onClick={onClose}>Cancelar</button>
            <button type="button" className={styles.cobrarSave} onClick={submit} disabled={loading || monto <= 0}>
              {loading ? <Loader2 size={14} className={styles.spin} /> : <Wallet size={14} />}
              Registrar pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props { initialBookings: AdminBooking[] }

export default function ReservasClient({ initialBookings }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [search, setSearch] = useState('');
  const [suiteFilter, setSuiteFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [pagoFilter, setPagoFilter] = useState<'' | 'PENDIENTE' | 'PAGADO'>('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [vistaHoy, setVistaHoy] = useState(false);
  const [sortBy, setSortBy] = useState<'checkin' | 'reciente'>('checkin');
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; booking?: AdminBooking } | null>(null);
  const [cobrar, setCobrar] = useState<AdminBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Fecha de HOY en la zona horaria del hotel (no UTC). 'en-CA' da formato YYYY-MM-DD.
  // En estado (no useMemo congelado): si se deja la pestaña abierta toda la noche,
  // un temporizador la actualiza al cruzar la medianoche y los estados se recalculan.
  const [today, setToday] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }));
  useEffect(() => {
    const id = setInterval(() => {
      setToday(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }));
    }, 5 * 60 * 1000); // revisa cada 5 min
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter(b => {
      if (vistaHoy) {
        // Solo mostrar check-ins, check-outs y huéspedes en casa HOY
        const ops = getOpsState(b, today);
        if (!['CHECK_IN_HOY','CHECK_OUT_HOY','EN_CASA'].includes(ops)) return false;
      }
      if (q && !b.cliente.toLowerCase().includes(q) &&
          !b.email.toLowerCase().includes(q) &&
          !b.confirmacion.toLowerCase().includes(q) &&
          !b.habitaciones.toLowerCase().includes(q)) return false;
      if (suiteFilter && !b.habitaciones.includes(suiteFilter)) return false;
      if (estadoFilter) {
        const ops = getOpsState(b, today);
        if (ops !== estadoFilter) return false;
      }
      if (pagoFilter) {
        const { pagado } = pagoOf(b);
        if (pagoFilter === 'PAGADO' && !pagado) return false;
        if (pagoFilter === 'PENDIENTE' && (pagado || b.total <= 0)) return false;
      }
      if (fechaDesde && b.checkin < fechaDesde) return false;
      if (fechaHasta && b.checkin > fechaHasta) return false;
      return true;
    }).sort((a, b) => {
      if (vistaHoy) {
        const order = { CHECK_IN_HOY: 0, EN_CASA: 1, CHECK_OUT_HOY: 2 };
        const ao = order[getOpsState(a, today) as keyof typeof order] ?? 9;
        const bo = order[getOpsState(b, today) as keyof typeof order] ?? 9;
        return ao - bo;
      }
      if (sortBy === 'reciente') return b.rowIndex - a.rowIndex; // más alto rowIndex = más reciente en Sheets
      return b.checkin.localeCompare(a.checkin);
    });
  }, [bookings, search, suiteFilter, estadoFilter, pagoFilter, fechaDesde, fechaHasta, vistaHoy, sortBy, today]);

  // Counters for "today" badge
  const todayCounts = useMemo(() => ({
    checkIn:  bookings.filter(b => b.estado !== 'CANCELADA' && b.checkin === today).length,
    checkOut: bookings.filter(b => b.estado !== 'CANCELADA' && b.checkout === today).length,
    enCasa:   bookings.filter(b => b.estado !== 'CANCELADA' && b.checkin < today && b.checkout > today).length,
  }), [bookings, today]);

  const hasActiveFilters = suiteFilter || estadoFilter || pagoFilter || fechaDesde || fechaHasta;

  function clearFilters() {
    setSuiteFilter(''); setEstadoFilter(''); setPagoFilter(''); setFechaDesde(''); setFechaHasta('');
  }

  // Resumen financiero del conjunto visible (excluye canceladas): valor total,
  // ya cobrado (anticipos) y lo que falta por cobrar. Es el "de un vistazo".
  const resumen = useMemo(() => {
    return filtered.reduce((acc, b) => {
      if (getOpsState(b, today) === 'CANCELADA') return acc;
      const { total, anticipo, pendiente } = pagoOf(b);
      acc.total += total;
      acc.cobrado += anticipo;
      acc.pendiente += pendiente;
      return acc;
    }, { total: 0, cobrado: 0, pendiente: 0 });
  }, [filtered, today]);

  function openWhatsApp(e: React.MouseEvent, b: AdminBooking) {
    e.stopPropagation();
    const tel = normalizeMxPhone(b.telefono);
    if (!tel) return alert('Esta reserva no tiene teléfono / WhatsApp registrado.');
    const { pendiente, pagado } = pagoOf(b);
    const saldo = pagado || pendiente <= 0 ? '' : `\n\nTe recordamos que tu saldo pendiente es de ${money(pendiente)} MXN.`;
    const msg = encodeURIComponent(
      `Hola ${b.cliente}, te saludamos de Paraíso Encantado sobre tu reserva ${b.confirmacion}.${saldo}`
    );
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  }

  // Exporta las reservas actualmente visibles (con filtros) a CSV para Excel.
  function exportCSV() {
    const csvCell = (v: string | number) => {
      const s = String(v ?? '');
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ['Confirmación', 'Cliente', 'Teléfono', 'Email', 'Suite', 'Huéspedes',
      'Check-in', 'Check-out', 'Noches', 'Total', 'Anticipo', 'Pendiente', 'Estado', 'Cómo nos conoció'];
    const rows = filtered.map(b => {
      const ops = getOpsState(b, today);
      const p = pagoOf(b);
      const cancelada = ops === 'CANCELADA';
      return [
        b.confirmacion, b.cliente, b.telefono, b.email, b.habitaciones, b.huespedes,
        b.checkin, b.checkout, b.noches, p.total, cancelada ? 0 : p.anticipo,
        cancelada ? 0 : p.pendiente, OPS_LABEL[ops], b.comoNosConocio,
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
    // BOM (﻿) para que Excel abra los acentos correctamente en UTF-8.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reservas</h1>
          <p className={styles.pageSub}>
            {filtered.length} reservas
            {hasActiveFilters && <span className={styles.filterBadge}>Filtros activos</span>}
          </p>
        </div>
        <div className={styles.headerActions}>
          {/* Vista HOY */}
          <button
            className={`${styles.todayBtn} ${vistaHoy ? styles.todayBtnActive : ''}`}
            onClick={() => { setVistaHoy(v => !v); clearFilters(); }}
            title="Ver solo actividad de hoy"
          >
            <Sun size={14} />
            Hoy
            {(todayCounts.checkIn + todayCounts.checkOut + todayCounts.enCasa) > 0 && (
              <span className={styles.todayCount}>
                {todayCounts.checkIn + todayCounts.checkOut + todayCounts.enCasa}
              </span>
            )}
          </button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'checkin' | 'reciente')}
            className={styles.select}
            style={{ fontSize: '0.8rem', padding: '6px 10px', minWidth: 0 }}
          >
            <option value="checkin">Por check-in</option>
            <option value="reciente">Más recientes</option>
          </select>
          <button className={styles.iconBtn} onClick={refresh} disabled={loading} title="Actualizar">
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
          </button>
          <button className={styles.iconBtn} onClick={exportCSV} disabled={filtered.length === 0}
            title="Exportar a Excel/CSV">
            <FileSpreadsheet size={16} />
          </button>
          <button
            className={`${styles.iconBtn} ${showFilters ? styles.iconBtnActive : ''}`}
            onClick={() => setShowFilters(s => !s)}
          >
            Filtros {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button className={styles.primaryBtn} onClick={() => setModal({ mode: 'new' })}>
            <Plus size={16} /> Nueva reserva
          </button>
        </div>
      </div>

      {/* Resumen financiero — de un vistazo (excluye canceladas) */}
      <div className={styles.moneySummary}>
        <div className={styles.moneyStat}>
          <span className={styles.moneyStatLabel}>Valor total</span>
          <span className={styles.moneyStatValue}>{money(resumen.total)}</span>
        </div>
        <div className={`${styles.moneyStat} ${styles.moneyStatPaid}`}>
          <span className={styles.moneyStatLabel}>Cobrado (anticipos)</span>
          <span className={styles.moneyStatValue}>{money(resumen.cobrado)}</span>
        </div>
        <div className={`${styles.moneyStat} ${styles.moneyStatDue}`}>
          <span className={styles.moneyStatLabel}>Por cobrar</span>
          <span className={styles.moneyStatValue}>{money(resumen.pendiente)}</span>
        </div>
      </div>

      {/* Vista HOY summary */}
      {vistaHoy && (
        <div className={styles.todaySummary}>
          <div className={styles.todayCard} style={{ borderColor: '#2d7a34' }}>
            <span className={styles.todayCardNum} style={{ color: '#2d7a34' }}>{todayCounts.checkIn}</span>
            <span className={styles.todayCardLabel}>Check-in hoy</span>
          </div>
          <div className={styles.todayCard} style={{ borderColor: '#0d5070' }}>
            <span className={styles.todayCardNum} style={{ color: '#0d5070' }}>{todayCounts.enCasa}</span>
            <span className={styles.todayCardLabel}>En casa</span>
          </div>
          <div className={styles.todayCard} style={{ borderColor: '#7a5a00' }}>
            <span className={styles.todayCardNum} style={{ color: '#7a5a00' }}>{todayCounts.checkOut}</span>
            <span className={styles.todayCardLabel}>Check-out hoy</span>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Buscar por cliente, email, confirmación o suite…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filtros avanzados */}
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
              <span>Estado operativo</span>
              <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="CHECK_IN_HOY">Check-in Hoy</option>
                <option value="CHECK_OUT_HOY">Check-out Hoy</option>
                <option value="EN_CASA">En Casa</option>
                <option value="PROXIMA">Próxima</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Estado de pago</span>
              <select value={pagoFilter} onChange={e => setPagoFilter(e.target.value as '' | 'PENDIENTE' | 'PAGADO')}>
                <option value="">Todos</option>
                <option value="PENDIENTE">Con saldo pendiente</option>
                <option value="PAGADO">Pagadas por completo</option>
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

      {/* ── Mobile: tarjetas apiladas (visible solo en <640px via CSS) ── */}
      <div className={styles.mobileCardList}>
        {filtered.length === 0 ? (
          <p className={styles.empty} style={{ textAlign: 'center', padding: '32px 0' }}>
            {vistaHoy ? 'Sin actividad para hoy' : 'Sin reservas que mostrar'}
          </p>
        ) : filtered.map(b => {
          const ops = getOpsState(b, today);
          const opsStyle = OPS_COLOR[ops];
          return (
            <div key={b.confirmacion + b.rowIndex} className={styles.mobileCard}>
              <div className={styles.mobileCardTop}>
                <span className={styles.mobileCardRef}>{b.confirmacion || '—'}</span>
                <span className={styles.mobileCardSuite}>{b.habitaciones}</span>
                <span className={styles.opsBadge} style={{ background: opsStyle.bg, color: opsStyle.color, fontSize: '0.65rem' }}>
                  {OPS_LABEL[ops]}
                </span>
              </div>
              <div className={styles.mobileCardName}>{b.cliente}</div>
              {b.email && b.email !== 'N/A' && <div className={styles.mobileCardEmail}>{b.email}</div>}
              <div className={styles.mobileCardDates}>
                Check-in: <strong>{b.checkin}</strong> → Check-out: <strong>{b.checkout}</strong> · {b.noches}n
                {b.huespedes > 0 && <> · {b.huespedes} huésped{b.huespedes !== 1 ? 'es' : ''}</>}
              </div>
              {(() => {
                const p = pagoOf(b);
                const cancelada = ops === 'CANCELADA';
                return (
                  <div className={styles.mobilePago}>
                    <span className={styles.mobilePagoTotal} style={cancelada ? { textDecoration: 'line-through', color: '#aaa' } : undefined}>Total {money(p.total)}</span>
                    {!cancelada && p.anticipo > 0 && <span className={styles.mobilePagoAnticipo}>· Anticipo {money(p.anticipo)}</span>}
                    {!cancelada && (
                      <span className={p.pagado ? styles.pagoPagado : styles.pagoFalta}>
                        {p.total <= 0 ? '—' : p.pagado ? '✓ Pagado' : `Falta ${money(p.pendiente)}`}
                      </span>
                    )}
                  </div>
                );
              })()}
              <ReservaTags notas={b.notas} />
              <div className={styles.mobileCardActions}>
                <button className={`${styles.mobileCardBtn} ${styles.mobileCardBtnPrimary}`}
                  onClick={() => setModal({ mode: 'edit', booking: b })}>
                  Ver / Editar
                </button>
                {ops !== 'CANCELADA' && pagoOf(b).pendiente > 0 && (
                  <button className={`${styles.mobileCardBtn} ${styles.mobileCardBtnCobrar}`}
                    onClick={e => { e.stopPropagation(); setCobrar(b); }}>
                    <Wallet size={12} /> Cobrar
                  </button>
                )}
                {b.telefono && b.telefono !== 'N/A' && (
                  <button className={`${styles.mobileCardBtn} ${styles.mobileCardBtnWa}`}
                    onClick={e => openWhatsApp(e, b)}>
                    <MessageSquare size={12} /> WhatsApp
                  </button>
                )}
                <button className={`${styles.mobileCardBtn} ${styles.mobileCardBtnSecondary}`}
                  onClick={e => sendEmail(e, b)} disabled={sendingId === b.confirmacion}>
                  {sendingId === b.confirmacion ? <Loader2 size={12} className={styles.spin} /> : null} Email
                </button>
                <a href={`/api/admin/reservas/${b.confirmacion}/render`} target="_blank" rel="noopener"
                  className={`${styles.mobileCardBtn} ${styles.mobileCardBtnPdf}`}
                  style={{ display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                  onClick={e => e.stopPropagation()}>
                  PDF
                </a>
              </div>
            </div>
          );
        })}
      </div>
      <p className={styles.scrollHint}>← desliza para ver más →</p>

      {/* Desktop tabla */}
      <div className={styles.tableScrollWrap}>
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
              <th>Días</th>
              <th>Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.empty}>
                  {vistaHoy ? 'Sin actividad para hoy' : 'Sin reservas que mostrar'}
                </td>
              </tr>
            ) : filtered.map(b => {
              const ops = getOpsState(b, today);
              const opsStyle = OPS_COLOR[ops];
              const days = daysToArrival(b.checkin, today);
              return (
                <tr
                  key={b.confirmacion + b.rowIndex}
                  className={`${styles.row} ${ops === 'CHECK_IN_HOY' ? styles.rowHighlight : ops === 'CHECK_OUT_HOY' ? styles.rowCheckout : ''}`}
                  onClick={() => setModal({ mode: 'edit', booking: b })}
                >
                  <td className={styles.mono}>{b.confirmacion || '—'}</td>
                  <td>
                    <div className={styles.clienteName}>{b.cliente}</div>
                    {b.email && b.email !== 'N/A' && <div className={styles.clienteEmail}>{b.email}</div>}
                  </td>
                  <td>
                    <div>{b.habitaciones}</div>
                    {b.huespedes > 0 && (
                      <div className={styles.suiteGuests}>
                        <Users size={11} /> {b.huespedes} huésped{b.huespedes !== 1 ? 'es' : ''}
                      </div>
                    )}
                    <ReservaTags notas={b.notas} />
                  </td>
                  <td>{b.checkin}</td>
                  <td>{b.checkout}</td>
                  <td>{b.noches}</td>
                  <td><DaysChip days={days} /></td>
                  <td className={styles.pagoCell}>
                    {(() => {
                      const p = pagoOf(b);
                      const cancelada = ops === 'CANCELADA';
                      return <>
                        <div className={styles.pagoTotal} style={cancelada ? { textDecoration: 'line-through', color: '#aaa' } : undefined}>{money(p.total)}</div>
                        {!cancelada && p.anticipo > 0 && <div className={styles.pagoAnticipo}>Anticipo {money(p.anticipo)}</div>}
                        {!cancelada && <PagoChip total={p.total} pendiente={p.pendiente} pagado={p.pagado} />}
                      </>;
                    })()}
                  </td>
                  <td>
                    <span
                      className={styles.opsBadge}
                      style={{ background: opsStyle.bg, color: opsStyle.color }}
                    >
                      {OPS_LABEL[ops]}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className={styles.rowActions}>
                      {ops !== 'CANCELADA' && pagoOf(b).pendiente > 0 && (
                        <button className={styles.actionBtnCobrar} onClick={e => { e.stopPropagation(); setCobrar(b); }}
                          title="Registrar pago / cobrar saldo">
                          <Wallet size={13} />
                        </button>
                      )}
                      {b.telefono && b.telefono !== 'N/A' && (
                        <button className={styles.actionBtnWa} onClick={e => openWhatsApp(e, b)}
                          title="Escribir por WhatsApp">
                          <MessageSquare size={13} />
                        </button>
                      )}
                      <button className={styles.actionBtn} onClick={e => sendEmail(e, b)}
                        disabled={sendingId === b.confirmacion} title="Enviar confirmación">
                        {sendingId === b.confirmacion ? <Loader2 size={13} className={styles.spin} /> : <Send size={13} />}
                      </button>
                      <a href={`/api/admin/reservas/${b.confirmacion}/render`} target="_blank" rel="noopener"
                        className={styles.actionBtnPdf} title="Descargar confirmación"
                        style={{ display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                        onClick={e => e.stopPropagation()}>
                        <Download size={13} />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div> {/* /tableScrollWrap */}

      {modal && (
        <ReservationModal
          booking={modal.mode === 'edit' ? modal.booking : undefined}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}

      {cobrar && (
        <CobrarModal
          booking={cobrar}
          onClose={() => setCobrar(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
