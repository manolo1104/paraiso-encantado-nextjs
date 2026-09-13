// Pruebas de integración de claude-handler.js: disponibilidad con opciones para grupos,
// cotización (validaciones, verificación, apartado, reemplazo, grupo, choque) y el texto
// final de handleMessage. SIN red: página falsa con node:http, Google vacío, reservas en
// un archivo temporal y un cliente de Anthropic falso.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

// ── Página falsa (check-availability, apartados y bot-status) ──────────
const page = {
  requests: [],          // { path, headers, body }
  blocked: new Set(),    // backendNames ocupados en Reservas/OTA (para check-availability)
  holds: new Map(),      // sessionId -> [{ room, date }]
  checkIgnoresHolds: false, // simula la carrera: la consulta no ve un apartado que sí existe
  failHold: false,       // la página responde 500 al crear el apartado
  reset() {
    this.requests = [];
    this.blocked = new Set();
    this.holds = new Map();
    this.checkIgnoresHolds = false;
    this.failHold = false;
  }
};

function nightsOf(checkin, checkout) {
  const out = [];
  for (let d = new Date(`${checkin}T12:00:00Z`); d < new Date(`${checkout}T12:00:00Z`); d = new Date(d.getTime() + 86400000)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function rowsFromBody(body) {
  const segments = Array.isArray(body.segments) && body.segments.length
    ? body.segments
    : [{ checkin: body.checkin, checkout: body.checkout, rooms: body.rooms }];
  const rows = [];
  for (const s of segments) {
    for (const room of s.rooms || []) {
      for (const date of nightsOf(s.checkin, s.checkout)) rows.push({ room, date });
    }
  }
  return rows;
}

function handlePage(req, res, body) {
  const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  page.requests.push({ path: req.url, method: req.method, headers: req.headers, body });

  if (req.url === '/api/admin/bot-status') return json(200, { enabled: true });

  if (req.url === '/api/check-availability') {
    const nights = nightsOf(body.checkin, body.checkout);
    const unavailable = (body.rooms || []).filter(room => {
      if (page.blocked.has(room)) return true;
      if (page.checkIgnoresHolds) return false;
      for (const [sessionId, rows] of page.holds) {
        if (sessionId === body.sessionId) continue; // excluye el apartado propio
        if (rows.some(r => r.room === room && nights.includes(r.date))) return true;
      }
      return false;
    });
    return json(200, { unavailableRooms: unavailable });
  }

  if (req.url === '/api/create-temporary-block') {
    if (page.failHold) return json(500, { error: 'falla simulada' });
    const isWa = String(body.sessionId || '').startsWith('wa-');
    if (isWa && req.headers['x-agent-token'] !== 'test-token') return json(401, { error: 'agent_token_required' });
    const rows = rowsFromBody(body);
    const conflicts = [];
    for (const [sessionId, other] of page.holds) {
      if (sessionId === body.sessionId) continue;
      for (const r of rows) if (other.some(o => o.room === r.room && o.date === r.date)) conflicts.push(r);
    }
    if (conflicts.length) {
      return json(200, { success: false, message: 'No se pudo crear el bloqueo temporal: hay habitaciones apartadas por otra sesión', expiresAt: null, holdMinutes: 180, expiresInSeconds: null, conflicts });
    }
    page.holds.set(body.sessionId, rows);
    const expiresAt = new Date(Date.now() + 180 * 60000).toISOString();
    return json(200, { success: true, message: 'Bloqueo temporal creado (180 minutos)', expiresAt, holdMinutes: 180, expiresInSeconds: 10800, conflicts: [] });
  }

  if (req.url === '/api/remove-temporary-block') {
    const isWa = String(body.sessionId || '').startsWith('wa-');
    if (isWa && req.headers['x-agent-token'] !== 'test-token') return json(401, { error: 'agent_token_required' });
    page.holds.delete(body.sessionId);
    return json(200, { success: true });
  }

  return json(404, { error: 'no existe' });
}

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
    handlePage(req, res, body);
  });
});

// ── Cliente de Anthropic falso ─────────────────────────────
function fakeAnthropic(script) {
  const calls = [];
  return {
    calls,
    messages: {
      async create(params) {
        calls.push(JSON.parse(JSON.stringify(params)));
        const step = script[calls.length - 1];
        if (!step) throw new Error(`llamada extra a Anthropic (#${calls.length})`);
        return typeof step === 'function' ? step(params) : step;
      }
    }
  };
}
const toolUse = (name, input, id = 'tu_1') => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id, name, input }] });
const endTurn = (text) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] });

// ── Carga del módulo con el entorno de prueba ANTES del import ──
let handler;
let T;
let reservations;
let HOTEL_SYSTEM_PROMPT;
let tmpDir;
const silenced = {};

const USER = '5214891112233@c.us';
const IN = '2027-10-08';
const OUT = '2027-10-10';

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'handler-int-'));
  process.env.RESERVATIONS_FILE = path.join(tmpDir, 'reservations.json');
  for (const k of ['GOOGLE_SHEETS_CREDENTIALS', 'GOOGLE_SHEET_ID', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'CLIP_PAYMENT_LINK']) process.env[k] = '';
  process.env.BOOKING_API_URL = `http://127.0.0.1:${port}`;
  process.env.AGENT_API_TOKEN = 'test-token';
  process.env.ANTHROPIC_API_KEY = 'sk-test-falsa';

  // Los avisos de "no hay credenciales de Google" ensucian la salida de las pruebas.
  for (const k of ['log', 'warn']) { silenced[k] = console[k]; console[k] = () => {}; }

  handler = await import('../claude-handler.js');
  T = handler.__test;
  reservations = await import('../reservations.js');
  ({ HOTEL_SYSTEM_PROMPT } = await import('../hotel-knowledge.js'));
});

