import type { MetadataRoute } from 'next';
import { suites } from '@/data/suites';
import { getAllPosts } from '@/lib/blog';

const BASE = 'https://www.paraisoencantado.com';
const SITE_UPDATED = '2026-05-19';

function encodeImgPath(path: string): string {
  return path.split('/').map((s) => encodeURIComponent(s)).join('/');
}

// Un único sitemap servido nativamente en /sitemap.xml.
// (Antes se usaba generateSitemaps() → Next servía /sitemap/0.xml…/2.xml pero
//  NO creaba el índice /sitemap.xml, que robots.txt declara → daba 404.)
// El sitio tiene ~40 URLs, muy por debajo del límite de 50 000 por sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  // ── Páginas estáticas ─────────────────────────────────────────────────────
  const pages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: SITE_UPDATED, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/habitaciones`, lastModified: SITE_UPDATED, changeFrequency: 'weekly', priority: 0.95, images: [`${BASE}/images/JUNGLA/PORTADA.JPG`] },
    { url: `${BASE}/comparar`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.70 },
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

  // ── Habitaciones / suites ─────────────────────────────────────────────────
  const rooms: MetadataRoute.Sitemap = suites.map((suite) => ({
    url: `${BASE}/habitaciones/${suite.id}`,
    lastModified: SITE_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: 0.90,
    images: suite.images.slice(0, 5).map((img) => `${BASE}${encodeImgPath(img)}`),
  }));

  // ── Blog ──────────────────────────────────────────────────────────────────
  const posts = getAllPosts();
  const blog: MetadataRoute.Sitemap = [
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

  return [...pages, ...rooms, ...blog];
}
