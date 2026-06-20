import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bus, Coffee, GraduationCap, ShieldCheck, Leaf, Camera, MessageCircle, Clock } from 'lucide-react';
import styles from './experiencias.module.css';

export const metadata: Metadata = {
  title: 'Tours Huasteca Potosina · Tamul, Las Pozas, Rappel y RZR | Desde Xilitla',
  description:
    '7 tours en la Huasteca: Cascada de Tamul, Las Pozas de Edward James, Puente de Dios, rappel y RZR. Guía certificado NOM-09, transporte y desayuno incluidos. Salidas diarias desde el hotel. Desde $800 MXN/persona.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/experiencias',
  },
  openGraph: {
    title: 'Tours en la Huasteca Potosina — Desde Paraíso Encantado, Xilitla',
    description:
      'Cascada Tamul, Las Pozas de Edward James, Puente de Dios, rappel y RZR. Guía certificado NOM-09, transporte y desayuno incluidos. Salidas diarias desde el hotel.',
    url: 'https://www.paraisoencantado.com/experiencias',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/atracciones/cascada_de_tamul.jpg',
        width: 1200,
        height: 630,
        alt: 'Cascada de Tamul — Tour desde Hotel Paraíso Encantado, Xilitla, Huasteca Potosina',
      },
    ],
  },
};

const WHATSAPP_URL = 'https://wa.me/524891007679';
const BOOKING_URL = '/reservar';
const TOURS_EXTERNAL_URL = 'https://www.huasteca-potosina.com/';

const tours = [
  {
    id: 'expedicion-tamul',
    name: 'Expedición Tamul',
    subtitle: 'Sótano, Cañón & Cueva del Agua',
    category: 'Aventura & Naturaleza',
    difficulty: 'Media',
    price: '$1,450',
    priceUnit: 'MXN / persona',
    duration: '9 horas',
    durationHours: 9,
    image: '/images/atracciones/cascada_de_tamul.jpg',
    description:
      'El tour más completo de la Huasteca en un solo día. Navega en canoa por el Cañón del Tampaón hasta la Cascada de Tamul —la más alta de México—, asómate al abismo del Sótano de las Huahuas y termina en la Cueva del Agua.',
    highlights: ['Cascada de Tamul en canoa', 'Sótano de las Huahuas (abismo 512 m)', 'Cenote Cueva del Agua', 'Guía certificado NOM-09'],
  },
  {
    id: 'ruta-surrealista',
    name: 'Ruta Surrealista',
    subtitle: 'Edward James, Manantiales & Selva',
    category: 'Cultura & Naturaleza',
    difficulty: 'Fácil',
    price: '$1,300',
    priceUnit: 'MXN / persona',
    duration: '8 horas',
    durationHours: 8,
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    description:
      'Arte, agua y misterio en un día de contrastes. Las Pozas de Edward James, las aguas cristalinas del Nacimiento de Huichihuayán, la Cueva de las Quilas y el Castillo de la Salud.',
    highlights: ['Las Pozas de Edward James', 'Nacimiento de Huichihuayán', 'Cueva de las Quilas', 'Castillo de la Salud'],
  },
  {
    id: 'ruta-acuatica',
    name: 'Ruta Acuática',
    subtitle: 'Puente de Dios, Hacienda & Siete Cascadas',
    category: 'Aventura Acuática',
    difficulty: 'Media',
    price: '$1,500',
    priceUnit: 'MXN / persona',
    duration: '10 horas',
    durationHours: 10,
    image: '/images/atracciones/puente_de_dios.jpg',
    description:
      'El recorrido más refrescante de la región. Atraviesa la cueva natural del Puente de Dios, explora la Hacienda Los Gómez y desciende por las Siete Cascadas. Las pozas de Tamasopo, opcionales para quien quiera más.',
    highlights: ['Puente de Dios', 'Hacienda Los Gómez', 'Siete Cascadas', 'Cascadas de Tamasopo (opcional)'],
  },
  {
    id: 'cascadas-meco',
    name: 'Cascadas del Meco',
    subtitle: 'Turquesas, Mirador & El Gran Salto',
    category: 'Cascadas & Fotografía',
    difficulty: 'Fácil',
    price: '$1,600',
    priceUnit: 'MXN / persona',
    duration: '7 horas',
    durationHours: 7,
    image: '/images/atracciones/cascada_el_salto.jpg',
    description:
      'El recorrido más fotogénico de la región. Las pozas turquesa de la Cascada del Meco, un mirador panorámico que quita el aliento y la imponente Cascada del Salto de 40 metros.',
    highlights: ['Cascada del Meco', 'Mirador panorámico', 'Cascada del Salto (40 m)', 'Pozas turquesas para nadar'],
  },
  {
    id: 'paraiso-escalonado',
    name: 'Paraíso Escalonado',
    subtitle: 'Minas Viejas & Cascadas de Micos',
    category: 'Cascadas & Bienestar',
    difficulty: 'Fácil',
    price: '$1,500',
    priceUnit: 'MXN / persona',
    duration: '8 horas',
    durationHours: 8,
    image: '/images/atracciones/cascadas_de_micos.jpg',
    description:
      'Dos joyas naturales para desconectar. Minas Viejas despliega terrazas de travertino color jade; las Cascadas de Micos encadenan pozas turquesa entre la selva. Aguas cristalinas y paz lejos del ruido.',
    highlights: ['Cascadas de Minas Viejas', 'Cascadas de Micos', 'Terrazas de travertino jade', 'Ideal para familias'],
  },
  {
    id: 'rappel-tamul',
    name: 'Rappel en Tamul',
    subtitle: 'Descenso frente a la caída más alta de México',
    category: 'Aventura Extrema',
    difficulty: 'Alta',
    price: '$1,700',
    priceUnit: 'MXN / persona',
    duration: '5 horas',
    durationHours: 5,
    image: '/images/atracciones/rappel_tamul.jpg',
    description:
      'Adrenalina pura: desciende en rappel por la pared del cañón del Tampaón con la Cascada de Tamul —105 metros— rugiendo a tu lado. Equipo profesional, guías certificados y fotos con dron. Apto también para principiantes.',
    highlights: ['Rappel frente a la Cascada de Tamul', 'Cañón del Río Tampaón', 'Equipo y guías certificados', 'Fotos y video con dron'],
  },
  {
    id: 'rzr-xilitla',
    name: 'RZR por Xilitla',
    subtitle: 'Ruta Nanacatli · Todoterreno',
    category: 'Aventura Off-Road',
    difficulty: 'Media',
    price: '$800',
    priceUnit: 'MXN / persona',
    duration: '2 horas',
    durationHours: 2,
    image: '/images/atracciones/rzr_xilitla.jpg',
    description:
      'Maneja tu propio RZR por la selva húmeda de Xilitla: cruza ríos de agua cristalina, atraviesa el barro y llega a la escondida Cascada Nanacatli. Adrenalina sin necesidad de experiencia.',
    highlights: ['Maneja tu propio todoterreno', 'Cruce de ríos y selva', 'Cascada Nanacatli', 'Casco, goggles y guía instructor'],
  },
];

