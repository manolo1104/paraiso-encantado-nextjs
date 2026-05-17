import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { suites } from '@/data/suites';
import { BOOKING_URL } from '@/lib/config';
import styles from './habitaciones.module.css';
import AvailabilityFilterClient from './AvailabilityFilterClient';

export const metadata = {
  title: '13 Suites Boutique con Spa Privado · Xilitla | Hotel Paraíso Encantado',
  description:
    '13 suites boutique con spa privado en Xilitla, a 5 min de Las Pozas de Edward James. Desde $1,500 MXN. Reserva directa sin comisiones. Cancelación gratuita.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/habitaciones',
  },
  openGraph: {
    title: '13 Suites Boutique con Spa Privado | Hotel Paraíso Encantado, Xilitla',
    description:
      '13 suites únicas con spa privado, terrazas y vistas a la selva en Xilitla, Huasteca Potosina. A 5 min del Jardín de Edward James.',
    url: 'https://www.paraisoencantado.com/habitaciones',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/JUNGLA/PORTADA.JPG',
        width: 1200,
        height: 630,
        alt: 'Suite Jungla — Hotel Paraíso Encantado, Xilitla',
      },
    ],
  },
};

export default function HabitacionesPage() {
  const sorted = [...suites].sort((a, b) => {
    const aSpa = a.amenities.some((x) => x.toLowerCase().includes('spa') || x.toLowerCase().includes('piscina') || x.toLowerCase().includes('hidro'));
    const bSpa = b.amenities.some((x) => x.toLowerCase().includes('spa') || x.toLowerCase().includes('piscina') || x.toLowerCase().includes('hidro'));
    if (aSpa && !bSpa) return -1;
    if (!aSpa && bSpa) return 1;
    return b.price - a.price;
  });

  const groups = sorted.reduce<Record<string, typeof suites>>((acc, suite) => {
    const g = suite.categoryGroup;
    if (!acc[g]) acc[g] = [];
    acc[g].push(suite);
    return acc;
  }, {});

  // Schema: ItemList de suites + BreadcrumbList
  const habitacionesSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: '13 Suites Boutique — Hotel Paraíso Encantado, Xilitla',
        description: '13 suites únicas con spa privado, terrazas y vistas a la selva en Xilitla, Huasteca Potosina.',
        url: 'https://www.paraisoencantado.com/habitaciones',
      },
      {
        '@type': 'ItemList',
        name: 'Suites del Hotel Paraíso Encantado',
        numberOfItems: suites.length,
        itemListElement: sorted.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'HotelRoom',
            name: s.name,
            description: s.description,
            url: `https://www.paraisoencantado.com/habitaciones/${s.id}`,
            image: s.images[0] ? `https://www.paraisoencantado.com${s.images[0]}` : undefined,
            occupancy: { '@type': 'QuantitativeValue', maxValue: s.maxOccupancy },
            offers: {
              '@type': 'Offer',
              price: s.price,
              priceCurrency: 'MXN',
              availability: 'https://schema.org/InStock',
            },
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
          { '@type': 'ListItem', position: 2, name: 'Habitaciones', item: 'https://www.paraisoencantado.com/habitaciones' },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(habitacionesSchema) }} />
    <main className={styles.main}>
      {/* Header */}
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.backLink}>← Inicio</Link>
          <p className={styles.eyebrow}>Xilitla, San Luis Potosí · Huasteca Potosina</p>
          <h1>Nuestras <em>Suites</em></h1>
          <p className={styles.headerSubtitle}>
            13 espacios únicos. Cada uno diseñado para privacidad absoluta y confort en la naturaleza.
            Todas a 5 minutos caminando del Jardín de Edward James.
          </p>
          <div className={styles.headerMeta}>
            <span>Disfruta de esta experiencia desde <strong>$1,200 MXN</strong>/noche</span>
            <span className={styles.dot}>·</span>
            <span>Persona adicional <strong>+$300 MXN</strong></span>
            <span className={styles.dot}>·</span>
            <span><CheckCircle size={13} strokeWidth={2} /> Cancelación gratuita 48hrs</span>
          </div>
          <a href={BOOKING_URL} className={styles.headerCta}>
            Encuentra tu Suite Perfecta
          </a>
        </div>
      </section>

      {/* Link contextual — captura búsquedas de "hotel cerca de Las Pozas" */}
      <div style={{ textAlign: 'center', padding: '16px 24px 0', fontSize: 14, color: '#888', fontFamily: 'var(--font-jost, sans-serif)' }}>
        ¿Buscas el hotel más cercano a Las Pozas de Edward James?{' '}
        <a href="/hotel-cerca-de-las-pozas" style={{ color: 'var(--forest)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Estás en el lugar correcto →
        </a>
      </div>

      <AvailabilityFilterClient groups={groups} allSuites={suites} />
    </main>
    </>
  );
}
