/**
 * reservations.js
 * Gestiona reservas tomadas por WhatsApp:
 * - Genera cotizaciones con datos bancarios
 * - Guarda reservas pendientes en reservations.json
 * - Registra comprobantes recibidos, reemplazos de cotización y búsquedas por teléfono
 *
 * Estados: PENDIENTE_PAGO → RESERVADO (con /confirmar). REEMPLAZADA = el cliente
 * cambió fechas/suite y otra cotización tomó su lugar (no bloquea inventario).
 * CONFIRMADA es histórico (equivale a RESERVADO).
 */

import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { getBankInfo } from './bank-info.js';
import { extractDigitsFromJid, digitsOnly, last10 } from './phone.js';

// En local usa el archivo de la carpeta; en Railway apunta al disco persistente
// (RESERVATIONS_FILE=/data/reservations.json) para no perder reservas al actualizar.
const FILE = process.env.RESERVATIONS_FILE || './reservations.json';

function load() {
  if (!existsSync(FILE)) return [];
  try { return JSON.parse(readFileSync(FILE, 'utf-8')); }
  catch (err) {
    // Un archivo corrupto NO debe tratarse como "sin reservas": la siguiente save()
    // lo sobreescribiría y se perderían todos los folios. Conservar evidencia.
    console.error(`❌ reservations.json corrupto (${err.message}) — se respalda antes de continuar.`);
    try { renameSync(FILE, `${FILE}.corrupt-${Date.now()}`); } catch { /* sin respaldo posible */ }
    return [];
  }
}

function save(data) {
  // Escritura atómica: tmp + rename, para que un corte a media escritura
  // (redeploy de Railway) no deje el archivo truncado.
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tmp, FILE);
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

// Folio comparado sin separadores: el cliente teclea el folio con o sin guión.
function normFolio(v) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function findIndexByFolio(reservations, folio) {
  const f = normFolio(folio);
  if (!f) return -1;
  return reservations.findIndex(r => normFolio(r?.folio) === f);
}

// Más reciente primero por createdAt; empate (mismo milisegundo) → el que se guardó
// después en el archivo.
function newestFirst(list) {
  return list
    .map((r, i) => ({ r, i, t: new Date(r?.createdAt).getTime() || 0 }))
    .sort((a, b) => (b.t - a.t) || (b.i - a.i))
    .map(x => x.r);
}

const toNumberOr = (value, fallback) => {
  const n = Number(value);
  return value != null && value !== '' && Number.isFinite(n) ? n : fallback;
};

// ── Generar cotización ─────────────────────────────────────

