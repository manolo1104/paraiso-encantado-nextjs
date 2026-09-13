// Pruebas de room-combos.js contra las suites REALES de hotel-knowledge.js.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let ROOMS;
let suggestRoomCombos;
let getRoomPricePerNight;

before(async () => {
  // Por si hotel-knowledge.js llega a importar reservations.js: nunca tocar el archivo real.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'combos-test-'));
  process.env.RESERVATIONS_FILE = path.join(dir, 'reservations.json');
  ({ ROOMS } = await import('../hotel-knowledge.js'));
  ({ suggestRoomCombos } = await import('../room-combos.js'));
  ({ getRoomPricePerNight } = await import('../pricing.js'));
});

function assertValidOptions(result, guests) {
  assert.equal(result.feasible, true);
  assert.equal(result.guests, guests);
  assert.ok(result.options.length >= 1 && result.options.length <= 3, 'entre 1 y 3 opciones');
  const byId = new Map(ROOMS.map(r => [r.id, r]));
  result.options.forEach((opt, i) => {
    assert.equal(opt.option, i + 1);
    assert.equal(opt.rooms_count, opt.rooms.length);
    const ids = opt.rooms.map(r => r.id);
    assert.equal(new Set(ids).size, ids.length, 'una suite no se repite dentro de una opción');
    assert.equal(opt.rooms.reduce((s, r) => s + r.guests, 0), guests, 'acomoda a todas las personas');
    let total = 0;
    for (const r of opt.rooms) {
      const real = byId.get(r.id);
      assert.ok(real, `suite desconocida ${r.id}`);
      assert.ok(r.guests >= 1, 'cada cuarto lleva al menos 1 persona');
      assert.ok(r.guests <= real.max_occupancy, `${r.name} excede su capacidad`);
      assert.equal(r.price_per_night, getRoomPricePerNight(real, r.guests));
      assert.equal(r.name, real.name);
      assert.equal(r.url, real.url);
      total += r.price_per_night;
    }
    assert.equal(opt.total_per_night, total);
    assert.equal(opt.total_stay, total * opt.nights);
  });
  // Orden: menos cuartos primero, luego más barato
  for (let i = 1; i < result.options.length; i++) {
    const a = result.options[i - 1];
    const b = result.options[i];
    assert.ok(a.rooms_count < b.rooms_count || (a.rooms_count === b.rooms_count && a.total_per_night <= b.total_per_night));
  }
}

test('5 personas → primera opción 1 cuarto: Helechos para 5 a $2,700', () => {
  const r = suggestRoomCombos(ROOMS, 5, { nights: 2 });
  assertValidOptions(r, 5);
  const first = r.options[0];
  assert.equal(first.rooms_count, 1);
  assert.match(first.rooms[0].id, /^helechos-/);
  assert.equal(first.rooms[0].guests, 5);
  assert.equal(first.total_per_night, 2700);
  assert.equal(first.nights, 2);
  assert.equal(first.total_stay, 5400);
});

test('6 personas → Helechos para 6 primero', () => {
  const r = suggestRoomCombos(ROOMS, 6);
  assertValidOptions(r, 6);
  assert.equal(r.options[0].rooms_count, 1);
  assert.match(r.options[0].rooms[0].id, /^helechos-/);
  assert.equal(r.options[0].total_per_night, 3000);
});

test('8 personas → 2 cuartos, la más barata 4+4 a $3,800', () => {
  const r = suggestRoomCombos(ROOMS, 8);
  assertValidOptions(r, 8);
  assert.equal(r.options[0].rooms_count, 2);
  assert.deepEqual(r.options[0].rooms.map(x => x.guests), [4, 4]);
  assert.equal(r.options[0].total_per_night, 3800);
});

test('12 personas → opciones válidas empezando por 2 cuartos', () => {
  const r = suggestRoomCombos(ROOMS, 12);
  assertValidOptions(r, 12);
  assert.equal(r.options[0].rooms_count, 2);
});

test('si hay suites de montaña, al menos una opción las incluye', () => {
  for (const g of [5, 8, 12]) {
    const r = suggestRoomCombos(ROOMS, g);
    assert.ok(r.options.some(o => o.rooms.some(x => /Vista a las Montañas/.test(x.category))), `${g} personas sin opción de montaña`);
  }
});

test('Orquídeas King nunca pasa de 2 personas', () => {
  const kings = ROOMS.filter(r => r.max_occupancy === 2);
  assert.ok(kings.length >= 2);
  const r = suggestRoomCombos([...kings, ROOMS.find(x => x.id === 'lirios-1')], 7);
  assertValidOptions(r, 7);
  for (const opt of r.options) {
    for (const room of opt.rooms) {
      if (kings.some(k => k.id === room.id)) assert.ok(room.guests <= 2);
    }
  }
});

test('capacidad insuficiente', () => {
  const few = ROOMS.filter(r => ['lirios-1', 'orquideas-2'].includes(r.id));
  assert.deepEqual(suggestRoomCombos(few, 7), { feasible: false, reason: 'insufficient_capacity', capacity: 6, guests: 7 });
  const all = suggestRoomCombos(ROOMS, 500);
  assert.equal(all.feasible, false);
  assert.equal(all.capacity, ROOMS.reduce((s, r) => s + r.max_occupancy, 0));
});

test('≤4 personas con una suite que alcanza → null (el modelo recomienda por perfil)', () => {
  assert.equal(suggestRoomCombos(ROOMS, 2), null);
  assert.equal(suggestRoomCombos(ROOMS, 4), null);
});

test('≤4 personas sin suite que alcance sola → sí arma combinación', () => {
  const kings = ROOMS.filter(r => r.max_occupancy === 2);
  const r = suggestRoomCombos(kings, 3);
  assertValidOptions(r, 3);
  assert.equal(r.options[0].rooms_count, 2);
});

test('entradas vacías → null', () => {
  assert.equal(suggestRoomCombos(ROOMS, 0), null);
  assert.equal(suggestRoomCombos(ROOMS, -3), null);
  assert.equal(suggestRoomCombos([], 8), null);
  assert.equal(suggestRoomCombos(null, 8), null);
});

test('una suite repetida en la lista de entrada no se duplica en una opción', () => {
  const lirios = ROOMS.find(r => r.id === 'lirios-1');
  const r = suggestRoomCombos([lirios, lirios, lirios], 8);
  assert.deepEqual(r, { feasible: false, reason: 'insufficient_capacity', capacity: 4, guests: 8 });
});

test('máximo de opciones respetado y resultados deterministas', () => {
  for (const g of [5, 6, 8, 12, 20, 30]) {
    const a = suggestRoomCombos(ROOMS, g, { nights: 3 });
    const b = suggestRoomCombos([...ROOMS], g, { nights: 3 });
    assert.deepEqual(a, b);
    assert.ok(a.options.length <= 3);
    assertValidOptions(a, g);
  }
  const one = suggestRoomCombos(ROOMS, 8, { maxOptions: 1 });
  assert.equal(one.options.length, 1);
  assert.equal(one.options[0].total_per_night, 3800);
});

test('sin opciones con la misma firma de precio', () => {
  for (const g of [5, 8, 12]) {
    const r = suggestRoomCombos(ROOMS, g);
    const sigs = r.options.map(o => o.rooms.map(x => `${x.guests}x${x.price_per_night}`).sort().join('|'));
    assert.equal(new Set(sigs).size, sigs.length);
  }
});
