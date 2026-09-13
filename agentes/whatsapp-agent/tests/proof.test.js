// Pruebas de comprobantes (proof-handler.js): clasificación, búsqueda de la cotización,
// procesador con envíos falsos y textos. Sin WhatsApp ni red.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  classifyIncomingMedia,
  mediaKind,
  findActiveQuoteForChat,
  buildProofAck,
  buildProofAckNoQuote,
  buildProofGroupAlert,
  buildNoQuoteProofAlert,
  isPaymentChatterOnly,
  createProofProcessor,
} from '../proof-handler.js';
import { normalizeMxCandidates, extractDigitsFromJid, last10 } from '../phone.js';

const VOSEO_RE = /\b(tenés|podés|querés|mandame|mandá|enviame|pasame|liquidás|pagás|vos|vosotros)\b|tenés|podés|querés|liquidás/i;

// ── Datos de prueba ─────────────────────────────────────────

function reservation(overrides = {}) {
  return {
    folio: 'WA-MF1ABC',
    status: 'PENDIENTE_PAGO',
    userId: '123456789012345@lid',
    waNumber: '5214891112233',
    userName: 'Ana López',
    rooms: [{ id: 'jungla', name: 'Suite Jungla', guests: 2, price: 4800, checkin: '2026-10-09', checkout: '2026-10-11' }],
    room: { id: 'jungla', name: 'Suite Jungla', guests: 2, price: 4800 },
    checkin: '2026-10-09',
    checkout: '2026-10-11',
    guests: 2,
    nights: 2,
    totalPrice: 4800,
    depositAmount: 2400,
    saldo: 2400,
    createdAt: '2026-09-12T17:00:00.000Z',
    ...overrides,
  };
}

/** Almacén en memoria con la misma API que reservations.js. */
function memoryRepo(records = []) {
  const list = records.map(r => ({ ...r }));
  const marks = [];
  const newest = (arr) => [...arr].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] || null;
  return {
    list,
    marks,
    getByFolio: (folio) => list.find(r => r.folio === folio) || null,
    getByUser: (userId) => newest(list.filter(r => r.userId === userId)),
    findLatestPendingByPhone: (candidates) => {
      const wanted = new Set(candidates.map(last10).filter(Boolean));
      return newest(list.filter(r => r.status === 'PENDIENTE_PAGO' &&
        [last10(r.waNumber), last10(extractDigitsFromJid(r.userId))].some(d => d && wanted.has(d))));
    },
    markPaymentProofReceived: (arg) => {
      marks.push(arg);
      const r = list.find(x => x.folio === arg.folio);
      if (!r) return null;
      r.proofReceivedAt = r.proofReceivedAt || new Date().toISOString();
      r.proofCount = (r.proofCount || 0) + 1;
      return r;
    },
    normalizeMxCandidates,
    extractDigitsFromJid,
  };
}

function fakeSenders({ groupThrows = false, hotelThrows = false } = {}) {
  const group = [];
  const hotel = [];
  return {
    group,
    hotel,
    sendToGroup: async (content, options) => { if (groupThrows) throw new Error('grupo caído'); group.push({ content, options }); return true; },
    sendToHotel: async (content, options) => { if (hotelThrows) throw new Error('hotel caído'); hotel.push({ content, options }); return true; },
  };
}

const silentLog = { warn: () => {}, log: () => {} };
const MEDIA_PDF = { mimetype: 'application/pdf', data: 'JVBERi0x', filename: 'comprobante.pdf' };
const MEDIA_JPG = { mimetype: 'image/jpeg', data: '/9j/4AAQ', filename: 'IMG-2026.jpg' };

// ── Clasificación ───────────────────────────────────────────

test('mediaKind: imagen, pdf y lo demás', () => {
  assert.equal(mediaKind('image/jpeg'), 'image');
  assert.equal(mediaKind('image/png'), 'image');
  assert.equal(mediaKind('application/pdf'), 'pdf');
  assert.equal(mediaKind('audio/ogg; codecs=opus'), null);
  assert.equal(mediaKind('video/mp4'), null);
  assert.equal(mediaKind('application/vnd.openxmlformats-officedocument.wordprocessingml.document'), null);
  assert.equal(mediaKind(undefined), null);
});

