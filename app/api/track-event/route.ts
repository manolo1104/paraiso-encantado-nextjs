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
    switch (event) {
      // ── Sesión ──
      case 'SESSION_START':
      case 'ver_pagina':
        console.log(`🌐 PAGE_VIEW  ref=${payload.referrer || 'directo'}  q=${payload.query || '-'}  utm_source=${payload.utm_source || '-'}  utm_campaign=${payload.utm_campaign || '-'}  ip=${ip}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'SESSION_END':
      case 'salir_pagina':
        console.log(`🚪 SESSION_END  tiempo=${payload.segundos ?? payload.secondsOnPage ?? '?'}s  path=${payload.path ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'SCROLL_DEPTH_MILESTONE':
        console.log(`📜 SCROLL  depth=${payload.depth ?? '-'}%  path=${payload.path ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'TIME_ON_PAGE_MILESTONE':
        console.log(`⏱  TIME  seconds=${payload.seconds ?? '-'}  path=${payload.path ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;

      // ── Navegación ──
      case 'SECTION_VIEW':
      case 'ver_seccion':
        console.log(`👁  SECTION_VIEW  [${payload.seccion ?? payload.section ?? '-'}]  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'SUITE_VIEW':
        console.log(`🛏  SUITE_VIEW  suite=${payload.suite ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'SUITE_EXIT':
        console.log(`🚶 SUITE_EXIT  suite=${payload.suite ?? '-'}  tiempo=${payload.seconds ?? '-'}s  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'FAQ_EXPAND':
        console.log(`❓ FAQ_EXPAND  pregunta=${payload.question ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'TOUR_LINK_CLICK':
        console.log(`🗺  TOUR_LINK  tour=${payload.tour ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;

      // ── Búsqueda de disponibilidad ──
      case 'DATES_SELECTED':
      case 'seleccionar_fecha':
        console.log(`📅 DATES_SELECTED  checkin=${payload.checkin ?? '-'}  checkout=${payload.checkout ?? '-'}  adults=${payload.adults ?? payload.guests ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'VIEW_AVAILABILITY_CLICK':
        console.log(`🔍 VIEW_AVAILABILITY  checkin=${payload.checkin ?? '-'}  checkout=${payload.checkout ?? '-'}  guests=${payload.guests ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;

      // ── Flujo de reserva ──
      case 'BOOKING_START':
      case 'ir_reservar':
      case 'ir_formulario':
        console.log(`🛒 BOOKING_START  checkin=${payload.checkin ?? '-'}  checkout=${payload.checkout ?? '-'}  guests=${payload.guests ?? '-'}  src=${payload.source ?? '-'}  ip=${ip}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'SUITE_SELECTED':
        console.log(`✅ SUITE_SELECTED  suite=${payload.suite ?? '-'}  guests=${payload.guests ?? '-'}  price=${payload.price ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'CHECKOUT_STEP_COMPLETE':
        console.log(`➡️  CHECKOUT_STEP  step=${payload.step ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'FORM_START':
        console.log(`📝 FORM_START  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'FORM_FIELD_COMPLETE':
        console.log(`✏️  FORM_FIELD  field=${payload.field ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'FORM_ERROR':
        console.log(`⚠️  FORM_ERROR  field=${payload.field ?? '-'}  msg=${payload.message ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'PROMO_CODE_APPLIED':
        console.log(`🏷  PROMO_CODE  code=${payload.code ?? '-'}  discount=${payload.discount ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'PAYMENT_METHOD_SELECTED':
        console.log(`💳 PAYMENT_METHOD  method=${payload.method ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'BOOKING_ATTEMPT':
        console.log(`⏳ BOOKING_ATTEMPT  total=${payload.total ?? '-'}  rooms=${payload.rooms ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'BOOKING_SUCCESS':
        console.log(`🎉 BOOKING_SUCCESS  confirmation=${payload.confirmation ?? '-'}  total=${payload.total ?? '-'}  rooms=${payload.rooms ?? '-'}  checkin=${payload.checkin ?? '-'}  checkout=${payload.checkout ?? '-'}  ip=${ip}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'BOOKING_ERROR':
        console.log(`❌ BOOKING_ERROR  error=${payload.error ?? '-'}  step=${payload.step ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'CART_ABANDON':
        console.log(`🗑  CART_ABANDON  step=${payload.step ?? '-'}  tiempo=${payload.seconds ?? '-'}s  sid=${sessionId?.slice(0, 12)}`);
        break;

      // ── Exit-intent ──
      case 'EXIT_INTENT_TRIGGER':
        console.log(`🚨 EXIT_INTENT  page=${payload.page ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'EXIT_POPUP_CONVERT':
        console.log(`💰 EXIT_CONVERT  email=${payload.email ? payload.email.slice(0, 4) + '***' : '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;

      // ── CTAs & contacto ──
      case 'WHATSAPP_CLICK':
      case 'clic_whatsapp':
        console.log(`💬 WHATSAPP  src=${payload.source ?? '-'}  ip=${ip}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'PHONE_CLICK':
      case 'clic_telefono':
        console.log(`📞 PHONE  num=${payload.number ?? '-'}  src=${payload.source ?? '-'}  ip=${ip}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'STICKY_CTA_CLICK':
        console.log(`📌 STICKY_CTA  label=${payload.label ?? '-'}  src=${payload.source ?? '-'}  sid=${sessionId?.slice(0, 12)}`);
        break;
      case 'GOOGLE_ADS_CLICK':
        console.log(`📣 GOOGLE_ADS  gclid=${payload.gclid ?? '-'}  campaign=${payload.campaign ?? '-'}  ip=${ip}  sid=${sessionId?.slice(0, 12)}`);
        break;

      default:
        console.log(JSON.stringify(logLine));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