after(async () => {
  for (const k of Object.keys(silenced)) console[k] = silenced[k];
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  page.reset();
  try { fs.rmSync(process.env.RESERVATIONS_FILE, { force: true }); } catch { /* sin archivo */ }
  T.resetState();
});

const allRecords = () => (fs.existsSync(process.env.RESERVATIONS_FILE) ? JSON.parse(fs.readFileSync(process.env.RESERVATIONS_FILE, 'utf8')) : []);
const reqsTo = (p) => page.requests.filter(r => r.path === p);

async function quote(input, userId = USER, opts = {}) {
  return T.executeTool('create_reservation_quote', { guest_name: 'Ana López', checkin: IN, checkout: OUT, rooms: [{ room_id: 'jungla', guests: 2 }], ...input }, userId, 'Ana', opts);
}

// ── check_availability ─────────────────────────────────────

test('check_availability con 5 personas devuelve room_options y manda el sessionId del apartado propio', async () => {
  const first = await T.executeTool('check_availability', { checkin: IN, checkout: OUT, guests: 5 }, USER, 'Ana');
  assert.equal(first.available, true);
  assert.ok(Array.isArray(first.room_options) && first.room_options.length >= 1, 'trae room_options');
  assert.equal(first.group_fits, true);
  assert.equal(first.room_options[0].rooms_count, 1);
  assert.equal(first.room_options[0].rooms[0].id, 'helechos-1');
  assert.equal(first.room_options[0].rooms[0].price_per_night, 2700);
  assert.equal(first.room_options[0].total_stay, 5400);
  assert.equal(first.available_rooms.find(r => r.id === 'jungla').fits_alone, false);
  assert.equal(first.available_rooms.find(r => r.id === 'helechos-1').fits_alone, true);
  const checkNoQuote = reqsTo('/api/check-availability').at(-1);
  assert.equal(checkNoQuote.body.sessionId, undefined, 'sin cotización no se excluye nada');
  assert.equal(checkNoQuote.headers['x-agent-token'], 'test-token');

  const created = await quote({ rooms: [{ room_id: 'helechos-1', guests: 5 }] });
  assert.equal(created.quote_created, true);

  await T.executeTool('check_availability', { checkin: '2027-10-09', checkout: '2027-10-11', guests: 5 }, USER, 'Ana');
  const checkWithQuote = reqsTo('/api/check-availability').at(-1);
  assert.equal(checkWithQuote.body.sessionId, `wa-${created.folio}`);
  // Su propio apartado NO le marca Helechos I como ocupada
  const again = await T.executeTool('check_availability', { checkin: IN, checkout: OUT, guests: 5 }, USER, 'Ana');
  assert.equal(again.room_options[0].rooms[0].id, 'helechos-1');
});

test('check_availability con cotización vigente dice si SUS habitaciones siguen libres en las fechas nuevas', async () => {
  const created = await quote({ rooms: [{ room_id: 'helechos-1', guests: 5 }] });
  assert.equal(created.quote_created, true);

  // Misma fecha: no hace falta el aviso.
  const same = await T.executeTool('check_availability', { checkin: IN, checkout: OUT, guests: 5 }, USER, 'Ana');
  assert.equal(same.cotizacion_vigente, undefined);

  // Otras fechas con Helechos 1 ocupada → false y la nota lo dice.
  page.blocked.add('Helechos 1');
  const busy = await T.executeTool('check_availability', { checkin: '2027-10-15', checkout: '2027-10-17', guests: 5 }, USER, 'Ana');
  assert.equal(busy.cotizacion_vigente.folio, created.folio);
  assert.equal(busy.cotizacion_vigente.mismas_habitaciones_disponibles, false);
  assert.match(busy.cotizacion_vigente.nota, /Helechos I Familiar\) NO están disponibles/);
  assert.ok(busy.room_options?.length, 'igual ofrece otras opciones para el grupo');

  // Otras fechas libres → true.
  page.blocked.clear();
  const free = await T.executeTool('check_availability', { checkin: '2027-10-22', checkout: '2027-10-24', guests: 5 }, USER, 'Ana');
  assert.equal(free.cotizacion_vigente.mismas_habitaciones_disponibles, true);

  // Con comprobante ya no aplica (los cambios los ve el equipo).
  reservations.markPaymentProofReceived({ folio: created.folio });
  const paid = await T.executeTool('check_availability', { checkin: '2027-10-22', checkout: '2027-10-24', guests: 5 }, USER, 'Ana');
  assert.equal(paid.cotizacion_vigente, undefined);
});

