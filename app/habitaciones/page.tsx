import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { suites } from '@/data/suites';
import { BOOKING_URL } from '@/lib/config';
import styles from './habitaciones.module.css';
import AvailabilityFilterClient from './AvailabilityFilterClient';

export const metadata = {
  title: 'Suites Boutique | Hotel Paraíso Encantado · Xilitla',
  description:
    '13 suites únicas con spa privado, terrazas y vistas a la selva en Xilitla. Disfruta de esta experiencia desde $1,200/noche.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/habitaciones',
  },
  openGraph: {
    title: 'Suites Boutique · Hotel Paraíso Encantado | Xilitla',
    description:
      '13 suites únicas con spa privado, terrazas y vistas a la selva en Xilitla, Huasteca Potosina. A 5 min del Jardín de Edward James.',
    url: 'https://www.paraisoencantado.com/habitaciones',
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

  return (
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

      <AvailabilityFilterClient groups={groups} allSuites={suites} />
    </main>
  );
}
