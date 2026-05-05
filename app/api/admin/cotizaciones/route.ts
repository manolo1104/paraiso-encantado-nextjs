import { NextRequest, NextResponse } from 'next/server';
import { getAllQuotes, createQuote } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const quotes = await getAllQuotes();
  return NextResponse.json(quotes);
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const id = await createQuote(data);
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