test('classifyIncomingMedia: PDF, imagen mandada como documento, audio y sticker', () => {
  assert.equal(classifyIncomingMedia({ mimetype: 'application/pdf', caption: '', hasPendingQuote: false }), 'proof');
  assert.equal(classifyIncomingMedia({ mimetype: 'application/pdf', caption: 'comprobante.pdf', hasPendingQuote: false }), 'proof');
  // Imagen enviada como documento: llega como document pero con mimetype image/jpeg
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: '', hasPendingQuote: true }), 'proof');
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'Transferencia SPEI', hasPendingQuote: false }), 'proof');
  assert.equal(classifyIncomingMedia({ mimetype: 'image/png', caption: 'ya pagué', hasPendingQuote: false }), 'proof');
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'ticket de OXXO', hasPendingQuote: false }), 'proof');

  assert.equal(classifyIncomingMedia({ mimetype: 'audio/ogg; codecs=opus', caption: '', hasPendingQuote: true }), 'unsupported');
  assert.equal(classifyIncomingMedia({ mimetype: 'video/mp4', caption: '¿así se llega?', hasPendingQuote: true }), 'text');
  assert.equal(classifyIncomingMedia({ mimetype: 'image/webp', caption: '', hasPendingQuote: true, messageType: 'sticker' }), 'unsupported');
  assert.equal(classifyIncomingMedia({ mimetype: 'application/msword', caption: '', hasPendingQuote: true }), 'unsupported');
  // Documento sin texto: el body trae solo el nombre del archivo
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'IMG_2034.jpg', hasPendingQuote: false }), 'proof');
  assert.equal(classifyIncomingMedia({ mimetype: 'application/pdf', caption: 'CFDI_marzo.pdf', hasPendingQuote: true }), 'text');
});

test('classifyIncomingMedia: constancia fiscal / factura nunca es comprobante', () => {
  assert.equal(classifyIncomingMedia({ mimetype: 'application/pdf', caption: 'Mi constancia de situación fiscal', hasPendingQuote: true }), 'text');
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'para la factura, mi RFC', hasPendingQuote: true }), 'text');
  assert.equal(classifyIncomingMedia({ mimetype: 'application/pdf', caption: 'datos CFDI', hasPendingQuote: false }), 'text');
  // "rfc" como palabra, no dentro de otra
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'comprobante', hasPendingQuote: false }), 'proof');
});

test('classifyIncomingMedia: comprobante que además pide factura sigue siendo comprobante', () => {
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'Te envío el comprobante del anticipo, ¿me pueden facturar?', hasPendingQuote: true }), 'proof');
  assert.equal(classifyIncomingMedia({ mimetype: 'application/pdf', caption: 'Comprobante de pago. Requiero factura por favor', hasPendingQuote: true }), 'proof');
  // Lo puramente fiscal sigue siendo texto
  assert.equal(classifyIncomingMedia({ mimetype: 'application/pdf', caption: 'Mi constancia de situación fiscal', hasPendingQuote: true }), 'text');
  assert.equal(classifyIncomingMedia({ mimetype: 'application/pdf', caption: 'CFDI_marzo.pdf', hasPendingQuote: true }), 'text');
});

test('classifyIncomingMedia: «pagina» y «pagar» no son pago; «ya pagué», «Pagado», «el pago» sí', () => {
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'Vi esta suite en su pagina, esta disponible?', hasPendingQuote: false }), 'text');
  assert.equal(classifyIncomingMedia({ mimetype: 'image/png', caption: '¿cómo puedo pagar?', hasPendingQuote: false }), 'text');
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'Asi se ve la pagina de reservas, me marca error', hasPendingQuote: false }), 'text');
  for (const caption of ['ya pagué', 'ya pague', 'Pagado', 'ya quedó pagada', 'ahi va el pago', 'ahí va el pago del anticipo', 'pago', 'YA PAGUÉ']) {
    assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption, hasPendingQuote: false }), 'proof', caption);
  }
  // «é» descompuesta (e + acento combinado) también cuenta
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'ya pague\u0301', hasPendingQuote: false }), 'proof');
  // Palabras que solo contienen «pag»
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption: 'mi prepago de celular', hasPendingQuote: false }), 'text');
});

