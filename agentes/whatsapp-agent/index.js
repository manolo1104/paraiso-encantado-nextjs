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
import { handleMessage, handlePaymentProof, getStats, addToHistory, getConversationSummary } from './claude-handler.js';
import { confirmPayment, getByUser, getByFolio } from './reservations.js';
import { appendConfirmedReservationToSheet, updateRoomStatusInDisponibilidad } from './google-sheets.js';
import { formatWebBookingAlert } from './web-booking-notify.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { rmSync } from 'node:fs';
import QRCode from 'qrcode';

// Borra los "candados" viejos del perfil de Chromium en el disco persistente.
// Si un contenedor anterior no cerró bien (p.ej. al redeploy en Railway), deja
// un SingletonLock que impide arrancar el navegador en el siguiente contenedor:
// "Failed to launch the browser process: Code 21". Esto lo hace auto-recuperable.
function cleanChromiumLocks() {
  const base = process.env.WWEBJS_DATA_PATH || './.wwebjs_auth';
  const sessionDir = path.join(base, 'session-paraiso-hotel');
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort']) {
    try { rmSync(path.join(sessionDir, f), { force: true, recursive: true }); } catch { /* no-op */ }
  }
}

const escalatedChats = new Set();
const hydratedChats = new Set(); // chatId ya inicializado con historial previo
const sentPriceImageByChat = new Map(); // chatId -> timestamp

// ── Debounce: espera a que la persona termine de escribir antes de responder ──
// Si llegan varios mensajes seguidos en menos de MESSAGE_WAIT_MS ms, los agrupa
// en uno solo para que Claude tenga el contexto completo de lo que quiso decir.
const pendingByChat = new Map(); // chatId → { texts: [], timer, chat, lastMsg, userName, contextBody }
const MESSAGE_WAIT_MS = Number(process.env.MESSAGE_DEBOUNCE_MS || 2500); // 2.5 s por defecto

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

  // Frases de agencias/terceros — un cliente real no las usa
  if (/COMISIONABLE/i.test(text)) return true;
  if (/TENEMOS DISPONIBILIDAD/i.test(text)) return true;

  // Gritos de broadcast: SOLO en mayúsculas. Un cliente que escribe
  // "¿tienen alguna promoción?" u "¿sigue la oferta?" NO es spam.
  if (/PROMOCI[ÓO]N|\bOFERTA\b|TODO EL D[ÍI]A/.test(text)) return true;

  // Muchos emojis decorativos solo cuenta como spam en mensajes largos (flyers)
  if (/✨.*✨/.test(text) && text.length > 200) return true;
  if (text.length > 500 && /🚙|🎫|✈|🏨|🛏/i.test(text)) return true;

  // Listas repetitivas tipo mensaje masivo
  if (/(\d+\.\s+\w+[^\n]*\n){5,}/i.test(text)) return true;

  return false;
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
        await (chat ? chat.sendMessage(text) : Promise.reject(new Error('no chat')));
        return;
      } catch {
        await client.sendMessage(msg.from, text);
        return;
      }
    }

    // Último recurso ante CUALQUIER otro fallo de msg.reply (p.ej. el rechazo
    // minificado "r" del store desincronizado): enviar directo por chatId, la
    // vía más robusta. Solo si esto también falla, propagamos el error.
    try {
      await client.sendMessage(msg.from, text);
      return;
    } catch {
      throw err;
    }
  }
}

function trackBotReply(ms = 5000) {
  botReplyInProgress++;
  setTimeout(() => { botReplyInProgress = Math.max(0, botReplyInProgress - 1); }, ms);
}

function markRecentBotOutgoing(chatId, ms = 20000) {
  if (!chatId) return;
  recentBotOutgoingByChat.set(normalizeChatId(chatId), Date.now() + ms);
}

function isRecentBotOutgoing(chatId) {
  if (!chatId) return false;
  const key = normalizeChatId(chatId);
  const expiresAt = recentBotOutgoingByChat.get(key);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    recentBotOutgoingByChat.delete(key);
    return false;
  }
  return true;
}

