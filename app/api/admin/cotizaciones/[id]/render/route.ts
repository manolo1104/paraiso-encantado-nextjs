import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getAllQuotes } from '@/lib/admin/sheets-admin';
import { BOOKING_ROOMS, getRoomBasePrice } from '@/lib/booking';

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
  try { return JSON.parse(notas.slice(idx + 12).split('||HABS||')[0]); } catch { return []; }
}
function parseHabs(notas: string): { suite: string; huespedes: number; precioOverride?: number }[] | null {
  const idx = notas.indexOf('||HABS||');
  if (idx === -1) return null;
  try { return JSON.parse(notas.slice(idx + 8)); } catch { return null; }
}

// Category description per suite
const SUITE_CATEGORY: Record<string, string> = {
  'Suite Flor de Liz 1': 'Vista a las Montañas · Spa privado',
  'Suite Flor de Liz 2': 'Vista a las Montañas · Spa privado',
  'Suite LindaVista':    'Vista a las Montañas · Tina de hidromasaje',
  'Jungla':              'Vista a las Montañas · Spa privado',
  'Suite Lajas':         'Vista a las Montañas · Suite amplia',
  'Lirios 1':            'Vista a los Jardines',
  'Lirios 2':            'Vista a los Jardines · Balcón privado',
  'Orquídeas 2':         'Vista a la Piscina · Cama King',
  'Orquídeas Doble':     'Vista a la Piscina',
  'Orquídeas 3':         'Vista a la Piscina · Cama King',
  'Bromelias':           'Vista a la Piscina · Planta baja',
  'Helechos 1':          'Vista a la Piscina · Familiar (hasta 6)',
  'Helechos 2':          'Vista a la Piscina · Familiar (hasta 8)',
};

function inferGuests(roomName: string, ratePerNight: number): number {
  const room = BOOKING_ROOMS.find(r => r.name === roomName);
  if (!room) return 2;
  const keys = Object.keys(room.priceTiers).map(Number).sort((a, b) => a - b);
  let guests = keys[0] ?? 2;
  for (const k of keys) {
    if (room.priceTiers[k] <= ratePerNight + 50) guests = k;
  }
  return guests;
}

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
  const habsData = parseHabs(q.notas || '');
  const habsTotal = q.precioTotal - toursTotal - paquetesTotal;
  // Tarifa promedio: solo se usa como respaldo para cotizaciones viejas
  // que no guardan datos por habitación (||HABS||).
  const avgRate = roomNames.length > 0 ? Math.round(habsTotal / roomNames.length / noches) : 1500;

  // Renglones por habitación con la tarifa REAL por noche cuando está disponible.
  // Antes se promediaba el total entre todas las habitaciones, lo que mostraba
  // tarifas incorrectas cuando las suites tenían precios distintos.
  const rooms = (habsData && habsData.length > 0)
    ? habsData.map(h => {
        const room = BOOKING_ROOMS.find(r => r.name === h.suite);
        const rate = h.precioOverride ?? (room ? getRoomBasePrice(room, h.huespedes) : avgRate);
        return {
          name: h.suite,
          category: SUITE_CATEGORY[h.suite] ?? 'Suite Boutique',
          guests: h.huespedes,
          nights: noches,
          rate,
          subtotal: rate * noches,
        };
      })
    : roomNames.map(name => ({
        name,
        category: SUITE_CATEGORY[name] ?? 'Suite Boutique',
        guests: inferGuests(name, avgRate),
        nights: noches,
        rate: avgRate,
        subtotal: avgRate * noches,
      }));

  const habsComputed = rooms.reduce((s, r) => s + r.subtotal, 0);
  const totalGuests = rooms.reduce((s, r) => s + r.guests, 0);

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

  // Subtotal bruto (suma real de renglones). Si el total guardado es menor,
  // la diferencia se muestra como "Descuento" para que las cuentas cuadren.
  const grossSubtotal = habsComputed + toursTotal + paquetesTotal;
  const discount = grossSubtotal > q.precioTotal ? grossSubtotal - q.precioTotal : 0;

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
      guests: totalGuests,
    },
    rooms,
    pricing: {
      subtotal:      discount > 0 ? grossSubtotal : q.precioTotal,
      discount,
      discountLabel: discount > 0 ? 'Descuento' : '',
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
