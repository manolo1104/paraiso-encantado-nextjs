'use client';

import { useState, useMemo } from 'react';
import { Plus, Send, MessageSquare, RefreshCw, Loader2, X, Download, Pencil, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { buildBookingHtml } from '@/lib/booking-html';
import type { TourItem } from '@/lib/booking-html';
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

// ── Tours / Experiencias ──────────────────────────────────────────────────────
export const TOURS_CATALOG: { nombre: string; precio: number }[] = [
  { nombre: 'Expedición Tamul (Sótano + Cascada + Cenote)', precio: 1450 },
  { nombre: 'Ruta Surrealista (Las Pozas + Huichihuayán)', precio: 1300 },
  { nombre: 'Cascadas del Meco (El Meco + El Salto)', precio: 1600 },
  { nombre: 'Paraíso Escalonado (Minas Viejas + Micos)', precio: 1500 },
  { nombre: 'Ruta Acuática (Puente de Dios + Siete Cascadas)', precio: 1500 },
  { nombre: 'Sótano de las Golondrinas', precio: 800 },
  { nombre: 'Tour personalizado', precio: 0 },
];

const TOURS_SEP = '||TOURS||';
function parseTours(notas: string): TourItem[] {
  const idx = notas.indexOf(TOURS_SEP);
  if (idx === -1) return [];
  try { return JSON.parse(notas.slice(idx + TOURS_SEP.length)); } catch { return []; }
}
function getHabsTotalQ(habs: HabItem[], noches: number): number {
  return habs.reduce((s, h) => s + getHabPrecioQ(h) * Math.max(noches, 1), 0);
}
function getToursTotalQ(tours: TourItem[]): number {
  return tours.reduce((s, t) => s + t.precio * t.personas, 0);
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
function joinNotas(cliente: string, interno: string, tours: TourItem[] = []): string {
  let base = interno.trim() ? `${cliente}${INTERNO_SEP}${interno}` : cliente;
  if (tours.length > 0) base += `${TOURS_SEP}${JSON.stringify(tours)}`;
  return base;
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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const firstSuite = q.suite.split(', ')[0].trim();
  const suiteImg = SUITE_IMAGES[firstSuite] ? `${baseUrl}${SUITE_IMAGES[firstSuite]}` : '';
  const notasCliente = parseNotasCliente(q.notas || '');
  const tourItems = parseTours(q.notas || '');
  const toursTotal = getToursTotalQ(tourItems);
  const confirmUrl = `https://www.paraisoencantado.com/reservar?checkin=${q.checkin}&checkout=${q.checkout}`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cotización ${q.id} · Paraíso Encantado</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#f5f2ec; font-family:'Jost',sans-serif; font-weight:300; color:#2a2a25; padding:40px 16px; }
.wrap { max-width:600px; margin:0 auto; background:#fffdf8; border:1px solid #ddd8cc; }
.header { background:#1c2b1e; padding:40px 40px 36px; text-align:center; position:relative; overflow:hidden; }
.header::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
.h-eye { font-size:10px; letter-spacing:4px; text-transform:uppercase; color:#c9a96e; margin-bottom:14px; position:relative; }
.h-logo { font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:300; color:#f5f0e8; margin-bottom:5px; position:relative; }
.h-logo em { font-style:italic; color:#c9a96e; }
.h-sub { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#8a9e8c; margin-bottom:28px; position:relative; }
.h-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(201,169,110,0.15); border:1px solid rgba(201,169,110,0.4); color:#c9a96e; padding:8px 20px; font-size:11px; letter-spacing:3px; text-transform:uppercase; position:relative; }
.suite-photo { height:130px; overflow:hidden; border-bottom:2px solid #c9a96e; background:linear-gradient(160deg,#2d4a2f 0%,#1c3320 50%,#152a1a 100%); }
.suite-photo img { width:100%; height:130px; object-fit:cover; display:block; }
.cn-block { background:#1c2b1e; padding:18px 40px; display:flex; align-items:center; justify-content:space-between; }
.cn-lbl { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#6a8a6e; margin-bottom:4px; }
.cn-num { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:400; color:#c9a96e; letter-spacing:2px; }
.cn-pres { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#6a8a6e; text-align:right; line-height:1.8; }
.cn-pres span { display:block; color:#f5f0e8; font-size:11px; }
.body { padding:36px 40px; }
.greeting { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:300; color:#1c2b1e; margin-bottom:6px; }
.greeting em { font-style:italic; }
.g-sub { font-size:13px; color:#7a7a6a; line-height:1.7; margin-bottom:32px; }
.details-grid { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:#ddd8cc; border:1px solid #ddd8cc; margin-bottom:28px; }
.d-cell { background:#fffdf8; padding:18px 22px; }
.d-lbl { font-size:9px; letter-spacing:3px; text-transform:uppercase; color:#9a9a8a; margin-bottom:5px; }
.d-val { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:400; color:#1c2b1e; line-height:1.3; }
.d-sub { font-size:11px; color:#9a9a8a; margin-top:3px; }
.sec-title { font-size:9px; letter-spacing:3px; text-transform:uppercase; color:#9a9a8a; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #eae6dd; }
.suites-sec { margin-bottom:28px; }
.s-row { display:flex; justify-content:space-between; align-items:center; padding:11px 0; border-bottom:1px solid #eae6dd; }
.s-row:last-child { border-bottom:none; }
.s-name { font-family:'Cormorant Garamond',serif; font-size:16px; font-weight:400; color:#1c2b1e; }
.total-block { background:#f5f2ec; border-left:3px solid #c9a96e; padding:18px 22px; margin-bottom:28px; display:flex; justify-content:space-between; align-items:center; }
.total-lbl { font-size:12px; color:#5a5a4a; }
.total-amt { font-family:'Cormorant Garamond',serif; font-size:26px; color:#1c2b1e; }
.validity { background:#fff8ee; border:1px solid #e0d4b4; padding:14px 20px; margin-bottom:28px; font-size:12px; color:#7a6a40; line-height:1.6; text-align:center; }
.validity strong { color:#1c2b1e; }
.note-box { background:#f5f2ec; border-left:3px solid #c9a96e; padding:14px 18px; margin-bottom:28px; font-family:'Cormorant Garamond',serif; font-size:16px; font-style:italic; color:#5a4e3c; line-height:1.7; }
.cta-wrap { text-align:center; margin-bottom:32px; }
.cta-btn { display:inline-block; background:#1c2b1e; color:#c9a96e; text-decoration:none; padding:14px 36px; font-family:'Jost',sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; }
.contact-row { display:flex; gap:10px; margin-bottom:28px; }
.c-card { flex:1; border:1px solid #eae6dd; padding:14px; text-align:center; }
.c-icon { font-size:16px; margin-bottom:5px; }
.c-type { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#9a9a8a; margin-bottom:3px; }
.c-val { font-size:11px; color:#1c2b1e; font-weight:400; }
.footer { background:#f0ece3; padding:24px 40px; text-align:center; border-top:1px solid #ddd8cc; }
.f-logo { font-family:'Cormorant Garamond',serif; font-size:15px; font-style:italic; color:#7a7a6a; margin-bottom:8px; }
.f-addr { font-size:11px; color:#9a9a8a; line-height:1.8; }
.f-div { width:36px; height:1px; background:#c9a96e; margin:14px auto; }
@page { size:letter; margin:0.45in; }
@media print { body { background:#fff; padding:0; } .wrap { border:none; max-width:100%; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <p class="h-eye">Cotización personalizada</p>
    <h1 class="h-logo">Paraíso <em>Encantado</em></h1>
    <p class="h-sub">Xilitla · Huasteca Potosina</p>
    <div class="h-badge">Válida por 48 horas</div>
  </div>

  ${suiteImg
    ? `<div class="suite-photo"><img src="${suiteImg}" alt="${firstSuite}" onerror="this.parentElement.style.background='linear-gradient(160deg,#2d4a2f 0%,#152a1a 100%)'"></div>`
    : `<div class="suite-photo" style="display:flex;align-items:center;justify-content:center;color:#c9a96e;font-family:'Cormorant Garamond',serif;font-size:24px;font-style:italic">${firstSuite}</div>`
  }

  <div class="cn-block">
    <div>
      <p class="cn-lbl">Referencia de cotización</p>
      <p class="cn-num">${q.id}</p>
    </div>
    <p class="cn-pres">Válida hasta<span>48 horas</span></p>
  </div>

  <div class="body">
    <h2 class="greeting">Estimado/a, <em>${q.cliente}.</em></h2>
    <p class="g-sub">Hemos preparado esta cotización especialmente para ti. Confirma antes de que expire para asegurar tus fechas.</p>

    <div class="details-grid">
      <div class="d-cell">
        <p class="d-lbl">Check-in</p>
        <p class="d-val">${fmtDate(q.checkin)}</p>
        <p class="d-sub">A partir de las 3:00 PM</p>
      </div>
      <div class="d-cell">
        <p class="d-lbl">Check-out</p>
        <p class="d-val">${fmtDate(q.checkout)}</p>
        <p class="d-sub">Antes de las 12:00 PM</p>
      </div>
      <div class="d-cell">
        <p class="d-lbl">Noches</p>
        <p class="d-val">${q.noches}</p>
      </div>
      <div class="d-cell">
        <p class="d-lbl">Estado</p>
        <p class="d-val" style="font-size:14px;font-family:'Jost',sans-serif">${q.estado}</p>
      </div>
    </div>

    <div class="suites-sec">
      <p class="sec-title">Suite${q.suite.includes(',') ? 's incluidas' : ' incluida'}</p>
      ${q.suite.split(', ').map(s => `
      <div class="s-row">
        <p class="s-name">${s.trim()}</p>
        <span style="font-size:11px;color:#5a7a5c">incluida</span>
      </div>`).join('')}
    </div>

    ${tourItems.length > 0 ? `
    <div class="suites-sec">
      <p class="sec-title">Tours incluidos</p>
      ${tourItems.map(t => `
      <div class="s-row">
        <p class="s-name" style="font-size:14px">${t.nombre}</p>
        <div style="text-align:right">
          <span style="font-size:11px;color:#5a4e3c;display:block">${t.personas} persona${t.personas!==1?'s':''}</span>
          <span style="font-size:12px;color:#1c2b1e;font-family:'Cormorant Garamond',serif">$${(t.precio*t.personas).toLocaleString('es-MX')} MXN</span>
        </div>
      </div>`).join('')}
    </div>` : ''}

    <div class="total-block">
      ${toursTotal > 0 ? `
      <div>
        <p class="d-lbl" style="margin-bottom:2px">Hospedaje</p>
        <p style="font-family:'Cormorant Garamond',serif;font-size:18px;color:#1c2b1e;margin-bottom:6px">$${(q.precioTotal-toursTotal).toLocaleString('es-MX')} MXN</p>
        <p class="d-lbl" style="margin-bottom:2px">Tours</p>
        <p style="font-family:'Cormorant Garamond',serif;font-size:18px;color:#1c2b1e">$${toursTotal.toLocaleString('es-MX')} MXN</p>
      </div>
      <div>
        <p class="d-lbl">Total cotización</p>
        <p class="total-amt">$${q.precioTotal.toLocaleString('es-MX')}</p>
      </div>` : `
      <div>
        <p class="d-lbl">Total cotización</p>
        <p class="total-amt">$${q.precioTotal.toLocaleString('es-MX')}</p>
      </div>`}
      <span style="font-size:13px;color:#9a9a8a">MXN</span>
    </div>

    ${notasCliente ? `<div class="note-box">${notasCliente}</div>` : ''}

    <div class="validity">
      Esta cotización es válida por <strong>48 horas</strong> a partir de su emisión.<br>
      Confirma tu reserva antes de que expire para asegurar disponibilidad y precio.
    </div>

    <div class="cta-wrap">
      <a href="${confirmUrl}" class="cta-btn">Confirmar Reserva →</a>
      <p style="font-size:10px;color:#9a9a8a;margin-top:10px;letter-spacing:1px">${confirmUrl}</p>
    </div>

    <div class="contact-row">
      <div class="c-card"><p class="c-icon">📞</p><p class="c-type">Teléfono</p><p class="c-val"><a href="tel:+524891007679" style="color:#1c2b1e;text-decoration:none">489 100 7679</a></p></div>
      <div class="c-card"><p class="c-icon">💬</p><p class="c-type">WhatsApp</p><p class="c-val"><a href="https://wa.me/524891007679" style="color:#1c2b1e;text-decoration:none">+52 489 100 7679</a></p></div>
      <div class="c-card"><p class="c-icon">✉️</p><p class="c-type">Email</p><p class="c-val" style="font-size:10px"><a href="mailto:reservas@paraisoencantado.com" style="color:#1c2b1e;text-decoration:none">reservas@paraisoencantado.com</a></p></div>
    </div>
  </div>

  <div class="footer">
    <p class="f-logo">Paraíso Encantado</p>
    <div class="f-div"></div>
    <p class="f-addr">Xilitla, San Luis Potosí 79910 · México<br>A 5 minutos caminando del Jardín Surrealista de Edward James<br>paraisoencantado.com</p>
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
  tourItems?: TourItem[];
  compact?: boolean;
}) {
  const suites = b.habitaciones.split(', ').filter(Boolean).map(s => s.trim());
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const TERRAZA = `${baseUrl}/images/Areas comunes/terraza.jpg`;
  const FACHADA = `${baseUrl}/images/Areas comunes/DSC09456-HDR.jpg`;
  const suiteImgSrc  = suites[0] && SUITE_IMAGES[suites[0]] ? `${baseUrl}${SUITE_IMAGES[suites[0]]}` : '';
  const suiteImgSrc2 = suites.length === 1
    ? TERRAZA
    : (suites[1] && SUITE_IMAGES[suites[1]] ? `${baseUrl}${SUITE_IMAGES[suites[1]]}` : TERRAZA);
  const suiteImgSrc3 = suites.length < 3
    ? FACHADA
    : (suites[2] && SUITE_IMAGES[suites[2]] ? `${baseUrl}${SUITE_IMAGES[suites[2]]}` : FACHADA);

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
    suiteImgSrc: b.compact ? undefined : suiteImgSrc,
    suiteImgSrc2: b.compact ? undefined : suiteImgSrc2,
    suiteImgSrc3: b.compact ? undefined : suiteImgSrc3,
    forPrint: true,
    tourItems: b.tourItems ?? parseTours(b.notas || ''),
    compact: b.compact ?? false,
  }));
  win.document.close();
}

interface Props { initialQuotes: AdminQuote[] }

function QuoteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ cliente: '', telefono: '', email: '', checkin: '', checkout: '' });
  const [habitaciones, setHabitaciones] = useState<HabItem[]>([{ suite: SUITES[3], huespedes: 2 }]);
  const [tourItems, setTourItems] = useState<TourItem[]>([]);
  const [precioManual, setPrecioManual] = useState<number | null>(null);
  const [promoActiva, setPromoActiva] = useState(false);
  const [anticipo, setAnticipo] = useState(0);
  const [restanteOverride, setRestanteOverride] = useState<number | null>(null);
  const [notasCliente, setNotasCliente] = useState('');
  const [notasInternas, setNotasInternas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addTour() { setTourItems(t => [...t, { nombre: TOURS_CATALOG[0].nombre, personas: 2, precio: TOURS_CATALOG[0].precio }]); setPrecioManual(null); }
  function removeTour(i: number) { setTourItems(t => t.filter((_, idx) => idx !== i)); setPrecioManual(null); }
  function updateTour(i: number, key: keyof TourItem, val: string | number) {
    setTourItems(t => t.map((item, idx) => {
      if (idx !== i) return item;
      if (key === 'nombre') {
        const cat = TOURS_CATALOG.find(c => c.nombre === val);
        return { ...item, nombre: String(val), precio: cat ? cat.precio : item.precio };
      }
      return { ...item, [key]: typeof val === 'string' ? parseInt(val) || 0 : val };
    }));
    setPrecioManual(null);
  }

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
  const habsAuto = habitaciones.reduce((sum, h) => sum + getHabPrecioQ(h) * Math.max(noches, 1), 0);
  const toursAuto = getToursTotalQ(tourItems);
  const precioAuto = habsAuto + toursAuto;
  const precio2Noches = habitaciones.reduce((sum, h) => sum + getHabPrecioQ(h) * 2, 0) + toursAuto;
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
        body: JSON.stringify({ ...form, suite, huespedes, noches, precioTotal, notas: joinNotas(notasCliente, notasInternas, tourItems) }),
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

          {/* Tours */}
          <div className={styles.roomsSection}>
            <div className={styles.roomsSectionHeader}>
              <span className={styles.roomsSectionLabel}>Tours / Experiencias</span>
              <button type="button" className={styles.addRoomBtn} onClick={addTour}>
                <Plus size={13} /> Agregar tour
              </button>
            </div>
            {tourItems.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#aaa', padding: '6px 0' }}>Sin tours agregados</p>
            )}
            {tourItems.map((t, i) => (
              <div key={i} className={styles.roomRow}>
                <select className={styles.roomRowSelect} style={{ flex: 2 }} value={t.nombre}
                  onChange={e => updateTour(i, 'nombre', e.target.value)}>
                  {TOURS_CATALOG.map(c => <option key={c.nombre}>{c.nombre}</option>)}
                </select>
                <select className={styles.roomRowSelect} value={t.personas}
                  onChange={e => updateTour(i, 'personas', parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}p</option>)}
                </select>
                <input type="number" min={0} className={styles.roomPriceInput}
                  value={t.precio} title="Precio por persona"
                  onChange={e => updateTour(i, 'precio', parseInt(e.target.value) || 0)} />
                <button type="button" className={styles.removeRoomBtn} onClick={() => removeTour(i)}>
                  <X size={13} />
                </button>
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
            {tourItems.map((t, i) => (
              <div key={`t${i}`} className={styles.priceBreakdownRow} style={{ color: '#7a6a52' }}>
                <span>🗺 {t.nombre.length > 30 ? t.nombre.slice(0,30)+'…' : t.nombre} ({t.personas}p)</span>
                <span>${t.precio.toLocaleString('es-MX')}/p × {t.personas} = ${(t.precio*t.personas).toLocaleString('es-MX')}</span>
              </div>
            ))}

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
  const [tourItems, setTourItems] = useState<TourItem[]>(() => parseTours(quote.notas || ''));
  const [precioManual, setPrecioManual] = useState<number | null>(quote.precioTotal || null);
  const [promoActiva, setPromoActiva] = useState(false);
  const [anticipo, setAnticipo] = useState(0);
  const [restanteOverride, setRestanteOverride] = useState<number | null>(null);
  const [notasCliente, setNotasCliente] = useState(() => parseNotasCliente(quote.notas || ''));
  const [notasInternas, setNotasInternas] = useState(() => {
    const idx = (quote.notas || '').indexOf(INTERNO_SEP);
    if (idx === -1) return '';
    const after = quote.notas.slice(idx + INTERNO_SEP.length);
    const toursIdx = after.indexOf(TOURS_SEP);
    return toursIdx === -1 ? after.trim() : after.slice(0, toursIdx).trim();
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
  function addTourE() { setTourItems(t => [...t, { nombre: TOURS_CATALOG[0].nombre, personas: 2, precio: TOURS_CATALOG[0].precio }]); setPrecioManual(null); }
  function removeTourE(i: number) { setTourItems(t => t.filter((_, idx) => idx !== i)); setPrecioManual(null); }
  function updateTourE(i: number, key: keyof TourItem, val: string | number) {
    setTourItems(t => t.map((item, idx) => {
      if (idx !== i) return item;
      if (key === 'nombre') {
        const cat = TOURS_CATALOG.find(c => c.nombre === val);
        return { ...item, nombre: String(val), precio: cat ? cat.precio : item.precio };
      }
      return { ...item, [key]: typeof val === 'string' ? parseInt(val) || 0 : val };
    }));
    setPrecioManual(null);
  }

  const noches = calcNights(form.checkin, form.checkout);
  const habsAuto = habitaciones.reduce((sum, h) => sum + getHabPrecioQ(h) * Math.max(noches, 1), 0);
  const toursAutoE = getToursTotalQ(tourItems);
  const precioAuto = habsAuto + toursAutoE;
  const precio2Noches = habitaciones.reduce((sum, h) => sum + getHabPrecioQ(h) * 2, 0) + toursAutoE;
  const precioTotal = precioManual ?? precioAuto;
  const restante = restanteOverride ?? (precioTotal - anticipo);

  function aplicarPromo3x2() { setPrecioManual(precio2Noches); setPromoActiva(true); }
  function resetPrecio() { setPrecioManual(null); setPromoActiva(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const suite = habitaciones.map(h => h.suite).join(', ');
    await onSaved(quote, { ...form, suite, noches, precioTotal, notas: joinNotas(notasCliente, notasInternas, tourItems) });
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

          {/* Tours */}
          <div className={styles.roomsSection}>
            <div className={styles.roomsSectionHeader}>
              <span className={styles.roomsSectionLabel}>Tours / Experiencias</span>
              <button type="button" className={styles.addRoomBtn} onClick={addTourE}>
                <Plus size={13} /> Agregar tour
              </button>
            </div>
            {tourItems.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#aaa', padding: '6px 0' }}>Sin tours agregados</p>
            )}
            {tourItems.map((t, i) => (
              <div key={i} className={styles.roomRow}>
                <select className={styles.roomRowSelect} style={{ flex: 2 }} value={t.nombre}
                  onChange={e => updateTourE(i, 'nombre', e.target.value)}>
                  {TOURS_CATALOG.map(c => <option key={c.nombre}>{c.nombre}</option>)}
                </select>
                <select className={styles.roomRowSelect} value={t.personas}
                  onChange={e => updateTourE(i, 'personas', parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}p</option>)}
                </select>
                <input type="number" min={0} className={styles.roomPriceInput}
                  value={t.precio} title="Precio por persona"
                  onChange={e => updateTourE(i, 'precio', parseInt(e.target.value) || 0)} />
                <button type="button" className={styles.removeRoomBtn} onClick={() => removeTourE(i)}>
                  <X size={13} />
                </button>
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
            {tourItems.map((t, i) => (
              <div key={`t${i}`} className={styles.priceBreakdownRow} style={{ color: '#7a6a52' }}>
                <span>🗺 {t.nombre.length > 30 ? t.nombre.slice(0,30)+'…' : t.nombre} ({t.personas}p)</span>
                <span>${(t.precio*t.personas).toLocaleString('es-MX')}</span>
              </div>
            ))}

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
                  Ahorro: ${(habsAuto - precio2Noches + toursAutoE).toLocaleString('es-MX')} MXN
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

      {/* ── Mobile tarjetas (visible solo en <640px via CSS) ── */}
      <div className={styles.mobileCardList}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--sage)' }}>Sin cotizaciones que mostrar</p>
        ) : filtered.map(q => (
          <div key={q.id} className={styles.mobileCard}>
            <div className={styles.mobileCardTop}>
              <span className={styles.mobileCardRef}>{q.id}</span>
              <span className={styles.badge} style={{ color: ESTADO_COLOR[q.estado], fontSize: '0.65rem' }}>{q.estado}</span>
            </div>
            <div className={styles.mobileCardName}>{q.cliente}</div>
            {q.email && <div className={styles.mobileCardEmail}>{q.email}</div>}
            <div className={styles.mobileCardSuite}>{q.suite}</div>
            <div className={styles.mobileCardDates}>{fmtDate(q.checkin)} → {fmtDate(q.checkout)} · {q.noches}n</div>
            <div className={styles.mobileCardTotal}>${q.precioTotal.toLocaleString('es-MX')} MXN</div>
            <div className={styles.mobileCardActions}>
              <button className={`${styles.mobileCardBtn} ${styles.mobileCardBtnSend}`} onClick={() => sendEmail(q)} disabled={sendingId === q.id}>
                {sendingId === q.id ? <Loader2 size={12} /> : <Send size={12} />}
              </button>
              <button className={`${styles.mobileCardBtn} ${styles.mobileCardBtnWa}`} onClick={() => openWhatsApp(q)}>
                <MessageSquare size={12} />
              </button>
              <a href={`/api/admin/cotizaciones/${q.id}/render`} target="_blank" rel="noopener"
                className={`${styles.mobileCardBtn} ${styles.mobileCardBtnPdf}`}
                style={{ display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                title="Descargar cotización">
                <Download size={12} />
              </a>
              <button className={`${styles.mobileCardBtn} ${styles.mobileCardBtnEdit}`} onClick={() => setEditQuote(q)}>
                <Pencil size={12} />
              </button>
              <button className={`${styles.mobileCardBtn} ${styles.mobileCardBtnDel}`} onClick={() => deleteQuote(q)}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className={styles.scrollHint}>← desliza para ver más →</p>

      {/* Desktop tabla */}
      <div className={styles.tableScrollWrap}>
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
                    <a href={`/api/admin/cotizaciones/${q.id}/render`} target="_blank" rel="noopener"
                      className={styles.pdfBtn} title="Descargar cotización"
                      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                      <Download size={14} />
                    </a>
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
      </div> {/* /tableScrollWrap */}

      {showModal && <QuoteModal onClose={() => setShowModal(false)} onSaved={() => { refresh(); setShowModal(false); }} />}
      {editQuote && <EditQuoteModal quote={editQuote} onClose={() => setEditQuote(null)} onSaved={saveEdit} />}
    </div>
  );
}
