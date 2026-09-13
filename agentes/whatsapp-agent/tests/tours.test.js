// Pruebas de tours-data.js y tours-helpers.js: precios al día y contacto del equipo de tours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TOURS, TOURS_WHATSAPP, TOURS_WA_DIGITS, TOURS_BASE_URL, TOURS_LIST_URL, PACKAGES_URL,
  TOURS_KIDS_RULE, renderToursForPrompt,
} from '../tours-data.js';
import {
  mentionsTours, buildToursCatalogMessage, ensureToursContact, TOURS_CONTACT_FOOTER,
} from '../tours-helpers.js';

// Precios de huasteca-potosina.com (src/lib/tours.ts, rama main, 11 sep 2026)
const EXPECTED_PRICES = {
  'expedicion-tamul': 1550,
  'ruta-surrealista-edward-james': 1400,
  'cascadas-del-meco': 1700,
  'paraiso-escalonado-minas-micos': 1600,
  'ruta-acuatica-puente-de-dios': 1600,
  'rappel-tamul': 1700,
  'rafting-rio-tampaon': 1950,
  'rzr-xilitla': 1600,
  'buceo-media-luna': 1300,
  'travesia-del-cafe': 900,
};

test('constantes de contacto', () => {
  assert.equal(TOURS_WHATSAPP, '+52 489 125 1458');
  assert.equal(TOURS_WA_DIGITS, '524891251458');
  assert.equal(TOURS_BASE_URL, 'https://www.huasteca-potosina.com');
  assert.equal(TOURS_LIST_URL, 'https://www.huasteca-potosina.com/tours');
  assert.equal(PACKAGES_URL, 'https://www.huasteca-potosina.com/paquetes');
  assert.match(TOURS_KIDS_RULE, /6 a 10 años pagan 70%/);
  assert.match(TOURS_KIDS_RULE, /menores de 6 el 50%/);
  assert.equal(TOURS_CONTACT_FOOTER, '🌊 Para organizar o reservar tus tours escríbele a nuestro equipo de tours al *+52 489 125 1458* 📲\n🔗 https://www.huasteca-potosina.com/tours');
});

test('10 tours con los precios de Huasteca y su link /tours/<id>', () => {
  assert.equal(TOURS.length, 10);
  assert.equal(new Set(TOURS.map(t => t.id)).size, 10);
  const prices = Object.fromEntries(TOURS.map(t => [t.id, t.price]));
  assert.deepEqual(prices, EXPECTED_PRICES);
  for (const t of TOURS) {
    assert.equal(t.url, `https://www.huasteca-potosina.com/tours/${t.id}`);
    assert.ok(t.name && t.priceText && t.duration && t.logistics, `${t.id} incompleto`);
    assert.ok(Array.isArray(t.destinations) && t.destinations.length > 0);
    assert.ok(Array.isArray(t.keywords) && t.keywords.length > 0);
    assert.ok(t.minPeople >= 1 && t.maxPeople >= t.minPeople);
    for (const k of t.keywords) assert.equal(k, k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), `keyword con mayúsculas o acentos: ${k}`);
  }
  assert.equal(TOURS.find(t => t.id === 'expedicion-tamul').priceText, '$1,550 MXN por persona');
  assert.equal(TOURS.find(t => t.id === 'rzr-xilitla').priceText, 'desde $1,600 MXN por vehículo');
  assert.equal(TOURS.find(t => t.id === 'expedicion-tamul').duration, '8–10 h');
  assert.equal(TOURS.find(t => t.id === 'rappel-tamul').minPeople, 4);
  assert.equal(TOURS.find(t => t.id === 'rafting-rio-tampaon').minPeople, 5);
  assert.match(TOURS.find(t => t.id === 'paraiso-escalonado-minas-micos').notes, /\+\$350/);
});

