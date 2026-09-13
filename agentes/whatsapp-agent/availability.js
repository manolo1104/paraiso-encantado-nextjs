/**
 * availability.js
 * Servicio de disponibilidad reutilizable (antes vivía dentro de check_availability
 * en claude-handler.js). Lo usan dos llamadores:
 *   · check_availability → computeAvailability (misma forma de resultado de siempre).
 *   · create_reservation_quote → verifyRoomsAvailable (verificación obligatoria antes
 *     de crear folio, sobre todo cuando el cliente cambia de fechas).
 *
 * No importa google-sheets.js, reservations.js ni hotel-knowledge.js: todo llega por
 * `deps`, así se prueba sin red, sin hoja y sin tocar reservations.json.
 *
 * Fuentes de verdad (las mismas 3 de antes):
 *   1) Google Sheets (Reservas + matriz Disponibilidad, única fuente de OTA).
 *   2) Backend del sitio /api/check-availability (bloqueos temporales de otras
 *      cotizaciones; con `sessionId` excluye el apartado PROPIO del cliente).
 *   3) Reservas de WhatsApp confirmadas localmente (RESERVADO/CONFIRMADA).
 * Reglas fail-closed: si hay configuración de Google y no se pudo leer la hoja, o no
 * se pudo confirmar OTA ni por la matriz ni por el backend, NUNCA se afirma disponibilidad.
 */

import { nightsBetween } from './format-mx.js';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MSG_SHEETS_FAILED = 'NO SE PUDO VERIFICAR la disponibilidad (falla técnica al leer la fuente). Esto NO significa que no haya lugar. No afirmes ni niegues disponibilidad: avisa que estás validando y pasa el caso al equipo humano.';
const MSG_OTA_FAILED = 'NO SE PUDO VERIFICAR la disponibilidad (los bloqueos de OTA no se pudieron confirmar). Esto NO significa que no haya lugar. No afirmes ni niegues disponibilidad: avisa que estás validando y pasa el caso al equipo humano.';

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Compara ids/nombres de habitación tolerando guiones y el prefijo "suite"
// (Claude a veces manda 'suite-jungla' aunque el id oficial sea 'jungla').
function roomKeyNorm(value = '') {
  return normalizeText(String(value).replace(/-/g, ' ')).replace(/^suite\s+/, '').trim();
}

// Busca una habitación del catálogo por id exacto y, si no, por id/nombre/backendName
// normalizados. Devuelve null si no hay coincidencia.
function findRoom(rooms, key) {
  if (!key) return null;
  const exact = rooms.find(r => r.id === key || r.backendName === key);
  if (exact) return exact;
  const k = roomKeyNorm(key);
  if (!k) return null;
  return rooms.find(r =>
    roomKeyNorm(r.id) === k || roomKeyNorm(r.name) === k || roomKeyNorm(r.backendName) === k
  ) || null;
}

// Precio por noche según huéspedes. Copia de getRoomPricePerNight (claude-handler.js);
// se puede inyectar la versión de pricing.js con deps.getRoomPricePerNight.
function defaultRoomPricePerNight(room, guests) {
  if (!room) return 1900;
  const g = Number(guests || 2);
  if (g <= 2) return room.price_2 || 1900;
  if (g <= 4) return room.price_3_4 || room.price_2 || 1900;
  // 5-6 personas: precio base (4p) + extra_person por cada persona adicional
  const base = room.price_3_4 || room.price_2 || 1900;
  const extra = room.extra_person || 0;
  return base + (g - 4) * extra;
}

// ── Propuesta de estancia con cambio de suite (split-stay) ─────────────────
// Preferencia para desempatar cuando dos suites cubren igual número de noches.
function splitRoomRank(room) {
  const id = String(room?.id || '');
  if (id === 'suite-jungla' || /jungla/i.test(room?.name || '')) return 0;
  if (id === 'suite-lindavista' || /lindavista/i.test(room?.name || '')) return 1;
  return 2;
}