const attractions = [
  {
    name: 'Sótano de las Golondrinas',
    image: '/images/atracciones/sotano_de_las_golondrinas.jpg',
    desc: 'Una de las cuevas-foso más grandes del mundo. Al amanecer, miles de loros y golondrinas surgen en espiral. Espectáculo natural sin igual.',
  },
  {
    name: 'Sótano de las Huahuas',
    image: '/images/atracciones/sotano_de_las_huahuas.jpg',
    desc: 'Caverna de 450 metros de profundidad en la sierra de Xilitla. Punto de partida para la expedición Tamul.',
  },
  {
    name: 'Tamasopo',
    image: '/images/atracciones/tamasopo.jpg',
    desc: 'Cascadas escalonadas de aguas verde-turquesa rodeadas de vegetación tropical. Perfectas para nadar y fotografiar.',
  },
  {
    name: 'Cascada El Salto',
    image: '/images/atracciones/cascada_el_salto.jpg',
    desc: 'Salto de agua de 40 metros encajado entre paredes de roca calcárea. Una de las cascadas más fotogénicas de la Huasteca.',
  },
];

// Schema TouristAttraction por tour + ItemList
const toursSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Tours en la Huasteca Potosina desde Xilitla',
  description: 'Tours con guía certificado, transporte y desayuno incluidos. Salidas desde Hotel Paraíso Encantado.',
  url: 'https://www.paraisoencantado.com/experiencias',
  numberOfItems: tours.length,
  itemListElement: tours.map((tour, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': ['TouristTrip', 'TouristAttraction', 'Product'],
      name: `${tour.name} — Tour Huasteca Potosina`,
      description: tour.description,
      url: `https://www.paraisoencantado.com/experiencias#${tour.id}`,
      image: `https://www.paraisoencantado.com${tour.image}`,
      touristType: ['Adventure traveler', 'Nature enthusiast'],
      duration: `PT${tour.durationHours}H`,
      itinerary: {
        '@type': 'ItemList',
        itemListElement: tour.highlights.map((h, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: h,
        })),
      },
      departureTime: '08:00',
      arrivalTime: `${String(8 + tour.durationHours).padStart(2, '0')}:00`,
      offers: {
        '@type': 'Offer',
        price: tour.price.replace('$', '').replace(',', ''),
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'Hotel Paraíso Encantado',
          url: 'https://www.paraisoencantado.com',
        },
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
      },
    },
  })),
};

const experienciasFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué tours ofrece el Hotel Paraíso Encantado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ofrecemos 7 tours con guía certificado NOM-09 SECTUR: Expedición Tamul (Cascada de Tamul + Sótano de las Huahuas), Ruta Surrealista (Las Pozas de Edward James), Ruta Acuática (Puente de Dios), Cascadas del Meco, Paraíso Escalonado (Minas Viejas + Micos), y dos de aventura: Rappel en la Cascada de Tamul y RZR por Xilitla. Todos salen desde el hotel e incluyen transporte, guía y desayuno.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta el tour a la Cascada de Tamul?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La Expedición Tamul tiene un precio de $1,450 MXN por persona e incluye: transporte privado, guía certificado, desayuno huasteco, entrada al Sótano de las Huahuastecas y recorrido en canoa hasta la Cascada de Tamul. La excursión dura entre 10 y 12 horas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Necesito reservar los tours con anticipación?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí, recomendamos reservar con al menos 24-48 horas de anticipación para garantizar disponibilidad. Puedes reservar a través de WhatsApp al +52 489-100-7679 o en nuestra página web.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Los tours a las Pozas de Edward James son diarios?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí, la Ruta Surrealista que incluye Las Pozas de Edward James tiene salidas diarias desde el hotel. El Jardín Surrealista está a solo 5 minutos caminando del hotel. Recuerda que Las Pozas cierra los martes y tiene horario de 9:00 AM a 4:00 PM.',
      },
    },
  ],
};

const experienciasBreadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
    { '@type': 'ListItem', position: 2, name: 'Tours y Experiencias', item: 'https://www.paraisoencantado.com/experiencias' },
  ],
};

