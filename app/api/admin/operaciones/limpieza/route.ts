import { NextRequest, NextResponse } from 'next/server';
import { getCleaningToday, saveChecklistResult } from '@/lib/admin/operations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const fecha = req.nextUrl.searchParams.get('fecha') || undefined;
  const results = await getCleaningToday(fecha);
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    await saveChecklistResult(data);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
