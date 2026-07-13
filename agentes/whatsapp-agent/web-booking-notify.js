/**
 * web-booking-notify.js
 * Formatea el aviso al grupo Control Hotel cuando entra una reserva por el motor web
 * (pago con tarjeta). Función PURA, sin dependencias — el envío a WhatsApp lo hace index.js.
 */

export function formatWebBookingAlert(b = {}) {
  const money = (n) => `$${Number(n || 0).toLocaleString('es-MX')} MXN`;
  const rooms = Array.isArray(b.rooms) && b.rooms.length
    ? b.rooms.map(r => `· ${r.name}${r.guestCount ? ` (${r.guestCount} personas)` : ''}`).join('\n')
    : '(ver confirmación)';
  const total = Number(b.total || 0);
  const paid = Number(b.amountPaid ?? 0);
  const pending = (b.pending != null) ? Number(b.pending) : Math.max(0, total - paid);
  const paidLabel = b.isDeposit ? 'Anticipo pagado' : 'Pago completo';
  return (
    `🌐 *NUEVA RESERVA — Página web* ✅\n\n` +
    `👤 *Cliente:* ${b.customerName || 'Sin nombre'}\n` +
    `📱 *Tel:* ${b.customerPhone || '—'}\n` +
    `📧 *Email:* ${b.email || '—'}\n\n` +
    `🧾 *Confirmación:* ${b.confirmationNumber || '—'}\n` +
    `📅 *Check-in:* ${b.checkin || '—'}  |  *Check-out:* ${b.checkout || '—'}\n` +
    `🌙 *Noches:* ${b.nights || '—'}  ·  👥 *Huéspedes:* ${b.guests || '—'}\n\n` +
    `🏨 *Habitaciones:*\n${rooms}\n\n` +
    `💰 *Total:* ${money(total)}\n` +
    `💳 *${paidLabel}:* ${money(paid)}\n` +
    `🧮 *Saldo:* ${money(pending)}\n\n` +
    `_Pago con tarjeta en el motor en línea. 💳_`
  );
}
