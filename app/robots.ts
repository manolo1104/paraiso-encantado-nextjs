import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Todos los crawlers: acceso general
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',          // panel de administración
          '/api/',           // endpoints internos
          '/reservar/checkout',    // página de pago — noindex también en layout
          '/reservar/confirmacion', // confirmación post-pago
        ],
      },
      {
        // Googlebot: acceso completo a contenido público
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: 'https://www.paraisoencantado.com/sitemap.xml',
    host: 'https://www.paraisoencantado.com',
  };
}