test('check_availability de OTRA habitación (room_ids) no niega la suite de la cotización vigente', async () => {
  const created = await quote({}); // Jungla del 8 al 10
  assert.equal(created.quote_created, true);

  // Pregunta por Lajas en otras fechas; Jungla está libre en esas fechas.
  const lajas = await T.executeTool('check_availability', { checkin: '2027-10-14', checkout: '2027-10-16', room_ids: ['suite-lajas'], guests: 2 }, USER, 'Ana');
  assert.notEqual(lajas.cotizacion_vigente?.mismas_habitaciones_disponibles, false, 'no debía decir que Jungla NO está disponible');
  assert.equal(lajas.cotizacion_vigente.mismas_habitaciones_disponibles, true);
  assert.match(lajas.cotizacion_vigente.nota, /Suite Jungla\) SÍ están libres/);
  const checks = reqsTo('/api/check-availability').slice(-2);
  assert.deepEqual(checks[0].body.rooms, ['Suite Lajas'], 'la consulta del modelo');
  assert.deepEqual(checks[1].body.rooms, ['Jungla'], 'consulta extra con las habitaciones de la cotización');
  assert.equal(checks[1].body.sessionId, `wa-${created.folio}`, 'excluye su propio apartado');
  assert.equal(checks[1].body.checkin, '2027-10-14');

  // Si Jungla sí está ocupada en esas fechas, ahí sí es false.
  page.blocked.add('Jungla');
  const busy = await T.executeTool('check_availability', { checkin: '2027-10-14', checkout: '2027-10-16', room_ids: ['suite-lajas'], guests: 2 }, USER, 'Ana');
  assert.equal(busy.cotizacion_vigente.mismas_habitaciones_disponibles, false);

  // room_ids que ya incluyen su suite: sin consulta extra.
  page.blocked.clear();
  const before = reqsTo('/api/check-availability').length;
  const both = await T.executeTool('check_availability', { checkin: '2027-10-14', checkout: '2027-10-16', room_ids: ['jungla', 'suite-lajas'], guests: 2 }, USER, 'Ana');
  assert.equal(reqsTo('/api/check-availability').length, before + 1);
  assert.equal(both.cotizacion_vigente.mismas_habitaciones_disponibles, true);
});

test('check_availability guarda últimas fechas, personas y opciones ofrecidas en la sesión', async () => {
  const eight = await T.executeTool('check_availability', { checkin: IN, checkout: OUT, guests: 8 }, USER, 'Ana');
  assert.ok(eight.room_options.every(o => o.rooms_count >= 2), '8 personas no caben en una suite');
  const line = T.buildStageLine(USER);
  assert.equal(line.includes('EN COTIZACIÓN'), true);

  // Lo que ve el modelo en el bloque dinámico del prompt
  const fake = fakeAnthropic([endTurn('¿Cuál te late? 🌿')]);
  T.setAnthropicClient(fake);
  await handler.handleMessage(USER, 'ok', 'Ana');
  const dynamic = fake.calls[0].system[1].text;
  assert.ok(dynamic.includes(`📅 Últimas fechas consultadas: check-in ${IN}, check-out ${OUT}.`));
  assert.ok(dynamic.includes('👥 Personas de la última consulta: 8.'));
  assert.match(dynamic, /Opciones ofrecidas: 1\) /);
  assert.ok(!dynamic.includes('FECHAS CONFIRMADAS'));
  assert.equal(fake.calls[0].system[0].text, HOTEL_SYSTEM_PROMPT(), 'bloque cacheado = prompt estático');

  const res = await T.executeTool('check_availability', { checkin: IN, checkout: OUT, guests: 80 }, USER, 'Ana');
  assert.equal(res.group_fits, false);
  assert.equal(typeof res.capacity_available, 'number');
  assert.match(res.message, /NO alcanzan/);
});

// ── create_reservation_quote: validaciones sin folio ────────

test('sin nombre → falta_nombre y sin folio ni apartado', async () => {
  const res = await quote({ guest_name: 'A' });
  assert.equal(res.error, 'falta_nombre');
  assert.equal(res.quote_created, false);
  assert.equal(res.folio, undefined);
  assert.equal(allRecords().length, 0);
  assert.equal(reqsTo('/api/create-temporary-block').length, 0);
});

test('capacidad excedida y suite repetida → error sin folio', async () => {
  const over = await quote({ rooms: [{ room_id: 'jungla', guests: 5 }] });
  assert.equal(over.error, 'capacidad_excedida');
  assert.equal(over.max_occupancy, 4);
  const dup = await quote({ rooms: [{ room_id: 'lirios-1', guests: 2 }, { room_id: 'lirios-1', guests: 2 }] });
  assert.equal(dup.error, 'habitacion_repetida');
  const unknown = await quote({ rooms: [{ room_id: 'orquideas-1', guests: 2 }] });
  assert.equal(unknown.error, 'habitacion_desconocida');
  assert.equal(allRecords().length, 0);
});

