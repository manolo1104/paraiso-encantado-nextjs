/**
 * Pruebas de quote-flow.js (reglas puras del cambio de fechas).
 * Correr: node --test tests/date-change.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveQuoteDates,
  isQuoteStale,
  planSupersede,
  ownHoldSessionId,
  DATE_CHANGE_REGEX,
  PEOPLE_COUNT_REGEX,
  detectDateMentions,
  shouldBypassShortcuts
} from '../quote-flow.js';

// "Ahora" fijo: 12 sep 2026, 12:00 en México (18:00 UTC).
const NOW = new Date('2026-09-12T18:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();

const pending = (extra = {}) => ({
  folio: 'WA-ABC123',
  status: 'PENDIENTE_PAGO',
  checkin: '2026-10-09',
  checkout: '2026-10-11',
  createdAt: daysAgo(1),
  ...extra
});

describe('resolveQuoteDates', () => {
  test('mandan las fechas del modelo aunque la sesión tenga otras (bug L1115-1116)', () => {
    const res = resolveQuoteDates({
      rawCheckin: '2026-10-12', rawCheckout: '2026-10-14',
      session: { checkin: '2026-10-09', checkout: '2026-10-11' }
    });
    assert.deepEqual(res, { checkin: '2026-10-12', checkout: '2026-10-14', source: 'model' });
  });

  test('fechas del modelo inválidas → sesión completa (sin mezclar)', () => {
    const session = { checkin: '2026-10-09', checkout: '2026-10-11' };
    for (const [ci, co] of [
      ['12 de octubre', '2026-10-14'],     // formato
      ['2026-10-14', '2026-10-12'],        // checkout antes del checkin
      ['2026-10-12', '2026-10-12'],        // 0 noches
      ['2026-02-30', '2026-03-02'],        // fecha que no existe
      ['2026-10-12', undefined],           // falta una
      [undefined, undefined]
    ]) {
      assert.deepEqual(
        resolveQuoteDates({ rawCheckin: ci, rawCheckout: co, session }),
        { checkin: '2026-10-09', checkout: '2026-10-11', source: 'session' },
        `caso ${ci} → ${co}`
      );
    }
  });

  test('sin sesión y sin fechas válidas → null', () => {
    assert.deepEqual(resolveQuoteDates({ rawCheckin: 'x', rawCheckout: 'y' }), { checkin: null, checkout: null, source: 'session' });
    assert.deepEqual(resolveQuoteDates({ rawCheckin: 'x', rawCheckout: 'y', session: {} }), { checkin: null, checkout: null, source: 'session' });
  });

  test('sin sesión pero con fechas válidas del modelo → modelo', () => {
    assert.deepEqual(resolveQuoteDates({ rawCheckin: '2026-12-30', rawCheckout: '2027-01-02' }), { checkin: '2026-12-30', checkout: '2027-01-02', source: 'model' });
  });
});

describe('isQuoteStale', () => {
  test('vigente: llegada futura y creada hace 1 día', () => {
    assert.equal(isQuoteStale(pending(), { now: NOW }), false);
  });

  test('llegada ya pasada → stale', () => {
    assert.equal(isQuoteStale(pending({ checkin: '2026-09-11', checkout: '2026-09-13' }), { now: NOW }), true);
  });

  test('llegada HOY no es pasada (hora de México, no UTC)', () => {
    // 13 sep 03:00 UTC = 12 sep 21:00 en México → hoy sigue siendo el 12
    const lateNight = new Date('2026-09-13T03:00:00Z');
    assert.equal(isQuoteStale(pending({ checkin: '2026-09-12', createdAt: '2026-09-12T15:00:00Z' }), { now: lateNight }), false);
    // Y el 12 ya es pasado cuando en México es 13
    assert.equal(isQuoteStale(pending({ checkin: '2026-09-12', createdAt: '2026-09-12T15:00:00Z' }), { now: new Date('2026-09-13T07:00:00Z') }), true);
  });

  test('creada hace más de 7 días → stale; exactamente 7 días → todavía no', () => {
    assert.equal(isQuoteStale(pending({ createdAt: daysAgo(8) }), { now: NOW }), true);
    assert.equal(isQuoteStale(pending({ createdAt: daysAgo(7) }), { now: NOW }), false);
  });

  test('usa `timestamp` si no hay createdAt; sin fecha de creación solo cuenta la llegada', () => {
    assert.equal(isQuoteStale(pending({ createdAt: undefined, timestamp: daysAgo(10) }), { now: NOW }), true);
    assert.equal(isQuoteStale(pending({ createdAt: undefined }), { now: NOW }), false);
  });

  test('sin registro o sin checkin válido → stale', () => {
    assert.equal(isQuoteStale(null, { now: NOW }), true);
    assert.equal(isQuoteStale(pending({ checkin: undefined }), { now: NOW }), true);
  });
});

describe('planSupersede', () => {
  test('sin cotización anterior → none', () => {
    assert.deepEqual(planSupersede(null, { now: NOW }), { action: 'none', prevFolio: null });
  });

  test('PENDIENTE_PAGO vigente sin comprobante → supersede', () => {
    assert.deepEqual(planSupersede(pending(), { now: NOW }), { action: 'supersede', prevFolio: 'WA-ABC123' });
    assert.deepEqual(planSupersede(pending(), { replacesPrevious: true, now: NOW }), { action: 'supersede', prevFolio: 'WA-ABC123' });
  });

  test('replacesPrevious === false → none (cotización adicional), incluso si ya pagó', () => {
    assert.equal(planSupersede(pending(), { replacesPrevious: false, now: NOW }).action, 'none');
    assert.equal(planSupersede(pending({ proofReceivedAt: daysAgo(0) }), { replacesPrevious: false, now: NOW }).action, 'none');
    assert.equal(planSupersede(pending({ status: 'RESERVADO' }), { replacesPrevious: false, now: NOW }).action, 'none');
  });

  test('replacesPrevious undefined cuenta como true', () => {
    assert.equal(planSupersede(pending(), { replacesPrevious: undefined, now: NOW }).action, 'supersede');
  });

  test('ya REEMPLAZADA → none', () => {
    assert.equal(planSupersede(pending({ status: 'REEMPLAZADA' }), { now: NOW }).action, 'none');
  });

  test('otro estado (cancelada) → none', () => {
    assert.equal(planSupersede(pending({ status: 'CANCELADA' }), { now: NOW }).action, 'none');
  });

  test('PENDIENTE_PAGO stale (llegada pasada o > 7 días) → none', () => {
    assert.equal(planSupersede(pending({ checkin: '2026-09-01', checkout: '2026-09-03' }), { now: NOW }).action, 'none');
    assert.equal(planSupersede(pending({ createdAt: daysAgo(9) }), { now: NOW }).action, 'none');
  });

  test('ya mandó comprobante → requires_team', () => {
    assert.deepEqual(planSupersede(pending({ proofReceivedAt: daysAgo(0) }), { now: NOW }), { action: 'requires_team', prevFolio: 'WA-ABC123' });
  });

  test('RESERVADO / CONFIRMADA → requires_team', () => {
    assert.equal(planSupersede(pending({ status: 'RESERVADO' }), { now: NOW }).action, 'requires_team');
    assert.equal(planSupersede(pending({ status: 'CONFIRMADA' }), { now: NOW }).action, 'requires_team');
  });

  test('pagada/confirmada creada hace más de 7 días pero con llegada futura → sigue requires_team', () => {
    assert.equal(planSupersede(pending({ status: 'RESERVADO', createdAt: daysAgo(20) }), { now: NOW }).action, 'requires_team');
    assert.equal(planSupersede(pending({ proofReceivedAt: daysAgo(10), createdAt: daysAgo(12) }), { now: NOW }).action, 'requires_team');
  });

  test('confirmada con llegada ya pasada (huésped que regresa) → none', () => {
    assert.equal(planSupersede(pending({ status: 'RESERVADO', checkin: '2026-08-01', checkout: '2026-08-03' }), { now: NOW }).action, 'none');
  });
});

describe('ownHoldSessionId', () => {
  test("PENDIENTE_PAGO vigente → 'wa-<folio>'", () => {
    assert.equal(ownHoldSessionId(pending(), { now: NOW }), 'wa-WA-ABC123');
  });

  test('sin registro, stale, confirmada, reemplazada o sin folio → null', () => {
    assert.equal(ownHoldSessionId(null, { now: NOW }), null);
    assert.equal(ownHoldSessionId(pending({ createdAt: daysAgo(8) }), { now: NOW }), null);
    assert.equal(ownHoldSessionId(pending({ checkin: '2026-09-01' }), { now: NOW }), null);
    assert.equal(ownHoldSessionId(pending({ status: 'RESERVADO' }), { now: NOW }), null);
    assert.equal(ownHoldSessionId(pending({ status: 'REEMPLAZADA' }), { now: NOW }), null);
    assert.equal(ownHoldSessionId(pending({ folio: undefined }), { now: NOW }), null);
  });
});

describe('DATE_CHANGE_REGEX / PEOPLE_COUNT_REGEX / detectDateMentions', () => {
  test('frases de cambio de fechas', () => {
    for (const t of ['quiero cambiar las fechas', '¿se puede mover la reserva?', 'recorrerla un día', 'mejor del 12 al 14',
      'mejor para noviembre', 'en vez del viernes', 'queremos adelantar', 'posponer', 'extender la estancia',
      'una noche más', 'una noche mas', 'otro día', 'otras fechas']) {
      assert.ok(DATE_CHANGE_REGEX.test(t), t);
    }
    for (const t of ['hola', 'gracias', 'ya pagué', '¿a qué hora es el check-in?']) {
      assert.equal(DATE_CHANGE_REGEX.test(t), false, t);
    }
  });

  test('número de personas', () => {
    for (const t of ['somos 5 personas', 'somos 5', 'somos cuatro', '4 adultos', '6 huéspedes', '3 huespedes', '8 pax']) {
      assert.ok(PEOPLE_COUNT_REGEX.test(t), t);
    }
    assert.equal(PEOPLE_COUNT_REGEX.test('hola, ¿tienen alberca?'), false);
  });

  test('detector simple de fechas', () => {
    assert.equal(detectDateMentions('llegamos el 2026-10-09').length, 1);
    assert.equal(detectDateMentions('el 12 de Octubre').length, 1);
    assert.equal(detectDateMentions('del 9 al 11').length, 1);
    assert.equal(detectDateMentions('12/10').length, 1);
    assert.equal(detectDateMentions('hola, buenas tardes').length, 0);
  });
});

describe('shouldBypassShortcuts', () => {
  test("'mejor del 12 al 14' con cotización pendiente → true", () => {
    assert.equal(shouldBypassShortcuts('mejor del 12 al 14', { stage: 'cotizacion_pendiente_pago' }), true);
    // Aunque el extractDates de claude-handler no vea "del 12 al 14" (no trae mes), la frase basta
    assert.equal(shouldBypassShortcuts('mejor del 12 al 14', { stage: 'cotizacion_pendiente_pago', extractDates: () => [] }), true);
  });

  test("'somos 5 personas' en etapa nuevo → true", () => {
    assert.equal(shouldBypassShortcuts('somos 5 personas', { stage: 'nuevo' }), true);
  });

  test("'hola' → false", () => {
    assert.equal(shouldBypassShortcuts('hola', { stage: 'nuevo' }), false);
    assert.equal(shouldBypassShortcuts('hola', { stage: 'cotizacion_pendiente_pago' }), false);
  });

  test("'quiero cambiar las fechas' con cotización pendiente → true (y en pago_en_verificacion)", () => {
    assert.equal(shouldBypassShortcuts('quiero cambiar las fechas', { stage: 'cotizacion_pendiente_pago' }), true);
    assert.equal(shouldBypassShortcuts('quiero cambiar las fechas', { stage: 'pago_en_verificacion' }), true);
  });

  test("'gracias' → false", () => {
    assert.equal(shouldBypassShortcuts('gracias', { stage: 'cotizacion_pendiente_pago' }), false);
    assert.equal(shouldBypassShortcuts('gracias', { stage: 'nuevo' }), false);
  });

  test('palabras de cambio SIN cotización vigente no saltan atajos', () => {
    assert.equal(shouldBypassShortcuts('quiero cambiar las fechas', { stage: 'nuevo' }), false);
    assert.equal(shouldBypassShortcuts('una noche más', { stage: 'cotizando' }), false);
    assert.equal(shouldBypassShortcuts('quiero cambiar las fechas', {}), false);
  });

  test('fechas en cualquier etapa → true', () => {
    assert.equal(shouldBypassShortcuts('¿hay disponibilidad el 12 de octubre?', { stage: 'nuevo' }), true);
    assert.equal(shouldBypassShortcuts('2026-10-09', { stage: 'reserva_confirmada' }), true);
  });

  test('extractDates inyectado recibe el texto normalizado y manda sobre el detector simple', () => {
    const seen = [];
    const fakeExtract = (t) => { seen.push(t); return t.includes('octubre') ? ['2026-10-12'] : []; };
    assert.equal(shouldBypassShortcuts('El 12 de OCTUBRE', { stage: 'nuevo', extractDates: fakeExtract }), true);
    assert.equal(seen[0], 'el 12 de octubre');
    // El inyectado no ve "del 9 al 11" → sin personas ni etapa pendiente → false
    assert.equal(shouldBypassShortcuts('del 9 al 11', { stage: 'nuevo', extractDates: () => [] }), false);
    // Un extractDates que revienta no rompe el flujo
    assert.equal(shouldBypassShortcuts('hola', { stage: 'nuevo', extractDates: () => { throw new Error('x'); } }), false);
  });
});
