import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { suites } from '@/data/suites';
import SuitePageClient from './SuitePageClient';
import { HOTEL, POSTAL_ADDRESS } from '@/lib/seo-hotel';
import { ENTITY_IDS } from '@/lib/seo-entidades';

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
    // ≤ 60 caracteres (17 oct 2026: medían de 70 a 83 y Google los cortaba antes
    // del precio). Si el nombre ya dice «Suite», no se repite.
    title: `${suite.name} · ${suite.name.startsWith('Suite') ? 'Xilitla' : 'Suite en Xilitla'} · Desde $${suite.price.toLocaleString('es-MX')} MXN`,
    description: `${suite.description.slice(0, 80).trimEnd()}… Xilitla, a 5 min de Las Pozas. Desde $${suite.price.toLocaleString('es-MX')} MXN. Reserva directa.`,
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

  // @graph con HotelRoom + Product separado.
  // 17 oct 2026: el Product ya NO lleva `aggregateRating`. Era la calificación del HOTEL
  // en Google (4.5 con 523) puesta en cada suite, y esta página no la muestra: Google
  // pide que la calificación sea del producto y que se vea, y la portada ya la declara
  // para el hotel. Ojo: si alguna ficha salía con estrellas en Google, deja de salir.
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HotelRoom',
        '@id': `https://www.paraisoencantado.com/habitaciones/${id}#room`,
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
          url: `https://www.paraisoencantado.com/reservar?suiteId=${id}&autoselect=1`,
        },
        containedInPlace: {
          '@id': 'https://www.paraisoencantado.com/#hotel',
        },
      },
      {
        // Product con su oferta (precio de lista; el de cada noche lo da el motor).
        '@type': 'Product',
        '@id': `https://www.paraisoencantado.com/habitaciones/${id}#product`,
        name: `${suite.name} — Hotel Paraíso Encantado`,
        description: `${suite.description} A 5 minutos caminando del Jardín de Edward James (Las Pozas) en Xilitla.`,
        image: suite.images[0] ? `https://www.paraisoencantado.com${suite.images[0]}` : undefined,
        brand: {
          '@type': 'Brand',
          name: 'Hotel Paraíso Encantado',
        },
        offers: {
          '@type': 'Offer',
          price: suite.price,
          priceCurrency: 'MXN',
          availability: 'https://schema.org/InStock',
          url: `https://www.paraisoencantado.com/reservar?suiteId=${id}&autoselect=1`,
          seller: { '@id': ENTITY_IDS.hotel },
        },
      },
      {
        // El hotel al que pertenece la suite: el mismo `#hotel` de todo el sitio, con
        // el mismo tipo y la dirección completa (17 oct 2026: era un LodgingBusiness
        // con solo el municipio).
        '@type': 'Hotel',
        '@id': ENTITY_IDS.hotel,
        name: HOTEL.nombre,
        url: HOTEL.url,
        address: POSTAL_ADDRESS,
      },
    ],
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
          text: 'Reembolso del 100% si cancelas hasta 7 días antes del check-in, 50% hasta 3 días antes, y con menos de 72 horas solo cambio de fecha. Lo gestionas desde la confirmación que recibes por email.',
        },
      },
      {
        '@type': 'Question',
        name: '¿A qué hora es el check-in y el check-out?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Check-in a partir de las 3:00 PM. Check-out antes de las 12:00 PM. Puedes apartar el late check-out garantizado hasta las 2:00 PM al reservar por $250 MXN por habitación (una sola vez); sin apartarlo, el check-in anticipado y el check-out tardío quedan sujetos a disponibilidad.',
        },
      },
      {
        '@type': 'Question',
        name: '¿El desayuno está incluido en la tarifa?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El desayuno no está incluido en la tarifa base. Puedes agregarlo al reservar por $250 MXN por persona por noche: a elegir huevos, enchiladas huastecas o chilaquiles con huevo, con café o agua de frutas frescas y fruta. Se sirve en El Papán Huasteco, nuestro restaurante de cocina huasteca auténtica.',
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
          text: 'El Hotel Paraíso Encantado está a solo 400 metros del Jardín Surrealista de Edward James (Las Pozas), aproximadamente 5 minutos caminando. Está sobre el camino al jardín, así que vas y vuelves a pie.',
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
