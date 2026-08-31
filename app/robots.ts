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
      {
        // Bots de los buscadores con IA, nombrados uno por uno.
        //
        // El comodín de arriba ya los dejaba pasar, pero varios crawlers, al
        // encontrar un grupo con su propio nombre, ignoran el de `*` por
        // completo. Declararlos explícitamente quita esa ambigüedad y deja por
        // escrito la decisión del hotel: SÍ queremos que ChatGPT, Perplexity,
        // Claude, Gemini y Copilot puedan leer y citar el sitio. Bloquearlos
        // ahorraría tráfico de rastreo, pero también haría imposible que nos
        // citen — y hoy una parte de los huéspedes pregunta a un asistente
        // antes que a Google.
        userAgent: [
          'GPTBot',          // OpenAI — indexación para ChatGPT
          'OAI-SearchBot',   // OpenAI — búsqueda de ChatGPT
          'ChatGPT-User',    // OpenAI — visita en vivo cuando un usuario pregunta
          'PerplexityBot',
          'Perplexity-User',
          'ClaudeBot',       // Anthropic
          'Claude-Web',
          'anthropic-ai',
          'Google-Extended', // Gemini y las respuestas con IA de Google
          'Applebot-Extended',
          'meta-externalagent',
          'Bingbot',         // Copilot va por el índice de Bing
        ],
        allow: '/',
        disallow: ['/admin', '/api/', '/reservar/checkout', '/reservar/confirmacion'],
      },
    ],
    sitemap: 'https://www.paraisoencantado.com/sitemap.xml',
    host: 'https://www.paraisoencantado.com',
  };
}
