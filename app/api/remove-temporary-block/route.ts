import { NextRequest, NextResponse } from 'next/server';
import { removeTemporaryBlock } from '@/lib/sheets';
import { isAgentRequest } from '@/lib/agent-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId es requerido' }, { status: 400 });
    }
    // Apartados de cotizaciones de WhatsApp (`wa-<folio>`): solo el bot, con token.
    // Sin esto, cualquiera que adivinara un folio podía liberarle la suite al cliente.
    if (String(sessionId).startsWith('wa-') && !isAgentRequest(req)) {
      return NextResponse.json({ error: 'agent_token_required' }, { status: 401 });
    }
    await removeTemporaryBlock(sessionId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
