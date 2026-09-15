/**
 * Genera los íconos PNG de los correos a partir de Lucide (la misma familia de
 * íconos del sitio). Los correos no usan emojis ni SVG: Gmail y Outlook no
 * muestran SVG y cada cliente pinta los emojis distinto.
 *
 * Uso: node scripts/generar-iconos-correo.mjs  →  public/email/iconos/<nombre>.png
 * Se renderizan a 3× (72 px) y el correo los muestra a 18–24 px.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const ICONOS = ['coffee', 'shield-check', 'clock', 'map-pin', 'leaf', 'phone', 'id-card', 'mail'];
const COLOR = '#8a6830'; // dorado de los enlaces de los correos
const SALIDA = new URL('../public/email/iconos/', import.meta.url);

await mkdir(SALIDA, { recursive: true });
for (const nombre of ICONOS) {
  const { __iconNode } = await import(`lucide-react/dist/esm/icons/${nombre}.js`);
  const hijos = __iconNode
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="${COLOR}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${hijos}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(new URL(`${nombre}.png`, SALIDA).pathname);
  console.log(`✓ ${nombre}.png`);
}
