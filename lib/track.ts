let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  if (typeof window === 'undefined') return 'ssr';
  try {
    const key = 'pe_sid';
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(key, sid);
    }
    _sessionId = sid;
    return sid;
  } catch {
    return 'unknown';
  }
}

export function track(event: string, payload: Record<string, unknown> = {}, useBeacon = false): void {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({
    event,
    sessionId: getSessionId(),
    payload: {
      path: window.location.pathname,
      referrer: document.referrer || null,
      ...payload,
    },
  });

  if (useBeacon && navigator.sendBeacon) {
    try {
      navigator.sendBeacon('/api/track-event', new Blob([body], { type: 'application/json' }));
      return;
    } catch (_) {}
  }

  fetch('/api/track-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
