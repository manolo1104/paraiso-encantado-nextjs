import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remote image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "booking-paraisoencantado.up.railway.app",
      },
    ],
  },

  // Compresión gzip
  compress: true,

  // Poweredby header remover
  poweredByHeader: false,

  // Generación estática
  staticPageGenerationTimeout: 60,

  // Experimental
  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
  },

  // Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/habitacion/:id",
        destination: "/habitaciones/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
