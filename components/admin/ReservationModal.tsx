'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { AdminBooking } from '@/lib/admin/sheets-admin';
import styles from './Modal.module.css';

const SUITES = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla',
  'Suite Lajas','Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble',
  'Orquídeas 3','Bromelias','Helechos 1','Helechos 2',
];

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
    total: booking?.total || 1900,
    notas: booking?.notas || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  // Auto-calcular noches
  function handleCheckin(v: string) {
    set('checkin', v);
    if (form.checkout) {
      const diff = Math.round((new Date(form.checkout).getTime() - new Date(v).getTime()) / 86400000);
      if (diff > 0) set('noches', diff);
    }
  }
  function handleCheckout(v: string) {
    set('checkout', v);
    if (form.checkin) {
      const diff = Math.round((new Date(v).getTime() - new Date(form.checkin).getTime()) / 86400000);
      if (diff > 0) set('noches', diff);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!booking || !confirm(`¿Cancelar la reserva ${booking.confirmacion}?`)) return;
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
              <input type="date" value={form.checkout} onChange={e => handleCheckout(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>Noches</span>
              <input type="number" min={1} value={form.noches} onChange={e => set('noches', parseInt(e.target.value))} />
            </label>
            <label className={styles.field}>
              <span>Huéspedes</span>
              <input type="number" min={1} max={8} value={form.huespedes} onChange={e => set('huespedes', parseInt(e.target.value))} />
            </label>
            <label className={styles.field}>
              <span>Total (MXN) *</span>
              <input type="number" min={0} value={form.total} onChange={e => set('total', parseInt(e.target.value))} required />
            </label>
          </div>

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
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? <Loader2 size={16} className={styles.spin} /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
