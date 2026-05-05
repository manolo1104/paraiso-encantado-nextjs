'use client';

import { useState } from 'react';
import { Plus, Send, MessageSquare, RefreshCw, Loader2, X } from 'lucide-react';
import type { AdminQuote } from '@/lib/admin/sheets-admin';
import styles from './cotizaciones.module.css';

const SUITES = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla','Suite Lajas',
  'Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble','Orquídeas 3','Bromelias',
  'Helechos 1','Helechos 2',
];
const PRECIO_BASE: Record<string, number> = {
  'Jungla': 1900, 'Suite LindaVista': 1900, 'Suite Flor de Liz 1': 1900,
  'Suite Flor de Liz 2': 1900, 'Suite Lajas': 1900, 'Helechos 1': 1900, 'Helechos 2': 1900,
  'Lirios 1': 1500, 'Lirios 2': 1500, 'Orquídeas 2': 1500, 'Orquídeas Doble': 1500,
  'Orquídeas 3': 1500, 'Bromelias': 1500,
};

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: '#888', ENVIADA: '#2e6b8a', ACEPTADA: '#2d7a34', EXPIRADA: '#c9484a',
};

const WA = '524891007679';

function calcNights(ci: string, co: string) {
  if (!ci || !co) return 0;
  return Math.max(0, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));
}

interface Props { initialQuotes: AdminQuote[] }

function QuoteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    cliente: '', telefono: '', email: '', suite: SUITES[3],
    checkin: '', checkout: '', huespedes: 2, notas: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })); }

  const noches = calcNights(form.checkin, form.checkout);
  const precioBase = PRECIO_BASE[form.suite] || 1900;
  const precioTotal = precioBase * Math.max(noches, 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, noches, precioTotal }),
      });
      if (!res.ok) throw new Error('Error al crear');
      onSaved();
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Nueva Cotización</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.grid2}>
            <label className={styles.field}><span>Cliente *</span><input value={form.cliente} onChange={e => set('cliente', e.target.value)} required /></label>
            <label className={styles.field}><span>Teléfono</span><input value={form.telefono} onChange={e => set('telefono', e.target.value)} /></label>
            <label className={styles.field}><span>Email</span><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></label>
            <label className={styles.field}>
              <span>Suite *</span>
              <select value={form.suite} onChange={e => set('suite', e.target.value)}>
                {SUITES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className={styles.field}><span>Check-in</span><input type="date" value={form.checkin} onChange={e => set('checkin', e.target.value)} /></label>
            <label className={styles.field}><span>Check-out</span><input type="date" value={form.checkout} onChange={e => set('checkout', e.target.value)} /></label>
            <label className={styles.field}><span>Huéspedes</span><input type="number" min={1} max={8} value={form.huespedes} onChange={e => set('huespedes', parseInt(e.target.value))} /></label>
            <div className={styles.field}>
              <span>Precio estimado</span>
              <div className={styles.pricePreview}>${precioTotal.toLocaleString('es-MX')} MXN · {noches} noche{noches !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <label className={styles.field}><span>Notas</span><textarea rows={3} value={form.notas} onChange={e => set('notas', e.target.value)} /></label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? <Loader2 size={14} className={styles.spin} /> : null} Crear cotización
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CotizacionesClient({ initialQuotes }: Props) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [showModal, setShowModal] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/admin/cotizaciones');
    if (res.ok) setQuotes(await res.json());
  }

  async function sendEmail(q: AdminQuote) {
    if (!q.email) return alert('Esta cotización no tiene email');
    setSendingId(q.id);
    try {
      const res = await fetch(`/api/admin/cotizaciones/${q.id}/send-email`, { method: 'POST' });
      if (res.ok) { alert(`Email enviado a ${q.email}`); refresh(); }
      else alert('Error al enviar email');
    } finally { setSendingId(null); }
  }

  function openWhatsApp(q: AdminQuote) {
    const text = encodeURIComponent(
      `Hola ${q.cliente}, te comparto tu cotización de Paraíso Encantado:\n\n` +
      `🏡 Suite: ${q.suite}\n` +
      `📅 Check-in: ${q.checkin}\n📅 Check-out: ${q.checkout}\n` +
      `🌙 ${q.noches} noche${q.noches !== 1 ? 's' : ''}\n` +
      `💰 Total: $${q.precioTotal.toLocaleString('es-MX')} MXN\n\n` +
      `Para confirmar: https://www.paraisoencantado.com/reservar?checkin=${q.checkin}&checkout=${q.checkout}\n\n` +
      `Válida por 48 horas ✅`
    );
    window.open(`https://wa.me/${q.telefono.replace(/\D/g,'') || WA}?text=${text}`, '_blank');
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Cotizaciones</h1>
          <p className={styles.pageSub}>{quotes.length} cotizaciones · {quotes.filter(q => q.estado === 'ENVIADA').length} enviadas</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={refresh} title="Actualizar"><RefreshCw size={16} /></button>
          <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Nueva cotización
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th><th>Cliente</th><th>Suite</th><th>Check-in</th>
              <th>Check-out</th><th>Total</th><th>Estado</th><th>Enviar</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr><td colSpan={8} className={styles.empty}>Sin cotizaciones</td></tr>
            ) : quotes.map(q => (
              <tr key={q.id} className={styles.row}>
                <td className={styles.mono}>{q.id}</td>
                <td>
                  <div className={styles.clienteName}>{q.cliente}</div>
                  {q.email && <div className={styles.clienteEmail}>{q.email}</div>}
                </td>
                <td>{q.suite}</td>
                <td>{q.checkin}</td>
                <td>{q.checkout}</td>
                <td className={styles.total}>${q.precioTotal.toLocaleString('es-MX')}</td>
                <td><span className={styles.badge} style={{ color: ESTADO_COLOR[q.estado] }}>{q.estado}</span></td>
                <td>
                  <div className={styles.sendActions}>
                    <button className={styles.sendBtn} onClick={() => sendEmail(q)} disabled={sendingId === q.id} title="Enviar por email">
                      {sendingId === q.id ? <Loader2 size={14} className={styles.spin} /> : <Send size={14} />}
                    </button>
                    <button className={styles.waBtn} onClick={() => openWhatsApp(q)} title="Abrir WhatsApp">
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <QuoteModal onClose={() => setShowModal(false)} onSaved={() => { refresh(); setShowModal(false); }} />}
    </div>
  );
}
