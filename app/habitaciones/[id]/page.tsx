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
    title: `${suite.name} · Suite Boutique Xilitla | Paraíso Encantado — Desde $${suite.price.toLocaleString('es-MX')} MXN`,
    description: `${suite.description} Desde $${suite.price.toLocaleString('es-MX')} MXN/noche · A 5 min del Jardín de Edward James · Reserva directa sin comisiones · Cancelación gratuita 48h.`,
    alternates: { canonical },
    openGraph: {
      title: `${suite.name} — Hotel Paraíso Encantado, Xilitla`,
      description: suite.description,
      url: canonical,
      images: suite.images[0]
        ? [{ url: `https://www.paraisoencantado.com${suite.images[0]}`, width: 1200, height: 630, alt: suite.name }]
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
        ratingValue: 4.6,
        reviewCount: 519,
        bestRating: 5,
      },
    },
  };

  // FAQPage — preguntas frecuentes de suites (activa rich snippets en Google)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cuál es la política de cancelación?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cancelación gratuita hasta 48 horas antes del check-in. Después de ese plazo aplica cargo del 100%. Puedes cancelar directamente desde la confirmación que recibes por email.',
        },
      },
      {
        '@type': 'Question',
        name: '¿A qué hora es el check-in y el check-out?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Check-in a partir de las 3:00 PM. Check-out antes de las 12:00 PM. Check-in anticipado o check-out tardío sujeto a disponibilidad, sin cargo adicional cuando es posible.',
        },
      },
      {
        '@type': 'Question',
        name: '¿El desayuno está incluido en la tarifa?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El desayuno no está incluido en la tarifa base. Puedes disfrutarlo en El Papán Huasteco, nuestro restaurante de cocina huasteca auténtica, de 8:00 AM a 8:00 PM. Precio aproximado $100–$200 MXN por persona.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Aceptan mascotas?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Actualmente no aceptamos mascotas en las suites para preservar el ecosistema natural del hotel y el confort de todos los huéspedes.',
        },
      },
      {
        '@type': 'Question',
        name: `¿A qué distancia está ${suite.name} del Jardín de Edward James (Las Pozas)?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El Hotel Paraíso Encantado está a solo 400 metros del Jardín Surrealista de Edward James (Las Pozas), aproximadamente 5 minutos caminando. Es el hotel más cercano a esta atracción.',
        },
      },
    ],
  };

  // BreadcrumbList — mejora la navegación en los resultados de Google
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
      { '@type': 'ListItem', position: 2, name: 'Habitaciones', item: 'https://www.paraisoencantado.com/habitaciones' },
      { '@type': 'ListItem', position: 3, name: suite.name, item: `https://www.paraisoencantado.com/habitaciones/${id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SuitePageClient
        suite={suite}
        initialCheckin={sp.checkin || ''}
        initialCheckout={sp.checkout || ''}
        initialGuests={Math.min(8, Math.max(1, parseInt(sp.guests || '2') || 2))}
      />
    </>
  );
}