test('classifyIncomingMedia: caption-pregunta con y sin cotización', () => {
  const caption = '¿Esta habitación tiene vista al río?';
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption, hasPendingQuote: true }), 'proof');
  assert.equal(classifyIncomingMedia({ mimetype: 'image/jpeg', caption, hasPendingQuote: false }), 'text');
});

// ── Búsqueda de cotización ──────────────────────────────────

test('findActiveQuoteForChat: por folio de sesión, por usuario y por teléfono', () => {
  const porFolio = reservation({ folio: 'WA-FOLIO1', userId: 'otro@c.us', waNumber: null });
  const porUsuario = reservation({ folio: 'WA-USER1', userId: '5214890000001@c.us', waNumber: null });
  const porTelefono = reservation({ folio: 'WA-TEL1', userId: '888888888888888@lid', waNumber: '5214890000002' });
  const repo = memoryRepo([porFolio, porUsuario, porTelefono]);

  assert.equal(findActiveQuoteForChat({ userId: '5214890000001@c.us', sessionFolio: 'WA-FOLIO1' }, repo)?.folio, 'WA-FOLIO1');
  assert.equal(findActiveQuoteForChat({ userId: '5214890000001@c.us' }, repo)?.folio, 'WA-USER1');
  // El cliente cotizó como @lid y ahora escribe como @c.us (o al revés)
  assert.equal(findActiveQuoteForChat({ userId: '5214890000002@c.us' }, repo)?.folio, 'WA-TEL1');
  assert.equal(findActiveQuoteForChat({ userId: '999999999999999@lid', contactNumber: '524890000002' }, repo)?.folio, 'WA-TEL1');
  assert.equal(findActiveQuoteForChat({ userId: '999999999999999@lid', contactNumber: '5215550000000' }, repo), null);
  assert.equal(findActiveQuoteForChat({}, repo), null);
});

test('findActiveQuoteForChat nunca devuelve una REEMPLAZADA', () => {
  const reemplazada = reservation({ folio: 'WA-OLD', status: 'REEMPLAZADA', userId: '5214890000009@c.us', createdAt: '2026-09-12T18:00:00.000Z' });
  const confirmada = reservation({ folio: 'WA-DONE', status: 'RESERVADO', userId: '5214890000008@c.us' });
  const repo = memoryRepo([reemplazada, confirmada]);
  assert.equal(findActiveQuoteForChat({ userId: '5214890000009@c.us', sessionFolio: 'WA-OLD' }, repo), null);
  assert.equal(findActiveQuoteForChat({ userId: '5214890000008@c.us' }, repo), null);

  // Si hay una nueva pendiente del mismo teléfono, se encuentra esa
  const nueva = reservation({ folio: 'WA-NEW', userId: '777777777777777@lid', waNumber: '4890000009', createdAt: '2026-09-12T17:30:00.000Z' });
  const repo2 = memoryRepo([reemplazada, nueva]);
  assert.equal(findActiveQuoteForChat({ userId: '5214890000009@c.us', sessionFolio: 'WA-OLD' }, repo2)?.folio, 'WA-NEW');
});

