/**
 * Pruebas de availability.js — sin red, sin Google Sheets y sin reservations.json:
 * todo entra por deps (fetch falso que registra el body, hoja falsa, reservas falsas).
 * Correr: node --test tests/availability.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createAvailabilityService, buildSplitSegments } from '../availability.js';

// ── Catálogo de prueba (mismos campos que ROOMS de hotel-knowledge.js) ─────
const JUNGLA = {
  id: 'jungla', name: 'Suite Jungla', backendName: 'Jungla', category: 'Vista a las Montañas ⭐ Preferida',
  url: 'https://paraisoencantado.com/habitaciones/jungla', description: 'no debe salir', beds: 'x',
  price_2: 1900, price_3_4: 2400, max_occupancy: 4, extra_person: 500,
  highlights: ['Piscina privada'], features: ['no debe salir']
};
const LINDAVISTA = {
  id: 'suite-lindavista', name: 'Suite LindaVista', backendName: 'Suite LindaVista', category: 'Vista a las Montañas',
  url: 'https://paraisoencantado.com/habitaciones/lindavista', description: 'd', beds: 'x',
  price_2: 1900, price_3_4: 2400, max_occupancy: 4, highlights: ['Tina de hidromasaje'], features: []
};
const LIRIOS1 = {
  id: 'lirios-1', name: 'Lirios 1', backendName: 'Lirios 1', category: 'Vista a los Jardines',
  url: 'https://paraisoencantado.com/habitaciones/lirios-1', description: 'd', beds: 'x',
  price_2: 1500, price_3_4: 1900, max_occupancy: 4, extra_person: 400, highlights: ['Balcón'], features: []
};
const ORQUIDEAS2 = {
  id: 'orquideas-2', name: 'Orquídeas 2', backendName: 'Orquídeas 2', category: 'Vista a los Jardines',
  url: 'https://paraisoencantado.com/habitaciones/orquideas-2', description: 'd', beds: 'x',
  price_2: 1500, max_occupancy: 2, highlights: ['King'], features: []
};
const HELECHOS1 = {
  id: 'helechos-1', name: 'Helechos 1', backendName: 'Helechos 1', category: 'Familiar',
  url: 'https://paraisoencantado.com/habitaciones/helechos-1', description: 'd', beds: 'x',
  price_2: 1900, price_3_4: 2400, price_5: 2700, price_6: 3000, max_occupancy: 6, extra_person: 300,
  highlights: ['Hasta 6'], features: []
};
const ROOMS = [JUNGLA, LINDAVISTA, LIRIOS1, ORQUIDEAS2, HELECHOS1];

const API = 'https://www.paraisoencantado.com';
const silentLog = { warn() {}, log() {} };

// fetch falso: registra cada llamada y responde con `responder(body, url)`.
function makeFetch(responder = () => ({ unavailableRooms: [] })) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url, init, body });
    const out = await responder(body, url);
    if (out instanceof Error) throw out;
    if (out && out.__status) {
      return { ok: false, status: out.__status, url, text: async () => '', json: async () => { throw new Error('Unexpected end of JSON input'); } };
    }
    return { ok: true, status: 200, url, json: async () => out, text: async () => JSON.stringify(out) };
  };
  return { fetchImpl, calls };
}

// La hoja "sin configurar" de local: getSheetValues revienta.
const sheetNotConfigured = async () => { throw new Error('Falta GOOGLE_SHEET_ID'); };

function makeService(overrides = {}) {
  return createAvailabilityService({
    rooms: ROOMS,
    bookingApi: API,
    hasGoogleConfig: false,
    getUnavailableRoomsFromGoogleSheet: sheetNotConfigured,
    getLocallyReservedBackendNames: () => [],
    findAlternativeDates: async () => ({ alternatives: [] }),
    getPerNightUnavailableFromSheet: sheetNotConfigured,
    log: silentLog,
    ...overrides
  });
}

// Lo que devolvía check_availability para una suite libre (claude-handler.js L960-966).
const publicRoom = (r) => ({
  id: r.id, name: r.name, category: r.category, url: r.url,
  price_2: r.price_2, price_3_4: r.price_3_4, max_occupancy: r.max_occupancy, highlights: r.highlights
});

describe('computeAvailability — forma del resultado igual a check_availability', () => {
  test('Sheets desactivado + backend responde: available_rooms con los campos de siempre', async () => {
    const { fetchImpl, calls } = makeFetch(() => ({ available: false, unavailableRooms: ['Jungla'], degraded: false }));
    const svc = makeService({ fetchImpl });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11', guests: 2 });

    assert.deepEqual(res, {
      available: true,
      available_rooms: [LINDAVISTA, LIRIOS1, ORQUIDEAS2, HELECHOS1].map(publicRoom)
    });
    assert.equal('dates_corrected' in res, false);
    // Una sola llamada al backend con todas las suites pedidas
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `${API}/api/check-availability`);
    assert.equal(calls[0].init.method, 'POST');
    assert.deepEqual(calls[0].body, {
      checkin: '2026-10-09', checkout: '2026-10-11',
      rooms: ['Jungla', 'Suite LindaVista', 'Lirios 1', 'Orquídeas 2', 'Helechos 1']
    });
    assert.equal('sessionId' in calls[0].body, false, 'sin excludeSessionId no se manda sessionId');
    assert.ok(calls[0].init.signal, 'lleva timeout (AbortSignal)');
  });

  test('excludeSessionId viaja en el body y se usan los headers inyectados', async () => {
    const { fetchImpl, calls } = makeFetch(() => ({ unavailableRooms: [] }));
    const svc = makeService({ fetchImpl, getHeaders: () => ({ 'Content-Type': 'application/json', 'x-agent-token': 'tok' }) });
    await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11', excludeSessionId: 'wa-WA-ABC123' });
    assert.equal(calls[0].body.sessionId, 'wa-WA-ABC123');
    assert.deepEqual(calls[0].init.headers, { 'Content-Type': 'application/json', 'x-agent-token': 'tok' });
  });

  test('datesCorrected agrega dates_corrected + fechas (lo decide el llamador)', async () => {
    const { fetchImpl } = makeFetch();
    const svc = makeService({ fetchImpl });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11', datesCorrected: true });
    assert.equal(res.available, true);
    assert.equal(res.dates_corrected, true);
    assert.equal(res.checkin, '2026-10-09');
    assert.equal(res.checkout, '2026-10-11');
  });

  test('roomIds: id exacto, id con prefijo "suite-" y id inexistente', async () => {
    const { fetchImpl, calls } = makeFetch();
    const svc = makeService({ fetchImpl });
    const a = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11', roomIds: ['lirios-1'] });
    assert.deepEqual(a.available_rooms.map(r => r.id), ['lirios-1']);
    const b = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11', roomIds: ['suite-jungla'] });
    assert.deepEqual(b.available_rooms.map(r => r.id), ['jungla']);
    const c = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11', roomIds: ['no-existe'] });
    assert.deepEqual(c, { available: false, message: 'No se encontraron habitaciones válidas para verificar.' });
    assert.equal(calls.length, 2, 'sin habitaciones válidas no se consulta nada');
  });

  test('las 3 fuentes se suman: hoja + backend + reservas locales', async () => {
    const { fetchImpl } = makeFetch(() => ({ unavailableRooms: ['Suite LindaVista'] }));
    const svc = makeService({
      fetchImpl,
      hasGoogleConfig: true,
      getUnavailableRoomsFromGoogleSheet: async () => ({ dispReadOk: true, unavailableRooms: [JUNGLA] }),
      getLocallyReservedBackendNames: () => ['Lirios 1']
    });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11' });
    assert.deepEqual(res.available_rooms.map(r => r.id), ['orquideas-2', 'helechos-1']);
  });

  test('sin suites libres (1 noche): unavailable_rooms + alternative_dates, sin split_stay', async () => {
    const { fetchImpl } = makeFetch(() => ({ unavailableRooms: ROOMS.map(r => r.backendName) }));
    const altCalls = [];
    const alternatives = [{ checkin: '2026-10-10', checkout: '2026-10-11', nights: 1, dayName: 'Sábado', formattedDate: '10 de octubre de 2026', availableCount: 1, availableRooms: [{ id: 'jungla', name: 'Suite Jungla', price_2: 1900, price_3_4: 2400 }] }];
    const svc = makeService({
      fetchImpl,
      findAlternativeDates: async (...args) => { altCalls.push(args); return { success: true, alternatives }; },
      getPerNightUnavailableFromSheet: async () => { throw new Error('no debe llamarse con 1 noche'); }
    });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-10', roomIds: ['jungla', 'lirios-1'] });
    assert.deepEqual(res, {
      available: false,
      message: 'No hay disponibilidad para las fechas solicitadas.',
      unavailable_rooms: [JUNGLA, LIRIOS1].map(r => ({ id: r.id, name: r.name, category: r.category, url: r.url })),
      alternative_dates: alternatives
    });
    assert.equal(altCalls.length, 1);
    assert.deepEqual(altCalls[0].slice(0, 2), ['2026-10-09', '2026-10-10']);
    assert.deepEqual(altCalls[0][2].map(r => r.id), ['jungla', 'lirios-1']);
    assert.equal(altCalls[0][3], 5);
  });

  test('findAlternativeDates que revienta → alternative_dates vacío (como el .catch de antes)', async () => {
    const { fetchImpl } = makeFetch(() => ({ unavailableRooms: ROOMS.map(r => r.backendName) }));
    const svc = makeService({ fetchImpl, findAlternativeDates: async () => { throw new Error('boom'); } });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-10' });
    assert.equal(res.available, false);
    assert.deepEqual(res.alternative_dates, []);
  });
});

describe('computeAvailability — fail-closed (mismas reglas que hoy)', () => {
  test('Google configurado y la hoja falla → google_sheets_unavailable, sin llamar al backend', async () => {
    const { fetchImpl, calls } = makeFetch();
    const svc = makeService({ fetchImpl, hasGoogleConfig: true, getUnavailableRoomsFromGoogleSheet: async () => { throw new Error('403'); } });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11' });
    assert.equal(res.verification_failed, true);
    assert.equal(res.error, 'google_sheets_unavailable');
    assert.match(res.message, /NO SE PUDO VERIFICAR/);
    assert.equal('available' in res, false);
    assert.equal(calls.length, 0);
  });

  test('Google configurado, matriz Disponibilidad ilegible y backend caído (502) → ota_source_unavailable', async () => {
    const { fetchImpl } = makeFetch(() => ({ __status: 502 }));
    const svc = makeService({ fetchImpl, hasGoogleConfig: true, getUnavailableRoomsFromGoogleSheet: async () => ({ dispReadOk: false, unavailableRooms: [] }) });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11' });
    assert.equal(res.verification_failed, true);
    assert.equal(res.error, 'ota_source_unavailable');
  });

  test('backend `degraded: true` no cuenta como verificado', async () => {
    const { fetchImpl } = makeFetch(() => ({ unavailableRooms: [], degraded: true }));
    const svc = makeService({ fetchImpl, hasGoogleConfig: true, getUnavailableRoomsFromGoogleSheet: async () => ({ dispReadOk: false, unavailableRooms: [] }) });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11' });
    assert.equal(res.error, 'ota_source_unavailable');
  });

  test('matriz ilegible pero backend OK → sí se puede afirmar (el backend también ve OTA)', async () => {
    const { fetchImpl } = makeFetch(() => ({ unavailableRooms: [] }));
    const svc = makeService({ fetchImpl, hasGoogleConfig: true, getUnavailableRoomsFromGoogleSheet: async () => ({ dispReadOk: false, unavailableRooms: [] }) });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11' });
    assert.equal(res.available, true);
  });

  test('backend caído (red) + SIN Google: igual que hoy, NO se corta (fail-open local sin credenciales)', async () => {
    // Hoy (claude-handler.js L933-951) las dos reglas fail-closed exigen hasGoogleConfig.
    // Sin credenciales (entorno local / simulador) el resultado se arma con lo que haya.
    const { fetchImpl, calls } = makeFetch(() => new Error('ECONNREFUSED'));
    const svc = makeService({ fetchImpl, hasGoogleConfig: false });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11' });
    assert.equal(res.verification_failed, undefined);
    assert.equal(res.available, true);
    assert.equal(calls.length, 1);
  });

  test('backend caído (red) + CON Google y matriz ilegible → fail-closed', async () => {
    const { fetchImpl } = makeFetch(() => new Error('ECONNREFUSED'));
    const svc = makeService({ fetchImpl, hasGoogleConfig: true, getUnavailableRoomsFromGoogleSheet: async () => ({ dispReadOk: false, unavailableRooms: [] }) });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11' });
    assert.equal(res.verification_failed, true);
  });
});

describe('computeAvailability — split-stay', () => {
  test('3 noches sin una suite libre todo el rango → split_stay con cambio de suite y sessionId por noche', async () => {
    const all = ROOMS.map(r => r.backendName);
    const { fetchImpl, calls } = makeFetch((body) => {
      // Rango completo: todo ocupado. Por noche: el backend no bloquea nada extra.
      if (body.checkin === '2026-10-09' && body.checkout === '2026-10-12') return { unavailableRooms: all };
      return { unavailableRooms: [] };
    });
    const perNightArgs = [];
    const svc = makeService({
      fetchImpl,
      getPerNightUnavailableFromSheet: async (args) => {
        perNightArgs.push(args);
        return [
          { date: '2026-10-09', checkout: '2026-10-10', blockedBackendNames: all.filter(n => n !== 'Jungla') },
          { date: '2026-10-10', checkout: '2026-10-11', blockedBackendNames: all.filter(n => n !== 'Jungla') },
          { date: '2026-10-11', checkout: '2026-10-12', blockedBackendNames: all.filter(n => n !== 'Suite LindaVista') }
        ];
      }
    });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-12', guests: 2, excludeSessionId: 'wa-WA-X1' });

    assert.equal(res.available, false);
    assert.match(res.message, /cambio de suite/);
    assert.deepEqual(res.split_stay, {
      feasible: true, guests: 2, changes: 1, total_price: 5700,
      segments: [
        { room_id: 'jungla', room_name: 'Suite Jungla', guests: 2, checkin: '2026-10-09', checkout: '2026-10-11', nights: 2, price_per_night: 1900, subtotal: 3800 },
        { room_id: 'suite-lindavista', room_name: 'Suite LindaVista', guests: 2, checkin: '2026-10-11', checkout: '2026-10-12', nights: 1, price_per_night: 1900, subtotal: 1900 }
      ]
    });
    // Candidatas por capacidad (2 huéspedes = todas)
    assert.equal(perNightArgs[0].requestedRooms.length, ROOMS.length);
    // 1 llamada del rango + 3 por noche, todas con sessionId
    assert.equal(calls.length, 4);
    for (const c of calls) assert.equal(c.body.sessionId, 'wa-WA-X1');
    assert.deepEqual(calls.slice(1).map(c => c.body.checkin).sort(), ['2026-10-09', '2026-10-10', '2026-10-11']);
  });

  test('guests filtra candidatas por capacidad (5 → solo Helechos) y el backend por noche también bloquea', async () => {
    const { fetchImpl } = makeFetch((body) => {
      if (body.checkout === '2026-10-11' && body.checkin === '2026-10-09') return { unavailableRooms: ROOMS.map(r => r.backendName) };
      if (body.checkin === '2026-10-10') return { unavailableRooms: ['Helechos 1'] };
      return { unavailableRooms: [] };
    });
    let candidates = null;
    const svc = makeService({
      fetchImpl,
      getPerNightUnavailableFromSheet: async ({ requestedRooms }) => {
        candidates = requestedRooms.map(r => r.id);
        return [
          { date: '2026-10-09', checkout: '2026-10-10', blockedBackendNames: [] },
          { date: '2026-10-10', checkout: '2026-10-11', blockedBackendNames: [] }
        ];
      }
    });
    const res = await svc.computeAvailability({ checkin: '2026-10-09', checkout: '2026-10-11', guests: 5 });
    assert.deepEqual(candidates, ['helechos-1']);
    assert.equal(res.split_stay, undefined, 'la noche 10 queda llena → no factible → sin split_stay');
    assert.equal(res.message, 'No hay disponibilidad para las fechas solicitadas.');
  });
});

describe('collectUnavailable', () => {
  test('devuelve nombres únicos y banderas de cada fuente', async () => {
    const { fetchImpl } = makeFetch(() => ({ unavailableRooms: ['Jungla', 'Lirios 1'] }));
    const svc = makeService({
      fetchImpl,
      hasGoogleConfig: true,
      getUnavailableRoomsFromGoogleSheet: async () => ({ dispReadOk: true, unavailableRooms: [JUNGLA] }),
      getLocallyReservedBackendNames: () => ['Helechos 1']
    });
    const out = await svc.collectUnavailable({ checkin: '2026-10-09', checkout: '2026-10-11', requestedRooms: ROOMS, excludeSessionId: 'wa-WA-1' });
    assert.deepEqual(out.names.sort(), ['Helechos 1', 'Jungla', 'Lirios 1']);
    assert.equal(out.sheetReadOk, true);
    assert.equal(out.dispReadOk, true);
    assert.equal(out.backendOk, true);
  });

  test('backend con 405 → backendOk false y no revienta', async () => {
    const { fetchImpl } = makeFetch(() => ({ __status: 405 }));
    const svc = makeService({ fetchImpl });
    const out = await svc.collectUnavailable({ checkin: '2026-10-09', checkout: '2026-10-11', requestedRooms: [JUNGLA] });
    assert.deepEqual(out, { names: [], sheetReadOk: false, dispReadOk: false, backendOk: false });
  });
});

describe('verifyRoomsAvailable', () => {
  const CI = '2026-10-09';
  const CO = '2026-10-11';

  test('ok cuando nada está ocupado; manda el sessionId del apartado propio', async () => {
    const { fetchImpl, calls } = makeFetch(() => ({ unavailableRooms: [] }));
    const sheetArgs = [];
    const svc = makeService({
      fetchImpl,
      hasGoogleConfig: true,
      getUnavailableRoomsFromGoogleSheet: async (args) => { sheetArgs.push(args); return { dispReadOk: true, unavailableRooms: [] }; }
    });
    const res = await svc.verifyRoomsAvailable({
      rooms: [{ backendName: 'Jungla', name: 'Suite Jungla', checkin: CI, checkout: CO }],
      excludeSessionId: 'wa-WA-ABC'
    });
    assert.deepEqual(res, { ok: true });
    assert.equal(calls[0].body.sessionId, 'wa-WA-ABC');
    assert.deepEqual(calls[0].body.rooms, ['Jungla']);
    // A la hoja le llega el registro completo del catálogo (id + name + backendName)
    assert.equal(sheetArgs[0].requestedRooms[0].id, 'jungla');
  });

  test('no disponible → lista con nombre, backendName y rango', async () => {
    const { fetchImpl } = makeFetch(() => ({ unavailableRooms: ['Jungla'] }));
    const svc = makeService({ fetchImpl });
    const res = await svc.verifyRoomsAvailable({
      rooms: [
        { backendName: 'Jungla', name: 'Suite Jungla', checkin: CI, checkout: CO },
        { backendName: 'Lirios 1', name: 'Lirios 1', checkin: CI, checkout: CO }
      ]
    });
    assert.deepEqual(res, { ok: false, unavailable: [{ name: 'Suite Jungla', backendName: 'Jungla', checkin: CI, checkout: CO }] });
  });

  test('una reserva local confirmada también cuenta como ocupada', async () => {
    const { fetchImpl } = makeFetch(() => ({ unavailableRooms: [] }));
    const svc = makeService({ fetchImpl, getLocallyReservedBackendNames: () => ['Lirios 1'] });
    const res = await svc.verifyRoomsAvailable({ rooms: [{ backendName: 'Lirios 1', name: 'Lirios 1', checkin: CI, checkout: CO }] });
    assert.equal(res.ok, false);
    assert.equal(res.unavailable[0].backendName, 'Lirios 1');
  });

  test('verification_failed si la hoja falla con Google configurado', async () => {
    const { fetchImpl } = makeFetch();
    const svc = makeService({ fetchImpl, hasGoogleConfig: true, getUnavailableRoomsFromGoogleSheet: async () => { throw new Error('quota'); } });
    const res = await svc.verifyRoomsAvailable({ rooms: [{ backendName: 'Jungla', name: 'Suite Jungla', checkin: CI, checkout: CO }] });
    assert.equal(res.ok, false);
    assert.equal(res.verification_failed, true);
    assert.equal(res.reason, 'google_sheets_unavailable');
    assert.match(res.message, /NO SE PUDO VERIFICAR/);
  });

  test('verification_failed por OTA (matriz ilegible + backend caído)', async () => {
    const { fetchImpl } = makeFetch(() => new Error('timeout'));
    const svc = makeService({ fetchImpl, hasGoogleConfig: true, getUnavailableRoomsFromGoogleSheet: async () => ({ dispReadOk: false, unavailableRooms: [] }) });
    const res = await svc.verifyRoomsAvailable({ rooms: [{ backendName: 'Jungla', name: 'Suite Jungla', checkin: CI, checkout: CO }] });
    assert.equal(res.reason, 'ota_source_unavailable');
  });

  test('split-stay multi-rango: una consulta por rango, cada suite con SUS fechas', async () => {
    const { fetchImpl, calls } = makeFetch((body) => (
      body.checkin === '2026-10-11' ? { unavailableRooms: ['Suite LindaVista'] } : { unavailableRooms: [] }
    ));
    const sheetArgs = [];
    const svc = makeService({
      fetchImpl,
      hasGoogleConfig: true,
      getUnavailableRoomsFromGoogleSheet: async (args) => { sheetArgs.push(args); return { dispReadOk: true, unavailableRooms: [] }; }
    });
    const res = await svc.verifyRoomsAvailable({
      rooms: [
        { backendName: 'Jungla', name: 'Suite Jungla', checkin: '2026-10-09', checkout: '2026-10-11' },
        { backendName: 'Suite LindaVista', name: 'Suite LindaVista', checkin: '2026-10-11', checkout: '2026-10-12' },
        { backendName: 'Lirios 1', name: 'Lirios 1', checkin: '2026-10-09', checkout: '2026-10-11' }
      ],
      excludeSessionId: 'wa-WA-SPLIT'
    });
    assert.equal(sheetArgs.length, 2);
    assert.deepEqual(
      sheetArgs.map(a => [a.checkin, a.checkout, a.requestedRooms.map(r => r.backendName)]),
      [['2026-10-09', '2026-10-11', ['Jungla', 'Lirios 1']], ['2026-10-11', '2026-10-12', ['Suite LindaVista']]]
    );
    assert.equal(calls.length, 2);
    assert.deepEqual(calls.map(c => c.body), [
      { checkin: '2026-10-09', checkout: '2026-10-11', rooms: ['Jungla', 'Lirios 1'], sessionId: 'wa-WA-SPLIT' },
      { checkin: '2026-10-11', checkout: '2026-10-12', rooms: ['Suite LindaVista'], sessionId: 'wa-WA-SPLIT' }
    ]);
    assert.deepEqual(res, {
      ok: false,
      unavailable: [{ name: 'Suite LindaVista', backendName: 'Suite LindaVista', checkin: '2026-10-11', checkout: '2026-10-12' }]
    });
  });

  test('sin habitaciones o con fechas inválidas → verification_failed (nunca "ok")', async () => {
    const { fetchImpl, calls } = makeFetch();
    const svc = makeService({ fetchImpl });
    const empty = await svc.verifyRoomsAvailable({ rooms: [] });
    assert.deepEqual([empty.ok, empty.verification_failed, empty.reason], [false, true, 'no_rooms']);
    const bad = await svc.verifyRoomsAvailable({ rooms: [{ backendName: 'Jungla', name: 'Suite Jungla', checkin: '2026-10-11', checkout: '2026-10-09' }] });
    assert.deepEqual([bad.ok, bad.verification_failed, bad.reason], [false, true, 'invalid_dates']);
    assert.equal(calls.length, 0);
  });
});

describe('buildSplitSegments (puro, comportamiento copiado de claude-handler.js)', () => {
  const N3 = [
    { date: '2026-10-09', checkout: '2026-10-10' },
    { date: '2026-10-10', checkout: '2026-10-11' },
    { date: '2026-10-11', checkout: '2026-10-12' }
  ];

  test('sin noches → no_nights', () => {
    assert.deepEqual(buildSplitSegments([], [], 2), { feasible: false, reason: 'no_nights' });
  });

  test('una misma suite libre todas las noches → 1 segmento, 0 cambios', () => {
    const res = buildSplitSegments(N3, [[LIRIOS1], [LIRIOS1], [LIRIOS1]], 2);
    assert.deepEqual(res, {
      feasible: true, guests: 2, changes: 0, total_price: 4500,
      segments: [{ room_id: 'lirios-1', room_name: 'Lirios 1', guests: 2, checkin: '2026-10-09', checkout: '2026-10-12', nights: 3, price_per_night: 1500, subtotal: 4500 }]
    });
  });

  test('una noche llena → night_full con la fecha', () => {
    assert.deepEqual(buildSplitSegments(N3, [[JUNGLA], [], [JUNGLA]], 2), { feasible: false, reason: 'night_full', nightDate: '2026-10-10' });
  });

  test('minimiza cambios: elige la suite que cubre más noches seguidas', () => {
    // Noche 1: Lirios y LindaVista · Noche 2: LindaVista · Noche 3: Lirios y LindaVista
    const res = buildSplitSegments(N3, [[LIRIOS1, LINDAVISTA], [LINDAVISTA], [LIRIOS1, LINDAVISTA]], 2);
    assert.equal(res.segments.length, 1);
    assert.equal(res.segments[0].room_id, 'suite-lindavista');
  });

  test('cambio obligado → 2 segmentos contiguos', () => {
    const res = buildSplitSegments(N3, [[JUNGLA], [JUNGLA, LIRIOS1], [LIRIOS1]], 3);
    assert.equal(res.changes, 1);
    assert.deepEqual(res.segments.map(s => [s.room_id, s.checkin, s.checkout, s.nights, s.price_per_night]), [
      ['jungla', '2026-10-09', '2026-10-11', 2, 2400],
      ['lirios-1', '2026-10-11', '2026-10-12', 1, 1900]
    ]);
    assert.equal(res.total_price, 2400 * 2 + 1900);
  });

  test('desempate: Jungla primero, luego LindaVista, luego la más barata', () => {
    assert.equal(buildSplitSegments(N3, [[LIRIOS1, JUNGLA], [LIRIOS1, JUNGLA], [LIRIOS1, JUNGLA]], 2).segments[0].room_id, 'jungla');
    assert.equal(buildSplitSegments(N3, [[HELECHOS1, LINDAVISTA], [HELECHOS1, LINDAVISTA], [HELECHOS1, LINDAVISTA]], 2).segments[0].room_id, 'suite-lindavista');
    assert.equal(buildSplitSegments(N3, [[HELECHOS1, LIRIOS1], [HELECHOS1, LIRIOS1], [HELECHOS1, LIRIOS1]], 2).segments[0].room_id, 'lirios-1');
  });

  test('precio por huéspedes: Helechos con 5 = 2,400 + 300', () => {
    const res = buildSplitSegments(N3.slice(0, 1), [[HELECHOS1]], 5);
    assert.equal(res.segments[0].price_per_night, 2700);
    assert.equal(res.guests, 5);
  });

  test('guests inválido → 2 por defecto; priceFn inyectable', () => {
    const res = buildSplitSegments(N3.slice(0, 2), [[JUNGLA], [JUNGLA]], undefined, () => 1000);
    assert.equal(res.guests, 2);
    assert.equal(res.total_price, 2000);
  });
});
