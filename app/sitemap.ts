import type { MetadataRoute } from 'next';
import { suites } from '@/data/suites';
import { getAllPosts } from '@/lib/blog';

const BASE = 'https://www.paraisoencantado.com';

// ── lastmod: la fecha del último cambio REAL de cada página ───────────────────
// Google y Bing (el índice con el que busca ChatGPT) usan <lastmod> para decidir
// qué volver a leer, y dejan de creerle a un sitemap cuyas fechas no cuadran con
// la página. Hasta el 17 oct 2026 aquí había dos fechas fijas para todo el sitio
// ('2026-05-19' y '2026-08-31') y 38 de 53 URLs llevaban una fecha que no era la
// de su último cambio: /hotel-cerca-de-las-pozas, reescrita el 2 oct, decía 19 may.
//
// REGLA: el cambio que toca el texto, las fotos o el JSON-LD de una página cambia
// aquí su fecha, en el mismo commit. Los estilos no cuentan, y el pie de página
// tampoco (sale igual en todas). Nunca la fecha del build: diría que todo cambia
// en cada despliegue y los buscadores dejarían de hacerle caso.
// Fechas de git (`git log -1 --format=%cs -- <archivos de la página>`).

// 🔴 Fecha del lote de cambios de la copia del 16-17 oct 2026 (hospedaje, Las
// Pozas, datos del hotel, precios). Si el lote sale a producción OTRO día, poner
// aquí ese día: un lastmod anterior a la última visita del robot le dice «no
// cambió» y no vuelve a leer la página. Y cambiar a la vez las fechas escritas a
// mano que dicen lo mismo: `dateModified` del WebPage de app/xilitla/page.tsx,
// `MODIFICADA` de app/mejor-hotel-xilitla/page.tsx y el `dateModified` de los
// artículos tocados en el lote (xantolo-en-xilitla y xilitla-con-ninos).
const LOTE = '2026-10-19';

// 🔴 Segundo lote (copia del 19 oct, salió el 20 oct 2026): Xantolo con el programa
// oficial, boletos de Las Pozas verificados, /en/las-pozas, enlaces a la guía,
// suites sin precio en el título y fuentes de /xilitla. Solo lo llevan las páginas
// cuyo texto cambió en ese lote; las demás se quedan con LOTE. Va de la mano con el
// `dateModified` de app/xilitla/page.tsx, `MODIFICADA` de mejor-hotel-xilitla, las
// fechas de app/en/las-pozas y el `dateModified` de los 7 artículos tocados.
const LOTE_2 = '2026-10-20';

const LASTMOD = {
  '/': LOTE_2,
  // f72d074. El calendario de fechas cambió el 12 oct y en este lote, pero es la
  // ventana que se abre en el navegador, no el texto de la página.
  '/habitaciones': '2026-10-02',
  '/comparar': '2026-10-08',                     // 91f3855; nada en este lote
  '/restaurante': LOTE,
  '/experiencias': LOTE,
  '/paquetes': LOTE,
  '/grupos-eventos': LOTE,
  '/galeria': LOTE,                              // fuera las fotos de Las Pozas hechas con IA
  '/hotel-luna-de-miel-xilitla': LOTE_2,
  '/hotel-familias-xilitla': LOTE,
  '/hotel-cerca-de-las-pozas': LOTE_2,
  '/mejor-hotel-xilitla': LOTE_2,
  '/mejor-hotel-huasteca-potosina': LOTE,
  '/hoteles-en-xilitla': LOTE_2,
  '/donde-hospedarse-huasteca-potosina': LOTE,
  '/hotel-alberca-privada-xilitla': LOTE,
  // El texto es del 2 oct; el JSON-LD del hotel (lodgingSchema) cambió en este lote.
  '/que-hacer-huasteca-potosina-3-dias': LOTE,
  '/xilitla': LOTE_2,
  '/sobre-nosotros': LOTE,
  '/reviews': LOTE,
  '/contacto': LOTE,
  '/en': LOTE_2,
  '/en/las-pozas': LOTE_2,                       // nueva (20 oct 2026)
  '/reservar': LOTE,
  // El índice del blog: esta fecha o la del artículo más nuevo, la que sea mayor.
  '/blog': LOTE,
  // Plantilla de las 13 suites (app/habitaciones/[id]/page.tsx).
  '/habitaciones/[id]': LOTE_2,
} as const;

type Ruta = Exclude<keyof typeof LASTMOD, '/habitaciones/[id]'>;

// Una imagen de public/ como URL absoluta, con cada tramo codificado (hay
// carpetas con espacios: «Areas comunes», «FLOR DE LIS 1»). Next escribe el
// texto tal cual dentro de <image:loc>, sin escaparlo.
function img(ruta: string): string {
  return BASE + ruta.split('/').map((s) => encodeURIComponent(s)).join('/');
}

// Foto real de Las Pozas (CC0, Wikimedia Commons; oct 2026). Sustituye en el
// sitemap a jardin-edward-james-aerial.png y ruta-surrealista-pozas.png, hechas
// con IA y con la estrella de Gemini: ninguna página las usa ya y no se mandan a
// Google Imágenes. Cada imagen de abajo la usa el código de su página y existe
// en public/ (comprobado el 17 oct); si una página cambia de foto, cambiarla aquí.
const FOTO_LAS_POZAS = '/images/las-pozas/columnas-las-pozas-edward-james-xilitla.jpg';

type Frecuencia = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