test('findActiveQuoteForChat con el reservations.js real (archivo temporal) y chat @lid', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proof-test-'));
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
  process.env.RESERVATIONS_FILE = path.join(tmpDir, 'reservations.json');
  const R = await import('../reservations.js');

  const q = R.createQuote({
    userId: '555444333222111@lid', userName: 'Beto', guestName: 'Beto Ruiz', waNumber: '5214893334455',
    rooms: [{ id: 'lirios_1', name: 'Lirios 1', guests: 4, price: 3800 }],
    checkin: '2026-11-20', checkout: '2026-11-22', nights: 2, totalPrice: 3800, roomsTotal: 3800, depositAmount: 1900,
  });
  const repo = { ...R, normalizeMxCandidates, extractDigitsFromJid };
  // Mismo cliente, ahora como @c.us y sin folio en la sesión
  const found = findActiveQuoteForChat({ userId: '5214893334455@c.us', contactNumber: '5214893334455' }, repo);
  assert.equal(found?.folio, q.folio);

  const senders = fakeSenders();
  const processor = createProofProcessor({ repo, ...senders, log: silentLog });
  const out = await processor.process({ chatId: '5214893334455@c.us', userName: 'Beto', contactNumber: '5214893334455', media: MEDIA_PDF, mimetype: 'application/pdf' });
  assert.equal(out.folio, q.folio);
  assert.equal(R.getByFolio(q.folio).proofCount, 1);
  assert.ok(R.getByFolio(q.folio).proofReceivedAt);
  assert.match(out.ackText, /Saldo a pagar al llegar al hotel:\* \$1,900 MXN/);
});

// ── Procesador ──────────────────────────────────────────────

test('process con cotización: aviso al grupo y al hotel, archivo al hotel, acuse con saldo', async () => {
  const repo = memoryRepo([reservation()]);
  const senders = fakeSenders();
  const processor = createProofProcessor({ repo, ...senders, log: silentLog, now: () => Date.parse('2026-09-12T20:00:00Z') });

  const out = await processor.process({
    chatId: '123456789012345@lid', userName: 'Anita', contactNumber: '5214891112233',
    media: MEDIA_PDF, mimetype: 'application/pdf', caption: '',
  });

  assert.equal(out.folio, 'WA-MF1ABC');
  assert.equal(out.duplicate, false);
  assert.equal(out.reservation.proofCount, 1);
  assert.deepEqual(repo.marks, [{ folio: 'WA-MF1ABC' }]);
  assert.match(out.ackText, /Gracias, Ana!/);

  assert.equal(senders.group.length, 1, 'el grupo recibe solo el texto');
  assert.match(senders.group[0].content, /Comprobante de pago recibido/);
  assert.match(senders.group[0].content, /📄 PDF/);
  assert.equal(senders.hotel.length, 2, 'el hotel recibe el texto y el archivo');
  assert.equal(senders.hotel[0].content, senders.group[0].content);
  assert.equal(senders.hotel[1].content, MEDIA_PDF);
  assert.match(senders.hotel[1].options.caption, /WA-MF1ABC/);
});

test('process: las alertas y el acuse salen aunque un envío lance', async () => {
  const repo = memoryRepo([reservation()]);
  const senders = fakeSenders({ groupThrows: true });
  const warnings = [];
  const processor = createProofProcessor({ repo, ...senders, log: { warn: (...a) => warnings.push(a.join(' ')) } });
  const out = await processor.process({ chatId: '123456789012345@lid', userName: 'Ana', media: MEDIA_JPG, mimetype: 'image/jpeg' });
  assert.ok(out.ackText, 'sin acuse porque falló el grupo');
  assert.equal(senders.hotel.length, 2, 'el hotel debía recibir aviso y archivo aunque el grupo falló');
  assert.ok(warnings.some(w => /grupo/.test(w)));

  // Y al revés: falla el hotel, el grupo sí recibe
  const repo2 = memoryRepo([reservation()]);
  const senders2 = fakeSenders({ hotelThrows: true });
  const out2 = await createProofProcessor({ repo: repo2, ...senders2, log: silentLog })
    .process({ chatId: '123456789012345@lid', userName: 'Ana', media: MEDIA_JPG, mimetype: 'image/jpeg' });
  assert.ok(out2.ackText);
  assert.equal(senders2.group.length, 1);

  // Un sender que devuelve false (grupo no encontrado) tampoco frena nada
  const repo3 = memoryRepo([reservation()]);
  const hotel3 = [];
  const out3 = await createProofProcessor({
    repo: repo3, log: silentLog,
    sendToGroup: async () => false,
    sendToHotel: async (c) => { hotel3.push(c); return true; },
  }).process({ chatId: '123456789012345@lid', media: MEDIA_JPG, mimetype: 'image/jpeg' });
  assert.ok(out3.ackText);
  assert.equal(hotel3.length, 2);
});

