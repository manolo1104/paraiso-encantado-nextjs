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
  const anticipo = b.anticipo || 0;
  const restante = b.restante ?? (b.total - anticipo);
  const cancelDateStr = calcCancelDate(b.checkin);
  const fechaLimiteStr = fmtDateFull(b.fechaLimitePago || b.checkin);
  const notasClienteText = parseNotasCliente(b.notas || '');
  const suites = b.habitaciones.split(', ').filter(Boolean).map(s => s.trim());
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const suiteImgSrc = suites[0] && SUITE_IMAGES[suites[0]] ? `${baseUrl}${SUITE_IMAGES[suites[0]]}` : '';

  // Lucide SVG icons (inline, no emoji)
  const ICO_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const ICO_PHONE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12.05 19.79 19.79 0 0 1 1.93 3.4 2 2 0 0 1 3.9 1.2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
  const ICO_MSG  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  const ICO_MAIL = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,12 2,6"></polyline></svg>`;
  const ICO_CAR  = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"></path><circle cx="7.5" cy="17.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>`;
  const ICO_WIFI = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`;
  const ICO_LEAF = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 19.5 2.77 21.17 2 22 2 22S4.94 21 7 19c1.5-1.5 2.5-3 3-5 .6-2.4.5-4.5 0-6.5"></path><path d="M8.5 7C10 5.5 12 5 14 5c2 0 4 .5 5 2.5 1 2 .5 4.5-.5 6C17 16 15.5 17 13 17s-4-1-5-3"></path></svg>`;
  const ICO_LOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
  const ICO_WALK = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="1"></circle><path d="M6.5 10.5L9 7l2 1 3 .5-1 5h3"></path><path d="M9 15l-1 5h3l1-3 2 2v-5"></path></svg>`;
  const ICO_MAP  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  const ICO_IG   = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
  const ICO_FB   = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`;
  const ICO_YT   = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmación ${b.confirmacion} · Paraíso Encantado</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#e8e4dc;font-family:'Jost',sans-serif;font-weight:300;color:#1e1e18;min-height:100vh;padding:48px 16px}
