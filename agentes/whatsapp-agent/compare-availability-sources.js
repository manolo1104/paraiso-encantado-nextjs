#!/usr/bin/env node
import 'dotenv/config';
import fetch from 'node-fetch';
import { ROOMS } from './hotel-knowledge.js';
import { getUnavailableRoomsFromGoogleSheet } from './google-sheets.js';

const BOOKING_API = process.env.BOOKING_API_URL || 'https://booking-paraisoencantado.up.railway.app';

async function main() {
  const checkin = process.argv[2] || '2026-05-02';
  const checkout = process.argv[3] || '2026-05-03';

  console.log(`Comparando fuentes para ${checkin} → ${checkout}`);
  console.log(`GOOGLE_SHEET_ID: ${process.env.GOOGLE_SHEET_ID || '(vacío)'}`);
  console.log(`GOOGLE_SHEET_TAB: ${process.env.GOOGLE_SHEET_TAB || '(vacío)'}`);
  console.log(`BOOKING_API_URL: ${BOOKING_API}`);

  const requestedRooms = ROOMS;

  const sheetResult = await getUnavailableRoomsFromGoogleSheet({ checkin, checkout, requestedRooms });
  const sheetUnavailable = sheetResult.unavailableRooms.map(r => r.backendName);

  let apiUnavailable = [];
  try {
    const res = await fetch(`${BOOKING_API}/api/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkin,
        checkout,
        rooms: ROOMS.map(r => r.backendName)
      })
    });
    const data = await res.json();
    apiUnavailable = data.unavailableRooms || [];
  } catch (e) {
    console.log('Error consultando backend:', e.message);
  }

  console.log('\n--- Google Sheets ---');
  console.log(`rows=${sheetResult.totalRows} parsed=${sheetResult.reservationsChecked} unavailable=${sheetUnavailable.length}`);
  console.log(sheetUnavailable.length ? sheetUnavailable.join('\n') : '(ninguna)');

  console.log('\n--- Backend API ---');
  console.log(`unavailable=${apiUnavailable.length}`);
  console.log(apiUnavailable.length ? apiUnavailable.join('\n') : '(ninguna)');

  const onlySheet = sheetUnavailable.filter(x => !apiUnavailable.includes(x));
  const onlyApi = apiUnavailable.filter(x => !sheetUnavailable.includes(x));

  console.log('\n--- Diferencias ---');
  console.log(`Solo en Sheets: ${onlySheet.length}`);
  if (onlySheet.length) console.log(onlySheet.join('\n'));
  console.log(`Solo en API: ${onlyApi.length}`);
  if (onlyApi.length) console.log(onlyApi.join('\n'));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
