import { NextResponse } from 'next/server';
import { getAllBookings } from '@/lib/admin/sheets-admin';
import { getSheetsClient, sheetsCall } from '@/lib/sheets';
import { BOOKING_ROOMS } from '@/lib/booking';
import { parseFechaHojaMx as parseFechaMx } from '@/lib/date-mx';
import { getReservasCalendario } from '@/lib/admin/reservas-calendario';

export const dynamic = 'force-dynamic';

// Prueba social REAL para /reservar: reservas recientes anonimizadas
// (nombre de pila + inicial, suite, hace cuánto) + conteo de 30 días.
// Sin PII: nunca exponemos apellidos, correos, teléfonos ni fechas de estancia.
// Dos fuentes: la hoja Reservas (web, panel y Camila; con nombre) y las reservas
// que el hotel cierra desde /admin/calendario (WhatsApp, teléfono…; sin nombre).

interface RecentEntry {
  /** Nombre de pila + inicial; null en las del calendario del panel (no guardan nombre). */
  name: string | null;
  room: string;
  agoHours: number;
}

interface Payload {
  count30d: number;
  recent: RecentEntry[];
  /** % real de noches-cuarto ocupadas en los próximos 30 días (hoja Disponibilidad), null si no se pudo calcular */
  occupancyPct: number | null;
}

let cache: { at: number; payload: Payload } | null = null;
const TTL_MS = 10 * 60 * 1000;

function anonymizeName(full: string): string | null {
  const clean = (full || '').trim().replace(/\s+/g, ' ');
  if (clean.length < 2 || /prueba|test|borrar|n\/a/i.test(clean)) return null;
  const parts = clean.split(' ');
  const first = parts[0];
  if (first.length < 2) return null;
  const cap = first[0].toUpperCase() + first.slice(1).toLowerCase();
  const initial = parts.length > 1 && /^[a-záéíóúñ]/i.test(parts[1]) ? ` ${parts[1][0].toUpperCase()}.` : '';
  return cap + initial;
}

function firstRoom(habitaciones: string): string | null {
  const room = (habitaciones || '').split(',')[0].replace(/\s*\([^)]*\)/g, '').trim();
  return room.length > 1 && room.toLowerCase() !== 'estándar' ? room : null;
}

// Ocupación REAL de los próximos 30 días leyendo la hoja Disponibilidad
// (celdas RESERVADO/BLOQUEADO/MANTENIMIENTO/OTA* de las 13 habitaciones).
async function calcOccupancyPct(): Promise<number | null> {
  try {
    const client = await getSheetsClient();
    if (!client || !process.env.GOOGLE_SHEET_ID) return null;
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: 'Disponibilidad!A:Z',
      })
    );
    const data: string[][] = res.data.values || [];
    if (data.length < 2) return null;

    const headers = data[0];
    const roomCols = BOOKING_ROOMS
      .map(r => headers.findIndex(h => h === r.name))
      .filter(i => i !== -1);
    if (roomCols.length === 0) return null;

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    const [y, m, d] = today.split('-').map(Number);
    const end = new Date(Date.UTC(y, m - 1, d));
    end.setUTCDate(end.getUTCDate() + 30);
    const endStr = end.toISOString().split('T')[0];

    let occupied = 0;
    let totalCells = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rawDate = (row[0] || '').trim();
      let dateStr = rawDate.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parsed = new Date(`${rawDate}T00:00:00`);
        if (isNaN(parsed.getTime())) continue;
        dateStr = parsed.toISOString().split('T')[0];
      }
      if (dateStr < today || dateStr >= endStr) continue;
      for (const col of roomCols) {
        totalCells++;
        const val = (row[col] || '').toUpperCase().trim();
        if (val === 'RESERVADO' || val === 'BLOQUEADO' || val === 'MANTENIMIENTO' || val.startsWith('OTA')) {
          occupied++;
        }
      }
    }
    if (totalCells < 100) return null; // hoja incompleta: no afirmar nada
    return Math.round((occupied / totalCells) * 100);
  } catch {
    return null;
  }
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.payload);
  }
  try {
    const [bookings, occupancyPct, delCalendario] = await Promise.all([
      getAllBookings(),
      calcOccupancyPct(),
      // Reservas que el hotel cerró desde /admin/calendario (WhatsApp,
      // teléfono…). Cuentan para «N reservas confirmadas este mes» y, desde el
      // 20 oct 2026, también salen en el aviso, sin nombre: eran 12 de las 15
      // reservas de esa semana y el aviso solo enseñaba las de la hoja Reservas,
      // casi todas de hacía semanas.
      getReservasCalendario(true).catch(() => []),
    ]);
    const now = Date.now();
    const DAY = 86_400_000;
    // Ni el conteo ni el aviso miran más de un mes atrás (el aviso llegaba a 45
    // días: «hace 41 días» no convence a nadie).
    const VENTANA_MS = 30 * DAY;
    const horas = (ageMs: number) => Math.max(1, Math.round(ageMs / 3_600_000));

    let count30d = 0;
    const candidatas: RecentEntry[] = [];

    for (const b of bookings) {
      if (b.estado === 'CANCELADA') continue;
      const created = parseFechaMx(b.fecha);
      if (!created) continue;
      const ageMs = now - created.getTime();
      if (ageMs < 0 || ageMs > VENTANA_MS) continue;
      count30d++;
      const name = anonymizeName(b.cliente);
      const room = firstRoom(b.habitaciones);
      if (name && room) candidatas.push({ name, room, agoHours: horas(ageMs) });
    }

    for (const r of delCalendario) {
      if (r.estado !== 'activa') continue;
      const ageMs = now - Date.parse(r.registrada);
      if (!(ageMs >= 0 && ageMs <= VENTANA_MS)) continue; // también deja fuera una fecha ilegible (NaN)
      count30d++;
      const room = firstRoom(r.suite);
      if (room) candidatas.push({ name: null, room, agoHours: horas(ageMs) });
    }

    // La más nueva primero, venga de la fuente que venga.
    const recent = candidatas.sort((a, b) => a.agoHours - b.agoHours).slice(0, 20);

    const payload: Payload = { count30d, recent, occupancyPct };
    cache = { at: Date.now(), payload };
    return NextResponse.json(payload);
  } catch {
    // Fail-soft: la página simplemente no muestra prueba social
    return NextResponse.json({ count30d: 0, recent: [], occupancyPct: null });
  }
}
