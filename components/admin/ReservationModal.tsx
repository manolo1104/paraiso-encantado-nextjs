'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle, Plus, MessageSquare, Mail, Download, Pencil } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import { printBookingPDF } from '@/app/admin/(dashboard)/cotizaciones/CotizacionesClient';
import styles from './Modal.module.css';

const SUITES = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla',
  'Suite Lajas','Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble',
  'Orquídeas 3','Bromelias','Helechos 1','Helechos 2',
];

interface HabItem { suite: string; huespedes: number; precioOverride?: number }

const PRECIO_TIERS: Record<string, Record<number, number>> = {
  'Jungla':              { 2: 1900, 3: 2400, 4: 2400 },
  'Suite LindaVista':    { 2: 1900, 3: 2400, 4: 2400 },
  'Suite Flor de Liz 1': { 2: 1900, 3: 2400, 4: 2400 },
  'Suite Flor de Liz 2': { 2: 1900, 3: 2400, 4: 2400 },
  'Suite Lajas':         { 2: 1900, 3: 2400, 4: 2400 },
  'Helechos 1':          { 2: 1900, 3: 2400, 4: 2400, 5: 2700, 6: 3000 },
  'Helechos 2':          { 2: 1900, 3: 2400, 4: 2400, 5: 2700, 6: 3000 },
  'Lirios 1':            { 2: 1500, 3: 1900, 4: 1900 },
  'Lirios 2':            { 2: 1500, 3: 1900, 4: 1900 },
  'Orquídeas 2':         { 2: 1500 },
  'Orquídeas Doble':     { 2: 1500, 3: 1900, 4: 1900 },
  'Orquídeas 3':         { 2: 1500 },
  'Bromelias':           { 2: 1500, 3: 1900, 4: 1900 },
};

function getPrecioNoche(suite: string, personas: number): number {
  const tiers = PRECIO_TIERS[suite] || { 2: 1900 };
  const keys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
  let precio = tiers[keys[0]];
  for (const k of keys) { if (personas >= k) precio = tiers[k]; }
  return precio;
}

function getHabPrecio(hab: HabItem): number {
  return hab.precioOverride ?? getPrecioNoche(hab.suite, hab.huespedes);
}

function fmtDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

interface CRMClient { nombre: string; email: string; telefono: string; totalReservas: number }

// ── Success panel after creating a booking ───────────────────────────────────
interface SuccessData {
  confirmacion: string; cliente: string; email: string; telefono: string;
  habitaciones: string; checkin: string; checkout: string;
  noches: number; huespedes: number; total: number;
  anticipo: number; notas: string; fecha: string;
}

