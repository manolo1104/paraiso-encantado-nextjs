import { NextRequest, NextResponse } from 'next/server';
import { slugToRoomName } from '@/lib/room-slugs';
import { getAllBookings } from '@/lib/admin/sheets-admin';
import { getRoomBlockedRanges } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

function icalDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  const roomName = slugToRoomName(roomId);
  if (!roomName) {
    return new NextResponse('Room not found', { status: 404 });
  }

  const [bookings, blockedRanges] = await Promise.all([
    getAllBookings(),
    // Bloqueos MANUALES / mantenimiento de la matriz Disponibilidad, para que
    // cerrar una fecha en /calendario también llegue a Expedia/Booking. No incluye
    // reservas directas (ya salen abajo), bloqueos de OTA (evita lazos) ni
    // 'ABIERTO' (fecha liberada a mano).
    getRoomBlockedRanges(roomName).catch(() => []),
  ]);
  const roomBookings = bookings.filter(b => {
    if (b.estado === 'CANCELADA') return false;
    const habs = b.habitaciones.split(',').map(h => h.replace(/\s*\([^)]*\)/g, '').trim());
    return habs.includes(roomName);
  });

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Paraíso Encantado//Hotel//ES`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcal(roomName)} - Paraíso Encantado`,
    'X-WR-TIMEZONE:America/Mexico_City',
  ];

  for (const b of roomBookings) {
    if (!b.checkin || !b.checkout) continue;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${b.confirmacion}-${roomId}@paraisoencantado.mx`);
    lines.push(`DTSTART;VALUE=DATE:${icalDate(b.checkin)}`);
    lines.push(`DTEND;VALUE=DATE:${icalDate(b.checkout)}`);
    lines.push(`SUMMARY:Reservado`);
    // Feed PÚBLICO (lo consumen las OTAs sin token): NUNCA incluir el nombre del
    // huésped ni datos personales — las OTAs solo necesitan las fechas para bloquear.
    lines.push(`STATUS:CONFIRMED`);
    lines.push('TRANSP:OPAQUE');
    lines.push('END:VEVENT');
  }

  // Bloqueos manuales / mantenimiento de la matriz Disponibilidad como eventos,
  // para que las OTAs también dejen de vender esas fechas.
  for (const r of blockedRanges) {
    if (!r.checkin || !r.checkout) continue;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:block-${icalDate(r.checkin)}-${roomId}@paraisoencantado.mx`);
    lines.push(`DTSTART;VALUE=DATE:${icalDate(r.checkin)}`);
    lines.push(`DTEND;VALUE=DATE:${icalDate(r.checkout)}`);
    lines.push('SUMMARY:No disponible');
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