export function createQuote({
  userId,
  userName,
  guestName,
  guestEmail,
  howFound,
  rooms,
  tours = [],
  checkin,
  checkout,
  totalPrice,
  nights,
  roomsTotal,
  toursTotal,
  depositAmount,
  // Campos de Camila v2 (todos opcionales para no romper a los llamadores de antes)
  waNumber,       // número real de WhatsApp (dígitos), útil en chats @lid
  subtotal,       // hospedaje antes del descuento de grupo
  discount,       // monto descontado (10% grupos 8+ habitaciones)
  saldo,          // lo que se paga al llegar al hotel
  depositRule,    // regla del anticipo (p. ej. '50%', '100%', 'grupo_5000')
  holdExpiresAt,  // ISO: hasta cuándo quedó apartada la habitación
  blockConfirmed, // true/false: si la página confirmó el apartado
  supersedes,     // folio anterior al que reemplaza esta cotización
  channel = 'whatsapp',
}) {
  const reservations = load();

  // Folio único aunque se creen dos cotizaciones en el mismo milisegundo.
  let stamp = Date.now();
  let folio = 'WA-' + stamp.toString(36).toUpperCase();
  while (findIndexByFolio(reservations, folio) !== -1) {
    stamp += 1;
    folio = 'WA-' + stamp.toString(36).toUpperCase();
  }
  const bankInfo = getBankInfo();

  const resolvedDeposit = (depositAmount != null && depositAmount > 0) ? depositAmount : totalPrice;
  const roomsArray = Array.isArray(rooms) ? rooms : (rooms ? [rooms] : []);
  const toursArray = Array.isArray(tours) ? tours : (tours ? [tours] : []);
  const primaryRoom = roomsArray[0] || null;
  const totalGuests = roomsArray.reduce((sum, r) => sum + Number(r.guests || 0), 0);

  const totalNum = Number(totalPrice || 0);
  const discountNum = toNumberOr(discount, 0);
  const subtotalNum = toNumberOr(subtotal, totalNum + discountNum);
  const saldoNum = toNumberOr(saldo, Math.max(0, totalNum - Number(resolvedDeposit || 0)));
  const createdAt = new Date().toISOString();

  const reservation = {
    folio,
    status: 'PENDIENTE_PAGO',
    channel: channel || 'whatsapp',
    userId,
    waNumber: waNumber ? digitsOnly(waNumber) || null : null,
    userName: guestName || userName,
    guestEmail: guestEmail || null,
    howFound: howFound || null,
    rooms: roomsArray,
    tours: toursArray,
    room: primaryRoom,  // compatibilidad con código anterior
    checkin,
    checkout,
    guests: totalGuests,
    nights,
    roomsTotal: Number(roomsTotal ?? totalPrice ?? 0),
    toursTotal: Number(toursTotal ?? 0),
    subtotal: subtotalNum,
    discount: discountNum,
    totalPrice,
    depositAmount: resolvedDeposit,
    depositRule: depositRule || null,
    saldo: saldoNum,
    holdExpiresAt: holdExpiresAt || null,
    blockConfirmed: typeof blockConfirmed === 'boolean' ? blockConfirmed : null,
    supersedes: supersedes || null,
    bankInfo,
    createdAt,
  };

  reservations.push(reservation);
  save(reservations);

  return {
    folio,
    bankInfo,
    totalPrice,
    roomsTotal: Number(roomsTotal ?? totalPrice ?? 0),
    toursTotal: Number(toursTotal ?? 0),
    depositAmount: resolvedDeposit,
    record: reservation,
    saldo: saldoNum,
    subtotal: subtotalNum,
    discount: discountNum,
    depositRule: reservation.depositRule,
    createdAt,
  };
}

// ── Actualizar campos de una reserva ───────────────────────
// Mezcla superficial del patch. El folio no se puede cambiar.

export function updateReservation(folio, patch = {}) {
  const reservations = load();
  const idx = findIndexByFolio(reservations, folio);
  if (idx === -1) return null;
  const { folio: _ignored, ...safePatch } = (patch && typeof patch === 'object') ? patch : {};
  Object.assign(reservations[idx], safePatch);
  save(reservations);
  return reservations[idx];
}

// ── Reemplazar una cotización por otra (cambio de fechas/suite) ──
// Solo se reemplaza una cotización PENDIENTE_PAGO sin comprobante: si el cliente ya
// pagó o ya está confirmada, lo resuelve el equipo. Devuelve null si no se cambió nada.

export function supersedeQuote(oldFolio, newFolio) {
  if (!oldFolio || !newFolio || normFolio(oldFolio) === normFolio(newFolio)) return null;
  const reservations = load();
  const idx = findIndexByFolio(reservations, oldFolio);
  if (idx === -1) return null;
  const res = reservations[idx];
  if (res.status !== 'PENDIENTE_PAGO' || res.proofReceivedAt) return null;
  res.status = 'REEMPLAZADA';
  res.supersededBy = newFolio;
  res.supersededAt = new Date().toISOString();
  save(reservations);
  return res;
}

// ── Confirmar pago recibido ────────────────────────────────

export function confirmPayment(folio) {
  const reservations = load();
  const res = reservations.find(r => r.folio === folio);
  if (res) {
    res.status = 'RESERVADO';
    res.roomStatus = 'RESERVADO';
    res.confirmedAt = new Date().toISOString();
    save(reservations);
  }
  return res;
}

