// ============================================================
// Configuración global del sitio
// ============================================================

/** Tasa de cambio MXN → USD. Actualizar según necesidad. */
export const EXCHANGE_RATE = 17.5;

/** Convierte pesos MXN a dólares USD redondeados. */
export function mxnToUsd(mxn: number): number {
  return Math.round(mxn / EXCHANGE_RATE);
}

export const BOOKING_URL = '/reservar';
export const WHATSAPP_URL = 'https://wa.me/524891007679';
export const WHATSAPP_TEXT_RESERVA = 'Hola,%20me%20gustar%C3%ADa%20hacer%20una%20reservaci%C3%B3n';