// Algoritmo PURO: dada la lista de noches y las suites libres por noche, arma segmentos
// consecutivos MINIMIZANDO los cambios de suite (greedy "tramo más largo desde la izquierda",
// que es óptimo en número de segmentos). No hace I/O — fácil de probar.
//   nights: [{ date: 'YYYY-MM-DD', checkout: 'YYYY-MM-DD' }]  (una por noche)
//   freeRoomsPerNight: [[room, ...], ...]  (mismo índice que nights)
//   priceFn(room, guests) → precio por noche (opcional)
export function buildSplitSegments(nights, freeRoomsPerNight, guests, priceFn = defaultRoomPricePerNight) {
  const k = nights.length;
  const g = Number(guests) || 2;
  if (k === 0) return { feasible: false, reason: 'no_nights' };

  const segments = [];
  let i = 0;
  let guard = 0;
  while (i < k && guard < 200) {
    guard++;
    const free = freeRoomsPerNight[i] || [];
    if (free.length === 0) {
      return { feasible: false, reason: 'night_full', nightDate: nights[i].date };
    }
    // Elegir la suite libre desde i que se extienda MÁS noches consecutivas.
    let best = null;
    let bestEnd = i; // exclusivo
    for (const room of free) {
      let j = i;
      while (j < k && (freeRoomsPerNight[j] || []).some(r => r.id === room.id)) j++;
      const extension = j - i;
      const bestExtension = bestEnd - i;
      if (extension > bestExtension) {
        best = room; bestEnd = j;
      } else if (best && extension === bestExtension) {
        // Desempate: primero suite recomendada, luego más barata.
        if (splitRoomRank(room) < splitRoomRank(best)) best = room;
        else if (splitRoomRank(room) === splitRoomRank(best) &&
                 priceFn(room, g) < priceFn(best, g)) best = room;
      }
    }
    if (!best) return { feasible: false, reason: 'no_room', nightDate: nights[i].date };

    const nightsInSeg = bestEnd - i;
    const perNight = priceFn(best, g);
    segments.push({
      room_id: best.id,
      room_name: best.name,
      guests: g,
      checkin: nights[i].date,
      checkout: nights[bestEnd - 1].checkout,
      nights: nightsInSeg,
      price_per_night: perNight,
      subtotal: perNight * nightsInSeg
    });
    i = bestEnd;
  }

  const total = segments.reduce((s, seg) => s + seg.subtotal, 0);
  return { feasible: true, guests: g, segments, changes: segments.length - 1, total_price: total };
}

/**
 * @param {object} deps
 * @param {Array}    deps.rooms  catálogo ROOMS de hotel-knowledge.js
 * @param {Function} deps.fetchImpl  fetch (node-fetch o global)
 * @param {string}   deps.bookingApi  base del sitio, ya normalizada con www
 * @param {Function} [deps.getHeaders]  headers del POST al backend
 * @param {boolean|Function} deps.hasGoogleConfig  ¿hay credenciales de Google?
 * @param {Function} deps.getUnavailableRoomsFromGoogleSheet
 * @param {Function} deps.getLocallyReservedBackendNames
 * @param {Function} deps.findAlternativeDates
 * @param {Function} deps.getPerNightUnavailableFromSheet
 * @param {Function} [deps.getRoomPricePerNight]  precio por noche (default: copia local)
 * @param {number}   [deps.timeoutMs=15000]
 * @param {object}   [deps.log=console]
 */
