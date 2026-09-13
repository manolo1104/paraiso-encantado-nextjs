/**
 * conversation-flow.js
 * Qué hace Camila con una ráfaga de mensajes ya juntada por message-buffer.js.
 *
 * index.js junta los mensajes de un chat (texto, comprobantes, audios) y, cuando el
 * cliente deja de escribir, llama a handleBurst(key, batch). Aquí se decide:
 *   1) si un humano tomó el chat → solo se guarda el historial;
 *   2) si llegó un comprobante → primero el acuse (ya armado por proof-handler.js);
 *   3) si además solo dijo "ya pagué / gracias" → no se llama al modelo;
 *   4) si solo mandó audio/sticker → "solo leo texto, imágenes o PDF";
 *   5) si no → UNA llamada a handleMessage con todo junto y UNA respuesta.
 *
 * Lógica pura: sin whatsapp-web.js ni red. Todo lo que habla con WhatsApp o con el
 * modelo llega por deps, para poder probarlo con dobles.
 *
 * OJO: la key es msg.from (el mismo userId que siempre ha recibido handleMessage),
 * no la normalizada, para no romper historial, sesión ni reservas existentes.
 */

import { isPaymentChatterOnly } from './proof-handler.js';
import { digitsOnly, extractDigitsFromJid } from './phone.js';

export const UNSUPPORTED_MEDIA_TEXT =
  'Por ahora solo puedo leer mensajes de texto, imágenes o PDF de comprobante. Escríbeme tu consulta y con gusto te ayudo. 🌿';

// Lo que queda en el historial cuando llega un comprobante (el modelo no ve el archivo).
export const PROOF_HISTORY_MARKER = '[El cliente envió su comprobante de pago]';

/** Nota interna para el modelo cuando en la misma ráfaga hubo comprobante y otra pregunta. */
export function buildProofContextNote(folio) {
  const cual = folio
    ? `su comprobante de pago del folio ${folio}`
    : 'su comprobante de pago (no hay una cotización activa ligada a este chat)';
  return `[NOTA INTERNA DEL SISTEMA: el cliente acaba de enviar ${cual}; ya se le confirmó la recepción y el equipo lo está verificando. No le pidas pagar de nuevo ni repitas el acuse.]`;
}

// Nombre de archivo suelto ("IMG_2034.jpg", "comprobante.pdf"): WhatsApp lo pone como
// body de un documento sin texto. No es algo que el cliente escribió.
const BARE_FILENAME_RE = /^[^\s/\\]+\.(jpe?g|png|webp|gif|heic|heif|pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|mp4|mov|3gp|opus|ogg|mp3|m4a|aac|wav)$/i;

/** Texto real que acompaña a un archivo ('' si solo es el nombre del archivo). */
export function cleanMediaCaption(caption) {
  const text = String(caption ?? '').trim();
  return BARE_FILENAME_RE.test(text) ? '' : text;
}

/**
 * Dígitos reales de WhatsApp para un aviso (wa.me): número del contacto, luego el
 * del JID si es @c.us, y en chats @lid el waNumber guardado en el folio.
 * Un @lid NO es un número de teléfono, así que nunca se usan sus dígitos.
 */
export function pickWaDigits({ contactNumber, chatId, record } = {}) {
  const fromContact = digitsOnly(contactNumber);
  if (fromContact) return fromContact;
  if (String(chatId || '').endsWith('@c.us')) {
    const fromJid = extractDigitsFromJid(chatId);
    if (fromJid) return fromJid;
  }
  const fromRecord = digitsOnly(record?.waNumber);
  if (fromRecord) return fromRecord;
  if (String(record?.userId || '').endsWith('@c.us')) return extractDigitsFromJid(record.userId);
  return '';
}

/**
 * Montos de una reserva guardada: total, anticipo (lo que se paga para apartar) y
 * saldo al llegar. Usa el saldo guardado; en folios viejos sin saldo, total − anticipo.
 */
export function reservationAmounts(reservation) {
  const r = reservation || {};
  const total = Number(r.totalPrice || 0);
  const deposit = Number(r.depositAmount || r.totalPrice || 0);
  const saved = Number(r.saldo);
  const saldo = (r.saldo != null && r.saldo !== '' && Number.isFinite(saved))
    ? Math.max(0, saved)
    : Math.max(0, total - deposit);
  return { total, deposit, saldo };
}

/**
 * "/confirmar WA-ABC123" → { folio: 'WA-ABC123', force: false }
 * "/reservar wa-abc123 forzar" → { folio: 'WA-ABC123', force: true }
 * Devuelve null si el texto no es uno de esos dos comandos; folio '' si falta.
 */
export function parseConfirmCommand(body) {
  const text = String(body || '').trim();
  if (!/^\/(reservar|confirmar)(\s+|$)/i.test(text)) return null;
  const parts = text.split(/\s+/);
  const folio = (parts[1] || '').replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  const force = parts.length > 2 && /^forzar$/i.test(parts[parts.length - 1]);
  return { folio: folio === 'FORZAR' ? '' : folio, force };
}

