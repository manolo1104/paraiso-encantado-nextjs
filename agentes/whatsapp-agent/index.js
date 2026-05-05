/**
 * index.js — Hotel Paraíso Encantado · Agente WhatsApp
 * ─────────────────────────────────────────────────────
 * Conecta WhatsApp Business via QR y responde mensajes
 * con Claude AI consultando disponibilidad en tiempo real.
 *
 * Uso:
 *   node index.js         ← inicia el agente
 *
 * Primera vez: escanea el QR con el teléfono del hotel.
 * Después el login se guarda y no pide QR de nuevo.
 */

import 'dotenv/config';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import { handleMessage, handlePaymentProof, getStats, addToHistory } from './claude-handler.js';
import { confirmPayment, getByUser } from './reservations.js';
import { appendConfirmedReservationToSheet, updateRoomStatusInDisponibilidad } from './google-sheets.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const escalatedChats = new Set();
const hydratedChats = new Set(); // chatId ya inicializado con historial previo
const sentPriceImageByChat = new Map(); // chatId -> timestamp

// ── Pausa manual del bot (humano tomó la conversación) ────
const pausedChats = new Map(); // chatId → { expiresAt, startedAt }
const HUMAN_TAKEOVER_MS = 60 * 60 * 1000; // 1 hora

// Rastrea respuestas enviadas por el bot para no pausar el chat propio.
// Usamos un contador en lugar de IDs para evitar problemas con formatos
// de JID distintos (@c.us vs @lid) entre eventos message y message_create.
let botReplyInProgress = 0;

// Supresión por chat para evitar falsos positivos en message_create
// cuando el propio bot envía respuestas automáticas.
const recentBotOutgoingByChat = new Map(); // chatId -> expiresAt
const availabilityFollowupTimers = new Map(); // chatId -> { timeoutId, type, scheduledAt }
const lastIncomingAtByChat = new Map(); // chatId -> timestamp último mensaje del huésped

const FOLLOWUP_SCHEDULES = {
  no_availability_found: {
    delay: Number(process.env.FOLLOWUP_NO_AVAILABILITY_MS || (24 * 60 * 60 * 1000)),
    message: ({ name = '' }) => {
      const first = String(name || '').trim().split(/\s+/)[0] || 'hola';
      return `Hola ${first} 👋\n\nAyer buscabas hospedaje y en ese momento no teníamos disponibilidad exacta en tus fechas.\n\nSi gustas, te ayudo a revisar nuevas fechas cercanas disponibles para que puedas reservar. 🌿`;
    }
  },
  inquiry_no_response: {
    delay: Number(process.env.FOLLOWUP_INQUIRY_NO_RESPONSE_MS || (2 * 60 * 60 * 1000)),
    message: ({ name = '' }) => {
      const first = String(name || '').trim().split(/\s+/)[0] || 'hola';
      return `${first}, ¿aún necesitas ayuda con tu reserva? 🤔\n\nSi quieres, reviso disponibilidad o te preparo cotización para otras fechas.`;
    }
  },
  cart_abandoned: {
    delay: Number(process.env.FOLLOWUP_CART_ABANDONED_MS || (1 * 60 * 60 * 1000)),
    message: ({ name = '' }) => {
      const first = String(name || '').trim().split(/\s+/)[0] || 'hola';
      return `${first}, vi que estabas cotizando tu estancia.\n\n¿Te ayudo a finalizar tu reserva? Puedo retomar tu cotización ahora mismo. ✅`;
    }
  }
};

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function clearAvailabilityFollowup(chatId) {
  const active = availabilityFollowupTimers.get(chatId);
  if (!active) return;
  clearTimeout(active.timeoutId);
  availabilityFollowupTimers.delete(chatId);
}

function hasNewMessagesSince(chatId, timestamp) {
  const lastIncoming = lastIncomingAtByChat.get(chatId) || 0;
  return lastIncoming > timestamp;
}

function hasRecentPendingQuote(chatId, maxAgeMs = 24 * 60 * 60 * 1000) {
  const pending = getByUser(chatId);
  if (!pending || pending.status !== 'PENDIENTE_PAGO') return false;
  const createdTs = new Date(pending.createdAt || 0).getTime();
  if (!Number.isFinite(createdTs) || createdTs <= 0) return true;
  return (Date.now() - createdTs) <= maxAgeMs;
}

function looksAvailabilityRequest(userText = '') {
  const text = normalizeText(userText);
  const availabilityIntent =
    text.includes('disponibilidad') ||
    text.includes('disponible') ||
    text.includes('hay habitaciones') ||
    (text.includes('habitacion') && (text.includes('hoy') || text.includes('manana') || text.includes('fecha')));

  const hasDateHint =
    text.includes('hoy') ||
    text.includes('manana') ||
    text.includes('check-in') ||
    text.includes('check in') ||
    text.includes('check-out') ||
    text.includes('check out') ||
    /\b\d{4}-\d{2}-\d{2}\b/.test(text) ||
    /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)/.test(text);

  return availabilityIntent && hasDateHint;
}

