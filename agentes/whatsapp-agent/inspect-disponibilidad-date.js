#!/usr/bin/env node
import 'dotenv/config';
import { getRawSheetTabValues } from './google-sheets.js';

function parseDateValue(value = '') {
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return null;
}

async function main() {
  const target = process.argv[2] || '2026-04-17';
  const values = await getRawSheetTabValues('Disponibilidad');
  const headers = values[0] || [];
  const rows = values.slice(1);

  const row = rows.find(r => parseDateValue(r[0]) === target);
  if (!row) {
    console.log(`No existe fila para ${target}`);
    return;
  }

  const blocked = [];
  const all = [];

  for (let i = 1; i < headers.length; i++) {
    const roomName = String(headers[i] || '').trim();
    if (!roomName) continue;
    const status = String(row[i] || '').trim();
    if (!status) {
      all.push({ roomName, status: '(vacío)' });
      continue;
    }
    all.push({ roomName, status });
    if (/(reserv|bloque|ocup|apart)/i.test(status)) blocked.push(roomName);
  }

  console.log(`Fecha: ${target}`);
  console.log(`Total habitaciones en columnas: ${all.length}`);
  console.log(`Bloqueadas/ocupadas por matriz: ${blocked.length}`);
  console.log(`Disponibles calculadas: ${all.length - blocked.length}`);
  console.log('\nBloqueadas:');
  console.log(blocked.length ? blocked.join('\n') : '(ninguna)');

  console.log('\nEstados por habitación:');
  for (const item of all) {
    console.log(`- ${item.roomName}: ${item.status}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
