#!/usr/bin/env node
/**
 * scripts/sim-conversations.js
 * Simulador de conversaciones de Camila con el modelo REAL de Anthropic, pero SIN
 * WhatsApp, SIN Google Sheets y SIN tocar reservations.json ni la página real:
 *   · página falsa con node:http (disponibilidad, apartados, bot-status, cotizaciones);
 *   · reservas en un archivo temporal (RESERVATIONS_FILE);
 *   · la ráfaga pasa por message-buffer.js + conversation-flow.js como en index.js;
 *   · los comprobantes pasan por proof-handler.js con envíos falsos.
 *
 * Uso (desde agentes/whatsapp-agent):
 *   node scripts/sim-conversations.js --out /ruta/sim-run-1.txt            (modelo real)
 *   node scripts/sim-conversations.js --model fake --out /ruta/sim.txt     (guion, sin red)
 *   … --only E7,E8                                                        (solo esos escenarios)
 *
 * Con --model real cuesta centavos (llamadas a claude-sonnet-5) y antes hace una
 * micro-llamada de prueba: si la cuenta de Anthropic no responde, sale con código 3.
 * Con --model fake (scripts/sim-fake-model.js) prueba todo el código alrededor del
 * modelo, pero NO el criterio del modelo. Sale con código 1 si alguna aserción falla.
 * La transcripción legible queda en --out.
 *
 * ⚠️ El entorno se fija ANTES de cualquier import del bot: dotenv no pisa variables ya
 * definidas, así que Google queda vacío y BOOKING_API_URL apunta a la página falsa.
 * Del .env solo se aprovecha ANTHROPIC_API_KEY (y los BANK_* / CLIP del prompt).
 */

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REAL_RESERVATIONS = path.join(BOT_DIR, 'reservations.json');

// ── Argumentos ─────────────────────────────────────────────
const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const OUT_FILE = path.resolve(argOf('--out', path.join(os.tmpdir(), `sim-run-${Date.now()}.txt`)));
const ONLY = (argOf('--only', '') || '').split(',').map(s => s.trim()).filter(Boolean); // p. ej. --only E7,E8
const MODEL_MODE = argOf('--model', 'real'); // 'real' (API de Anthropic) | 'fake' (guion, sin red)
if (!['real', 'fake'].includes(MODEL_MODE)) { console.error('--model debe ser real o fake'); process.exit(2); }

// ── Transcripción y consola ────────────────────────────────
const transcript = [];
const T = (line = '') => transcript.push(String(line));
const origLog = console.log.bind(console);
const origWarn = console.warn.bind(console);
const origError = console.error.bind(console);
const progress = (...a) => origLog(...a);
// Los logs del bot van a la transcripción (no a la terminal) para leerlos junto al turno.
const captureLog = (tag) => (...args) => {
  const text = args.map(a => (typeof a === 'string' ? a : (a instanceof Error ? a.message : JSON.stringify(a)))).join(' ');
  T(`      [${tag}] ${text.replace(/\n/g, ' ⏎ ').slice(0, 400)}`);
};
console.log = captureLog('log');
console.warn = captureLog('warn');
console.error = captureLog('error');

function writeTranscript() {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, transcript.join('\n') + '\n', 'utf-8');
}

// ── Página falsa ───────────────────────────────────────────
const page = {
  requests: [],            // { method, path, headers, body }
  occupied: new Map(),     // 'YYYY-MM-DD' -> Set(backendName) ocupados (Reservas/OTA)
  holds: new Map(),        // sessionId -> [{ room, date }]
};

function nightsOf(checkin, checkout) {
  const out = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(checkin)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(checkout))) return out;
  for (let d = new Date(`${checkin}T12:00:00Z`); d < new Date(`${checkout}T12:00:00Z`) && out.length < 400; d = new Date(d.getTime() + 86400000)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function occupy(rooms, checkin, checkout) {
  for (const date of nightsOf(checkin, checkout)) {
    if (!page.occupied.has(date)) page.occupied.set(date, new Set());
    for (const r of rooms) page.occupied.get(date).add(r);
  }
}

function holdRows(body) {
  const segments = Array.isArray(body.segments) && body.segments.length
    ? body.segments
    : [{ checkin: body.checkin, checkout: body.checkout, rooms: body.rooms }];
  const rows = [];
  for (const s of segments) {
    for (const room of (s.rooms || [])) {
      const name = typeof room === 'string' ? room : room?.name;
      for (const date of nightsOf(s.checkin, s.checkout)) rows.push({ room: name, date });
    }
  }
  return rows;
}

function handlePage(req, res, body) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  page.requests.push({ method: req.method, path: url.pathname, headers: req.headers, body, at: Date.now() });

  if (url.pathname === '/api/admin/bot-status') return json(200, { enabled: true });
  if (url.pathname === '/api/admin/guest-notes') return json(200, { found: false });

  if (url.pathname === '/api/check-availability' && req.method === 'POST') {
    const nights = nightsOf(body.checkin, body.checkout);
    const unavailableRooms = (body.rooms || []).filter(room => {
      if (nights.some(d => page.occupied.get(d)?.has(room))) return true;
      for (const [sessionId, rows] of page.holds) {
        if (body.sessionId && sessionId === body.sessionId) continue; // excluye el apartado propio
        if (rows.some(r => r.room === room && nights.includes(r.date))) return true;
      }
      return false;
    });
    return json(200, { unavailableRooms });
  }

  if (url.pathname === '/api/create-temporary-block' && req.method === 'POST') {
    const isWa = String(body.sessionId || '').startsWith('wa-');
    if (isWa && req.headers['x-agent-token'] !== 'test-token') return json(401, { error: 'agent_token_required' });
    const rows = holdRows(body);
    const conflicts = [];
    for (const [sessionId, other] of page.holds) {
      if (sessionId === body.sessionId) continue;
      for (const r of rows) if (other.some(o => o.room === r.room && o.date === r.date)) conflicts.push(r);
    }
    if (conflicts.length) {
      return json(200, { success: false, message: 'No se pudo crear el bloqueo temporal: hay habitaciones apartadas por otra sesión', expiresAt: null, holdMinutes: 180, expiresInSeconds: null, conflicts });
    }
    page.holds.set(body.sessionId, rows);
    const holdMinutes = isWa ? 180 : 10;
    const expiresAt = new Date(Date.now() + holdMinutes * 60000).toISOString();
    return json(200, { success: true, message: `Bloqueo temporal creado (${holdMinutes} minutos)`, expiresAt, holdMinutes, expiresInSeconds: holdMinutes * 60, conflicts: [] });
  }

  if (url.pathname === '/api/remove-temporary-block' && req.method === 'POST') {
    const isWa = String(body.sessionId || '').startsWith('wa-');
    if (isWa && req.headers['x-agent-token'] !== 'test-token') return json(401, { error: 'agent_token_required' });
    page.holds.delete(body.sessionId);
    return json(200, { success: true });
  }

  if (url.pathname === '/api/admin/cotizaciones' && req.method === 'POST') return json(200, { id: `COT-SIM-${page.requests.length}` });
  if (/^\/api\/admin\/cotizaciones\/[^/]+\/send-email$/.test(url.pathname)) return json(200, { ok: true });

  return json(404, { error: 'no existe en la página falsa' });
}

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
    try { handlePage(req, res, body); } catch (err) { res.writeHead(500); res.end(String(err?.message || err)); }
  });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const PORT = server.address().port;

