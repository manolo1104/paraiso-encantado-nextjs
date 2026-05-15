import { NextRequest, NextResponse } from 'next/server';
import { getSheetsClient, sheetsCall } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const AVAIL_SHEET = 'Disponibilidad';

// Normalise any date string from column A → YYYY-MM-DD
function toISO(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  try {
    const d = new Date(s + (s.length === 10 ? 'T00:00:00' : ''));
    const iso = d.toISOString().split('T')[0];
    return iso === 'Invalid Date' ? null : iso;
  } catch { return null; }
}

// GET — returns Record<room, Record<dateISO, status>>
// status: 'RESERVADO' | 'BLOQUEADO' | 'MANTENIMIENTO'
export async function GET() {
  const client = await getSheetsClient();
  if (!client) return NextResponse.json({});
  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${AVAIL_SHEET}!A:Z` })
    );
    const rows = res.data.values || [];
    if (rows.length < 2) return NextResponse.json({});

    const headers: string[] = rows[0];
    const result: Record<string, Record<string, string>> = {};

    for (let col = 1; col < headers.length; col++) {
      const room = headers[col]?.trim();
      if (!room) continue;
      result[room] = {};

      for (let row = 1; row < rows.length; row++) {
        const dateStr = toISO(rows[row][0] || '');
        if (!dateStr) continue;
        const val = (rows[row][col] || '').toUpperCase().trim();
        if (val && val !== '') result[room][dateStr] = val;
      }
    }

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('GET disponibilidad error:', e.message);
    return NextResponse.json({});
  }
}

// POST { room, date } — manually block a date (sets 'BLOQUEADO')
export async function POST(req: NextRequest) {
  const { room, date } = await req.json();
  if (!room || !date) return NextResponse.json({ error: 'room y date requeridos' }, { status: 400 });
  const err = await setDateStatus(room, date, 'BLOQUEADO');
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// DELETE { room, date } — unblock a manually blocked date (clears cell)
export async function DELETE(req: NextRequest) {
  const { room, date } = await req.json();
  if (!room || !date) return NextResponse.json({ error: 'room y date requeridos' }, { status: 400 });

  const client = await getSheetsClient();
  if (!client) return NextResponse.json({ error: 'Sin conexión Sheets' }, { status: 500 });

  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${AVAIL_SHEET}!A:Z` })
    );
    const rows = res.data.values || [];
    const headers: string[] = rows[0] || [];
    const colIdx = headers.findIndex(h => h?.trim() === room);
    if (colIdx === -1) return NextResponse.json({ error: 'Habitación no encontrada en Disponibilidad' }, { status: 404 });

    for (let r = 1; r < rows.length; r++) {
      const rowDate = toISO(rows[r][0] || '');
      if (rowDate !== date) continue;

      const current = (rows[r][colIdx] || '').toUpperCase().trim();
      // Only clear BLOQUEADO — never clear RESERVADO (that's a real booking)
      if (current !== 'BLOQUEADO') {
        return NextResponse.json({ error: 'Solo se pueden desbloquear fechas bloqueadas manualmente (BLOQUEADO). Las reservas deben cancelarse desde el panel de reservas.' }, { status: 409 });
      }

      const col = String.fromCharCode(65 + colIdx);
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${AVAIL_SHEET}!${col}${r + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['']] },
        })
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Fecha no encontrada en la hoja de disponibilidad' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function setDateStatus(room: string, date: string, status: string): Promise<string | null> {
  const client = await getSheetsClient();
  if (!client) return 'Sin conexión Sheets';

  try {
    const res = await sheetsCall(() =>
      client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${AVAIL_SHEET}!A:Z` })
    );
    const rows = res.data.values || [];
    const headers: string[] = rows[0] || [];
    const colIdx = headers.findIndex(h => h?.trim() === room);
    if (colIdx === -1) return 'Habitación no encontrada en la hoja de Disponibilidad';

    for (let r = 1; r < rows.length; r++) {
      const rowDate = toISO(rows[r][0] || '');
      if (rowDate !== date) continue;

      const col = String.fromCharCode(65 + colIdx);
      await sheetsCall(() =>
        client.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${AVAIL_SHEET}!${col}${r + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[status]] },
        })
      );
      return null; // success
    }

    return 'Fecha no encontrada en la hoja de disponibilidad (la hoja debe tener esa fecha en columna A)';
  } catch (e: any) {
    return e.message;
  }
}
