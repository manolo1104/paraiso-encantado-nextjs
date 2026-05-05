/**
 * reservations.js
 * Gestiona reservas tomadas por WhatsApp:
 * - Genera cotizaciones con datos bancarios
 * - Guarda reservas pendientes en reservations.json
 * - Notifica al equipo del hotel cuando llega un comprobante
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILE = './reservations.json';

function load() {
  if (!existsSync(FILE)) return [];
  try { return JSON.parse(readFileSync(FILE, 'utf-8')); }
  catch { return []; }
}

function save(data) {
  writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8');
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