.wrap{max-width:640px;margin:0 auto;background:#faf7f2;box-shadow:0 32px 80px rgba(0,0,0,0.18)}
.hero{position:relative;height:420px;overflow:hidden;background:#0e1f10}
.hero-img{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 60%,rgba(45,90,40,.6) 0%,transparent 55%),radial-gradient(ellipse at 80% 30%,rgba(20,50,18,.8) 0%,transparent 50%),linear-gradient(160deg,#1a3d1c 0%,#0d2610 40%,#071808 100%)}
.hero-img::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 120px 200px at 5% 20%,rgba(40,80,35,.7) 0%,transparent 70%),radial-gradient(ellipse 200px 100px at 90% 10%,rgba(25,60,20,.5) 0%,transparent 70%),radial-gradient(ellipse 150px 250px at 95% 70%,rgba(35,75,30,.7) 0%,transparent 70%)}
.hero-img::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,transparent 0%,transparent 40%,rgba(7,24,8,.4) 65%,rgba(7,24,8,.92) 100%)}
.leaf1,.leaf2,.leaf3,.leaf4{position:absolute;border-radius:50% 5% 50% 5%;opacity:.12}
.leaf1{width:180px;height:80px;background:#5a9e52;top:30px;left:-30px;transform:rotate(-25deg)}
.leaf2{width:140px;height:60px;background:#4a8e42;top:80px;right:-20px;transform:rotate(35deg);border-radius:5% 50% 5% 50%}
.leaf3{width:220px;height:90px;background:#6aae62;bottom:120px;left:40px;transform:rotate(15deg);opacity:.08}
.leaf4{width:100px;height:44px;background:#5a9e52;bottom:160px;right:60px;transform:rotate(-40deg);opacity:.1}
.hero-content{position:absolute;bottom:0;left:0;right:0;padding:0 48px 44px;z-index:2}
.hero-eyebrow{font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#c9a96e;margin-bottom:10px;display:flex;align-items:center;gap:12px}
.hero-eyebrow::before{content:'';width:32px;height:1px;background:#c9a96e}
.hero-title{font-family:'Cormorant Garamond',serif;font-size:52px;font-weight:300;line-height:1;color:#f5f0e8;margin-bottom:4px}
.hero-title em{font-style:italic;color:#c9a96e;display:block}
.hero-loc{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#7a9e7c;margin-bottom:28px}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(201,169,110,.2);border:1px solid rgba(201,169,110,.5);color:#c9a96e;padding:9px 22px;font-size:9px;letter-spacing:4px;text-transform:uppercase;backdrop-filter:blur(4px)}
.cn-strip{background:#111d12;padding:0 48px;display:flex;align-items:stretch;min-height:72px}
.cn-left{flex:1;display:flex;flex-direction:column;justify-content:center;padding:18px 0;border-right:1px solid rgba(255,255,255,.06)}
.cn-lbl{font-size:8px;letter-spacing:4px;text-transform:uppercase;color:#4a6a4c;margin-bottom:5px}
.cn-val{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:400;color:#c9a96e;letter-spacing:3px}
.cn-right{padding:18px 0 18px 32px;display:flex;flex-direction:column;justify-content:center}
.cn-present-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#4a6a4c;margin-bottom:4px}
.cn-present-val{font-size:11px;color:#8ab08c;line-height:1.5}
.suite-strip{display:grid;grid-template-columns:1.6fr 1fr;height:260px;gap:2px;background:#111d12}
.suite-main{position:relative;overflow:hidden;background:#1a3520}
.suite-main img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.suite-main-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 40% 50%,rgba(60,110,55,.4) 0%,transparent 60%),linear-gradient(135deg,#1e4020 0%,#0f2810 50%,#0a1e0c 100%)}
.pool-circle{position:absolute;width:160px;height:80px;background:radial-gradient(ellipse,rgba(80,160,160,.35) 0%,rgba(40,110,110,.15) 60%,transparent 100%);border-radius:50%;bottom:60px;left:50%;transform:translateX(-50%);border:1px solid rgba(100,200,200,.15)}
.suite-main-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,20,10,.85) 0%,transparent 50%)}
.suite-main-label{position:absolute;bottom:0;left:0;right:0;padding:20px 24px;z-index:2}
.suite-main-name{font-family:'Cormorant Garamond',serif;font-size:22px;font-style:italic;color:#f5f0e8;margin-bottom:2px}
.suite-main-feat{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#7aaa7c}
.suite-side{display:grid;grid-template-rows:1fr 1fr;gap:2px}
.suite-thumb{position:relative;overflow:hidden}
.thumb-a{background:linear-gradient(145deg,#16302a 0%,#0d2020 100%)}
.thumb-a::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 100px 80px at 80% 20%,rgba(80,160,140,.2) 0%,transparent 60%)}
.thumb-b{background:linear-gradient(145deg,#2a2010 0%,#1a1508 100%)}
.thumb-b::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 120px 60px at 50% 50%,rgba(201,169,110,.12) 0%,transparent 60%)}
.suite-thumb-overlay{position:absolute;inset:0;background:rgba(0,0,0,.25)}
.suite-thumb-label{position:absolute;bottom:0;left:0;right:0;padding:12px 14px;background:linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 100%)}
.thumb-name{font-size:11px;font-weight:400;color:#e8e4d8}
.thumb-sub{font-size:9px;color:#7a9e7c;letter-spacing:1px}
.body{padding:48px 48px 0}
.greeting-block{margin-bottom:40px}
.greeting-name{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:300;color:#1e1e18;line-height:1.1;margin-bottom:8px}
.greeting-name em{font-style:italic;color:#3d6e40}
.greeting-copy{font-size:14px;color:#6a6a58;line-height:1.8;max-width:420px}
.gold-rule{width:48px;height:1px;background:#c9a96e;margin:20px 0}
.dates-block{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;background:#111d12;margin-bottom:32px;padding:28px 32px}
.date-col{text-align:center}
.date-lbl{font-size:8px;letter-spacing:4px;text-transform:uppercase;color:#4a6a4c;margin-bottom:8px}
.date-num{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:300;color:#f5f0e8;line-height:1}
.date-month{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7aaa7c;margin-top:4px}
.date-time{font-size:10px;color:#4a6a4c;margin-top:6px}
.date-arrow{padding:0 24px;text-align:center}
.nights-badge{font-family:'Cormorant Garamond',serif;font-size:28px;color:#c9a96e;display:block;line-height:1}
.nights-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#4a6a4c;display:block;margin-top:4px}
.section-hd{display:flex;align-items:center;gap:16px;margin-bottom:20px}
.section-hd-line{flex:1;height:1px;background:#e0dbd0}
.section-hd-title{font-size:8px;letter-spacing:4px;text-transform:uppercase;color:#9a9a82;white-space:nowrap}
.suites-list{margin-bottom:32px}
.suite-row{display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid #eae5d8}
.suite-row:last-child{border-bottom:none}
.suite-dot{width:8px;height:8px;border-radius:50%;background:#3d6e40;flex-shrink:0}
.suite-name{font-family:'Cormorant Garamond',serif;font-size:18px;color:#1e1e18;flex:1}
.suite-cap{font-size:10px;color:#9a9a82;letter-spacing:1px}
.payment{border:1px solid #e0dbd0;margin-bottom:32px;overflow:hidden}
.payment-hd{background:#f2ede4;padding:14px 24px;font-size:8px;letter-spacing:4px;text-transform:uppercase;color:#9a9a82}
.payment-body{padding:20px 24px}
.prow{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#6a6a58;margin-bottom:12px}
.prow:last-child{margin-bottom:0}
.prow.divider{border-top:1px solid #e0dbd0;padding-top:16px;margin-top:4px}
.prow.divider .plabel{font-size:14px;color:#1e1e18;font-weight:400}
.prow.divider .pamount{font-family:'Cormorant Garamond',serif;font-size:26px;color:#1e1e18}
.paid-tag{display:inline-flex;align-items:center;gap:4px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#3d6e40;background:#eef5ee;padding:2px 8px;border-radius:20px}
.deduct{color:#3d6e40}
.balance-note{background:#fff8ee;border-left:3px solid #c9a96e;padding:10px 16px;margin-top:16px;font-size:12px;color:#7a6a40;line-height:1.6}
.cancel-banner{display:flex;align-items:center;gap:20px;padding:22px 24px;border:1px solid #c8dfc9;background:#f4faf4;margin-bottom:32px}
.cancel-icon{width:40px;height:40px;border-radius:50%;background:#3d6e40;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.cancel-title{font-size:13px;font-weight:400;color:#1e1e18;margin-bottom:3px}
.cancel-date-str{font-size:12px;color:#5a7a5c;line-height:1.5}
.cancel-date-str strong{color:#1e1e18}
.arrive-section{margin-bottom:8px}
.arrive-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.arrive-card{border:1px solid #e0dbd0;padding:20px}
.arrive-card-num{font-family:'Cormorant Garamond',serif;font-size:32px;color:#c9a96e;line-height:1;margin-bottom:8px}
.arrive-card-title{font-size:12px;font-weight:400;color:#1e1e18;margin-bottom:4px}
.arrive-card-copy{font-size:12px;color:#7a7a62;line-height:1.6}
.map-block{position:relative;height:120px;background:linear-gradient(135deg,#d8e8d0 0%,#c8dcc0 50%,#d0e4c8 100%);overflow:hidden;margin-bottom:32px}
.map-block::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80px 40px at 30% 50%,rgba(255,255,255,.4) 0%,transparent 60%)}
.map-road-h{position:absolute;top:50%;left:0;right:0;height:8px;background:rgba(255,255,255,.5);transform:translateY(-50%)}
.map-road-v{position:absolute;left:35%;top:0;bottom:0;width:6px;background:rgba(255,255,255,.4)}
.map-pin-hotel{position:absolute;left:35%;top:50%;transform:translate(-50%,-50%)}
.map-pin-dot{width:16px;height:16px;background:#1c2b1e;border-radius:50%;border:3px solid #c9a96e;position:relative}
.map-pin-dot::after{content:'';position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #c9a96e}
.map-pin-label-hotel{position:absolute;left:22px;top:50%;transform:translateY(-50%);background:#1c2b1e;color:#c9a96e;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:3px 8px;white-space:nowrap}
.map-pin-pozas{position:absolute;left:60%;top:55%;transform:translate(-50%,-50%)}
.map-pin-dot-green{width:12px;height:12px;background:#3d6e40;border-radius:50%;border:2px solid #fff}
.map-pin-label-pozas{position:absolute;right:16px;top:50%;transform:translateY(-50%);background:#3d6e40;color:#fff;font-size:8px;letter-spacing:1px;padding:2px 6px;white-space:nowrap}
.map-distance{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#3d6e40;background:rgba(255,255,255,.8);padding:3px 10px;white-space:nowrap;display:flex;align-items:center;gap:5px}
.upsell{margin:0 -48px;background:#111d12;padding:44px 48px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:32px}
.upsell-eyebrow{font-size:8px;letter-spacing:4px;text-transform:uppercase;color:#4a6a4c;margin-bottom:10px}
.upsell-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:10px;line-height:1.2}
.upsell-copy{font-size:12px;color:#6a8a6c;line-height:1.8}
.upsell-copy span{display:block;padding-left:12px;position:relative}
.upsell-copy span::before{content:'—';position:absolute;left:0;color:#c9a96e}
.upsell-btn{display:block;border:1px solid #c9a96e;color:#c9a96e;padding:14px 24px;font-family:'Jost',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;white-space:nowrap;text-align:center}
.contact-section{padding:40px 48px 0}
.contact-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#e0dbd0;border:1px solid #e0dbd0;margin-bottom:40px}
.contact-cell{background:#faf7f2;padding:24px 16px;text-align:center}
.contact-icon-wrap{width:36px;height:36px;border:1px solid #e0dbd0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:#3d6e40}
.contact-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#9a9a82;margin-bottom:5px}
.contact-val{font-size:12px;color:#1e1e18;line-height:1.5}
.amenities{display:flex;justify-content:space-around;padding:24px 0;border-top:1px solid #eae5d8;border-bottom:1px solid #eae5d8;margin-bottom:40px}
.amenity{text-align:center}
.amenity-icon{margin-bottom:6px;color:#3d6e40;display:flex;justify-content:center}
.amenity-lbl{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#9a9a82}
.amenity-val{font-size:11px;color:#3d6e40}
.social-block{background:#f2ede4;margin:0 -48px;padding:28px 48px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.social-label-group{}
.social-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#9a9a82;margin-bottom:4px}
.social-handle{font-family:'Cormorant Garamond',serif;font-size:22px;font-style:italic;color:#1e1e18}
.social-sub{font-size:11px;color:#7a7a62;margin-top:3px}
.social-links{display:flex;gap:10px}
.social-link{display:flex;align-items:center;gap:7px;border:1px solid #d4cec7;padding:9px 14px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1e1e18;text-decoration:none;background:#faf7f2}
.social-link:hover{border-color:#3d6e40;color:#3d6e40}
.footer{background:#1c2b1e;padding:44px 48px;text-align:center}
.footer-logo{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;color:#f5f0e8;margin-bottom:4px}
.footer-logo em{font-style:italic;color:#c9a96e}
.footer-tagline{font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#4a6a4c;margin-bottom:24px}
.footer-divider{width:1px;height:40px;background:linear-gradient(to bottom,transparent,#4a6a4c,transparent);margin:0 auto 24px}
.footer-address{font-size:11px;color:#4a6a4c;line-height:2}
.footer-address a{color:#7aaa7c;text-decoration:none}
@media print{body{background:#fff;padding:0}@page{margin:0.5cm}.wrap{box-shadow:none;max-width:100%}.upsell{margin:0}.social-block{margin:0}}
@media(max-width:500px){.hero-content{padding:0 24px 32px}.hero-title{font-size:36px}.cn-strip{padding:0 24px}.suite-strip{grid-template-columns:1fr;height:auto}.body{padding:32px 24px 0}.arrive-grid{grid-template-columns:1fr}.upsell{margin:0 -24px;padding:32px 24px;grid-template-columns:1fr}.social-block{margin:0 -24px;padding:24px;flex-direction:column}.contact-section{padding:32px 24px 0}.footer{padding:32px 24px}.dates-block{padding:20px 16px}.date-num{font-size:32px}}
</style>
</head>
<body>
<div class="wrap">

  <div class="hero">
    <div class="hero-img">
      <div class="leaf1"></div><div class="leaf2"></div><div class="leaf3"></div><div class="leaf4"></div>
    </div>
    <div class="hero-content">
      <p class="hero-eyebrow">Reserva confirmada</p>
      <h1 class="hero-title">Paraíso<em>Encantado</em></h1>
      <p class="hero-loc">Xilitla · Huasteca Potosina · México</p>
      <div class="hero-badge">Tu escapada te espera</div>
    </div>
  </div>

  <div class="cn-strip">
    <div class="cn-left">
      <p class="cn-lbl">Número de confirmación</p>
      <p class="cn-val">${b.confirmacion}</p>
    </div>
    <div class="cn-right">
      <p class="cn-present-lbl">Al llegar presenta</p>
      <p class="cn-present-val">Este número en recepción<br>o muéstralo en tu celular</p>
    </div>
  </div>

  <div class="suite-strip">
    <div class="suite-main">
      ${suiteImgSrc
        ? `<img src="${suiteImgSrc}" alt="${suites[0]}" onerror="this.style.display='none'">`
        : `<div class="suite-main-bg"></div><div class="pool-circle"></div>`}
      <div class="suite-main-overlay"></div>
      <div class="suite-main-label">
        <p class="suite-main-name">${suites[0]}</p>
        <p class="suite-main-feat">${b.huespedes} huéspedes · ${b.noches} noche${b.noches !== 1 ? 's' : ''}</p>
      </div>
    </div>
    <div class="suite-side">
      <div class="suite-thumb thumb-a">
        <div class="suite-thumb-overlay"></div>
        <div class="suite-thumb-label">
          <p class="thumb-name">${suites.length > 1 ? suites[1] : 'Vista panorámica'}</p>
          <p class="thumb-sub">${suites.length > 1 ? 'Habitación 2' : 'Desde la terraza'}</p>
        </div>
      </div>
      <div class="suite-thumb thumb-b">
        <div class="suite-thumb-overlay"></div>
        <div class="suite-thumb-label">
          <p class="thumb-name">${suites.length > 2 ? suites[2] : 'Jardín & Piscina'}</p>
          <p class="thumb-sub">${suites.length > 2 ? 'Habitación 3' : 'Área común'}</p>
        </div>
      </div>
    </div>
  </div>

  <div class="body">

    <div class="greeting-block">
      <div class="gold-rule"></div>
      <h2 class="greeting-name">Bienvenido/a, <em>${b.cliente}.</em></h2>
      <p class="greeting-copy">Todo está listo para tu estadía. Aquí encontrarás los detalles de tu reserva, cómo llegar, y todo lo que necesitas para que tu escapada sea perfecta desde el primer momento.</p>
    </div>

    <div class="dates-block">
      <div class="date-col">
        <p class="date-lbl">Check-in</p>
        <p class="date-num">${getDay(b.checkin)}</p>
        <p class="date-month">${getMonthYear(b.checkin)}</p>
        <p class="date-time">A partir de las 3:00 PM</p>
      </div>
      <div class="date-arrow">
        <span class="nights-badge">${b.noches}</span>
        <span class="nights-lbl">noche${b.noches !== 1 ? 's' : ''}</span>
      </div>
      <div class="date-col">
        <p class="date-lbl">Check-out</p>
        <p class="date-num">${getDay(b.checkout)}</p>
        <p class="date-month">${getMonthYear(b.checkout)}</p>
        <p class="date-time">Antes de las 12:00 PM</p>
      </div>
    </div>

    <div class="suites-list">
      <div class="section-hd">
        <p class="section-hd-title">Suites reservadas · ${b.huespedes} persona${b.huespedes !== 1 ? 's' : ''}</p>
        <div class="section-hd-line"></div>
      </div>
      ${suites.map(s => `
      <div class="suite-row">
        <div class="suite-dot"></div>
        <p class="suite-name">${s}</p>
      </div>`).join('')}
    </div>

    <div class="payment">
      <div class="payment-hd">Resumen de pago</div>
      <div class="payment-body">
        <div class="prow">
          <span class="plabel">Total estadía (${suites.length} suite${suites.length !== 1 ? 's' : ''} · ${b.noches} noche${b.noches !== 1 ? 's' : ''})</span>
          <span class="pamount">$${b.total.toLocaleString('es-MX')} MXN</span>
        </div>
        <div class="prow">
          <span class="plabel"><span class="paid-tag">Anticipo recibido</span></span>
          <span class="pamount deduct">− $${anticipo.toLocaleString('es-MX')} MXN</span>
        </div>
        <div class="prow divider">
          <span class="plabel">Saldo al check-in</span>
          <span class="pamount">$${restante.toLocaleString('es-MX')} MXN</span>
        </div>
        ${restante > 0
          ? `<div class="balance-note">Tendrás que pagar $${restante.toLocaleString('es-MX')} MXN al llegar al hotel el ${fmtDateFull(b.checkin)}. Aceptamos efectivo y transferencia bancaria.<br>Pagar antes del <strong>${fechaLimiteStr}</strong>.</div>`
          : `<div class="balance-note" style="background:#eef5ee;border-left-color:#3d6e40;color:#2d5a30;">Pago completo. No hay saldo pendiente al check-in.</div>`}
      </div>
    </div>

    <div class="cancel-banner">
      <div class="cancel-icon">${ICO_CHECK}</div>
      <div>
        <p class="cancel-title">Cancelación gratuita disponible</p>
        <p class="cancel-date-str">Puedes cancelar sin costo hasta el <strong>${cancelDateStr}.</strong> Después aplica el cargo total de la reserva.</p>
      </div>
    </div>

    <div class="arrive-section">
      <div class="section-hd">
        <p class="section-hd-title">Cómo llegar</p>
        <div class="section-hd-line"></div>
      </div>
      <div class="arrive-grid">
        <div class="arrive-card">
          <p class="arrive-card-num">01</p>
          <p class="arrive-card-title">Llega a Xilitla</p>
          <p class="arrive-card-copy">Por la carretera 120 hacia la Huasteca. Al entrar al pueblo sigue las señales a Las Pozas.</p>
        </div>
        <div class="arrive-card">
          <p class="arrive-card-num">02</p>
          <p class="arrive-card-title">Busca el hotel</p>
          <p class="arrive-card-copy">Estamos a 400m antes de la entrada al Jardín Surrealista, sobre la misma calle.</p>
        </div>
      </div>
    </div>

    <div class="map-block">
      <div class="map-road-h"></div>
      <div class="map-road-v"></div>
      <div class="map-pin-hotel">
        <div class="map-pin-dot"></div>
        <div class="map-pin-label-hotel">Paraíso Encantado</div>
      </div>
      <div class="map-pin-pozas">
        <div class="map-pin-dot-green"></div>
        <div class="map-pin-label-pozas">Jardín de Edward James</div>
      </div>
      <a href="https://www.google.com/maps/search/Hotel+Paraíso+Encantado,+Xilitla,+San+Luis+Potosí" class="map-distance" style="text-decoration:none;">${ICO_WALK} 5 minutos caminando</a>
    </div>

    <div class="upsell">
      <div class="upsell-left">
        <p class="upsell-eyebrow">Haz tu estadía memorable</p>
        <h3 class="upsell-title">¿Celebran algo especial?</h3>
        <div class="upsell-copy">
          <span>Desayuno privado en la terraza</span>
          <span>Decoración de suite con flores</span>
          <span>Fogata nocturna en el jardín</span>
        </div>
      </div>
      <a href="https://wa.me/524891007679" class="upsell-btn">Escribir<br>por WhatsApp</a>
    </div>

    ${notasClienteText ? `
    <div style="padding:24px 0;border-top:1px solid #eae5d8;margin-top:0">
      <p style="font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#9a9a82;margin-bottom:8px">Nota especial</p>
      <p style="font-family:'Cormorant Garamond',serif;font-size:16px;font-style:italic;color:#5a4e3c;line-height:1.7">${notasClienteText}</p>
    </div>` : ''}

  </div>

  <div class="contact-section">
    <div class="section-hd">
      <p class="section-hd-title">Contacto directo</p>
      <div class="section-hd-line"></div>
    </div>
    <div class="contact-grid">
      <div class="contact-cell">
        <div class="contact-icon-wrap">${ICO_PHONE}</div>
        <p class="contact-lbl">Teléfono</p>
        <p class="contact-val"><a href="tel:+524891007679" style="color:#1e1e18;text-decoration:none;">489 100 7679</a></p>
      </div>
      <div class="contact-cell">
        <div class="contact-icon-wrap">${ICO_MSG}</div>
        <p class="contact-lbl">WhatsApp</p>
        <p class="contact-val"><a href="https://wa.me/524891007679" style="color:#1e1e18;text-decoration:none;">+52 489 100 7679</a></p>
      </div>
      <div class="contact-cell">
        <div class="contact-icon-wrap">${ICO_MAIL}</div>
        <p class="contact-lbl">Email</p>
        <p class="contact-val"><a href="mailto:reservas@paraisoencantado.com" style="color:#1e1e18;text-decoration:none;">reservas@<br>paraisoencantado.com</a></p>
      </div>
    </div>

    <div class="amenities">
      <div class="amenity">
        <div class="amenity-icon">${ICO_CAR}</div>
        <p class="amenity-lbl">Estacionamiento</p>
        <p class="amenity-val">Gratuito</p>
      </div>
      <div class="amenity">
        <div class="amenity-icon">${ICO_WIFI}</div>
        <p class="amenity-lbl">WiFi</p>
        <p class="amenity-val">Alta velocidad</p>
      </div>
      <div class="amenity">
        <div class="amenity-icon">${ICO_LEAF}</div>
        <p class="amenity-lbl">Las Pozas</p>
        <p class="amenity-val">5 min caminando</p>
      </div>
      <div class="amenity">
        <div class="amenity-icon">${ICO_LOCK}</div>
        <p class="amenity-lbl">Reserva</p>
        <p class="amenity-val">Directa</p>
      </div>
    </div>

    <div class="social-block">
      <div class="social-label-group">
        <p class="social-lbl">Comparte tu escapada</p>
        <p class="social-handle">@_paraiso_encantado</p>
        <p class="social-sub">Etiquétanos en tus fotos</p>
      </div>
      <div class="social-links">
        <a href="https://www.instagram.com/_paraiso_encantado/" class="social-link">${ICO_IG} IG</a>
        <a href="https://www.facebook.com/cabanas.encantado/" class="social-link">${ICO_FB} FB</a>
        <a href="https://www.youtube.com/@hotelparaisoencantadoxilit8111" class="social-link">${ICO_YT} YT</a>
      </div>
    </div>
  </div>

  <div class="footer">
    <p class="footer-logo">Paraíso <em>Encantado</em></p>
    <p class="footer-tagline">La casa en la Huasteca</p>
    <div class="footer-divider"></div>
    <p class="footer-address">
      Xilitla, San Luis Potosí 79910 · México<br>
      A 5 minutos caminando del Jardín Surrealista de Edward James<br>
      <a href="https://paraisoencantado.com">paraisoencantado.com</a>
    </p>
  </div>

</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`);
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
