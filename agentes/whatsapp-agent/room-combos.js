/**
 * room-combos.js
 * Propuestas de habitaciones para grupos que no caben en una sola suite.
 *
 * Dada la lista de suites DISPONIBLES y el número de personas, arma 1–3 opciones:
 * primero las de menos habitaciones y luego las más baratas, repartiendo a las
 * personas con el precio real por ocupación (getRoomPricePerNight). Nunca repite
 * una suite dentro de una opción ni pasa de su max_occupancy, y cada cuarto lleva
 * al menos 1 persona. Sin I/O: el llamador ya filtró la disponibilidad.
 */

import { getRoomPricePerNight } from './pricing.js';

// Tope de subconjuntos revisados por tamaño. Con las 13 suites del hotel el peor
// caso es C(13,6) = 1,716, así que nunca se alcanza; existe solo para que una
// lista inesperadamente grande no congele el bot. Si se alcanza, se revisan los
// primeros subconjuntos en el orden de la lista (el de ROOMS).
const MAX_SUBSETS_PER_SIZE = 20000;

const MOUNTAIN_CATEGORY_REGEX = /vista a las monta/i;

/**
 * @typedef {Object} ComboRoom
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} category
 * @property {number} guests           personas en ese cuarto (1..max_occupancy)
 * @property {number} price_per_night  precio por noche con esa ocupación
 *
 * @typedef {Object} ComboOption
 * @property {number} option           1, 2, 3…
 * @property {ComboRoom[]} rooms
 * @property {number} rooms_count
 * @property {number} total_per_night
 * @property {number} nights
 * @property {number} total_stay       total_per_night × nights
 */

/**
 * @param {Array<{id:string,name:string,url?:string,category?:string,max_occupancy:number,price_2?:number,price_3_4?:number,extra_person?:number}>} availableRooms
 *        Entradas de ROOMS disponibles, en el orden de ROOMS (se usa para desempatar).
 * @param {number} guests
 * @param {{ nights?: number, maxOptions?: number }} [opts]
 * @returns {null
 *   | { feasible: false, reason: 'insufficient_capacity', capacity: number, guests: number }
 *   | { feasible: true, guests: number, options: ComboOption[] }}
 *   null = no aplica (sin personas, sin cuartos, o ≤4 personas y una sola suite alcanza:
 *   ahí el modelo recomienda por perfil).
 */
export function suggestRoomCombos(availableRooms, guests, { nights = 1, maxOptions = 3 } = {}) {
  const g = Math.floor(Number(guests));
  if (!Number.isFinite(g) || g <= 0) return null;

  // Cuartos válidos, cada suite una sola vez (por id), conservando el orden de entrada.
  const seen = new Set();
  const rooms = [];
  for (const room of Array.isArray(availableRooms) ? availableRooms : []) {
    const cap = Math.floor(Number(room?.max_occupancy) || 0);
    if (!room || cap < 1) continue;
    const key = room.id ?? room.name;
    if (seen.has(key)) continue;
    seen.add(key);
    rooms.push({ room, cap, index: rooms.length });
  }
  if (rooms.length === 0) return null;

  if (g <= 4 && rooms.some(r => r.cap >= g)) return null;

  const capacity = rooms.reduce((sum, r) => sum + r.cap, 0);
  if (capacity < g) {
    return { feasible: false, reason: 'insufficient_capacity', capacity, guests: g };
  }

  const nightsNum = Math.max(1, Math.floor(Number(nights) || 1));
  const limit = Math.max(1, Math.floor(Number(maxOptions) || 3));

  // Mínimo de cuartos: greedy tomando primero los de más capacidad.
  const byCapDesc = [...rooms].sort((a, b) => b.cap - a.cap || a.index - b.index);
  let minRooms = 0;
  for (let acc = 0; acc < g; minRooms++) acc += byCapDesc[minRooms].cap;

  const candidates = [];
  for (const size of [minRooms, minRooms + 1]) {
    if (size > rooms.length || size > g) continue; // cada cuarto necesita ≥1 persona
    forEachSubset(rooms, size, (subset) => {
      const subsetCap = subset.reduce((s, r) => s + r.cap, 0);
      if (subsetCap < g) return;
      const allocation = cheapestAllocation(subset, g);
      if (allocation) candidates.push(buildCandidate(subset, allocation));
    });
  }

  // Orden: menos cuartos → menor total por noche → orden de ROOMS.
  candidates.sort((a, b) =>
    a.rooms_count - b.rooms_count ||
    a.total_per_night - b.total_per_night ||
    compareIndexLists(a.indexes, b.indexes)
  );

  // Sin duplicados por firma de precio (mismas personas×precio = opción equivalente).
  const unique = [];
  const signatures = new Set();
  for (const c of candidates) {
    if (signatures.has(c.signature)) continue;
    signatures.add(c.signature);
    unique.push(c);
  }
  if (unique.length === 0) {
    // No debería pasar (la capacidad alcanza), pero nunca devolver opciones vacías.
    return { feasible: false, reason: 'insufficient_capacity', capacity, guests: g };
  }

  // Variedad: la mejor; una con suite de "Vista a las Montañas"; la más barata con
  // un cuarto más; y el resto en orden.
  const picked = [];
  const pick = (c) => { if (c && !picked.includes(c) && picked.length < limit) picked.push(c); };
  pick(unique[0]);
  if (!unique[0].hasMountain) pick(unique.find(c => c.hasMountain));
  pick(unique.find(c => c.rooms_count === minRooms + 1));
  for (const c of unique) pick(c);

  picked.sort((a, b) =>
    a.rooms_count - b.rooms_count ||
    a.total_per_night - b.total_per_night ||
    compareIndexLists(a.indexes, b.indexes)
  );

  return {
    feasible: true,
    guests: g,
    options: picked.map((c, i) => ({
      option: i + 1,
      rooms: c.rooms,
      rooms_count: c.rooms_count,
      total_per_night: c.total_per_night,
      nights: nightsNum,
      total_stay: c.total_per_night * nightsNum,
    })),
  };
}