// ── Marcar que llegó el comprobante (pago en verificación por el equipo) ────
// El status sigue en PENDIENTE_PAGO hasta que un humano corre /confirmar, así que
// guardamos aparte cuándo llegó el comprobante para que la máquina de estados sepa
// que el cliente YA pagó y no lo vuelva a mandar a pagar.
//
// arg: userId (string, comportamiento de siempre: su PENDIENTE_PAGO más reciente)
//      | { folio } (ese folio exacto) | { userId }.
// proofReceivedAt = el PRIMER comprobante; lastProofAt y proofCount se actualizan en cada uno.
export function markPaymentProofReceived(arg) {
  const reservations = load();
  let res = null;
  if (arg && typeof arg === 'object' && arg.folio) {
    const idx = findIndexByFolio(reservations, arg.folio);
    res = idx === -1 ? null : reservations[idx];
  } else {
    const userId = (arg && typeof arg === 'object') ? arg.userId : arg;
    if (userId) {
      res = newestFirst(reservations.filter(r => r.userId === userId && r.status === 'PENDIENTE_PAGO'))[0] || null;
    }
  }
  if (res) {
    const nowIso = new Date().toISOString();
    const previousCount = Number(res.proofCount) || (res.proofReceivedAt ? 1 : 0);
    if (!res.proofReceivedAt) res.proofReceivedAt = nowIso;
    res.lastProofAt = nowIso;
    res.proofCount = previousCount + 1;
    save(reservations);
  }
  return res || null;
}

// ── Buscar la cotización pendiente por número de teléfono ──
// Arregla el caso @lid/@c.us: el mismo cliente puede llegar con un JID distinto al
// que tenía cuando cotizó. Compara los últimos 10 dígitos del waNumber guardado o
// de los dígitos del userId contra cada candidato.

export function findLatestPendingByPhone(candidates = []) {
  const wanted = new Set((Array.isArray(candidates) ? candidates : [candidates])
    .map(c => last10(c))
    .filter(Boolean));
  if (!wanted.size) return null;

  const matches = load().filter(r => {
    if (r?.status !== 'PENDIENTE_PAGO') return false;
    const own = [last10(r.waNumber), last10(extractDigitsFromJid(r.userId))].filter(Boolean);
    return own.some(d => wanted.has(d));
  });
  return newestFirst(matches)[0] || null;
}

export function getLocallyReservedBackendNames({ checkin, checkout, requestedRooms = [] }) {
  if (!checkin || !checkout || !requestedRooms.length) return [];

  const activeStatuses = new Set(['RESERVADO', 'CONFIRMADA']); // CONFIRMADA por compatibilidad histórica
  const byId = new Map(requestedRooms.map(room => [room.id, room]));
  const byName = new Map(requestedRooms.map(room => [normalizeText(room.name), room]));
  const reserved = new Set();

  for (const reservation of load()) {
    if (!activeStatuses.has(reservation?.status)) continue;
    if (!reservation?.checkin || !reservation?.checkout) continue;
    if (!overlaps(checkin, checkout, reservation.checkin, reservation.checkout)) continue;

    // Soporta tanto formato multi-habitación (rooms[]) como legacy (room)
    const roomsToCheck = Array.isArray(reservation.rooms) && reservation.rooms.length > 0
      ? reservation.rooms
      : (reservation.room ? [reservation.room] : []);

    for (const r of roomsToCheck) {
      const roomById = byId.get(r?.id);
      if (roomById?.backendName) { reserved.add(roomById.backendName); continue; }
      const roomByName = byName.get(normalizeText(r?.name || ''));
      if (roomByName?.backendName) reserved.add(roomByName.backendName);
    }
  }

  return [...reserved];
}

// ── Obtener reservas pendientes ────────────────────────────

export function getPending() {
  return load().filter(r => r.status === 'PENDIENTE_PAGO');
}

// ── Buscar reserva por userId ──────────────────────────────

export function getByUser(userId) {
  return newestFirst(load().filter(r => r.userId === userId))[0] || null;
}

// ── Buscar reserva por folio (identificador único, robusto ante @lid/@c.us) ──

export function getByFolio(folio) {
  if (!folio) return null;
  const reservations = load();
  const idx = findIndexByFolio(reservations, folio);
  return idx === -1 ? null : reservations[idx];
}