test('fechas por habitación que dejan noches sin cuarto → noches_sin_habitacion sin folio', async () => {
  // "Una noche más": checkout global al 11 pero Jungla con sus fechas viejas (8→10).
  const gap = await quote({ checkout: '2027-10-11', rooms: [{ room_id: 'jungla', guests: 2, checkin: IN, checkout: OUT }] });
  assert.equal(gap.error, 'noches_sin_habitacion');
  assert.equal(gap.quote_created, false);
  assert.deepEqual(gap.missing_nights, ['2027-10-10']);
  assert.match(gap.message, /faltan: 2027-10-10/);
  assert.match(gap.message, /No se generó folio/);
  assert.equal(gap.folio, undefined);
  assert.equal(allRecords().length, 0);
  assert.equal(reqsTo('/api/create-temporary-block').length, 0);
  assert.equal(reqsTo('/api/check-availability').length, 0, 'ni siquiera verifica');

  // Hueco a la mitad de un cambio de suite
  const middle = await quote({ checkout: '2027-10-11', rooms: [
    { room_id: 'jungla', guests: 2, checkin: IN, checkout: '2027-10-09' },
    { room_id: 'suite-lajas', guests: 2, checkin: OUT, checkout: '2027-10-11' },
  ] });
  assert.deepEqual(middle.missing_nights, ['2027-10-09']);

  // Grupo donde un cuarto se queda menos noches pero otro cubre todas: sí se cotiza
  const group = await quote({ checkout: '2027-10-11', rooms: [
    { room_id: 'jungla', guests: 2 },
    { room_id: 'suite-lajas', guests: 2, checkin: IN, checkout: OUT },
  ] });
  assert.equal(group.quote_created, true, JSON.stringify(group));
});

test('mandan las fechas del modelo aunque la sesión tenga otras', async () => {
  await T.executeTool('check_availability', { checkin: IN, checkout: OUT, guests: 2 }, USER, 'Ana');
  const res = await quote({ checkin: '2027-10-15', checkout: '2027-10-17' });
  assert.equal(res.quote_created, true);
  const rec = reservations.getByFolio(res.folio);
  assert.equal(rec.checkin, '2027-10-15');
  assert.equal(rec.checkout, '2027-10-17');
  assert.equal(reqsTo('/api/check-availability').at(-1).body.checkin, '2027-10-15', 'verificó las fechas nuevas');
});

test('no disponible → no_disponible sin folio, con otras opciones', async () => {
  page.blocked.add('Jungla');
  const res = await quote({});
  assert.equal(res.error, 'no_disponible');
  assert.equal(res.quote_created, false);
  assert.ok(res.unavailable.some(u => u.backendName === 'Jungla'));
  assert.ok(res.other_options && res.other_options.available === true);
  assert.equal(res.previous_quote, null);
  assert.equal(allRecords().length, 0);
  assert.equal(reqsTo('/api/create-temporary-block').length, 0);
  assert.equal(handler.getSessionFolio(USER), null);
});

// ── create_reservation_quote: cotización creada ─────────────

test('ok → folio PENDIENTE_PAGO con saldo, depositRule, apartado con token y segments, y resumen', async () => {
  const res = await quote({}, USER, { contactNumber: '5214891112233' });
  assert.equal(res.quote_created, true);
  assert.match(res.folio, /^WA-/);
  assert.equal(res.total, 3800);
  assert.equal(res.anticipo, 1900);
  assert.equal(res.saldo, 1900);
  assert.equal(res.deposit_rule, '50');
  assert.equal(res.block_confirmed, true);
  assert.equal(typeof res.hold_expires_at, 'string');
  assert.match(res.instruccion, /SOLO 1–2 líneas/);

  const rec = reservations.getByFolio(res.folio);
  assert.equal(rec.status, 'PENDIENTE_PAGO');
  assert.equal(rec.saldo, 1900);
  assert.equal(rec.depositRule, '50');
  assert.equal(rec.totalPrice, 3800);
  assert.equal(rec.waNumber, '5214891112233');
  assert.equal(rec.blockConfirmed, true);
  assert.ok(rec.holdExpiresAt);
  assert.deepEqual(rec.tours, []);

  const hold = reqsTo('/api/create-temporary-block');
  assert.equal(hold.length, 1, 'UNA sola llamada de apartado');
  assert.equal(hold[0].headers['x-agent-token'], 'test-token');
  assert.equal(hold[0].body.sessionId, `wa-${res.folio}`);
  assert.deepEqual(hold[0].body.segments, [{ checkin: IN, checkout: OUT, rooms: ['Jungla'] }]);
  assert.deepEqual(hold[0].body.rooms, ['Jungla']);

  const { resumen, quoteView } = res._turn;
  for (const s of ['Total', 'Anticipo', 'Saldo', 'CLABE', res.folio]) assert.ok(resumen.includes(s), `el resumen no trae ${s}`);
  assert.equal(quoteView.folio, res.folio);
  assert.equal(quoteView.saldo, 1900);
  assert.equal(quoteView.rooms[0].pricePerNight, 1900);
  assert.equal(quoteView.rooms[0].price, 3800);
  assert.equal(handler.getSessionFolio(USER), res.folio);
});

test('1 noche → pago del 100% y saldo 0', async () => {
  const res = await quote({ checkout: '2027-10-09' });
  assert.equal(res.deposit_rule, 'una_noche');
  assert.equal(res.anticipo, 1900);
  assert.equal(res.saldo, 0);
});

test('segunda cotización con otras fechas → la anterior REEMPLAZADA y su apartado liberado', async () => {
  const first = await quote({});
  const second = await quote({ checkin: '2027-10-20', checkout: '2027-10-22' });
  assert.equal(second.quote_created, true);
  assert.equal(second.superseded_folio, first.folio);
  const old = reservations.getByFolio(first.folio);
  assert.equal(old.status, 'REEMPLAZADA');
  assert.equal(old.supersededBy, second.folio);
  assert.equal(reservations.getByFolio(second.folio).supersedes, first.folio);
  const removes = reqsTo('/api/remove-temporary-block');
  assert.equal(removes.length, 1);
  assert.equal(removes[0].body.sessionId, `wa-${first.folio}`);
  assert.equal(removes[0].headers['x-agent-token'], 'test-token');
  assert.equal(page.holds.has(`wa-${first.folio}`), false);
  assert.equal(second._turn.supersededCheckin, IN);
  assert.equal(second._turn.supersededCheckout, OUT);
});

