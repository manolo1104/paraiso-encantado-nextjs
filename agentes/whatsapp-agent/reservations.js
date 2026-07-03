/**
 * reservations.js
 * Gestiona reservas tomadas por WhatsApp:
 * - Genera cotizaciones con datos bancarios
 * - Guarda reservas pendientes en reservations.json
 * - Notifica al equipo del hotel cuando llega un comprobante
 */

import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';

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
  depositAmount
}) {
  const reservations = load();

  const folio = 'WA-' + Date.now().toString(36).toUpperCase();
  const bankInfo = {
    banco:     process.env.BANK_NAME     || 'Banamex',
    titular:   process.env.BANK_TITULAR  || 'Mario Arturo Covarrubias Orduña',
    clabe:     process.env.BANK_CLABE    || '002705700824116647',
    cuenta:    process.env.BANK_CUENTA   || '4217470058780996',
  };

  const resolvedDeposit = (depositAmount != null && depositAmount > 0) ? depositAmount : totalPrice;
  const roomsArray = Array.isArray(rooms) ? rooms : (rooms ? [rooms] : []);
  const toursArray = Array.isArray(tours) ? tours : (tours ? [tours] : []);
  const primaryRoom = roomsArray[0] || null;
  const totalGuests = roomsArray.reduce((sum, r) => sum + Number(r.guests || 0), 0);

  const reservation = {
    folio,
    status: 'PENDIENTE_PAGO',
    userId,
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
    totalPrice,
    depositAmount: resolvedDeposit,
    bankInfo,
    createdAt: new Date().toISOString(),
  };

  reservations.push(reservation);
  save(reservations);

  return {
    folio,
    bankInfo,
    totalPrice,
    roomsTotal: Number(roomsTotal ?? totalPrice ?? 0),
    toursTotal: Number(toursTotal ?? 0),
    depositAmount: resolvedDeposit
  };
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
  return load()
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
}

// ── Buscar reserva por folio (identificador único, robusto ante @lid/@c.us) ──

export function getByFolio(folio) {
  if (!folio) return null;
  const f = String(folio).trim().toUpperCase();
  return load().find(r => String(r.folio || '').toUpperCase() === f) || null;
}
