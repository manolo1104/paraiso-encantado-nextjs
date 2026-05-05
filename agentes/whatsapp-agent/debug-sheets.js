#!/usr/bin/env node
/**
 * debug-sheets.js
 * Muestra qué reservas hay en Google Sheets para debugging
 */

import 'dotenv/config';
import { getSheetDiagnostics, getUnavailableRoomsFromGoogleSheet } from './google-sheets.js';
import { ROOMS } from './hotel-knowledge.js';

async function debugSheets() {
  console.log('🔍 DEBUG: Leyendo Google Sheets...\n');

  try {
    const diagnostics = await getSheetDiagnostics();
    console.log(JSON.stringify(diagnostics, null, 2));
    return;


  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

debugSheets();
