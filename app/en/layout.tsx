import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hotel Paraíso Encantado | Boutique Hotel near Edward James Garden · Xilitla, Mexico',
  description:
    '13 boutique suites with private spa 5 minutes walk from Edward James Surrealist Garden (Las Pozas). The closest hotel to Las Pozas in Xilitla, Huasteca Potosina, Mexico. Book directly from $80/night.',
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
    title: 'Hotel Paraíso Encantado | Xilitla, Mexico — Boutique Hotel near Las Pozas',
    description:
      '13 boutique suites with private spa, 5 min walk from the Edward James Surrealist Garden. Direct booking, no commissions.',
    locale: 'en_US',
    type: 'website',
    url: 'https://www.paraisoencantado.com/en',
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