function isSpamOrBroadcast(message = '') {
  const text = String(message || '').trim();
  if (!text) return false;

  // Patrones de spam común
  const spamPatterns = [
    // Muchos emojis decorativos
    /✨.*✨/,
    // Palabras clave de terceros
    /TENEMOS DISPONIBILIDAD/i,
    /COMISIONABLE/i,
    /PROMOCIÓN/i,
    /TODO EL DIA/i,
    /OFERTA|OFERTA ESPECIAL/i,
    // Formato típico de broadcast: muchos emojis + contenido largo
    text.length > 500 && /🚙|🎫|✈|🏨|🛏/i.test(text),
    // Patrones de mensaje masivo: formato de lista repetitivo
    /(\d+\.\s+\w+[^\n]*\n){5,}/i
  ];

  return spamPatterns.some(pattern =>
    typeof pattern === 'object' ? pattern.test(text) : pattern
  );
}

function scheduleAvailabilityFollowup(client, chatId, userName = '', type = 'inquiry_no_response') {
  if (!chatId) return;
  const schedule = FOLLOWUP_SCHEDULES[type] || FOLLOWUP_SCHEDULES.inquiry_no_response;
  clearAvailabilityFollowup(chatId);

  const scheduledAt = Date.now();
  const timeoutId = setTimeout(async () => {
    availabilityFollowupTimers.delete(chatId);

    if (hasNewMessagesSince(chatId, scheduledAt)) return;
    if (hasRecentPendingQuote(chatId) && type !== 'cart_abandoned') return;
    if (checkBotPause(chatId).paused) return;

    const reminder = schedule.message({ name: userName });
    try {
      markRecentBotOutgoing(chatId);
      await client.sendMessage(chatId, reminder);
      console.log(`⏰ Follow-up (${type}) enviado a ${chatId}`);
    } catch (err) {
      console.warn(`⚠️ No se pudo enviar follow-up (${type}) a ${chatId}:`, String(err?.message || '').split('\n')[0]);
    }
  }, schedule.delay);

  availabilityFollowupTimers.set(chatId, { timeoutId, type, scheduledAt });
}

function isLidChatId(chatId = '') {
  return String(chatId).includes('@lid');
}

async function safeReply(client, msg, chat, text) {
  if (!text) return;

  try {
    await msg.reply(text);
    return;
  } catch (err) {
    const m = String(err?.message || '');

    // En algunos chats @lid, msg.reply puede fallar por resolución de LID.
    if (m.includes('No LID for user') || m.includes('LID')) {
      try {
        await chat.sendMessage(text);
        return;
      } catch {
        await client.sendMessage(msg.from, text);
        return;
      }
    }

    throw err;
  }
}

function trackBotReply(ms = 5000) {
  botReplyInProgress++;
  setTimeout(() => { botReplyInProgress = Math.max(0, botReplyInProgress - 1); }, ms);
}

function markRecentBotOutgoing(chatId, ms = 20000) {
  if (!chatId) return;
  recentBotOutgoingByChat.set(chatId, Date.now() + ms);
}

function isRecentBotOutgoing(chatId) {
  if (!chatId) return false;
  const expiresAt = recentBotOutgoingByChat.get(chatId);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    recentBotOutgoingByChat.delete(chatId);
    return false;
  }
  return true;
}

