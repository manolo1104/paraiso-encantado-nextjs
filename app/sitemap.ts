import type { MetadataRoute } from 'next';
import { suites } from '@/data/suites';
import { getAllPosts } from '@/lib/blog';

const BASE = 'https://www.paraisoencantado.com';
const SITE_UPDATED = '2026-05-19';
// Nuevas páginas añadidas en esta sesión
const NEW_PAGES = ['2026-05-19'];

function encodeImgPath(path: string): string {
  return path.split('/').map((s) => encodeURIComponent(s)).join('/');
}

// generateSitemaps → Next.js crea sitemap-index en /sitemap.xml
// + sitemaps individuales en /sitemap/0 (pages), /sitemap/1 (rooms), /sitemap/2 (blog)
export function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

export default function sitemap({ id }: { id: number }): MetadataRoute.Sitemap {
  // ── SITEMAP 0: Páginas estáticas ──────────────────────────────────────────────
  if (id === 0) {
    return [
      { url: BASE, lastModified: SITE_UPDATED, changeFrequency: 'weekly', priority: 1.0 },
      { url: `${BASE}/habitaciones`, lastModified: SITE_UPDATED, changeFrequency: 'weekly', priority: 0.95, images: [`${BASE}/images/JUNGLA/PORTADA.JPG`] },
      { url: `${BASE}/restaurante`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.85, images: [`${BASE}/images/RESTAURANTE/sirviendo-zacahuil.webp`] },
      { url: `${BASE}/experiencias`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.85, images: [`${BASE}/images/atracciones/cascada_de_tamul.jpg`] },
      { url: `${BASE}/paquetes`, lastModified: SITE_UPDATED, changeFrequency: 'weekly', priority: 0.88, images: [`${BASE}/images/FLOR%20DE%20LIS%201/PORTADA.jpg`] },
      { url: `${BASE}/grupos-eventos`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.80, images: [`${BASE}/images/Areas%20comunes/DSC09456-HDR.jpg`] },
      { url: `${BASE}/galeria`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.75, images: [`${BASE}/images/Areas%20comunes/DSC09456-HDR.jpg`, `${BASE}/images/JUNGLA/PORTADA.JPG`, `${BASE}/images/atracciones/jardin-edward-james-aerial.png`] },
      { url: `${BASE}/hotel-luna-de-miel-xilitla`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.82, images: [`${BASE}/images/LINDAVISTA/PORTADA.jpg`] },
      { url: `${BASE}/hotel-familias-xilitla`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.82, images: [`${BASE}/images/HELECHOS%201/PORTADA.jpg`] },
      { url: `${BASE}/hotel-cerca-de-las-pozas`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.85, images: [`${BASE}/images/atracciones/ruta-surrealista-pozas.png`] },
      { url: `${BASE}/xilitla`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.80, images: [`${BASE}/images/atracciones/jardin-edward-james-aerial.png`] },
      { url: `${BASE}/sobre-nosotros`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.65 },
      { url: `${BASE}/reviews`, lastModified: SITE_UPDATED, changeFrequency: 'weekly', priority: 0.75 },
      { url: `${BASE}/contacto`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.60 },
      // Versión en inglés con hreflang ya declarado en HTML <head> vía metadata.alternates
      { url: `${BASE}/en`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.75, images: [`${BASE}/images/JUNGLA/PORTADA.JPG`] },
      // Legales
      { url: `${BASE}/politica-privacidad`, lastModified: SITE_UPDATED, changeFrequency: 'yearly', priority: 0.20 },
      { url: `${BASE}/politica-cancelacion`, lastModified: SITE_UPDATED, changeFrequency: 'yearly', priority: 0.20 },
      { url: `${BASE}/terminos-condiciones`, lastModified: SITE_UPDATED, changeFrequency: 'yearly', priority: 0.20 },
      { url: `${BASE}/reservar`, lastModified: SITE_UPDATED, changeFrequency: 'weekly', priority: 0.90 },
    ];
  }

  // ── SITEMAP 1: Habitaciones / suites ─────────────────────────────────────────
  if (id === 1) {
    return suites.map((suite) => ({
      url: `${BASE}/habitaciones/${suite.id}`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.90,
      images: suite.images.slice(0, 5).map((img) => `${BASE}${encodeImgPath(img)}`),
    }));
  }

  // ── SITEMAP 2: Blog ──────────────────────────────────────────────────────────
  const posts = getAllPosts();
  return [
    {
      url: `${BASE}/blog`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'weekly' as const,
      priority: 0.80,
    },
    ...posts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: (post.dateModified ?? post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
      images: post.image ? [`${BASE}${post.image}`] : undefined,
    })),
  ];
}
