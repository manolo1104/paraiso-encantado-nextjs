// Pruebas de la ráfaga (conversation-flow.js) con dependencias falsas: sin WhatsApp,
// sin modelo y sin red. Incluye una integración con message-buffer.js (reloj falso) y
// con el procesador real de comprobantes (proof-handler.js) sobre un almacén en memoria.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createBurstHandler,
  buildProofContextNote,
  cleanMediaCaption,
  pickWaDigits,
  reservationAmounts,
  parseConfirmCommand,
  UNSUPPORTED_MEDIA_TEXT,
  PROOF_HISTORY_MARKER,
} from '../conversation-flow.js';
import { createMessageBuffer } from '../message-buffer.js';
import { createProofProcessor } from '../proof-handler.js';
import { createFakeClock, deferred } from './helpers/fake-clock.js';

const CHAT = '5214891234567@c.us';
const VOSEO_RE = /\b(tenés|podés|querés|mandame|mandá|enviame|escribime|escribinos|vos|vosotros)\b/i;
const silentLog = { log() {}, warn() {}, error() {} };

/** Dependencias falsas que anotan todo lo que pasa, en orden. */
function fakeDeps({ result = { text: 'Respuesta de Camila' }, handleImpl, paused = false, afterImpl } = {}) {
  const calls = { handleMessage: [], history: [], replies: [], after: [], events: [] };
  const deps = {
    handleMessage: async (userId, text, userName, opts) => {
      calls.handleMessage.push({ userId, text, userName, opts });
      calls.events.push('model');
      if (handleImpl) return handleImpl(userId, text, userName, opts);
      return result;
    },
    addToHistory: (userId, role, content) => {
      calls.history.push({ userId, role, content });
    },
    checkBotPause: () => (paused ? { paused: true } : { paused: false }),
    sendReply: async (meta, text) => {
      calls.replies.push({ meta, text });
      calls.events.push(`reply:${text.slice(0, 20)}`);
    },
    afterReply: async (meta, res, combinedText) => {
      calls.after.push({ meta, result: res, combinedText });
      calls.events.push('after');
      if (afterImpl) await afterImpl(meta, res, combinedText);
    },
    log: silentLog,
  };
  return { deps, calls };
}

function batchOf({ texts = [], proofs = [], unsupported = 0, meta = {} } = {}) {
  return {
    items: [],
    texts,
    proofs,
    unsupported,
    meta: { msg: { from: CHAT }, chat: null, userName: 'Ana', contactNumber: '5214891234567', resumeNote: '', ...meta },
    firstAt: 0,
    lastAt: 0,
    count: texts.length + proofs.length + unsupported,
  };
}

const ACK = '✅ *¡Gracias, Ana! Recibimos tu comprobante.*\n\n🧾 *Folio:* WA-TEST1';

// ── handleBurst con dobles ─────────────────────────────────

test('ráfaga de 3 textos → 1 llamada al modelo con los 3 textos y 1 respuesta', async () => {
  const { deps, calls } = fakeDeps();
  const handleBurst = createBurstHandler(deps);
  const out = await handleBurst(CHAT, batchOf({ texts: ['Hola', 'somos 5', 'del 9 al 11 de octubre'] }));

  assert.equal(out, 'model');
  assert.equal(calls.handleMessage.length, 1);
  assert.equal(calls.handleMessage[0].userId, CHAT, 'la key debe ser msg.from, sin normalizar');
  assert.equal(calls.handleMessage[0].text, 'Hola\nsomos 5\ndel 9 al 11 de octubre');
  assert.equal(calls.handleMessage[0].userName, 'Ana');
  assert.deepEqual(calls.handleMessage[0].opts, { contactNumber: '5214891234567' });
  assert.equal(calls.replies.length, 1);
  assert.equal(calls.replies[0].text, 'Respuesta de Camila');
  // handleMessage guarda su propio historial: aquí no se duplica.
  assert.equal(calls.history.length, 0);
});

