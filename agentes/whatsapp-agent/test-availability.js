#!/usr/bin/env node
/**
 * test-availability.js
 * Verifica que el bot está leyendo correctamente las disponibilidades del Google Sheets
 */

import 'dotenv/config';
import { getUnavailableRoomsFromGoogleSheet } from './google-sheets.js';
import { ROOMS } from './hotel-knowledge.js';

async function testAvailability() {
  console.log('🔍 TEST: Verificando disponibilidad para 2 de mayo de 2026...\n');

  const checkin = '2026-05-02';
  const checkout = '2026-05-03';
  const requestedRooms = ROOMS;

  console.log(`📅 Check-in: ${checkin}`);
  console.log(`📅 Check-out: ${checkout}`);
  console.log(`🏨 Habitaciones a verificar: ${requestedRooms.length}\n`);

  try {
    const result = await getUnavailableRoomsFromGoogleSheet({
      checkin,
      checkout,
      requestedRooms
    });

    console.log('✅ Google Sheets conectado correctamente\n');
    console.log(`📊 Resultado:`);
    console.log(`   • Total filas en sheet: ${result.totalRows}`);
    console.log(`   • Reservaciones/bloqueos analizados: ${result.reservationsChecked}`);
    console.log(`   • Habitaciones NO disponibles: ${result.unavailableRooms.length}\n`);

    if (result.unavailableRooms.length > 0) {
      console.log('🚫 Habitaciones OCUPADAS para esas fechas:');
      result.unavailableRooms.forEach(room => {
        console.log(`   - ${room.name} (${room.id})`);
      });
    } else {
      console.log('✅ TODAS las habitaciones están disponibles para esas fechas');
    }

    console.log('\n📋 Disponibles:');
    const available = ROOMS.filter(r => !result.unavailableRooms.find(ur => ur.id === r.id));
    available.forEach(room => {
      console.log(`   ✅ ${room.name} - $${room.price_2.toLocaleString('es-MX')} (2 personas)`);
    });

  } catch (err) {
    console.error('❌ ERROR conectando Google Sheets:');
    console.error(`   ${err.message}\n`);
    console.error('🔧 Verifica:');
    console.error('   1. GOOGLE_SHEET_ID está configurado en .env');
    console.error('   2. GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY están en .env');
    console.error('   3. El tab de reservaciones existe en el Google Sheets');
    console.error('   4. El bot tiene permisos para leer el sheet\n');
  }
}

testAvailability();
