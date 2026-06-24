import { NextRequest, NextResponse } from 'next/server';
import { getSheetsClient, sheetsCall } from '@/lib/sheets';

// Repara la hoja OTA_Calendars: elimina filas basura/duplicadas y reescribe el encabezado.
// Uso: abrir /api/admin/canales/repair?confirm=1 (protegido por sesión admin).
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const HEADERS = ['id', 'roomName', 'platform', 'icalUrl', 'active', 'lastSync', 'status', 'blocksFound'];

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('confirm') !== '1') {
    return NextResponse.json({
      info: 'Esto limpiará la hoja OTA_Calendars (quita filas basura/duplicadas y reescribe el encabezado).',
      paraEjecutar: 'Vuelve a abrir esta URL agregando ?confirm=1 al final.',
    });
  }
  try {
    const client = await getSheetsClient();
    if (!client) return NextResponse.json({ error: 'Google Sheets no configurado' }, { status: 500 });
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    const read = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'OTA_Calendars!A:H' }),
    );
    const rows = read.data.values || [];

    // Conservar solo filas de datos válidas (id + habitación + plataforma + url)
    const valid = rows.filter((r: any[]) => r[0] && r[0] !== 'id' && r[1] && r[2] && r[3]);

    // Deduplicar por habitación + plataforma (conserva la última)
    const byKey = new Map<string, any[]>();
    for (const r of valid) {
      byKey.set(`${r[1]}|${r[2]}`, [
        r[0], r[1], r[2], r[3], r[4] ?? 'TRUE', r[5] ?? '', r[6] ?? 'pending', r[7] ?? '0',
      ]);
    }
    const clean = [...byKey.values()];

    // Borrar todo y reescribir encabezado + filas limpias
    await sheetsCall(() =>
      client.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: 'OTA_Calendars!A:H' }),
    );
    await sheetsCall(() =>
      client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'OTA_Calendars!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [HEADERS, ...clean] },
      }),
    );

    return NextResponse.json({
      ok: true,
      filasAntes: rows.length,
      conservadas: clean.length,
      entradas: clean.map(r => `${r[1]} / ${r[2]}`),
    });
  } catch (e: any) {
    console.error('repair OTA_Calendars error:', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