function pauseBotForChat(chatId) {
  if (pausedChats.has(chatId)) return; // ya estaba pausado, evitar spam de logs
  const startedAt = Date.now();
  const expiresAt = startedAt + HUMAN_TAKEOVER_MS;
  pausedChats.set(chatId, { expiresAt, startedAt });
  const until = new Date(expiresAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
  console.log(`⏸️  Bot pausado para ${chatId} — humano tomó la conversación hasta las ${until}`);
}

/**
 * Retorna { paused: true } si sigue en pausa,
 * { paused: false } si nunca estuvo,
 * { paused: false, justResumed: true, startedAt, resumedAt } si acaba de expirar.
 */
function checkBotPause(chatId) {
  const info = pausedChats.get(chatId);
  if (!info) return { paused: false };
  if (Date.now() > info.expiresAt) {
    pausedChats.delete(chatId);
    return { paused: false, justResumed: true, startedAt: info.startedAt, resumedAt: Date.now() };
  }
  return { paused: true };
}

// Mantener compatibilidad con código antiguo que usaba isBotPausedForChat
function isBotPausedForChat(chatId) {
  return checkBotPause(chatId).paused;
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_GROUP_PRICE_IMAGE_PATHS = [
  process.env.GROUP_PRICE_IMAGE_PATH,
  path.resolve(__dirname, './PRECIO HOTEL PARAISO ENCANTADO.jpeg'),
  path.resolve(__dirname, '../PRECIO HOTEL PARAISO ENCANTADO.jpeg')
].filter(Boolean);

const DEFAULT_TEMPLATE_PATHS = [
  process.env.EMAIL_TEMPLATE_PATH,
  '/Users/manolocovarrubias/Desktop/backend/email-templates/email-quiet-luxury.html',
  path.resolve(__dirname, '../backend/email-templates/email-quiet-luxury.html'),
  path.resolve(__dirname, './email-templates/email-quiet-luxury.html')
].filter(Boolean);

function digitsOnly(value = '') {
  return String(value).replace(/\D/g, '');
}

function extractDigitsFromJid(jid = '') {
  return digitsOnly(String(jid).split('@')[0] || '');
}

function normalizeMxCandidates(rawNumber = '') {
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

function getAuthorizedHotelNumbers() {
  const combined = [
    process.env.HOTEL_WHATSAPP_NUMBER,
    process.env.HOTEL_AUTH_COMMAND_NUMBERS
  ].filter(Boolean).join(',');

  return combined
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);
}

const BLOCKED_INCOMING_NUMBERS = (() => {
  const configured = (process.env.BLOCKED_WA_NUMBERS || '')
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);

  // Requisito operativo: no responder a +524891007601
  const defaults = ['524891007601'];
  const normalized = [...configured, ...defaults].flatMap(normalizeMxCandidates);
  return new Set(normalized);
})();

const CONTROL_HOTEL_GROUP_NAME = process.env.CONTROL_HOTEL_GROUP_NAME || 'Control Hotel';
const CONTROL_HOTEL_GROUP_ID = process.env.CONTROL_HOTEL_GROUP_ID || '';
const HUMAN_ESCALATION_ALERT_NUMBER = (process.env.HUMAN_ESCALATION_ALERT_NUMBER || '524891007601').replace(/\D/g, '');

function isBlockedIncomingSender(msg) {
  if (!msg || msg.fromMe) return false;
  const senderDigits = extractDigitsFromJid(msg.from);
  if (!senderDigits) return false;
  const variants = normalizeMxCandidates(senderDigits);
  return variants.some(v => BLOCKED_INCOMING_NUMBERS.has(v));
}

function sameMessage(a, b) {
  const aId = a?.id?._serialized || a?.id?.id;
  const bId = b?.id?._serialized || b?.id?.id;
  if (!aId || !bId) return false;
  return aId === bId;
}

async function hydratePreviousConversationIfNeeded(msg, chat) {
  const chatId = msg?.from;
  if (!chatId || hydratedChats.has(chatId)) return;

  // En chats @lid algunos clientes de whatsapp-web.js fallan al leer historial
  // (error interno waitForChatLoading). Evitar reintentos ruidosos.
  if (isLidChatId(chatId)) {
    hydratedChats.add(chatId);
    return;
  }

  const safeLimit = 80;

  try {
    const previousMessages = await chat.fetchMessages({ limit: safeLimit });
    const sorted = [...previousMessages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    let imported = 0;
    for (const m of sorted) {
      if (sameMessage(m, msg)) continue; // evitar duplicar el mensaje actual

      const text = String(m.body || m.caption || '').trim();
      if (!text) continue;

      addToHistory(chatId, m.fromMe ? 'assistant' : 'user', text);
      imported++;
    }

    hydratedChats.add(chatId);
    console.log(`🧠 Historial previo cargado para ${chatId}: ${imported} mensaje(s)`);
  } catch (err) {
    const shortMsg = String(err?.message || 'error desconocido').split('\n')[0];
    console.warn(`⚠️ No se pudo cargar historial previo para ${chatId}: ${shortMsg}`);
    hydratedChats.add(chatId); // evitar repetir warning en cada mensaje
  }
}

function isAuthorizedHotelCommand(msg) {
  // Permitir comandos escritos por la cuenta conectada (chat propio)
  if (msg.fromMe) return true;

  const configuredNumbers = getAuthorizedHotelNumbers();
  if (!configuredNumbers.length) return false;

  const sender = extractDigitsFromJid(msg.from);
  const allowed = configuredNumbers.flatMap(normalizeMxCandidates);
  return allowed.includes(sender);
}

function normalizeUserJid(userId = '') {
  if (!userId) return '';
  if (String(userId).includes('@')) return String(userId);
  const digits = digitsOnly(userId);
  return digits ? `${digits}@c.us` : '';
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatLongDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function buildRoomsRowsHtml(reservation) {
  const roomName = escapeHtml(reservation?.room?.name || 'Suite');
  const nights = Number(reservation?.nights || 1);
  const guests = Number(reservation?.guests || 1);
  const total = Number(reservation?.totalPrice || 0).toLocaleString('es-MX');

  return `
  <table class="rooms-row" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4ddd3; background-color: #faf8f5; margin: 0 0 14px 0;">
    <tr>
      <td style="padding: 18px 22px; vertical-align: top;">
        <p style="margin: 0 0 4px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; color: #2a2218;">${roomName}</p>
        <p style="margin: 0; font-family: 'Jost', 'Helvetica Neue', Arial; font-size: 12px; color: #7f7260;">${nights} noche${nights === 1 ? '' : 's'} · ${guests} huésped${guests === 1 ? '' : 'es'}</p>
      </td>
      <td class="room-price" style="padding: 18px 22px; text-align: right; vertical-align: middle;">
        <p style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; color: #2a2218;">$${total}</p>
      </td>
    </tr>
  </table>`;
}

async function loadEmailTemplate() {
  for (const p of DEFAULT_TEMPLATE_PATHS) {
    try {
      const html = await readFile(p, 'utf-8');
      return html;
    } catch {
      // probar siguiente ruta
    }
  }
  return null;
}

async function loadGroupPriceImageMedia() {
  for (const p of DEFAULT_GROUP_PRICE_IMAGE_PATHS) {
    try {
      return MessageMedia.fromFilePath(p);
    } catch {
      // intentar siguiente ruta
    }
  }
  return null;
}

async function sendReservationConfirmationEmail(reservation, overrideEmail = '') {
  return { sent: false, reason: 'Envío de correo deshabilitado: confirmación solo por WhatsApp.' };
}

async function tagChatForHumanIntervention(client, chat, msg, userName, botText) {
  const chatId = msg.from;
  const alreadyTagged = escalatedChats.has(chatId);
  if (alreadyTagged) return;

  const tagName = 'REQUIERE_INTERVENCION_HUMANA';

  // 1) Intentar etiqueta real de WhatsApp (si hay label ID configurada)
  if (process.env.HUMAN_INTERVENTION_LABEL_ID && typeof chat.changeLabels === 'function') {
    const labelId = Number(process.env.HUMAN_INTERVENTION_LABEL_ID);
    if (!Number.isNaN(labelId)) {
      try {
        await chat.changeLabels([labelId]);
        console.log(`🏷️ Chat etiquetado (${tagName}) para ${chatId}`);
      } catch (err) {
        console.warn('⚠️ No se pudo aplicar label de WhatsApp:', err.message);
      }
    }
  }

  // 2) Aviso interno al equipo del hotel para seguimiento humano
  const preview = (botText || '').slice(0, 220);
  const escalationMessage =
    `🏷️ *${tagName}*\n\n` +
    `Cliente: ${userName || 'Sin nombre'}\n` +
    `WhatsApp: ${chatId.split('@')[0]}\n` +
    `Chat ID: ${chatId}\n\n` +
    `Última respuesta del bot:\n${preview}`;

  const recipients = new Set();
  if (process.env.HOTEL_WHATSAPP_NUMBER) recipients.add(`${process.env.HOTEL_WHATSAPP_NUMBER.replace(/\D/g, '')}@c.us`);
  if (HUMAN_ESCALATION_ALERT_NUMBER) recipients.add(`${HUMAN_ESCALATION_ALERT_NUMBER}@c.us`);

  if (CONTROL_HOTEL_GROUP_ID) {
    recipients.add(CONTROL_HOTEL_GROUP_ID.includes('@g.us') ? CONTROL_HOTEL_GROUP_ID : `${CONTROL_HOTEL_GROUP_ID}@g.us`);
  } else {
    try {
      const chats = await client.getChats();
      const controlGroup = chats.find(c => c.isGroup && (c.name || '').trim().toLowerCase() === CONTROL_HOTEL_GROUP_NAME.trim().toLowerCase());
      if (controlGroup?.id?._serialized) {
        recipients.add(controlGroup.id._serialized);
      }
    } catch (groupErr) {
      console.warn('⚠️ No se pudo resolver grupo Control Hotel:', String(groupErr?.message || '').split('\n')[0]);
    }
  }

  for (const to of recipients) {
    try {
      markRecentBotOutgoing(to);
      await client.sendMessage(to, escalationMessage);
    } catch (sendErr) {
      console.warn(`⚠️ No se pudo enviar aviso de intervención a ${to}:`, String(sendErr?.message || '').split('\n')[0]);
    }
  }

  escalatedChats.add(chatId);
}

// ── Validaciones ──────────────────────────────────────────

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Falta ANTHROPIC_API_KEY en .env');
  process.exit(1);
}

// ── Cliente WhatsApp ──────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'paraiso-hotel' }),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    headless: true
  }
});

