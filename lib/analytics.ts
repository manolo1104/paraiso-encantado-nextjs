const ENDPOINT = '/api/analytics';
const STORAGE_KEY = 'pe_analytics_queue';
const SESSION_KEY = 'pe_session_id';

export interface AnalyticsEvent {
  event: string;
  data?: Record<string, unknown>;
  sid?: string;
  timestamp?: number;
  path?: string;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function loadPersistedQueue(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function persistQueue(q: AnalyticsEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q.slice(-50)));
  } catch {
    // localStorage unavailable — ignore
  }
}

let memQueue: AnalyticsEvent[] = [];
let flushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (flushing || memQueue.length === 0) return;
  flushing = true;
  const batch = [...memQueue];
  memQueue = [];

  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });

    // Drain any persisted events from previous sessions
    const persisted = loadPersistedQueue();
    if (persisted.length > 0) {
      persistQueue([]);
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: persisted }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Network unavailable — persist for next session
    const persisted = loadPersistedQueue();
    persistQueue([...persisted, ...batch]);
  } finally {
    flushing = false;
  }
}

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 300);
}

/**
 * Eventos de este sistema que Google Ads debe contar como conversión, y el
 * nombre con el que entran a GTM.
 *
 * Los WHATSAPP_CLICK de /reservar son los de mayor intención de todo el sitio:
 * los dispara quien ya buscó fechas y no encontró lugar, o vio disponibilidad
 * incompleta. Comparten nombre en GTM con el botón flotante para que una sola
 * conversión («Contacto WhatsApp») los cuente todos.
 */
const NOMBRE_EN_GTM: Record<string, string> = {
  WHATSAPP_CLICK: 'contacto_whatsapp',
  WHATSAPP_PAY_CLICK: 'contacto_whatsapp',
  WHATSAPP_RECOVERY_CLICK: 'contacto_whatsapp',
  BOOKING_START: 'inicio_reserva',
};

/**
 * Empuja el evento a la capa de datos de GTM, además de encolarlo para
 * /api/analytics.
 *
 * Sin esto, ninguno de estos eventos sale nunca del log de Railway: la cola de
 * este archivo POSTea a un endpoint propio que solo hace console.log, así que
 * Google Ads no veía ni un solo contacto por WhatsApp.
 */
function empujarACapaDatos(event: string, data?: Record<string, unknown>): void {
  const nombre = NOMBRE_EN_GTM[event];
  if (!nombre) return; // Solo los que son conversión: el resto ensucia GTM.
  try {
    const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      ...(data ?? {}),
      event: nombre,
      evento_interno: event,
      pagina: window.location.pathname,
    });
  } catch {
    // Medir nunca puede tumbar la página.
  }
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  empujarACapaDatos(event, data);

  memQueue.push({
    event,
    data: data ?? {},
    sid: getSessionId(),
    timestamp: Date.now(),
    path: window.location.pathname,
  });

  scheduleFlush();
}

export function trackPageView(path?: string) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  trackEvent('PAGE_VIEW', {
    path: path ?? window.location.pathname,
    referrer: document.referrer || undefined,
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
  });
}

export function trackBookingEvent(step: string, data?: Record<string, unknown>) {
  trackEvent(step, data);
}

export function trackEngagement(type: string, data?: Record<string, unknown>) {
  trackEvent(type, data);
}

export function flushQueue() {
  flush();
}

// Flush on page hide / unload so we don't lose events on navigation
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', () => flush(), { capture: true });
}