test('comprobante + "ya pagué" → acuse enviado y NO se llama al modelo', async () => {
  const { deps, calls } = fakeDeps();
  const handleBurst = createBurstHandler(deps);
  const out = await handleBurst(CHAT, batchOf({
    texts: ['ya pagué', 'ahí va el comprobante 🙏'],
    proofs: [{ type: 'proof', folio: 'WA-TEST1', kind: 'pdf', ackText: ACK }],
  }));

  assert.equal(out, 'proof_ack_only');
  assert.equal(calls.handleMessage.length, 0, 'no debía llamar al modelo');
  assert.equal(calls.replies.length, 1);
  assert.equal(calls.replies[0].text, ACK);
  assert.equal(calls.after.length, 0);
  assert.deepEqual(calls.history.map(h => [h.role, h.content]), [
    ['user', PROOF_HISTORY_MARKER],
    ['assistant', ACK],
    ['user', 'ya pagué'],
    ['user', 'ahí va el comprobante 🙏'],
  ]);
});

test('comprobante solo (sin texto) → solo el acuse', async () => {
  const { deps, calls } = fakeDeps();
  const out = await createBurstHandler(deps)(CHAT, batchOf({
    proofs: [{ type: 'proof', folio: 'WA-TEST1', kind: 'image', ackText: ACK }],
  }));
  assert.equal(out, 'proof_ack_only');
  assert.equal(calls.handleMessage.length, 0);
  assert.deepEqual(calls.replies.map(r => r.text), [ACK]);
});

test('varios comprobantes en la ráfaga → un solo acuse (el primero con texto)', async () => {
  const { deps, calls } = fakeDeps();
  await createBurstHandler(deps)(CHAT, batchOf({
    proofs: [
      { type: 'proof', folio: 'WA-TEST1', kind: 'image', ackText: ACK },
      { type: 'proof', folio: 'WA-TEST1', kind: 'image', ackText: null }, // duplicado
      { type: 'proof', folio: 'WA-TEST1', kind: 'pdf', ackText: 'otro acuse' },
    ],
  }));
  assert.deepEqual(calls.replies.map(r => r.text), [ACK]);
});

test('comprobante + pregunta → primero el acuse y luego el modelo con la NOTA INTERNA', async () => {
  const { deps, calls } = fakeDeps({ result: { text: 'Sí, tenemos estacionamiento.' } });
  const out = await createBurstHandler(deps)(CHAT, batchOf({
    texts: ['listo, ya pagué', '¿tienen estacionamiento?'],
    proofs: [{ type: 'proof', folio: 'WA-TEST1', kind: 'image', ackText: ACK }],
  }));

  assert.equal(out, 'model');
  assert.deepEqual(calls.events, [`reply:${ACK.slice(0, 20)}`, 'model', 'reply:Sí, tenemos estacion', 'after']);
  const sent = calls.handleMessage[0].text;
  assert.ok(sent.includes('[NOTA INTERNA DEL SISTEMA: el cliente acaba de enviar su comprobante de pago del folio WA-TEST1'), sent);
  assert.ok(sent.includes('No le pidas pagar de nuevo ni repitas el acuse.]'));
  assert.ok(sent.indexOf('NOTA INTERNA') < sent.indexOf('¿tienen estacionamiento?'), 'la nota va antes del texto');
  assert.ok(sent.endsWith('listo, ya pagué\n¿tienen estacionamiento?'));
  // El acuse quedó en el historial antes de llamar al modelo.
  assert.deepEqual(calls.history.map(h => h.role), ['user', 'assistant']);
});

test('el acuse completo gana aunque el corto de un archivo repetido haya entrado antes a la ráfaga', async () => {
  const SHORT = '📎 Recibí también este archivo para tu folio *WA-TEST1*. Nuestro equipo lo revisa junto con el anterior. 🌿';
  const { deps, calls } = fakeDeps();
  const out = await createBurstHandler(deps)(CHAT, batchOf({
    proofs: [
      { type: 'proof', folio: 'WA-TEST1', kind: 'pdf', ackText: SHORT, duplicate: true },
      { type: 'proof', folio: 'WA-TEST1', kind: 'image', ackText: ACK, duplicate: false },
    ],
  }));
  assert.equal(out, 'proof_ack_only');
  assert.deepEqual(calls.replies.map(r => r.text), [ACK]);
});