// ── Eventos WhatsApp ──────────────────────────────────────

client.on('qr', (qr) => {
  console.log('\n' + '═'.repeat(60));
  console.log('📱  ESCANEA EL QR CON EL TELÉFONO DEL HOTEL:');
  console.log('   (WhatsApp → 3 puntos → Dispositivos vinculados → Vincular dispositivo)');
  console.log('═'.repeat(60) + '\n');
  qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
  process.stdout.write(`\r⏳ Cargando: ${percent}% — ${message}   `);
});

client.on('authenticated', () => {
  console.log('\n✅ WhatsApp autenticado correctamente');
});

client.on('auth_failure', (msg) => {
  console.error('\n❌ Error de autenticación:', msg);
  process.exit(1);
});

client.on('ready', () => {
  console.log('\n' + '═'.repeat(60));
  console.log('🏨  Hotel Paraíso Encantado — Agente WhatsApp ACTIVO');
  console.log('🤖  Claude AI listo para responder mensajes');
  console.log(`📊  API: ${process.env.BOOKING_API_URL || 'https://booking-paraisoencantado.up.railway.app'}`);
  console.log('═'.repeat(60) + '\n');
});

client.on('disconnected', (reason) => {
  console.warn('⚠️  WhatsApp desconectado:', reason);
  console.log('🔄  Reconectando en 5 segundos...');
  setTimeout(() => client.initialize(), 5000);
});

