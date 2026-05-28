import { NextRequest, NextResponse } from 'next/server';
import { slugToRoomName } from '@/lib/room-slugs';
import { getAllBookings } from '@/lib/admin/sheets-admin';

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

  const bookings = await getAllBookings();
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
    lines.push(`DESCRIPTION:${escapeIcal(b.cliente || 'Huésped')}`);
    lines.push(`STATUS:CONFIRMED`);
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