// ── Entorno seguro ANTES de importar el bot ────────────────
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'camila-sim-'));
const realMtimeBefore = fs.existsSync(REAL_RESERVATIONS) ? fs.statSync(REAL_RESERVATIONS).mtimeMs : null;
Object.assign(process.env, {
  BOOKING_API_URL: `http://127.0.0.1:${PORT}`,
  AGENT_API_TOKEN: 'test-token',
  RESERVATIONS_FILE: path.join(tmpDir, 'reservations.json'),
  GOOGLE_SHEETS_CREDENTIALS: '',
  GOOGLE_SHEET_ID: '',
  GOOGLE_CLIENT_EMAIL: '',
  GOOGLE_PRIVATE_KEY: '',
});
process.chdir(BOT_DIR); // dotenv lee el .env de la carpeta del bot
await import('dotenv/config');

const envProblems = [];
for (const k of ['GOOGLE_SHEETS_CREDENTIALS', 'GOOGLE_SHEET_ID', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY']) {
  if (process.env[k] !== '') envProblems.push(`${k} no quedó vacío`);
}
if (process.env.BOOKING_API_URL !== `http://127.0.0.1:${PORT}`) envProblems.push('BOOKING_API_URL no apunta a la página falsa');
if (!String(process.env.RESERVATIONS_FILE).startsWith(tmpDir)) envProblems.push('RESERVATIONS_FILE no es temporal');
if (MODEL_MODE === 'real' && !process.env.ANTHROPIC_API_KEY) envProblems.push('falta ANTHROPIC_API_KEY en el .env');
if (envProblems.length) {
  origError(`❌ Entorno inseguro, no se corre nada: ${envProblems.join('; ')}`);
  server.close();
  process.exit(2);
}

const handler = await import('../claude-handler.js');
const { createMessageBuffer } = await import('../message-buffer.js');
const { createBurstHandler } = await import('../conversation-flow.js');
const { createProofProcessor, buildProofAckNoQuote } = await import('../proof-handler.js');
const reservations = await import('../reservations.js');
const { buildQuoteGroupAlert } = await import('../quote-summary.js');
const { getBankInfo } = await import('../bank-info.js');
const { HOTEL_SYSTEM_PROMPT, ROOMS } = await import('../hotel-knowledge.js');
const { TOURS } = await import('../tours-data.js');
const { normalizeMxCandidates, extractDigitsFromJid } = await import('../phone.js');
const Anthropic = (await import('@anthropic-ai/sdk')).default;

// ── Cliente real de Anthropic, observado ───────────────────
const { createFakeAnthropic } = await import('./sim-fake-model.js');
const modelClient = MODEL_MODE === 'real'
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 4, timeout: 90000 })
  : createFakeAnthropic();
const apiLog = []; // { params, resp, ms }
handler.__test.setAnthropicClient({
  messages: {
    async create(params) {
      const t0 = Date.now();
      const resp = await modelClient.messages.create(params);
      apiLog.push({ params, resp, ms: Date.now() - t0 });
      return resp;
    },
  },
});

// ── Cableado igual que index.js (sin WhatsApp) ─────────────
const hmCalls = [];   // { key, text, at }
const replies = [];   // { key, text, at }
const groupSent = []; // { content, options }
const hotelSent = []; // { content, options }
const burstErrors = [];
const results = [];   // { key, result }

const handleBurst = createBurstHandler({
  handleMessage: async (key, text, userName, opts) => {
    hmCalls.push({ key, text, at: Date.now() });
    const result = await handler.handleMessage(key, text, userName, opts);
    results.push({ key, result });
    return result;
  },
  addToHistory: handler.addToHistory,
  checkBotPause: () => ({ paused: false }),
  sendReply: async (meta, text) => { replies.push({ key: meta.msg.from, text, at: Date.now() }); },
  afterReply: async (meta, result) => {
    // Mismo aviso de cotización que index.js (contrato: buildQuoteGroupAlert con result.quote).
    if (result?.quoteCreated && result.quote) {
      groupSent.push({
        content: buildQuoteGroupAlert(result.quote, {
          userName: meta.userName,
          waDigits: meta.contactNumber,
          supersededFolio: result.supersededFolio,
          supersededCheckin: result.supersededCheckin,
          supersededCheckout: result.supersededCheckout,
        }),
        kind: 'cotizacion',
      });
    }
  },
  log: { log: captureLog('flow'), warn: captureLog('flow-warn'), error: captureLog('flow-error') },
});

const bursts = createMessageBuffer({
  debounceMs: 1500,
  maxWaitMs: 8000,
  onFlush: handleBurst,
  onError: (err, key) => { burstErrors.push({ key, err }); T(`      [burst-error] ${key}: ${err?.message || err}`); },
});

const proofs = createProofProcessor({
  repo: { ...reservations, normalizeMxCandidates, extractDigitsFromJid },
  sendToHotel: async (content, options) => { hotelSent.push({ content, options }); return true; },
  sendToGroup: async (content, options) => { groupSent.push({ content, options, kind: 'comprobante' }); return true; },
  mediaToGroup: false,
  log: { log: captureLog('proof'), warn: captureLog('proof-warn'), error: captureLog('proof-error') },
});