test('solo un archivo repetido en la ráfaga → se manda su acuse corto (no silencio)', async () => {
  const SHORT = '📎 Recibí también este archivo para tu folio *WA-TEST1*. Nuestro equipo lo revisa junto con el anterior. 🌿';
  const { deps, calls } = fakeDeps();
  const out = await createBurstHandler(deps)(CHAT, batchOf({
    proofs: [{ type: 'proof', folio: 'WA-TEST1', kind: 'pdf', ackText: SHORT, duplicate: true }],
  }));
  assert.equal(out, 'proof_ack_only');
  assert.equal(calls.handleMessage.length, 0);
  assert.deepEqual(calls.replies.map(r => r.text), [SHORT]);
  assert.deepEqual(calls.history.map(h => [h.role, h.content]), [['user', PROOF_HISTORY_MARKER], ['assistant', SHORT]]);
});

test('comprobante duplicado (sin acuse) + pregunta → no repite acuse y avisa al modelo', async () => {
  const { deps, calls } = fakeDeps();
  await createBurstHandler(deps)(CHAT, batchOf({
    texts: ['¿a qué hora es el check-in?'],
    proofs: [{ type: 'proof', folio: 'WA-TEST1', kind: 'image', ackText: null }],
  }));
  assert.equal(calls.replies.length, 1, 'solo la respuesta del modelo');
  assert.equal(calls.replies[0].text, 'Respuesta de Camila');
  assert.ok(calls.handleMessage[0].text.includes('folio WA-TEST1'));
});

test('comprobante sin cotización + pregunta → nota sin folio inventado', async () => {
  const { deps, calls } = fakeDeps();
  await createBurstHandler(deps)(CHAT, batchOf({
    texts: ['¿me confirman mi reserva?'],
    proofs: [{ type: 'proof', folio: null, kind: 'image', ackText: '✅ *¡Gracias! Recibimos tu archivo.*' }],
  }));
  const sent = calls.handleMessage[0].text;
  assert.ok(sent.includes('no hay una cotización activa ligada a este chat'), sent);
  assert.ok(!/folio (null|undefined)/.test(sent));
});

test('bot pausado → no responde, no llama al modelo y guarda el historial', async () => {
  const { deps, calls } = fakeDeps({ paused: true });
  const out = await createBurstHandler(deps)(CHAT, batchOf({
    texts: ['hola', '¿siguen ahí?'],
    proofs: [{ type: 'proof', folio: 'WA-TEST1', kind: 'image', ackText: ACK }],
  }));
  assert.equal(out, 'paused');
  assert.equal(calls.handleMessage.length, 0);
  assert.equal(calls.replies.length, 0);
  assert.equal(calls.after.length, 0);
  assert.deepEqual(calls.history.map(h => [h.role, h.content]), [
    ['user', PROOF_HISTORY_MARKER],
    ['user', 'hola'],
    ['user', '¿siguen ahí?'],
  ]);
});

test('resumeNote (el equipo atendió el chat) va primero en el contexto', async () => {
  const { deps, calls } = fakeDeps();
  const note = '[NOTA INTERNA DEL SISTEMA: El equipo del hotel atendió personalmente esta conversación de 10:00 a 11:00.]';
  await createBurstHandler(deps)(CHAT, batchOf({ texts: ['ok', 'entonces del 9 al 11'], meta: { resumeNote: note } }));
  assert.equal(calls.handleMessage[0].text, `${note}\n\nok\nentonces del 9 al 11`);
});

test('resumeNote + comprobante + pregunta → nota de pausa, nota del comprobante y texto, en ese orden', async () => {
  const { deps, calls } = fakeDeps();
  await createBurstHandler(deps)(CHAT, batchOf({
    texts: ['¿y el desayuno?'],
    proofs: [{ type: 'proof', folio: 'WA-X', kind: 'pdf', ackText: ACK }],
    meta: { resumeNote: '[NOTA PAUSA]' },
  }));
  assert.equal(calls.handleMessage[0].text, `[NOTA PAUSA]\n\n${buildProofContextNote('WA-X')}\n\n¿y el desayuno?`);
});

