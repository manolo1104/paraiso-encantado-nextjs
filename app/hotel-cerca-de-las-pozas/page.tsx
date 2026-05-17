import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Droplets, Sunrise, Utensils, ShieldCheck, Leaf } from 'lucide-react';
import { suites } from '@/data/suites';
import styles from './hotel-las-pozas.module.css';

export const metadata: Metadata = {
  title: 'Hotel Cerca de Las Pozas de Edward James · Xilitla | Paraíso Encantado',
  description:
    'El hotel boutique más cercano a Las Pozas de Edward James en Xilitla. A 5 minutos caminando del Jardín Surrealista. 13 suites con spa privado desde $1,200 MXN. Reserva directa.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/hotel-cerca-de-las-pozas',
  },
  openGraph: {
    title: 'Hotel Más Cercano a Las Pozas de Edward James — Xilitla, Huasteca Potosina',
    description:
      'A solo 5 minutos caminando del Jardín Surrealista. 13 suites boutique con spa privado en el corazón de Xilitla, San Luis Potosí.',
    url: 'https://www.paraisoencantado.com/hotel-cerca-de-las-pozas',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/atracciones/ruta-surrealista-pozas.png',
        width: 1200,
        height: 630,
        alt: 'Las Pozas de Edward James — Hotel Paraíso Encantado a 5 minutos, Xilitla',
      },
    ],
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LodgingBusiness',
      name: 'Hotel Paraíso Encantado',
      description:
        'El hotel boutique más cercano a Las Pozas de Edward James en Xilitla. 13 suites con spa privado a 5 minutos caminando del Jardín Surrealista, Huasteca Potosina.',
      url: 'https://www.paraisoencantado.com/hotel-cerca-de-las-pozas',
      image: 'https://www.paraisoencantado.com/images/JUNGLA/PORTADA.JPG',
      telephone: '+524891007679',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Xilitla',
        addressRegion: 'San Luis Potosí',
        addressCountry: 'MX',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 21.383, longitude: -99.002 },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.6,
        reviewCount: 519,
        bestRating: 5,
      },
      nearbyAttractions: [
        {
          '@type': 'TouristAttraction',
          name: 'Las Pozas de Edward James',
          geo: { '@type': 'GeoCoordinates', latitude: 21.387, longitude: -98.994 },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
        { '@type': 'ListItem', position: 2, name: 'Hotel Cerca de Las Pozas', item: 'https://www.paraisoencantado.com/hotel-cerca-de-las-pozas' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cuál es el hotel más cercano a Las Pozas de Edward James?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Hotel Paraíso Encantado es el hotel boutique más cercano a Las Pozas en todo Xilitla. Está a solo 400 metros (5 minutos caminando) del Jardín Surrealista de Edward James. Puedes ir y volver cuando quieras sin transporte.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Puedo caminar desde el hotel hasta Las Pozas de Edward James?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí. El camino es de unos 400 metros por calle empedrada y toma aproximadamente 5 minutos a pie. No necesitas taxi, mototaxi ni carro para ir al jardín. Puedes salir del hotel con todo el tiempo del mundo y regresar a descansar en el spa cuando quieras.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Tiene el hotel tours a Las Pozas?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Las Pozas está a 5 minutos caminando, así que no necesitas tour. El hotel sí organiza tours a destinos más lejanos: Cascada Tamul (2.5h), Puente de Dios (1.5h) y Cascada El Meco (1h). Todos parten desde el hotel con guía certificado.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué hace diferente a Paraíso Encantado de otros hoteles en Xilitla?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tres cosas: 1) Somos el hotel boutique más cercano a Las Pozas. 2) Cada suite tiene su propia piscina spa privada — no compartes el agua con nadie. 3) Precios directos, sin comisiones de Booking o Expedia, con cancelación gratuita 48h antes.',
          },
        },
      ],
    },
  ],
};

