import crypto from 'node:crypto';
import fetch from 'node-fetch';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
let accessTokenCache = { token: null, expiresAt: 0 };

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseGoogleCredentials() {
  const raw = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (raw) {
    const trimmed = String(raw).trim().replace(/^['"]|['"]$/g, '');

    // 1) Intento directo con JSON válido
    try {
      const creds = JSON.parse(trimmed);
      return {
        projectId: creds.project_id,
        clientEmail: creds.client_email,
        privateKey: String(creds.private_key || '').replace(/\\n/g, '\n')
      };
    } catch {
      // 2) Fallback para JSON pegado en .env con private_key multilínea sin escapar
      const projectId = (trimmed.match(/"project_id"\s*:\s*"([^"]+)"/) || [])[1] || '';
      const clientEmail = (trimmed.match(/"client_email"\s*:\s*"([^"]+)"/) || [])[1] || '';

      let privateKey = '';

      // Caso común: private_key antes de client_email
      const keyBeforeEmail = trimmed.match(/"private_key"\s*:\s*"([\s\S]*?)"\s*,\s*"client_email"/);
      if (keyBeforeEmail?.[1]) {
        privateKey = keyBeforeEmail[1];
      } else {
        // Fallback más flexible: tomar desde BEGIN a END
        const begin = trimmed.indexOf('-----BEGIN PRIVATE KEY-----');
        const endMarker = '-----END PRIVATE KEY-----';
        const end = trimmed.indexOf(endMarker);
        if (begin >= 0 && end >= 0) {
          privateKey = trimmed.slice(begin, end + endMarker.length);
        }
      }

      return {
        projectId,
        clientEmail,
        privateKey: String(privateKey || '').replace(/\\n/g, '\n')
      };
    }
  }

  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (process.env.GOOGLE_CLIENT_EMAIL && privateKey) {
    return {
      projectId: process.env.GOOGLE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey
    };
  }

  return null;
}

async function getGoogleAccessToken() {
  const now = Date.now();
  if (accessTokenCache.token && accessTokenCache.expiresAt > now + 60_000) {
    return accessTokenCache.token;
  }

  const creds = parseGoogleCredentials();
  if (!creds?.clientEmail || !creds?.privateKey) {
    throw new Error('Faltan credenciales de Google Sheets.');
  }

  const issuedAt = Math.floor(now / 1000);
  const payload = {
    iss: creds.clientEmail,
    scope: SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: issuedAt + 3600,
    iat: issuedAt
  };
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .sign('RSA-SHA256', Buffer.from(unsignedToken), creds.privateKey)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }).toString()
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`No se pudo obtener access token de Google (${response.status}): ${body}`);
  }

  const data = await response.json();
  accessTokenCache = {
    token: data.access_token,
    expiresAt: now + (Number(data.expires_in || 3600) * 1000)
  };
  return accessTokenCache.token;
}