// ── Utilidades de escenario ────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const readAll = () => {
  try { return JSON.parse(fs.readFileSync(process.env.RESERVATIONS_FILE, 'utf-8')); } catch { return []; }
};
const byFolio = (folio) => reservations.getByFolio(folio);
const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-MX')}`;

const checks = []; // { scenario, name, ok, detail }
let currentScenario = '';
function check(name, ok, detail = '') {
  checks.push({ scenario: currentScenario, name, ok: Boolean(ok), detail });
  T(`   ${ok ? '✅ PASS' : '❌ FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);
}
function note(text) { T(`   ℹ️  ${text}`); }

function toolCallsSince(apiIndex) {
  const calls = [];
  for (const entry of apiLog.slice(apiIndex)) {
    for (const block of entry.resp?.content || []) {
      if (block.type === 'tool_use') calls.push({ name: block.name, input: block.input, id: block.id });
    }
  }
  return calls;
}
function toolResultsSince(apiIndex) {
  const out = new Map(); // tool_use_id -> parsed result
  for (const entry of apiLog.slice(apiIndex)) {
    for (const m of entry.params?.messages || []) {
      if (m.role !== 'user' || !Array.isArray(m.content)) continue;
      for (const b of m.content) {
        if (b.type === 'tool_result') {
          try { out.set(b.tool_use_id, JSON.parse(b.content)); } catch { out.set(b.tool_use_id, b.content); }
        }
      }
    }
  }
  return out;
}

async function waitIdle(key, { timeoutMs = 300000 } = {}) {
  const start = Date.now();
  await sleep(50);
  while (Date.now() - start < timeoutMs) {
    if (bursts.pending(key) === 0 && !bursts.isBusy(key)) return true;
    await sleep(100);
  }
  throw new Error(`timeout esperando la ráfaga de ${key}`);
}

const users = new Map(); // key -> { name, contactNumber }
function fakeMsg(key) { return { from: key, id: { _serialized: `sim-${key}-${Date.now()}-${Math.random()}` } }; }
function metaFor(key) {
  const u = users.get(key);
  return { msg: fakeMsg(key), chat: null, userName: u.name, contactNumber: u.contactNumber, resumeNote: '' };
}

/**
 * Manda una ráfaga (varios textos con pausas cortas) y espera la respuesta.
 * Devuelve lo que pasó en ese turno.
 */
async function turn(key, texts, { gapMs = 350, label = '' } = {}) {
  const before = {
    hm: hmCalls.length, replies: replies.length, api: apiLog.length, results: results.length,
    records: readAll().length, page: page.requests.length, group: groupSent.length, hotel: hotelSent.length,
  };
  T('');
  T(`  👤 ${users.get(key).name}${label ? ` [${label}]` : ''}:`);
  for (const [i, t] of texts.entries()) {
    T(`     > ${t}`);
    bursts.push(key, { type: 'text', text: t }, metaFor(key));
    if (i < texts.length - 1) await sleep(gapMs);
  }
  const t0 = Date.now();
  await waitIdle(key);
  return collectTurn(key, before, t0);
}

function collectTurn(key, before, t0) {
  const turnReplies = replies.slice(before.replies).filter(r => r.key === key);
  const turnHm = hmCalls.slice(before.hm).filter(c => c.key === key);
  const turnResults = results.slice(before.results).filter(r => r.key === key).map(r => r.result);
  const tools = toolCallsSince(before.api);
  const toolResults = toolResultsSince(before.api);
  const apiCalls = apiLog.length - before.api;
  const pageReqs = page.requests.slice(before.page);
  const newRecords = readAll().slice(before.records);
  for (const tc of tools) {
    const res = toolResults.get(tc.id);
    T(`     🔧 ${tc.name} ${JSON.stringify(tc.input)}`);
    if (res !== undefined) T(`        ↳ ${JSON.stringify(res).slice(0, 900)}`);
  }
  for (const r of pageReqs) {
    if (r.path === '/api/admin/bot-status' || r.path === '/api/check-availability') continue;
    T(`     🌐 ${r.method} ${r.path} token=${r.headers['x-agent-token'] ? 'sí' : 'no'} ${JSON.stringify(r.body).slice(0, 300)}`);
  }
  for (const [i, r] of turnReplies.entries()) {
    T(`  🤖 Camila${turnReplies.length > 1 ? ` (${i + 1}/${turnReplies.length})` : ''}:`);
    for (const line of String(r.text).split('\n')) T(`     | ${line}`);
  }
  for (const g of groupSent.slice(before.group)) {
    T(`  📣 Grupo Control Hotel (${g.kind || 'aviso'}):`);
    for (const line of String(typeof g.content === 'string' ? g.content : `[archivo ${g.content?.mimetype}] ${JSON.stringify(g.options || {})}`).split('\n')) T(`     # ${line}`);
  }
  for (const h of hotelSent.slice(before.hotel)) {
    T(`  🏨 Número del hotel: ${typeof h.content === 'string' ? h.content.split('\n')[0] : `[archivo ${h.content?.mimetype}] ${JSON.stringify(h.options || {})}`}`);
  }
  T(`     ⏱️ ${((Date.now() - t0) / 1000).toFixed(1)} s · handleMessage ${turnHm.length} · API ${apiCalls} · folios nuevos ${newRecords.length}`);
  return {
    replies: turnReplies, text: turnReplies.map(r => r.text).join('\n\n'), hm: turnHm, results: turnResults,
    tools, toolResults, pageReqs, newRecords, apiCalls,
  };
}

/** Si el turno esperaba cotización y el modelo pidió otra cosa, contesta como cliente (máx. `max`). */
async function pushUntilQuote(key, first, { name, choice = 'la opción 1', confirm = 'sí, adelante', max = 2 } = {}) {
  let out = first;
  const all = [first];
  let extra = 0;
  while (!out.newRecords.some(r => r.status === 'PENDIENTE_PAGO') && extra < max) {
    extra++;
    const t = out.text || '';
    let reply = confirm;
    if (/nombre/i.test(t)) reply = name;
    else if (/cu[aá]l (te|les|prefieres|eliges)|qu[eé] opci[oó]n|elige|te late/i.test(t)) reply = `${choice}, a nombre de ${name}`;
    note(`el modelo no cotizó todavía; el cliente simulado contesta "${reply}" (seguimiento ${extra}/${max})`);
    out = await turn(key, [reply], { label: 'seguimiento' });
    all.push(out);
  }
  return { last: out, all, extra };
}

