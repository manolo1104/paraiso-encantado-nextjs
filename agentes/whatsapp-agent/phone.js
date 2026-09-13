/**
 * phone.js
 * Helpers de números de WhatsApp (copiados tal cual de index.js para poder usarlos
 * y probarlos fuera del cliente de WhatsApp: comprobantes, reservas, avisos).
 *
 * Ojo con los chats @lid: su JID NO trae el número real del cliente, solo un id
 * interno. Por eso se comparan los últimos 10 dígitos contra varios candidatos.
 */

export function digitsOnly(value = '') {
  return String(value ?? '').replace(/\D/g, '');
}

export function extractDigitsFromJid(jid = '') {
  return digitsOnly(String(jid ?? '').split('@')[0] || '');
}

// Normaliza cualquier formato de chatId (@c.us, @lid, número puro) a dígitos@c.us
// para evitar mismatch entre el evento message_create (usa @lid) y message (usa @c.us)
export function normalizeChatId(chatId = '') {
  if (!chatId) return chatId;
  const digits = extractDigitsFromJid(chatId);
  return digits ? `${digits}@c.us` : chatId;
}

export function normalizeMxCandidates(rawNumber = '') {
  const n = digitsOnly(rawNumber);
  if (!n) return [];

  const candidates = new Set([n]);

  // Si viene sin lada país (10 dígitos), considerar 52 y 521
  if (n.length === 10) {
    candidates.add(`52${n}`);
    candidates.add(`521${n}`);
  }

  // Si viene con 52, considerar también 521
  if (n.length === 12 && n.startsWith('52')) {
    candidates.add(`521${n.slice(2)}`);
  }

  // Si viene con 521, considerar también 52
  if (n.length === 13 && n.startsWith('521')) {
    candidates.add(`52${n.slice(3)}`);
  }

  return [...candidates];
}

/** Últimos 10 dígitos ("5214891234567" → "4891234567"); '' si hay menos de 10. */
export function last10(value = '') {
  const d = digitsOnly(value);
  return d.length >= 10 ? d.slice(-10) : '';
}
