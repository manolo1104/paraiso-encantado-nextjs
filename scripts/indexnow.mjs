/**
 * Avisa por IndexNow qué páginas del sitio cambiaron, para que Bing (el índice con
 * el que buscan ChatGPT y Copilot) y los demás buscadores del protocolo (Yandex,
 * Seznam, Naver…) las vuelvan a leer en horas y no en semanas. Google NO usa
 * IndexNow: a Google le llegan el <lastmod> del sitemap (app/sitemap.ts) y Search
 * Console.
 *
 * Se corre DESPUÉS de cada despliegue que cambie textos, fotos o JSON-LD, desde la
 * raíz del repo:
 *   node scripts/indexnow.mjs            → ENSAYO: dice qué mandaría; no manda nada
 *   node scripts/indexnow.mjs --enviar   → manda
 *
 * Qué URLs (salen del sitemap de PRODUCCIÓN, no del código local):
 *   (sin opciones)        las del <lastmod> más reciente del sitemap = el último lote
 *   --desde 2026-10-17    las que cambiaron ese día o después
 *   --todas               todas (la primera vez, o tras un cambio en todo el sitio)
 *   <url> <url> …         solo esas (de https://www.paraisoencantado.com)
 * Por eso app/sitemap.ts tiene que llevar fechas reales: si un lote se sube sin
 * cambiar su fecha, aquí sale el lote anterior (el guion avisa si la fecha es vieja).
 *
 * La llave es pública por diseño: el protocolo la pide servida en el propio dominio
 * (public/<llave>.txt → https://www.paraisoencantado.com/<llave>.txt) para probar
 * que el aviso viene del dueño. Antes de mandar se comprueba que producción ya
 * sirve ese archivo: si el despliegue no ha terminado, IndexNow respondería 403.
 * Mandar las mismas URLs sin cambios una y otra vez cuenta como spam (429).
 */
import { readFile } from 'node:fs/promises';

const HOST = 'www.paraisoencantado.com';
const ORIGEN = `https://${HOST}`;
const LLAVE = '6d0b1dd477612baee5a29ad11c55eea8';
const URL_LLAVE = `${ORIGEN}/${LLAVE}.txt`;
const SITEMAP = `${ORIGEN}/sitemap.xml`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_POR_ENVIO = 10_000; // tope del protocolo por petición
const DIAS_PARA_AVISAR = 3;

const RESPUESTAS = {
  200: 'Recibido y llave validada.',
  202: 'Recibido; la llave se está validando (normal la primera vez).',
  400: 'Petición mal formada.',
  403: 'Llave no válida: producción no sirve el archivo de la llave o no coincide.',
  422: 'Alguna URL no es de este host, o la llave no cumple el formato.',
  429: 'Demasiados avisos (posible spam): esperar y mandar solo lo que cambió.',
};

function salir(mensaje) {
  console.error(`✗ ${mensaje}`);
  process.exit(1);
}

// ── Opciones ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--ayuda') || args.includes('-h')) {
  console.log('Uso: node scripts/indexnow.mjs [--enviar] [--todas | --desde AAAA-MM-DD | <url> …]');
  process.exit(0);
}
const enviar = args.includes('--enviar');
const todas = args.includes('--todas');
const iDesde = args.indexOf('--desde');
const desde = iDesde >= 0 ? args[iDesde + 1] : null;
if (iDesde >= 0 && !/^\d{4}-\d{2}-\d{2}$/.test(desde ?? '')) salir('--desde necesita una fecha AAAA-MM-DD');
// Lo que no es opción es una URL (salvo la fecha que va después de --desde).
const sueltas = args.filter((a, i) => !a.startsWith('--') && !(iDesde >= 0 && i === iDesde + 1));
const desconocidas = args.filter((a) => a.startsWith('--') && !['--enviar', '--todas', '--desde'].includes(a));
if (desconocidas.length) salir(`opción desconocida: ${desconocidas.join(' ')}`);
if ([todas, desde !== null, sueltas.length > 0].filter(Boolean).length > 1) {
  salir('usa solo una forma de elegir: --todas, --desde o una lista de URLs');
}
for (const u of sueltas) {
  let ok = false;
  try { ok = new URL(u).protocol === 'https:' && new URL(u).host === HOST; } catch { /* no es URL */ }
  if (!ok) salir(`no es una URL de ${ORIGEN}: ${u}`);
}

// ── La llave local tiene que ser la misma que la de este guion ──────────────
let llaveLocal = '';
try {
  llaveLocal = (await readFile(new URL(`../public/${LLAVE}.txt`, import.meta.url), 'utf8')).trim();
} catch {
  salir(`falta public/${LLAVE}.txt`);
}
if (llaveLocal !== LLAVE) salir(`public/${LLAVE}.txt no contiene la llave`);

// ── Sitemap de producción ───────────────────────────────────────────────────
const desescapar = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&');

