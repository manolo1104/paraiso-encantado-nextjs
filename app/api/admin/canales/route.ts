import { NextRequest, NextResponse } from 'next/server';
import { getAllOTACalendars, saveOTACalendar } from '@/lib/admin/sheets-admin';
import { getSheetsClient, sheetsCall } from '@/lib/sheets';
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
    const finalId = id || randomUUID();

    // ── Diagnóstico paso a paso (temporal) ─────────────────────────────
    const client = await getSheetsClient();
    if (!client) {
      return NextResponse.json({ error: 'DIAG: getSheetsClient() = null → faltan GOOGLE_SHEETS_CREDENTIALS o GOOGLE_SHEET_ID en el entorno.' }, { status: 500 });
    }
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    let tabs: string[] = [];
    try {
      const meta = await sheetsCall(() => client.spreadsheets.get({ spreadsheetId: SHEET_ID }));
      tabs = (meta.data.sheets || []).map((s: any) => s.properties?.title).filter(Boolean);
    } catch (e: any) {
      return NextResponse.json({ error: `DIAG[meta]: ${e?.message || e}` }, { status: 500 });
    }
    const hadTab = tabs.includes('OTA_Calendars');

    try {
      await saveOTACalendar({ id: finalId, roomName, platform, icalUrl, active });
    } catch (e: any) {
      return NextResponse.json({ error: `DIAG[save] (tabExistía=${hadTab}): ${e?.message || e}` }, { status: 500 });
    }

    try {
      const read = await sheetsCall(() => client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'OTA_Calendars!A:H' }));
      const rows = read.data.values || [];
      const found = rows.slice(1).some((r: any) => r[0] === finalId);
      if (!found) {
        return NextResponse.json({
          error: `DIAG[verify]: guardado sin excepción pero la fila no aparece. tabExistíaAntes=${hadTab}, filasLeídas=${rows.length}, tabs=[${tabs.join(', ')}]`,
        }, { status: 500 });
      }
    } catch (e: any) {
      return NextResponse.json({ error: `DIAG[read]: ${e?.message || e}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: finalId });
  } catch (e: any) {
    console.error('POST /api/admin/canales error:', e);
    return NextResponse.json({ error: `DIAG[outer]: ${e?.message || e}` }, { status: 500 });
  }
}
