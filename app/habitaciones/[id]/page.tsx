import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { suites } from '@/data/suites';
import SuitePageClient from './SuitePageClient';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkin?: string; checkout?: string; guests?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const suite = suites.find((s) => s.id === id);
  if (!suite) return {};
  const canonical = `https://www.paraisoencantado.com/habitaciones/${id}`;
  return {
    title: `${suite.name} | Hotel Paraíso Encantado · Xilitla`,
    description: `${suite.description} Disfruta de esta experiencia desde $${suite.price.toLocaleString('es-MX')} MXN/noche. Reserva directa sin comisiones.`,
    alternates: { canonical },
    openGraph: {
      title: `${suite.name} — Hotel Paraíso Encantado, Xilitla`,
      description: suite.description,
      url: canonical,
      images: suite.images[0]
        ? [{ url: `https://www.paraisoencantado.com${suite.images[0]}`, width: 1200, height: 800, alt: suite.name }]
        : undefined,
    },
  };
}

export async function generateStaticParams() {
  return suites.map((s) => ({ id: s.id }));
}

export default async function SuitePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const suite = suites.find((s) => s.id === id);
  if (!suite) notFound();

  // HotelRoom JSON-LD
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HotelRoom',
    name: suite.name,
    description: suite.description,
    url: `https://www.paraisoencantado.com/habitaciones/${id}`,
    image: suite.images.map((img) => `https://www.paraisoencantado.com${img}`),
    occupancy: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: suite.maxOccupancy,
      unitText: 'personas',
    },
    amenityFeature: suite.amenities.map((a) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    })),
    offers: {
      '@type': 'Offer',
      price: suite.price,
      priceCurrency: 'MXN',
      availability: 'https://schema.org/InStock',
      url: `https://www.paraisoencantado.com/reservar?suiteId=${id}`,
    },
    containedInPlace: {
      '@type': 'LodgingBusiness',
      name: 'Hotel Paraíso Encantado',
      url: 'https://www.paraisoencantado.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Xilitla',
        addressRegion: 'San Luis Potosí',
        addressCountry: 'MX',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.6',
        reviewCount: '519',
        bestRating: '5',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <SuitePageClient
        suite={suite}
        initialCheckin={sp.checkin || ''}
        initialCheckout={sp.checkout || ''}
        initialGuests={Math.min(8, Math.max(1, parseInt(sp.guests || '2') || 2))}
      />
    </>
  );
}
