// Pruebas de quote-summary.js: el resumen que ve el cliente y el aviso al grupo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuoteSummary, buildQuoteGroupAlert } from '../quote-summary.js';
import { formatTimeMx } from '../format-mx.js';

// Mediodía en México (UTC-6): 2026-09-12 14:00 hora local
const NOW = new Date('2026-09-12T20:00:00Z');
// 18:45 hora de México del mismo día
const HOLD_TODAY = '2026-09-13T00:45:00Z';

const BANK = {
  banco: 'Banco de Prueba',
  titular: 'Titular de Prueba',
  clabe: '012345678901234567',
  cuenta: '1111222233334444',
};

const VOSEO = /\b(tenés|podés|querés|mandame|vos|liquidás|pagás|enviame)\b/i;

function baseQuote(overrides = {}) {
  return {
    folio: 'WA-TEST123',
    guestName: 'Ana López',
    checkin: '2026-10-09',
    checkout: '2026-10-11',
    nights: 2,
    guests: 5,
    rooms: [{ name: 'Helechos I Familiar', guests: 5, checkin: '2026-10-09', checkout: '2026-10-11', nights: 2, pricePerNight: 2700, price: 5400 }],
    subtotal: 5400,
    discount: 0,
    totalPrice: 5400,
    depositAmount: 2700,
    saldo: 2700,
    depositRule: '50',
    holdExpiresAt: HOLD_TODAY,
    blockConfirmed: true,
    ...overrides,
  };
}

test('resumen normal: folio, montos, confirmación, CLABE y hora de apartado en hora de México', () => {
  const text = buildQuoteSummary(baseQuote(), { bankInfo: BANK, now: NOW });
  assert.match(text, /Folio WA-TEST123/);
  assert.match(text, /A nombre de: \*Ana López\*/);
  assert.match(text, /viernes 9 de octubre\* \(check-in 3:00 p\.m\.\)/);
  assert.match(text, /domingo 11 de octubre\* \(check-out 12:00 p\.m\.\)/);
  assert.match(text, /2 noches · 👥 5 personas/);
  assert.match(text, /Helechos I Familiar \(5 personas\) — \$2,700 × 2 noches = \$5,400/);
  assert.match(text, /💰 \*Total: \$5,400 MXN\*/);
  assert.match(text, /Anticipo para apartar: \$2,700 MXN\* \(50%\)/);
  assert.match(text, /Saldo a pagar al llegar al hotel: \$2,700 MXN/);
  assert.match(text, /confirmada/);
  assert.ok(text.includes(BANK.clabe), 'trae la CLABE inyectada');
  assert.ok(text.includes('Banco de Prueba'));
  assert.ok(text.includes('Titular de Prueba'));
  assert.ok(text.includes('1111 2222 3333 4444'), 'tarjeta OXXO en bloques de 4');
  assert.match(text, /Concepto: WA-TEST123/);
  assert.match(text, /foto o el PDF de tu comprobante/);
  // 00:45 UTC = 6:45 p.m. en México, y es "de hoy"
  const expected = formatTimeMx(HOLD_TODAY);
  assert.match(expected, /^6:45\s?p\.\s?m\.$/u);
  assert.ok(text.includes(`hasta las *${expected}* de hoy.`), text);
  assert.doesNotMatch(text, /Subtotal|Descuento/);
  assert.doesNotMatch(text, /tour/i);
  assert.doesNotMatch(text, VOSEO);
});

test('apartado que vence otro día dice la fecha; sin hora y con bloqueo, se omite la línea', () => {
  const tomorrow = buildQuoteSummary(baseQuote({ holdExpiresAt: '2026-09-13T07:15:00Z' }), { bankInfo: BANK, now: NOW });
  assert.match(tomorrow, /hasta la \*1:15\s?a\.\s?m\.\* del domingo 13 de septiembre\./u);

  const noHold = buildQuoteSummary(baseQuote({ holdExpiresAt: null }), { bankInfo: BANK, now: NOW });
  assert.doesNotMatch(noHold, /Te apartamos/);
  assert.ok(noHold.includes(BANK.clabe));
});

test('sin bloqueo confirmado: sin datos bancarios y con "Todavía no hagas el pago"', () => {
  const text = buildQuoteSummary(baseQuote({ blockConfirmed: false, holdExpiresAt: null }), { bankInfo: BANK, now: NOW });
  assert.ok(!text.includes(BANK.clabe));
  assert.ok(!text.includes('1111'));
  assert.doesNotMatch(text, /Datos para tu pago|Te apartamos/);
  assert.match(text, /Todavía no hagas el pago/);
  assert.match(text, /Total: \$5,400 MXN/);
  assert.doesNotMatch(text, VOSEO);
});

test('estancia de 1 noche: pago del 100% y saldo $0', () => {
  const text = buildQuoteSummary(baseQuote({
    checkout: '2026-10-10', nights: 1,
    rooms: [{ name: 'Suite Jungla', guests: 2, pricePerNight: 1900, price: 1900 }],
    guests: 2, subtotal: 1900, totalPrice: 1900, depositAmount: 1900, saldo: 0, depositRule: 'una_noche',
  }), { bankInfo: BANK, now: NOW });
  assert.match(text, /💳 \*Pago para reservar: \$1,900 MXN\* \(100%, estancia de 1 noche\)/);
  assert.match(text, /🏡 \*Saldo al llegar: \$0\* \(queda pagado completo\)/);
  assert.match(text, /Suite Jungla \(2 personas\) — \$1,900 × 1 noche = \$1,900/);
  assert.doesNotMatch(text, /Saldo a pagar al llegar/);
});

