import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, MessageCircle, Phone } from 'lucide-react';
import { suites } from '@/data/suites';
import { mxnToUsd, BOOKING_URL } from '@/lib/config';
import styles from './habitaciones.module.css';

export const metadata = {
  title: 'Suites Boutique | Hotel Paraíso Encantado · Xilitla',
  description:
    '13 suites únicas con spa privado, terrazas y vistas a la selva en Xilitla. Disfruta de esta experiencia desde $1,200/noche.',
};

export default function HabitacionesPage() {
  // Suites con piscina/spa primero, luego por precio desc
  const sorted = [...suites].sort((a, b) => {
    const aSpa = a.amenities.some((x) => x.toLowerCase().includes('spa') || x.toLowerCase().includes('piscina') || x.toLowerCase().includes('hidro'));
    const bSpa = b.amenities.some((x) => x.toLowerCase().includes('spa') || x.toLowerCase().includes('piscina') || x.toLowerCase().includes('hidro'));
    if (aSpa && !bSpa) return -1;
    if (!aSpa && bSpa) return 1;
    return b.price - a.price;
  });

  // Agrupar por categoryGroup
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
          <Link href="/" className={styles.backLink}>
            ← Inicio
          </Link>
          <p className={styles.eyebrow}>Xilitla, San Luis Potosí · Huasteca Potosina</p>
          <h1>
            Nuestras <em>Suites</em>
          </h1>
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

      {/* Suites por grupo */}
      {Object.entries(groups).map(([groupName, groupSuites]) => (
        <section key={groupName} className={styles.group}>
          <div className={styles.groupInner}>
            <h2 className={styles.groupTitle}>{groupName}</h2>
            <div className={styles.grid}>
              {groupSuites.map((suite) => (
                <Link key={suite.id} href={`/habitaciones/${suite.id}`} className={styles.card}>
                  {/* Imagen */}
                  <div className={styles.imageWrapper}>
                    <Image
                      src={suite.images[0]}
                      alt={`${suite.name} — Paraíso Encantado`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={styles.image}
                      loading="lazy"
                    />
                    <div className={styles.categoryBadge}>{suite.category}</div>
                    {suite.badge && (
                      <div className={styles.spaBadge}>{suite.badge}</div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className={styles.content}>
                    <div className={styles.contentTop}>
                      <h3 className={styles.name}>{suite.name}</h3>
                      <p className={styles.description}>{suite.description}</p>

                      <ul className={styles.amenities}>
                        {suite.amenities.map((a) => (
                          <li key={a} className={styles.amenityTag}>
                            {a}
                          </li>
                        ))}
                      </ul>

                      <p className={styles.occupancy}>
                        Hasta <strong>{suite.maxOccupancy} personas</strong>
                      </p>
                    </div>

                    <div className={styles.footer}>
                      <div className={styles.price}>
                        <span className={styles.priceLabel}>Desde</span>
                        <span className={styles.priceAmount}>
                          ${suite.price.toLocaleString('es-MX')}
                        </span>
                        <span className={styles.priceUnit}> MXN</span>
                        <span className={styles.priceUsd}>~${mxnToUsd(suite.price)} USD</span>
                      </div>
                      <span className={styles.reserveBtn}>
                        Ver Suite →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA final */}
      <section className={styles.finalCta}>
        <h2>¿Lista tu <em>Escapada</em>?</h2>
        <p>Confirmación instantánea · Cancelación gratuita hasta 48hrs antes</p>
        <a href={BOOKING_URL} className={styles.finalCtaBtn}>
          Reservar Ahora
        </a>
        <div className={styles.contactRow}>
          <a href="https://wa.me/524891007679" target="_blank" rel="noopener noreferrer">
            <MessageCircle size={14} strokeWidth={1.5} /> WhatsApp
          </a>
          <a href="tel:+524891007679"><Phone size={14} strokeWidth={1.5} /> 489-100-7679</a>
        </div>
      </section>
    </main>
  );
}
