// Server component — exporta metadata para todas las subrutas de /reservar.
// Las páginas usan 'use client', por eso la metadata va en el layout.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reservar Suite | Paraíso Encantado · Desde $1,200 MXN/noche sin comisiones',
  description:
    'Reserva directa sin comisiones desde $1,200 MXN/noche. 13 suites boutique con spa privado en Xilitla, Huasteca Potosina. Confirmación instantánea, cancelación gratuita hasta 48h.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/reservar',
  },
  openGraph: {
    title: 'Reservar Suite | Paraíso Encantado · Xilitla',
    description:
      'Reserva directa desde $1,200 MXN/noche. 13 suites con spa privado a 5 min del Jardín de Edward James. Sin comisiones de intermediarios.',
    url: 'https://www.paraisoencantado.com/reservar',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/JUNGLA/PORTADA.JPG',
        width: 1200,
        height: 800,
        alt: 'Suite Jungla — Hotel Paraíso Encantado, Xilitla',
      },
    ],
  },
};

// Schema Offer vinculado a las suites — permite precios en rich snippets de Google
const reservaSchema = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Hotel Paraíso Encantado',
  url: 'https://www.paraisoencantado.com',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Suites boutique — reserva directa',
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Suite con Spa Privado — desde $1,900 MXN/noche',
        description: 'Suites Jungla, Flor de Lis 1 & 2 con piscina spa privada al aire libre. Vista a la selva y montaña.',
        price: '1900',
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
        url: 'https://www.paraisoencantado.com/reservar',
        seller: { '@type': 'Organization', name: 'Hotel Paraíso Encantado' },
      },
      {
        '@type': 'Offer',
        name: 'Suites Estándar — desde $1,500 MXN/noche',
        description: 'Lirios, Orquídeas, Bromelias — suites boutique con terraza y jardín en Xilitla.',
        price: '1500',
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
        url: 'https://www.paraisoencantado.com/reservar',
        seller: { '@type': 'Organization', name: 'Hotel Paraíso Encantado' },
      },
      {
        '@type': 'Offer',
        name: 'Suites Familiares Helechos — desde $1,900 MXN/noche',
        description: 'Helechos 1 y 2 para grupos de hasta 8 personas. Ideal para familias y eventos privados en la Huasteca.',
        price: '1900',
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
        url: 'https://www.paraisoencantado.com/reservar',
        seller: { '@type': 'Organization', name: 'Hotel Paraíso Encantado' },
      },
    ],
  },
};

export default function ReservarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reservaSchema) }}
      />
      {children}
    </>
  );
}
