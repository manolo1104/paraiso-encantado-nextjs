import type { MetadataRoute } from 'next';
import { suites } from '@/data/suites';

const BASE = 'https://www.paraisoencantado.com';

// Fecha de última modificación significativa del sitio
const SITE_UPDATED = '2026-05-16';

export default function sitemap(): MetadataRoute.Sitemap {
  // ── Páginas estáticas ────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: SITE_UPDATED,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/habitaciones`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'weekly',
      priority: 0.95,
      // Google Images: imagen representativa de la sección
      images: [`${BASE}/images/JUNGLA/PORTADA.JPG`],
    },
    {
      url: `${BASE}/restaurante`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.85,
      images: [`${BASE}/images/RESTAURANTE/sirviendo-zacahuil.webp`],
    },
    {
      url: `${BASE}/experiencias`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.85,
      images: [`${BASE}/images/atracciones/cascada_de_tamul.jpg`],
    },
    {
      url: `${BASE}/galeria`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.75,
      images: [
        `${BASE}/images/Areas comunes/DSC09456-HDR.jpg`,
        `${BASE}/images/JUNGLA/PORTADA.JPG`,
        `${BASE}/images/atracciones/jardin-edward-james-aerial.png`,
      ],
    },
    {
      url: `${BASE}/sobre-nosotros`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${BASE}/contacto`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.60,
    },
    {
      url: `${BASE}/en`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.75,
      images: [`${BASE}/images/JUNGLA/PORTADA.JPG`],
    },
    // Páginas legales — baja prioridad
    {
      url: `${BASE}/politica-privacidad`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.20,
    },
    {
      url: `${BASE}/politica-cancelacion`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.20,
    },
    {
      url: `${BASE}/terminos-condiciones`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.20,
    },
  ];

  // ── Páginas individuales de suites (dinámicas) ───────────────────────────────
  const suitePages: MetadataRoute.Sitemap = suites.map((suite) => ({
    url: `${BASE}/habitaciones/${suite.id}`,
    lastModified: SITE_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: 0.90,
    // Google Images: todas las fotos de la suite para indexación de imágenes
    images: suite.images
      .slice(0, 5) // máx 5 imágenes por URL en sitemap
      .map((img) => `${BASE}${img}`),
  }));

  return [...staticPages, ...suitePages];
}
