import { NextRequest, NextResponse } from 'next/server';
import { getAllOTACalendars, saveOTACalendar } from '@/lib/admin/sheets-admin';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  try {
    const calendars = await getAllOTACalendars();
    return NextResponse.json(calendars);
  } catch (e: any) {
    console.error('GET /api/admin/canales error:', e);
    return NextResponse.json({ error: e?.message || 'Error al leer calendarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomName, platform, icalUrl, active = true, id } = body;
    if (!roomName || !platform || !icalUrl) {
      return NextResponse.json({ error: 'Faltan campos (habitación, plataforma o URL).' }, { status: 400 });
    }
    // Expedia DESACTIVADO: ya no se enlaza ni sincroniza por iCal con Expedia.
    if (platform === 'expedia') {
      return NextResponse.json({ error: 'La sincronización con Expedia está desactivada.' }, { status: 400 });
    }
    // saveOTACalendar confirma la escritura con la respuesta de Sheets y lanza error si falla.
    const finalId = id || randomUUID();
    await saveOTACalendar({ id: finalId, roomName, platform, icalUrl, active });
    return NextResponse.json({ ok: true, id: finalId });
  } catch (e: any) {
    console.error('POST /api/admin/canales error:', e);
    return NextResponse.json({ error: e?.message || 'Error al guardar el calendario.' }, { status: 500 });
  }
}