// ── Lógica del comando /reservar ────────────────────────

async function processConfirmarCommand(msg) {
  const body = (msg.body || '').trim();
  if (!/^\/(reservar|confirmar)\s+/i.test(body)) return false;

  const parts = body.split(/\s+/);
  const folio = (parts[1] || '').replace(/[^A-Za-z0-9-]/g, '').toUpperCase();

  if (!folio) {
    await msg.reply('Uso: /reservar FOLIO (también puedes usar /confirmar FOLIO)');
    return true;
  }

  try {
    const reservation = confirmPayment(folio);
    if (!reservation) {
      await msg.reply(`❌ No encontré una reserva con folio *${folio}*.`);
      return true;
    }

    let sheetResult = null;
    try {
      sheetResult = await appendConfirmedReservationToSheet(reservation);
      if (sheetResult?.alreadyExists) {
        console.log(`ℹ️ Reserva ${folio} ya estaba registrada en Google Sheets.`);
      } else {
        console.log(`✅ Reserva ${folio} registrada en Google Sheets (${sheetResult?.updatedRange || 'sin rango'}).`);
      }
    } catch (sheetErr) {
      console.error(`❌ No se pudo registrar reserva ${folio} en Google Sheets:`, sheetErr.message);
    }

    // Actualizar estado en pestaña Disponibilidad: BLOQUEADO TEMPORAL → RESERVADO
    try {
      const dispResult = await updateRoomStatusInDisponibilidad(folio, 'RESERVADO');
      if (dispResult.success) {
        console.log(`🔒 Disponibilidad actualizada a RESERVADO: ${folio} (filas ${dispResult.updatedRows?.join(', ')})`);
      } else {
        console.warn(`⚠️ No se actualizó Disponibilidad para ${folio}: ${dispResult.reason}`);
      }
    } catch (dispErr) {
      console.error(`❌ Error actualizando Disponibilidad para ${folio}:`, dispErr.message);
    }

    const destination = normalizeUserJid(reservation.userId);
    const guestFirstName = (reservation.guestName || reservation.userName || '').split(' ')[0];
    const paidAmount = Number(reservation.depositAmount || reservation.totalPrice);
    const pendingAmount = Math.max(0, Number(reservation.totalPrice) - paidAmount);
    const toursSection = Array.isArray(reservation.tours) && reservation.tours.length > 0
      ? `\n🌊 *Tours:*\n${reservation.tours.map(t => `· ${t?.name || 'Tour'}${t?.participants ? ` (${t.participants} persona${Number(t.participants) === 1 ? '' : 's'})` : ''}`).join('\n')}\n`
      : '';
    const roomsTotal = Number(reservation.roomsTotal ?? reservation.totalPrice ?? 0);
    const toursTotal = Number(reservation.toursTotal ?? 0);
    const confirmationText =
      `🌟 *¡Tu reserva ha sido confirmada!* 🌟\n` +
      `¡Gracias por tu preferencia!\n\n` +
      `Hola ${guestFirstName}, esperamos que tu estancia en Hotel Paraíso Encantado sea amena, que disfrutes de nuestras instalaciones y goces de la mágica aventura en la Huasteca Potosina. ✨\n\n` +
      `🧾 *Folio de reserva:* ${reservation.folio}\n\n` +
      `📅 *Fechas:*\n` +
      `Check-in: ${formatLongDate(reservation.checkin)}\n` +
      `Check-out: ${formatLongDate(reservation.checkout)}\n\n` +
      `🏠 *Habitación:*\n${(Array.isArray(reservation.rooms) && reservation.rooms.length > 0 ? reservation.rooms : [reservation.room]).map(r => `· ${r?.name || ''}${r?.guests ? ` (${r.guests} huésped${Number(r.guests) === 1 ? '' : 'es'})` : ''}`).join('\n')}\n\n` +
      `${toursSection ? `${toursSection}\n` : ''}` +
      `👤 *Total huéspedes:* ${reservation.guests}\n\n` +
      `🏨 *Hospedaje:* $${roomsTotal.toLocaleString('es-MX')} MXN\n` +
      `${toursTotal > 0 ? `🌊 *Tours:* $${toursTotal.toLocaleString('es-MX')} MXN\n` : ''}` +
      `\n` +
      `💰 *Pago recibido:* $${paidAmount.toLocaleString('es-MX')} MXN\n\n` +
      `🧾 *Pago pendiente:* $${pendingAmount.toLocaleString('es-MX')} MXN${pendingAmount > 0 ? ' — Al llegar al hotel' : ''}\n\n` +
      `📍 *Ubicación:* https://g.co/kgs/gft1pTH\n\n` +
      `🕒 *Check-in:* 3:00 PM | Check-out: 12:00 PM\n\n` +
      `📖 *Información adicional:*\n` +
      `Horario del restaurante de 8:00 am a 8:00 pm (Menú disponible aquí: https://drive.google.com/file/d/1rVR7Wm8UTDBoLXw_A6kji2dT3d1CYEVk/view?usp=sharing), estacionamiento abierto las 24 hrs. Con tu reserva, aceptas nuestro reglamento interno y términos y condiciones. Puedes consultarlo aquí: https://paraisoencantado.com/t%C3%A9rminos-y-condiciones\n\n` +
      `Si necesitas ayuda con algo en específico, ¡háznoslo saber! 😊\n\n` +
      `Nos vemos pronto en Hotel Paraíso Encantado. 🌿🏡`;

    let delivered = false;
    if (destination) {
      try {
        markRecentBotOutgoing(destination);
        await client.sendMessage(destination, confirmationText);
        delivered = true;
        console.log(`✅ Confirmación enviada al huésped: ${destination}`);
      } catch (sendErr) {
        console.error('❌ No se pudo enviar confirmación al huésped:', sendErr.message);
      }
    }

    if (!delivered) {
      await msg.reply(`⚠️ Reserva *${folio}* marcada como confirmada, pero no pude enviar WhatsApp al huésped (${reservation.userId}). Revisa manualmente.`);
    } else {
      if (sheetResult?.alreadyExists) {
        await msg.reply(`✅ Reserva *${folio}* confirmada. Se notificó al huésped por WhatsApp. Ya estaba registrada en Google Sheets.`);
      } else if (sheetResult?.success) {
        await msg.reply(`✅ Reserva *${folio}* confirmada. Se notificó al huésped por WhatsApp y se registró en Google Sheets.`);
      } else {
        await msg.reply(`✅ Reserva *${folio}* confirmada. Se notificó al huésped por WhatsApp. No pude confirmar registro en Google Sheets, revísalo por favor.`);
      }
    }
  } catch (cmdErr) {
    console.error('❌ Error en /reservar:', cmdErr.message);
        await msg.reply(`No pude procesar /reservar ${folio}: ${cmdErr.message}`);
  }
  return true;
}

