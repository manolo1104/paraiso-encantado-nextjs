'use client';

import { useState } from 'react';
import { Plus, Send, MessageSquare, RefreshCw, Loader2, X, Download, Pencil, Trash2 } from 'lucide-react';
import type { AdminQuote } from '@/lib/admin/sheets-admin';
import styles from './cotizaciones.module.css';

const SUITES = [
  'Suite Flor de Liz 1','Suite Flor de Liz 2','Suite LindaVista','Jungla','Suite Lajas',
  'Lirios 1','Lirios 2','Orquídeas 2','Orquídeas Doble','Orquídeas 3','Bromelias',
  'Helechos 1','Helechos 2',
];

// Precio por suite según personas (igual que data/suites.ts)
const PRECIO_TIERS: Record<string, Record<number, number>> = {
  'Jungla':            { 2: 1900, 3: 2400, 4: 2400 },
  'Suite LindaVista':  { 2: 1900, 3: 2400, 4: 2400 },
  'Suite Flor de Liz 1': { 2: 1900, 3: 2400, 4: 2400 },
  'Suite Flor de Liz 2': { 2: 1900, 3: 2400, 4: 2400 },
  'Suite Lajas':       { 2: 1900, 3: 2400, 4: 2400 },
  'Helechos 1':        { 2: 1900, 3: 2400, 4: 2400, 5: 2700, 6: 3000 },
  'Helechos 2':        { 2: 1900, 3: 2400, 4: 2400, 5: 2700, 6: 3000 },
  'Lirios 1':          { 2: 1500, 3: 1900, 4: 1900 },
  'Lirios 2':          { 2: 1500, 3: 1900, 4: 1900 },
  'Orquídeas 2':       { 2: 1500 },
  'Orquídeas Doble':   { 2: 1500, 3: 1900, 4: 1900 },
  'Orquídeas 3':       { 2: 1500 },
  'Bromelias':         { 2: 1500, 3: 1900, 4: 1900 },
};

function getPrecioNoche(suite: string, personas: number): number {
  const tiers = PRECIO_TIERS[suite] || { 2: 1900 };
  const keys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
  let precio = tiers[keys[0]];
  for (const k of keys) {
    if (personas >= k) precio = tiers[k];
  }
  return precio;
}

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: '#888', ENVIADA: '#2e6b8a', ACEPTADA: '#2d7a34', EXPIRADA: '#c9484a',
};
const WA = '524891007679';

function calcNights(ci: string, co: string) {
  if (!ci || !co) return 0;
  return Math.max(0, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));
}

function fmtDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// ── PDF en nueva ventana ────────────────────────────────────────────────────
function printQuotePDF(q: AdminQuote) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>Cotización ${q.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Georgia,serif;color:#1a1a1a;background:#fff;padding:40px;max-width:720px;margin:0 auto}
  .header{text-align:center;border-bottom:2px solid #1e3012;padding-bottom:24px;margin-bottom:32px}
  .logo{font-size:28px;color:#1e3012;font-style:italic;font-weight:300}
  .tagline{font-size:12px;color:#6b8e4e;letter-spacing:2px;text-transform:uppercase;margin-top:4px}
  .badge{display:inline-block;background:#1e3012;color:#fff;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:2px;margin-top:12px}
  h1{font-size:22px;font-weight:400;color:#1e3012;margin-bottom:6px}
  .meta{color:#888;font-size:12px;margin-bottom:32px}
  .client-box{background:#f0ebe3;padding:20px;border-radius:4px;margin-bottom:24px}
  .client-box h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#6b8e4e;margin-bottom:10px}
  .client-box p{font-size:15px;margin:3px 0;color:#1a1a1a}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  th{background:#1e3012;color:#fff;padding:10px 14px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:400}
  td{padding:12px 14px;border-bottom:1px solid #e4ddd3;font-size:14px}
  .total-row td{font-size:17px;font-weight:bold;color:#1e3012;border-top:2px solid #1e3012;border-bottom:none}
  .notes{background:#f9f7f4;padding:16px;border-radius:4px;font-size:13px;color:#555;margin-bottom:24px}
  .footer{text-align:center;border-top:1px solid #e4ddd3;padding-top:20px;color:#888;font-size:12px}
  .cta{text-align:center;margin:24px 0}
  .cta a{display:inline-block;background:#1e3012;color:#fff;padding:12px 28px;text-decoration:none;border-radius:3px;font-size:14px}
  .validity{text-align:center;color:#c9484a;font-size:12px;margin-bottom:16px}
  @media print{body{padding:20px}@page{margin:1cm}}
</style>
</head><body>
<div class="header">
  <div class="logo">Paraíso Encantado</div>
  <div class="tagline">Xilitla · Huasteca Potosina · México</div>
  <div class="badge">Cotización</div>
</div>

<h1>Cotización ${q.id}</h1>
<p class="meta">Fecha: ${fmtDate(q.fecha?.split(',')[0] || q.fecha)} · Válida por 48 horas</p>

<div class="client-box">
  <h2>Datos del cliente</h2>
  <p><strong>${q.cliente}</strong></p>
  ${q.email ? `<p>${q.email}</p>` : ''}
  ${q.telefono ? `<p>${q.telefono}</p>` : ''}
</div>

<table>
  <tr><th>Concepto</th><th>Detalle</th></tr>
  <tr><td>Suite</td><td><strong>${q.suite}</strong></td></tr>
  <tr><td>Check-in</td><td>${fmtDate(q.checkin)}</td></tr>
  <tr><td>Check-out</td><td>${fmtDate(q.checkout)}</td></tr>
  <tr><td>Noches</td><td>${q.noches} noche${q.noches !== 1 ? 's' : ''}</td></tr>
  <tr class="total-row"><td>Total</td><td>$${q.precioTotal.toLocaleString('es-MX')} MXN</td></tr>
</table>

${q.notas ? `<div class="notes"><strong>Notas:</strong> ${q.notas}</div>` : ''}

<p class="validity">⏱ Esta cotización vence en 48 horas</p>
<div class="cta">
  <a href="https://www.paraisoencantado.com/reservar?checkin=${q.checkin}&checkout=${q.checkout}">Confirmar mi reserva en línea</a>
</div>

<div class="footer">
  <p>Hotel Paraíso Encantado · Xilitla, San Luis Potosí</p>
  <p>+52 489-100-7679 · reservas@paraisoencantado.com</p>
  <p style="margin-top:8px">paraisoencantado.com</p>
</div>

<script>window.onload=function(){window.print()}<\/script>
</body></html>`);
  win.document.close();
}

// ── PDF confirmación de reserva ─────────────────────────────────────────────
export function printBookingPDF(b: {
  confirmacion: string; cliente: string; email: string; telefono: string;
  habitaciones: string; checkin: string; checkout: string; noches: number;
  huespedes: number; total: number; notas: string; fecha: string;
}) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>Confirmación ${b.confirmacion}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Georgia,serif;color:#1a1a1a;background:#fff;padding:40px;max-width:720px;margin:0 auto}
  .header{text-align:center;border-bottom:2px solid #1e3012;padding-bottom:24px;margin-bottom:32px}
  .logo{font-size:28px;color:#1e3012;font-style:italic;font-weight:300}
  .tagline{font-size:12px;color:#6b8e4e;letter-spacing:2px;text-transform:uppercase;margin-top:4px}
  .badge{display:inline-block;background:#2d7a34;color:#fff;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:2px;margin-top:12px}
  .conf-num{text-align:center;font-size:24px;color:#1e3012;font-weight:bold;letter-spacing:2px;margin:16px 0 4px}
  .conf-date{text-align:center;color:#888;font-size:13px;margin-bottom:32px}
  .client-box{background:#f0ebe3;padding:20px;border-radius:4px;margin-bottom:24px}
  .client-box h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#6b8e4e;margin-bottom:10px}
  .client-box p{font-size:15px;margin:3px 0}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  th{background:#1e3012;color:#fff;padding:10px 14px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:400}
  td{padding:12px 14px;border-bottom:1px solid #e4ddd3;font-size:14px}
  .total-row td{font-size:17px;font-weight:bold;color:#1e3012;border-top:2px solid #1e3012;border-bottom:none}
  .guarantee{background:#f0f7f0;border:1px solid #6b8e4e;padding:16px;border-radius:4px;margin-bottom:24px}
  .guarantee p{font-size:13px;color:#2d7a34;margin:3px 0}
  .footer{text-align:center;border-top:1px solid #e4ddd3;padding-top:20px;color:#888;font-size:12px}
  @media print{body{padding:20px}@page{margin:1cm}}
</style>
</head><body>
<div class="header">
  <div class="logo">Paraíso Encantado</div>
  <div class="tagline">Xilitla · Huasteca Potosina · México</div>
  <div class="badge">✓ Reserva Confirmada</div>
</div>

<div class="conf-num">${b.confirmacion}</div>
<p class="conf-date">Reserva realizada: ${b.fecha}</p>

<div class="client-box">
  <h2>Huésped</h2>
  <p><strong>${b.cliente}</strong></p>
  ${b.email ? `<p>${b.email}</p>` : ''}
  ${b.telefono && b.telefono !== 'N/A' ? `<p>${b.telefono}</p>` : ''}
</div>

<table>
  <tr><th>Concepto</th><th>Detalle</th></tr>
  <tr><td>Suite</td><td><strong>${b.habitaciones}</strong></td></tr>
  <tr><td>Check-in</td><td>${fmtDate(b.checkin)} <em style="color:#888;font-size:12px">(15:00 hrs)</em></td></tr>
  <tr><td>Check-out</td><td>${fmtDate(b.checkout)} <em style="color:#888;font-size:12px">(12:00 hrs)</em></td></tr>
  <tr><td>Noches</td><td>${b.noches}</td></tr>
  <tr><td>Huéspedes</td><td>${b.huespedes} persona${b.huespedes !== 1 ? 's' : ''}</td></tr>
  ${b.notas ? `<tr><td>Notas</td><td>${b.notas}</td></tr>` : ''}
  <tr class="total-row"><td>Total</td><td>$${b.total.toLocaleString('es-MX')} MXN</td></tr>
</table>

<div class="guarantee">
  <p>✓ Reserva directa sin comisiones</p>
  <p>✓ Cancelación gratuita hasta 48 hrs antes del check-in</p>
  <p>✓ Confirmación instantánea</p>
</div>

<div class="footer">
  <p>Hotel Paraíso Encantado · Xilitla, San Luis Potosí</p>
  <p>+52 489-100-7679 · reservas@paraisoencantado.com</p>
  <p style="margin-top:8px">paraisoencantado.com</p>
</div>

<script>window.onload=function(){window.print()}<\/script>
</body></html>`);
  win.document.close();
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
  const precioNoche = getPrecioNoche(form.suite, form.huespedes);
  const precioTotal = precioNoche * Math.max(noches, 1);

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear');
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
            <label className={styles.field}>
              <span>Personas</span>
              <select value={form.huespedes} onChange={e => set('huespedes', parseInt(e.target.value))}>
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} persona{n !== 1 ? 's' : ''}</option>)}
              </select>
            </label>
            <div className={styles.field}>
              <span>Precio estimado</span>
              <div className={styles.pricePreview}>
                ${precioNoche.toLocaleString('es-MX')}/noche × {Math.max(noches, 1)} = <strong>${precioTotal.toLocaleString('es-MX')} MXN</strong>
              </div>
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

function EditQuoteModal({ quote, onClose, onSaved }: {
  quote: AdminQuote;
  onClose: () => void;
  onSaved: (q: AdminQuote, changes: Partial<AdminQuote>) => void;
}) {
  const [form, setForm] = useState({
    cliente: quote.cliente, telefono: quote.telefono, email: quote.email,
    suite: quote.suite, checkin: quote.checkin, checkout: quote.checkout,
    huespedes: 2, notas: quote.notas,
  });
  const [loading, setLoading] = useState(false);
  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })); }
  const noches = calcNights(form.checkin, form.checkout);
  const precioNoche = getPrecioNoche(form.suite, form.huespedes);
  const precioTotal = precioNoche * Math.max(noches, 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSaved(quote, { ...form, noches, precioTotal });
    setLoading(false);
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Editar Cotización <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>{quote.id}</span></h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.grid2}>
            <label className={styles.field}><span>Cliente</span><input value={form.cliente} onChange={e => set('cliente', e.target.value)} /></label>
            <label className={styles.field}><span>Teléfono</span><input value={form.telefono} onChange={e => set('telefono', e.target.value)} /></label>
            <label className={styles.field}><span>Email</span><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></label>
            <label className={styles.field}>
              <span>Suite</span>
              <select value={form.suite} onChange={e => set('suite', e.target.value)}>
                {SUITES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className={styles.field}><span>Check-in</span><input type="date" value={form.checkin} onChange={e => set('checkin', e.target.value)} /></label>
            <label className={styles.field}><span>Check-out</span><input type="date" value={form.checkout} onChange={e => set('checkout', e.target.value)} /></label>
            <label className={styles.field}>
              <span>Personas</span>
              <select value={form.huespedes} onChange={e => set('huespedes', parseInt(e.target.value))}>
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} persona{n !== 1 ? 's' : ''}</option>)}
              </select>
            </label>
            <div className={styles.field}>
              <span>Total calculado</span>
              <div className={styles.pricePreview}><strong>${precioTotal.toLocaleString('es-MX')} MXN</strong></div>
            </div>
          </div>
          <label className={styles.field}><span>Notas</span><textarea rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} /></label>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? <Loader2 size={14} className={styles.spin} /> : null} Guardar cambios
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
  const [editQuote, setEditQuote] = useState<AdminQuote | null>(null);
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
      if (res.ok) { alert(`✅ Email enviado a ${q.email}`); refresh(); }
      else alert('Error al enviar email');
    } finally { setSendingId(null); }
  }

  async function deleteQuote(q: AdminQuote) {
    if (!confirm(`¿Eliminar cotización ${q.id}?`)) return;
    await fetch(`/api/admin/cotizaciones/${q.id}`, { method: 'DELETE' });
    refresh();
  }

  async function saveEdit(q: AdminQuote, changes: Partial<AdminQuote>) {
    await fetch(`/api/admin/cotizaciones/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    setEditQuote(null);
    refresh();
  }

  function openWhatsApp(q: AdminQuote) {
    const text = encodeURIComponent(
      `Hola ${q.cliente}, te comparto tu cotización de Paraíso Encantado:\n\n` +
      `🏡 Suite: ${q.suite}\n` +
      `📅 Check-in: ${fmtDate(q.checkin)}\n📅 Check-out: ${fmtDate(q.checkout)}\n` +
      `🌙 ${q.noches} noche${q.noches !== 1 ? 's' : ''}\n` +
      `💰 Total: $${q.precioTotal.toLocaleString('es-MX')} MXN\n\n` +
      `Para confirmar: https://www.paraisoencantado.com/reservar?checkin=${q.checkin}&checkout=${q.checkout}\n\n` +
      `Válida por 48 horas ✅`
    );
    window.open(`https://wa.me/${(q.telefono || WA).replace(/\D/g,'')}?text=${text}`, '_blank');
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
              <th>Check-out</th><th>Total</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr><td colSpan={8} className={styles.empty}>Sin cotizaciones — crea la primera</td></tr>
            ) : quotes.map(q => (
              <tr key={q.id} className={styles.row}>
                <td className={styles.mono}>{q.id}</td>
                <td>
                  <div className={styles.clienteName}>{q.cliente}</div>
                  {q.email && <div className={styles.clienteEmail}>{q.email}</div>}
                </td>
                <td>{q.suite}</td>
                <td>{fmtDate(q.checkin)}</td>
                <td>{fmtDate(q.checkout)}</td>
                <td className={styles.total}>${q.precioTotal.toLocaleString('es-MX')}</td>
                <td><span className={styles.badge} style={{ color: ESTADO_COLOR[q.estado] }}>{q.estado}</span></td>
                <td>
                  <div className={styles.sendActions}>
                    <button className={styles.sendBtn} onClick={() => sendEmail(q)} disabled={sendingId === q.id} title="Enviar por email">
                      {sendingId === q.id ? <Loader2 size={14} className={styles.spin} /> : <Send size={14} />}
                    </button>
                    <button className={styles.waBtn} onClick={() => openWhatsApp(q)} title="WhatsApp">
                      <MessageSquare size={14} />
                    </button>
                    <button className={styles.pdfBtn} onClick={() => printQuotePDF(q)} title="Descargar PDF">
                      <Download size={14} />
                    </button>
                    <button className={styles.editBtn} onClick={() => setEditQuote(q)} title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => deleteQuote(q)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <QuoteModal onClose={() => setShowModal(false)} onSaved={() => { refresh(); setShowModal(false); }} />}
      {editQuote && <EditQuoteModal quote={editQuote} onClose={() => setEditQuote(null)} onSaved={saveEdit} />}
    </div>
  );
}