// ── Revisión global de textos ──────────────────────────────
const promptAmounts = new Set([0]);
const amountRe = /\$\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g;
for (const m of HOTEL_SYSTEM_PROMPT().matchAll(amountRe)) promptAmounts.add(Number(m[1].replace(/,/g, '')));
for (const r of ROOMS) for (const k of ['price_2', 'price_3_4', 'price_5', 'price_6', 'extra_person']) if (r[k]) promptAmounts.add(r[k]);
for (const t of TOURS) promptAmounts.add(t.price);
const toolAmounts = new Set();
function harvestNumbers(value) {
  if (value == null) return;
  if (typeof value === 'number') { toolAmounts.add(Math.round(value)); return; }
  if (typeof value === 'string') { for (const m of value.matchAll(amountRe)) toolAmounts.add(Number(m[1].replace(/,/g, ''))); return; }
  if (Array.isArray(value)) { value.forEach(harvestNumbers); return; }
  if (typeof value === 'object') Object.values(value).forEach(harvestNumbers);
}

function reviewTexts() {
  // Todo número que el modelo pudo ver: resultados de herramientas + registros guardados.
  for (const entry of apiLog) {
    for (const m of entry.params?.messages || []) {
      if (m.role === 'user' && Array.isArray(m.content)) {
        for (const b of m.content) if (b.type === 'tool_result') { try { harvestNumbers(JSON.parse(b.content)); } catch { harvestNumbers(b.content); } }
      }
    }
  }
  for (const r of readAll()) harvestNumbers({ a: r.totalPrice, b: r.depositAmount, c: r.saldo, d: r.subtotal, e: r.discount, rooms: r.rooms });

  const voseo = /\b(vos|tenés|podés|querés|mandame|liquidás|vosotros|vale)\b/i;
  const problems = [];
  for (const r of replies) {
    const text = String(r.text);
    const who = users.get(r.key)?.name || r.key;
    const snippet = (re) => { const m = text.match(re); return m ? text.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\n/g, ' ⏎ ') : ''; };
    const v = text.match(voseo);
    // "vale la pena" es español de México (no es el "vale" de España): se reporta aparte.
    if (v && !(v[1].toLowerCase() === 'vale' && /vale la pena/i.test(text))) problems.push(`${who}: voseo/España "${v[1]}" → …${snippet(voseo)}…`);
    if (/\bsistema\b/i.test(text)) problems.push(`${who}: menciona "sistema" → …${snippet(/\bsistema\b/i)}…`);
    if (/herramienta/i.test(text)) problems.push(`${who}: menciona "herramienta"`);
    if (/\bAPI\b/.test(text)) problems.push(`${who}: menciona "API"`);
    if (/\b(3|tres)\s*horas\b/i.test(text)) problems.push(`${who}: dice "3 horas" → …${snippet(/\b(3|tres)\s*horas\b/i)}…`);
    if (/\$\s?1,?450\b/.test(text)) problems.push(`${who}: precio viejo de tour $1,450`);
    if (/(surrealista|pozas)[^\n]{0,60}\$\s?1,?300\b/i.test(text)) problems.push(`${who}: precio viejo de la Ruta Surrealista $1,300`);
    if (/\*\*[^*\n]+\*\*/.test(text)) problems.push(`${who}: doble asterisco **negritas**`);
    for (const m of text.matchAll(amountRe)) {
      const n = Number(m[1].replace(/,/g, ''));
      if (!promptAmounts.has(n) && !toolAmounts.has(n)) {
        problems.push(`${who}: monto ${money(n)} no sale del prompt, de las herramientas ni del registro → …${text.slice(Math.max(0, m.index - 50), m.index + 20).replace(/\n/g, ' ⏎ ')}…`);
      }
    }
  }
  return problems;
}

// ── Escenarios ─────────────────────────────────────────────
const RUN_STARTED = new Date();
const A = '5214891110001@c.us';
const B = '5214891110002@c.us';
const C = '5214891110003@c.us';
users.set(A, { name: 'Ana', contactNumber: '5214891110001' });
users.set(B, { name: 'Carlos', contactNumber: '5214891110002' });
users.set(C, { name: 'Laura', contactNumber: '5214891110003' });

const want = (id) => !ONLY.length || ONLY.includes(id);
const bank = getBankInfo();

function scenario(id, title) {
  currentScenario = id;
  T('');
  T('════════════════════════════════════════════════════════════════');
  T(`${id} — ${title}`);
  T('════════════════════════════════════════════════════════════════');
  progress(`▶ ${id} — ${title}`);
}

function holdRequestsFor(folio, reqs = page.requests) {
  return reqs.filter(r => r.path === '/api/create-temporary-block' && r.body?.sessionId === `wa-${folio}`);
}

let quoteA1 = null;
let quoteA2 = null;