test('solo audio/sticker → aviso de "solo leo texto, imágenes o PDF" y sin modelo', async () => {
  const { deps, calls } = fakeDeps();
  const out = await createBurstHandler(deps)(CHAT, batchOf({ unsupported: 2 }));
  assert.equal(out, 'unsupported_notice');
  assert.equal(calls.handleMessage.length, 0);
  assert.deepEqual(calls.replies.map(r => r.text), [UNSUPPORTED_MEDIA_TEXT]);
  assert.ok(!VOSEO_RE.test(UNSUPPORTED_MEDIA_TEXT));
  assert.ok(/imágenes o PDF/.test(UNSUPPORTED_MEDIA_TEXT));
});

test('audio + texto → se contesta el texto con el modelo, sin el aviso de audio', async () => {
  const { deps, calls } = fakeDeps();
  await createBurstHandler(deps)(CHAT, batchOf({ texts: ['precio de la jungla'], unsupported: 1 }));
  assert.equal(calls.handleMessage.length, 1);
  assert.deepEqual(calls.replies.map(r => r.text), ['Respuesta de Camila']);
});

test('afterReply recibe meta, el result completo y el texto combinado', async () => {
  const result = {
    text: 'Aquí tu cotización', requiresHumanIntervention: false, requiresTourNotification: false,
    quoteCreated: true, quoteFolio: 'WA-NEW', quoteBlockConfirmed: true, quote: { folio: 'WA-NEW' },
    supersededFolio: 'WA-OLD', supersededCheckin: '2026-10-09', supersededCheckout: '2026-10-11',
  };
  const { deps, calls } = fakeDeps({ result });
  const batch = batchOf({ texts: ['me llamo Ana López', 'la opción 1'] });
  await createBurstHandler(deps)(CHAT, batch);
  assert.equal(calls.after.length, 1);
  assert.equal(calls.after[0].result, result);
  assert.equal(calls.after[0].meta.msg, batch.meta.msg);
  assert.equal(calls.after[0].combinedText, 'me llamo Ana López\nla opción 1');
});

test('handleMessage devuelve null (bot apagado) → no responde ni corre afterReply', async () => {
  const { deps, calls } = fakeDeps({ result: null });
  await createBurstHandler(deps)(CHAT, batchOf({ texts: ['hola'] }));
  assert.equal(calls.replies.length, 0);
  assert.equal(calls.after.length, 0);
});

test('handleMessage que devuelve texto plano (formato viejo) sigue funcionando', async () => {
  const { deps, calls } = fakeDeps({ result: 'hola desde un string' });
  await createBurstHandler(deps)(CHAT, batchOf({ texts: ['hola'] }));
  assert.deepEqual(calls.replies.map(r => r.text), ['hola desde un string']);
  assert.deepEqual(calls.after[0].result, { text: 'hola desde un string' });
});

test('si el modelo falla → se relanza con burstMeta y no se responde nada', async () => {
  const { deps, calls } = fakeDeps({ handleImpl: async () => { throw new Error('529 overloaded'); } });
  const batch = batchOf({ texts: ['hola'] });
  await assert.rejects(createBurstHandler(deps)(CHAT, batch), (err) => {
    assert.equal(err.message, '529 overloaded');
    assert.equal(err.burstMeta, batch.meta, 'onError necesita el meta para disculparse');
    return true;
  });
  assert.equal(calls.replies.length, 0);
  assert.equal(calls.after.length, 0);
});

test('si falla el post-proceso → NO se relanza (el cliente ya tiene su respuesta)', async () => {
  const errors = [];
  const { deps, calls } = fakeDeps({ afterImpl: async () => { throw new Error('grupo caído'); } });
  deps.log = { log() {}, warn() {}, error: (...a) => errors.push(a) };
  const out = await createBurstHandler(deps)(CHAT, batchOf({ texts: ['hola'] }));
  assert.equal(out, 'model');
  assert.equal(calls.replies.length, 1);
  assert.equal(errors.length, 1);
});

test('faltan dependencias obligatorias → TypeError claro', () => {
  assert.throws(() => createBurstHandler({}), /falta handleMessage/);
});

// ── Integración: buffer (reloj falso) + handleBurst ────────

