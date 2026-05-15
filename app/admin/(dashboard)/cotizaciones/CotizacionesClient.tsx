'use client';

import { useState, useMemo } from 'react';
import { Plus, Send, MessageSquare, RefreshCw, Loader2, X, Download, Pencil, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { buildBookingHtml } from '@/lib/booking-html';
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

interface HabItem { suite: string; huespedes: number; precioOverride?: number }

function getHabPrecioQ(hab: HabItem): number {
  return hab.precioOverride ?? getPrecioNoche(hab.suite, hab.huespedes);
}

function calcNights(ci: string, co: string) {
  if (!ci || !co) return 0;
  return Math.max(0, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));
}

function fmtDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function getDay(d: string): string {
  if (!d) return '—';
  return String(parseInt(d.split('-')[2]));
}
function getMonthYear(d: string): string {
  if (!d) return '—';
  const [y, m] = d.split('-');
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${months[parseInt(m)-1]} ${y}`;
}
function fmtDateFull(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parseInt(day)} de ${months[parseInt(m)-1]} ${y}`;
}

function calcCancelDate(checkin: string): string {
  const d = new Date(checkin + 'T00:00:00');
  d.setDate(d.getDate() - 3);
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()} a las 11:59 PM`;
}

const INTERNO_SEP = '||INTERNO||';
function parseNotasCliente(notas: string): string {
  const idx = notas.indexOf(INTERNO_SEP);
  return idx === -1 ? notas.trim() : notas.slice(0, idx).trim();
}
function joinNotas(cliente: string, interno: string): string {
  return interno.trim() ? `${cliente}${INTERNO_SEP}${interno}` : cliente;
}

const SUITE_IMAGES: Record<string, string> = {
  'Suite Flor de Liz 1': '/images/FLOR DE LIS 1/PORTADA.jpg',
  'Suite Flor de Liz 2': '/images/FLOR DE LIS 2/PORTADA.jpeg',
  'Suite LindaVista': '/images/LINDAVISTA/PORTADA.jpg',
  'Jungla': '/images/JUNGLA/PORTADA.JPG',
  'Suite Lajas': '/images/LAJAS/PORTADA.jpg',
  'Lirios 1': '/images/LIRIOS 1/PORTADA.jpg',
  'Lirios 2': '/images/LIRIOS 2/PORTADA.jpg',
  'Orquídeas 2': '/images/ORQUIDEAS 2/PORTADA.jpg',
  'Orquídeas Doble': '/images/ORQUIDEAS DOBLE/PORTADA.jpg',
  'Orquídeas 3': '/images/ORQUIDEAS 3/PORTADA.jpg',
  'Bromelias': '/images/BROMELIAS 1/PORTADA.jpg',
  'Helechos 1': '/images/HELECHOS 1/PORTADA.jpg',
  'Helechos 2': '/images/HELECHOS 2/PORTADA.jpg',
};

const SUITE_IMAGES_2: Record<string, string> = {
  'Suite Flor de Liz 1': '/images/FLOR DE LIS 1/DSCF1191.jpg',
  'Suite Flor de Liz 2': '/images/FLOR DE LIS 2/Copia de FDL2.jpg',
  'Suite LindaVista': '/images/LINDAVISTA/Copia de DSC09539-HDR.jpg',
  'Jungla': '/images/JUNGLA/DSCF1065.jpg',
  'Suite Lajas': '/images/LAJAS/Copia de DSC09589-HDR.jpg',
  'Lirios 1': '/images/LIRIOS 1/Copia de DSC09524-HDR.jpg',
  'Lirios 2': '/images/LIRIOS 2/Copia de DSC09483-HDR.jpg',
  'Orquídeas 2': '/images/ORQUIDEAS 2/Copia de DSC09568-HDR.jpg',
  'Orquídeas Doble': '/images/ORQUIDEAS DOBLE/Copia de DSC09602-HDR.jpg',
  'Orquídeas 3': '/images/ORQUIDEAS 3/Copia de DSC09567-HDR.jpg',
  'Bromelias': '/images/BROMELIAS 1/Copia de DSC09385-HDR.jpg',
  'Helechos 1': '/images/HELECHOS 1/Copia de DSC09461-HDR 2.jpg',
  'Helechos 2': '/images/HELECHOS 2/Copia de DSC09461-HDR.jpg',
};

const SUITE_IMAGES_3: Record<string, string> = {
  'Suite Flor de Liz 1': '/images/FLOR DE LIS 1/DSCF1312.jpeg',
  'Suite Flor de Liz 2': '/images/FLOR DE LIS 2/DSCF1191.jpg',
  'Suite LindaVista': '/images/LINDAVISTA/Copia de DSC09569.jpg',
  'Jungla': '/images/JUNGLA/DSCF1078.jpg',
  'Suite Lajas': '/images/LAJAS/Copia de DSC09610-HDR.jpg',
  'Lirios 1': '/images/LIRIOS 1/Copia de DSCF1620.jpg',
  'Lirios 2': '/images/LIRIOS 2/Copia de DSC09489-2.jpg',
  'Orquídeas 2': '/images/ORQUIDEAS 2/DSCF1607.jpg',
  'Orquídeas Doble': '/images/ORQUIDEAS DOBLE/Copia de DSCF1607.jpg',
  'Orquídeas 3': '/images/ORQUIDEAS 3/PORTADA.jpg',
  'Bromelias': '/images/BROMELIAS 1/Copia de DSC09419-HDR.jpg',
  'Helechos 1': '/images/HELECHOS 1/Copia de DSC09516-HDR.jpg',
  'Helechos 2': '/images/HELECHOS 2/Copia de DSC09556-HDR.jpg',
};

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
  @page{size:letter;margin:0.6in}
  .welcome-text{font-family:'Jost',sans-serif;font-size:13px;color:#5a4e3c;line-height:1.7;margin:0 0 20px}
  .hotel-quote{font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-style:italic;color:#7a6a52;text-align:center;border-top:1px solid #e4ddd3;border-bottom:1px solid #e4ddd3;padding:16px 24px;margin:0 0 28px;line-height:1.6}
  .anticipo-bar{display:flex;gap:0;border:1px solid #e4ddd3;margin:0 0 20px}
  .anticipo-item{flex:1;padding:14px 20px;border-right:1px solid #e4ddd3}
  .anticipo-item:last-child{border-right:none}
  .anticipo-label{display:block;font-family:'Jost',sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;margin:0 0 6px}
  .anticipo-value{font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:500}
  .anticipo-ok{color:#2d7a34}
  .anticipo-pend{color:#8a4a20}
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

// ── PDF Confirmación de reserva v2 ──────────────────────────────────────────
export function printBookingPDF(b: {
  confirmacion: string; cliente: string; email: string; telefono: string;
  habitaciones: string; checkin: string; checkout: string; noches: number;
  huespedes: number; total: number; notas: string; fecha: string;
  anticipo?: number; restante?: number; fechaLimitePago?: string;
}) {
  const suites = b.habitaciones.split(', ').filter(Boolean).map(s => s.trim());
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const suiteImgSrc  = suites[0] && SUITE_IMAGES[suites[0]]   ? `${baseUrl}${SUITE_IMAGES[suites[0]]}`   : '';
  const suiteImgSrc2 = suites[0] && SUITE_IMAGES_2[suites[0]] ? `${baseUrl}${SUITE_IMAGES_2[suites[0]]}` : '';
  const suiteImgSrc3 = suites[0] && SUITE_IMAGES_3[suites[0]] ? `${baseUrl}${SUITE_IMAGES_3[suites[0]]}` : '';

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(buildBookingHtml({
    confirmacion: b.confirmacion,
    cliente: b.cliente,
    suites,
    checkin: b.checkin,
    checkout: b.checkout,
    noches: b.noches,
    huespedes: b.huespedes,
    total: b.total,
    anticipo: b.anticipo,
    restante: b.restante,
    cancelDateStr: calcCancelDate(b.checkin),
    fechaLimiteStr: fmtDateFull(b.fechaLimitePago || b.checkin),
    notasClienteText: parseNotasCliente(b.notas || ''),
    suiteImgSrc,
    suiteImgSrc2,
    suiteImgSrc3,
    forPrint: true,
  }));
  win.document.close();
}

interface Props { initialQuotes: AdminQuote[] }

function QuoteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ cliente: '', telefono: '', email: '', checkin: '', checkout: '' });
  const [habitaciones, setHabitaciones] = useState<HabItem[]>([{ suite: SUITES[3], huespedes: 2 }]);
  const [precioManual, setPrecioManual] = useState<number | null>(null);
  const [promoActiva, setPromoActiva] = useState(false);
  const [anticipo, setAnticipo] = useState(0);
  const [restanteOverride, setRestanteOverride] = useState<number | null>(null);
  const [notasCliente, setNotasCliente] = useState('');
  const [notasInternas, setNotasInternas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function addHab() { setHabitaciones(h => [...h, { suite: SUITES[3], huespedes: 2 }]); }
  function removeHab(i: number) { setHabitaciones(h => h.filter((_, idx) => idx !== i)); setPrecioManual(null); setPromoActiva(false); }
  function updateHab(i: number, key: 'suite' | 'huespedes', val: string | number) {
    setHabitaciones(h => h.map((item, idx) => idx === i ? { ...item, [key]: val, precioOverride: undefined } : item));
    setPrecioManual(null); setPromoActiva(false);
  }
  function updateHabPrecio(i: number, precio: number) {
    setHabitaciones(h => h.map((item, idx) => idx === i ? { ...item, precioOverride: precio } : item));
    setPrecioManual(null); setPromoActiva(false);
  }

  const noches = calcNights(form.checkin, form.checkout);
  const precioAuto = habitaciones.reduce((sum, h) => sum + getHabPrecioQ(h) * Math.max(noches, 1), 0);
  const precio2Noches = habitaciones.reduce((sum, h) => sum + getHabPrecioQ(h) * 2, 0);
  const precioTotal = precioManual ?? precioAuto;
  const restante = restanteOverride ?? (precioTotal - anticipo);

  function aplicarPromo3x2() { setPrecioManual(precio2Noches); setPromoActiva(true); }
  function resetPrecio() { setPrecioManual(null); setPromoActiva(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const suite = habitaciones.map(h => h.suite).join(', ');
      const huespedes = habitaciones.reduce((sum, h) => sum + h.huespedes, 0);
      const res = await fetch('/api/admin/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, suite, huespedes, noches, precioTotal, notas: joinNotas(notasCliente, notasInternas) }),
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
            <label className={styles.field}><span>Check-in</span><input type="date" value={form.checkin} onChange={e => set('checkin', e.target.value)} /></label>
            <label className={styles.field}><span>Check-out</span><input type="date" value={form.checkout} onChange={e => set('checkout', e.target.value)} /></label>
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
                <select className={styles.roomRowSelect} value={hab.suite} onChange={e => updateHab(i, 'suite', e.target.value)}>
                  {SUITES.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className={styles.roomRowSelect} value={hab.huespedes} onChange={e => updateHab(i, 'huespedes', parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}p</option>)}
                </select>
                <input
                  type="number" min={0}
                  className={styles.roomPriceInput}
                  value={getHabPrecioQ(hab)}
                  onChange={e => updateHabPrecio(i, parseInt(e.target.value) || 0)}
                  title="Precio por noche"
                />
                {habitaciones.length > 1 && (
                  <button type="button" className={styles.removeRoomBtn} onClick={() => removeHab(i)}><X size={13} /></button>
                )}
              </div>
            ))}
          </div>

          {/* Precio */}
          <div className={styles.priceBreakdown}>
            {habitaciones.map((hab, i) => {
              const pn = getHabPrecioQ(hab);
              return (
                <div key={i} className={styles.priceBreakdownRow}>
                  <span>{hab.suite} ({hab.huespedes}p)</span>
                  <span>${pn.toLocaleString('es-MX')}/noche × {Math.max(noches,1)} = ${(pn * Math.max(noches,1)).toLocaleString('es-MX')}</span>
                </div>
              );
            })}

            {/* Botón promo 3x2 */}
            <div className={styles.promoRow}>
              <button
                type="button"
                className={`${styles.promoBtn} ${promoActiva ? styles.promoBtnActive : ''}`}
                onClick={promoActiva ? resetPrecio : aplicarPromo3x2}
                disabled={noches !== 3}
                title={noches !== 3 ? 'Solo aplica para estadías de exactamente 3 noches' : ''}
              >
                🎁 {promoActiva ? '✓ Promo 3×2 activa' : 'Aplicar 3×2 (3ª noche gratis)'}
              </button>
              {promoActiva && (
                <span className={styles.promoSaving}>
                  Ahorro: ${(precioAuto - precio2Noches).toLocaleString('es-MX')} MXN
                </span>
              )}
            </div>

            <div className={styles.priceTotalRow}>
              <span className={styles.priceTotalLabel}>Precio final (MXN)</span>
              <div className={styles.priceEditRow}>
                <input
                  type="number" min={0}
                  className={styles.priceInput}
                  value={precioTotal}
                  onChange={e => { setPrecioManual(parseInt(e.target.value) || 0); setPromoActiva(false); }}
                />
                {(precioManual !== null) && (
                  <button type="button" className={styles.resetPriceBtn} onClick={resetPrecio}>↩ Calcular</button>
                )}
              </div>
            </div>
          </div>

          {/* Anticipo / Restante */}
          <div className={styles.anticipoSection}>
            <span className={styles.anticipoLabel}>Anticipo y saldo</span>
            <div className={styles.anticipoGrid}>
              <div className={styles.anticipoFieldWrap}>
                <span>Anticipo solicitado (MXN)</span>
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
              <button type="button" className={styles.resetPriceBtn}
                onClick={() => setRestanteOverride(null)} style={{ alignSelf: 'flex-start' }}>
                ↩ Recalcular
              </button>
            )}
          </div>

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
    checkin: quote.checkin, checkout: quote.checkout,
  });
  const [habitaciones, setHabitaciones] = useState<HabItem[]>(() =>
    quote.suite.split(', ').filter(Boolean).map(s => ({ suite: s.trim(), huespedes: 2 }))
  );
  const [precioManual, setPrecioManual] = useState<number | null>(quote.precioTotal || null);
  const [promoActiva, setPromoActiva] = useState(false);
  const [anticipo, setAnticipo] = useState(0);
  const [restanteOverride, setRestanteOverride] = useState<number | null>(null);
  const [notasCliente, setNotasCliente] = useState(() => parseNotasCliente(quote.notas || ''));
  const [notasInternas, setNotasInternas] = useState(() => {
    const idx = (quote.notas || '').indexOf(INTERNO_SEP);
    return idx === -1 ? '' : quote.notas.slice(idx + INTERNO_SEP.length).trim();
  });
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function addHab() { setHabitaciones(h => [...h, { suite: SUITES[3], huespedes: 2 }]); }
  function removeHab(i: number) { setHabitaciones(h => h.filter((_, idx) => idx !== i)); setPromoActiva(false); }
  function updateHab(i: number, key: 'suite' | 'huespedes', val: string | number) {
    setHabitaciones(h => h.map((item, idx) => idx === i ? { ...item, [key]: val, precioOverride: undefined } : item));
    setPromoActiva(false);
  }
  function updateHabPrecio(i: number, precio: number) {
    setHabitaciones(h => h.map((item, idx) => idx === i ? { ...item, precioOverride: precio } : item));
    setPrecioManual(null); setPromoActiva(false);
  }

  const noches = calcNights(form.checkin, form.checkout);
  const precioAuto = habitaciones.reduce((sum, h) => sum + getHabPrecioQ(h) * Math.max(noches, 1), 0);
  const precio2Noches = habitaciones.reduce((sum, h) => sum + getHabPrecioQ(h) * 2, 0);
  const precioTotal = precioManual ?? precioAuto;
  const restante = restanteOverride ?? (precioTotal - anticipo);

  function aplicarPromo3x2() { setPrecioManual(precio2Noches); setPromoActiva(true); }
  function resetPrecio() { setPrecioManual(null); setPromoActiva(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const suite = habitaciones.map(h => h.suite).join(', ');
    await onSaved(quote, { ...form, suite, noches, precioTotal, notas: joinNotas(notasCliente, notasInternas) });
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
            <label className={styles.field}><span>Check-in</span><input type="date" value={form.checkin} onChange={e => set('checkin', e.target.value)} /></label>
            <label className={styles.field}><span>Check-out</span><input type="date" value={form.checkout} onChange={e => set('checkout', e.target.value)} /></label>
          </div>

          {/* Habitaciones */}
          <div className={styles.roomsSection}>
            <div className={styles.roomsSectionHeader}>
              <span className={styles.roomsSectionLabel}>Habitaciones</span>
              <button type="button" className={styles.addRoomBtn} onClick={addHab}>
                <Plus size={13} /> Agregar
              </button>
            </div>
            {habitaciones.map((hab, i) => (
              <div key={i} className={styles.roomRow}>
                <select className={styles.roomRowSelect} value={hab.suite} onChange={e => updateHab(i, 'suite', e.target.value)}>
                  {SUITES.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className={styles.roomRowSelect} value={hab.huespedes} onChange={e => updateHab(i, 'huespedes', parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}p</option>)}
                </select>
                <input
                  type="number" min={0}
                  className={styles.roomPriceInput}
                  value={getHabPrecioQ(hab)}
                  onChange={e => updateHabPrecio(i, parseInt(e.target.value) || 0)}
                  title="Precio por noche"
                />
                {habitaciones.length > 1 && (
                  <button type="button" className={styles.removeRoomBtn} onClick={() => removeHab(i)}><X size={13} /></button>
                )}
              </div>
            ))}
          </div>

          {/* Precio */}
          <div className={styles.priceBreakdown}>
            {habitaciones.map((hab, i) => {
              const pn = getHabPrecioQ(hab);
              return (
                <div key={i} className={styles.priceBreakdownRow}>
                  <span>{hab.suite} ({hab.huespedes}p)</span>
                  <span>${pn.toLocaleString('es-MX')}/noche × {Math.max(noches,1)} = ${(pn * Math.max(noches,1)).toLocaleString('es-MX')}</span>
                </div>
              );
            })}

            <div className={styles.promoRow}>
              <button
                type="button"
                className={`${styles.promoBtn} ${promoActiva ? styles.promoBtnActive : ''}`}
                onClick={promoActiva ? resetPrecio : aplicarPromo3x2}
                disabled={noches !== 3}
                title={noches !== 3 ? 'Solo aplica para estadías de exactamente 3 noches' : ''}
              >
                🎁 {promoActiva ? '✓ Promo 3×2 activa' : 'Aplicar 3×2 (3ª noche gratis)'}
              </button>
              {promoActiva && (
                <span className={styles.promoSaving}>
                  Ahorro: ${(precioAuto - precio2Noches).toLocaleString('es-MX')} MXN
                </span>
              )}
            </div>

            <div className={styles.priceTotalRow}>
              <span className={styles.priceTotalLabel}>Precio final (MXN)</span>
              <div className={styles.priceEditRow}>
                <input
                  type="number" min={0}
                  className={styles.priceInput}
                  value={precioTotal}
                  onChange={e => { setPrecioManual(parseInt(e.target.value) || 0); setPromoActiva(false); }}
                />
                {precioManual !== null && (
                  <button type="button" className={styles.resetPriceBtn} onClick={resetPrecio}>↩ Calcular</button>
                )}
              </div>
            </div>
          </div>

          {/* Anticipo / Restante */}
          <div className={styles.anticipoSection}>
            <span className={styles.anticipoLabel}>Anticipo y saldo</span>
            <div className={styles.anticipoGrid}>
              <div className={styles.anticipoFieldWrap}>
                <span>Anticipo solicitado (MXN)</span>
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
              <button type="button" className={styles.resetPriceBtn}
                onClick={() => setRestanteOverride(null)} style={{ alignSelf: 'flex-start' }}>
                ↩ Recalcular
              </button>
            )}
          </div>

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
            {(() => {
              const borradorConEmail = quotes.filter(q => q.estado === 'BORRADOR' && q.email);
              const totalBorrador = borradorConEmail.reduce((s, q) => s + q.precioTotal, 0);
              return borradorConEmail.length > 0 ? (
                <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#fde8e8', color: '#8a1a1a', padding: '2px 7px', borderRadius: 3, fontWeight: 600 }}>
                  ${totalBorrador.toLocaleString('es-MX')} MXN sin enviar
                </span>
              ) : null;
            })()}
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
                <td>
                  <span className={styles.badge} style={{ color: ESTADO_COLOR[q.estado] }}>{q.estado}</span>
                  {q.estado === 'BORRADOR' && q.email && (
                    <span title="Sin enviar — tiene email" style={{ marginLeft: 5, fontSize: '0.65rem', background: '#fde8e8', color: '#8a1a1a', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>Sin enviar</span>
                  )}
                </td>
                <td>
                  <div className={styles.sendActions}>
                    <button className={styles.sendBtn} onClick={() => sendEmail(q)} disabled={sendingId === q.id} title="Enviar por email">
                      {sendingId === q.id ? <Loader2 size={14} className={styles.spin} /> : <Send size={14} />}
                    </button>
                    <button className={styles.waBtn} onClick={() => openWhatsApp(q)} title={q.estado === 'ENVIADA' ? 'Seguimiento WhatsApp' : 'WhatsApp'}>
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
