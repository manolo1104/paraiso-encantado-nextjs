import { NextRequest, NextResponse } from 'next/server';
import { renewTemporaryBlock } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

// Renueva (o libera, con rooms: []) el apartado temporal de 10 min de una sesión.
// Usado por /reservar para el cronómetro de "suite apartada".
export async function POST(req: NextRequest) {
  try {
    const { checkin, checkout, rooms, sessionId } = await req.json();
    if (typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 100) {
      return NextResponse.json({ error: 'sessionId inválido' }, { status: 400 });
    }
    if (!Array.isArray(rooms) || rooms.length > 13) {
      return NextResponse.json({ error: 'rooms inválido' }, { status: 400 });
    }
    const expiresAt = await renewTemporaryBlock(checkin || '', checkout || '', rooms, sessionId);
    return NextResponse.json({ success: true, expiresAt });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