async function runScenarios() {
  // E1 — ráfaga de 3 mensajes → UNA llamada y opciones para 5
  if (want('E1') || want('E2') || want('E3') || want('E4') || want('E5') || want('E6')) {
    scenario('E1', 'Ráfaga "Hola / somos 5 personas / del 9 al 11 de octubre"');
    const e1 = await turn(A, ['Hola', 'somos 5 personas', 'del 9 al 11 de octubre']);
    check('exactamente 1 llamada a handleMessage para la ráfaga', e1.hm.length === 1, `llamadas=${e1.hm.length}`);
    check('la llamada lleva los 3 mensajes juntos', e1.hm.length === 1 && ['Hola', 'somos 5 personas', 'del 9 al 11 de octubre'].every(t => e1.hm[0].text.includes(t)));
    check('exactamente 1 respuesta enviada', e1.replies.length === 1, `respuestas=${e1.replies.length}`);
    const ca = e1.tools.filter(t => t.name === 'check_availability');
    check('check_availability con guests=5 y 2026-10-09 → 2026-10-11', ca.some(t => Number(t.input.guests) === 5 && t.input.checkin === '2026-10-09' && t.input.checkout === '2026-10-11'), JSON.stringify(ca.map(t => t.input)));
    const caRes = ca.map(t => e1.toolResults.get(t.id)).find(r => r && Array.isArray(r.room_options));
    check('la herramienta devolvió room_options para 5', Boolean(caRes?.room_options?.length));
    check('la respuesta ofrece opciones para el grupo (menciona 5 personas / opciones)', /5 personas|cinco personas|opci[oó]n|1️⃣/i.test(e1.text));
    if (caRes?.room_options?.[0]) {
      const first = caRes.room_options[0];
      const firstRoom = first.rooms?.[0]?.name?.split(' ')[0] || '';
      check(`la opción 1 presentada es la del sistema (${first.rooms.map(r => r.name).join(' + ')} ${money(first.total_per_night)})`,
        e1.text.includes(firstRoom) && e1.text.includes(money(first.total_per_night).slice(1)));
    }
    check('NO ofrece el motor web ni la disyuntiva "WhatsApp o página"', !/motor|paraisoencantado\.com\/reservar|reservar en l[ií]nea|opci[oó]n 2[^\n]{0,60}(web|p[aá]gina|motor|l[ií]nea)/i.test(e1.text));
    check('no se creó folio', e1.newRecords.length === 0);

    // E2 — "la opción 1" → pide nombre → nombre → cotización
    scenario('E2', '"la opción 1" → pide nombre → "Ana López Martínez" → cotización');
    const e2a = await turn(A, ['la opción 1']);
    check('sin folio todavía (falta el nombre)', e2a.newRecords.length === 0, `folios=${e2a.newRecords.length}`);
    check('pide el nombre', /nombre/i.test(e2a.text));
    check('no intentó cotizar sin el nombre del cliente', !e2a.tools.some(t => t.name === 'create_reservation_quote'));
    const e2b0 = await turn(A, ['Ana López Martínez']);
    const e2 = await pushUntilQuote(A, e2b0, { name: 'Ana López Martínez' });
    if (e2.extra) note(`hicieron falta ${e2.extra} mensaje(s) extra del cliente para cotizar`);
    const e2b = e2.last;
    quoteA1 = [...e2.all].reverse().flatMap(t => t.newRecords).find(r => r.status === 'PENDIENTE_PAGO') || null;
    check('se creó un folio PENDIENTE_PAGO', Boolean(quoteA1), quoteA1?.folio || 'sin folio');
    const e2text = e2.all.map(t => t.text).join('\n\n');
    for (const needle of ['Total', 'Anticipo', 'Saldo a pagar al llegar al hotel', 'confirmada', 'CLABE', bank.clabe]) {
      check(`el texto enviado contiene "${needle}"`, e2text.includes(needle));
    }
    if (quoteA1) {
      const rec = byFolio(quoteA1.folio);
      check('el texto trae el folio real', e2text.includes(rec.folio));
      check('registro: depositRule "50"', rec.depositRule === '50', `depositRule=${rec.depositRule}`);
      check('registro: anticipo = 50% del total', rec.depositAmount === Math.round(rec.totalPrice * 0.5), `${money(rec.depositAmount)} de ${money(rec.totalPrice)}`);
      check('registro: saldo = total − anticipo', typeof rec.saldo === 'number' && rec.saldo === rec.totalPrice - rec.depositAmount, `saldo=${rec.saldo}`);
      check('registro: 5 personas', Number(rec.guests) === 5 || rec.rooms.reduce((s, r) => s + Number(r.guests || 0), 0) === 5, `guests=${rec.guests}`);
      check('registro: sin tours', !rec.tours?.length && !Number(rec.toursTotal));
      check('los montos del texto son los del registro', e2text.includes(money(rec.totalPrice)) && e2text.includes(money(rec.depositAmount)) && e2text.includes(money(rec.saldo)));
      const holds = holdRequestsFor(rec.folio);
      check('apartado: 1 POST a create-temporary-block con sessionId wa-<folio>', holds.length === 1, `POSTs=${holds.length}`);
      check('apartado: con x-agent-token', holds.every(h => h.headers['x-agent-token'] === 'test-token') && holds.length > 0);
      check('apartado: con segments', holds.every(h => Array.isArray(h.body.segments) && h.body.segments.length > 0) && holds.length > 0);
      const mins = rec.holdExpiresAt ? (new Date(rec.holdExpiresAt).getTime() - Date.now()) / 60000 : 0;
      check('apartado: blockConfirmed y vence en ~180 min', rec.blockConfirmed === true && mins > 170 && mins <= 181, `blockConfirmed=${rec.blockConfirmed} faltan=${mins.toFixed(0)} min`);
      check('el texto dice hasta qué hora se aparta', /Te apartamos .* hasta la?s? \*/.test(e2text));
      const alert = groupSent.find(g => g.kind === 'cotizacion' && String(g.content).includes(rec.folio));
      check('aviso de cotización al grupo con el folio', Boolean(alert));
      const lastResult = results.filter(r => r.key === A).map(r => r.result).reverse().find(r => r?.quoteCreated);
      check('result del contrato: quoteCreated, quoteFolio y quote con saldo', Boolean(lastResult?.quoteCreated && lastResult.quoteFolio === rec.folio && lastResult.quote?.saldo === rec.saldo && lastResult.quoteBlockConfirmed === true));
      check('getSessionFolio devuelve el folio', handler.getSessionFolio(A) === rec.folio);
    }
  }

  // E3 — cambio a fechas ocupadas → "no hay" y sin folio nuevo
  if (quoteA1 && (want('E3') || want('E4') || want('E5') || want('E6'))) {
    scenario('E3', 'Cambio a 16–18 oct con esas habitaciones ocupadas');
    const rec = byFolio(quoteA1.folio);
    const backendNames = rec.rooms.map(r => r.backendName || r.name);
    occupy(backendNames, '2026-10-16', '2026-10-18');
    note(`página falsa: ${backendNames.join(', ')} ocupadas las noches del 16 y 17 de octubre`);
    const e3 = await turn(A, ['¿lo podemos cambiar del 16 al 18 de octubre?']);
    const ca = e3.tools.filter(t => t.name === 'check_availability');
    check('volvió a revisar el calendario (check_availability 2026-10-16 → 2026-10-18)', ca.some(t => t.input.checkin === '2026-10-16' && t.input.checkout === '2026-10-18'), JSON.stringify(ca.map(t => t.input)));
    const e3cv = ca.map(t => e3.toolResults.get(t.id)?.cotizacion_vigente).find(Boolean);
    check('el resultado de la herramienta marca cotizacion_vigente.mismas_habitaciones_disponibles=false', e3cv?.mismas_habitaciones_disponibles === false, JSON.stringify(e3cv || null));
    check('no se creó ningún folio (ni cancelado)', e3.newRecords.length === 0, `folios=${e3.newRecords.map(r => `${r.folio}:${r.status}`).join(',')}`);
    check('la cotización anterior sigue PENDIENTE_PAGO', byFolio(rec.folio).status === 'PENDIENTE_PAGO');
    const noDispRe = /no (est[aá]n?|hay|tenemos|queda|me queda)[^.\n]{0,50}(disponib|libre)|ocupad|ya no (est[aá]|hay)[^.\n]{0,30}(disponib|libre)|sin disponibilidad|no alcanza/i;
    check('dice claramente que no hay disponibilidad (de esa habitación) en esas fechas', noDispRe.test(e3.text), e3.text.match(noDispRe)?.[0] || 'sin frase de "no disponible"');
    check('no llamó create_reservation_quote para esas fechas', !e3.tools.some(t => t.name === 'create_reservation_quote'));
  }

  // E4 — cambio a fechas libres → nueva cotización y la anterior REEMPLAZADA
  if (quoteA1 && (want('E4') || want('E5') || want('E6'))) {
    scenario('E4', '"¿y del 23 al 25 de octubre?" (libre) → nueva cotización, anterior REEMPLAZADA');
    const prevFolio = quoteA1.folio;
    const e4a = await turn(A, ['¿y del 23 al 25 de octubre?']);
    const ca = e4a.tools.filter(t => t.name === 'check_availability');
    check('revisó el calendario del 23 al 25', ca.some(t => t.input.checkin === '2026-10-23' && t.input.checkout === '2026-10-25'), JSON.stringify(ca.map(t => t.input)));
    const e4cv = ca.map(t => e4a.toolResults.get(t.id)?.cotizacion_vigente).find(Boolean);
    check('el resultado de la herramienta marca mismas_habitaciones_disponibles=true', e4cv?.mismas_habitaciones_disponibles === true, JSON.stringify(e4cv || null));
    check('dice que SÍ hay disponibilidad (o cotiza directo)', /s[ií] (hay|est[aá]|tenemos)|disponible|libre/i.test(e4a.text) || e4a.newRecords.length > 0);
    const e4 = await pushUntilQuote(A, e4a, { name: 'Ana López Martínez', confirm: 'sí, cámbiala' });
    if (e4.extra) note(`hicieron falta ${e4.extra} mensaje(s) extra del cliente para cotizar`);
    quoteA2 = [...e4.all].reverse().flatMap(t => t.newRecords).find(r => r.status === 'PENDIENTE_PAGO') || null;
    check('se creó la nueva cotización', Boolean(quoteA2), quoteA2?.folio || 'sin folio');
    if (quoteA2) {
      const rec2 = byFolio(quoteA2.folio);
      const prev = byFolio(prevFolio);
      check('nueva: 2026-10-23 → 2026-10-25', rec2.checkin === '2026-10-23' && rec2.checkout === '2026-10-25', `${rec2.checkin} → ${rec2.checkout}`);
      check('anterior REEMPLAZADA por la nueva', prev.status === 'REEMPLAZADA' && prev.supersededBy === rec2.folio, `${prev.status} → ${prev.supersededBy}`);
      const allReqs = e4.all.flatMap(t => t.pageReqs);
      const removes = allReqs.filter(r => r.path === '/api/remove-temporary-block' && r.body?.sessionId === `wa-${prevFolio}`);
      check('remove-temporary-block del apartado anterior, con token', removes.length >= 1 && removes.every(r => r.headers['x-agent-token'] === 'test-token'), `llamadas=${removes.length}`);
      check('el apartado anterior ya no existe en la página', !page.holds.has(`wa-${prevFolio}`));
      check('apartado nuevo creado', page.holds.has(`wa-${rec2.folio}`) && rec2.blockConfirmed === true);
      const e4text = e4.all.map(t => t.text).join('\n\n');
      check('el texto trae Total / Anticipo / Saldo de la nueva', e4text.includes(money(rec2.totalPrice)) && e4text.includes('Anticipo') && e4text.includes('Saldo a pagar al llegar al hotel'));
      const alert = groupSent.find(g => g.kind === 'cotizacion' && String(g.content).includes(rec2.folio));
      check('aviso al grupo: "Reemplaza folio" con el anterior', Boolean(alert && String(alert.content).includes(`Reemplaza folio:* ${prevFolio}`)));
    }
  }

  // E5 — tours: catálogo con número y links; "agrégame Tamul" no entra a la cotización
  if (want('E5') || want('E6')) {
    scenario('E5', '"¿qué tours tienen?" y "agrégame el tour de Tamul a mi reserva"');
    const e5a = await turn(A, ['¿qué tours tienen?']);
    check('contiene el WhatsApp de tours 489 125 1458', /489 125 1458/.test(e5a.text));
    check('contiene el link huasteca-potosina.com/tours', /https:\/\/www\.huasteca-potosina\.com\/tours/.test(e5a.text));
    check('precios nuevos (Tamul $1,550, Surrealista $1,400)', e5a.text.includes('$1,550') && e5a.text.includes('$1,400'));
    check('sin precios viejos ($1,450)', !/\$1,450/.test(e5a.text));
    const activeBefore = handler.getSessionFolio(A);
    const recordsBefore = readAll().length;
    const e5b = await turn(A, ['agrégame el tour de Tamul a mi reserva']);
    check('no se creó cotización', e5b.newRecords.length === 0 && readAll().length === recordsBefore);
    check('no llamó create_reservation_quote', !e5b.tools.some(t => t.name === 'create_reservation_quote'));
    const active = activeBefore ? byFolio(activeBefore) : null;
    check('la cotización vigente sigue igual, sin tours', !active || (active.status === 'PENDIENTE_PAGO' && !active.tours?.length));
    check('remite al WhatsApp de tours', /489 125 1458/.test(e5b.text));
    const r5 = e5b.results[e5b.results.length - 1];
    note(`requiresTourNotification=${r5?.requiresTourNotification}`);
    check('avisa al equipo de tours (requiresTourNotification)', r5?.requiresTourNotification === true);
  }

  // E6 — comprobante PDF + "ya quedó el pago" → acuse sin modelo y aviso al grupo
  if (want('E6')) {
    scenario('E6', 'PDF de comprobante + "ya quedó el pago"');
    const sessionFolio = handler.getSessionFolio(A);
    const before = {
      hm: hmCalls.length, replies: replies.length, api: apiLog.length, results: results.length,
      records: readAll().length, page: page.requests.length, group: groupSent.length, hotel: hotelSent.length,
    };
    T('');
    T('  👤 Ana:');
    T('     > [PDF comprobante.pdf]');
    T('     > ya quedó el pago');
    const media = { mimetype: 'application/pdf', data: 'JVBERi0xLjQK', filename: 'comprobante.pdf' };
    const proof = await proofs.process({ chatId: A, userName: 'Ana', contactNumber: users.get(A).contactNumber, sessionFolio, media, mimetype: 'application/pdf', caption: '' });
    check('proofs.process ubicó el folio vigente', Boolean(proof.folio) && proof.folio === (quoteA2?.folio || quoteA1?.folio), `folio=${proof.folio}`);
    check('aviso al grupo AL LLEGAR el archivo (antes de la ráfaga)', groupSent.slice(before.group).some(g => g.kind === 'comprobante'));
    bursts.push(A, { type: 'proof', folio: proof.folio, kind: 'pdf', ackText: proof.ackText }, metaFor(A));
    await sleep(300);
    bursts.push(A, { type: 'text', text: 'ya quedó el pago' }, metaFor(A));
    const t0 = Date.now();
    await waitIdle(A);
    const e6 = collectTurn(A, before, t0);
    check('no se llamó al modelo', e6.hm.length === 0 && e6.apiCalls === 0, `handleMessage=${e6.hm.length} api=${e6.apiCalls}`);
    check('exactamente 1 respuesta (el acuse)', e6.replies.length === 1, `respuestas=${e6.replies.length}`);
    const rec = proof.folio ? byFolio(proof.folio) : null;
    if (rec) {
      for (const needle of [rec.folio, 'Total', 'Anticipo', 'Saldo', 'verificar', 'confirmación']) {
        check(`el acuse contiene "${needle}"`, e6.text.includes(needle));
      }
      check('el acuse trae los montos del registro', e6.text.includes(money(rec.totalPrice)) && e6.text.includes(money(rec.depositAmount)) && e6.text.includes(money(rec.saldo)));
      check('registro: proofReceivedAt guardado', Boolean(rec.proofReceivedAt));
      const alert = groupSent.slice(before.group).find(g => g.kind === 'comprobante');
      check('aviso al grupo con "/confirmar FOLIO"', Boolean(alert && String(alert.content).includes(`/confirmar ${rec.folio}`)));
      check('el PDF llegó al número del hotel con caption', hotelSent.slice(before.hotel).some(h => typeof h.content === 'object' && /Comprobante/.test(h.options?.caption || '')));
      check('sin ofrecer tours en el acuse', !/tour/i.test(e6.text));
    }
  }

  // E7 — 1 noche para 2 → pago 100% y saldo $0
  if (want('E7')) {
    scenario('E7', '1 noche para 2 personas → 100% y saldo $0');
    const e7a = await turn(B, ['Hola, somos 2 personas del 20 al 21 de noviembre']);
    check('revisó disponibilidad 2026-11-20 → 2026-11-21 con 2 personas', e7a.tools.some(t => t.name === 'check_availability' && t.input.checkin === '2026-11-20' && t.input.checkout === '2026-11-21' && Number(t.input.guests) === 2));
    const e7b0 = await turn(B, ['la primera que me recomiendas, a nombre de Carlos Ruiz Gómez']);
    const e7 = await pushUntilQuote(B, e7b0, { name: 'Carlos Ruiz Gómez', choice: 'la primera' });
    if (e7.extra) note(`hicieron falta ${e7.extra} mensaje(s) extra del cliente para cotizar`);
    const q = [...e7.all].reverse().flatMap(t => t.newRecords).find(r => r.status === 'PENDIENTE_PAGO');
    check('se creó la cotización', Boolean(q), q?.folio || 'sin folio');
    if (q) {
      const rec = byFolio(q.folio);
      check('registro: 1 noche, depositRule "una_noche"', Number(rec.nights) === 1 && rec.depositRule === 'una_noche', `nights=${rec.nights} rule=${rec.depositRule}`);
      check('registro: anticipo = total y saldo 0', rec.depositAmount === rec.totalPrice && rec.saldo === 0, `${money(rec.depositAmount)} / ${money(rec.totalPrice)} / saldo ${rec.saldo}`);
      const text = e7.all.map(t => t.text).join('\n\n');
      check('el texto dice 100% y "Saldo al llegar: $0"', /100%/.test(text) && /Saldo al llegar: \$0/.test(text));
      check('el texto trae el total del registro', text.includes(money(rec.totalPrice)));
    }
  }

  // E8 — grupo de 34 personas (8+ habitaciones) → 10% y anticipo $5,000
  if (want('E8')) {
    scenario('E8', 'Grupo de 34 personas (8+ habitaciones) → 10% de descuento y anticipo $5,000');
    const e8a = await turn(C, ['Buenas tardes', 'somos un grupo de 34 personas', 'del 6 al 8 de noviembre']);
    check('1 llamada a handleMessage para la ráfaga', e8a.hm.length === 1, `llamadas=${e8a.hm.length}`);
    const ca = e8a.tools.filter(t => t.name === 'check_availability');
    check('check_availability con guests=34', ca.some(t => Number(t.input.guests) === 34 && t.input.checkin === '2026-11-06'), JSON.stringify(ca.map(t => t.input)));
    const e8b0 = await turn(C, ['la opción 1 está bien, a nombre de Laura Méndez Ríos']);
    const e8 = await pushUntilQuote(C, e8b0, { name: 'Laura Méndez Ríos' });
    if (e8.extra) note(`hicieron falta ${e8.extra} mensaje(s) extra del cliente para cotizar`);
    const q = [...e8.all].reverse().flatMap(t => t.newRecords).find(r => r.status === 'PENDIENTE_PAGO');
    check('se creó la cotización', Boolean(q), q?.folio || 'sin folio');
    if (q) {
      const rec = byFolio(q.folio);
      const people = rec.rooms.reduce((s, r) => s + Number(r.guests || 0), 0);
      check('8+ habitaciones para 34 personas', rec.rooms.length >= 8 && people === 34, `habitaciones=${rec.rooms.length} personas=${people}`);
      check('descuento 10% del hospedaje', rec.discount > 0 && rec.discount === Math.round(rec.subtotal * 0.1) && rec.totalPrice === rec.subtotal - rec.discount, `subtotal=${rec.subtotal} desc=${rec.discount} total=${rec.totalPrice}`);
      check('anticipo $5,000 (regla grupo) y saldo = total − 5,000', rec.depositAmount === 5000 && rec.depositRule === 'grupo' && rec.saldo === rec.totalPrice - 5000, `anticipo=${rec.depositAmount} regla=${rec.depositRule} saldo=${rec.saldo}`);
      const text = e8.all.map(t => t.text).join('\n\n');
      check('el texto muestra "Descuento de grupo" y "$5,000"', /Descuento de grupo/.test(text) && text.includes('$5,000'));
      const holds = holdRequestsFor(rec.folio);
      check('un solo POST de apartado con todos los cuartos', holds.length === 1 && holds[0].body.segments.reduce((s, seg) => s + seg.rooms.length, 0) === rec.rooms.length);
    }
  }
}