test('renderToursForPrompt: 10 links, número de tours, paquetes sin precio y sin precios viejos', () => {
  const block = renderToursForPrompt();
  for (const t of TOURS) assert.ok(block.includes(t.url), `falta ${t.url}`);
  assert.ok(block.includes('489 125 1458'));
  assert.ok(block.includes(PACKAGES_URL));
  assert.ok(block.includes(TOURS_KIDS_RULE));
  for (const old of ['$1,450', '$1,300.00', '$1,500.00', 'Paquete Esencial', 'Paquete Aventura', '$5,000', '$9,000', '$12,200']) {
    assert.ok(!block.includes(old), `el prompt contiene ${old}`);
  }
  assert.equal(block, renderToursForPrompt(), 'determinístico');
});

test('mentionsTours: tours, excursiones, paquetes y nombres de tours', () => {
  for (const t of [
    '¿Qué tours tienen?', 'Me interesa una excursión', '¿Tienen paquetes?', 'Quiero ir a la cascada de Tamul',
    'rafting en el Tampaón', '¿Cuánto cuesta el RZR?', 'Puente de Dios', 'Minas Viejas', 'buceo en Media Luna',
    'la Travesía del Café', 'ver huasteca-potosina.com',
  ]) {
    assert.equal(mentionsTours(t), true, t);
  }
});

test('mentionsTours: NO se dispara por la ubicación del hotel ni por café del restaurante', () => {
  for (const t of [
    'Estamos a 400 m del Jardín de Edward James', 'a 5 min caminando de Las Pozas', 'Hotel en Xilitla',
    '¿Tienen café de olla en el restaurante?', 'Suite Jungla con piscina', '', null, undefined,
  ]) {
    assert.equal(mentionsTours(t), false, String(t));
  }
});

test('ensureToursContact agrega el pie una sola vez y es idempotente', () => {
  const base = 'Te recomiendo la Expedición Tamul, es muy completa. 🌊';
  const once = ensureToursContact(base);
  assert.equal(once, `${base}\n\n${TOURS_CONTACT_FOOTER}`);
  assert.equal(ensureToursContact(once), once);
  assert.equal(once.match(/489 125 1458/g).length, 1);
});

test('ensureToursContact no toca textos sin tours ni textos que ya traen el número', () => {
  const hotel = '¡Hola! Estamos a 400 m del Jardín de Edward James, en Xilitla. 🌿';
  assert.equal(ensureToursContact(hotel), hotel);
  const withNumber = 'Para tours escríbele al 489 125 1458';
  assert.equal(ensureToursContact(withNumber), withNumber);
  assert.equal(ensureToursContact(''), '');
  assert.equal(ensureToursContact(null), null);
  assert.equal(ensureToursContact(undefined), undefined);
});

test('ensureToursContact agrega el link de paquetes cuando se habla de paquetes', () => {
  const once = ensureToursContact('Los paquetes los arma nuestro equipo.');
  assert.ok(once.includes(TOURS_CONTACT_FOOTER));
  assert.ok(once.includes(`🎒 Paquetes: ${PACKAGES_URL}`));
  assert.equal(ensureToursContact(once), once);

  const numberOnly = 'Los paquetes los ve el equipo al +52 489 125 1458';
  const fixed = ensureToursContact(numberOnly);
  assert.equal(fixed, `${numberOnly}\n\n🎒 Paquetes: ${PACKAGES_URL}`);
  assert.equal(ensureToursContact(fixed), fixed);
});

test('buildToursCatalogMessage: los 10 tours con precio y duración, link y contacto', () => {
  const msg = buildToursCatalogMessage();
  for (const t of TOURS) {
    assert.ok(msg.includes(`*${t.name}* — ${t.priceText} — ${t.duration}`), `falta ${t.name}`);
  }
  assert.ok(msg.includes(`🔗 Detalles y fotos: ${TOURS_LIST_URL}`));
  assert.ok(msg.includes('489 125 1458'));
  assert.ok(!msg.includes('$1,450'));
  assert.equal(ensureToursContact(msg), msg, 'ya trae el contacto');
  assert.doesNotMatch(msg, /\b(tenés|podés|querés|mandame|vos)\b/);
});
