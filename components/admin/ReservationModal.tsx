'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import styles from './Modal.module.css';

const SUITES = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla',
  'Suite Lajas','Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble',
  'Orquídeas 3','Bromelias','Helechos 1','Helechos 2',
];

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
    habitacion: booking?.habitaciones || SUITES[3],
    checkin: booking?.checkin || defaultCheckin || '',
    checkout: booking?.checkout || '',
    noches: booking?.noches || 1,
    huespedes: booking?.huespedes || 2,
    total: booking?.total || 0,
    notas: booking?.notas || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availStatus, setAvailStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [totalOverride, setTotalOverride] = useState(false);

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
    setAvailStatus('idle');
  }

  // Auto-calcular noches y precio
  useEffect(() => {
    const { checkin, checkout, habitacion, huespedes } = form;
    if (checkin && checkout) {
      const n = Math.max(0, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000));
      const precioNoche = getPrecioNoche(habitacion, huespedes);
      setForm(f => ({
        ...f,
        noches: n,
        total: totalOverride ? f.total : precioNoche * n,
      }));
    }
  }, [form.checkin, form.checkout, form.habitacion, form.huespedes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Verificar disponibilidad cuando cambian fechas o suite
  useEffect(() => {
    const { checkin, checkout, habitacion } = form;
    if (!checkin || !checkout || !habitacion || isEdit) return;
    const n = Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000);
    if (n <= 0) return;

    setAvailStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkin, checkout, rooms: [habitacion] }),
        });
        const data = await res.json();
        const unavailable: string[] = data.unavailableRooms || [];
        setAvailStatus(unavailable.length > 0 ? 'unavailable' : 'available');
      } catch {
        setAvailStatus('idle');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.checkin, form.checkout, form.habitacion, isEdit]);

  function handleCheckin(v: string) {
    set('checkin', v);
    if (form.checkout && v >= form.checkout) {
      const next = new Date(new Date(v).getTime() + 86400000).toISOString().split('T')[0];
      setForm(f => ({ ...f, checkin: v, checkout: next }));
    } else {
      setForm(f => ({ ...f, checkin: v }));
    }
  }

  const precioNoche = getPrecioNoche(form.habitacion, form.huespedes);
  const precioCalculado = precioNoche * Math.max(form.noches, 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && availStatus === 'unavailable') {
      setError('La habitación no está disponible en esas fechas.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = isEdit ? `/api/admin/reservas/${booking!.confirmacion}` : '/api/admin/reservas';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      onSaved();
      onClose();
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
            <label className={styles.field}>
              <span>Cliente *</span>
              <input value={form.cliente} onChange={e => set('cliente', e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>Teléfono / WhatsApp</span>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Suite *</span>
              <select value={form.habitacion} onChange={e => set('habitacion', e.target.value)} required>
                {SUITES.map(s => <option key={s}>{s}</option>)}
              </select>
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
              <span>Huéspedes</span>
              <select value={form.huespedes} onChange={e => set('huespedes', parseInt(e.target.value))}>
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} persona{n !== 1 ? 's' : ''}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Noches</span>
              <input type="number" min={1} value={form.noches} readOnly style={{ background: '#f5f3ef' }} />
            </label>
          </div>

          {/* Calculador de precio */}
          {!isEdit && (
            <div className={styles.priceCalc}>
              <div className={styles.priceCalcRow}>
                <span>${precioNoche.toLocaleString('es-MX')}/noche × {Math.max(form.noches, 1)} noches</span>
                <strong>${precioCalculado.toLocaleString('es-MX')} MXN</strong>
              </div>
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
                    ↩ Usar precio calculado
                  </button>
                )}
              </div>
            </div>
          )}

          {isEdit && (
            <label className={styles.field}>
              <span>Total (MXN)</span>
              <input type="number" min={0} value={form.total} onChange={e => set('total', parseInt(e.target.value))} />
            </label>
          )}

          {/* Estado de disponibilidad */}
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

          <label className={styles.field}>
            <span>Notas</span>
            <textarea rows={3} value={form.notas} onChange={e => set('notas', e.target.value)} />
          </label>

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
