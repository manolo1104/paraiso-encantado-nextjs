// ── Capa de datos de Google Tag Manager (contenedor GTM-N98DFD9V) ─────────
// Forma mínima de la capa de datos. GTM admite cualquier clave dentro del
// objeto, pero `event` es la única que dispara activadores, así que es la
// única obligatoria; el resto va como `unknown` para no abrir un `any` que
// se contagie a todo el proyecto.
type EventoCapaDatos = Record<string, unknown> & { event: string };
type VentanaConCapaDatos = Window & { dataLayer?: EventoCapaDatos[] };

/**
 * Nombre con el que cada evento entra a GTM.
 *
 * Se mantiene aparte del nombre interno a propósito: los activadores de
 * Google Ads se arman a mano en la cuenta de GTM con estos nombres, y se
 * romperían en silencio si alguien renombrara un evento aquí en el código.
 * Un evento que no esté en esta tabla entra a GTM con su propio nombre.
 */
const NOMBRE_EN_GTM: Record<string, string> = {
  clic_whatsapp: 'contacto_whatsapp',
  ir_reservar: 'inicio_reserva',
};

/**
 * Empuja el evento a la capa de datos, ADEMÁS del POST al servidor.
 *
 * Es lo único que ve Google Ads: `/api/track-event` solo escribe una línea en
 * el log de Railway, así que sin este push ninguna conversión llega nunca a
 * la cuenta de anuncios (ese fue el motivo de gastar meses de presupuesto a
 * ciegas con una sola conversión registrada).
 */
function empujarACapaDatos(evento: string, datos: Record<string, unknown>): void {
  try {
    const w = window as unknown as VentanaConCapaDatos;
    // GTM crea el arreglo al cargar, pero puede no haber arrancado todavía o
    // venir bloqueado por una extensión: el arreglo propio guarda el evento y
    // GTM lo procesa en cuanto se inicializa.
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      ...datos,
      event: NOMBRE_EN_GTM[evento] || evento,
      evento_interno: evento,
      pagina: window.location.pathname,
    });
  } catch {
    // Medir nunca puede tumbar la página: si la capa de datos no existe o
    // está congelada, el sitio sigue funcionando igual.
  }
}

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

  const datos: Record<string, unknown> = {
    path: window.location.pathname,
    referrer: document.referrer || null,
    ...payload,
  };

  // En paralelo, no en lugar de: el POST alimenta el log de Railway que lee
  // Manolo, y el push alimenta GTM → GA4 → Google Ads.
  empujarACapaDatos(event, datos);

  const body = JSON.stringify({
    event,
    sessionId: getSessionId(),
    payload: datos,
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

/**
 * Los tres eventos que Google Ads debe contar como conversión: clic a
 * WhatsApp (`contacto_whatsapp`), inicio de reserva (`inicio_reserva`) y
 * reserva pagada (`purchase`, que se dispara en /reservar/confirmacion).
 *
 * Existe aparte de `track` por dos motivos concretos:
 * 1. Marca el evento con `conversion: true`, para que en GTM baste un solo
 *    activador si Manolo prefiere no crear uno por nombre.
 * 2. Lo manda con `sendBeacon`, porque estos eventos ocurren justo cuando el
 *    navegador se va de la página (a WhatsApp o al motor de reservas) y un
 *    `fetch` normal se queda a medio camino.
 */
export function trackConversion(nombre: string, datos: Record<string, unknown> = {}): void {
  track(nombre, { ...datos, conversion: true }, true);
}