export default function ExperienciasPage() {
  const whatsappTour = (tourName: string) =>
    `${WHATSAPP_URL}?text=Hola,%20me%20interesa%20el%20tour%20${encodeURIComponent(tourName)}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toursSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(experienciasFaqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(experienciasBreadcrumbSchema) }} />
    <main className={styles.main}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <span>Experiencias</span>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Huasteca Potosina</p>
          <h1 className={styles.heroTitle}>
            Tours por la<br /><em>Huasteca Potosina</em>
          </h1>
          <p className={styles.heroDesc}>
            Cascadas, cañones, cenotes y arte surrealista. Salidas desde Xilitla con guía
            certificado, transporte y desayuno incluidos. La Huasteca en su estado más puro.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>7</span>
              <span className={styles.statLabel}>Tours disponibles</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>4.9</span>
              <span className={styles.statLabel}>492 reseñas en Google</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>10K+</span>
              <span className={styles.statLabel}>Viajeros guiados</span>
            </div>
          </div>
        </div>
        <div className={styles.heroImageWrap}>
          <Image
            src="/images/atracciones/cascada_de_tamul.jpg"
            alt="Cascada Tamul — La catarata más impresionante de San Luis Potosí"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={styles.heroImg}
          />
        </div>
      </section>

      {/* Tours */}
      <section className={styles.toursSection}>
        <div className={styles.toursHeader}>
          <p className={styles.eyebrow}>Explora la Región</p>
          <h2 className={styles.toursTitle}>
            Tours con <em>guía certificado</em>
          </h2>
          <p className={styles.toursSubtitle}>
            Todos los tours salen desde el hotel. Transporte, guía y desayuno incluidos.
          </p>
        </div>

        <div className={styles.toursGrid}>
          {tours.map((tour) => (
            <article key={tour.id} className={styles.tourCard}>
              <div className={styles.tourImage}>
                <Image
                  src={tour.image}
                  alt={`${tour.name} — ${tour.subtitle}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={styles.tourImg}
                />
                <div className={styles.tourOverlay}>
                  <span className={styles.tourCategory}>{tour.category}</span>
                  <span className={styles.tourDifficulty}>Dif. {tour.difficulty}</span>
                </div>
              </div>
              <div className={styles.tourContent}>
                <div>
                  <h3 className={styles.tourName}>{tour.name}</h3>
                  <p className={styles.tourSubtitle}>{tour.subtitle}</p>
                  <p className={styles.tourDesc}>{tour.description}</p>
                  <ul className={styles.tourHighlights}>
                    {tour.highlights.map((h) => (
                      <li key={h}><span>•</span><span>{h}</span></li>
                    ))}
                  </ul>
                </div>
                <div className={styles.tourFooter}>
                  <div className={styles.tourMeta}>
                    <div className={styles.tourPrice}>
                      <span className={styles.tourPriceAmount}>{tour.price}</span>
                      <span className={styles.tourPriceUnit}>{tour.priceUnit}</span>
                    </div>
                    <span className={styles.tourDuration}><Clock size={13} strokeWidth={1.5} /> {tour.duration}</span>
                  </div>
                  <a
                    href={TOURS_EXTERNAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.tourBtn}
                  >
                    Reservar Tour →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Qué incluye */}
      <section className={styles.includesSection}>
        <div className={styles.includesHeader}>
          <p className={styles.eyebrow}>Siempre Incluido</p>
          <h2 className={styles.includesTitle}>Lo que viene <em>con cada tour</em></h2>
        </div>
        <div className={styles.includesGrid}>
          {(
            [
              { icon: <Bus size={22} strokeWidth={1.5} />, title: 'Transporte', desc: 'Vehículo privado desde y hacia el hotel.' },
              { icon: <Coffee size={22} strokeWidth={1.5} />, title: 'Desayuno', desc: 'Desayuno huasteco antes de la salida.' },
              { icon: <GraduationCap size={22} strokeWidth={1.5} />, title: 'Guía Certificado', desc: 'Guía local certificado NOM-09 SECTUR.' },
              { icon: <ShieldCheck size={22} strokeWidth={1.5} />, title: 'Seguro de viaje', desc: 'Cobertura durante toda la excursión.' },
              { icon: <Leaf size={22} strokeWidth={1.5} />, title: 'Entradas', desc: 'Entradas a reservas y sitios naturales.' },
              { icon: <Camera size={22} strokeWidth={1.5} />, title: 'Fotografía', desc: 'Paradas en los mejores puntos de foto.' },
            ] as { icon: ReactNode; title: string; desc: string }[]
          ).map((item) => (
            <div key={item.title} className={styles.includeItem}>
              <span className={styles.includeIcon}>{item.icon}</span>
              <div>
                <p className={styles.includeTitle}>{item.title}</p>
                <p className={styles.includeDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Atracciones adicionales */}
      <section className={styles.attractionsSection}>
        <div className={styles.attractionsHeader}>
          <p className={styles.eyebrow}>También Cerca</p>
          <h2 className={styles.attractionsTitle}>
            Más <em>maravillas</em> de la Huasteca
          </h2>
        </div>
        <div className={styles.attractionsGrid}>
          {attractions.map((attr) => (
            <div key={attr.name} className={styles.attractionCard}>
              <div className={styles.attractionImage}>
                <Image
                  src={attr.image}
                  alt={attr.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className={styles.attractionImg}
                />
              </div>
              <div className={styles.attractionContent}>
                <h3>{attr.name}</h3>
                <p>{attr.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Link a guía de destino */}
      <section style={{ background: '#fafaf7', padding: '32px 24px', textAlign: 'center', borderTop: '1px solid #eee' }}>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 10, fontFamily: 'var(--font-jost, sans-serif)' }}>
          ¿Quieres conocer más sobre el destino antes de tu viaje?
        </p>
        <a
          href="/xilitla"
          style={{ display: 'inline-block', color: 'var(--forest)', fontWeight: 600, fontSize: 15, textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'var(--font-jost, sans-serif)' }}
        >
          Guía completa de Xilitla: qué hacer, cómo llegar y cuándo ir →
        </a>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <p className={styles.eyebrow}>¿Listo para Explorar?</p>
        <h2 className={styles.ctaTitle}>
          La Huasteca <em>te espera</em>
        </h2>
        <p className={styles.ctaDesc}>
          Escríbenos por WhatsApp para armar tu itinerario personalizado
          o reserva tu suite y coordinamos el tour desde el hotel.
        </p>
        <div className={styles.ctaButtons}>
          <a
            href={`${WHATSAPP_URL}?text=Hola,%20me%20interesa%20un%20tour%20por%20la%20Huasteca`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaBtn}
          >
            <MessageCircle size={16} strokeWidth={1.5} /> Consultar por WhatsApp
          </a>
          <a
            href={BOOKING_URL}
            className={styles.ctaBtnOutline}
          >
            Reservar Suite
          </a>
        </div>
      </section>
    </main>
    </>
  );
}