// ── message_create: captura comandos y mensajes manuales del hotel ──

client.on('message_create', async (msg) => {
  if (!msg.fromMe) return;
  if (!isAuthorizedHotelCommand(msg)) return;

  const handled = await processConfirmarCommand(msg);

  // Si no fue un comando, verificar que sea un mensaje real enviado (con texto o media)
  // — ignorar eventos internos de WhatsApp sin contenido (apertura de chat, notificaciones, etc.)
  if (!handled) {
    const hasRealContent = Boolean(msg.body?.trim()) || Boolean(msg.hasMedia);
    if (!hasRealContent) return;

    const recipientId = msg.to || msg.id?.remote;
    if (recipientId && !String(recipientId).includes('@g.us')) {
      // Evitar pausar por mensajes automáticos que acaba de enviar el bot
      // (p.ej. respuesta a una consulta del cliente)
      if (isRecentBotOutgoing(recipientId)) return;

      // Ignorar si fue el propio bot quien envió este mensaje
      if (botReplyInProgress > 0) return;
      pauseBotForChat(recipientId);
      // Registrar la respuesta humana en el historial para que el bot
      // tenga contexto cuando retome la conversación después de 1 hora
      if (msg.body?.trim()) {
        addToHistory(recipientId, 'assistant', msg.body.trim());
        console.log(`📝 Respuesta humana registrada en historial: ${recipientId}`);
      }
    }
  }
});

