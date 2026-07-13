/**
 * notify-bot.ts — avisa al bot de WhatsApp (Camila) cuando entra una reserva por el
 * motor web, para que él publique los detalles en el grupo Control Hotel.
 *
 * La web NO puede enviar WhatsApp por sí sola: le pega al endpoint interno del bot
 * (`POST /notify-booking`) autenticado con el token compartido AGENT_API_TOKEN. Es
 * BEST-EFFORT: si el bot está caído o desvinculado, la reserva NO se ve afectada
 * (ya se guardó en Sheets y se envió el email) — solo se omite el aviso al grupo.
 *
 * Config (variables de entorno del sitio):
 *   BOT_NOTIFY_URL   — URL pública del bot, ej. https://wpp-agent-production-5329.up.railway.app
 *   AGENT_API_TOKEN  — mismo token que ya comparten sitio y bot
 */

export interface WebBookingNotification {
  confirmationNumber: string;
  customerName?: string;
  customerPhone?: string;
  email?: string;
  checkin?: string | null;
  checkout?: string | null;
  nights?: number;
  guests?: number;
  rooms?: Array<{ name: string; guestCount?: number }>;
  total?: number;
  amountPaid?: number;
  pending?: number;
  isDeposit?: boolean;
  paymentIntentId?: string;
}

export async function notifyBotOfWebBooking(payload: WebBookingNotification): Promise<void> {
  const base = process.env.BOT_NOTIFY_URL;
  const token = process.env.AGENT_API_TOKEN;
  if (!base || !token) {
    // Sin configurar → no-op silencioso (no rompe nada; solo no avisa al grupo).
    return;
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/notify-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...payload, source: 'web' }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.warn(`⚠️ notify-bot: el bot respondió ${res.status} para ${payload.confirmationNumber}`);
    } else {
      console.log(`📣 notify-bot: aviso de reserva web ${payload.confirmationNumber} enviado al bot`);
    }
  } catch (e: any) {
    // No bloqueante: la reserva ya quedó guardada y el email enviado.
    console.warn('⚠️ notify-bot falló (no bloqueante):', e?.message || e);
  }
}
