import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getAllBookings } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

const DAYS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
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

const PRECIO_BASE: Record<string, number> = {
  'Suite Flor de Liz 1': 1900, 'Suite Flor de Liz 2': 1900,
  'Suite LindaVista': 1900, 'Jungla': 1900, 'Suite Lajas': 1900,
  'Helechos 1': 1900, 'Helechos 2': 1900,
  'Lirios 1': 1500, 'Lirios 2': 1500, 'Orquídeas 2': 1500,
  'Orquídeas Doble': 1500, 'Orquídeas 3': 1500, 'Bromelias': 1500,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const bookings = await getAllBookings();
  const b = bookings.find(x => x.confirmacion === id);
  if (!b) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });

  const noches = b.noches || 1;
  const anticipo = b.anticipo || 0;
  const balance  = b.total - anticipo;
  const tours = parseTours(b.notas || '');
  const paquetes = parsePaquetes(b.notas || '');
  const toursTotal = tours.reduce((s, t) => s + t.precio * t.personas, 0);
  const paquetesTotal = paquetes.reduce((s, p) => s + p.precio, 0);
  const habsTotal = b.total - toursTotal - paquetesTotal;

  // Parse room names: "Jungla (2 personas)" → { name, guests }
  const rawRooms = b.habitaciones
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);

  const rooms = rawRooms.map(raw => {
    const guestsMatch = raw.match(/\((\d+)\s*persona/i);
    const guests = guestsMatch ? parseInt(guestsMatch[1]) : 2;
    const name = raw.replace(/\s*\([^)]*\)/g, '').trim();
    const baseRate = PRECIO_BASE[name] ?? Math.round(habsTotal / rawRooms.length / noches);
    return {
      name,
      category: SUITE_CATEGORY[name] ?? 'Suite Boutique · Paraíso Encantado',
      guests,
      nights: noches,
      rate: baseRate,
      subtotal: baseRate * noches,
    };
  });

  // Add tours as extra rows
  for (const t of tours) {
    rooms.push({
      name: `🗺 ${t.nombre}`,
      category: `Tour · ${t.personas} persona${t.personas !== 1 ? 's' : ''}`,
      guests: t.personas, nights: 1, rate: t.precio, subtotal: t.precio * t.personas,
    });
  }
  // Add packages
  for (const p of paquetes) {
    rooms.push({
      name: `🎁 ${p.nombre}`,
      category: `Paquete · ${p.habitacion} · ${p.noches} noches · ${p.personas} persona${p.personas !== 1 ? 's' : ''}`,
      guests: p.personas, nights: p.noches, rate: Math.round(p.precio / p.noches), subtotal: p.precio,
    });
  }

  const data = {
    folio: b.confirmacion,
    fechaEmision: fmtToday(),
    guest: {
      name:  b.cliente   || '—',
      email: b.email     || '—',
      phone: b.telefono  || '—',
    },
    stay: {
      checkIn:  fmtDate(b.checkin),
      checkOut: fmtDate(b.checkout),
      nights:   noches,
      guests:   b.huespedes || rawRooms.length * 2,
    },
    rooms,
    pricing: {
      subtotal:      b.total,
      discount:      0,
      discountLabel: '',
      total:         b.total,
      deposit:       anticipo,
      balance:       balance,
      currency:      'MXN',
    },
  };

  const tplPath = path.join(process.cwd(), 'public/templates/confirmacion.html');
  let html: string;
  try {
    html = await readFile(tplPath, 'utf-8');
  } catch {
    return NextResponse.json({ error: 'Template no encontrado' }, { status: 500 });
  }

  html = html.replace(
    /<script type="application\/json" id="booking-data">[\s\S]*?<\/script>/,
    `<script type="application/json" id="booking-data">${JSON.stringify(data, null, 2)}</script>`
  );

  const download = new URL(_req.url).searchParams.get('download');
  const headers: Record<string, string> = { 'Content-Type': 'text/html; charset=utf-8' };
  if (download) headers['Content-Disposition'] = `attachment; filename="${b.confirmacion}.html"`;

  return new NextResponse(html, { headers });
}