test('integración: mensajes durante un handleMessage lento → una sola pasada extra, nunca en paralelo', async () => {
  const clock = createFakeClock();
  const slow = deferred();
  let running = 0;
  let maxRunning = 0;
  const { deps, calls } = fakeDeps({
    handleImpl: async (userId, text) => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      try {
        if (calls.handleMessage.length === 1) await slow.promise; // la 1ª respuesta tarda
        return { text: `respuesta a: ${text}` };
      } finally {
        running--;
      }
    },
  });
  const errors = [];
  const buffer = createMessageBuffer({
    debounceMs: 15000, maxWaitMs: 60000, typingIntervalMs: 8000, clock,
    onFlush: createBurstHandler(deps),
    onError: (err) => errors.push(err),
  });
  const meta = { msg: { from: CHAT }, chat: null, userName: 'Ana', contactNumber: '' };

  buffer.push(CHAT, { type: 'text', text: 'Hola' }, meta);
  await clock.advance(5000);
  buffer.push(CHAT, { type: 'text', text: 'somos 5' }, meta);
  await clock.advance(15000); // 15 s de silencio → arranca la 1ª respuesta (lenta)
  assert.equal(calls.handleMessage.length, 1);
  assert.equal(calls.handleMessage[0].text, 'Hola\nsomos 5');
  assert.equal(buffer.isBusy(CHAT), true);

  // Mientras Camila piensa, el cliente escribe 3 veces más.
  buffer.push(CHAT, { type: 'text', text: 'del 9 al 11' }, meta);
  await clock.advance(3000);
  buffer.push(CHAT, { type: 'text', text: 'de octubre' }, meta);
  await clock.advance(3000);
  buffer.push(CHAT, { type: 'text', text: 'con alberca porfa' }, meta);
  await clock.advance(60000);
  assert.equal(calls.handleMessage.length, 1, 'arrancó una segunda respuesta en paralelo');

  slow.resolve();
  await clock.advance(0);
  await clock.advance(120000);

  assert.equal(errors.length, 0);
  assert.equal(maxRunning, 1);
  assert.equal(calls.handleMessage.length, 2, 'debía haber exactamente una pasada extra');
  assert.equal(calls.handleMessage[1].text, 'del 9 al 11\nde octubre\ncon alberca porfa');
  assert.deepEqual(calls.replies.map(r => r.text), [
    'respuesta a: Hola\nsomos 5',
    'respuesta a: del 9 al 11\nde octubre\ncon alberca porfa',
  ]);
});

test('integración: la pausa descarta lo pendiente y el modelo nunca contesta', async () => {
  const clock = createFakeClock();
  const { deps, calls } = fakeDeps();
  const buffer = createMessageBuffer({ debounceMs: 15000, maxWaitMs: 60000, clock, onFlush: createBurstHandler(deps) });
  buffer.push(CHAT, { type: 'text', text: 'hola' }, { msg: { from: CHAT } });
  await clock.advance(10000);
  assert.equal(buffer.discard(CHAT), 1); // lo que hace pauseBotForChat
  await clock.advance(60000);
  assert.equal(calls.handleMessage.length, 0);
  assert.equal(calls.replies.length, 0);
});

// ── Integración: comprobante real (proof-handler) + buffer + handleBurst ──

function memoryRepo(records) {
  const byFolio = (f) => records.find(r => r.folio === f) || null;
  return {
    getByFolio: byFolio,
    getByUser: (userId) => records.filter(r => r.userId === userId).at(-1) || null,
    findLatestPendingByPhone: () => null,
    markPaymentProofReceived: ({ folio }) => {
      const r = byFolio(folio);
      if (!r) return null;
      r.proofReceivedAt ||= new Date(0).toISOString();
      r.proofCount = (r.proofCount || 0) + 1;
      return r;
    },
  };
}