test('cambio de personas en la MISMA suite y fechas: el apartado propio no bloquea la nueva cotización', async () => {
  const first = await quote({});
  const second = await quote({ rooms: [{ room_id: 'jungla', guests: 3 }] });
  assert.equal(second.quote_created, true, JSON.stringify(second));
  assert.equal(second.total, 4800);
  assert.equal(reservations.getByFolio(first.folio).status, 'REEMPLAZADA');
  assert.equal(page.holds.has(`wa-${second.folio}`), true);
  assert.equal(page.holds.has(`wa-${first.folio}`), false);
});

test('con comprobante previo → modificacion_requiere_equipo, sin folio nuevo', async () => {
  const first = await quote({});
  reservations.markPaymentProofReceived({ folio: first.folio });
  const res = await quote({ checkin: '2027-10-20', checkout: '2027-10-22' });
  assert.equal(res.error, 'modificacion_requiere_equipo');
  assert.equal(res.requires_human, true);
  assert.equal(res.previous_folio, first.folio);
  assert.equal(allRecords().length, 1);
  assert.equal(reservations.getByFolio(first.folio).status, 'PENDIENTE_PAGO');
  assert.equal(T.deriveConversationStage(USER).stage, 'pago_en_verificacion');
});

test('8 habitaciones → 10% de descuento y anticipo de $5,000', async () => {
  const ids = ['suite-flor-de-liz-1', 'suite-flor-de-liz-2', 'suite-lindavista', 'suite-lajas', 'jungla', 'lirios-1', 'lirios-2', 'orquideas-2'];
  const res = await quote({ rooms: ids.map(id => ({ room_id: id, guests: 2 })) });
  assert.equal(res.quote_created, true, JSON.stringify(res));
  // (5 × 1,900 + 3 × 1,500) × 2 noches = 28,000 → −2,800 = 25,200
  assert.equal(res.total, 25200);
  assert.equal(res.anticipo, 5000);
  assert.equal(res.saldo, 20200);
  assert.equal(res.deposit_rule, 'grupo');
  const rec = reservations.getByFolio(res.folio);
  assert.equal(rec.discount, 2800);
  assert.equal(rec.subtotal, 28000);
  assert.match(res._turn.resumen, /Descuento de grupo/);
});

test('choque de apartado con otra sesión → CANCELADA y no_disponible', async () => {
  page.checkIgnoresHolds = true;
  page.holds.set('sess_web_otro', [{ room: 'Jungla', date: IN }]);
  const res = await quote({});
  assert.equal(res.error, 'no_disponible');
  assert.equal(res.reason, 'apartado_en_conflicto');
  assert.equal(res.quote_created, false);
  const recs = allRecords();
  assert.equal(recs.length, 1);
  assert.equal(recs[0].status, 'CANCELADA');
  assert.equal(recs[0].cancelReason, 'apartado_en_conflicto');
  assert.equal(handler.getSessionFolio(USER), null);
  assert.equal(T.deriveConversationStage(USER).stage, 'nuevo', 'una cancelada no cuenta como cotización');
});

test('choque al cambiar de fechas → la cotización anterior sigue vigente con su apartado', async () => {
  const first = await quote({});
  page.checkIgnoresHolds = true;
  page.holds.set('sess_web_otro', [{ room: 'Jungla', date: '2027-10-20' }]);
  const res = await quote({ checkin: '2027-10-20', checkout: '2027-10-22' });
  assert.equal(res.error, 'no_disponible');
  assert.equal(res.previous_quote.folio, first.folio);
  assert.equal(reservations.getByFolio(first.folio).status, 'PENDIENTE_PAGO');
  assert.equal(page.holds.has(`wa-${first.folio}`), true, 'no se soltó su apartado');
  assert.equal(reqsTo('/api/remove-temporary-block').length, 0);
  const { stage, r } = T.deriveConversationStage(USER);
  assert.equal(stage, 'cotizacion_pendiente_pago');
  assert.equal(r.folio, first.folio, 'la CANCELADA no tapa a la vigente');
  assert.equal(handler.getSessionFolio(USER), first.folio);
  // Tras un redeploy (sin sesión en memoria) tampoco: se busca en el archivo.
  T.resetState();
  assert.equal(T.deriveConversationStage(USER).r?.folio, first.folio);
});

test('etapas: vigente, vieja (7+ días) y reemplazada', async () => {
  const first = await quote({});
  const stage = T.deriveConversationStage(USER);
  assert.equal(stage.stage, 'cotizacion_pendiente_pago');
  const line = T.buildStageLine(USER);
  for (const s of ['1) llama check_availability', 'saldo al llegar', first.folio, '$1,900 MXN']) assert.ok(line.includes(s), `falta ${s}`);

  reservations.updateReservation(first.folio, { createdAt: new Date(Date.now() - 8 * 86400000).toISOString() });
  assert.notEqual(T.deriveConversationStage(USER).stage, 'cotizacion_pendiente_pago');

  reservations.updateReservation(first.folio, { createdAt: new Date().toISOString(), status: 'REEMPLAZADA' });
  assert.notEqual(T.deriveConversationStage(USER).stage, 'cotizacion_pendiente_pago');
});

