import { NextRequest, NextResponse } from 'next/server';
import { createTemporaryBlock } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  try {
    const { checkin, checkout, rooms, sessionId } = await req.json();
    if (!checkin || !checkout || !rooms || !sessionId) {
      return NextResponse.json({ error: 'checkin, checkout, rooms y sessionId son requeridos' }, { status: 400 });
    }
    await createTemporaryBlock(checkin, checkout, rooms, sessionId);
    return NextResponse.json({
      success: true,
      message: 'Bloqueo temporal creado (10 minutos)',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