async function getSheetValues(tab = null) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const resolvedTab = tab || process.env.GOOGLE_SHEET_TAB || 'Reservas';
  if (!sheetId) throw new Error('Falta GOOGLE_SHEET_ID.');

  const token = await getGoogleAccessToken();
  const range = encodeURIComponent(`${resolvedTab}!A:ZZ`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`No se pudo leer Google Sheets (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.values || [];
}

function findHeaderIndex(headers, aliases) {
  const normalized = headers.map(normalizeText);
  for (const alias of aliases) {
    const aliasNorm = normalizeText(alias);
    const exactIndex = normalized.findIndex(h => h === aliasNorm);
    if (exactIndex >= 0) return exactIndex;
  }
  for (const alias of aliases) {
    const aliasNorm = normalizeText(alias);
    const partialIndex = normalized.findIndex(h => h.includes(aliasNorm) || aliasNorm.includes(h));
    if (partialIndex >= 0) return partialIndex;
  }
  return -1;
}

function parseDateValue(value = '') {
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const dashMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, day, month, year] = dashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }
  return null;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function isInactiveStatus(status = '') {
  const text = normalizeText(status);
  if (!text) return false;
  return [
    'cancelada', 'cancelado', 'cancelled', 'canceled', 'reembolso', 'reembolsada',
    'reembolsado', 'no show cancelado'
  ].some(item => text.includes(item));
}

function roomMatchesCell(room, cellValue = '') {
  const simplifyRoomText = (value = '') => {
    return normalizeText(value)
      .replace(/\bii\b/g, '2')
      .replace(/\biii\b/g, '3')
      .replace(/\bi\b/g, '1')
      .replace(/\b(suite|habitacion|habitaciones|familiar|room)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const cell = simplifyRoomText(cellValue);
  if (!cell) return false;

  const candidates = [room.backendName, room.name, room.id]
    .filter(Boolean)
    .map(simplifyRoomText)
    .filter(Boolean);

  return candidates.some(candidate => {
    if (cell.includes(candidate) || candidate.includes(cell)) return true;

    const cellTokens = new Set(cell.split(' ').filter(Boolean));
    const candidateTokens = candidate.split(' ').filter(Boolean);
    const overlap = candidateTokens.filter(t => cellTokens.has(t)).length;
    return overlap >= Math.min(2, candidateTokens.length);
  });
}

function formatDateYmd(dateInput = null) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatDateTimeMx(dateInput = null) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function formatPhoneFromUserId(userId = '') {
  const digits = String(userId).replace(/\D/g, '');
  if (!digits) return '';
  // WhatsApp MX suele venir como 521XXXXXXXXXX; mostrarlo como +52XXXXXXXXXX
  if (digits.length === 13 && digits.startsWith('521')) {
    return `+52${digits.slice(3)}`;
  }
  if (digits.length === 12 && digits.startsWith('52')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

function buildReservationDefaultRow(reservation) {
  return [
    formatDateYmd(reservation?.confirmedAt || reservation?.createdAt || new Date()), // Fecha
    reservation?.folio || '', // Confirmación
    reservation?.guestName || reservation?.userName || '', // Cliente
    formatPhoneFromUserId(reservation?.userId || ''), // Teléfono
    Number(reservation?.totalPrice || 0), // Total
    reservation?.checkin || '', // Check-in
    reservation?.checkout || '', // Check-out
    Number(reservation?.nights || 0), // Noches
    Number(reservation?.guests || 0), // Huéspedes
    reservation?.room?.name || '' // Habitaciones
  ];
}

function buildReservationRowByHeaders(headers = [], reservation = {}) {
  if (!Array.isArray(headers) || headers.length === 0) {
    return buildReservationDefaultRow(reservation);
  }

  return headers.map((header) => {
    const h = normalizeText(header);

    if (h === 'fecha' || h.includes('fecha reserva') || h.includes('fecha de reserva')) {
      return formatDateTimeMx(reservation?.confirmedAt || reservation?.createdAt || new Date());
    }
    if (h.includes('confirmacion') || h === 'folio' || h.includes('folio de wpp')) {
      return reservation?.folio || '';
    }
    // Número de huéspedes (plural) — debe ir ANTES del check de nombre
    if (h === 'huespedes' || h.includes('num huespedes') || h.includes('numero de huespedes') || h.includes('cant') || h.includes('personas')) {
      return Number(reservation?.guests || 0);
    }
    // Nombre del huésped (singular) o cliente
    if (h.includes('cliente') || h === 'huesped' || h.includes('nombre huesped') || h.includes('nombre del')) {
      return reservation?.guestName || reservation?.userName || '';
    }
    if (h.includes('email') || h.includes('correo') || h === 'mail') {
      return reservation?.guestEmail || '';
    }
    if (
      h.includes('como nos conociste') ||
      h.includes('como nos encontraste') ||
      h.includes('como nos conocio') ||
      h.includes('fuente') ||
      h.includes('origen')
    ) {
      return reservation?.howFound || '';
    }
    if (h.includes('telefono') || h.includes('whatsapp')) {
      return formatPhoneFromUserId(reservation?.userId || '');
    }
    if (h === 'total' || h.includes('monto')) {
      return Number(reservation?.totalPrice || 0);
    }
    if (h.includes('check in') || h === 'checkin' || h.includes('entrada')) {
      return reservation?.checkin || '';
    }
    if (h.includes('check out') || h === 'checkout' || h.includes('salida')) {
      return reservation?.checkout || '';
    }
    if (h.includes('noche')) {
      return Number(reservation?.nights || 0);
    }
    if (h.includes('habitacion') || h.includes('suite') || h.includes('room')) {
      const allRooms = Array.isArray(reservation?.rooms) && reservation.rooms.length > 0
        ? reservation.rooms
        : (reservation?.room ? [reservation.room] : []);
      return allRooms.map(r => r.name).filter(Boolean).join(' + ') || '';
    }
    if (h === 'estado' || h === 'status' || h === 'estatus' || h.includes('situacion')) {
      return reservation?.status || 'CONFIRMADA';
    }

    // Columna no reconocida: dejar vacía para respetar la estructura actual de la hoja
    return '';
  });
}

function findFolioColumnIndex(headers = []) {
  return findHeaderIndex(headers, ['confirmacion', 'confirmación', 'folio', 'folio de wpp', 'numero de confirmacion']);
}

function parseSheetReservations(values) {
  if (!values.length) return [];
  const headers = values[0];
  const roomIndex = findHeaderIndex(headers, ['habitacion', 'habitación', 'suite', 'room', 'habitacion reservada']);
  const checkinIndex = findHeaderIndex(headers, ['checkin', 'check-in', 'fecha entrada', 'fecha de entrada', 'entrada', 'llegada']);
  const checkoutIndex = findHeaderIndex(headers, ['checkout', 'check-out', 'fecha salida', 'fecha de salida', 'salida']);
  const statusIndex = findHeaderIndex(headers, ['estado', 'status', 'estatus', 'situacion', 'situación']);
  const folioIndex = findHeaderIndex(headers, ['folio', 'confirmacion', 'confirmación', 'numero de confirmacion']);

  if (roomIndex < 0 || checkinIndex < 0 || checkoutIndex < 0) {
    throw new Error('No se identificaron columnas clave en Google Sheets (habitación, check-in, check-out).');
  }

  return values.slice(1).map((row, rowOffset) => ({
    rowNumber: rowOffset + 2,
    room: row[roomIndex] || '',
    checkin: parseDateValue(row[checkinIndex]),
    checkout: parseDateValue(row[checkoutIndex]),
    status: statusIndex >= 0 ? (row[statusIndex] || '') : '',
    folio: folioIndex >= 0 ? (row[folioIndex] || '') : ''
  })).filter(item => item.room && item.checkin && item.checkout && !isInactiveStatus(item.status));
}

function parseDisponibilidadBlocks(values) {
  if (!values.length) return [];
  const headers = values[0];

  // Formato matriz/calendario:
  // Col A = Fecha, columnas siguientes = habitaciones,
  // celdas con valores tipo "RESERVADO" / "BLOQUEADO" / "OCUPADO".
  const fechaIndex = findHeaderIndex(headers, ['fecha', 'date', 'dia', 'día']);
  const hasMatrixShape = fechaIndex >= 0 && headers.length >= 3;
  if (hasMatrixShape) {
    const blockedKeywords = ['reserv', 'bloque', 'ocup', 'apart'];
    const blocks = [];

    for (const row of values.slice(1)) {
      const day = parseDateValue(row[fechaIndex]);
      if (!day) continue;

      for (let col = 0; col < headers.length; col++) {
        if (col === fechaIndex) continue;
        const roomHeader = String(headers[col] || '').trim();
        if (!roomHeader) continue;

        const cellRaw = String(row[col] || '').trim();
        if (!cellRaw) continue;
        const cellNorm = normalizeText(cellRaw);
        if (!blockedKeywords.some(k => cellNorm.includes(k))) continue;

        const checkin = day;
        const d = new Date(`${day}T00:00:00`);
        d.setDate(d.getDate() + 1);
        const checkout = d.toISOString().slice(0, 10);

        blocks.push({
          room: roomHeader,
          checkin,
          checkout,
          status: cellRaw,
          expiresAt: null
        });
      }
    }

    return blocks;
  }

  const roomIndex = findHeaderIndex(headers, ['habitacion', 'habitación', 'suite', 'room']);
  const checkinIndex = findHeaderIndex(headers, ['checkin', 'check-in', 'check in', 'entrada', 'desde']);
  const checkoutIndex = findHeaderIndex(headers, ['checkout', 'check-out', 'check out', 'salida', 'hasta']);
  const statusIndex = findHeaderIndex(headers, ['estado', 'status', 'estatus']);
  const expiresIndex = findHeaderIndex(headers, ['expira', 'expiraat', 'vence', 'expiry', 'expires']);

  if (roomIndex < 0 || checkinIndex < 0 || checkoutIndex < 0) return [];

  const now = Date.now();
  return values.slice(1).map(row => ({
    room: row[roomIndex] || '',
    checkin: parseDateValue(row[checkinIndex]),
    checkout: parseDateValue(row[checkoutIndex]),
    status: statusIndex >= 0 ? (row[statusIndex] || '') : '',
    expiresAt: expiresIndex >= 0 ? row[expiresIndex] : null
  })).filter(item => {
    if (!item.room || !item.checkin || !item.checkout) return false;
    if (isInactiveStatus(item.status)) return false;
    // Solo descartar por expiración si el estado es BLOQUEADO TEMPORAL
    if (normalizeText(item.status).includes('bloqueado') && item.expiresAt) {
      const exp = new Date(item.expiresAt).getTime();
      if (!Number.isNaN(exp) && exp < now) return false;
    }
    return true;
  });
}

function columnIndexToLetter(index) {
  let letter = '';
  let i = index;
  do {
    letter = String.fromCharCode(65 + (i % 26)) + letter;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return letter;
}

export async function updateRoomStatusInDisponibilidad(folio, newStatus = 'RESERVADO') {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tab = process.env.GOOGLE_DISPONIBILIDAD_TAB || 'Disponibilidad';
  if (!sheetId) return { success: false, reason: 'Falta GOOGLE_SHEET_ID.' };

  try {
    const token = await getGoogleAccessToken();
    const range = encodeURIComponent(`${tab}!A:ZZ`);
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

    const readRes = await fetch(readUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!readRes.ok) return { success: false, reason: 'No se pudo leer pestaña Disponibilidad.' };

    const data = await readRes.json();
    const values = data.values || [];
    if (values.length === 0) return { success: false, reason: 'Pestaña Disponibilidad vacía.' };

    const headers = values[0];
    // Para tab sin encabezados reconocibles: folio en col 4 (E), estado en col 3 (D)
    const folioIdx = findHeaderIndex(headers, ['folio', 'confirmacion', 'sesion', 'sessionid']) ?? 4;
    const statusIdx = findHeaderIndex(headers, ['estado', 'status', 'estatus']) ?? 3;

    const updatedRows = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (normalizeText(row[folioIdx] || '') === normalizeText(folio)) {
        const col = columnIndexToLetter(statusIdx);
        const sheetRow = i + 1; // 1-indexed
        const cellRange = encodeURIComponent(`${tab}!${col}${sheetRow}`);
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${cellRange}?valueInputOption=USER_ENTERED`;
        const updateRes = await fetch(updateUrl, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [[newStatus]] })
        });
        if (updateRes.ok) updatedRows.push(sheetRow);
      }
    }

    if (updatedRows.length === 0) return { success: false, reason: `Folio ${folio} no encontrado en Disponibilidad.` };
    return { success: true, folio, newStatus, updatedRows };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

