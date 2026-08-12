import { NextRequest, NextResponse } from 'next/server';
import { createTemporaryBlock, HOLD_MINUTES } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { checkin, checkout, rooms, sessionId } = await req.json();
    if (!checkin || !checkout || !rooms || !sessionId) {
      return NextResponse.json({ error: 'checkin, checkout, rooms y sessionId son requeridos' }, { status: 400 });
    }
    // Ahora devuelve la expiración REAL de la hoja (antes se inventaba una aunque
    // la escritura hubiera fallado en silencio).
    const expiresAt = await createTemporaryBlock(checkin, checkout, rooms, sessionId);
    return NextResponse.json({
      success: Boolean(expiresAt),
      message: expiresAt
        ? `Bloqueo temporal creado (${HOLD_MINUTES} minutos)`
        : 'No se pudo crear el bloqueo temporal',
      expiresAt,
      expiresInSeconds: expiresAt ? HOLD_MINUTES * 60 : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
