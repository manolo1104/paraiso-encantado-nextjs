import { NextRequest, NextResponse } from 'next/server';

interface AnalyticsEvent {
  event: string;
  data?: Record<string, unknown>;
  sid?: string;
  timestamp?: number;
  path?: string;
}

const EVENT_EMOJI: Record<string, string> = {
  // Navegación
  PAGE_VIEW:               '🌐',
  SESSION_END:             '🚪',
  // Reserva — funnel
  BOOKING_START:           '🛎️',
  DATES_SELECTED:          '📅',
  GUEST_COUNT_CHANGED:     '👥',
  SUITE_SELECTED:          '🏨',
  CHECKOUT_STEP_1:         '1️⃣',
  CHECKOUT_STEP_2:         '2️⃣',
  CHECKOUT_STEP_3:         '3️⃣',
  BOOKING_ATTEMPT:         '💳',
  BOOKING_SUCCESS:         '🎉',
  BOOKING_ERROR:           '❌',
  // Abandono
  CART_ABANDON:            '🛒',
  EXIT_INTENT_TRIGGER:     '👀',
  EXIT_POPUP_SHOWN:        '💬',
  EXIT_POPUP_CONVERT:      '✅',
  // WhatsApp
  WHATSAPP_CLICK:          '📱',
  WHATSAPP_RECOVERY_SHOWN: '💬',
  WHATSAPP_RECOVERY_CLICK: '📲',
  // Suite
  SUITE_ENTER:             '🏡',
  SUITE_EXIT:              '🚶',
  SUITE_GALLERY_VIEW:      '🖼️',
  STICKY_CTA_SHOWN:        '📌',
  STICKY_CTA_CLICK:        '👆',
  // Urgencia
  URGENCY_BAR_VIEW:        '⚡',
  TIMER_STARTED:           '⏱️',
  TIMER_EXPIRED:           '⌛',
  // Scroll & tiempo
  SCROLL_DEPTH_25:         '📜',
  SCROLL_DEPTH_50:         '📖',
  SCROLL_DEPTH_75:         '📗',
  SCROLL_DEPTH_100:        '📚',
  TIME_ON_PAGE_30s:        '⏳',
  TIME_ON_PAGE_60s:        '⏳',
  TIME_ON_PAGE_180s:       '⌛',
  // Forms
  FORM_FIELD_COMPLETE:     '✍️',
  FORM_ERROR:              '⚠️',
  PAYMENT_METHOD_SELECTED: '💰',
  // Contacto
  PHONE_CLICK:             '📞',
  EMAIL_CLICK:             '📧',
  INSTAGRAM_CLICK:         '📸',
  FAQ_EXPAND:              '❓',
};

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

      const emoji = EVENT_EMOJI[event] ?? '🎯';
      const dataStr = data && Object.keys(data).length > 0
        ? ' data=' + JSON.stringify(data)
        : '';
      const pathStr = path ? ` path=${path}` : '';
      const sidStr = sid ? ` sid=${sid}` : '';
      const ipStr = ` ip=${ip}`;

      console.log(`[inf] ${emoji} ${event}${dataStr}${pathStr}${ipStr}${sidStr}`);
    }

    return NextResponse.json({ ok: true, received: events.length });
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
}
