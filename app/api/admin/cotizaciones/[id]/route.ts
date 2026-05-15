import { NextRequest, NextResponse } from 'next/server';
import { getAllQuotes, getSheetsClient } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const COTIZACIONES_SHEET = 'Cotizaciones';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const changes = await req.json();
  const quotes = await getAllQuotes();
  const quote = quotes.find(q => q.id === id);
  if (!quote) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const client = await getSheetsClient();
  if (!client) return NextResponse.json({ error: 'Sin conexión a Sheets' }, { status: 500 });

  const colMap: Record<string, string> = {
    cliente: 'C', telefono: 'D', email: 'E', suite: 'F',
    checkin: 'G', checkout: 'H', noches: 'I', precioTotal: 'J', notas: 'L',
  };

  for (const [key, col] of Object.entries(colMap)) {
    if (key in changes) {
      await client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${COTIZACIONES_SHEET}!${col}${quote.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[String(changes[key])]] },
      });
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotes = await getAllQuotes();
  const quote = quotes.find(q => q.id === id);
  if (!quote) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const client = await getSheetsClient();
  if (!client) return NextResponse.json({ error: 'Sin conexión a Sheets' }, { status: 500 });

  // Get sheetId (numeric) for deleteDimension
  try {
    const meta = await client.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheet = meta.data.sheets?.find(s => s.properties?.title === COTIZACIONES_SHEET);
    const sheetId = sheet?.properties?.sheetId ?? 0;

    await client.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: quote.rowIndex - 1, // 0-indexed
              endIndex: quote.rowIndex,
            },
          },
        }],
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