export function createAvailabilityService({
  rooms = [],
  fetchImpl,
  bookingApi = '',
  getHeaders = () => ({ 'Content-Type': 'application/json' }),
  hasGoogleConfig = false,
  getUnavailableRoomsFromGoogleSheet,
  getLocallyReservedBackendNames,
  findAlternativeDates,
  getPerNightUnavailableFromSheet,
  getRoomPricePerNight = defaultRoomPricePerNight,
  timeoutMs = 15000,
  log = console,
} = {}) {
  const catalog = Array.isArray(rooms) ? rooms : [];
  const googleConfigured = () => (typeof hasGoogleConfig === 'function' ? Boolean(hasGoogleConfig()) : Boolean(hasGoogleConfig));
  const warn = (...args) => {
    try { (log?.warn || log?.log)?.apply(log, args); } catch { /* sin log */ }
  };

  // POST al backend /api/check-availability. Devuelve el JSON o null si no respondió bien.
  async function postBackendAvailability({ checkin, checkout, backendNames, excludeSessionId }) {
    const res = await fetchImpl(`${bookingApi}/api/check-availability`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        checkin,
        checkout,
        rooms: backendNames,
        ...(excludeSessionId ? { sessionId: excludeSessionId } : {})
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
    // Nunca hacer .json() a ciegas: un 405/502 llega con cuerpo vacío y el throw
    // ocultaba el status real detrás de "Unexpected end of JSON input".
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      warn(`⚠️ Backend de disponibilidad respondió ${res.status} (${res.url || bookingApi}) — ${String(body).slice(0, 200) || 'sin cuerpo'}`);
      return null;
    }
    return res.json();
  }

  /**
   * Junta los backendNames NO disponibles de las 3 fuentes para un rango.
   * → { names: string[], sheetReadOk, dispReadOk, backendOk }
   * Si hay configuración de Google y la hoja falla, se corta ahí (igual que antes:
   * el resultado va a ser verification_failed de todos modos).
   */
  async function collectUnavailable({ checkin, checkout, requestedRooms = [], excludeSessionId = null }) {
    const unavailableNames = new Set();
    let sheetReadOk = false;
    let dispReadOk = false; // ¿se pudo leer la matriz Disponibilidad (única fuente de OTA)?
    let backendOk = false;  // ¿respondió el backend del sitio (que también ve OTA)?

    // 1) Reservas directas + matriz Disponibilidad en Google Sheets
    try {
      const sheetResult = await getUnavailableRoomsFromGoogleSheet({ checkin, checkout, requestedRooms });
      sheetReadOk = true;
      dispReadOk = sheetResult?.dispReadOk !== false;
      for (const room of (sheetResult?.unavailableRooms || [])) {
        if (room?.backendName) unavailableNames.add(room.backendName);
      }
    } catch (sheetErr) {
      warn('⚠️ No se pudo leer Google Sheets:', sheetErr?.message || sheetErr);
      if (googleConfigured()) {
        return { names: [], sheetReadOk: false, dispReadOk: false, backendOk: false };
      }
    }

    // 2) Backend: bloqueos temporales de otras cotizaciones (excluye el apartado propio)
    try {
      const data = await postBackendAvailability({
        checkin, checkout,
        backendNames: requestedRooms.map(r => r.backendName),
        excludeSessionId
      });
      if (data) {
        // `degraded` = el backend tampoco pudo leer su fuente; no cuenta como verificado.
        backendOk = data?.degraded !== true;
        for (const backendRoom of (data?.unavailableRooms || [])) unavailableNames.add(backendRoom);
      }
    } catch (backendErr) {
      warn('⚠️ No se pudo consultar backend de disponibilidad:', backendErr?.message || backendErr);
    }

    // 3) Reservas WhatsApp confirmadas localmente (estado RESERVADO)
    try {
      for (const backendRoom of (getLocallyReservedBackendNames({ checkin, checkout, requestedRooms }) || [])) {
        unavailableNames.add(backendRoom);
      }
    } catch (localErr) {
      warn('⚠️ No se pudo cargar reservas locales confirmadas:', localErr?.message || localErr);
    }

    return { names: [...unavailableNames], sheetReadOk, dispReadOk, backendOk };
  }

  // Reglas fail-closed sobre el resultado de collectUnavailable → null si se puede confiar.
  function verificationFailure({ sheetReadOk, dispReadOk, backendOk }) {
    if (!googleConfigured()) return null;
    if (!sheetReadOk) return { verification_failed: true, message: MSG_SHEETS_FAILED, error: 'google_sheets_unavailable' };
    // Los bloqueos de OTA viven SOLO en la matriz Disponibilidad. Si ni la lectura directa
    // de esa matriz NI el backend la pudieron verificar, quedamos ciegos a OTA.
    if (!dispReadOk && !backendOk) return { verification_failed: true, message: MSG_OTA_FAILED, error: 'ota_source_unavailable' };
    return null;
  }

  // Split-stay: combina hoja por noche + backend por noche + reservas locales.
  async function computeSplitStayProposal({ checkin, checkout, guests, excludeSessionId = null }) {
    const g = Number(guests) || 2;
    const candidateRooms = catalog.filter(r => (r.max_occupancy || 2) >= g);
    if (candidateRooms.length === 0) return { feasible: false, reason: 'no_capacity' };

    let perNightSheet;
    try {
      perNightSheet = await getPerNightUnavailableFromSheet({ checkin, checkout, requestedRooms: candidateRooms });
    } catch (err) {
      warn('⚠️ Split-stay: no se pudo leer disponibilidad por noche:', err?.message || err);
      return { feasible: false, reason: 'sheet_error' };
    }
    if (!perNightSheet?.length) return { feasible: false, reason: 'no_nights' };

    const backendNamesAll = candidateRooms.map(r => r.backendName);
    const perNightBlocked = await Promise.all(perNightSheet.map(async (night) => {
      const blocked = new Set(night.blockedBackendNames || []);
      // Backend (bloqueos temporales de otras cotizaciones en curso)
      try {
        const data = await postBackendAvailability({
          checkin: night.date, checkout: night.checkout, backendNames: backendNamesAll, excludeSessionId
        });
        for (const n of (data?.unavailableRooms || [])) blocked.add(n);
      } catch { /* la hoja ya cubre lo principal */ }
      // Reservas WhatsApp confirmadas localmente
      try {
        for (const n of (getLocallyReservedBackendNames({ checkin: night.date, checkout: night.checkout, requestedRooms: candidateRooms }) || [])) blocked.add(n);
      } catch { /* ignore */ }
      return blocked;
    }));

    const freeRoomsPerNight = perNightSheet.map((night, i) =>
      candidateRooms.filter(r => !perNightBlocked[i].has(r.backendName))
    );

    return buildSplitSegments(perNightSheet, freeRoomsPerNight, g, getRoomPricePerNight);
  }

  /**
   * Misma lógica y forma de resultado que check_availability (sin sesión ni corrección
   * de año: eso lo hace el llamador antes y pasa `datesCorrected`).
   *
   * Formas posibles:
   *   { available: false, message }                                  ← roomIds sin ninguna válida
   *   { verification_failed: true, message, error: 'google_sheets_unavailable' | 'ota_source_unavailable' }
   *   { available: true, [dates_corrected: true, checkin, checkout],
   *     available_rooms: [{ id, name, category, url, price_2, price_3_4, max_occupancy, highlights }] }
   *   { available: false, [dates_corrected: true, checkin, checkout], message,
   *     unavailable_rooms: [{ id, name, category, url }],
   *     [split_stay: { feasible: true, guests, segments: [{ room_id, room_name, guests, checkin,
   *                    checkout, nights, price_per_night, subtotal }], changes, total_price }],
   *     alternative_dates: [{ checkin, checkout, nights, dayName, formattedDate, availableCount,
   *                           availableRooms: [{ id, name, price_2, price_3_4 }] }] }
   */
  async function computeAvailability({ checkin, checkout, roomIds = [], guests, excludeSessionId = null, datesCorrected = false } = {}) {
    const ids = Array.isArray(roomIds) ? roomIds.filter(Boolean) : [];
    const requestedRooms = ids.length > 0
      ? catalog.filter(r => ids.some(id => findRoom([r], id)))
      : catalog.slice();
    if (requestedRooms.length === 0) {
      return { available: false, message: 'No se encontraron habitaciones válidas para verificar.' };
    }

    const sources = await collectUnavailable({ checkin, checkout, requestedRooms, excludeSessionId });
    const failure = verificationFailure(sources);
    if (failure) return failure;

    const unavailableNames = new Set(sources.names);
    const correctedFields = datesCorrected ? { dates_corrected: true, checkin, checkout } : {};
    const available = requestedRooms.filter(r => !unavailableNames.has(r.backendName));

    if (available.length > 0) {
      return {
        available: true,
        // Si se corrigió un año pasado, el bot DEBE confirmarle al cliente estas fechas.
        ...correctedFields,
        available_rooms: available.map(r => ({
          id: r.id, name: r.name, category: r.category,
          url: r.url,
          price_2: r.price_2, price_3_4: r.price_3_4,
          max_occupancy: r.max_occupancy,
          highlights: r.highlights
        }))
      };
    }

    const unavailableRooms = requestedRooms
      .filter(r => unavailableNames.has(r.backendName))
      .map(r => ({ id: r.id, name: r.name, category: r.category, url: r.url }));

    // Ninguna suite libre para TODO el rango. Antes de descartar, intentar cubrir la
    // estancia completa con cambio(s) de suite (split-stay). Solo aplica si son 2+ noches.
    const guestsForSplit = Number(guests) || 2;
    const spanNights = nightsBetween(checkin, checkout);

    let splitStay = null;
    if (spanNights >= 2 && spanNights <= 21) {
      try {
        const proposal = await computeSplitStayProposal({ checkin, checkout, guests: guestsForSplit, excludeSessionId });
        // Solo ofrecer si es factible y realmente implica cambio(s) de suite (>=1).
        if (proposal?.feasible && proposal.segments?.length > 1) splitStay = proposal;
      } catch (splitErr) {
        warn('⚠️ No se pudo calcular propuesta split-stay:', splitErr?.message || splitErr);
      }
    }

    let alternatives = { alternatives: [] };
    try {
      alternatives = await findAlternativeDates(checkin, checkout, requestedRooms, 5);
    } catch { /* sin alternativas */ }

    return {
      available: false,
      ...correctedFields,
      message: splitStay
        ? 'No hay una sola suite libre todas las noches, pero la estancia SÍ se puede cubrir con cambio de suite (ver split_stay).'
        : 'No hay disponibilidad para las fechas solicitadas.',
      unavailable_rooms: unavailableRooms,
      ...(splitStay ? { split_stay: splitStay } : {}),
      alternative_dates: alternatives?.alternatives || []
    };
  }

  /**
   * Verificación obligatoria antes de crear una cotización.
   *   rooms: [{ backendName, name, checkin, checkout }]  (split-stay: cada una con su rango)
   * → { ok: true }
   * → { ok: false, verification_failed: true, reason, message }
   *      reason: 'google_sheets_unavailable' | 'ota_source_unavailable' | 'invalid_dates' | 'no_rooms'
   * → { ok: false, unavailable: [{ name, backendName, checkin, checkout }] }
   */
  async function verifyRoomsAvailable({ rooms: inputRooms = [], excludeSessionId = null } = {}) {
    const list = Array.isArray(inputRooms) ? inputRooms.filter(Boolean) : [];
    if (list.length === 0) {
      return { ok: false, verification_failed: true, reason: 'no_rooms', message: 'No hay habitaciones que verificar.' };
    }

    // Agrupar por rango de fechas: una consulta por rango (normal = 1 grupo).
    const groups = new Map(); // "checkin|checkout" -> [{ input, room }]
    for (const r of list) {
      if (!ISO_DATE_RE.test(String(r.checkin || '')) || !ISO_DATE_RE.test(String(r.checkout || '')) || r.checkout <= r.checkin) {
        return { ok: false, verification_failed: true, reason: 'invalid_dates', message: `Fechas inválidas para ${r.name || r.backendName || 'la habitación'}.` };
      }
      // Preferir el registro del catálogo (id + name + backendName) para que el match
      // contra la hoja y las reservas locales sea el mismo que en check_availability.
      const known = findRoom(catalog, r.backendName) || findRoom(catalog, r.id) || findRoom(catalog, r.name);
      const room = known || { id: r.id, name: r.name || r.backendName, backendName: r.backendName || r.name };
      const key = `${r.checkin}|${r.checkout}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ input: r, room });
    }

    const unavailable = [];
    const seen = new Set();
    for (const [key, entries] of groups) {
      const [checkin, checkout] = key.split('|');
      const requestedRooms = [...new Map(entries.map(e => [e.room.backendName, e.room])).values()];
      const sources = await collectUnavailable({ checkin, checkout, requestedRooms, excludeSessionId });
      const failure = verificationFailure(sources);
      if (failure) {
        return { ok: false, verification_failed: true, reason: failure.error, message: failure.message };
      }
      const names = new Set(sources.names);
      for (const { input, room } of entries) {
        if (!names.has(room.backendName)) continue;
        const dedupeKey = `${room.backendName}|${key}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        unavailable.push({ name: room.name || input.name, backendName: room.backendName, checkin, checkout });
      }
    }

    return unavailable.length ? { ok: false, unavailable } : { ok: true };
  }

  return { collectUnavailable, computeAvailability, verifyRoomsAvailable };
}