test('buildStageLine: apartado vigente, vencido/sin hora y sin apartado confirmado', async () => {
  const first = await quote({});
  const rec = reservations.getByFolio(first.folio);
  assert.equal(rec.blockConfirmed, true);

  // 1) Vigente: apartada, sin motor web, no la genera de nuevo
  const active = T.buildStageLine(USER);
  assert.match(active, /apartada hasta las/);
  assert.match(active, /su suite está apartada a su folio/);
  assert.match(active, /NO la generes de nuevo/);
  assert.doesNotMatch(active, /YA NO está vigente/);

  // 2a) Vencido: no afirma apartado, pide check_availability y re-cotizar
  reservations.updateReservation(first.folio, { holdExpiresAt: new Date(Date.now() - 60000).toISOString() });
  const expired = T.buildStageLine(USER);
  assert.match(expired, /Su apartado YA NO está vigente: NO digas que su suite sigue apartada ni le pidas pagar todavía/);
  assert.match(expired, /Primero llama check_availability con sus mismas fechas y personas/);
  assert.match(expired, /llama create_reservation_quote con los mismos datos para apartarla de nuevo/);
  assert.doesNotMatch(expired, /su suite está apartada a su folio/);
  assert.doesNotMatch(expired, /NO la generes de nuevo/);
  assert.match(expired, /NO vuelvas a pedir fechas\/personas que ya dio/);

  // 2b) Folio viejo: sin blockConfirmed ni hora
  reservations.updateReservation(first.folio, { holdExpiresAt: null, blockConfirmed: null });
  const legacy = T.buildStageLine(USER);
  assert.match(legacy, /Su apartado YA NO está vigente/);
  assert.doesNotMatch(legacy, /su suite está apartada a su folio/);
  assert.doesNotMatch(legacy, /NO la generes de nuevo/);
  assert.doesNotMatch(legacy, /apartado sin hora registrada/);

  // 2c) blockConfirmed true pero sin hora: tampoco se afirma
  reservations.updateReservation(first.folio, { holdExpiresAt: null, blockConfirmed: true });
  assert.match(T.buildStageLine(USER), /Su apartado YA NO está vigente/);

  // 3) Sin apartado confirmado: texto de siempre
  reservations.updateReservation(first.folio, { holdExpiresAt: null, blockConfirmed: false });
  const noHold = T.buildStageLine(USER);
  assert.match(noHold, /Su habitación NO quedó apartada en el sistema: NO le des datos bancarios/);
  assert.match(noHold, /NO la generes de nuevo/);
  assert.doesNotMatch(noHold, /YA NO está vigente/);

  // Con el apartado vencido, re-cotizar la MISMA suite y fechas sí se puede (excluye su apartado)
  reservations.updateReservation(first.folio, { holdExpiresAt: new Date(Date.now() - 60000).toISOString(), blockConfirmed: true });
  const again = await quote({});
  assert.equal(again.quote_created, true, JSON.stringify(again));
  assert.equal(again.superseded_folio, first.folio);
  assert.equal(page.holds.has(`wa-${again.folio}`), true);
});

// ── Atajos deterministas y prompt ──────────────────────────

test('getDeterministicResponse: una ráfaga con personas y fechas NO recibe respuesta enlatada', () => {
  assert.equal(T.getDeterministicResponse('somos 5 personas del 9 al 11 de octubre', {}), null);
  assert.equal(T.getDeterministicResponse('Hola, somos 12 personas, queremos cotizar para grupo del 9 al 11 de octubre', {}), null);
  assert.equal(T.getDeterministicResponse('¿cuánto cuesta para 4 personas?', {}), null);
  const reservar = T.getDeterministicResponse('quiero reservar', {}, { stage: 'nuevo' });
  assert.match(reservar, /¿Cuántas personas serían/);
  assert.doesNotMatch(reservar, /Opción 2|dos formas/i);
});

test('getDeterministicResponse: "¿qué tours tienen?" con precios al día y contacto de tours', () => {
  const msg = T.getDeterministicResponse('¿qué tours tienen?', {});
  assert.ok(msg.includes('489 125 1458'));
  assert.ok(msg.includes('huasteca-potosina.com/tours'));
  assert.ok(msg.includes('$1,550'));
  assert.ok(!msg.includes('$1,450'));
});

test('getDeterministicResponse: "mi reserva" se arma con el folio real', async () => {
  const res = await quote({});
  const msg = T.getDeterministicResponse('quiero ver mi reserva', { lastFolio: res.folio });
  assert.ok(msg.includes(res.folio));
  assert.ok(msg.includes('$3,800 MXN'));
  assert.match(msg, /pendiente de pago/);
  assert.equal(T.getDeterministicResponse('quiero ver mi reserva', {}), null, 'sin folio lo resuelve el modelo');
});

