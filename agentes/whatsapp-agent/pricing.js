/**
 * pricing.js
 * Precios de habitación y montos de una cotización de WhatsApp (total, descuento
 * de grupo, anticipo y saldo). Todo el dinero que ve el cliente sale de aquí,
 * nunca del texto del modelo. Sin I/O ni estado: fácil de probar.
 */

// Reglas del hotel (decisiones de Manolo, 12 sep 2026)
export const GROUP_MIN_ROOMS = 8;        // 8+ habitaciones = grupo
export const GROUP_DEPOSIT = 5000;       // anticipo fijo de grupo (MXN)
export const GROUP_DISCOUNT_RATE = 0.10; // 10% de descuento al hospedaje de grupo

// Calcula precio por noche considerando personas extra (ej. Helechos 5-6 personas).
// Copia exacta de la lógica de claude-handler.js: el bot conserva sus propios precios.
export function getRoomPricePerNight(room, guests) {
  if (!room) return 1900;
  const g = Number(guests || 2);
  if (g <= 2) return room.price_2 || 1900;
  if (g <= 4) return room.price_3_4 || room.price_2 || 1900;
  // 5-6 personas: precio base (4p) + extra_person por cada persona adicional
  const base = room.price_3_4 || room.price_2 || 1900;
  const extra = room.extra_person || 0;
  return base + (g - 4) * extra;
}

/**
 * Montos de una cotización a partir del subtotal de hospedaje.
 *
 * Reglas:
 *  - Descuento: 10% del subtotal si son 8+ habitaciones (redondeado a pesos).
 *  - Anticipo:
 *      · grupo (8+ habitaciones): $5,000 fijos, sin pasar del total   → depositRule 'grupo'
 *      · estancia de 1 noche: el 100% del total                        → depositRule 'una_noche'
 *      · 2+ noches: el 50% del total (redondeado a pesos)              → depositRule '50'
 *  - Saldo = total − anticipo (se paga al llegar al hotel).
 *  Ningún monto sale negativo.
 *
 * @param {{ roomsSubtotal: number, nights: number, roomsCount: number }} input
 * @returns {{ subtotal: number, discount: number, total: number, deposit: number,
 *             saldo: number, depositRule: 'grupo'|'una_noche'|'50' }}
 */
export function computeQuoteAmounts({ roomsSubtotal, nights, roomsCount } = {}) {
  const subtotal = Math.max(0, Math.round(Number(roomsSubtotal) || 0));
  const nightsNum = Number(nights) || 0;
  const count = Number(roomsCount) || 0;
  const isGroup = count >= GROUP_MIN_ROOMS;

  const discount = isGroup ? Math.round(subtotal * GROUP_DISCOUNT_RATE) : 0;
  const total = Math.max(0, subtotal - discount);

  let deposit;
  let depositRule;
  if (isGroup) {
    deposit = Math.min(GROUP_DEPOSIT, total);
    depositRule = 'grupo';
  } else if (nightsNum < 2) {
    deposit = total;
    depositRule = 'una_noche';
  } else {
    deposit = Math.round(total * 0.5);
    depositRule = '50';
  }
  deposit = Math.max(0, Math.min(deposit, total));
  const saldo = Math.max(0, total - deposit);

  return { subtotal, discount, total, deposit, saldo, depositRule };
}
