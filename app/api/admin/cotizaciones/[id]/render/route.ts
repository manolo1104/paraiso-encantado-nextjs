import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getAllQuotes } from '@/lib/admin/sheets-admin';
import { BOOKING_ROOMS } from '@/lib/booking';

export const dynamic = 'force-dynamic';

const DAYS_ES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtDate(d: string): string {
  if (!d || d === 'N/A') return '—';
  const dt = new Date(d + 'T12:00:00');
  if (isNaN(dt.getTime())) return d;
  return `${DAYS_ES[dt.getDay()]} ${dt.getDate()} ${MONTHS_ES[dt.getMonth()]} ${dt.getFullYear()}`;
}

function fmtToday(): string {
  const dt = new Date();
  return `${dt.getDate()} ${MONTHS_ES[dt.getMonth()]} ${dt.getFullYear()}`;
}

function addDays(dateStr: string, days: number): string {
  const dt = new Date(dateStr + 'T12:00:00');
  if (isNaN(dt.getTime())) return dateStr;
  dt.setDate(dt.getDate() + days);
  return `${dt.getDate()} ${MONTHS_ES[dt.getMonth()]} ${dt.getFullYear()}`;
}

// Parse tours from ||TOURS||[...] in notas
function parseTours(notas: string): { nombre: string; personas: number; precio: number }[] {
  const idx = notas.indexOf('||TOURS||');
  if (idx === -1) return [];
  try { return JSON.parse(notas.slice(idx + 9).split('||PAQUETES||')[0]); } catch { return []; }
}
function parsePaquetes(notas: string): { nombre: string; habitacion: string; noches: number; personas: number; precio: number }[] {
  const idx = notas.indexOf('||PAQUETES||');
  if (idx === -1) return [];
  try { return JSON.parse(notas.slice(idx + 12)); } catch { return []; }
}

// Category description per suite
const SUITE_CATEGORY: Record<string, string> = {
  'Suite Flor de Liz 1': 'Suite Plus · Spa privado',
  'Suite Flor de Liz 2': 'Suite Plus · Spa privado',
  'Suite LindaVista':    'Suite Master · Jacuzzi · Vista panorámica',
  'Jungla':              'Suite Master · Spa privado · Selva',
  'Suite Lajas':         'Suite Standard · Terraza con vista',
  'Lirios 1':            'Habitación Estándar · Vista jardín',
  'Lirios 2':            'Habitación Estándar Plus · Balcón',
  'Orquídeas 2':         'Superior King · Vista piscina',
  'Orquídeas Doble':     'Superior · Terraza piscina',
  'Orquídeas 3':         'Superior King · Vista elevada',
  'Bromelias':           'Estándar Plus · Acceso piscina',
  'Helechos 1':          'Suite Familiar · 3 camas · hasta 6 personas',
  'Helechos 2':          'Suite Familiar Plus · 4 camas · hasta 6 personas',
};

// Precio base por habitación (fuente: lib/booking.ts)
const PRECIO_BASE: Record<string, number> = Object.fromEntries(
  BOOKING_ROOMS.map(r => [r.name, r.price])
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const quotes = await getAllQuotes();
  const q = quotes.find(x => x.id === id);
  if (!q) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  // Parse rooms from suite string
  const roomNames = q.suite.split(',').map(r => r.replace(/\s*\([^)]*\)/g, '').trim()).filter(Boolean);
  const noches = q.noches || 1;
  const tours = parseTours(q.notas || '');
  const paquetes = parsePaquetes(q.notas || '');
  const toursTotal = tours.reduce((s, t) => s + t.precio * t.personas, 0);
  const paquetesTotal = paquetes.reduce((s, p) => s + p.precio, 0);
  const habsTotal = q.precioTotal - toursTotal - paquetesTotal;
  const habsPerRoom = roomNames.length > 0 ? Math.round(habsTotal / roomNames.length / noches) : 1500;

  const rooms = roomNames.map(name => ({
    name,
    category: SUITE_CATEGORY[name] ?? 'Suite Boutique',
    guests: 2,
    nights: noches,
    rate: PRECIO_BASE[name] ?? habsPerRoom,
    subtotal: (PRECIO_BASE[name] ?? habsPerRoom) * noches,
  }));

  // Add tours as extra line items
  for (const t of tours) {
    rooms.push({
      name: `🗺 ${t.nombre}`,
      category: `Tour · ${t.personas} persona${t.personas !== 1 ? 's' : ''}`,
      guests: t.personas, nights: 1, rate: t.precio, subtotal: t.precio * t.personas,
    });
  }
  // Add packages as line items
  for (const p of paquetes) {
    rooms.push({
      name: `🎁 ${p.nombre}`,
      category: `Paquete · ${p.habitacion} · ${p.noches} noches · ${p.personas} persona${p.personas !== 1 ? 's' : ''}`,
      guests: p.personas, nights: p.noches, rate: Math.round(p.precio / p.noches), subtotal: p.precio,
    });
  }

  const data = {
    folio: q.id,
    fechaEmision: fmtToday(),
    validoHasta: q.checkin ? addDays(q.checkin, 2) : addDays(new Date().toISOString().split('T')[0], 7),
    guest: {
      name:  q.cliente || '—',
      email: q.email   || '—',
      phone: q.telefono || '—',
    },
    stay: {
      checkIn:  fmtDate(q.checkin),
      checkOut: fmtDate(q.checkout),
      nights:   noches,
      guests:   q.suite.split(',').length * 2,
    },
    rooms,
    pricing: {
      subtotal:      q.precioTotal,
      discount:      0,
      discountLabel: '',
      total:         q.precioTotal,
      currency:      'MXN',
    },
  };

  const tplPath = path.join(process.cwd(), 'public/templates/cotizacion.html');
  let html: string;
  try {
    html = await readFile(tplPath, 'utf-8');
  } catch {
    return NextResponse.json({ error: 'Template no encontrado' }, { status: 500 });
  }

  html = html.replace(
    /<script type="application\/json" id="quote-data">[\s\S]*?<\/script>/,
    `<script type="application/json" id="quote-data">${JSON.stringify(data, null, 2)}</script>`
  );

  const download = new URL(_req.url).searchParams.get('download');
  const headers: Record<string, string> = { 'Content-Type': 'text/html; charset=utf-8' };
  if (download) headers['Content-Disposition'] = `attachment; filename="${q.id}.html"`;

  return new NextResponse(html, { headers });
}
