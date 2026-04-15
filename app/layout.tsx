import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hotel Paraíso Encantado | A 5 min del Jardín de Edward James · Xilitla, SLP',
  description:
    '13 suites boutique con spa privado en Xilitla. El hotel más cercano al Jardín Surrealista de Edward James (Las Pozas). Disfruta de esta experiencia desde $1,200/noche.',
  keywords: [
    'hotel xilitla',
    'jardín edward james',
    'las pozas xilitla',
    'huasteca potosina',
    'hotel boutique',
    'hotel paraíso encantado',
    'san luis potosí',
  ],
  openGraph: {
    title: 'Hotel Paraíso Encantado | Xilitla, Huasteca Potosina',
    description:
      '13 suites con spa privado a 5 minutos caminando del Jardín de Edward James. Reserva directa sin comisiones.',
    locale: 'es_MX',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Hotel Paraíso Encantado',
  description:
    '13 suites boutique con spa privado a 5 minutos caminando del Jardín Surrealista de Edward James (Las Pozas) en Xilitla, Huasteca Potosina.',
  url: 'https://www.paraisoencantado.com',
  telephone: '+524891007679',
  email: 'reservas@paraisoencantado.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Xilitla',
    addressRegion: 'San Luis Potosí',
    addressCountry: 'MX',
    streetAddress: 'Xilitla, Huasteca Potosina',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 21.383,
    longitude: -99.002,
  },
  starRating: {
    '@type': 'Rating',
    ratingValue: '4',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.6',
    reviewCount: '519',
    bestRating: '5',
    worstRating: '1',
  },
  priceRange: '$$',
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Piscina spa privada', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'WiFi gratuito', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Estacionamiento gratuito', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Restaurante', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Tours a Las Pozas', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Terraza panorámica', value: true },
  ],
  checkinTime: '15:00',
  checkoutTime: '12:00',
  currenciesAccepted: 'MXN, USD',
  paymentAccepted: 'Cash, Credit Card',
  sameAs: [
    'https://www.instagram.com/paraisoencantadoxilitla',
    'https://www.facebook.com/paraisoencantadoxilitla',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${jost.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Navbar />
        {children}
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
