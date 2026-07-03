import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, getAgentMetrics } from '@/lib/admin/sheets-admin';
import { getSheetsClient } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const NOTAS_CRM_SHEET = 'NotasCRM';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')?.replace(/\D/g, '') || '';
  const email = req.nextUrl.searchParams.get('email') || '';

  if (!phone && !email) {
    return NextResponse.json({ found: false, notas: '' });
  }

  try {
    // Buscar huésped por email (exacto) o por teléfono. Para el teléfono se exigen
    // al menos 10 dígitos y se comparan los últimos 10 completos: antes bastaba con
    // que coincidieran los últimos 8 (o menos), y una consulta de 4-5 dígitos podía
    // devolver el nombre y las notas privadas de OTRO cliente.
    const phoneDigits = phone.length >= 10 ? phone.slice(-10) : '';
    const bookings = await getAllBookings();
    const match = bookings.find(b => {
      if (email && b.email?.toLowerCase() === email.toLowerCase()) return true;
      const bPhone = b.telefono?.replace(/\D/g, '') || '';
      if (phoneDigits && bPhone.length >= 10 && bPhone.slice(-10) === phoneDigits) return true;
      return false;
    });

    if (!match) {
      return NextResponse.json({ found: false, notas: '' });
    }

    // Get notes from NotasCRM sheet
    const client = await getSheetsClient();
    if (!client) return NextResponse.json({ found: true, notas: '', nombre: match.cliente });

    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${NOTAS_CRM_SHEET}!A:B`,
    });
    const rows = res.data.values || [];
    const noteRow = rows.find(r => r[0]?.toLowerCase() === match.email?.toLowerCase());
    const notas = noteRow ? noteRow[1] || '' : '';

    return NextResponse.json({
      found: true,
      notas,
      nombre: match.cliente,
      email: match.email,
      totalReservas: bookings.filter(b => b.email === match.email && b.estado !== 'CANCELADA').length,
    });
  } catch {
    return NextResponse.json({ found: false, notas: '' });
  }
}