const REASONS = [
  {
    icon: <MapPin size={22} strokeWidth={1.5} />,
    title: '5 Minutos Caminando',
    body: 'La distancia más corta de cualquier hotel en Xilitla. Sales de tu suite y en 5 minutos estás en Las Pozas —sin taxi, sin esperar, sin coordinación.',
  },
  {
    icon: <Droplets size={22} strokeWidth={1.5} />,
    title: 'Spa Privado en tu Suite',
    body: 'Cada una de las 13 suites tiene su propia piscina spa. No compartes el agua con nadie. Llega de Las Pozas y sumérgete en tu spa privado con vista a la selva.',
  },
  {
    icon: <Sunrise size={22} strokeWidth={1.5} />,
    title: 'Salida Antes que los Grupos',
    body: 'Los tours desde Ciudad Valles llegan a Las Pozas a las 10-11 AM. Tú puedes estar en el jardín a las 9 AM, cuando abre, y tener las esculturas prácticamente para ti solo.',
  },
  {
    icon: <Utensils size={22} strokeWidth={1.5} />,
    title: 'Restaurante El Papán',
    body: 'Cocina huasteca auténtica en el hotel. Desayunas zacahuil, bocoles y café de olla antes de ir al jardín. Sin salir de la propiedad.',
  },
  {
    icon: <ShieldCheck size={22} strokeWidth={1.5} />,
    title: 'Reserva Directa — Sin Comisiones',
    body: 'Al reservar en paraisoencantado.com ahorras hasta 15% vs. Booking o Expedia. Confirmación instantánea, cancelación gratuita 48 horas antes.',
  },
  {
    icon: <Leaf size={22} strokeWidth={1.5} />,
    title: 'Tours a Toda la Huasteca',
    body: 'El hotel organiza tours diarios a Cascada Tamul, Puente de Dios y más. Guía certificado, transporte y desayuno incluidos. Todas las salidas desde el hotel.',
  },
];

// Mostrar solo las 3 primeras suites como muestra
const featuredSuites = suites.slice(0, 3);

export default function HotelCercaDeLasPozasPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroImg}>
            <Image
              src="/images/atracciones/ruta-surrealista-pozas.png"
              alt="Las Pozas de Edward James — Jardín Surrealista, Xilitla, Huasteca Potosina"
              fill
              priority
              quality={80}
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Inicio</Link>
              <span aria-hidden="true"> › </span>
              <span>Hotel cerca de Las Pozas</span>
            </nav>
            <p className={styles.eyebrow}>Xilitla · San Luis Potosí · Huasteca Potosina</p>
            <h1>El Hotel Boutique <em>Más Cercano</em><br />a Las Pozas de Edward James</h1>
            <p className={styles.heroSub}>
              A solo <strong>5 minutos caminando</strong> del Jardín Surrealista. 13 suites con spa privado.
              Despierta y camina hasta Las Pozas antes de que lleguen los grupos.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/reservar" className={styles.heroCtaPrimary}>Reservar Ahora</Link>
              <Link href="/habitaciones" className={styles.heroCtaSecondary}>Ver las 13 Suites</Link>
            </div>
          </div>
        </section>

        {/* DISTANCIA VISUAL */}
        <section className={styles.distance}>
          <div className={styles.distanceInner}>
            <div className={styles.distanceStat}>
              <span className={styles.distanceNum}>400</span>
              <span className={styles.distanceUnit}>metros</span>
              <span className={styles.distanceLabel}>del Jardín de Edward James</span>
            </div>
            <div className={styles.distanceDivider} aria-hidden="true" />
            <div className={styles.distanceStat}>
              <span className={styles.distanceNum}>5</span>
              <span className={styles.distanceUnit}>minutos</span>
              <span className={styles.distanceLabel}>caminando desde tu suite</span>
            </div>
            <div className={styles.distanceDivider} aria-hidden="true" />
            <div className={styles.distanceStat}>
              <span className={styles.distanceNum}>13</span>
              <span className={styles.distanceUnit}>suites</span>
              <span className={styles.distanceLabel}>boutique con spa privado</span>
            </div>
          </div>
        </section>

        {/* POR QUÉ ELEGIRNOS */}
        <section className={styles.reasons}>
          <div className={styles.reasonsInner}>
            <p className={styles.sectionEyebrow}>Por Qué Elegirnos</p>
            <h2>Lo Que Nos Hace Únicos</h2>
            <div className={styles.reasonsGrid}>
              {REASONS.map((r) => (
                <div key={r.title} className={styles.reasonCard}>
                  <span className={styles.reasonIcon}>{r.icon}</span>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LAS POZAS — CONTEXTO */}
        <section className={styles.about}>
          <div className={styles.aboutInner}>
            <div className={styles.aboutImg}>
              <Image
                src="/images/atracciones/jardin_de_edward_james.jpg"
                alt="Interior de Las Pozas de Edward James — esculturas surrealistas rodeadas de selva"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.aboutContent}>
              <p className={styles.aboutEyebrow}>Las Pozas de Edward James</p>
              <h2>El Jardín Surrealista Más Extraordinario del Mundo</h2>
              <p>
                Edward James (1907–1984) fue un poeta y mecenas inglés amigo de Salvador Dalí y René Magritte.
                En los años 60 eligió Xilitla para construir su visión más personal: un jardín escultórico
                de concreto en plena selva tropical donde la naturaleza y el arte se funden sin límites.
              </p>
              <p>
                32 estructuras de varios pisos —columnas, arcos, espirales y torres sin techo— están
                entrelazadas con pozas naturales de agua cristalina. Las orquídeas y helechos gigantes
                crecen entre las esculturas. Cada ángulo es diferente; cada visita, única.
              </p>
              <p>
                Desde Hotel Paraíso Encantado puedes ir a Las Pozas a las 9 AM —cuando abre y antes de
                que lleguen los autobuses desde Ciudad Valles— regresar a comer y volver por la tarde
                con luz diferente. La proximidad cambia completamente la experiencia.
              </p>
              <Link href="/xilitla" className={styles.aboutLink}>
                Guía completa de Xilitla →
              </Link>
            </div>
          </div>
        </section>

        {/* SUITES DESTACADAS */}
        <section className={styles.suites}>
          <div className={styles.suitesInner}>
            <p className={styles.sectionEyebrow}>El Hotel</p>
            <h2>Suites Boutique a 5 Minutos de Las Pozas</h2>
            <p className={styles.suitesSubtitle}>
              13 espacios únicos. Cada uno con spa privado, terraza y diseño diferente.
            </p>
            <div className={styles.suitesGrid}>
              {featuredSuites.map((suite) => (
                <Link key={suite.id} href={`/habitaciones/${suite.id}`} className={styles.suiteCard}>
                  <div className={styles.suiteImg}>
                    <Image
                      src={suite.images[0]}
                      alt={`${suite.name} — Suite Boutique cerca de Las Pozas de Edward James, Xilitla`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      quality={75}
                      style={{ objectFit: 'cover' }}
                    />
                    <div className={styles.suiteOverlay} />
                  </div>
                  <div className={styles.suiteInfo}>
                    <h3>{suite.name}</h3>
                    <p>{suite.description}</p>
                    <div className={styles.suiteFooter}>
                      <span className={styles.suitePrice}>Desde ${suite.price.toLocaleString('es-MX')} MXN</span>
                      <span className={styles.suiteLink}>Ver suite →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className={styles.suitesMore}>
              <Link href="/habitaciones" className={styles.suitesMoreBtn}>
                Ver las 13 Suites →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.faq}>
          <div className={styles.faqInner}>
            <h2>Preguntas Frecuentes</h2>
            <dl className={styles.faqList}>
              <div className={styles.faqItem}>
                <dt>¿Cuál es el hotel más cercano a Las Pozas de Edward James?</dt>
                <dd>Hotel Paraíso Encantado está a 400 metros (5 minutos caminando). Es el hotel boutique con la menor distancia al Jardín Surrealista en todo Xilitla.</dd>
              </div>
              <div className={styles.faqItem}>
                <dt>¿Puedo caminar desde el hotel hasta Las Pozas?</dt>
                <dd>Sí. El camino es empedrado y toma unos 5 minutos. Puedes ir al jardín en la mañana, regresar al hotel a comer y volver por la tarde con mejor luz — sin pagar taxi ni esperar transporte.</dd>
              </div>
              <div className={styles.faqItem}>
                <dt>¿El hotel organiza tours a Las Pozas?</dt>
                <dd>Las Pozas está tan cerca que no necesitas tour. El hotel sí organiza excursiones a destinos más lejanos: Cascada Tamul, Puente de Dios y Cascada El Meco.</dd>
              </div>
              <div className={styles.faqItem}>
                <dt>¿Cuánto cuesta hospedarse en Paraíso Encantado?</dt>
                <dd>Las suites comienzan desde $1,200 MXN por noche para 2 personas. Al reservar directamente en paraisoencantado.com ahorras hasta 15% vs. Booking o Expedia.</dd>
              </div>
              <div className={styles.faqItem}>
                <dt>¿Tienen piscina compartida?</dt>
                <dd>Cada suite tiene su propia piscina spa privada — no compartida. Puedes usar tu spa a cualquier hora sin coordinarte con otros huéspedes.</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className={styles.finalCta}>
          <div className={styles.finalCtaInner}>
            <h2>Despierta a 5 Minutos<br />del Jardín de Edward James</h2>
            <p>Confirma tu fecha y elige la suite perfecta para tu visita a Las Pozas.</p>
            <div className={styles.finalCtaBtns}>
              <Link href="/reservar" className={styles.finalCtaPrimary}>Reservar Ahora</Link>
              <a href="https://wa.me/524891007679" target="_blank" rel="noopener noreferrer" className={styles.finalCtaWa}>
                Preguntar por WhatsApp
              </a>
            </div>
            <p className={styles.finalCtaNote}>Confirmación instantánea · Cancelación gratuita 48h · Sin comisiones</p>
          </div>
        </section>

      </main>
    </>
  );
}