async function leerSitemap() {
  const r = await fetch(SITEMAP, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) salir(`el sitemap de producción respondió ${r.status}`);
  const xml = await r.text();
  // <loc> exacto: no confunde el <image:loc> de las fotos.
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map(([, bloque]) => ({
      url: desescapar((bloque.match(/<loc>([^<]+)<\/loc>/) ?? [])[1]?.trim() ?? ''),
      fecha: ((bloque.match(/<lastmod>([^<]+)<\/lastmod>/) ?? [])[1] ?? '').trim().slice(0, 10),
    }))
    .filter((e) => {
      try { return new URL(e.url).host === HOST; } catch { return false; }
    });
}

let entradas;
try {
  entradas = await leerSitemap();
} catch (e) {
  salir(`no se pudo leer ${SITEMAP}: ${e.message}`);
}
if (!entradas.length) salir('el sitemap de producción no trae URLs');

let elegidas;
let motivo;
if (sueltas.length) {
  elegidas = sueltas.map((url) => ({ url, fecha: entradas.find((e) => e.url === url)?.fecha ?? '' }));
  motivo = 'las URLs que pasaste';
  const fuera = elegidas.filter((e) => !entradas.some((s) => s.url === e.url));
  if (fuera.length) console.warn(`⚠ No están en el sitemap (¿error de dedo?): ${fuera.map((e) => e.url).join(', ')}`);
} else if (todas) {
  elegidas = entradas;
  motivo = 'todas las del sitemap';
} else {
  const corte = desde ?? entradas.map((e) => e.fecha).filter(Boolean).sort().at(-1);
  if (!corte) salir('el sitemap no trae <lastmod>: usa --todas o una lista de URLs');
  elegidas = entradas.filter((e) => e.fecha && e.fecha >= corte);
  motivo = desde ? `las que cambiaron desde el ${corte}` : `las del cambio más reciente del sitemap (${corte})`;
  if (!desde) {
    const dias = Math.floor((Date.now() - Date.parse(`${corte}T12:00:00-06:00`)) / 86_400_000);
    if (dias > DIAS_PARA_AVISAR) {
      console.warn(`⚠ El cambio más reciente del sitemap es de hace ${dias} días (${corte}). Si acabas de desplegar ` +
        'cambios de contenido, revisa que app/sitemap.ts lleve su fecha (LOTE) antes de avisar.');
    }
  }
}
if (!elegidas.length) salir(`ninguna URL cumple: ${motivo}`);

console.log(`${elegidas.length} de ${entradas.length} URLs — ${motivo}:`);
for (const e of elegidas) console.log(`  ${e.fecha || '          '}  ${e.url}`);

// ── ¿Producción ya sirve la llave? ──────────────────────────────────────────
let llaveEnProduccion = false;
try {
  const r = await fetch(URL_LLAVE, { signal: AbortSignal.timeout(20_000) });
  llaveEnProduccion = r.ok && (await r.text()).trim() === LLAVE;
} catch { /* se informa abajo */ }
console.log(llaveEnProduccion
  ? `✓ Producción sirve la llave en ${URL_LLAVE}`
  : `✗ Producción todavía NO sirve la llave en ${URL_LLAVE} (¿falta desplegar public/${LLAVE}.txt?)`);

const lotes = [];
for (let i = 0; i < elegidas.length; i += MAX_POR_ENVIO) lotes.push(elegidas.slice(i, i + MAX_POR_ENVIO));
const cuerpo = (lote) => ({ host: HOST, key: LLAVE, keyLocation: URL_LLAVE, urlList: lote.map((e) => e.url) });

if (!enviar) {
  const muestra = cuerpo(lotes[0]);
  console.log('\nENSAYO: no se mandó nada. Esto es lo que se mandaría a', ENDPOINT);
  console.log(JSON.stringify({ ...muestra, urlList: [...muestra.urlList.slice(0, 3), `… (${muestra.urlList.length} en total)`] }, null, 2));
  console.log(`\nPara mandarlo: node scripts/indexnow.mjs --enviar ${args.join(' ')}`.trimEnd());
  process.exit(0);
}

if (!llaveEnProduccion) salir('no se manda nada hasta que producción sirva la llave (IndexNow respondería 403)');

let fallo = false;
for (const lote of lotes) {
  let r;
  try {
    r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(cuerpo(lote)),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    salir(`no se pudo contactar ${ENDPOINT}: ${e.message}`);
  }
  const texto = (await r.text()).trim();
  const explicacion = RESPUESTAS[r.status] ?? 'Respuesta inesperada.';
  console.log(`${r.ok ? '✓' : '✗'} IndexNow ${r.status} con ${lote.length} URLs: ${explicacion}${texto ? `\n  ${texto.slice(0, 300)}` : ''}`);
  if (!r.ok) fallo = true;
}
process.exit(fallo ? 1 : 0);
