// Server component — exporta metadata para todas las subrutas de /reservar.
// Las páginas usan 'use client', por eso la metadata va en el layout.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Era el título más ancho del sitio (716 px): se cortaba justo donde estaba
  // el precio. Ahora cabe entero y el precio queda del lado visible.
  title: 'Reservar Hotel en Xilitla sin comisiones · Desde $1,500',
  description:
    'Elige fechas y suite y confirma al instante, sin comisión de agencia. Cancelación con 100% de reembolso hasta 7 días antes. Xilitla, Huasteca Potosina.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/reservar',
  },
  openGraph: {
    title: 'Reservar Suite | Paraíso Encantado · Xilitla',
    description:
      'Reserva directa desde $1,500 MXN/noche. 13 suites boutique, 4 con spa privado a 5 min del Jardín de Edward James. Sin comisiones de intermediarios.',
    url: 'https://www.paraisoencantado.com/reservar',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/LINDAVISTA/PORTADA.jpg',
        width: 1200,
        height: 630,
        alt: 'Suite LindaVista — Hotel Paraíso Encantado, Xilitla',
      },
    ],
  },
};

// Schema Offer vinculado a las suites — permite precios en rich snippets de Google.
// 17 oct 2026: es el mismo `#hotel` de todo el sitio (antes un LodgingBusiness sin
// @id, que para Google era un segundo hotel) y los vendedores apuntan a él.
const HOTEL_ID = { '@id': 'https://www.paraisoencantado.com/#hotel' };
const reservaSchema = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  '@id': 'https://www.paraisoencantado.com/#hotel',
  name: 'Hotel Paraíso Encantado',
  url: 'https://www.paraisoencantado.com',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Suites boutique — reserva directa',
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Suite con Spa Privado — desde $2,000 MXN/noche',
        // Las 4 con spa privado según la hoja de datos (§2); decía «Flor de Lis 1 & 2» y faltaba LindaVista.
        description: 'Suites Jungla, LindaVista y Flor de Liz 1 y 2, con piscina spa o tina de hidromasaje privada. Vista a la selva y montaña.',
        price: '2000',
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
        url: 'https://www.paraisoencantado.com/reservar',
        seller: HOTEL_ID,
      },
      {
        '@type': 'Offer',
        name: 'Suites Estándar — desde $1,500 MXN/noche',
        description: 'Lirios, Orquídeas, Bromelias — suites boutique con terraza y jardín en Xilitla.',
        price: '1500',
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
        url: 'https://www.paraisoencantado.com/reservar',
        seller: HOTEL_ID,
      },
      {
        '@type': 'Offer',
        name: 'Suites Familiares Helechos — desde $1,900 MXN/noche',
        description: 'Helechos 1 y 2 para grupos de hasta 8 personas. Ideal para familias y eventos privados en la Huasteca.',
        price: '1900',
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
        url: 'https://www.paraisoencantado.com/reservar',
        seller: HOTEL_ID,
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
