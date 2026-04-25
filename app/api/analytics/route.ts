import { NextRequest, NextResponse } from 'next/server';

interface AnalyticsEvent {
  event: string;
  data?: Record<string, unknown>;
  sid?: string;
  timestamp?: number;
  path?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { events?: AnalyticsEvent[] };
    const events = body.events ?? [];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: true, received: 0 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    for (const ev of events) {
      const { event, data, sid, path } = ev;
      if (!event || typeof event !== 'string') continue;

      const dataStr = data && Object.keys(data).length > 0
        ? ' data=' + JSON.stringify(data)
        : '';
      const pathStr = path ? ` path=${path}` : '';
      const sidStr = sid ? ` sid=${sid}` : '';
      const ipStr = ` ip=${ip}`;

      console.log(`[inf] 🎯 ${event}${dataStr}${pathStr}${ipStr}${sidStr}`);
    }

    return NextResponse.json({ ok: true, received: events.length });
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
}