test('integración: PDF + "ya pagué" → aviso al grupo al instante, acuse con saldo a los 15 s y sin modelo', async () => {
  const clock = createFakeClock();
  const record = {
    folio: 'WA-PDF1', status: 'PENDIENTE_PAGO', userId: CHAT, userName: 'Ana López',
    rooms: [{ name: 'Suite Jungla', guests: 2, price: 4800 }], checkin: '2026-10-09', checkout: '2026-10-11',
    guests: 2, nights: 2, totalPrice: 4800, depositAmount: 2400, saldo: 2400,
  };
  const group = [];
  const hotel = [];
  const proofs = createProofProcessor({
    repo: memoryRepo([record]),
    sendToGroup: async (content, options) => { group.push({ content, options, at: clock.now() }); return true; },
    sendToHotel: async (content, options) => { hotel.push({ content, options }); return true; },
    log: silentLog,
    now: () => clock.now(),
  });
  const { deps, calls } = fakeDeps();
  const buffer = createMessageBuffer({ debounceMs: 15000, maxWaitMs: 60000, clock, onFlush: createBurstHandler(deps) });
  const meta = { msg: { from: CHAT }, chat: null, userName: 'Ana', contactNumber: '5214891234567' };
  const start = clock.now();

  // Así lo hace index.js al llegar el archivo: procesar YA y meter el acuse a la ráfaga.
  const media = { mimetype: 'application/pdf', data: 'JVBERi0=' };
  const r = await proofs.process({ chatId: CHAT, userName: 'Ana', contactNumber: '5214891234567', media, mimetype: 'application/pdf', caption: '' });
  buffer.push(CHAT, { type: 'proof', folio: r.folio, kind: 'pdf', ackText: r.ackText }, meta);
  await clock.advance(4000);
  buffer.push(CHAT, { type: 'text', text: 'ya pagué, gracias' }, meta);

  assert.equal(group.length, 1, 'el aviso al grupo sale al llegar el archivo');
  assert.equal(group[0].at, start);
  assert.ok(group[0].content.includes('/confirmar WA-PDF1'));
  assert.ok(hotel.some(h => h.content === media && h.options?.caption?.includes('WA-PDF1')), 'el PDF va al número del hotel con caption');
  assert.equal(calls.replies.length, 0, 'el acuse espera a la ráfaga');

  await clock.advance(15000);
  assert.equal(calls.handleMessage.length, 0, 'no debía llamar al modelo');
  assert.equal(calls.replies.length, 1);
  const ack = calls.replies[0].text;
  assert.ok(ack.includes('Recibimos tu comprobante'));
  assert.ok(ack.includes('Saldo a pagar al llegar al hotel'));
  assert.ok(ack.includes('confirmación de tu reserva'));
  assert.ok(!VOSEO_RE.test(ack));
  assert.ok(record.proofReceivedAt, 'el comprobante quedó marcado en el folio');
});

test('integración: 2º archivo a los 4 min en otra ráfaga → acuse corto al cliente y línea corta al grupo', async () => {
  const clock = createFakeClock();
  const record = {
    folio: 'WA-DOS1', status: 'PENDIENTE_PAGO', userId: CHAT, userName: 'Ana López',
    rooms: [{ name: 'Suite Jungla', guests: 2, price: 4800 }], checkin: '2026-10-09', checkout: '2026-10-11',
    guests: 2, nights: 2, totalPrice: 4800, depositAmount: 2400, saldo: 2400,
  };
  const group = [];
  const proofs = createProofProcessor({
    repo: memoryRepo([record]),
    sendToGroup: async (content) => { group.push(content); return true; },
    sendToHotel: async () => true,
    log: silentLog,
    now: () => clock.now(),
  });
  const { deps, calls } = fakeDeps();
  const buffer = createMessageBuffer({ debounceMs: 15000, maxWaitMs: 60000, clock, onFlush: createBurstHandler(deps) });
  const meta = { msg: { from: CHAT }, chat: null, userName: 'Ana', contactNumber: '5214891234567' };
  const media = { mimetype: 'image/jpeg', data: '/9j/' };

  const r1 = await proofs.process({ chatId: CHAT, userName: 'Ana', media, mimetype: 'image/jpeg' });
  buffer.push(CHAT, { type: 'proof', folio: r1.folio, kind: 'image', ackText: r1.ackText, duplicate: r1.duplicate }, meta);
  await clock.advance(15000);
  assert.equal(calls.replies.length, 1);
  assert.ok(calls.replies[0].text.includes('Recibimos tu comprobante'));

  await clock.advance(4 * 60 * 1000);
  const r2 = await proofs.process({ chatId: CHAT, userName: 'Ana', media, mimetype: 'image/jpeg' });
  assert.equal(r2.duplicate, true);
  buffer.push(CHAT, { type: 'proof', folio: r2.folio, kind: 'image', ackText: r2.ackText, duplicate: r2.duplicate }, meta);
  await clock.advance(15000);
  assert.equal(calls.handleMessage.length, 0, 'no debía llamar al modelo');
  assert.equal(calls.replies.length, 2, 'el 2º archivo también recibe respuesta');
  assert.equal(calls.replies[1].text, '📎 Recibí también este archivo para tu folio *WA-DOS1*. Nuestro equipo lo revisa junto con el anterior. 🌿');
  assert.equal(group.length, 2);
  assert.equal(group[1], '📎 WA-DOS1: llegó otro archivo de comprobante (#2)');
});