function pagina(
  ruta: Ruta,
  prioridad: number,
  frecuencia: Frecuencia,
  imagenes: string[] = [],
): MetadataRoute.Sitemap[number] {
  return {
    url: ruta === '/' ? BASE : `${BASE}${ruta}`,
    lastModified: LASTMOD[ruta],
    changeFrequency: frecuencia,
    priority: prioridad,
    ...(imagenes.length ? { images: imagenes.map(img) } : {}),
  };
}

// Un único sitemap servido nativamente en /sitemap.xml.
// (Antes se usaba generateSitemaps() → Next servía /sitemap/0.xml…/2.xml pero
//  NO creaba el índice /sitemap.xml, que robots.txt declara → daba 404.)
// El sitio tiene ~50 URLs, muy por debajo del límite de 50 000 por sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  // ── Páginas estáticas ─────────────────────────────────────────────────────
  const pages: MetadataRoute.Sitemap = [
    pagina('/', 1.0, 'weekly'),
    pagina('/habitaciones', 0.95, 'weekly', ['/images/JUNGLA/PORTADA.JPG']),
    pagina('/comparar', 0.70, 'monthly'),
    pagina('/restaurante', 0.85, 'monthly', ['/images/RESTAURANTE/sirviendo-zacahuil.webp']),
    pagina('/experiencias', 0.85, 'monthly', ['/images/atracciones/cascada_de_tamul.jpg']),
    pagina('/paquetes', 0.88, 'weekly', ['/images/FLOR DE LIS 1/PORTADA.jpg']),
    pagina('/grupos-eventos', 0.80, 'monthly', ['/images/Areas comunes/DSC09456-HDR.jpg']),
    pagina('/galeria', 0.75, 'monthly', ['/images/Areas comunes/DSC09456-HDR.jpg', '/images/JUNGLA/PORTADA.JPG', FOTO_LAS_POZAS]),
    pagina('/hotel-luna-de-miel-xilitla', 0.82, 'monthly', ['/images/LINDAVISTA/PORTADA.jpg']),
    pagina('/hotel-familias-xilitla', 0.82, 'monthly', ['/images/HELECHOS 1/PORTADA.jpg']),
    pagina('/hotel-cerca-de-las-pozas', 0.85, 'monthly', [FOTO_LAS_POZAS]),
    // Landings SEO de posicionamiento regional (ago 2026)
    pagina('/mejor-hotel-xilitla', 0.93, 'monthly', ['/images/JUNGLA/PORTADA.JPG']),
    pagina('/mejor-hotel-huasteca-potosina', 0.92, 'monthly', ['/images/JUNGLA/PORTADA.JPG']),
    pagina('/hoteles-en-xilitla', 0.88, 'monthly', ['/images/Areas comunes/DSC09456-HDR.jpg']),
    pagina('/donde-hospedarse-huasteca-potosina', 0.86, 'monthly', [FOTO_LAS_POZAS]),
    pagina('/hotel-alberca-privada-xilitla', 0.86, 'monthly', ['/images/JUNGLA/PORTADA.JPG']),
    pagina('/que-hacer-huasteca-potosina-3-dias', 0.84, 'monthly', ['/images/atracciones/cascada_de_tamul.jpg']),
    // /xilitla es la guía principal de «qué hacer en Xilitla» desde oct 2026 (absorbió
    // /blog/que-hacer-en-xilitla con un 301).
    pagina('/xilitla', 0.88, 'monthly', [FOTO_LAS_POZAS]),
    pagina('/sobre-nosotros', 0.65, 'monthly'),
    pagina('/reviews', 0.75, 'weekly'),
    pagina('/contacto', 0.60, 'monthly'),
    // Versión en inglés: hreflang es/en en metadata.alternates de / y de /en.
    pagina('/en', 0.75, 'monthly', ['/images/JUNGLA/PORTADA.JPG']),
    // Guía de Las Pozas en inglés; hreflang recíproco con la guía en español.
    pagina('/en/las-pozas', 0.75, 'monthly', [FOTO_LAS_POZAS]),
    pagina('/reservar', 0.90, 'weekly'),
    // FUERA desde el 17 oct 2026: /politica-privacidad, /politica-cancelacion y
    // /terminos-condiciones. Llevan robots noindex, y el sitemap no debe pedir que
    // se indexe lo que la propia página prohíbe (Search Console lo marca como
    // «Enviada pero marcada como noindex»). Se siguen rastreando por los enlaces.
  ];

  // ── Habitaciones / suites ─────────────────────────────────────────────────
  const rooms: MetadataRoute.Sitemap = suites.map((suite) => ({
    url: `${BASE}/habitaciones/${suite.id}`,
    lastModified: LASTMOD['/habitaciones/[id]'],
    changeFrequency: 'monthly' as const,
    priority: 0.90,
    images: suite.images.slice(0, 5).map(img),
  }));

  // ── Blog ──────────────────────────────────────────────────────────────────
  // Cada artículo lleva la fecha de su frontmatter (dateModified, o date si nunca
  // cambió): la misma que enseña «Actualizado el …» y que declara su JSON-LD.
  const posts = getAllPosts();
  const fechaDe = (post: (typeof posts)[number]) => post.dateModified ?? post.date;
  const masNueva = posts.map(fechaDe).reduce<string>((max, f) => (f > max ? f : max), LASTMOD['/blog']);
  const blog: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/blog`,
      // El índice cambia cuando cambia cualquier artículo (enseña sus fechas).
      lastModified: masNueva,
      changeFrequency: 'weekly' as const,
      priority: 0.80,
    },
    ...posts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: fechaDe(post),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
      images: post.image ? [img(post.image)] : undefined,
    })),
  ];

  return [...pages, ...rooms, ...blog];
}
