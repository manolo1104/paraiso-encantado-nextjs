import type { NextConfig } from 'next';

// ── Mapa de URLs muertas del constructor viejo (GoDaddy) ──────────────────
// El 24 de abril de 2026 se migró el sitio sin redirecciones: 38 rutas se
// quedaron en 404 arrastrando 44,065 impresiones (56.8% del total) y 241
// clics de los últimos 6 meses en Search Console. Cada 301 devuelve esa
// autoridad a la página viva equivalente en vez de tirarla a la basura.
// El orden es por impresiones perdidas (corte del 2026-09-20).
// Las rutas se escriben legibles, CON acentos; expandLegacyRedirects()
// genera además la forma percent-encoded, que es la que pide Google.
const LEGACY_REDIRECTS: Array<[source: string, destination: string]> = [
  // ── Familia /f/ y /blog/f/ del blog viejo — 43,550 impresiones ──────────
  ['/blog/f/cómo-llegar-a-la-huasteca-potosina-y-xilitla-2026',                '/blog/como-llegar-a-xilitla'],          // 18,430 imp · 146 clics
  ['/blog/f/xilitla-más-allá-de-lo-surreal',                                   '/blog/que-hacer-en-xilitla'],           //  4,193 imp ·   6 clics
  ['/f/descubre-la-magia-5-imperdibles-de-la-huasteca-potosina',               '/blog/ruta-maestra-huasteca-potosina'],  //  4,136 imp ·   4 clics
  ['/blog/f/sabores-de-la-huasteca-platillos-que-tienes-que-probar-¿dónde',    '/blog/gastronomia-xilitla-huasteca'],    //  3,633 imp ·  13 clics
  ['/f/cómo-llegar-a-la-huasteca-potosina-y-xilitla-2026',                     '/blog/como-llegar-a-xilitla'],           //  3,257 imp ·  22 clics
  ['/f/sabores-de-la-huasteca-platillos-que-tienes-que-probar-¿dónde',         '/blog/gastronomia-xilitla-huasteca'],    //  2,248 imp ·  13 clics
  ['/f/xilitla-más-allá-de-lo-surreal',                                        '/blog/que-hacer-en-xilitla'],            //  1,755 imp ·  13 clics
  ['/blog/f/exploring-the-wonders-of-xilitla-a-visitors-guide',                '/en'],                                   //  1,308 imp · falta blog en inglés
  ['/f/ruta-maestra-huasteca-potosina-en-6-días-desde-cdmxqro',                '/blog/ruta-maestra-huasteca-potosina'],  //  1,126 imp ·   8 clics
  ['/blog/f/descubre-la-magia-5-imperdibles-de-la-huasteca-potosina',          '/blog/ruta-maestra-huasteca-potosina'],  //  1,008 imp
  ['/f/exploring-the-wonders-of-xilitla-a-visitors-guide',                     '/en'],                                   //    598 imp ·   2 clics
  ['/f/la-huasteca-potosina-guía-definitiva-de-lo-más-instagrameable',         '/blog/comparativa-cascadas-huasteca'],   //    483 imp ·   5 clics
  ['/blog/f/exploring-the-rich-culture-and-nature-of-xilitla',                 '/en'],                                   //    305 imp
  ['/f/top-10-famosos-en-xilitla-desde-estrellas-de-hollywood-hasta-aml',      '/blog/las-pozas-edward-james-guia'],     //    232 imp ·   6 clics
  ['/blog/f/la-huasteca-potosina-guía-definitiva-de-lo-más-instagrameable',    '/blog/comparativa-cascadas-huasteca'],   //    222 imp
  ['/f/exploring-the-rich-culture-and-nature-of-xilitla',                      '/en'],                                   //    169 imp ·   1 clic
  ['/blog/f/top-10-famosos-en-xilitla-desde-estrellas-de-hollywood-hasta-aml', '/blog/las-pozas-edward-james-guia'],     //    169 imp ·   1 clic
  ['/f/5-razones-para-hospedarse-cerca-del-jardín-de-edward-james-2026',       '/hotel-cerca-de-las-pozas'],             //    132 imp
  ['/blog/f/ruta-maestra-huasteca-potosina-en-6-días-desde-cdmxqro',           '/blog/ruta-maestra-huasteca-potosina'],  //     71 imp ·   1 clic
  ['/blog/f/5-razones-para-hospedarse-cerca-del-jardín-de-edward-james-2026',  '/hotel-cerca-de-las-pozas'],             //     62 imp
  ['/f/top-7-reasons-to-visit-xilitla',                                        '/en'],                                   //     13 imp

  // ── Secciones del sitio viejo ───────────────────────────────────────────
  ['/reservas-1',                 '/reservar'],              // 350 imp · posición 4.03 · intención de reserva pura
  ['/m/account',                  '/reservar'],              //  31 imp · panel de cliente de GoDaddy
  ['/galería',                    '/galeria'],               //  25 imp · la viva va sin acento
  ['/testimonios-y-reseñas',      '/reviews'],               //  19 imp · misma sección, renombrada
  ['/reservar-paraíso-encantad',  '/reservar'],              //   5 imp · slug truncado del motor viejo
  ['/recorridos-turísticos',      '/experiencias'],          //   4 imp
  ['/tours',                      '/experiencias'],          //   3 imp
  ['/oferta-empezando-el-año',    '/paquetes'],              //   2 imp · oferta caducada → catálogo vigente
  ['/términos-y-condiciones',     '/terminos-condiciones'],  //   1 imp
  ['/landing-page',               '/reservar'],              //   1 imp · landing genérica de GoDaddy

  // ── Suites con el slug viejo ────────────────────────────────────────────
  // El destino sale del id real de data/suites.ts, no del nombre comercial.
  ['/fdl2-1',         '/habitaciones/flor-de-liz-2'],  // 22 imp · antes apuntaba a flor-de-liS-2, que es 404
  ['/helechos-2',     '/habitaciones/helechos-2'],     // 18 imp
  ['/linda-vista',    '/habitaciones/lindavista'],     // 14 imp
  ['/bromelias-1-1',  '/habitaciones/bromelias'],      //  9 imp
  ['/lajas',          '/habitaciones/lajas'],          //  6 imp
  ['/bromelias-2',    '/habitaciones/bromelias'],      //  3 imp · solo existe una suite Bromelias
  ['/orquideas-king', '/habitaciones'],                //  2 imp · con 2 impresiones no hay señal de cuál Orquídeas era

  // ── Las que ya estaban en el config y se conservan ──────────────────────
  ['/hotel-cerca-las-pozas',          '/hotel-cerca-de-las-pozas'],
  ['/ruta-maestra-huasteca-potosina', '/blog/ruta-maestra-huasteca-potosina'],
];

