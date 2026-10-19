import type { Metadata } from 'next';

/**
 * Solo lo que comparten TODAS las páginas en inglés (17 oct 2026).
 *
 * El title, la descripción, el canonical y los hreflang de /en se mudaron a
 * app/en/page.tsx. Aquí se heredaban: cualquier página nueva /en/* que no declarara
 * los suyos habría salido con canonical a /en (y Google no la habría indexado como
 * página propia). Cada página en inglés declara los suyos.
 *
 * Ojo: si una página define su propio `openGraph`, Next lo usa ENTERO y no lo mezcla
 * con este; por eso /en repite siteName y locale en el suyo.
 */
export const metadata: Metadata = {
  openGraph: {
    siteName: 'Hotel Paraíso Encantado',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