export async function getUnavailableRoomsFromGoogleSheet({ checkin, checkout, requestedRooms }) {
  const values = await getSheetValues();
  const reservations = parseSheetReservations(values);

  // También leer tab de Disponibilidad para bloqueos temporales
  const dispTab = process.env.GOOGLE_DISPONIBILIDAD_TAB || 'Disponibilidad';
  let tempBlocks = [];
  try {
    const dispValues = await getSheetValues(dispTab);
    tempBlocks = parseDisponibilidadBlocks(dispValues);
  } catch {
    // Tab no existe o no configurado — ignorar silenciosamente
  }

  const allBlocks = [...reservations, ...tempBlocks];
  const unavailableRooms = requestedRooms.filter(room =>
    allBlocks.some(block => roomMatchesCell(room, block.room) && overlaps(checkin, checkout, block.checkin, block.checkout))
  );

  return {
    source: 'google-sheets',
    totalRows: values.length,
    reservationsChecked: allBlocks.length,
    unavailableRooms
  };
}

export async function appendTempBlockToSheet({ room, checkin, checkout, folio, sessionId }) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tab = process.env.GOOGLE_DISPONIBILIDAD_TAB || 'Disponibilidad';
  if (!sheetId) return { success: false, reason: 'Falta GOOGLE_SHEET_ID.' };

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

  try {
    const token = await getGoogleAccessToken();
    const range = encodeURIComponent(`${tab}!A:ZZ`);

    // Leer headers del tab si existen
    let headers = [];
    try {
      const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
      const readRes = await fetch(readUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (readRes.ok) {
        const data = await readRes.json();
        headers = (data.values || [])[0] || [];
      }
    } catch { /* ignorar */ }

    let row;
    if (headers.length > 0) {
      row = headers.map(h => {
        const hn = normalizeText(h);
        if (hn.includes('habitacion') || hn.includes('suite') || hn.includes('room')) return room?.name || '';
        if (hn.includes('checkin') || hn.includes('check in') || hn.includes('entrada') || hn === 'desde') return checkin || '';
        if (hn.includes('checkout') || hn.includes('check out') || hn.includes('salida') || hn === 'hasta') return checkout || '';
        if (hn === 'estado' || hn === 'status' || hn === 'estatus') return 'BLOQUEADO TEMPORAL';
        if (hn.includes('folio') || hn.includes('confirmacion') || hn.includes('sesion')) return folio || sessionId || '';
        if (hn.includes('expira') || hn.includes('vence') || hn.includes('expiry')) return expiresAt;
        if (hn === 'fecha') return formatDateTimeMx();
        return '';
      });
    } else {
      // Sin headers: estructura por defecto
      row = [room?.name || '', checkin || '', checkout || '', 'BLOQUEADO TEMPORAL', folio || sessionId || '', expiresAt];
    }

    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const appendRes = await fetch(appendUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });

    if (!appendRes.ok) {
      const body = await appendRes.text();
      return { success: false, reason: `Error Disponibilidad (${appendRes.status}): ${body}` };
    }

    return { success: true, folio, expiresAt };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

export async function getReservationByFolioFromSheet(folio) {
  if (!folio) return { found: false, reason: 'Folio no proporcionado.' };

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tab = process.env.GOOGLE_SHEET_TAB || 'Reservas';
  if (!sheetId) return { found: false, reason: 'Falta GOOGLE_SHEET_ID.' };

  try {
    const values = await getSheetValues(tab);
    if (values.length === 0) return { found: false, reason: 'Hoja sin datos.' };

    const headers = values[0];
    const folioIdx = findHeaderIndex(headers, ['folio', 'confirmacion', 'confirmación', 'folio de wpp', 'numero de confirmacion']);
    if (folioIdx < 0) return { found: false, reason: 'No se encontró columna de folio.' };

    const folioNorm = normalizeText(folio);
    const rowIndex = values.findIndex((row, i) => i > 0 && normalizeText(row[folioIdx] || '') === folioNorm);
    if (rowIndex < 0) return { found: false, folio };

    const row = values[rowIndex];

    // Mapear columnas a campos de reserva
    const get = (aliases) => {
      const idx = findHeaderIndex(headers, aliases);
      return idx >= 0 ? (row[idx] || '') : '';
    };

    const totalPrice  = Number(get(['total', 'monto'])) || 0;
    const depositPaid = Number(get(['anticipo', 'deposito', 'pago recibido', 'pago'])) || totalPrice;
    const pending     = Math.max(0, totalPrice - depositPaid);

    return {
      found: true,
      folio:       get(['folio', 'confirmacion', 'confirmación', 'folio de wpp']),
      guestName:   get(['cliente', 'huesped', 'nombre huesped', 'nombre del huesped']),
      phone:       get(['telefono', 'whatsapp', 'celular']),
      email:       get(['email', 'correo', 'mail']),
      howFound:    get(['como nos conociste', 'como nos encontraste', 'fuente', 'origen']),
      checkin:     get(['checkin', 'check-in', 'check in', 'entrada']),
      checkout:    get(['checkout', 'check-out', 'check out', 'salida']),
      nights:      get(['noches', 'noche']),
      guests:      get(['huespedes', 'num huespedes', 'personas']),
      room:        get(['habitacion', 'habitación', 'suite', 'room']),
      totalPrice,
      depositPaid,
      pendingAmount: pending,
      status:      get(['estado', 'status', 'estatus']),
      createdAt:   get(['fecha', 'fecha reserva']),
    };
  } catch (err) {
    return { found: false, reason: err.message };
  }
}

export async function findAlternativeDates(requestedCheckin, requestedCheckout, requestedRooms, daysBuffer = 5) {
  try {
    const checkinDate = new Date(`${requestedCheckin}T00:00:00`);
    const checkoutDate = new Date(`${requestedCheckout}T00:00:00`);
    if (Number.isNaN(checkinDate.getTime()) || Number.isNaN(checkoutDate.getTime())) {
      return { success: false, alternatives: [], message: 'Fechas inválidas.' };
    }

    const nights = Math.max(1, Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)));
    const alternatives = [];

    for (let dayOffset = -daysBuffer; dayOffset <= daysBuffer; dayOffset++) {
      if (dayOffset === 0) continue;

      const altCheckin = new Date(checkinDate);
      altCheckin.setDate(altCheckin.getDate() + dayOffset);
      const altCheckout = new Date(altCheckin);
      altCheckout.setDate(altCheckout.getDate() + nights);

      const altCheckinStr = altCheckin.toISOString().slice(0, 10);
      const altCheckoutStr = altCheckout.toISOString().slice(0, 10);

      try {
        const availability = await getUnavailableRoomsFromGoogleSheet({
          checkin: altCheckinStr,
          checkout: altCheckoutStr,
          requestedRooms
        });

        const unavailableNames = new Set((availability?.unavailableRooms || []).map(r => r.backendName));
        const availableRooms = (requestedRooms || []).filter(r => !unavailableNames.has(r.backendName));
        if (availableRooms.length <= 0) continue;

        const dayName = altCheckin.toLocaleDateString('es-MX', {
          weekday: 'long',
          timeZone: 'America/Mexico_City'
        });
        const formattedDate = altCheckin.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'America/Mexico_City'
        });

        alternatives.push({
          checkin: altCheckinStr,
          checkout: altCheckoutStr,
          nights,
          dayName: String(dayName).charAt(0).toUpperCase() + String(dayName).slice(1),
          formattedDate,
          availableCount: availableRooms.length,
          availableRooms: availableRooms.map(r => ({
            id: r.id,
            name: r.name,
            price_2: r.price_2,
            price_3_4: r.price_3_4
          }))
        });
      } catch {
        // continuar con la siguiente fecha alternativa
      }
    }

    return {
      success: alternatives.length > 0,
      alternatives: alternatives.slice(0, 3),
      originalRequest: { checkin: requestedCheckin, checkout: requestedCheckout },
      message: alternatives.length > 0
        ? `Se encontraron ${alternatives.length} alternativas cercanas.`
        : 'No se encontraron fechas cercanas con disponibilidad.'
    };
  } catch (err) {
    return { success: false, alternatives: [], message: err.message };
  }
}