function SuccessPanel({ data, onEdit, onClose }: {
  data: SuccessData;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [sendingEmail, setSendingEmail] = useState(false);

  function openWA() {
    const msg = encodeURIComponent(
      `Hola ${data.cliente}, confirmamos tu reserva en Paraíso Encantado:\n\n` +
      `✅ Folio: ${data.confirmacion}\n` +
      `🏡 Suite: ${data.habitaciones}\n` +
      `📅 Check-in: ${fmtDate(data.checkin)}\n` +
      `📅 Check-out: ${fmtDate(data.checkout)}\n` +
      `🌙 ${data.noches} noche${data.noches !== 1 ? 's' : ''}\n` +
      `💰 Total: $${data.total.toLocaleString('es-MX')} MXN\n\n` +
      `¡Te esperamos!`
    );
    const tel = (data.telefono || '524891007679').replace(/\D/g, '');
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  }

  async function sendEmail() {
    if (!data.email || data.email === 'N/A') return alert('Sin email registrado');
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/admin/reservas/${data.confirmacion}/send-email`, { method: 'POST' });
      if (res.ok) alert(`✅ Confirmación enviada a ${data.email}`);
      else { const d = await res.json(); alert('Error: ' + (d.error || 'No se pudo enviar')); }
    } finally { setSendingEmail(false); }
  }

  function downloadPDF() {
    printBookingPDF({ ...data });
  }

  return (
    <div className={styles.successPanel}>
      <div className={styles.successHeader}>
        <CheckCircle size={20} style={{ color: '#2d7a34' }} />
        <span className={styles.successTitle}>Reserva creada</span>
        <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
      </div>

      <div className={styles.successBody}>
        <div className={styles.successConfNum}>{data.confirmacion}</div>

        <div className={styles.successGrid}>
          <div><span className={styles.successLabel}>Cliente</span><span className={styles.successVal}>{data.cliente}</span></div>
          <div><span className={styles.successLabel}>Suite</span><span className={styles.successVal}>{data.habitaciones}</span></div>
          <div><span className={styles.successLabel}>Check-in</span><span className={styles.successVal}>{fmtDate(data.checkin)}</span></div>
          <div><span className={styles.successLabel}>Check-out</span><span className={styles.successVal}>{fmtDate(data.checkout)}</span></div>
          <div><span className={styles.successLabel}>Noches</span><span className={styles.successVal}>{data.noches}</span></div>
          <div><span className={styles.successLabel}>Total</span><span className={styles.successVal} style={{ color: 'var(--forest)', fontWeight: 700 }}>${data.total.toLocaleString('es-MX')} MXN</span></div>
          {data.anticipo > 0 && <>
            <div><span className={styles.successLabel}>Anticipo</span><span className={styles.successVal}>${data.anticipo.toLocaleString('es-MX')} MXN</span></div>
            <div><span className={styles.successLabel}>Restante</span><span className={styles.successVal}>${(data.total - data.anticipo).toLocaleString('es-MX')} MXN</span></div>
          </>}
        </div>

        <div className={styles.successActions}>
          <button className={styles.successActionBtn} style={{ background: '#25D366' }} onClick={openWA}>
            <MessageSquare size={14} /> WhatsApp
          </button>
          <button className={styles.successActionBtn} style={{ background: 'var(--forest)' }} onClick={sendEmail} disabled={sendingEmail}>
            {sendingEmail ? <Loader2 size={14} className={styles.spin} /> : <Mail size={14} />} Email
          </button>
          <button className={styles.successActionBtn} style={{ background: '#624820' }} onClick={downloadPDF}>
            <Download size={14} /> PDF
          </button>
          <button className={styles.successActionBtn} style={{ background: 'var(--clay)' }} onClick={onEdit}>
            <Pencil size={14} /> Editar
          </button>
        </div>

        <button className={styles.secondaryBtn} onClick={onClose} style={{ width: '100%', marginTop: 4 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────

interface Props {
  booking?: AdminBooking;
  defaultCheckin?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ReservationModal({ booking, defaultCheckin, onClose, onSaved }: Props) {
  const isEdit = !!booking;

  const [form, setForm] = useState({
    cliente: booking?.cliente || '',
    telefono: booking?.telefono || '',
    email: booking?.email || '',
    checkin: booking?.checkin || defaultCheckin || '',
    checkout: booking?.checkout || '',
    noches: booking?.noches || 1,
    total: booking?.total || 0,
  });

  const INTERNO_SEP = '||INTERNO||';
  const rawNotas = booking?.notas || '';
  const [notasCliente, setNotasCliente] = useState(() => {
    const idx = rawNotas.indexOf(INTERNO_SEP);
    return idx === -1 ? rawNotas.trim() : rawNotas.slice(0, idx).trim();
  });
  const [notasInternas, setNotasInternas] = useState(() => {
    const idx = rawNotas.indexOf(INTERNO_SEP);
    return idx === -1 ? '' : rawNotas.slice(idx + INTERNO_SEP.length).trim();
  });

  const [habitaciones, setHabitaciones] = useState<HabItem[]>(() => {
    if (booking?.habitaciones) {
      const suiteList = booking.habitaciones.split(', ').filter(Boolean).map(s => s.trim());
      // Bug fix: use booking.huespedes for single-room, distribute for multi-room
      const guestsPerRoom = suiteList.length === 1
        ? Math.min(booking.huespedes || 2, 8)
        : 2;
      return suiteList.map(s => ({ suite: s, huespedes: guestsPerRoom }));
    }
    return [{ suite: SUITES[3], huespedes: 2 }];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availStatus, setAvailStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  // Bug fix: start with totalOverride=true when editing to preserve stored total
  const [totalOverride, setTotalOverride] = useState(isEdit);
  const [loyalty, setLoyalty] = useState<{ tier: string; discountPct: number; totalReservas: number } | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  // CRM autocomplete
  const [crmClients, setCrmClients] = useState<CRMClient[]>([]);
  const [activeSuggestField, setActiveSuggestField] = useState<'cliente' | 'email' | 'telefono' | null>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  // Anticipo / Restante
  const [anticipo, setAnticipo] = useState(booking?.anticipo || 0);
  const [restanteOverride, setRestanteOverride] = useState<number | null>(null);

  // Load CRM clients once for autocomplete (new reservations only)
  useEffect(() => {
    if (isEdit) return;
    fetch('/api/admin/clientes')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => setCrmClients(data.map((c: any) => ({
        nombre: c.nombre || '',
        email: c.email || '',
        telefono: c.telefono || '',
        totalReservas: c.totalReservas || 0,
      }))))
      .catch(() => {});
  }, [isEdit]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setActiveSuggestField(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function getSuggestions(field: 'cliente' | 'email' | 'telefono') {
    const val = form[field].trim().toLowerCase();
    if (val.length < 2) return [];
    return crmClients.filter(c => {
      if (field === 'cliente') return c.nombre.toLowerCase().includes(val);
      if (field === 'email') return c.email.toLowerCase().includes(val);
      if (field === 'telefono') return c.telefono.includes(val);
      return false;
    }).slice(0, 5);
  }

  function applySuggestion(c: CRMClient) {
    setForm(f => ({ ...f, cliente: c.nombre, email: c.email, telefono: c.telefono }));
    setActiveSuggestField(null);
  }

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
    setAvailStatus('idle');
  }

  function addHab() { setHabitaciones(h => [...h, { suite: SUITES[3], huespedes: 2 }]); }
  function removeHab(i: number) { setHabitaciones(h => h.filter((_, idx) => idx !== i)); setTotalOverride(false); }

  function updateHab(i: number, key: 'suite' | 'huespedes', val: string | number) {
    setHabitaciones(h => h.map((item, idx) =>
      idx === i ? { ...item, [key]: val, precioOverride: undefined } : item
    ));
    setTotalOverride(false);
    setAvailStatus('idle');
  }

  function updateHabPrecio(i: number, precio: number) {
    setHabitaciones(h => h.map((item, idx) =>
      idx === i ? { ...item, precioOverride: precio } : item
    ));
    setTotalOverride(false);
  }

  const totalHuespedes = habitaciones.reduce((sum, h) => sum + h.huespedes, 0);
  const precioCalculado = habitaciones.reduce((sum, h) => sum + getHabPrecio(h) * Math.max(form.noches, 1), 0);
  const restante = restanteOverride ?? (form.total - anticipo);

  // Auto-calcular noches y precio (only when NOT editing)
  useEffect(() => {
    const { checkin, checkout } = form;
    if (checkin && checkout) {
      const n = Math.max(0, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000));
      const precioAuto = habitaciones.reduce((sum, h) => sum + getHabPrecio(h) * n, 0);
      setForm(f => ({
        ...f,
        noches: n,
        total: totalOverride ? f.total : precioAuto,
      }));
    }
  }, [form.checkin, form.checkout, habitaciones, totalOverride]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!totalOverride) setRestanteOverride(null);
  }, [form.total, totalOverride]);

  useEffect(() => {
    const { checkin, checkout } = form;
    if (!checkin || !checkout || isEdit) return;
    const n = Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000);
    if (n <= 0) return;
    setAvailStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkin, checkout, rooms: habitaciones.map(h => h.suite) }),
        });
        const data = await res.json();
        setAvailStatus((data.unavailableRooms || []).length > 0 ? 'unavailable' : 'available');
      } catch { setAvailStatus('idle'); }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.checkin, form.checkout, habitaciones, isEdit]);

  useEffect(() => {
    const email = form.email?.trim();
    if (!email || isEdit) { setLoyalty(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/loyalty?email=${encodeURIComponent(email)}`);
        if (res.ok) { const d = await res.json(); if (d.tier) setLoyalty(d); else setLoyalty(null); }
      } catch { setLoyalty(null); }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.email, isEdit]);

  function applyLoyaltyDiscount() {
    if (!loyalty) return;
    const discounted = Math.round(precioCalculado * (1 - loyalty.discountPct / 100));
    setTotalOverride(true);
    setForm(f => ({ ...f, total: discounted }));
  }

  function handleCheckin(v: string) {
    set('checkin', v);
    if (form.checkout && v >= form.checkout) {
      const next = new Date(new Date(v).getTime() + 86400000).toISOString().split('T')[0];
      setForm(f => ({ ...f, checkin: v, checkout: next }));
    } else {
      setForm(f => ({ ...f, checkin: v }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && availStatus === 'unavailable') {
      setError('Una o más habitaciones no están disponibles en esas fechas.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const habitacion = habitaciones.map(h => h.suite).join(', ');
      const notas = notasInternas.trim() ? `${notasCliente}${INTERNO_SEP}${notasInternas}` : notasCliente;
      const url = isEdit ? `/api/admin/reservas/${booking!.confirmacion}` : '/api/admin/reservas';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, habitacion, huespedes: totalHuespedes, anticipo, notas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      onSaved(); // refresh parent

      if (!isEdit && data.confirmacion) {
        // Show success panel instead of closing
        setSuccessData({
          confirmacion: data.confirmacion,
          cliente: form.cliente,
          email: form.email,
          telefono: form.telefono,
          habitaciones: habitacion,
          checkin: form.checkin,
          checkout: form.checkout,
          noches: form.noches,
          huespedes: totalHuespedes,
          total: form.total,
          anticipo,
          notas,
          fecha: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
        });
      } else {
        onClose();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!booking || !confirm(`¿Cancelar la reserva ${booking.confirmacion}? Se liberarán las fechas.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reservas/${booking.confirmacion}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al cancelar');
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Show success panel
  if (successData) {
    return (
      <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div className={styles.modal}>
          <SuccessPanel
            data={successData}
            onEdit={() => setSuccessData(null)} // go back to form (will show as new, just informational)
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  // ── Autocomplete helper ──────────────────────────────────────────────────────
  function AutoSuggest({ field }: { field: 'cliente' | 'email' | 'telefono' }) {
    const suggestions = getSuggestions(field);
    if (activeSuggestField !== field || suggestions.length === 0) return null;
    return (
      <div ref={suggestRef} className={styles.suggestDropdown}>
        {suggestions.map(c => (
          <div key={c.email} className={styles.suggestItem} onMouseDown={() => applySuggestion(c)}>
            <span className={styles.suggestName}>{c.nombre}</span>
            <span className={styles.suggestMeta}>{c.email} · {c.telefono} · {c.totalReservas} estancia{c.totalReservas !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
          {isEdit && <span className={styles.confirmNum}>{booking.confirmacion}</span>}
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid2}>
            {/* Cliente con autocomplete */}
            <label className={styles.field} style={{ position: 'relative' }}>
              <span>Cliente *</span>
              <input
                value={form.cliente}
                onChange={e => { set('cliente', e.target.value); setActiveSuggestField('cliente'); }}
                onFocus={() => setActiveSuggestField('cliente')}
                required
                autoComplete="off"
              />
              <AutoSuggest field="cliente" />
            </label>

            {/* Teléfono con autocomplete */}
            <label className={styles.field} style={{ position: 'relative' }}>
              <span>Teléfono / WhatsApp</span>
              <input
                value={form.telefono}
                onChange={e => { set('telefono', e.target.value); setActiveSuggestField('telefono'); }}
                onFocus={() => setActiveSuggestField('telefono')}
                autoComplete="off"
              />
              <AutoSuggest field="telefono" />
            </label>

            {/* Email con autocomplete */}
            <label className={styles.field} style={{ position: 'relative' }}>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={e => { set('email', e.target.value); setActiveSuggestField('email'); }}
                onFocus={() => setActiveSuggestField('email')}
                autoComplete="off"
              />
              <AutoSuggest field="email" />
            </label>

            <label className={styles.field}>
              <span>Check-in *</span>
              <input type="date" value={form.checkin} onChange={e => handleCheckin(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>Check-out *</span>
              <input type="date" value={form.checkout}
                min={form.checkin || undefined}
                onChange={e => set('checkout', e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>Noches</span>
              <input type="number" min={1} value={form.noches} readOnly style={{ background: '#f5f3ef' }} />
            </label>
          </div>

          {/* Habitaciones */}
          <div className={styles.roomsSection}>
            <div className={styles.roomsSectionHeader}>
              <span className={styles.roomsSectionLabel}>Habitaciones *</span>
              <button type="button" className={styles.addRoomBtn} onClick={addHab}>
                <Plus size={13} /> Agregar habitación
              </button>
            </div>
            {habitaciones.map((hab, i) => (
              <div key={i} className={styles.roomRow}>
                <select className={styles.roomRowSelect} value={hab.suite}
                  onChange={e => updateHab(i, 'suite', e.target.value)}>
                  {SUITES.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className={styles.roomRowSelect} value={hab.huespedes}
                  onChange={e => updateHab(i, 'huespedes', parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}p</option>)}
                </select>
                <input
                  type="number" min={0}
                  className={styles.roomPriceInput}
                  value={getHabPrecio(hab)}
                  onChange={e => updateHabPrecio(i, parseInt(e.target.value) || 0)}
                  title="Precio por noche"
                />
                {habitaciones.length > 1 && (
                  <button type="button" className={styles.removeRoomBtn} onClick={() => removeHab(i)}>
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            <p className={styles.roomsTotal}>{totalHuespedes} huésped{totalHuespedes !== 1 ? 'es' : ''} en total</p>
          </div>

          {/* Calculador de precio */}
          <div className={styles.priceCalc}>
            {habitaciones.length > 1 && habitaciones.map((hab, i) => {
              const pn = getHabPrecio(hab);
              return (
                <div key={i} className={styles.priceCalcRow}>
                  <span>{hab.suite} ({hab.huespedes}p) × {Math.max(form.noches,1)} noches</span>
                  <span>${(pn * Math.max(form.noches,1)).toLocaleString('es-MX')}</span>
                </div>
              );
            })}
            {habitaciones.length === 1 && (
              <div className={styles.priceCalcRow}>
                <span>${getHabPrecio(habitaciones[0]).toLocaleString('es-MX')}/noche × {Math.max(form.noches, 1)} noches</span>
                <strong>${precioCalculado.toLocaleString('es-MX')} MXN</strong>
              </div>
            )}
            <div className={styles.totalRow}>
              <label className={styles.field} style={{ flex: 1 }}>
                <span>Total a cobrar (MXN) *</span>
                <input
                  type="number" min={0} value={form.total}
                  onChange={e => { setTotalOverride(true); set('total', parseInt(e.target.value) || 0); }}
                  required
                />
              </label>
              {form.total !== precioCalculado && (
                <button type="button" className={styles.resetPrice}
                  onClick={() => { setTotalOverride(false); set('total', precioCalculado); }}>
                  ↩ Usar calculado
                </button>
              )}
            </div>
          </div>

          {/* Anticipo / Restante */}
          <div className={styles.anticipoSection}>
            <span className={styles.anticipoTitle}>Anticipo y saldo pendiente</span>
            <div className={styles.anticipoGrid}>
              <div className={styles.anticipoFieldWrap}>
                <span>Anticipo recibido (MXN)</span>
                <input
                  type="number" min={0}
                  value={anticipo}
                  onChange={e => { setAnticipo(parseInt(e.target.value) || 0); setRestanteOverride(null); }}
                />
              </div>
              <div className={styles.anticipoFieldWrap}>
                <span>Saldo restante (MXN)</span>
                <input
                  type="number" min={0}
                  value={restante}
                  onChange={e => setRestanteOverride(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            {restanteOverride !== null && (
              <button type="button" className={styles.anticipoReset}
                onClick={() => setRestanteOverride(null)}>
                ↩ Recalcular restante
              </button>
            )}
          </div>

          {/* Badge de lealtad */}
          {loyalty && loyalty.tier && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: loyalty.tier === 'ORO' ? '#fdf9f0' : '#fdf5e6', borderRadius: 4, border: `1px solid ${loyalty.tier === 'ORO' ? '#c9a97a' : '#d4a84b'}` }}>
              <span style={{ fontSize: '1.1rem' }}>{loyalty.tier === 'ORO' ? '🥇' : '🥈'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: loyalty.tier === 'ORO' ? '#8a6830' : '#7a5a20' }}>
                  Huésped {loyalty.tier} · {loyalty.discountPct}% descuento ({loyalty.totalReservas} estancias)
                </div>
              </div>
              {!totalOverride && (
                <button type="button" onClick={applyLoyaltyDiscount}
                  style={{ background: '#2a2218', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Aplicar {loyalty.discountPct}%
                </button>
              )}
            </div>
          )}

          {/* Disponibilidad */}
          {!isEdit && form.checkin && form.checkout && (
            <div className={`${styles.availBadge} ${
              availStatus === 'available' ? styles.availOk :
              availStatus === 'unavailable' ? styles.availNo :
              availStatus === 'checking' ? styles.availChecking : ''
            }`}>
              {availStatus === 'checking' && <><Loader2 size={13} className={styles.spin} /> Verificando disponibilidad…</>}
              {availStatus === 'available' && <><CheckCircle size={13} /> Disponible en esas fechas</>}
              {availStatus === 'unavailable' && <><AlertTriangle size={13} /> No disponible en esas fechas</>}
            </div>
          )}

          {/* Notas */}
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Notas para el cliente (aparece en PDF)</span>
              <textarea rows={2} value={notasCliente} onChange={e => setNotasCliente(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Notas internas (solo tú las ves)</span>
              <textarea rows={2} value={notasInternas} onChange={e => setNotasInternas(e.target.value)} />
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            {isEdit && (
              <button type="button" className={styles.dangerBtn} onClick={handleCancel} disabled={loading}>
                Cancelar reserva
              </button>
            )}
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>Cerrar</button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={loading || (!isEdit && availStatus === 'unavailable')}
            >
              {loading ? <Loader2 size={16} className={styles.spin} /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
