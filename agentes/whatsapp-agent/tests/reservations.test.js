// Pruebas del almacén de reservas (reservations.js) contra un archivo TEMPORAL:
// nunca toca el reservations.json real.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmpDir;
let R; // módulo reservations.js

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reservas-test-'));
  process.env.RESERVATIONS_FILE = path.join(tmpDir, 'reservations.json');
  R = await import('../reservations.js');
});

after(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const JUNGLA = { id: 'jungla', name: 'Suite Jungla', backendName: 'Jungla', guests: 2, price: 4800, checkin: '2026-10-09', checkout: '2026-10-11', nights: 2 };
const LIRIOS = { id: 'lirios_1', name: 'Lirios 1', backendName: 'Lirios 1', guests: 4, price: 3800, checkin: '2026-10-09', checkout: '2026-10-11', nights: 2 };

function quote(overrides = {}) {
  return R.createQuote({
    userId: '5214891112233@c.us',
    userName: 'Ana WhatsApp',
    guestName: 'Ana López',
    rooms: [JUNGLA],
    checkin: '2026-10-09',
    checkout: '2026-10-11',
    nights: 2,
    roomsTotal: 4800,
    totalPrice: 4800,
    depositAmount: 2400,
    ...overrides,
  });
}

test('createQuote guarda los campos nuevos y devuelve record/saldo/subtotal/discount/depositRule/createdAt', () => {
  const holdExpiresAt = '2026-09-12T23:45:00.000Z';
  const q = quote({
    waNumber: '+52 1 489 111 2233',
    subtotal: 5000,
    discount: 200,
    saldo: 2400,
    depositRule: '50%',
    holdExpiresAt,
    blockConfirmed: true,
    supersedes: 'WA-VIEJO1',
  });

  // Lo de antes sigue igual para los llamadores actuales
  assert.match(q.folio, /^WA-[0-9A-Z]+$/);
  assert.equal(q.totalPrice, 4800);
  assert.equal(q.roomsTotal, 4800);
  assert.equal(q.toursTotal, 0);
  assert.equal(q.depositAmount, 2400);
  assert.ok(q.bankInfo.clabe && q.bankInfo.banco && q.bankInfo.titular && q.bankInfo.cuenta);

  // Lo nuevo
  assert.equal(q.saldo, 2400);
  assert.equal(q.subtotal, 5000);
  assert.equal(q.discount, 200);
  assert.equal(q.depositRule, '50%');
  assert.ok(!Number.isNaN(Date.parse(q.createdAt)));
  assert.equal(q.record.folio, q.folio);

  const saved = R.getByFolio(q.folio);
  assert.deepEqual(saved, q.record, 'record debe ser exactamente lo guardado');
  assert.equal(saved.status, 'PENDIENTE_PAGO');
  assert.equal(saved.channel, 'whatsapp');
  assert.equal(saved.waNumber, '5214891112233');
  assert.equal(saved.userName, 'Ana López');
  assert.equal(saved.subtotal, 5000);
  assert.equal(saved.discount, 200);
  assert.equal(saved.saldo, 2400);
  assert.equal(saved.depositRule, '50%');
  assert.equal(saved.holdExpiresAt, holdExpiresAt);
  assert.equal(saved.blockConfirmed, true);
  assert.equal(saved.supersedes, 'WA-VIEJO1');
  assert.equal(saved.guests, 2);
  assert.deepEqual(saved.room, JUNGLA);
});

test('createQuote sin campos nuevos: saldo = total − anticipo y folios únicos seguidos', () => {
  const a = quote();
  const b = quote();
  assert.notEqual(a.folio, b.folio, 'dos cotizaciones seguidas con el mismo folio');
  assert.equal(a.saldo, 2400);
  assert.equal(a.discount, 0);
  assert.equal(a.subtotal, 4800);
  assert.equal(a.depositRule, null);
  assert.equal(a.record.holdExpiresAt, null);
  assert.equal(a.record.blockConfirmed, null);
  assert.equal(a.record.waNumber, null);

  const unaNoche = quote({ nights: 1, totalPrice: 2400, roomsTotal: 2400, depositAmount: 2400 });
  assert.equal(unaNoche.saldo, 0);
});

test('updateReservation mezcla el patch, no cambia el folio y devuelve null si no existe', () => {
  const q = quote();
  const updated = R.updateReservation(q.folio, { holdExpiresAt: '2026-09-13T01:00:00.000Z', folio: 'WA-HACK' });
  assert.equal(updated.folio, q.folio);
  assert.equal(updated.holdExpiresAt, '2026-09-13T01:00:00.000Z');
  assert.equal(R.getByFolio(q.folio).holdExpiresAt, '2026-09-13T01:00:00.000Z');
  assert.equal(R.getByFolio('WA-HACK'), null);
  assert.equal(R.updateReservation('WA-NOEXISTE', { a: 1 }), null);
});

test('supersedeQuote marca REEMPLAZADA y solo aplica a PENDIENTE_PAGO sin comprobante', () => {
  const viejo = quote();
  const nuevo = quote({ supersedes: viejo.folio });
  const res = R.supersedeQuote(viejo.folio, nuevo.folio);
  assert.equal(res.folio, viejo.folio);
  assert.equal(res.status, 'REEMPLAZADA');
  assert.equal(res.supersededBy, nuevo.folio);
  assert.ok(!Number.isNaN(Date.parse(res.supersededAt)));
  assert.equal(R.getByFolio(viejo.folio).status, 'REEMPLAZADA');
  assert.equal(R.getByFolio(nuevo.folio).status, 'PENDIENTE_PAGO');

  assert.equal(R.supersedeQuote('WA-NOEXISTE', nuevo.folio), null);
  assert.equal(R.supersedeQuote(nuevo.folio, nuevo.folio), null);

  const pagado = quote();
  R.markPaymentProofReceived({ folio: pagado.folio });
  assert.equal(R.supersedeQuote(pagado.folio, nuevo.folio), null, 'no se reemplaza una cotización con comprobante');
  assert.equal(R.getByFolio(pagado.folio).status, 'PENDIENTE_PAGO');

  const confirmado = quote();
  R.confirmPayment(confirmado.folio);
  assert.equal(R.supersedeQuote(confirmado.folio, nuevo.folio), null, 'no se reemplaza una reserva confirmada');
  assert.equal(R.getByFolio(confirmado.folio).status, 'RESERVADO');
});

test('markPaymentProofReceived({ folio }) conserva el primer proofReceivedAt y cuenta comprobantes', async () => {
  const q = quote({ userId: '999000111222333@lid' });
  const first = R.markPaymentProofReceived({ folio: q.folio.toLowerCase().replace('-', '') });
  assert.equal(first.folio, q.folio);
  assert.equal(first.proofCount, 1);
  assert.ok(first.proofReceivedAt);
  assert.equal(first.lastProofAt, first.proofReceivedAt);

  await sleep(5);
  const second = R.markPaymentProofReceived({ folio: q.folio });
  assert.equal(second.proofCount, 2);
  assert.equal(second.proofReceivedAt, first.proofReceivedAt, 'se pisó la hora del primer comprobante');
  assert.ok(Date.parse(second.lastProofAt) > Date.parse(first.lastProofAt));
  assert.equal(second.status, 'PENDIENTE_PAGO', 'el comprobante no confirma la reserva');

  const saved = R.getByFolio(q.folio);
  assert.equal(saved.proofCount, 2);
  assert.equal(R.markPaymentProofReceived({ folio: 'WA-NOEXISTE' }), null);
});

test('markPaymentProofReceived(userId) sigue funcionando como antes', () => {
  const userId = '5214895550000@c.us';
  const viejo = quote({ userId });
  const nuevo = quote({ userId });
  // Un registro legado con comprobante pero sin proofCount
  R.updateReservation(viejo.folio, { createdAt: '2026-01-01T00:00:00.000Z' });

  const res = R.markPaymentProofReceived(userId);
  assert.equal(res.folio, nuevo.folio, 'debía marcar la PENDIENTE_PAGO más reciente del usuario');
  assert.equal(res.proofCount, 1);
  assert.ok(res.proofReceivedAt);
  assert.equal(R.getByFolio(viejo.folio).proofReceivedAt, undefined);

  assert.equal(R.markPaymentProofReceived('5210000000000@c.us'), null);

  const legado = quote({ userId: '5214895551111@c.us' });
  R.updateReservation(legado.folio, { proofReceivedAt: '2026-09-01T00:00:00.000Z' });
  const legadoRes = R.markPaymentProofReceived('5214895551111@c.us');
  assert.equal(legadoRes.proofCount, 2, 'un registro con proofReceivedAt viejo ya contaba 1');
  assert.equal(legadoRes.proofReceivedAt, '2026-09-01T00:00:00.000Z');
});

test('findLatestPendingByPhone: chat @lid con waNumber, dígitos del @c.us, más reciente e ignora REEMPLAZADA/RESERVADO', () => {
  // @lid: el JID no es el teléfono; se encuentra por el waNumber guardado
  const lid = quote({ userId: '123456789012345@lid', waNumber: '5214897001122' });
  assert.equal(R.findLatestPendingByPhone(['4897001122', '524897001122', '5214897001122'])?.folio, lid.folio);
  assert.equal(R.findLatestPendingByPhone(['524897001122'])?.folio, lid.folio, '52 vs 521 deben coincidir');

  // @c.us sin waNumber: se encuentra por los dígitos del userId
  const cus = quote({ userId: '5214897003344@c.us' });
  assert.equal(R.findLatestPendingByPhone(['4897003344'])?.folio, cus.folio);

  // Dos pendientes del mismo teléfono → la más reciente
  const otroViejo = quote({ userId: '5214897005566@c.us' });
  const otroNuevo = quote({ userId: '777777777777777@lid', waNumber: '4897005566' });
  R.updateReservation(otroViejo.folio, { createdAt: '2026-09-10T10:00:00.000Z' });
  R.updateReservation(otroNuevo.folio, { createdAt: '2026-09-11T10:00:00.000Z' });
  assert.equal(R.findLatestPendingByPhone(['5214897005566'])?.folio, otroNuevo.folio);

  // La más reciente reemplazada → cae a la anterior pendiente
  R.supersedeQuote(otroNuevo.folio, 'WA-OTRO');
  assert.equal(R.findLatestPendingByPhone(['5214897005566'])?.folio, otroViejo.folio);

  // Confirmada ya no es "pendiente"
  R.confirmPayment(otroViejo.folio);
  assert.equal(R.findLatestPendingByPhone(['5214897005566']), null);

  // Candidatos vacíos o cortos no encuentran nada
  assert.equal(R.findLatestPendingByPhone([]), null);
  assert.equal(R.findLatestPendingByPhone(['']), null);
  assert.equal(R.findLatestPendingByPhone(['1122']), null);
  assert.equal(R.findLatestPendingByPhone(['5215550009999']), null);
});

test('getLocallyReservedBackendNames: RESERVADO bloquea, REEMPLAZADA y PENDIENTE_PAGO no', () => {
  const requestedRooms = [
    { id: 'lirios_1', name: 'Lirios 1', backendName: 'Lirios 1' },
    { id: 'lirios_2', name: 'Lirios 2', backendName: 'Lirios 2' },
  ];
  const range = { checkin: '2026-12-01', checkout: '2026-12-03', requestedRooms };
  const base = { checkin: '2026-12-01', checkout: '2026-12-03', totalPrice: 3800, roomsTotal: 3800, depositAmount: 1900 };

  const pendiente = quote({ ...base, rooms: [{ ...LIRIOS, checkin: '2026-12-01', checkout: '2026-12-03' }] });
  assert.deepEqual(R.getLocallyReservedBackendNames(range), [], 'PENDIENTE_PAGO no bloquea');

  const nueva = quote({ ...base, rooms: [{ ...LIRIOS, checkin: '2026-12-01', checkout: '2026-12-03' }] });
  R.supersedeQuote(pendiente.folio, nueva.folio);
  R.updateReservation(pendiente.folio, { status: 'REEMPLAZADA' });
  assert.deepEqual(R.getLocallyReservedBackendNames(range), [], 'REEMPLAZADA no bloquea');

  R.confirmPayment(nueva.folio);
  assert.deepEqual(R.getLocallyReservedBackendNames(range), ['Lirios 1']);

  // Una REEMPLAZADA por nombre (sin id) tampoco cuenta
  const porNombre = quote({ ...base, rooms: [{ name: 'Lirios 2', guests: 4, price: 3800 }] });
  R.updateReservation(porNombre.folio, { status: 'REEMPLAZADA' });
  assert.deepEqual(R.getLocallyReservedBackendNames(range), ['Lirios 1']);
});

test('getByUser devuelve la más reciente del usuario (sin importar el estado)', () => {
  const userId = '5214898889999@c.us';
  const a = quote({ userId });
  const b = quote({ userId });
  assert.equal(R.getByUser(userId).folio, b.folio);
  R.updateReservation(b.folio, { createdAt: '2020-01-01T00:00:00.000Z' });
  assert.equal(R.getByUser(userId).folio, a.folio);
  assert.equal(R.getByUser('nadie@c.us'), null);
});
