import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, sessionId, payload = {} } = body;

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const ua = (req.headers.get('user-agent') || 'unknown').slice(0, 100);

    const logLine: Record<string, unknown> = {
      type: 'TRACK',
      event,
      sessionId: sessionId?.slice(0, 20) || null,
      ip,
      ua,
      ts: new Date().toISOString(),
      ...payload,
    };

    // Pretty-print key events so they stand out in Railway logs
    if (event === 'seleccionar_fecha') {
      console.log(`📅 FECHA  checkin=${payload.checkin ?? '-'}  checkout=${payload.checkout ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
    } else if (event === 'ver_seccion') {
      console.log(`👁  SECCIÓN  [${payload.seccion}]  sid=${sessionId?.slice(0, 12)}`);
    } else if (event === 'ver_pagina') {
      console.log(`🌐 VISITA  ref=${payload.referrer || 'directo'}  q=${payload.query || '-'}  ip=${ip}`);
    } else if (event === 'ir_reservar' || event === 'ir_formulario') {
      console.log(`🛒 RESERVAR  checkin=${payload.checkin ?? '-'}  checkout=${payload.checkout ?? '-'}  personas=${payload.guests ?? '-'}  src=${payload.source ?? '-'}  ip=${ip}`);
    } else if (event === 'clic_telefono') {
      console.log(`📞 TELÉFONO  num=${payload.number ?? '-'}  src=${payload.source ?? '-'}  ip=${ip}`);
    } else if (event === 'clic_whatsapp') {
      console.log(`💬 WHATSAPP  src=${payload.source ?? '-'}  ip=${ip}`);
    } else if (event === 'salir_pagina') {
      console.log(`🚪 SALIDA  tiempo=${payload.segundos ?? payload.secondsOnPage ?? '?'}s  path=${payload.path ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
    } else {
      console.log(JSON.stringify(logLine));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