// ── Manejo de mensajes entrantes ──────────────────────────

client.on('message', async (msg) => {
  lastIncomingAtByChat.set(msg.from, Date.now());

  // Ignorar totalmente mensajes del número bloqueado
  if (isBlockedIncomingSender(msg)) {
    console.log(`🚫 Mensaje ignorado (número bloqueado): ${msg.from}`);
    return;
  }

  // Comando interno del equipo (desde otro número autorizado, no fromMe)
  if (!msg.fromMe && isAuthorizedHotelCommand(msg)) {
    const handled = await processConfirmarCommand(msg);
    if (handled) return;
  }

  // Ignorar mensajes propios, estados y mensajes de grupos
  if (msg.fromMe) return;
  if (msg.isStatus) return;

  // Detectar y descartar spam/broadcasts de terceros
  if (isSpamOrBroadcast(msg.body)) {
    console.log(`🚫 Spam detectado y ignorado: ${msg.from}`);
    return;
  }

  // Grupos: solo responder si mencionan al bot (@)
  // Para activar en grupos, cambia esto a: if (msg.hasMedia) return;
  const chat = await msg.getChat();
  if (chat.isGroup) return; // Solo chats individuales por ahora

  // Primer mensaje del chat en esta sesión: recuperar historial previo
  await hydratePreviousConversationIfNeeded(msg, chat);

  // Si un humano del hotel tomó la conversación, el bot no responde durante 1 hora
  // pero sigue rastreando mensajes para tener contexto al retomar
  const pauseStatus = checkBotPause(msg.from);
  if (pauseStatus.paused) {
    if (msg.body?.trim()) {
      addToHistory(msg.from, 'user', msg.body.trim());
    }
    console.log(`⏸️  Mensaje guardado en historial (bot pausado): ${msg.from}`);
    return;
  }

  const contact = await msg.getContact();
  const userName = contact.pushname || contact.name || '';

  // Si el bot acaba de retomar la conversación tras intervención humana,
  // agregar nota de contexto para que Claude sepa lo que ocurrió
  let contextualBody = msg.body;
  if (pauseStatus.justResumed) {
    const fmtTime = (ts) => new Date(ts).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City'
    });
    const nota = `[NOTA INTERNA DEL SISTEMA: El equipo del hotel atendió personalmente esta conversación de ${fmtTime(pauseStatus.startedAt)} a ${fmtTime(pauseStatus.resumedAt)}. El historial completo está disponible arriba. Retoma la conversación con naturalidad, sin mencionar esta nota.]`;
    contextualBody = `${nota}\n\n${msg.body}`;
    console.log(`▶️  Bot retomando conversación con contexto para ${msg.from}`);
  }

  // Detectar imagen como comprobante de pago
  if (msg.hasMedia && !msg.body?.trim()) {
    const mediaData = await msg.downloadMedia().catch(() => null);
    if (mediaData && mediaData.mimetype?.startsWith('image/')) {
      const result = await handlePaymentProof(msg.from, userName, msg.caption || '');
      trackBotReply();
      markRecentBotOutgoing(msg.from);
      await safeReply(client, msg, chat, result.message);

      // Si tiene reserva pendiente, reenviar comprobante al número del hotel para verificación
      if (result.hasPendingReservation && process.env.HOTEL_WHATSAPP_NUMBER) {
        const hotelNumber = process.env.HOTEL_WHATSAPP_NUMBER + '@c.us';
        const r = result.reservation;
        const toursInline = Array.isArray(r.tours) && r.tours.length > 0
          ? `\n*Tours:*\n${r.tours.map(t => `· ${t?.name || 'Tour'} (${t?.participants || 1} persona${Number(t?.participants || 1) === 1 ? '' : 's'})`).join('\n')}\n`
          : '';
        markRecentBotOutgoing(hotelNumber);
        await client.sendMessage(hotelNumber,
          `🔔 *Comprobante de pago recibido*\n\n*Folio:* ${r.folio}\n*Huésped:* ${r.userName} (${r.userId.split('@')[0]})\n*Habitaciones:* ${(Array.isArray(r.rooms) && r.rooms.length > 0 ? r.rooms : [r.room]).map(x => x?.name || 'Suite').join(', ')}\n${toursInline}*Check-in:* ${r.checkin} | *Check-out:* ${r.checkout}\n*Huéspedes:* ${r.guests}\n*Total global:* $${r.totalPrice.toLocaleString('es-MX')} MXN\n\nVerifica el pago y confirma la reserva.`
        );
        // Reenviar la imagen al equipo
        markRecentBotOutgoing(hotelNumber);
        try {
          await client.sendMessage(hotelNumber, mediaData);
        } catch (fwdErr) {
          console.warn('⚠️ No se pudo reenviar imagen al equipo:', String(fwdErr?.message || '').split('\n')[0]);
        }
      }
    } else {
      trackBotReply();
      markRecentBotOutgoing(msg.from);
      await safeReply(client, msg, chat, 'Hola 👋 Solo puedo leer mensajes de texto o imágenes de comprobante. Escríbeme tu consulta y con gusto te ayudo. 🌿');
    }
    return;
  }

  // Ignorar mensajes sin texto (audios, stickers, documentos, etc.)
  if (!msg.body || !msg.body.trim()) return;

  console.log(`\n📩 [${new Date().toLocaleTimeString('es-MX')}] ${userName || msg.from}: ${msg.body}`);

  // Indicador de "escribiendo..."
  await chat.sendStateTyping();

  try {
    const result = await handleMessage(msg.from, contextualBody, userName);
    const responseText = typeof result === 'string' ? result : result?.text;
    const requiresHumanIntervention = typeof result === 'object' && result?.requiresHumanIntervention;

    if (responseText) {
      trackBotReply();
      markRecentBotOutgoing(msg.from);
      await safeReply(client, msg, chat, responseText);

      const bodyNorm = normalizeText(msg.body || '');
      const responseNorm = normalizeText(responseText || '');
      const looksGroupConversation =
        bodyNorm.includes('grupo') ||
        bodyNorm.includes('personas') ||
        bodyNorm.includes('habitaciones');
      const looksAvailabilityReply = responseNorm.includes('disponibilidad') || responseNorm.includes('disponible');
      const lastSentImageAt = sentPriceImageByChat.get(msg.from) || 0;

      if (looksGroupConversation && looksAvailabilityReply && (Date.now() - lastSentImageAt > 6 * 60 * 60 * 1000)) {
        const priceImage = await loadGroupPriceImageMedia();
        if (priceImage) {
          try {
            markRecentBotOutgoing(msg.from);
            await client.sendMessage(msg.from, priceImage, { caption: '📎 Catálogo de precios del hotel para grupos.' });
            sentPriceImageByChat.set(msg.from, Date.now());
          } catch (imgErr) {
            console.warn('⚠️ No se pudo enviar imagen de precios para grupos:', String(imgErr?.message || '').split('\n')[0]);
          }
        }
      }

      if (requiresHumanIntervention) {
        await tagChatForHumanIntervention(client, chat, msg, userName, responseText);
      }
    }

    const textNorm = normalizeText(String(responseText || ''));
    const quoteWasGenerated = /\bWA-[A-Z0-9]{4,}\b/i.test(String(responseText || '')) || hasRecentPendingQuote(msg.from);
    const noAvailabilityFound =
      textNorm.includes('no hay disponibilidad') ||
      textNorm.includes('no tenemos disponibilidad') ||
      textNorm.includes('sin disponibilidad');

    if (quoteWasGenerated) {
      scheduleAvailabilityFollowup(client, msg.from, userName, 'cart_abandoned');
    } else if (noAvailabilityFound) {
      scheduleAvailabilityFollowup(client, msg.from, userName, 'no_availability_found');
    } else if (looksAvailabilityRequest(msg.body || '')) {
      scheduleAvailabilityFollowup(client, msg.from, userName, 'inquiry_no_response');
    }
  } catch (err) {
    console.error('❌ Error procesando mensaje:', err.message);
    trackBotReply();
    markRecentBotOutgoing(msg.from);
    await safeReply(client, msg, chat, 'Lo siento, ocurrió un error. Por favor intenta de nuevo o comunícate directamente con el hotel. 🙏');
  }
});

// ── Comando de estadísticas cada hora ────────────────────

setInterval(() => {
  const stats = getStats();
  if (stats.active_conversations > 0) {
    console.log(`\n📊 [${new Date().toLocaleTimeString('es-MX')}] Conversaciones activas: ${stats.active_conversations}`);
  }
}, 60 * 60 * 1000);

// ── Iniciar ───────────────────────────────────────────────

console.log('\n🚀 Iniciando Agente WhatsApp — Hotel Paraíso Encantado...');
client.initialize();