/**
 * createBurstHandler(deps) → async handleBurst(key, batch)
 *   deps = {
 *     handleMessage(userId, text, userName, { contactNumber }),
 *     addToHistory(userId, role, content),
 *     checkBotPause(userId) → { paused, justResumed? },
 *     sendReply(meta, text),                  // manda el texto al cliente
 *     afterReply(meta, result, combinedText), // escalación, avisos, follow-ups (index.js)
 *     log                                     // console por defecto
 *   }
 *   batch = el de message-buffer.js: { texts, proofs, unsupported, meta, ... }
 *
 * Devuelve una etiqueta de lo que hizo (útil en pruebas y logs):
 *   'paused' | 'proof_ack_only' | 'unsupported_notice' | 'empty' | 'model'
 * Si el modelo o un envío al cliente fallan, se registra y se relanza (el buffer llama
 * a onError, que avisa al grupo y le pide disculpas al cliente). El error lleva
 * err.burstMeta con el meta de la ráfaga para poder contestarle.
 */
export function createBurstHandler({
  handleMessage,
  addToHistory,
  checkBotPause,
  sendReply,
  afterReply = async () => {},
  log = console,
} = {}) {
  for (const [name, fn] of Object.entries({ handleMessage, addToHistory, checkBotPause, sendReply })) {
    if (typeof fn !== 'function') throw new TypeError(`createBurstHandler: falta ${name}`);
  }

  const say = (level, ...args) => {
    try { (log?.[level] || log?.log)?.call(log, ...args); } catch { /* sin log */ }
  };

  return async function handleBurst(key, batch = {}) {
    const meta = batch?.meta || {};
    const texts = (Array.isArray(batch?.texts) ? batch.texts : [])
      .map(t => String(t ?? '').trim())
      .filter(Boolean);
    const proofs = (Array.isArray(batch?.proofs) ? batch.proofs : []).filter(Boolean);
    const unsupported = Number(batch?.unsupported) || 0;
    const combinedText = texts.join('\n');

    let result;
    try {
      // (a) Un humano tomó la conversación mientras se esperaba: no se contesta,
      // pero se guarda lo que escribió para que Camila tenga contexto al volver.
      const pause = checkBotPause(key) || {};
      if (pause.paused) {
        if (proofs.length) addToHistory(key, 'user', PROOF_HISTORY_MARKER);
        for (const t of texts) addToHistory(key, 'user', t);
        say('log', `⏸️  Ráfaga guardada en historial sin responder (bot pausado): ${key}`);
        return 'paused';
      }

      // (b) Acuse del comprobante ANTES que nada (uno solo aunque lleguen varios archivos).
      // Se prefiere el acuse completo: el corto de un archivo repetido puede entrar antes
      // a la ráfaga porque no espera el aviso al grupo.
      const ackText = (proofs.find(p => p.ackText && !p.duplicate) || proofs.find(p => p.ackText))?.ackText || null;
      if (ackText) {
        await sendReply(meta, ackText);
        addToHistory(key, 'user', PROOF_HISTORY_MARKER);
        addToHistory(key, 'assistant', ackText);
      }

      // (c) Solo habló del pago ("ya pagué", "ahí va", "gracias"): basta con el acuse.
      if (proofs.length && isPaymentChatterOnly(texts)) {
        for (const t of texts) addToHistory(key, 'user', t);
        return 'proof_ack_only';
      }

      // (d) Sin texto: audio, sticker u otro archivo que no se puede leer.
      if (!texts.length) {
        if (unsupported > 0 && !proofs.length) {
          await sendReply(meta, UNSUPPORTED_MEDIA_TEXT);
          return 'unsupported_notice';
        }
        return 'empty';
      }

      if (texts.length > 1) {
        say('log', `⏱️  Mensajes agrupados (${texts.length}): "${combinedText.slice(0, 80)}..."`);
      }

      // (e) Contexto para el modelo: nota de pausa + nota del comprobante + lo que escribió.
      const folio = proofs.find(p => p.folio)?.folio || null;
      const contextBody = [
        meta.resumeNote,
        proofs.length ? buildProofContextNote(folio) : '',
        combinedText,
      ].filter(Boolean).join('\n\n');

      // (f) UNA llamada al modelo y UNA respuesta para toda la ráfaga.
      result = await handleMessage(key, contextBody, meta.userName || '', { contactNumber: meta.contactNumber || '' });
      if (typeof result === 'string') result = { text: result };
      if (result?.text) await sendReply(meta, result.text);
    } catch (err) {
      say('error', `❌ Error procesando la ráfaga de ${key}:`, err);
      const e = err instanceof Error ? err : new Error(String(err));
      if (!e.burstMeta) {
        try { e.burstMeta = meta; } catch { /* objeto congelado */ }
      }
      throw e;
    }

    // Escalación, desayunos, tours, aviso de cotización y follow-ups. La respuesta ya
    // le llegó al cliente: si algo de esto falla se registra, pero NO se le manda la
    // disculpa de "tuve un problemita" encima de una respuesta buena.
    if (result) {
      try {
        await afterReply(meta, result, combinedText);
      } catch (err) {
        say('error', `❌ Error en el post-proceso de la respuesta a ${key}:`, err);
      }
    }
    return 'model';
  };
}
