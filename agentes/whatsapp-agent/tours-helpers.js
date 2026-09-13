/**
 * tours-helpers.js
 * Garantía en código de que toda respuesta que hable de tours o paquetes lleve el
 * contacto del equipo de tours, y el mensaje fijo de "¿qué tours tienen?".
 */

import {
  TOURS, TOURS_WHATSAPP, TOURS_LIST_URL, PACKAGES_URL, TOURS_KIDS_RULE,
} from './tours-data.js';

export const TOURS_CONTACT_FOOTER =
  `🌊 Para organizar o reservar tus tours escríbele a nuestro equipo de tours al *${TOURS_WHATSAPP}* 📲\n🔗 ${TOURS_LIST_URL}`;

export const PACKAGES_LINE = `🎒 Paquetes: ${PACKAGES_URL}`;

// Minúsculas y sin acentos, para comparar contra las keywords de TOURS.
function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Una sola regex con todas las keywords, como palabra completa ("meco" no dispara con "mecos...").
const TOUR_KEYWORDS_REGEX = new RegExp(
  `(?:^|[^a-z0-9])(?:${[...new Set(TOURS.flatMap(t => t.keywords))]
    .map(k => escapeRegex(normalize(k)).replace(/\s+/g, '\\s+'))
    .join('|')})(?![a-z0-9])`
);
const GENERIC_TOURS_REGEX = /\btours?\b|excursi[oó]n|huasteca-potosina\.com|\bpaquetes?\b/i;
const PACKAGES_REGEX = /\bpaquetes?\b/i;
const TOURS_NUMBER_REGEX = /489[\s.-]*125[\s.-]*1458/;
const PACKAGES_URL_REGEX = /huasteca-potosina\.com\/paquetes/i;

/**
 * ¿El texto habla de tours, excursiones o paquetes, o nombra un tour?
 * No se dispara solo por "Jardín de Edward James", "Las Pozas" o "Xilitla"
 * (son la ubicación del hotel).
 * @param {string} text
 * @returns {boolean}
 */
export function mentionsTours(text) {
  if (!text) return false;
  const norm = normalize(text);
  return GENERIC_TOURS_REGEX.test(norm) || TOUR_KEYWORDS_REGEX.test(norm);
}

/**
 * Mensaje para "¿qué tours tienen?": los 10 tours en líneas cortas + link + contacto.
 * @returns {string}
 */
export function buildToursCatalogMessage() {
  const lines = TOURS.map(t => `· *${t.name}* — ${t.priceText} — ${t.duration}`);
  return [
    '🌊 *Tours por la Huasteca Potosina* (con nuestro equipo de tours):',
    '',
    ...lines,
    '',
    `👧 ${TOURS_KIDS_RULE}.`,
    '',
    `🔗 Detalles y fotos: ${TOURS_LIST_URL}`,
    `🌊 Para organizar o reservar tus tours escríbele a nuestro equipo de tours al *${TOURS_WHATSAPP}* 📲`,
  ].join('\n');
}

/**
 * Si el texto habla de tours y no trae el número del equipo de tours, le agrega el
 * pie de contacto; si habla de paquetes y no trae el link de paquetes, lo agrega.
 * Idempotente: aplicarlo dos veces da lo mismo que una. Vacío/null → igual.
 * @param {string} text
 * @returns {string}
 */
export function ensureToursContact(text) {
  if (!text || !mentionsTours(text)) return text;
  const out = String(text);
  const additions = [];
  if (!TOURS_NUMBER_REGEX.test(out)) additions.push(TOURS_CONTACT_FOOTER);
  if (PACKAGES_REGEX.test(normalize(out)) && !PACKAGES_URL_REGEX.test(out)) additions.push(PACKAGES_LINE);
  return additions.length ? `${out}\n\n${additions.join('\n')}` : out;
}