// ── Correr ─────────────────────────────────────────────────
let fatal = null;
T(`Simulador de conversaciones de Camila — ${RUN_STARTED.toISOString()}`);
T(`Página falsa: http://127.0.0.1:${PORT} · reservas: ${process.env.RESERVATIONS_FILE}`);
T(MODEL_MODE === 'real'
  ? 'Modelo: el de claude-handler.js con la API REAL de Anthropic · ráfaga: 1.5 s de silencio, tope 8 s'
  : 'Modelo: GUION FALSO (scripts/sim-fake-model.js, sin red) — prueba el código, NO el criterio del modelo · ráfaga: 1.5 s, tope 8 s');
progress(`Modo de modelo: ${MODEL_MODE}`);

// Antes de gastar tiempo: ¿la cuenta de Anthropic responde? (misma micro-llamada que el
// health check de index.js). Si no, se para aquí con el motivo real.
if (MODEL_MODE === 'real') {
  try {
    await modelClient.messages.create({ model: 'claude-sonnet-5', max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] });
    T('Preflight de Anthropic: OK');
  } catch (err) {
    const reason = String(err?.message || err).slice(0, 600);
    T(`💥 Preflight de Anthropic FALLÓ: ${reason}`);
    origError(`💥 La API de Anthropic no responde con la clave del .env: ${reason}`);
    writeTranscript();
    server.close();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* temporal */ }
    process.exit(3);
  }
}
try {
  await runScenarios();
} catch (err) {
  fatal = err;
  T('');
  T(`💥 ERROR FATAL: ${err?.stack || err}`);
  origError('💥', err);
}

