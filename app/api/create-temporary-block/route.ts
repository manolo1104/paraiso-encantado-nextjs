import { NextRequest, NextResponse } from 'next/server';
import {
  createTemporaryBlock, HOLD_MINUTES, WA_HOLD_MINUTES, type HoldSegment,
} from '@/lib/sheets';
import { isAgentRequest } from '@/lib/agent-auth';

export const dynamic = 'force-dynamic';

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SEGMENTS = 13;
const MAX_ROOMS = 13;
const MAX_NIGHTS = 60;

/** Noches entre dos fechas YYYY-MM-DD (en UTC para no depender del horario). */
function nights(checkin: string, checkout: string): number {
  return Math.round((Date.parse(`${checkout}T00:00:00Z`) - Date.parse(`${checkin}T00:00:00Z`)) / 86_400_000);
}

function isRoomList(rooms: unknown): rooms is (string | { name: string })[] {
  return Array.isArray(rooms) && rooms.length >= 1 && rooms.length <= MAX_ROOMS &&
    rooms.every(r =>
      (typeof r === 'string' && r.trim().length > 0 && r.length <= 80) ||
      (r !== null && typeof r === 'object' && typeof (r as { name?: unknown }).name === 'string' &&
        (r as { name: string }).name.trim().length > 0 && (r as { name: string }).name.length <= 80));
}

/** Valida la forma de `segments`; devuelve los tramos limpios o null si no sirve. */
function parseSegments(raw: unknown): HoldSegment[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_SEGMENTS) return null;
  const out: HoldSegment[] = [];
  for (const seg of raw) {
    if (!seg || typeof seg !== 'object') return null;
    const { checkin, checkout, rooms } = seg as Record<string, unknown>;
    if (typeof checkin !== 'string' || typeof checkout !== 'string') return null;
    if (!YMD.test(checkin) || !YMD.test(checkout)) return null;
    const n = nights(checkin, checkout);
    if (!Number.isFinite(n) || n < 1 || n > MAX_NIGHTS) return null;
    if (!isRoomList(rooms)) return null;
    out.push({ checkin, checkout, rooms });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { checkin, checkout, rooms, sessionId, segments } = await req.json();
    if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 100) {
      return NextResponse.json({ error: 'sessionId es requerido' }, { status: 400 });
    }

    // Las cotizaciones de WhatsApp (`wa-<folio>`) apartan 3 h: solo el bot, con token.
    const agent = isAgentRequest(req);
    const isWa = String(sessionId).startsWith('wa-');
    if (isWa && !agent) {
      return NextResponse.json({ error: 'agent_token_required' }, { status: 401 });
    }

    // `segments` (varios tramos en una sola escritura) solo para el bot.
    let parsedSegments: HoldSegment[] | undefined;
    if (segments !== undefined && segments !== null) {
      if (!agent) {
        return NextResponse.json({ error: 'agent_token_required' }, { status: 401 });
      }
      const parsed = parseSegments(segments);
      if (!parsed) {
        return NextResponse.json({ error: 'segments inválido' }, { status: 400 });
      }
      parsedSegments = parsed;
    }

    // Sin tramos válidos, los campos sueltos siguen siendo obligatorios.
    if (!parsedSegments && (!checkin || !checkout || !Array.isArray(rooms) || rooms.length === 0)) {
      return NextResponse.json({ error: 'checkin, checkout, rooms y sessionId son requeridos' }, { status: 400 });
    }

    const holdMinutes = isWa ? WA_HOLD_MINUTES : HOLD_MINUTES;
    // Devuelve la expiración REAL de la hoja (antes se inventaba una aunque
    // la escritura hubiera fallado en silencio).
    const { expiresAt, conflicts = [] } = await createTemporaryBlock(
      checkin, checkout, rooms, sessionId,
      { holdMinutes, segments: parsedSegments, failOnConflict: isWa },
    );

    let message: string;
    if (expiresAt) message = `Bloqueo temporal creado (${holdMinutes} minutos)`;
    else if (conflicts.length > 0) message = 'No se pudo crear el bloqueo temporal: hay habitaciones apartadas por otra sesión';
    else message = 'No se pudo crear el bloqueo temporal';

    return NextResponse.json({
      success: Boolean(expiresAt),
      message,
      expiresAt,
      holdMinutes,
      expiresInSeconds: expiresAt ? holdMinutes * 60 : null,
      conflicts,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