// Recorre los subconjuntos de tamaño `size` en orden lexicográfico de la lista.
function forEachSubset(items, size, visit) {
  let visited = 0;
  const current = [];
  const walk = (start) => {
    if (visited >= MAX_SUBSETS_PER_SIZE) return;
    if (current.length === size) {
      visited++;
      visit([...current]);
      return;
    }
    for (let i = start; i <= items.length - (size - current.length); i++) {
      current.push(items[i]);
      walk(i + 1);
      current.pop();
      if (visited >= MAX_SUBSETS_PER_SIZE) return;
    }
  };
  walk(0);
}

/**
 * Reparte `guests` personas entre los cuartos del subconjunto (1..cap cada uno)
 * minimizando el precio por noche. Empate → reparto más parejo (menor suma de
 * cuadrados), que se siente más natural para una familia (3+2 antes que 4+1).
 * DP pequeño: estado = personas ya acomodadas en los primeros i cuartos.
 * @returns {number[]|null} personas por cuarto, en el orden del subconjunto
 */
function cheapestAllocation(subset, guests) {
  const n = subset.length;
  // best[i][s] = { cost, sq, prev } para los primeros i cuartos con s personas
  const best = Array.from({ length: n + 1 }, () => new Array(guests + 1).fill(null));
  best[0][0] = { cost: 0, sq: 0, take: 0 };
  for (let i = 0; i < n; i++) {
    const { room, cap } = subset[i];
    for (let s = 0; s <= guests; s++) {
      const from = best[i][s];
      if (!from) continue;
      for (let take = 1; take <= cap && s + take <= guests; take++) {
        const cost = from.cost + getRoomPricePerNight(room, take);
        const sq = from.sq + take * take;
        const cur = best[i + 1][s + take];
        if (!cur || cost < cur.cost || (cost === cur.cost && sq < cur.sq)) {
          best[i + 1][s + take] = { cost, sq, take };
        }
      }
    }
  }
  if (!best[n][guests]) return null;
  const allocation = new Array(n);
  let s = guests;
  for (let i = n; i > 0; i--) {
    const take = best[i][s].take;
    allocation[i - 1] = take;
    s -= take;
  }
  return allocation;
}

function buildCandidate(subset, allocation) {
  const rooms = subset.map(({ room }, i) => ({
    id: room.id,
    name: room.name,
    url: room.url,
    category: room.category,
    guests: allocation[i],
    price_per_night: getRoomPricePerNight(room, allocation[i]),
  }));
  const total = rooms.reduce((sum, r) => sum + r.price_per_night, 0);
  const signature = rooms
    .map(r => `${r.guests}x${r.price_per_night}`)
    .sort()
    .join('|');
  return {
    rooms,
    rooms_count: rooms.length,
    total_per_night: total,
    indexes: subset.map(r => r.index),
    signature,
    hasMountain: rooms.some(r => MOUNTAIN_CATEGORY_REGEX.test(r.category || '')),
  };
}

function compareIndexLists(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}