function pauseBotForChat(chatId) {
  const key = normalizeChatId(chatId);
  if (pausedChats.has(key)) return; // ya estaba pausado, evitar spam de logs
  const startedAt = Date.now();
  const expiresAt = startedAt + HUMAN_TAKEOVER_MS;
  pausedChats.set(key, { expiresAt, startedAt });
  const until = new Date(expiresAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
  console.log(`⏸️  Bot pausado para ${key} — humano tomó la conversación hasta las ${until}`);
}

/**
 * Retorna { paused: true } si sigue en pausa,
 * { paused: false } si nunca estuvo,
 * { paused: false, justResumed: true, startedAt, resumedAt } si acaba de expirar.
 */
function checkBotPause(chatId) {
  const key = normalizeChatId(chatId);
  const info = pausedChats.get(key);
  if (!info) return { paused: false };
  if (Date.now() > info.expiresAt) {
    pausedChats.delete(key);
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

// Normaliza cualquier formato de chatId (@c.us, @lid, número puro) a dígitos@c.us
// para evitar mismatch entre el evento message_create (usa @lid) y message (usa @c.us)
function normalizeChatId(chatId = '') {
  if (!chatId) return chatId;
  const digits = extractDigitsFromJid(chatId);
  return digits ? `${digits}@c.us` : chatId;
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

// Números que SIEMPRE reciben respuesta automática, aunque estén guardados como
// contacto en el teléfono del hotel. Se compara por número normalizado (variantes
// MX 52/521/10-dígitos) para no fallar por el formato del JID (@c.us vs 521…).
const ALWAYS_RESPOND_NUMBERS = (() => {
  const configured = (process.env.ALWAYS_RESPOND_NUMBERS || '')
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);
  const defaults = ['524891251458']; // Manolo — testing del bot
  return new Set([...configured, ...defaults].flatMap(normalizeMxCandidates));
})();

function isAlwaysRespond(jid = '') {
  const variants = normalizeMxCandidates(extractDigitsFromJid(jid));
  return variants.some(v => ALWAYS_RESPOND_NUMBERS.has(v));
}

const CONTROL_HOTEL_GROUP_NAME = process.env.CONTROL_HOTEL_GROUP_NAME || 'Control Hotel';
const CONTROL_HOTEL_GROUP_ID = process.env.CONTROL_HOTEL_GROUP_ID || '';
const HUMAN_ESCALATION_ALERT_NUMBER = (process.env.HUMAN_ESCALATION_ALERT_NUMBER || '524891007601').replace(/\D/g, '');
const TOUR_AGENT_NUMBER = (process.env.TOUR_AGENT_NUMBER || '524891251458').replace(/\D/g, '');
const BREAKFAST_AGENT_NUMBER = (process.env.BREAKFAST_AGENT_NUMBER || '524891255181').replace(/\D/g, '');

// Evitar notificar dos veces por conversación en la misma sesión
const tourNotifiedChats = new Set();
const breakfastNotifiedChats = new Set();

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
  const conversationSummary = getConversationSummary(chatId, 6);
  const escalationMessage =
    `🏷️ *ATENCIÓN HUMANA REQUERIDA*\n\n` +
    `👤 *${userName || 'Sin nombre'}*\n` +
    `📱 ${chatId.split('@')[0]}\n\n` +
    `📋 *Últimos mensajes:*\n${conversationSummary || '(sin historial disponible)'}\n\n` +
    `💬 *Bot respondió:* ${(botText || '').slice(0, 160)}`;

  const recipients = new Set();
  if (process.env.HOTEL_WHATSAPP_NUMBER) recipients.add(`${process.env.HOTEL_WHATSAPP_NUMBER.replace(/\D/g, '')}@c.us`);
  if (HUMAN_ESCALATION_ALERT_NUMBER) recipients.add(`${HUMAN_ESCALATION_ALERT_NUMBER}@c.us`);

  try {
    const gid = await resolveControlHotelGroupJid();
    if (gid) recipients.add(gid);
  } catch (groupErr) {
    console.warn('⚠️ No se pudo resolver grupo Control Hotel:', String(groupErr?.message || '').split('\n')[0]);
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
  // En local guarda la sesión en ./.wwebjs_auth; en Railway en el disco persistente
  // (WWEBJS_DATA_PATH=/data/wwebjs_auth) para no tener que reescanear el QR al actualizar.
  authStrategy: new LocalAuth({ clientId: 'paraiso-hotel', dataPath: process.env.WWEBJS_DATA_PATH || undefined }),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
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

  // /continua +52XXXXXXXXXX — reactivar bot para ese número antes de que expire la hora
  if (/^\/(continua|reanudar|activar)\b/i.test(body)) {
    // Tomar los ÚLTIMOS 10 dígitos del número (funciona con 10 dígitos, 52…, 521… y +52)
    const digitsAll = body.replace(/^\/(continua|reanudar|activar)\b/i, '').replace(/\D/g, '');
    const digits = digitsAll.slice(-10);
    if (digits.length < 10) {
      await msg.reply('Uso: /continua +52XXXXXXXXXX');
      return true;
    }
    // Probar todas las variantes MX (10 dígitos, 52…, 521…) porque las pausas se
    // guardan con la lada del JID y el operador puede escribir solo 10 dígitos.
    const candidateChatIds = normalizeMxCandidates(digits).map(normalizeChatId);
    const foundKey = candidateChatIds.find(c => pausedChats.has(c));
    if (foundKey) {
      pausedChats.delete(foundKey);
      await msg.reply(`▶️ Bot reactivado para ${digits}. El agente retomará la conversación.`);
      console.log(`▶️  Bot reactivado manualmente para ${foundKey}`);
    } else {
      await msg.reply(`ℹ️ El bot no estaba pausado para ${digits}.`);
    }
    return true;
  }

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

    // Notificar al equipo del hotel en Control Hotel cuando la reserva es nueva
    if (!sheetResult?.alreadyExists) {
      const rooms = Array.isArray(reservation.rooms) && reservation.rooms.length > 0
        ? reservation.rooms.map(r => `· ${r?.name || ''}${r?.guests ? ` (${r.guests}p)` : ''}`).join('\n')
        : `· ${reservation.room?.name || '—'}`;
      const pendingTeam = Math.max(0, Number(reservation.totalPrice || 0) - paidAmount);
      const teamAlert =
        `🏨 *Nueva reserva confirmada*\n\n` +
        `👤 *${reservation.guestName || reservation.userName || 'Sin nombre'}*\n` +
        `📱 wa.me/${String(reservation.userId || '').split('@')[0]}\n` +
        `🧾 Folio: ${reservation.folio}\n` +
        `📅 Check-in: ${reservation.checkin}\n` +
        `📅 Check-out: ${reservation.checkout}\n` +
        `👥 Huéspedes: ${reservation.guests}\n` +
        `🛏️ Habitaciones:\n${rooms}\n` +
        `${toursSection}` +
        `💰 Total: $${Number(reservation.totalPrice || 0).toLocaleString('es-MX')} MXN\n` +
        `💳 Anticipo pagado: $${paidAmount.toLocaleString('es-MX')} MXN\n` +
        `🔸 Resta por pagar: $${pendingTeam.toLocaleString('es-MX')} MXN`;

      const sendTeamAlert = async (to) => {
        try {
          markRecentBotOutgoing(to);
          await client.sendMessage(to, teamAlert);
        } catch (e) {
          console.warn(`⚠️ No se pudo enviar alerta de reserva a ${to}:`, String(e?.message || '').split('\n')[0]);
        }
      };

      const groupOkReserva = await sendToControlHotelGroup(teamAlert);
      if (process.env.HOTEL_WHATSAPP_NUMBER) {
        await sendTeamAlert(`${process.env.HOTEL_WHATSAPP_NUMBER.replace(/\D/g, '')}@c.us`);
      }
      console.log(`📣 Alerta de reserva ${reservation.folio} → grupo: ${groupOkReserva ? 'enviada' : 'FALLÓ'} · número del hotel: ${process.env.HOTEL_WHATSAPP_NUMBER ? 'enviada' : 'sin configurar'}`);
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

  // Filtrar mensajes que son IDs internos de WhatsApp (@lid, @c.us) enviados como texto
  // Esto ocurre cuando WhatsApp Web filtra eventos del sistema como mensajes
  if (/^\d{10,25}@(lid|c\.us|g\.us)$/.test((msg.body || '').trim())) {
    console.log(`🚫 Mensaje de sistema ignorado (JID interno): ${msg.body}`);
    return;
  }

  // Detectar y descartar spam/broadcasts de terceros
  if (isSpamOrBroadcast(msg.body)) {
    console.log(`🚫 Spam detectado y ignorado: ${msg.from}`);
    return;
  }

  // Grupos: solo responder si mencionan al bot (@)
  // BLINDAJE @lid: con la migración de WhatsApp a direccionamiento @lid, en los
  // chats de prospectos nuevos msg.getChat()/msg.getContact() a veces revientan
  // con un rechazo minificado ("r") por el store interno desincronizado. Antes
  // eso tumbaba el mensaje ENTERO aquí mismo (antes de poder responder) → el
  // cliente nunca recibía contestación. Ahora si fallan seguimos con defaults
  // seguros (chat individual · contacto desconocido = SÍ responder) para no
  // perder al prospecto; el envío ya tiene su propio fallback en safeReply().
  let chat = null;
  try {
    chat = await msg.getChat();
  } catch (e) {
    console.warn(`⚠️ getChat falló (${String(e?.message || e).split('\n')[0]}) — asumo chat individual: ${msg.from}`);
  }
  if (chat && chat.isGroup) return; // Solo chats individuales por ahora

  // Solo atender números desconocidos (nuevos prospectos)
  // No intervenir en chats con contactos ya guardados en la agenda del teléfono,
  // EXCEPTO los números en ALWAYS_RESPOND_NUMBERS (comparación normalizada).
  let contact = null;
  try {
    contact = await msg.getContact();
  } catch (e) {
    console.warn(`⚠️ getContact falló (${String(e?.message || e).split('\n')[0]}) — asumo desconocido: ${msg.from}`);
  }
  // En chats @lid el JID (msg.from) NO contiene el número real; usamos el número
  // resuelto del contacto para el match de ALWAYS_RESPOND.
  const contactNumber = String(contact?.number || contact?.id?.user || '');
  const alwaysRespond = isAlwaysRespond(msg.from) || isAlwaysRespond(contactNumber);
  console.log(`🔍 DEBUG msg.from = "${msg.from}" | number = "${contactNumber}" | isMyContact = ${contact?.isMyContact} | alwaysRespond = ${alwaysRespond}`);
  if (contact?.isMyContact && !alwaysRespond) {
    // Registrar el mensaje pero no responder automáticamente
    if (msg.body?.trim()) addToHistory(msg.from, 'user', msg.body.trim());
    console.log(`📋 Contacto conocido ${contact.pushname || msg.from} — sin respuesta automática`);
    return;
  }

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
  const userName = contact?.pushname || contact?.name || '';

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
  if (msg.hasMedia) {
    const mediaData = await msg.downloadMedia().catch(() => null);
    const isImage = Boolean(mediaData && mediaData.mimetype?.startsWith('image/'));
    const caption = (msg.body || msg.caption || '').trim();
    const pend = getByUser(msg.from);
    const hasPending = Boolean(pend && pend.status === 'PENDIENTE_PAGO');

    // Imagen sin texto, O imagen con caption pero con reserva pendiente → comprobante de pago.
    // (Antes una imagen con cualquier caption se ignoraba como comprobante.)
    if (isImage && (!caption || hasPending)) {
      const result = await handlePaymentProof(msg.from, userName, caption);
      trackBotReply();
      markRecentBotOutgoing(msg.from);
      await safeReply(client, msg, chat, result.message);

      // Si tiene reserva pendiente, avisar al equipo (número del hotel + grupo Control Hotel)
      if (result.hasPendingReservation) {
        const r = result.reservation;
        const toursInline = Array.isArray(r.tours) && r.tours.length > 0
          ? `\n*Tours:*\n${r.tours.map(t => `· ${t?.name || 'Tour'} (${t?.participants || 1} persona${Number(t?.participants || 1) === 1 ? '' : 's'})`).join('\n')}\n`
          : '';
        const paidProof = Number(r.depositAmount || 0);
        const pendProof = Math.max(0, Number(r.totalPrice || 0) - paidProof);
        const comprobanteAlert =
          `🔔 *Comprobante de pago recibido*\n\n*Folio:* ${r.folio}\n*Huésped:* ${r.userName}\n📱 wa.me/${String(r.userId || '').split('@')[0]}\n*Habitaciones:* ${(Array.isArray(r.rooms) && r.rooms.length > 0 ? r.rooms : [r.room]).map(x => x?.name || 'Suite').join(', ')}\n${toursInline}*Check-in:* ${r.checkin} | *Check-out:* ${r.checkout}\n*Huéspedes:* ${r.guests}\n*Total:* $${Number(r.totalPrice || 0).toLocaleString('es-MX')} MXN\n*Anticipo:* $${paidProof.toLocaleString('es-MX')} MXN | *Resta:* $${pendProof.toLocaleString('es-MX')} MXN\n\nVerifica el pago y confirma con */confirmar ${r.folio}*.`;

        // 1) Número del hotel (verificador): texto + imagen del comprobante
        if (process.env.HOTEL_WHATSAPP_NUMBER) {
          const hotelNumber = process.env.HOTEL_WHATSAPP_NUMBER.replace(/\D/g, '') + '@c.us';
          markRecentBotOutgoing(hotelNumber);
          await client.sendMessage(hotelNumber, comprobanteAlert).catch(() => {});
          markRecentBotOutgoing(hotelNumber);
          try { await client.sendMessage(hotelNumber, mediaData); }
          catch (fwdErr) { console.warn('⚠️ No se pudo reenviar imagen al equipo:', String(fwdErr?.message || '').split('\n')[0]); }
        }

        // 2) Grupo Control Hotel (visibilidad del equipo): solo texto (la imagen no se manda al grupo)
        const groupOkComprobante = await sendToControlHotelGroup(comprobanteAlert);
        if (!groupOkComprobante) console.warn('⚠️ Aviso de comprobante NO llegó al grupo Control Hotel (el número del hotel sí lo recibió aparte)');
      }
      return;
    }

    // Media sin texto que no es imagen (audio, sticker, documento): avisar y salir.
    if (!isImage && !caption) {
      trackBotReply();
      markRecentBotOutgoing(msg.from);
      await safeReply(client, msg, chat, 'Hola 👋 Solo puedo leer mensajes de texto o imágenes de comprobante. Escríbeme tu consulta y con gusto te ayudo. 🌿');
      return;
    }

    // Imagen con caption y sin reserva pendiente (o media con texto): continuar al
    // flujo de texto usando el caption para que Claude responda la consulta.
  }

  // Ignorar mensajes sin texto (audios, stickers, documentos, etc.)
  if (!msg.body || !msg.body.trim()) return;

  console.log(`\n📩 [${new Date().toLocaleTimeString('es-MX')}] ${userName || msg.from}: ${msg.body}`);

  // ── DEBOUNCE: agrupar mensajes seguidos antes de responder ──────────────────
  // Espera MESSAGE_WAIT_MS ms de silencio para tener el mensaje completo.
  // Si llegan varios mensajes rápido (ej. "Hola" + "quiero info" + "de la jungla"),
  // los combina en uno solo antes de enviarlo a Claude.
  const existing = pendingByChat.get(msg.from);
  if (existing) {
    clearTimeout(existing.timer);
    existing.texts.push(msg.body.trim());
    existing.lastMsg = msg;
    existing.contextBody = contextualBody; // preservar nota de contexto del último mensaje
  } else {
    pendingByChat.set(msg.from, {
      texts: [msg.body.trim()],
      lastMsg: msg,
      chat,
      userName,
      contextBody: contextualBody,
      timer: null,
    });
  }

  const pending = pendingByChat.get(msg.from);
  pending.timer = setTimeout(async () => {
    pendingByChat.delete(msg.from);
    const combinedText = pending.texts.join('\n').trim();
    const finalMsg = pending.lastMsg;
    const finalChat = pending.chat;
    const finalContextBody = pending.texts.length > 1
      ? combinedText  // múltiples mensajes → combinados, sin nota de contexto de pausa
      : pending.contextBody; // un solo mensaje → preservar contexto original

    if (pending.texts.length > 1) {
      console.log(`⏱️  Mensajes agrupados (${pending.texts.length}): "${combinedText.slice(0, 80)}..."`);
    }

    // Indicador de "escribiendo..." (finalChat puede ser null si getChat falló en @lid)
    await finalChat?.sendStateTyping?.().catch(() => {});

    try {
      const result = await handleMessage(finalMsg.from, finalContextBody, pending.userName);
      const responseText = typeof result === 'string' ? result : result?.text;
      const requiresHumanIntervention = typeof result === 'object' && result?.requiresHumanIntervention;

      if (responseText) {
        await new Promise(r => setTimeout(r, 1000));
        trackBotReply();
        markRecentBotOutgoing(finalMsg.from);
        await safeReply(client, finalMsg, finalChat, responseText);

        const bodyNorm = normalizeText(combinedText || '');
        const responseNorm = normalizeText(responseText || '');
        const looksGroupConversation =
          bodyNorm.includes('grupo') || bodyNorm.includes('personas') || bodyNorm.includes('habitaciones');
        const looksAvailabilityReply = responseNorm.includes('disponibilidad') || responseNorm.includes('disponible');
        const lastSentImageAt = sentPriceImageByChat.get(finalMsg.from) || 0;

        if (looksGroupConversation && looksAvailabilityReply && (Date.now() - lastSentImageAt > 6 * 60 * 60 * 1000)) {
          const priceImage = await loadGroupPriceImageMedia();
          if (priceImage) {
            try {
              markRecentBotOutgoing(finalMsg.from);
              await client.sendMessage(finalMsg.from, priceImage);
              sentPriceImageByChat.set(finalMsg.from, Date.now());
            } catch (imgErr) {
              console.warn('⚠️ No se pudo enviar imagen de precios:', String(imgErr?.message || '').split('\n')[0]);
            }
          }
        }

        // Escalación a humano
        if (requiresHumanIntervention) {
          await tagChatForHumanIntervention(client, finalChat, finalMsg, pending.userName, responseText);
        }

        // Notificación de desayunos grupales
        const bodyLower = normalizeText(combinedText || '');
        const responseLower = normalizeText(responseText || '');
        const looksBreakfastInterest =
          (bodyLower.includes('desayuno') || bodyLower.includes('desayunos') || bodyLower.includes('breakfast')) &&
          (bodyLower.includes('grupo') || bodyLower.includes('somos') || bodyLower.includes('personas') ||
           responseLower.includes('desayuno') || responseLower.includes('papan'));
        if (looksBreakfastInterest && !breakfastNotifiedChats.has(finalMsg.from)) {
          breakfastNotifiedChats.add(finalMsg.from);
          setTimeout(() => breakfastNotifiedChats.delete(finalMsg.from), 4 * 60 * 60 * 1000);
          try {
            markRecentBotOutgoing(`${BREAKFAST_AGENT_NUMBER}@c.us`);
            await client.sendMessage(`${BREAKFAST_AGENT_NUMBER}@c.us`,
              `🍳 *Grupo interesado en desayunos*\n\n👤 *${pending.userName || 'Sin nombre'}*\n📱 wa.me/${finalMsg.from.split('@')[0]}\n\nEstán preguntando por desayunos grupales en El Papán Huasteco. 🌿`
            );
          } catch (brkErr) {
            console.warn('⚠️ No se pudo notificar al coordinador de desayunos:', String(brkErr?.message || '').split('\n')[0]);
          }
        }

        // Notificación de interés en tours
        const requiresTourNotification = typeof result === 'object' && result?.requiresTourNotification;
        if (requiresTourNotification && !tourNotifiedChats.has(finalMsg.from)) {
          tourNotifiedChats.add(finalMsg.from);
          setTimeout(() => tourNotifiedChats.delete(finalMsg.from), 2 * 60 * 60 * 1000);
          try {
            markRecentBotOutgoing(`${TOUR_AGENT_NUMBER}@c.us`);
            await client.sendMessage(`${TOUR_AGENT_NUMBER}@c.us`,
              `🌊 *Cliente interesado en tours*\n\n👤 *${pending.userName || 'Sin nombre'}*\n📱 wa.me/${finalMsg.from.split('@')[0]}\n\nHablando con el agente del hotel. Puedes tomar la conversación. 🌿`
            );
          } catch (tourErr) {
            console.warn('⚠️ No se pudo notificar al agente de tours:', String(tourErr?.message || '').split('\n')[0]);
          }
        }

        // Follow-ups de disponibilidad y cotización
        const textNorm = normalizeText(String(responseText || ''));
        const noAvailabilityFound =
          textNorm.includes('no hay disponibilidad') ||
          textNorm.includes('no tenemos disponibilidad') ||
          textNorm.includes('sin disponibilidad');

        // ── Aviso al grupo Control Hotel SOLO cuando se creó una cotización REAL ──
        // Señal confiable desde el handler (create_reservation_quote ejecutado con
        // folio nuevo). Ya no se dispara por folios repetidos en el texto (confirmaciones,
        // "mi folio es WA-...", etc.).
        if (result?.quoteCreated && result?.quoteFolio) {
          scheduleAvailabilityFollowup(client, finalMsg.from, pending.userName, 'cart_abandoned');
          const folio = result.quoteFolio;
          // Buscar por folio (robusto ante mismatch @lid/@c.us); respaldo: por usuario
          const pr = getByFolio(folio) || getByUser(finalMsg.from);

          const phoneRaw = finalMsg.from.split('@')[0];
          const clientName = pending.userName || pr?.userName || 'Sin nombre';
          const email = pr?.guestEmail || '—';
          const howFound = pr?.howFound || '—';
          const overallCheckin = pr?.checkin || '—';
          const overallCheckout = pr?.checkout || '—';
          const guestsTotal = pr?.guests
            || (Array.isArray(pr?.rooms) ? pr.rooms.reduce((s, r) => s + Number(r.guests || 0), 0) : '—');

          // Estancia con cambio de suite: alguna habitación tiene fechas propias distintas al rango global
          const prRooms = Array.isArray(pr?.rooms) ? pr.rooms : [];
          const isSplitStay = prRooms.some(r =>
            (r.checkin && r.checkin !== pr?.checkin) || (r.checkout && r.checkout !== pr?.checkout)
          );

          const roomsBlock = prRooms.length
            ? prRooms.map(r => {
                const dateTag = (isSplitStay && r.checkin && r.checkout) ? ` · 📅 ${r.checkin} → ${r.checkout}` : '';
                return `· ${r.name} (${r.guests} personas)${dateTag} — $${Number(r.price).toLocaleString('es-MX')} MXN`;
              }).join('\n')
            : '(ver folio)';

          const toursLine = Array.isArray(pr?.tours) && pr.tours.length
            ? `\n\n🌊 *Tours:*\n${pr.tours.map(t => `· ${t?.name || 'Tour'}${t?.participants ? ` (${t.participants} personas)` : ''}${t?.price ? ` — $${Number(t.price).toLocaleString('es-MX')} MXN` : ''}`).join('\n')}`
            : '';

          const total = Number(pr?.totalPrice || 0);
          const deposit = Number(pr?.depositAmount || 0);
          const saldo = Math.max(0, total - deposit);

          const quoteAlert =
            `📋 *NUEVA COTIZACIÓN — WhatsApp*\n\n` +
            `👤 *Cliente:* ${clientName}\n` +
            `📱 *WhatsApp:* +${phoneRaw} · wa.me/${phoneRaw}\n` +
            `📧 *Email:* ${email}\n` +
            `🔎 *Nos encontró por:* ${howFound}\n\n` +
            `🧾 *Folio:* ${folio}\n` +
            `📅 *Check-in:* ${overallCheckin}  |  *Check-out:* ${overallCheckout}\n` +
            `🌙 *Noches:* ${pr?.nights || '—'}  ·  👥 *Huéspedes:* ${guestsTotal}` +
            (isSplitStay ? `\n⚠️ *Estancia con cambio de suite* (fechas por suite abajo)` : '') +
            `\n\n🏨 *Habitaciones:*\n${roomsBlock}${toursLine}\n\n` +
            `💰 *Total: $${total.toLocaleString('es-MX')} MXN*\n` +
            `💳 *Anticipo: $${deposit.toLocaleString('es-MX')} MXN*\n` +
            `🧮 *Saldo: $${saldo.toLocaleString('es-MX')} MXN*`;

          const groupOk = await sendToControlHotelGroup(quoteAlert);
          if (groupOk) {
            console.log(`📋 Alerta de cotización ${folio} enviada a Control Hotel`);
          } else if (process.env.HOTEL_WHATSAPP_NUMBER) {
            // Fallback: que el equipo se entere aunque el grupo falle.
            const hotelJid = `${process.env.HOTEL_WHATSAPP_NUMBER.replace(/\D/g, '')}@c.us`;
            try {
              markRecentBotOutgoing(hotelJid);
              await client.sendMessage(hotelJid, quoteAlert);
              console.log(`📋 Alerta de cotización ${folio} NO llegó al grupo — enviada al número del hotel (fallback)`);
            } catch (fbErr) {
              console.warn(`⚠️ Alerta de cotización ${folio} no llegó NI al grupo NI al número del hotel:`, String(fbErr?.message || fbErr).split('\n')[0]);
            }
          }
        } else if (hasRecentPendingQuote(finalMsg.from)) {
          // Ya tenía una cotización pendiente de antes y sigue activo: solo recordatorio
          // al cliente (no se vuelve a avisar al grupo).
          scheduleAvailabilityFollowup(client, finalMsg.from, pending.userName, 'cart_abandoned');
        } else if (noAvailabilityFound) {
          scheduleAvailabilityFollowup(client, finalMsg.from, pending.userName, 'no_availability_found');
        } else if (looksAvailabilityRequest(combinedText || '')) {
          scheduleAvailabilityFollowup(client, finalMsg.from, pending.userName, 'inquiry_no_response');
        }
      }
    } catch (err) {
      console.error('❌ Error procesando mensaje:', err);
      try {
        await safeReply(client, finalMsg, finalChat, 'Tuve un problema técnico. Por favor escríbeme de nuevo o contáctanos al *489 100 7679*. 🙏');
      } catch { /* ignore */ }
    }
  }, MESSAGE_WAIT_MS);

  // El bloque try/catch original ya no aplica (movido al callback del debounce)
  // — el código continúa al final del handler sin procesar nada más aquí.
  return; // ← el procesamiento ocurre en el timer de arriba

});


// ── Comando de estadísticas cada hora ────────────────────

setInterval(() => {
  const stats = getStats();
  if (stats.active_conversations > 0) {
    console.log(`\n📊 [${new Date().toLocaleTimeString('es-MX')}] Conversaciones activas: ${stats.active_conversations}`);
  }
}, 60 * 60 * 1000);

// ── Manejo global de errores de Puppeteer/WhatsApp ───────

let isRestarting = false;

async function safeRestart(reason = '') {
  if (isRestarting) return;
  isRestarting = true;
  console.warn(`\n⚠️  ${reason}`);
  console.log('🔄  Reiniciando cliente WhatsApp en 8 segundos...');
  try { await client.destroy(); } catch { /* ignorar errores al destruir */ }
  setTimeout(() => {
    isRestarting = false;
    cleanChromiumLocks();
    client.initialize().catch(e => {
      console.error('❌ Error al reinicializar:', e.message);
      isRestarting = false;
    });
  }, 8000);
}

// Vigilante de "sesión de WhatsApp Web rota": cuando el store interno de
// whatsapp-web.js se desincroniza (típicamente por un cambio de versión de
// WhatsApp Web), la librería lanza una AVALANCHA de rechazos minificados
// (p.ej. "r") que no coinciden con los patrones de Puppeteer de abajo, y en ese
// estado los mensajes de clientes llegan corruptos y el bot deja de responder
// sin caerse. En operación sana estos rechazos NO ocurren nunca, así que si se
// acumulan varios en poco tiempo asumimos sesión rota y reiniciamos el cliente
// solo (antes solo se logueaban y Camila quedaba muda hasta que un humano lo
// notaba y reiniciaba a mano).
// Nota: tras blindar getChat/getContact y safeReply (arriba), esos "r" ya se
// capturan y NO llegan aquí, así que esto es solo una RED DE SEGURIDAD para una
// sesión realmente muerta que gotee rechazos por otras vías. Ventana amplia
// (los "r" llegan al ritmo del tráfico, ~pocos por hora) para no reiniciar por
// transitorios aislados; en operación sana ocurren ~0.
const brokenSessionHits = [];
const BROKEN_WINDOW_MS = 10 * 60 * 1000; // ventana de 10 minutos
const BROKEN_THRESHOLD = 5;              // 5 rechazos no-Puppeteer en la ventana ⇒ reinicio

process.on('unhandledRejection', (reason) => {
  const msg = String(reason?.message || reason || '');
  if (
    msg.includes('Execution context was destroyed') ||
    msg.includes('Navigation') ||
    msg.includes('Protocol error') ||
    msg.includes('Target closed') ||
    msg.includes('Session closed')
  ) {
    safeRestart(`Error de Puppeteer: ${msg.split('\n')[0]}`);
    return;
  }

  console.error('❌ Promesa rechazada no manejada:', msg.split('\n')[0]);

  const now = Date.now();
  brokenSessionHits.push(now);
  while (brokenSessionHits.length && now - brokenSessionHits[0] > BROKEN_WINDOW_MS) {
    brokenSessionHits.shift();
  }
  if (brokenSessionHits.length >= BROKEN_THRESHOLD) {
    brokenSessionHits.length = 0; // reset para no encadenar reinicios
    safeRestart(`Sesión de WhatsApp Web parece rota (${BROKEN_THRESHOLD}+ rechazos en <2 min) — reinicio automático`);
  }
});

process.on('uncaughtException', (err) => {
  const msg = String(err?.message || '');
  if (
    msg.includes('Execution context was destroyed') ||
    msg.includes('Protocol error') ||
    msg.includes('Target closed') ||
    msg.includes('Session closed')
  ) {
    safeRestart(`Excepción de Puppeteer: ${msg.split('\n')[0]}`);
  } else {
    console.error('❌ Excepción no capturada:', msg);
    process.exit(1);
  }
});

// ── Página web de estado + QR ─────────────────────────────
// En un servidor (Railway) no hay terminal para escanear el QR. Esta página lo
// muestra en el navegador y sirve además de healthcheck (/health) para Railway.
let latestQr = null;
let waStatus = 'starting'; // starting | qr | authenticated | ready | disconnected

client.on('qr', (qr) => { latestQr = qr; waStatus = 'qr'; });
client.on('authenticated', () => { waStatus = 'authenticated'; });
client.on('ready', () => { latestQr = null; waStatus = 'ready'; });
client.on('disconnected', () => { waStatus = 'disconnected'; });

const WEB_PORT = process.env.PORT || 3001;
const QR_TOKEN = process.env.QR_PAGE_TOKEN || ''; // opcional: protege la página con ?token=

function htmlShell(body) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="8">
<title>Camila · WhatsApp Hotel Paraíso</title>
<style>
 body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0e1116;color:#e6edf3;
      display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center}
 .card{background:#161b22;border:1px solid #30363d;border-radius:16px;padding:32px 28px;max-width:420px}
 h1{font-size:20px;margin:0 0 10px} p{color:#9da7b3;line-height:1.5;font-size:15px;margin:8px 0}
 img{width:280px;height:280px;background:#fff;border-radius:12px;padding:10px;margin:18px 0}
 .ok{font-size:54px;margin:6px 0} ol{text-align:left;color:#9da7b3;font-size:14px;line-height:1.8;margin:14px 0}
</style></head><body><div class="card">${body}</div></body></html>`;
}

// Envía un mensaje al grupo Control Hotel (por env CONTROL_HOTEL_GROUP_ID o por nombre).
// Devuelve true si se logró resolver el grupo y enviar.
// Resuelve y cachea el JID del grupo (getChats es caro y bajo @lid a veces
// falla con errores minificados — con cache solo se paga/arriesga una vez).
let cachedControlGroupJid = '';
async function resolveControlHotelGroupJid() {
  if (CONTROL_HOTEL_GROUP_ID) {
    return CONTROL_HOTEL_GROUP_ID.includes('@g.us') ? CONTROL_HOTEL_GROUP_ID : `${CONTROL_HOTEL_GROUP_ID}@g.us`;
  }
  if (cachedControlGroupJid) return cachedControlGroupJid;
  const chats = await client.getChats();
  const cg = chats.find(c => c.isGroup && (c.name || '').trim().toLowerCase() === CONTROL_HOTEL_GROUP_NAME.trim().toLowerCase());
  if (cg?.id?._serialized) cachedControlGroupJid = cg.id._serialized;
  return cachedControlGroupJid;
}

// Devuelve true SOLO si el mensaje realmente salió al grupo; nunca lanza.
async function sendToControlHotelGroup(message) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const groupId = await resolveControlHotelGroupJid();
      if (!groupId) throw new Error('grupo no resuelto (sin CONTROL_HOTEL_GROUP_ID y sin match por nombre)');
      markRecentBotOutgoing(groupId);
      await client.sendMessage(groupId, message);
      return true;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
    }
  }
  console.warn('⚠️ Envío al grupo Control Hotel FALLÓ:', String(lastErr?.message || lastErr).split('\n')[0]);
  return false;
}

// Anti-duplicado: no publicar dos veces la misma reserva (misma sesión/pago).
const notifiedWebBookings = new Set();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: waStatus }));
      return;
    }

    // ── Endpoint interno: el sitio web avisa de una reserva nueva (motor web) ──
    // El bot publica los detalles en el grupo Control Hotel. Auth por token compartido.
    if (url.pathname === '/notify-booking') {
      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
        return;
      }
      const expected = process.env.AGENT_API_TOKEN || '';
      const authHeader = String(req.headers['authorization'] || '');
      const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : String(req.headers['x-agent-token'] || '');
      if (!expected || provided !== expected) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'unauthorized' }));
        return;
      }

      let raw = '';
      for await (const chunk of req) raw += chunk;
      let payload;
      try { payload = JSON.parse(raw || '{}'); } catch { payload = null; }
      if (!payload || typeof payload !== 'object') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'invalid_json' }));
        return;
      }

      // Anti-duplicado por pago (o por folio si no hay pago).
      const dedupeKey = payload.paymentIntentId || payload.confirmationNumber || '';
      if (dedupeKey && notifiedWebBookings.has(dedupeKey)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, duplicate: true }));
        return;
      }

      // Si el bot no está vinculado/listo, no puede enviar: la reserva NO se pierde
      // (el sitio ya la guardó y envió email); solo se omite el ping al grupo.
      if (waStatus !== 'ready') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'wa_not_ready', status: waStatus }));
        return;
      }

      try {
        const sent = await sendToControlHotelGroup(formatWebBookingAlert(payload));
        if (sent && dedupeKey) {
          notifiedWebBookings.add(dedupeKey);
          if (notifiedWebBookings.size > 1000) notifiedWebBookings.clear(); // cota de memoria
        }
        console.log(`🌐 Aviso de reserva web ${payload.confirmationNumber || ''} → grupo: ${sent ? 'enviado' : 'NO enviado (ver warning previo)'}`);
        res.writeHead(sent ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: sent }));
      } catch (e) {
        console.warn('⚠️ Error enviando aviso de reserva web:', String(e?.message || e).split('\n')[0]);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
      }
      return;
    }

    if (QR_TOKEN && url.searchParams.get('token') !== QR_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlShell('<h1>🔒 Acceso restringido</h1><p>Agrega <b>?token=…</b> al final de la URL.</p>'));
      return;
    }
    let body;
    if (waStatus === 'ready') {
      body = '<div class="ok">✅</div><h1>Camila está conectada</h1>' +
             '<p>El bot de WhatsApp está activo y respondiendo 24/7.</p>';
    } else if (latestQr) {
      const dataUrl = await QRCode.toDataURL(latestQr, { margin: 1, width: 280 });
      body = '<h1>📱 Vincula el WhatsApp del hotel</h1>' +
             `<img src="${dataUrl}" alt="Código QR">` +
             '<ol><li>Abre WhatsApp en el teléfono del hotel</li>' +
             '<li>Menú (⋮) → <b>Dispositivos vinculados</b></li>' +
             '<li><b>Vincular un dispositivo</b> y escanea este código</li></ol>' +
             '<p>La página se actualiza sola.</p>';
    } else {
      body = '<div class="ok">⏳</div><h1>Iniciando Camila…</h1>' +
             '<p>Espera unos segundos; el código QR aparecerá aquí solo.</p>';
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlShell(body));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Error: ' + (e?.message || e));
  }
}).listen(WEB_PORT, () => {
  console.log(`🌐 Página de estado/QR escuchando en el puerto ${WEB_PORT}`);
});

// ── Iniciar ───────────────────────────────────────────────

console.log('\n🚀 Iniciando Agente WhatsApp — Hotel Paraíso Encantado...');
cleanChromiumLocks();
client.initialize();
