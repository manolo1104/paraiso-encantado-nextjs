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

export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

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