test('process: segundo archivo en menos de 10 min → archivo al hotel, línea corta al grupo y acuse corto', async () => {
  let clock = Date.parse('2026-09-12T20:00:00Z');
  const repo = memoryRepo([reservation()]);
  const senders = fakeSenders();
  const processor = createProofProcessor({ repo, ...senders, log: silentLog, now: () => clock });

  const first = await processor.process({ chatId: '123456789012345@lid', userName: 'Ana', media: MEDIA_JPG, mimetype: 'image/jpeg' });
  assert.ok(first.ackText);
  clock += 9 * 60 * 1000;
  const second = await processor.process({ chatId: '123456789012345@lid', userName: 'Ana', media: MEDIA_PDF, mimetype: 'application/pdf' });
  assert.equal(second.duplicate, true);
  assert.equal(second.ackText, '📎 Recibí también este archivo para tu folio *WA-MF1ABC*. Nuestro equipo lo revisa junto con el anterior. 🌿');
  assert.doesNotMatch(second.ackText, VOSEO_RE);
  assert.equal(second.folio, 'WA-MF1ABC');
  assert.equal(second.reservation.proofCount, 2, 'el segundo archivo también se registra');
  assert.equal(senders.group.length, 2, 'el grupo recibe el aviso completo y una línea corta');
  assert.equal(senders.group.filter(g => /Comprobante de pago recibido/.test(g.content)).length, 1, 'el aviso completo no se repite');
  assert.equal(senders.group[1].content, '📎 WA-MF1ABC: llegó otro archivo de comprobante (#2)');
  const hotelMedia = senders.hotel.filter(h => typeof h.content !== 'string');
  assert.equal(hotelMedia.length, 2, 'el hotel debía recibir los 2 archivos');
  assert.equal(senders.hotel.filter(h => typeof h.content === 'string').length, 1, 'al hotel no le llega la línea corta');

  // Pasados los 10 min del primer aviso, otro archivo sí vuelve a avisar completo
  clock += 2 * 60 * 1000;
  const third = await processor.process({ chatId: '123456789012345@lid', userName: 'Ana', media: MEDIA_JPG, mimetype: 'image/jpeg' });
  assert.equal(third.duplicate, false);
  assert.match(third.ackText, /Recibimos tu comprobante/);
  assert.equal(senders.group.length, 3);
  assert.match(senders.group[2].content, /archivo #3/);
});

test('process: la línea corta al grupo falla y el acuse corto sale igual', async () => {
  let clock = Date.parse('2026-09-12T20:00:00Z');
  const repo = memoryRepo([reservation()]);
  let groupCalls = 0;
  const hotel = [];
  const processor = createProofProcessor({
    repo, log: silentLog, now: () => clock,
    sendToGroup: async () => { groupCalls++; if (groupCalls > 1) throw new Error('grupo caído'); return true; },
    sendToHotel: async (c) => { hotel.push(c); return true; },
  });
  await processor.process({ chatId: '123456789012345@lid', media: MEDIA_JPG, mimetype: 'image/jpeg' });
  clock += 60 * 1000;
  const second = await processor.process({ chatId: '123456789012345@lid', media: MEDIA_PDF, mimetype: 'application/pdf' });
  assert.equal(groupCalls, 2);
  assert.match(second.ackText, /Recibí también este archivo para tu folio \*WA-MF1ABC\*/);
  assert.equal(hotel.filter(c => typeof c !== 'string').length, 2);
});

test('process: dos archivos simultáneos del mismo folio → un solo aviso', async () => {
  const repo = memoryRepo([reservation()]);
  const senders = fakeSenders();
  const processor = createProofProcessor({ repo, ...senders, log: silentLog });
  const [a, b] = await Promise.all([
    processor.process({ chatId: '123456789012345@lid', media: MEDIA_JPG, mimetype: 'image/jpeg' }),
    processor.process({ chatId: '123456789012345@lid', media: MEDIA_PDF, mimetype: 'application/pdf' }),
  ]);
  assert.equal([a, b].filter(x => x.duplicate).length, 1);
  assert.equal(senders.group.filter(g => /Comprobante de pago recibido/.test(g.content)).length, 1, 'un solo aviso completo');
  assert.equal(senders.group.filter(g => /llegó otro archivo de comprobante/.test(g.content)).length, 1);
  assert.ok(a.ackText && b.ackText, 'los dos archivos reciben acuse');
});

test('process sin cotización: alerta "SIN cotización" + acuse, y rate limit por chat', async () => {
  let clock = Date.parse('2026-09-12T20:00:00Z');
  const repo = memoryRepo([]);
  const senders = fakeSenders();
  const processor = createProofProcessor({ repo, ...senders, log: silentLog, now: () => clock });

  const first = await processor.process({ chatId: '5214897778899@c.us', userName: 'Carla', contactNumber: '5214897778899', media: MEDIA_JPG, mimetype: 'image/jpeg', caption: 'pago' });
  assert.equal(first.folio, null);
  assert.equal(first.reservation, null);
  assert.equal(first.ackText, buildProofAckNoQuote());
  assert.equal(senders.group.length, 1);
  assert.match(senders.group[0].content, /SIN cotización activa/);
  assert.match(senders.group[0].content, /wa\.me\/5214897778899/);
  assert.match(senders.group[0].content, /Revisen el chat/);
  assert.equal(senders.hotel.length, 2, 'aviso + archivo al hotel');
  assert.equal(repo.marks.length, 0, 'sin cotización no se marca nada');

  clock += 10 * 60 * 1000;
  const second = await processor.process({ chatId: '5214897778899@c.us', userName: 'Carla', media: MEDIA_JPG, mimetype: 'image/jpeg' });
  assert.equal(second.ackText, '📎 Recibí también este archivo; el equipo lo revisa junto con el anterior. 🌿', 'dentro del rate limit el acuse es corto');
  assert.doesNotMatch(second.ackText, VOSEO_RE);
  assert.equal(senders.group.length, 1, 'dentro del rate limit no se repite la alerta');
  assert.equal(senders.hotel.filter(h => typeof h.content !== 'string').length, 2, 'el archivo sí llega al hotel');

  // Otro chat no comparte el rate limit
  const other = await processor.process({ chatId: '5214896665544@c.us', media: MEDIA_JPG, mimetype: 'image/jpeg' });
  assert.ok(other.ackText);
  assert.equal(senders.group.length, 2);

  clock += 21 * 60 * 1000; // 31 min después del primero
  const third = await processor.process({ chatId: '5214897778899@c.us', userName: 'Carla', media: MEDIA_JPG, mimetype: 'image/jpeg' });
  assert.ok(third.ackText);
  assert.equal(senders.group.length, 3);
});

test('process en pausa (humano atendiendo): alertas y archivo sí, acuse null', async () => {
  const repo = memoryRepo([reservation()]);
  const senders = fakeSenders();
  const processor = createProofProcessor({ repo, ...senders, log: silentLog });
  const out = await processor.process({ chatId: '123456789012345@lid', userName: 'Ana', media: MEDIA_PDF, mimetype: 'application/pdf', paused: true });
  assert.equal(out.ackText, null);
  assert.equal(out.folio, 'WA-MF1ABC');
  assert.equal(senders.group.length, 1);
  assert.equal(senders.hotel.length, 2);
  assert.equal(repo.marks.length, 1);

  const noQuote = await createProofProcessor({ repo: memoryRepo([]), ...fakeSenders(), log: silentLog })
    .process({ chatId: '5214890001111@c.us', media: MEDIA_PDF, mimetype: 'application/pdf', paused: true });
  assert.equal(noQuote.ackText, null);
});

test('process con mediaToGroup: el archivo también va al grupo', async () => {
  const repo = memoryRepo([reservation()]);
  const senders = fakeSenders();
  await createProofProcessor({ repo, ...senders, log: silentLog, mediaToGroup: true })
    .process({ chatId: '123456789012345@lid', media: MEDIA_PDF, mimetype: 'application/pdf' });
  assert.equal(senders.group.length, 2);
  assert.equal(senders.group[1].content, MEDIA_PDF);
});

// ── Textos ──────────────────────────────────────────────────

test('buildProofAck: folio, fechas, habitación, Total, Anticipo, Saldo, verificar y confirmación; sin tours ni voseo', () => {
  const ack = buildProofAck(reservation(), { userName: 'Anita' });
  assert.match(ack, /¡Gracias, Ana! Recibimos tu comprobante\./);
  assert.match(ack, /WA-MF1ABC/);
  assert.match(ack, /viernes 9 de octubre → domingo 11 de octubre \(2 noches\)/);
  assert.match(ack, /Suite Jungla \(2 personas\)/);
  assert.match(ack, /Total:\* \$4,800 MXN/);
  assert.match(ack, /Anticipo:\* \$2,400 MXN/);
  assert.match(ack, /Saldo a pagar al llegar al hotel:\* \$2,400 MXN/);
  assert.match(ack, /verificar/);
  assert.match(ack, /confirmación/);
  assert.doesNotMatch(ack, /tour/i);
  assert.doesNotMatch(ack, VOSEO_RE);
  assert.doesNotMatch(ack, /\*\*/, 'WhatsApp usa un solo asterisco');
});

test('buildProofAck: 1 noche pagada completa, room legado, varias habitaciones y split-stay', () => {
  const completa = buildProofAck(reservation({ nights: 1, checkout: '2026-10-10', totalPrice: 2400, depositAmount: 2400, saldo: 0, rooms: undefined }), {});
  assert.match(completa, /Saldo al llegar:\* \$0 \(pagado completo\)/);
  assert.match(completa, /\(1 noche\)/);
  assert.match(completa, /Habitación:\* Suite Jungla \(2 personas\)/, 'room legado');

  // Sin saldo guardado → total − anticipo
  const sinSaldo = buildProofAck(reservation({ saldo: undefined, totalPrice: 6000, depositAmount: 3000 }), {});
  assert.match(sinSaldo, /Saldo a pagar al llegar al hotel:\* \$3,000 MXN/);

  const split = buildProofAck(reservation({
    rooms: [
      { name: 'Suite Jungla', guests: 2, checkin: '2026-10-09', checkout: '2026-10-10' },
      { name: 'Suite Lajas', guests: 2, checkin: '2026-10-10', checkout: '2026-10-11' },
    ],
  }), {});
  assert.match(split, /Habitaciones:\*/);
  assert.match(split, /· Suite Jungla \(2 personas\) · viernes 9 de octubre → sábado 10 de octubre/);
  assert.match(split, /· Suite Lajas \(2 personas\) · sábado 10 de octubre → domingo 11 de octubre/);

  // Sin nombre usable
  assert.match(buildProofAck(reservation({ userName: '🌸' }), { userName: '' }), /^✅ \*¡Gracias! Recibimos tu comprobante\.\*/);
});

test('buildProofAckNoQuote: gracias + pide folio o nombre, sin voseo', () => {
  const txt = buildProofAckNoQuote();
  assert.match(txt, /Gracias/);
  assert.match(txt, /el equipo lo revisa y te escribe por aquí/);
  assert.match(txt, /folio \(WA-…\)/);
  assert.match(txt, /nombre de la reservación/);
  assert.doesNotMatch(txt, VOSEO_RE);
});

test('buildProofGroupAlert: contexto completo y /confirmar WA-', () => {
  const now = Date.parse('2026-09-12T20:00:00Z'); // 2:00 p.m. en México
  const r = reservation({ holdExpiresAt: '2026-09-13T00:45:00.000Z' }); // 6:45 p.m. en México
  const alert = buildProofGroupAlert(r, { userName: 'Anita', waDigits: '5214891112233', kind: 'pdf', now, count: 1 });
  assert.match(alert, /🔔 \*Comprobante de pago recibido\* · 📄 PDF/);
  assert.match(alert, /Folio:\* WA-MF1ABC/);
  assert.match(alert, /Huésped:\* Ana López · WhatsApp: Anita/);
  assert.match(alert, /wa\.me\/5214891112233/);
  assert.match(alert, /viernes 9 de octubre/);
  assert.match(alert, /Noches:\* 2 · 👥 \*Huéspedes:\* 2/);
  assert.match(alert, /· Suite Jungla \(2 personas\) — \$4,800 MXN/);
  assert.match(alert, /Total:\* \$4,800 MXN/);
  assert.match(alert, /Anticipo:\* \$2,400 MXN/);
  assert.match(alert, /Saldo al llegar:\* \$2,400 MXN/);
  assert.match(alert, /apartado vigente hasta 6:45\sp\.\s?m\./i);
  assert.match(alert, /\/confirmar WA-/);
  assert.doesNotMatch(alert, /archivo #/);

  const vencido = buildProofGroupAlert(r, { kind: 'image', now: Date.parse('2026-09-13T01:00:00Z') });
  assert.match(vencido, /🖼️ imagen/);
  assert.match(vencido, /Apartado VENCIDO\* — valida disponibilidad antes de confirmar/);

  // Folio sin hora de apartado (de antes del apartado de 3 h): aviso de validar
  const sinDato = buildProofGroupAlert(reservation(), { kind: 'image', now });
  assert.match(sinDato, /⚠️ Sin hora de apartado — valida disponibilidad antes de confirmar/);
  assert.doesNotMatch(sinDato, /Apartado vigente|VENCIDO/);
  const confirmadoSinHora = buildProofGroupAlert(reservation({ blockConfirmed: true }), { kind: 'image', now });
  assert.doesNotMatch(confirmadoSinHora, /Apartado|apartado/);
  const vigenteSinFlag = buildProofGroupAlert(reservation({ blockConfirmed: true, holdExpiresAt: '2026-09-13T00:45:00.000Z' }), { kind: 'image', now });
  assert.match(vigenteSinFlag, /apartado vigente hasta/i);

  const sinBloqueo = buildProofGroupAlert(reservation({ blockConfirmed: false, holdExpiresAt: '2026-09-13T00:45:00.000Z' }), { now });
  assert.match(sinBloqueo, /SIN apartado confirmado/);
});

test('buildNoQuoteProofAlert: datos del chat y "Revisen el chat"', () => {
  const alert = buildNoQuoteProofAlert({ userName: 'Carla', waDigits: '5214897778899', kind: 'image', caption: 'ahí va el pago' });
  assert.match(alert, /📎 \*Archivo\/comprobante recibido SIN cotización activa\* · 🖼️ imagen/);
  assert.match(alert, /Carla/);
  assert.match(alert, /wa\.me\/5214897778899/);
  assert.match(alert, /ahí va el pago/);
  assert.match(alert, /Revisen el chat/);
});

// ── Charla de pago ──────────────────────────────────────────

test('isPaymentChatterOnly: solo charla de pago → true', () => {
  const chatter = [
    ['ya pagué'],
    ['Ya deposité', 'te mando el comprobante'],
    ['listo'],
    ['ahí va 👍'],
    ['Gracias!!', 'ok'],
    ['🙏🏼'],
    ['Listo, ya quedó la transferencia. Muchas gracias'],
    ['aquí está el comprobante del anticipo'],
    ['Buenas tardes, ya realicé el pago por SPEI 😊'],
    ['ya hice el depósito en OXXO', 'saludos'],
    ['quedo atenta a la confirmación'],
    [],
    ['', '   '],
  ];
  for (const texts of chatter) {
    assert.equal(isPaymentChatterOnly(texts), true, `debía ser charla: ${JSON.stringify(texts)}`);
  }
});

test('isPaymentChatterOnly: pregunta u otro tema → false', () => {
  const other = [
    ['ya pagué', '¿a qué hora es el check-in?'],
    ['ya pagué, cuánto queda'],
    ['listo', 'somos 6 al final'],
    ['te mando el comprobante', 'y queremos cambiar al 15 de octubre'],
    ['¿recibieron mi pago?'],
    ['ya deposité 2400'],
    ['hola quiero reservar para 2 personas'],
    ['aceptan mascotas'],
    ['no me dejó pagar'],
  ];
  for (const texts of other) {
    assert.equal(isPaymentChatterOnly(texts), false, `no debía ser charla: ${JSON.stringify(texts)}`);
  }
});
