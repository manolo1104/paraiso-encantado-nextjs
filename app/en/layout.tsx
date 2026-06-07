import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hotel Paraíso Encantado | Boutique Hotel near Edward James Garden · Xilitla, Mexico',
  description:
    '13 boutique suites with private spa, 5 min walk from Las Pozas (Edward James Garden). Closest hotel in Xilitla, Huasteca Potosina. Book direct from $80/night.',
  keywords: [
    'hotel near edward james garden',
    'hotel las pozas xilitla',
    'boutique hotel xilitla mexico',
    'huasteca potosina hotel english',
    'edward james surrealist garden hotel',
    'xilitla accommodation',
    'san luis potosí boutique hotel',
    'hotel near las pozas',
    'mexico surrealist garden hotel',
  ],
  alternates: {
    canonical: 'https://www.paraisoencantado.com/en',
    languages: {
      'es': 'https://www.paraisoencantado.com',
      'en': 'https://www.paraisoencantado.com/en',
      'x-default': 'https://www.paraisoencantado.com',
    },
  },
  openGraph: {
    siteName: 'Hotel Paraíso Encantado',
    title: 'Hotel Paraíso Encantado | Xilitla, Mexico — Boutique Hotel near Las Pozas',
    description:
      '13 boutique suites with private spa, 5 min walk from the Edward James Surrealist Garden. Direct booking, no commissions.',
    locale: 'en_US',
    type: 'website',
    url: 'https://www.paraisoencantado.com/en',
    images: [
      {
        url: 'https://www.paraisoencantado.com/og/home.jpg',
        width: 1200,
        height: 630,
        alt: 'Hotel Paraíso Encantado — boutique hotel near the Edward James Garden, Xilitla, Mexico',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.paraisoencantado.com/og/home.jpg'],
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
