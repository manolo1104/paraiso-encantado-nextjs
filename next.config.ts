import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Evita que webpack intente bundlear módulos de Node.js para el cliente
  serverExternalPackages: ['gray-matter'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'booking-paraisoencantado.up.railway.app',
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
      // URLs legacy de versión anterior del sitio — consolidan autoridad SEO
      { source: '/fdl2-1', destination: '/habitaciones/flor-de-lis-2', permanent: true },
      { source: '/helechos-2', destination: '/habitaciones/helechos-2', permanent: true },
      // Variante de URL sin guión "de" — misma landing
      { source: '/hotel-cerca-las-pozas', destination: '/hotel-cerca-de-las-pozas', permanent: true },
      // URL indexada en Google como 404 → artículo del blog
      { source: '/ruta-maestra-huasteca-potosina', destination: '/blog/ruta-maestra-huasteca-potosina', permanent: true },
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
