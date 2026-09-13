import { NextRequest, NextResponse } from 'next/server';
import {
  createTemporaryBlock, renewTemporaryBlock, HOLD_MINUTES, WA_HOLD_MINUTES,
} from '@/lib/sheets';
import { isAgentRequest } from '@/lib/agent-auth';

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

    // Apartados de cotizaciones de WhatsApp (`wa-<folio>`): solo el bot, con token.
    // Sin esto, cualquiera podía liberar o acortar a 10 min el apartado de 3 h.
    if (sessionId.startsWith('wa-')) {
      if (!isAgentRequest(req)) {
        return NextResponse.json({ error: 'agent_token_required' }, { status: 401 });
      }
      // Misma regla que create-temporary-block para `wa-`: 3 h y sin encimarse
      // sobre el apartado vigente de otra sesión.
      const { expiresAt, conflicts = [] } = await createTemporaryBlock(
        checkin || '', checkout || '', rooms, sessionId,
        { holdMinutes: WA_HOLD_MINUTES, failOnConflict: true },
      );
      return NextResponse.json({
        success: conflicts.length === 0,
        expiresAt,
        holdMinutes: WA_HOLD_MINUTES,
        expiresInSeconds: expiresAt ? WA_HOLD_MINUTES * 60 : null,
        conflicts,
      });
    }

    const expiresAt = await renewTemporaryBlock(checkin || '', checkout || '', rooms, sessionId);
    // `expiresInSeconds` es la fuente de verdad para el cronómetro del huésped:
    // una hora absoluta se comparaba contra el reloj del celular, y un reloj
    // adelantado hacía que el apartado naciera ya "expirado".
    return NextResponse.json({
      success: true,
      expiresAt,
      expiresInSeconds: expiresAt ? HOLD_MINUTES * 60 : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
