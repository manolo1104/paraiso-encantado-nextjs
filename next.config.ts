import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
