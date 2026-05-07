'use client';

import { useState, useMemo } from 'react';
import { Plus, Send, MessageSquare, RefreshCw, Loader2, X, Download, Pencil, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
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

const PDF_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Jost','Helvetica Neue',Arial,sans-serif;color:#2a2218;background:#f0ebe3;line-height:1.6}
  .page{max-width:680px;margin:0 auto;background:#faf8f5}
  .hero{background:#2f281f;padding:36px 40px 32px;text-align:left}
  .hero-eye{font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:rgba(255,255,255,0.65);margin:0 0 10px;font-family:'Jost',sans-serif}
  .hero-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:40px;font-style:italic;font-weight:300;color:#fff;line-height:1.1;margin:0 0 8px}
  .hero-sub{font-family:'Jost',sans-serif;font-size:13px;font-weight:300;color:rgba(255,255,255,0.72);margin:0}
  .body{padding:40px}
  .ref-box{border:1px solid #c9b99a;background:#fdf9f4;padding:22px 28px;margin:0 0 32px}
  .ref-label{font-family:'Jost',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;margin:0 0 6px}
  .ref-num{font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:500;color:#2a2218;margin:0}
  .greeting{font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;color:#2a2218;margin:0 0 24px}
  .greeting em{font-style:italic;color:#7a6a52}
  .divider{height:1px;background:#c9b99a;width:48px;margin:0 0 28px}
  .grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e4ddd3;margin:0 0 28px}
  .cell{padding:18px 20px;border-right:1px solid #e4ddd3;border-bottom:1px solid #e4ddd3}
  .cell:nth-child(2n){border-right:none}
  .cell:nth-last-child(-n+2){border-bottom:none}
  .cell-label{font-family:'Jost',sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;margin:0 0 8px}
  .cell-value{font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;margin:0}
  .cell-sub{font-family:'Jost',sans-serif;font-size:11px;color:#9a8a74;margin:4px 0 0}
  .total-bar{background:#2a2218;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;margin:0 0 28px}
  .total-label{font-family:'Jost',sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9b99a}
  .total-value{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#faf8f5}
  .total-currency{font-size:14px;color:#c9b99a;margin-left:4px}
  .notes-box{border-left:2px solid #c9b99a;padding:0 0 0 20px;margin:0 0 28px}
  .notes-text{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-style:italic;font-weight:300;color:#5a4e3c;line-height:1.7}
  .validity{font-family:'Jost',sans-serif;font-size:12px;color:#9a8a74;margin:0 0 20px;text-align:center}
  .cta{text-align:center;margin:0 0 40px}
  .cta-btn{display:inline-block;background:#2a2218;color:#faf8f5;text-decoration:none;padding:14px 36px;font-family:'Jost',sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase}
  .contact{background:#faf8f5;padding:24px 40px;border-top:1px solid #e4ddd3}
  .contact p{font-family:'Jost',sans-serif;font-size:13px;color:#2a2218;margin:0 0 6px}
  .footer-bar{background:#f0ebe3;padding:32px 40px;text-align:center}
  .footer-name{font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;letter-spacing:3px;text-transform:uppercase;color:#8a7d6b;margin:0 0 8px}
  .footer-addr{font-family:'Jost',sans-serif;font-size:11px;color:#a09080;line-height:1.6;margin:0}
  @media print{body{background:#fff}@page{margin:0.5cm}
    .page{max-width:100%;box-shadow:none}}
`;

// ── PDF Cotización ──────────────────────────────────────────────────────────
function printQuotePDF(q: AdminQuote) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cotización ${q.id} · Paraíso Encantado</title>
<style>${PDF_STYLES}</style>
</head><body>
<div class="page">
  <div class="hero">
    <p class="hero-eye">Cotización Personalizada</p>
    <h1 class="hero-title">Tu escapada perfecta.</h1>
    <p class="hero-sub">Paraíso Encantado · Xilitla, San Luis Potosí</p>
  </div>
  <div class="body">
    <div class="ref-box">
      <p class="ref-label">Referencia de cotización</p>
      <p class="ref-num">${q.id}</p>
    </div>
    <p class="greeting">Estimado/a, <em>${q.cliente}</em></p>
    <div class="divider"></div>
    <div class="grid">
      <div class="cell"><p class="cell-label">Suite</p><p class="cell-value">${q.suite}</p></div>
      <div class="cell"><p class="cell-label">Duración</p><p class="cell-value">${q.noches} noche${q.noches !== 1 ? 's' : ''}</p></div>
      <div class="cell"><p class="cell-label">Check-in</p><p class="cell-value">${fmtDate(q.checkin)}</p><p class="cell-sub">A partir de las 3:00 PM</p></div>
      <div class="cell"><p class="cell-label">Check-out</p><p class="cell-value">${fmtDate(q.checkout)}</p><p class="cell-sub">Antes de las 12:00 PM</p></div>
    </div>
    <div class="total-bar">
      <span class="total-label">Total cotización</span>
      <span class="total-value">$${q.precioTotal.toLocaleString('es-MX')}<span class="total-currency">MXN</span></span>
    </div>
    ${q.notas ? `<div class="notes-box"><p class="notes-text">${q.notas}</p></div>` : ''}
    <p class="validity">Esta cotización es válida por 48 horas a partir de su emisión.</p>
    <div class="cta">
      <a class="cta-btn" href="https://www.paraisoencantado.com/reservar?checkin=${q.checkin}&checkout=${q.checkout}">Confirmar Reserva</a>
    </div>
  </div>
  <div class="contact">
    <p>📞 <a href="tel:+524891007679" style="color:#2a2218">+52 489-100-7679</a></p>
    <p>📧 <a href="mailto:reservas@paraisoencantado.com" style="color:#2a2218">reservas@paraisoencantado.com</a></p>
    <p>💬 <a href="https://wa.me/524891007679" style="color:#2a2218">WhatsApp directo</a></p>
  </div>
  <div class="footer-bar">
    <p class="footer-name">Paraíso Encantado</p>
    <p class="footer-addr">Hotel Paraíso Encantado · Xilitla, San Luis Potosí 79910 · México<br>A pasos del Jardín Surrealista de Edward James · paraisoencantado.com</p>
  </div>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`);
  win.document.close();
}

// ── PDF Confirmación de reserva ─────────────────────────────────────────────
export function printBookingPDF(b: {
  confirmacion: string; cliente: string; email: string; telefono: string;
  habitaciones: string; checkin: string; checkout: string; noches: number;
  huespedes: number; total: number; notas: string; fecha: string;
}) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Confirmación ${b.confirmacion} · Paraíso Encantado</title>
<style>${PDF_STYLES}
  .confirm-badge{display:inline-block;background:#2d7a34;color:#fff;font-family:'Jost',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;margin-top:14px}
  .guarantee-box{background:#f0f7f0;border:1px solid #6b8e4e;padding:18px 22px;margin:0 0 28px}
  .guarantee-box p{font-family:'Jost',sans-serif;font-size:13px;color:#2d7a34;margin:0 0 4px}
  .guarantee-box p:last-child{margin:0}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;background:#f4f0e8;margin:0 0 28px}
  .info-cell{padding:18px 20px;border-right:1px solid #e4ddd3;border-bottom:1px solid #e4ddd3}
  .info-cell:nth-child(2n){border-right:none}
  .info-cell:nth-last-child(-n+2){border-bottom:none}
  .info-label{font-family:'Jost',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9a8a74;margin:0 0 6px}
  .info-value{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#2a2218;margin:0}
</style>
</head><body>
<div class="page">
  <div class="hero">
    <p class="hero-eye">Confirmación de Reserva</p>
    <h1 class="hero-title">Tu paraíso te espera.</h1>
    <p class="hero-sub">Paraíso Encantado · Xilitla, San Luis Potosí</p>
    <span class="confirm-badge">✓ Reserva Confirmada</span>
  </div>
  <div class="body">
    <div class="ref-box">
      <p class="ref-label">Número de Confirmación</p>
      <p class="ref-num">${b.confirmacion}</p>
    </div>
    <p class="greeting">Bienvenido/a, <em>${b.cliente}</em></p>
    <div class="divider"></div>

    <div class="grid">
      <div class="cell"><p class="cell-label">Suite</p><p class="cell-value">${b.habitaciones}</p></div>
      <div class="cell"><p class="cell-label">Huéspedes</p><p class="cell-value">${b.huespedes} persona${b.huespedes !== 1 ? 's' : ''}</p></div>
      <div class="cell"><p class="cell-label">Check-in</p><p class="cell-value">${fmtDate(b.checkin)}</p><p class="cell-sub">A partir de las 3:00 PM</p></div>
      <div class="cell"><p class="cell-label">Check-out</p><p class="cell-value">${fmtDate(b.checkout)}</p><p class="cell-sub">Antes de las 12:00 PM</p></div>
      <div class="cell"><p class="cell-label">Noches</p><p class="cell-value">${b.noches}</p></div>
      ${b.notas ? `<div class="cell"><p class="cell-label">Notas</p><p class="cell-value" style="font-size:14px">${b.notas}</p></div>` : '<div class="cell"></div>'}
    </div>

    <div class="total-bar">
      <span class="total-label">Total Estadía</span>
      <span class="total-value">$${b.total.toLocaleString('es-MX')}<span class="total-currency">MXN</span></span>
    </div>

    <div class="guarantee-box">
      <p>✓ Reserva directa sin comisiones de intermediarios</p>
      <p>✓ Cancelación gratuita hasta 48 hrs antes del check-in</p>
      <p>✓ Estacionamiento privado gratuito · WiFi de alta velocidad</p>
    </div>

    <div class="info-grid">
      <div class="info-cell"><p class="info-label">Cómo llegar</p><p class="info-value" style="font-size:13px">Xilitla, San Luis Potosí 79910<br>A 7 min del centro</p></div>
      <div class="info-cell"><p class="info-label">Cerca de ti</p><p class="info-value" style="font-size:13px">A pasos del Jardín<br>de Edward James</p></div>
      <div class="info-cell"><p class="info-label">Al llegar presenta</p><p class="info-value" style="font-size:14px;font-family:'Cormorant Garamond',serif;font-weight:500">${b.confirmacion}</p></div>
      <div class="info-cell"><p class="info-label">Contacto directo</p><p class="info-value" style="font-size:13px">+52 489-100-7679</p></div>
    </div>
  </div>

  <div class="contact">
    <p>📞 <a href="tel:+524891007679" style="color:#2a2218">+52 489-100-7679</a></p>
    <p>📧 <a href="mailto:reservas@paraisoencantado.com" style="color:#2a2218">reservas@paraisoencantado.com</a></p>
    <p>💬 <a href="https://wa.me/524891007679" style="color:#2a2218">WhatsApp directo</a></p>
  </div>
  <div class="footer-bar">
    <p class="footer-name">Paraíso Encantado</p>
    <p class="footer-addr">Hotel Paraíso Encantado · Xilitla, San Luis Potosí 79910 · México<br>A pasos del Jardín Surrealista de Edward James · paraisoencantado.com</p>
  </div>
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
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [suiteFilter, setSuiteFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return quotes.filter(x => {
      if (q && !x.cliente.toLowerCase().includes(q) &&
          !x.email.toLowerCase().includes(q) &&
          !x.id.toLowerCase().includes(q)) return false;
      if (estadoFilter && x.estado !== estadoFilter) return false;
      if (suiteFilter && !x.suite.includes(suiteFilter)) return false;
      if (fechaDesde && x.checkin < fechaDesde) return false;
      if (fechaHasta && x.checkin > fechaHasta) return false;
      return true;
    });
  }, [quotes, search, estadoFilter, suiteFilter, fechaDesde, fechaHasta]);

  const hasActiveFilters = estadoFilter || suiteFilter || fechaDesde || fechaHasta;
  function clearFilters() { setEstadoFilter(''); setSuiteFilter(''); setFechaDesde(''); setFechaHasta(''); }

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
          <p className={styles.pageSub}>
            {filtered.length} cotizaciones · {filtered.filter(q => q.estado === 'ENVIADA').length} enviadas
            {hasActiveFilters && <span className={styles.filterBadge}>Filtros activos</span>}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={refresh} title="Actualizar"><RefreshCw size={16} /></button>
          <button className={`${styles.iconBtn} ${showFilters ? styles.iconBtnActive : ''}`}
            onClick={() => setShowFilters(s => !s)}>
            Filtros {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Nueva cotización
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Buscar por cliente, email o ID…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filtersGrid}>
            <label className={styles.filterField}>
              <span>Estado</span>
              <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="BORRADOR">Borrador</option>
                <option value="ENVIADA">Enviada</option>
                <option value="ACEPTADA">Aceptada</option>
                <option value="EXPIRADA">Expirada</option>
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Suite</span>
              <select value={suiteFilter} onChange={e => setSuiteFilter(e.target.value)}>
                <option value="">Todas</option>
                {SUITES.map(s => <option key={s}>{s}</option>)}
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
          {hasActiveFilters && <button className={styles.clearBtn} onClick={clearFilters}>Limpiar filtros</button>}
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th><th>Cliente</th><th>Suite</th><th>Check-in</th>
              <th>Check-out</th><th>Total</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className={styles.empty}>Sin cotizaciones que mostrar</td></tr>
            ) : filtered.map(q => (
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
