import { NextResponse } from 'next/server';
import { getSheetsClient, sheetsCall } from '@/lib/sheets';
import { getAllOTACalendars } from '@/lib/admin/sheets-admin';

// Diagnóstico temporal: muestra qué hay realmente en la hoja OTA_Calendars y qué devuelve la lectura.
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const out: any = {};
  try {
    const client = await getSheetsClient();
    out.clientOk = !!client;
    out.hasSheetId = !!process.env.GOOGLE_SHEET_ID;
    if (!client) return NextResponse.json(out);

    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // 1) Lectura cruda de la hoja
    try {
      const read = await sheetsCall(() =>
        client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'OTA_Calendars!A:H' }),
      );
      const rows = read.data.values || [];
      out.rawRowCount = rows.length;
      out.header = rows[0] || null;
      out.rows = rows.slice(1).map((r: any) => ({
        id: r[0] || '',
        room: r[1] || '',
        platform: r[2] || '',
        urlStart: (r[3] || '').slice(0, 45),
        active: r[4] ?? '',
        status: r[6] || '',
      }));
    } catch (e: any) {
      out.rawReadError = e?.message || String(e);
    }

    // 2) Lo que devuelve la función que usa el panel
    try {
      const all = await getAllOTACalendars();
      out.getAllCount = all.length;
      out.getAll = all.map((c) => ({ room: c.roomName, platform: c.platform, status: c.status }));
    } catch (e: any) {
      out.getAllError = e?.message || String(e);
    }
  } catch (e: any) {
    out.fatal = e?.message || String(e);
  }
  return NextResponse.json(out);
}