// ── Helpers puros ──────────────────────────────────────────

test('cleanMediaCaption quita nombres de archivo sueltos y deja el texto real', () => {
  assert.equal(cleanMediaCaption('IMG_2034.jpg'), '');
  assert.equal(cleanMediaCaption('comprobante.pdf'), '');
  assert.equal(cleanMediaCaption('Constancia_situacion_fiscal.PDF'), '');
  assert.equal(cleanMediaCaption('  ya pagué  '), 'ya pagué');
  assert.equal(cleanMediaCaption('te mando el comprobante.pdf'), 'te mando el comprobante.pdf');
  assert.equal(cleanMediaCaption(undefined), '');
});

test('pickWaDigits: contacto → JID @c.us → waNumber del folio; nunca los dígitos de un @lid', () => {
  assert.equal(pickWaDigits({ contactNumber: '+52 1 489 111 2233', chatId: '999@lid' }), '5214891112233');
  assert.equal(pickWaDigits({ contactNumber: '', chatId: '5214891234567@c.us' }), '5214891234567');
  assert.equal(pickWaDigits({ contactNumber: '', chatId: '123456789012345@lid', record: { waNumber: '5214890001122' } }), '5214890001122');
  assert.equal(pickWaDigits({ contactNumber: '', chatId: '123456789012345@lid', record: { userId: '123456789012345@lid' } }), '');
  assert.equal(pickWaDigits({ chatId: '123456789012345@lid', record: { userId: '5214891234567@c.us' } }), '5214891234567');
});

test('reservationAmounts: saldo guardado; en folios viejos total − anticipo', () => {
  assert.deepEqual(reservationAmounts({ totalPrice: 4800, depositAmount: 2400, saldo: 2400 }), { total: 4800, deposit: 2400, saldo: 2400 });
  assert.deepEqual(reservationAmounts({ totalPrice: 2700, depositAmount: 2700, saldo: 0 }), { total: 2700, deposit: 2700, saldo: 0 });
  assert.deepEqual(reservationAmounts({ totalPrice: 30000, depositAmount: 5000 }), { total: 30000, deposit: 5000, saldo: 25000 });
  assert.deepEqual(reservationAmounts({ totalPrice: 3000 }), { total: 3000, deposit: 3000, saldo: 0 });
});

test('parseConfirmCommand: folio, "forzar" al final y textos que no son comando', () => {
  assert.deepEqual(parseConfirmCommand('/confirmar WA-ABC123'), { folio: 'WA-ABC123', force: false });
  assert.deepEqual(parseConfirmCommand('/reservar wa-abc123 forzar'), { folio: 'WA-ABC123', force: true });
  assert.deepEqual(parseConfirmCommand('/CONFIRMAR  WA-ABC123   FORZAR '), { folio: 'WA-ABC123', force: true });
  assert.deepEqual(parseConfirmCommand('/confirmar WA-ABC123 mañana'), { folio: 'WA-ABC123', force: false });
  assert.deepEqual(parseConfirmCommand('/confirmar forzar'), { folio: '', force: false });
  assert.equal(parseConfirmCommand('hola, quiero confirmar'), null);
  assert.equal(parseConfirmCommand('/continua 4891234567'), null);
});
