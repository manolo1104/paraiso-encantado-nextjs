#!/usr/bin/env node
import 'dotenv/config';
import fetch from 'node-fetch';
import { ROOMS } from './hotel-knowledge.js';

function normalizeText(v = '') {
  return String(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
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
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return null;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function roomMatchesCell(room, cellValue = '') {
  const cell = normalizeText(cellValue);
  if (!cell) return false;
  const candidates = [room.backendName, room.name, room.id]
    .filter(Boolean)
    .map(normalizeText);
  return candidates.some(candidate => cell.includes(candidate) || candidate.includes(cell));
}

async function getGoogleAccessToken() {
  const json = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!json) throw new Error('Falta GOOGLE_SHEETS_CREDENTIALS');
  const creds = JSON.parse(json);

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');

  const unsigned = `${header}.${payload}`;
  const crypto = await import('node:crypto');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  const signature = signer.sign(creds.private_key, 'base64url');
  const assertion = `${unsigned}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`No se pudo obtener token Google: ${txt}`);
  }
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function getSheetValues(tabName) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error('Falta GOOGLE_SHEET_ID');
  const token = await getGoogleAccessToken();
  const tab = tabName || process.env.GOOGLE_SHEET_TAB || 'Reservas';
  const range = encodeURIComponent(`${tab}!A:ZZ`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`No se pudo leer sheet ${tab}: ${txt}`);
  }
  const data = await res.json();
  return { tab, values: data.values || [] };
}

async function main() {
  const checkin = process.argv[2] || '2026-04-17';
  const checkout = process.argv[3] || '2026-04-18';

  const { tab, values } = await getSheetValues();
  if (!values.length) {
    console.log('Sheet vacío');
    return;
  }

  const headers = values[0];
  const roomIndex = findHeaderIndex(headers, ['habitacion', 'habitación', 'suite', 'room', 'habitacion reservada', 'habitaciones']);
  const checkinIndex = findHeaderIndex(headers, ['checkin', 'check-in', 'fecha entrada', 'fecha de entrada', 'entrada', 'llegada']);
  const checkoutIndex = findHeaderIndex(headers, ['checkout', 'check-out', 'fecha salida', 'fecha de salida', 'salida']);

  console.log(`Tab: ${tab}`);
  console.log(`Headers room/checkin/checkout idx: ${roomIndex}/${checkinIndex}/${checkoutIndex}`);

  const overlapping = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const roomCell = row[roomIndex] || '';
    const start = parseDateValue(row[checkinIndex]);
    const end = parseDateValue(row[checkoutIndex]);
    if (!roomCell || !start || !end) continue;
    if (!overlaps(checkin, checkout, start, end)) continue;

    const matches = ROOMS.filter(r => roomMatchesCell(r, roomCell)).map(r => r.backendName);
    overlapping.push({ rowNumber: i + 1, roomCell, start, end, matches });
  }

  console.log(`\nFilas que traslapan ${checkin}→${checkout}: ${overlapping.length}`);
  for (const item of overlapping) {
    console.log(`- Fila ${item.rowNumber} | ${item.start}→${item.end}`);
    console.log(`  roomCell: ${item.roomCell}`);
    console.log(`  matches: ${item.matches.length ? item.matches.join(' | ') : '(SIN MATCH)'}`);
  }

  const uniqueMatched = [...new Set(overlapping.flatMap(o => o.matches))];
  console.log(`\nTotal habitaciones marcadas no disponibles por match: ${uniqueMatched.length}`);
  console.log(uniqueMatched.length ? uniqueMatched.join('\n') : '(ninguna)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
