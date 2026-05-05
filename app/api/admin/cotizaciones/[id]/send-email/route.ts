import { NextRequest, NextResponse } from 'next/server';
import { getAllQuotes, updateQuoteStatus } from '@/lib/admin/sheets-admin';
import { buildQuoteEmailHtml } from '@/lib/email';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';

  const quotes = await getAllQuotes();
  const quote = quotes.find(q => q.id === id);
  if (!quote) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
  if (!quote.email) return NextResponse.json({ error: 'Sin email en esta cotización' }, { status: 400 });

  const html = buildQuoteEmailHtml({
    customerName: quote.cliente,
    quoteId: quote.id,
    suite: quote.suite,
    checkin: quote.checkin,
    checkout: quote.checkout,
    nights: quote.noches,
    total: quote.precioTotal,
    notas: quote.notas || undefined,
  });

  try {
    await resend.emails.send({
      from: FROM,
      to: quote.email,
      subject: `Tu cotización ${quote.id} — Paraíso Encantado`,
      html,
    });
    await updateQuoteStatus(quote.rowIndex, 'ENVIADA');
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