test('"agrégame el tour de Tamul a mi reserva": remite a tours (no repite la cotización) y avisa al equipo de tours', async () => {
  const res = await quote({});
  const session = { lastFolio: res.folio };
  for (const ask of ['agrégame el tour de Tamul a mi reserva', 'quiero agregar un tour a mi reservación', 'añade la excursión de Tamul a mi cotización']) {
    const msg = T.getDeterministicResponse(ask, session, { stage: 'cotizacion_pendiente_pago' });
    assert.ok(msg, `"${ask}" tiene respuesta fija`);
    assert.ok(msg.includes('489 125 1458'), `"${ask}" manda al WhatsApp de tours`);
    assert.ok(!msg.includes(res.folio), `"${ask}" no contesta con la cotización`);
  }
  // Preguntas informativas de tours NO son "agregar": no reciben ese atajo.
  assert.ok(!String(T.getDeterministicResponse('¿el tour de Tamul incluye comida?', session) || '').includes('Para agregarlos'));
  // "mi reserva" + cambio → lo resuelve el modelo, no la ficha de la cotización.
  assert.equal(T.getDeterministicResponse('quiero cambiar mi reserva', session, { stage: 'cotizacion_pendiente_pago' }), null);

  const fake = fakeAnthropic([]);
  T.setAnthropicClient(fake);
  const result = await handler.handleMessage(USER, 'agrégame el tour de Tamul a mi reserva', 'Ana');
  assert.equal(fake.calls.length, 0);
  assert.equal(result.requiresTourNotification, true, 'quiere reservar un tour → aviso al equipo de tours');
  assert.equal(result.quoteCreated, false);
  const info = await handler.handleMessage(USER, '¿qué tours tienen?', 'Ana');
  assert.equal(info.requiresTourNotification, false, 'solo informar no avisa');
});

test('HOTEL_SYSTEM_PROMPT sin precios ni flujos viejos y determinístico', () => {
  const p = HOTEL_SYSTEM_PROMPT();
  for (const old of ['$1,450', 'Paquete Esencial', 'Opción 2', '3 horas', 'PRECIO HOTEL', 'rellena', 'deposit_amount']) {
    assert.ok(!p.includes(old), `el prompt contiene "${old}"`);
  }
  for (const must of ['489 125 1458', 'https://www.huasteca-potosina.com/paquetes', 'room_options', '1) llama check_availability', '$1,550']) {
    assert.ok(p.includes(must), `al prompt le falta "${must}"`);
  }
  assert.equal(p, HOTEL_SYSTEM_PROMPT());
});

// ── handleMessage de punta a punta (Anthropic falso) ────────

const CONTRACT_KEYS = ['text', 'requiresHumanIntervention', 'requiresTourNotification', 'quoteCreated', 'quoteFolio', 'quoteBlockConfirmed', 'quote', 'supersededFolio', 'supersededCheckin', 'supersededCheckout'].sort();

test('handleMessage con cotización: resumen + línea del modelo (sin montos), contrato y nada interno al modelo', async () => {
  const fake = fakeAnthropic([
    toolUse('create_reservation_quote', { guest_name: 'Ana López', checkin: IN, checkout: OUT, rooms: [{ room_id: 'jungla', guests: 2 }] }),
    endTurn('¡Listo, Ana! Tu total es $3,800 y el folio ya quedó 🌿')
  ]);
  T.setAnthropicClient(fake);
  const result = await handler.handleMessage(USER, 'Ana López', 'Ana', { contactNumber: '5214891112233' });

  assert.deepEqual(Object.keys(result).sort(), CONTRACT_KEYS);
  assert.equal(result.quoteCreated, true);
  assert.equal(result.quoteFolio, result.quote.folio);
  assert.equal(result.quoteBlockConfirmed, true);
  assert.equal(result.quote.saldo, 1900);
  assert.equal(result.quote.guestName, 'Ana López');
  assert.equal(result.supersededFolio, null);
  assert.ok(result.text.includes(`Folio ${result.quoteFolio}`));
  assert.ok(result.text.includes('¿Tienes alguna duda sobre tu reserva? 🌿'), 'la línea con montos se reemplaza');
  assert.ok(!result.text.includes('Tu total es'));
  assert.equal(result.requiresTourNotification, false);

  const toolResult = fake.calls[1].messages.at(-1).content[0];
  assert.equal(toolResult.type, 'tool_result');
  assert.ok(!toolResult.content.includes('_turn'), 'lo interno no va al modelo');
  assert.ok(!toolResult.content.includes('002705700824116647') && !toolResult.content.includes('Tu cotización'), 'el resumen no va al modelo');
  assert.ok(JSON.parse(toolResult.content).quote_created);
});