currentScenario = 'GLOBAL';
T('');
T('════════════════════════════════════════════════════════════════');
T('GLOBAL — revisión de TODAS las respuestas');
T('════════════════════════════════════════════════════════════════');
const problems = reviewTexts();
for (const p of problems) T(`   · ${p}`);
check(`respuestas sin voseo, "sistema", "herramienta", "API", "3 horas", precios viejos ni montos inventados (${replies.length} respuestas)`, problems.length === 0, `${problems.length} problema(s)`);
check('sin errores de ráfaga (onError)', burstErrors.length === 0, burstErrors.map(e => e.err?.message).join(' | '));
check('ninguna llamada 401 de la página (token)', !page.requests.some(r => /temporary-block/.test(r.path) && String(r.body?.sessionId || '').startsWith('wa-') && r.headers['x-agent-token'] !== 'test-token'));
const realMtimeAfter = fs.existsSync(REAL_RESERVATIONS) ? fs.statSync(REAL_RESERVATIONS).mtimeMs : null;
check('reservations.json real intacto', realMtimeBefore === realMtimeAfter);
if (fatal) check('sin error fatal', false, String(fatal?.message || fatal));

// Uso de tokens
const usage = apiLog.reduce((acc, e) => {
  const u = e.resp?.usage || {};
  acc.input += u.input_tokens || 0;
  acc.output += u.output_tokens || 0;
  acc.cacheRead += u.cache_read_input_tokens || 0;
  acc.cacheWrite += u.cache_creation_input_tokens || 0;
  return acc;
}, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });

T('');
T('════════════════════════════════════════════════════════════════');
T('RESUMEN');
T('════════════════════════════════════════════════════════════════');
const byScenario = new Map();
for (const c of checks) {
  if (!byScenario.has(c.scenario)) byScenario.set(c.scenario, { pass: 0, fail: [] });
  const s = byScenario.get(c.scenario);
  if (c.ok) s.pass++; else s.fail.push(c.name + (c.detail ? ` (${c.detail})` : ''));
}
for (const [id, s] of byScenario) {
  const line = `${s.fail.length ? '❌' : '✅'} ${id}: ${s.pass} pass, ${s.fail.length} fail${s.fail.length ? ` — ${s.fail.join(' | ')}` : ''}`;
  T(line);
  progress(line);
}
const totalFail = checks.filter(c => !c.ok).length;
T(`Llamadas a la API: ${apiLog.length} · tokens entrada ${usage.input} · caché leída ${usage.cacheRead} · caché escrita ${usage.cacheWrite} · salida ${usage.output}`);
T(`Duración: ${((Date.now() - RUN_STARTED.getTime()) / 1000).toFixed(0)} s`);
progress(`Total: ${checks.length - totalFail} pass, ${totalFail} fail · API ${apiLog.length} llamadas · transcripción: ${OUT_FILE}`);

writeTranscript();
server.close();
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* temporal */ }
process.exit(totalFail ? 1 : 0);