export async function getSheetDiagnostics() {
  const values = await getSheetValues();
  const reservations = parseSheetReservations(values);
  return {
    totalRows: values.length,
    parsedReservations: reservations.length,
    sampleHeaders: values[0] || [],
    sampleReservations: reservations.slice(0, 5)
  };
}

export async function getRawSheetTabValues(tabName) {
  return getSheetValues(tabName);
}

export async function appendConfirmedReservationToSheet(reservation) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tab = process.env.GOOGLE_SHEET_TAB || 'Reservas';
  if (!sheetId) throw new Error('Falta GOOGLE_SHEET_ID.');
  if (!reservation?.folio) throw new Error('Falta folio de reserva para registrar en Google Sheets.');

  // Leer encabezados y validar duplicados por folio
  const values = await getSheetValues();
  const headers = values[0] || [];
  const folioIndex = findFolioColumnIndex(headers);

  if (folioIndex >= 0) {
    const exists = values.slice(1).some(row => normalizeText(row[folioIndex] || '') === normalizeText(reservation.folio));
    if (exists) {
      return { success: true, alreadyExists: true, folio: reservation.folio };
    }
  }

  const row = buildReservationRowByHeaders(headers, reservation);
  const token = await getGoogleAccessToken();
  const range = encodeURIComponent(`${tab}!A:ZZ`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [row] })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`No se pudo registrar reserva en Google Sheets (${response.status}): ${body}`);
  }

  const data = await response.json();
  return {
    success: true,
    alreadyExists: false,
    folio: reservation.folio,
    updatedRange: data?.updates?.updatedRange || null
  };
}
