// Pruebas de pricing.js: anticipo, saldo y descuento de grupo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeQuoteAmounts, getRoomPricePerNight,
  GROUP_MIN_ROOMS, GROUP_DEPOSIT, GROUP_DISCOUNT_RATE,
} from '../pricing.js';

test('constantes de grupo', () => {
  assert.equal(GROUP_MIN_ROOMS, 8);
  assert.equal(GROUP_DEPOSIT, 5000);
  assert.equal(GROUP_DISCOUNT_RATE, 0.10);
});

test('1 noche → se paga el 100% y el saldo es 0', () => {
  const r = computeQuoteAmounts({ roomsSubtotal: 1900, nights: 1, roomsCount: 1 });
  assert.deepEqual(r, { subtotal: 1900, discount: 0, total: 1900, deposit: 1900, saldo: 0, depositRule: 'una_noche' });
});

test('2 noches → 50/50', () => {
  const r = computeQuoteAmounts({ roomsSubtotal: 5400, nights: 2, roomsCount: 1 });
  assert.deepEqual(r, { subtotal: 5400, discount: 0, total: 5400, deposit: 2700, saldo: 2700, depositRule: '50' });
});

test('2+ noches con total impar → anticipo redondeado y saldo cuadra', () => {
  const r = computeQuoteAmounts({ roomsSubtotal: 3801, nights: 3, roomsCount: 2 });
  assert.equal(r.deposit, 1901); // Math.round(1900.5)
  assert.equal(r.saldo, 1900);
  assert.equal(r.deposit + r.saldo, r.total);
  assert.equal(r.depositRule, '50');
});

test('8 habitaciones → descuento 10% y anticipo de $5,000', () => {
  const r = computeQuoteAmounts({ roomsSubtotal: 15200, nights: 2, roomsCount: 8 });
  assert.equal(r.discount, 1520);
  assert.equal(r.total, 13680);
  assert.equal(r.deposit, 5000);
  assert.equal(r.saldo, 8680);
  assert.equal(r.depositRule, 'grupo');
});

test('grupo de 1 noche también usa el anticipo de grupo (no el 100%)', () => {
  const r = computeQuoteAmounts({ roomsSubtotal: 15200, nights: 1, roomsCount: 9 });
  assert.equal(r.depositRule, 'grupo');
  assert.equal(r.deposit, 5000);
});

test('8 habitaciones con total menor a $5,000 → anticipo = total, saldo 0', () => {
  const r = computeQuoteAmounts({ roomsSubtotal: 4000, nights: 1, roomsCount: 8 });
  assert.equal(r.discount, 400);
  assert.equal(r.total, 3600);
  assert.equal(r.deposit, 3600);
  assert.equal(r.saldo, 0);
});

test('7 habitaciones no es grupo', () => {
  const r = computeQuoteAmounts({ roomsSubtotal: 14000, nights: 2, roomsCount: 7 });
  assert.equal(r.discount, 0);
  assert.equal(r.depositRule, '50');
});

test('nunca negativos con entradas raras', () => {
  for (const input of [{}, { roomsSubtotal: -500, nights: 2, roomsCount: 1 }, { roomsSubtotal: 'abc', nights: null, roomsCount: undefined }]) {
    const r = computeQuoteAmounts(input);
    for (const k of ['subtotal', 'discount', 'total', 'deposit', 'saldo']) {
      assert.ok(r[k] >= 0, `${k} negativo con ${JSON.stringify(input)}`);
    }
  }
});

test('getRoomPricePerNight conserva la lógica del bot', () => {
  const helechos = { price_2: 1900, price_3_4: 2400, price_5: 2700, price_6: 3000, max_occupancy: 6, extra_person: 300 };
  assert.equal(getRoomPricePerNight(helechos, 2), 1900);
  assert.equal(getRoomPricePerNight(helechos, 4), 2400);
  assert.equal(getRoomPricePerNight(helechos, 5), 2700);
  assert.equal(getRoomPricePerNight(helechos, 6), 3000);
  assert.equal(getRoomPricePerNight({ price_2: 1500, max_occupancy: 2 }, 1), 1500);
  assert.equal(getRoomPricePerNight(null, 2), 1900);
});
