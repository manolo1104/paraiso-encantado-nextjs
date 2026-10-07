// ── Etiquetas de Microsoft Clarity ────────────────────────────────────────
//
// Cuelga de los eventos que el sitio YA mide (lib/track.ts y lib/analytics.ts)
// lo poco que hace útil una grabación. Sin etiquetas, Clarity es un montón de
// vídeos sin forma de encontrar el que importa; con ellas, en el panel se pide
// «sesiones con paso_embudo = 6·pago» y salen justo los que llegaron a pagar
// y no pagaron.
//
// 🔴 A Clarity nunca se le manda nada que identifique al huésped: sólo el paso
// del embudo, el nombre de la suite y el id aleatorio de sesión. El resto del
// payload de cada evento (correos, números de confirmación, importes) se queda
// donde está y no se reenvía.

type FuncionClarity = (...args: unknown[]) => void;
type VentanaConClarity = Window & { clarity?: FuncionClarity };

/**
 * Paso del embudo, con prefijo numérico porque Clarity ordena los valores de
 * una etiqueta alfabéticamente: así el filtro sale en el orden del recorrido
 * y no en el del diccionario.
 *
 * Las claves son los nombres internos que ya existen en el código; conviven
 * los dos sistemas de medición (`track()` y `trackEvent()`), por eso hay
 * parejas que apuntan al mismo paso.
 */
const PASO_EMBUDO: Record<string, string> = {
  ir_reservar: '1·inicio_reserva',
  BOOKING_START: '1·inicio_reserva',
  seleccionar_fecha: '2·fechas',
  DATES_SELECTED: '2·fechas',
  SUITE_SELECTED: '3·suite',
  CHECKOUT_STEP_1: '4·resumen',
  CHECKOUT_STEP_2: '5·datos',
  GUEST_INFO_SUBMITTED: '5·datos',
  CHECKOUT_STEP_3: '6·pago',
  BOOKING_SUCCESS: '7·reservó',
  CART_ABANDON: 'x·abandono',
};

/**
 * Clarity descarta parte de las sesiones cuando hay tráfico. `upgrade` le dice
 * que ésta se guarda sí o sí: son los pasos caros, los que costaría semanas
 * volver a ver si se pierden.
 */
const GRABAR_SIEMPRE = new Set([
  'CHECKOUT_STEP_2',
  'CHECKOUT_STEP_3',
  'CART_ABANDON',
  'BOOKING_SUCCESS',
  'WHATSAPP_PAY_CLICK',
]);

/**
 * Los contactos que valen dinero. Entran como evento de Clarity (filtrable),
 * no como paso: quien escribe por WhatsApp se sale del embudo del motor de
 * reservas, no avanza dentro de él.
 */
const CONTACTOS: Record<string, string> = {
  clic_whatsapp: 'contacto_whatsapp',
  WHATSAPP_CLICK: 'contacto_whatsapp',
  WHATSAPP_PAY_CLICK: 'contacto_whatsapp',
  WHATSAPP_RECOVERY_CLICK: 'contacto_whatsapp',
  clic_telefono: 'contacto_telefono',
};

/**
 * El mismo id de sesión que viaja a /api/track-event, para poder saltar de una
 * línea del log de Railway a su grabación. Los dos sistemas guardan el suyo,
 * así que se intenta primero el de lib/track.ts.
 */
function idSesion(): string | null {
  try {
    return sessionStorage.getItem('pe_sid') || sessionStorage.getItem('pe_session_id');
  } catch {
    return null;
  }
}

export function etiquetarClarity(evento: string, datos: Record<string, unknown> = {}): void {
  try {
    const clarity = (window as unknown as VentanaConClarity).clarity;
    // No cargó (localhost, /admin, navegador interno) o lo tumbó una extensión.
    if (typeof clarity !== 'function') return;

    const sid = idSesion();
    if (sid) clarity('identify', sid);

    const paso = PASO_EMBUDO[evento];
    if (paso) clarity('set', 'paso_embudo', paso);

    const suite = datos.suite;
    if (typeof suite === 'string' && suite) clarity('set', 'suite', suite);

    const contacto = CONTACTOS[evento];
    if (contacto) clarity('event', contacto);

    if (GRABAR_SIEMPRE.has(evento)) clarity('upgrade', evento);
  } catch {
    // Medir nunca puede tumbar la página.
  }
}
