/**
 * compress-images.mjs
 * Comprime PORTADA images de suites y PNGs grandes al tamaño máximo de display.
 * Reemplaza los originales in-place. Usar solo una vez (o cuando se agreguen imágenes nuevas).
 *
 * Uso: node scripts/compress-images.mjs
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

const PUBLIC = new URL('../public/images', import.meta.url).pathname;
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1280;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;
const MIN_SAVINGS_BYTES = 50_000; // solo reemplaza si ahorra >50KB

async function findTargets(dir) {
  const targets = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      targets.push(...(await findTargets(full)));
    } else {
      const ext = extname(entry.name).toLowerCase();
      const isPortada = entry.name.toLowerCase().startsWith('portada');
      const isLargePng = ext === '.png';
      if (isPortada || isLargePng) {
        const { size } = await stat(full);
        if (size > 400_000) targets.push({ full, ext, size });
      }
    }
  }
  return targets;
}

async function compress(file) {
  const { full, ext, size } = file;
  const isJpeg = ext === '.jpg' || ext === '.jpeg' || ext === '.JPG' || ext === '.JPEG';
  const isPng = ext === '.png' || ext === '.PNG';

  const img = sharp(full).resize(MAX_WIDTH, MAX_HEIGHT, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  let buf;
  if (isJpeg) {
    buf = await img.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  } else if (isPng) {
    buf = await img.png({ quality: PNG_QUALITY, compressionLevel: 9 }).toBuffer();
  } else {
    return null;
  }

  const savings = size - buf.length;
  if (savings < MIN_SAVINGS_BYTES) {
    console.log(`  SKIP   ${full.replace(PUBLIC, '')} (solo ${(savings / 1024).toFixed(0)} KB de ahorro)`);
    return null;
  }

  const { writeFile } = await import('fs/promises');
  await writeFile(full, buf);
  console.log(`  ✓ ${full.replace(PUBLIC, '')}  ${(size / 1024).toFixed(0)} KB → ${(buf.length / 1024).toFixed(0)} KB  (−${(savings / 1024).toFixed(0)} KB)`);
  return savings;
}

async function main() {
  console.log('Buscando imágenes a comprimir...\n');
  const targets = await findTargets(PUBLIC);
  console.log(`${targets.length} archivos encontrados.\n`);

  let totalSaved = 0;
  for (const t of targets) {
    const saved = await compress(t);
    if (saved) totalSaved += saved;
  }

  console.log(`\nAhorro total: ${(totalSaved / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(console.error);