test('handleMessage con cotización: el link de pago con tarjeta y el monto del anticipo SÍ llegan; repetir el total no', async () => {
  const input = { guest_name: 'Ana López Martínez', checkin: IN, checkout: OUT, rooms: [{ room_id: 'helechos-1', guests: 5 }] };
  const clipLine = 'Aquí tu link de pago con tarjeta: https://clip.mx/x — escribe el monto de *$2,700 MXN*';
  T.setAnthropicClient(fakeAnthropic([toolUse('create_reservation_quote', input), endTurn(clipLine)]));
  const withLink = await handler.handleMessage(USER, 'Ana López Martínez', 'Ana');
  assert.equal(withLink.quoteCreated, true);
  assert.equal(withLink.quote.totalPrice, 5400);
  assert.equal(withLink.quote.depositAmount, 2700);
  assert.ok(withLink.text.includes('https://clip.mx/x'), 'el link de pago con tarjeta no se tira');
  assert.ok(withLink.text.includes(clipLine), 'el monto del anticipo tampoco');
  assert.ok(!withLink.text.includes('¿Tienes alguna duda sobre tu reserva? 🌿'));

  T.resetState();
  T.setAnthropicClient(fakeAnthropic([toolUse('create_reservation_quote', input), endTurn('¡Listo! Total $5,400 🌿')]));
  const repeated = await handler.handleMessage(USER, 'Ana López Martínez', 'Ana');
  assert.equal(repeated.quoteCreated, true);
  assert.ok(repeated.text.endsWith('¿Tienes alguna duda sobre tu reserva? 🌿'), 'repetir el total → fallback');
  assert.ok(!repeated.text.includes('¡Listo! Total'));

  // Helper: CLABE, folio, total y saldo distintos del anticipo se descartan; anticipo y tours no
  const view = { totalPrice: 4800, depositAmount: 2400, saldo: 2400 };
  assert.equal(T.repeatsQuoteData('Tu CLABE ya va arriba', view), true);
  assert.equal(T.repeatsQuoteData('Tu folio WA-ABC123 quedó', view), true);
  assert.equal(T.repeatsQuoteData('El total es $4800', view), true);
  assert.equal(T.repeatsQuoteData('Tu anticipo es de $2,400 MXN', view), false, 'saldo = anticipo: no cuenta');
  assert.equal(T.repeatsQuoteData('El tour a Tamul cuesta $1,550 por persona', view), false);
  assert.equal(T.repeatsQuoteData('Te quedan $14,800 de saldo', view), false, 'otro número que termina igual');
  assert.equal(T.repeatsQuoteData('Saldo $6,000', { totalPrice: 10000, depositAmount: 4000, saldo: 6000 }), true);
});

test('handleMessage sin apartado confirmado: la línea del modelo se cambia aunque traiga el link', async () => {
  page.failHold = true; // la página no pudo crear el apartado → blockConfirmed false
  T.setAnthropicClient(fakeAnthropic([
    toolUse('create_reservation_quote', { guest_name: 'Ana López', checkin: IN, checkout: OUT, rooms: [{ room_id: 'jungla', guests: 2 }] }),
    endTurn('Aquí tu link de pago con tarjeta: https://clip.mx/x — escribe el monto de *$1,900 MXN*')
  ]));
  const result = await handler.handleMessage(USER, 'Ana López', 'Ana');
  assert.equal(result.quoteBlockConfirmed, false);
  assert.ok(result.text.endsWith('Nuestro equipo te confirma la disponibilidad en unos minutos y te avisamos por aquí. 🌿'));
  assert.ok(!result.text.includes('clip.mx'));
});

test('handleMessage: segunda cotización del mismo chat avisa el folio reemplazado', async () => {
  T.setAnthropicClient(fakeAnthropic([
    toolUse('create_reservation_quote', { guest_name: 'Ana López', checkin: IN, checkout: OUT, rooms: [{ room_id: 'jungla', guests: 2 }] }),
    endTurn('¡Listo! 🌿')
  ]));
  const first = await handler.handleMessage(USER, 'Ana López', 'Ana');
  T.setAnthropicClient(fakeAnthropic([
    toolUse('create_reservation_quote', { guest_name: 'Ana López', checkin: '2027-10-20', checkout: '2027-10-22', rooms: [{ room_id: 'jungla', guests: 2 }] }),
    endTurn('¡Hecho, ya quedó con las nuevas fechas! 🌿')
  ]));
  const second = await handler.handleMessage(USER, 'mejor del 20 al 22 de octubre', 'Ana');
  assert.equal(second.supersededFolio, first.quoteFolio);
  assert.equal(second.supersededCheckin, IN);
  assert.equal(second.supersededCheckout, OUT);
  assert.ok(second.text.endsWith('¡Hecho, ya quedó con las nuevas fechas! 🌿'));
});

test('handleMessage: una ráfaga con personas y fechas va al modelo, y el pie de tours se agrega', async () => {
  const fake = fakeAnthropic([endTurn('¡Qué buen plan! Te recomiendo la Expedición Tamul 🌊 ¿Para qué fechas buscas hospedaje?')]);
  T.setAnthropicClient(fake);
  const result = await handler.handleMessage(USER, 'Hola\nsomos 5 personas\ndel 9 al 11 de octubre, ¿qué nos recomiendas?', 'Ana');
  assert.equal(fake.calls.length, 1, 'no se la tragó un atajo');
  assert.ok(result.text.includes('489 125 1458'), 'pie de tours');
  assert.equal(result.requiresTourNotification, false, 'informar de tours no avisa al equipo de tours');
  assert.equal(result.quoteCreated, false);
  assert.equal(result.quote, null);
});

test('handleMessage: modificación con comprobante escala al equipo', async () => {
  const first = await quote({});
  reservations.markPaymentProofReceived({ folio: first.folio });
  T.setAnthropicClient(fakeAnthropic([
    toolUse('create_reservation_quote', { guest_name: 'Ana López', checkin: '2027-10-20', checkout: '2027-10-22', rooms: [{ room_id: 'jungla', guests: 2 }] }),
    endTurn('Esos cambios los ve nuestro equipo; te comunico con ellos. 🤝')
  ]));
  const result = await handler.handleMessage(USER, 'quiero cambiar mis fechas al 20 de octubre', 'Ana');
  assert.equal(result.requiresHumanIntervention, true);
  assert.equal(result.quoteCreated, false);
});