test('grupo: subtotal, descuento de grupo y anticipo de $5,000', () => {
  const rooms = Array.from({ length: 8 }, (_, i) => ({ name: `Suite ${i + 1}`, guests: 4, pricePerNight: 1900, price: 3800 }));
  const text = buildQuoteSummary(baseQuote({
    guests: 32, rooms, subtotal: 30400, discount: 3040, totalPrice: 27360,
    depositAmount: 5000, saldo: 22360, depositRule: 'grupo',
  }), { bankInfo: BANK, now: NOW });
  assert.match(text, /· Subtotal: \$30,400 {2}· {2}Descuento de grupo \(10%\): −\$3,040/);
  assert.match(text, /💳 \*Anticipo para apartar \(grupo\): \$5,000 MXN\*/);
  assert.match(text, /Saldo a pagar al llegar al hotel: \$22,360 MXN/);
  assert.match(text, /Te apartamos las habitaciones/);
});

test('split-stay: cada renglón con sus fechas', () => {
  const text = buildQuoteSummary(baseQuote({
    guests: 2,
    rooms: [
      { name: 'Suite Jungla', guests: 2, checkin: '2026-10-09', checkout: '2026-10-10', nights: 1, pricePerNight: 1900, price: 1900 },
      { name: 'Suite LindaVista', guests: 2, checkin: '2026-10-10', checkout: '2026-10-11', nights: 1, pricePerNight: 1900, price: 1900 },
    ],
    subtotal: 3800, totalPrice: 3800, depositAmount: 1900, saldo: 1900,
  }), { bankInfo: BANK, now: NOW });
  assert.match(text, /Suite Jungla \(2 personas\) del vie 9 al sáb 10 — \$1,900 × 1 noche = \$1,900/);
  assert.match(text, /Suite LindaVista \(2 personas\) del sáb 10 al dom 11 — \$1,900 × 1 noche = \$1,900/);
  assert.match(text, /👥 2 personas/);
});

test('omite renglones bancarios vacíos', () => {
  const text = buildQuoteSummary(baseQuote(), { bankInfo: { clabe: '999', banco: '', titular: '' }, now: NOW });
  assert.match(text, /🏦 Transferencia SPEI · CLABE: 999/);
  assert.doesNotMatch(text, /OXXO|Titular/);
  const none = buildQuoteSummary(baseQuote(), { now: NOW });
  assert.doesNotMatch(none, /Datos para tu pago|Concepto/);
});

test('aviso al grupo: cliente, wa.me, montos, apartado y reemplazo', () => {
  const alert = buildQuoteGroupAlert(baseQuote({ guestEmail: 'ana@example.com', howFound: 'Google' }), {
    userName: 'Ani', waDigits: '5214891234567',
    supersededFolio: 'WA-OLD1', supersededCheckin: '2026-10-02', supersededCheckout: '2026-10-04',
  });
  assert.match(alert, /📋 \*NUEVA COTIZACIÓN — WhatsApp\*/);
  assert.match(alert, /Ana López · WhatsApp: Ani/);
  assert.match(alert, /wa\.me\/5214891234567/);
  assert.match(alert, /ana@example\.com/);
  assert.match(alert, /Nos encontró por:\* Google/);
  assert.match(alert, /Folio:\* WA-TEST123/);
  assert.match(alert, /Total: \$5,400 MXN/);
  assert.match(alert, /Anticipo: \$2,700 MXN/);
  assert.match(alert, /Saldo al llegar: \$2,700 MXN/);
  assert.ok(alert.includes(`Apartado hasta:* ${formatTimeMx(HOLD_TODAY)}`));
  assert.match(alert, /🔁 \*Reemplaza folio:\* WA-OLD1 \(antes viernes 2 de octubre → domingo 4 de octubre\) — apartado anterior liberado/);
  assert.doesNotMatch(alert, /SIN BLOQUEO/);
});

test('aviso al grupo sin bloqueo, sin email ni origen, con split-stay y descuento', () => {
  const alert = buildQuoteGroupAlert(baseQuote({
    blockConfirmed: false, holdExpiresAt: null, discount: 540, subtotal: 5940, totalPrice: 5400,
    rooms: [
      { name: 'Suite Jungla', guests: 2, checkin: '2026-10-09', checkout: '2026-10-10', nights: 1, pricePerNight: 1900, price: 1900 },
      { name: 'Suite LindaVista', guests: 2, checkin: '2026-10-10', checkout: '2026-10-11', nights: 1, pricePerNight: 1900, price: 1900 },
    ],
  }), { userName: 'Ana López', waDigits: '52 1 489 123 4567' });
  assert.match(alert, /🚨 \*SIN BLOQUEO CONFIRMADO\* — la\(s\) suite\(s\) NO quedaron apartadas\.\n👉 Validen disponibilidad a mano ANTES de aceptar el pago\./);
  assert.doesNotMatch(alert, /Email|Nos encontró|Reemplaza|Apartado hasta/);
  assert.match(alert, /wa\.me\/5214891234567/);
  assert.match(alert, /Estancia con cambio de suite/);
  assert.match(alert, /del vie 9 al sáb 10/);
  assert.match(alert, /Descuento de grupo \(10%\):\* −\$540 MXN/);
  assert.doesNotMatch(alert, /· WhatsApp: Ana López/);
});