// Next compara el `source` contra el pathname CRUDO de la petición, que sigue
// percent-encoded (resolve-routes.js: `curPathname = parsedUrl.pathname` y
// luego `route.match(curPathname)` sin decodificar). Google nunca pide
// /f/cómo-llegar…, pide /f/c%C3%B3mo-llegar…, así que una regla escrita solo
// con acentos no dispararía jamás. Por eso registramos las dos formas.
function expandLegacyRedirects() {
  return LEGACY_REDIRECTS.flatMap(([source, destination]) => {
    const encoded = source.split('/').map(encodeURIComponent).join('/');
    const rules = [{ source, destination, permanent: true as const }];
    if (encoded !== source) {
      rules.push({ source: encoded, destination, permanent: true as const });
    }
    return rules;
  });
}

const nextConfig: NextConfig = {
  // Evita que webpack intente bundlear módulos de Node.js para el cliente
  serverExternalPackages: ['gray-matter', 'next-mdx-remote'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'booking-paraisoencantado.up.railway.app',
      },
      // Miniaturas de videos de YouTube (galería)
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
    // AVIF primero → ~40% más pequeño que WebP; fallback WebP para browsers viejos
    formats: ['image/avif', 'image/webp'],
    // Cache de imágenes optimizadas: 30 días (default es 60s)
    minimumCacheTTL: 2592000,
  },

  compress: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 60,

  async redirects() {
    return [
      // URLs legacy del sitio anterior — consolidan autoridad SEO
      ...expandLegacyRedirects(),

      // Red de seguridad: cualquier otra URL del blog viejo que no esté en la
      // lista de arriba (Google guarda slugs que ni siquiera aparecen en el
      // informe) aterriza en el blog nuevo en vez de dar 404. El patrón es
      // ASCII puro, así que matchea venga acentuado o percent-encoded.
      // VA AL FINAL a propósito: Next aplica la primera regla que matchea, y
      // si esto estuviera arriba se tragaría las 21 reglas buenas del blog.
      { source: '/f/:path*', destination: '/blog', permanent: true },
      { source: '/blog/f/:path*', destination: '/blog', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      // Cache agresivo para imágenes estáticas (1 año)
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
