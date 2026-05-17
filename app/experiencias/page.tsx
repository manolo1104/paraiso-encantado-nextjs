import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bus, Coffee, GraduationCap, ShieldCheck, Leaf, Camera, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import styles from './experiencias.module.css';

export const metadata: Metadata = {
  title: 'Tours Huasteca Potosina · Tamul, Las Pozas y Cascadas | Desde Xilitla',
  description:
    'Cascada de Tamul, Las Pozas de Edward James, Puente de Dios y más. Guía certificado + transporte + desayuno incluidos. Salidas diarias desde el hotel. Desde $1,300 MXN/persona.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/experiencias',
  },
  openGraph: {
    title: 'Tours en la Huasteca Potosina — Desde Paraíso Encantado, Xilitla',
    description:
      'Cascada Tamul, Las Pozas de Edward James, Puente de Dios y más. Guía certificado, transporte y desayuno incluidos. Salidas diarias desde el hotel.',
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

// Reseñas por tour — 2-3 por excursión
const tourReviews: Record<string, { name: string; location: string; date: string; rating: number; text: string }[]> = {
  'expedicion-tamul': [
    { name: 'Andrés Villanueva', location: 'Guadalajara, Jal.', date: 'Marzo 2025', rating: 5, text: 'La Cascada Tamul desde la canoa es uno de los momentos más impresionantes que he vivido en México. El guía conoce cada rincón, el desayuno antes de salir estaba delicioso y llegamos frescos al sótano. Completamente recomendado.' },
    { name: 'Sofía Guerrero', location: 'Ciudad de México', date: 'Febrero 2025', rating: 5, text: 'Hicimos el tour en familia con tres niños. El guía fue extraordinariamente paciente y hizo que hasta los más pequeños entendieran la geología del sótano. La cueva del Agua fue la cereza del pastel. Volveríamos mañana.' },
    { name: 'Carlos Medina', location: 'Monterrey, N.L.', date: 'Enero 2025', rating: 5, text: 'Llevaba años queriendo ver Tamul en canoa. Gracias a que salimos desde el hotel todo estuvo perfectamente coordinado — sin esperas, sin improvisaciones. La cascada desde abajo es simplemente inhumana de bonita.' },
  ],
  'ruta-surrealista': [
    { name: 'Mariana Fuentes', location: 'Querétaro, Qro.', date: 'Abril 2025', rating: 5, text: 'Las Pozas de Edward James me dejaron sin palabras. Habíamos visto fotos pero nada prepara para la escala real de las esculturas rodeadas de selva. El manantial Huichihuayán fue la mejor sorpresa — agua turquesa en plena montaña.' },
    { name: 'Roberto Salas', location: 'Ciudad de México', date: 'Marzo 2025', rating: 5, text: 'Tour perfecto para entender qué es la Huasteca más allá de las cascadas. Cultura, arte y naturaleza en un solo día. El guía dio contexto histórico sobre Edward James que no encontrarías en ninguna guía turística convencional.' },
  ],
  'cascadas-meco': [
    { name: 'Patricia López', location: 'San Luis Potosí', date: 'Abril 2025', rating: 5, text: 'El mirador panorámico justifica el tour por sí solo. Cuando ves las tres cascadas desde arriba con la selva verde alrededor entiendes por qué la Huasteca es única. Y las pozas turquesas para nadar al final son el premio perfecto.' },
    { name: 'Diego Herrera', location: 'CDMX', date: 'Febrero 2025', rating: 5, text: 'Fácil de caminar, altamente recomendado para parejas y familias. Las fotos en El Gran Salto con la caída de agua al fondo son espectaculares. El desayuno huasteco antes de salir nos dio energía para todo el día.' },
    { name: 'Valeria Cruz', location: 'Tampico, Tamps.', date: 'Enero 2025', rating: 5, text: 'La mejor relación precio-experiencia de todos los tours que hice en la Huasteca. Tres cascadas en un día, guía atento, transporte puntual. Lo único que lamentamos es no haber venido antes.' },
  ],
  'paraiso-escalonado': [
    { name: 'Luz Elena Torres', location: 'Guadalajara, Jal.', date: 'Marzo 2025', rating: 5, text: 'Las Cascadas de Micos superaron todas mis expectativas. Son escalonadas, lo que significa que puedes nadar en niveles distintos y la vista desde arriba es increíble. Salir en la mañana desde el hotel con desayuno incluido fue fundamental para llegar con tiempo.' },
    { name: 'Jorge Romero', location: 'Monterrey, N.L.', date: 'Febrero 2025', rating: 5, text: 'Minas Viejas es un secreto que pocas guías mencionan. Agua completamente cristalina, sin aglomeraciones. Combinado con Micos es el día perfecto para los que aman la naturaleza tranquila y fotogénica.' },
  ],
  'ruta-acuatica': [
    { name: 'Fernanda Ibarra', location: 'Ciudad de México', date: 'Abril 2025', rating: 5, text: 'El Puente de Dios es sencillamente mágico. Agua turquesa bajo un arco natural de roca. Hay que verlo para creerlo. La hacienda Los Gómez añade historia al recorrido. Tour muy completo y bien organizado desde el hotel.' },
    { name: 'Miguel Ángel Castillo', location: 'Querétaro, Qro.', date: 'Marzo 2025', rating: 5, text: 'Las Siete Cascadas al final del tour fueron la sorpresa que no esperábamos. Terminamos el día mojados y felices. El guía fue puntual, conocedor y nos ayudó a encontrar los mejores ángulos para las fotos en cada parada.' },
  ],
};

const tours = [
  {
    id: 'expedicion-tamul',
    name: 'Expedición Tamul',
    subtitle: 'Sótano, Cañón & Cueva del Agua',
    category: 'Aventura & Naturaleza',
    difficulty: 'Media',
    price: '$1,450',
    priceUnit: 'MXN / persona',
    duration: '10–12 horas',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    description:
      'El tour más completo de la Huasteca en un solo día. Incluye Sótano de las Huahuastecas, Cascada Tamul en canoa y Cenote Cueva del Agua.',
    highlights: ['Sótano de las Huahuastecas', 'Cascada Tamul en canoa', 'Cenote Cueva del Agua', 'Guía certificado'],
  },
  {
    id: 'ruta-surrealista',
    name: 'Ruta Surrealista',
    subtitle: 'Edward James, Manantiales & Selva',
    category: 'Cultura & Naturaleza',
    difficulty: 'Fácil',
    price: '$1,300',
    priceUnit: 'MXN / persona',
    duration: '8–10 horas',
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    description:
      'Arte, agua y misterio en un recorrido de contrastes únicos. Las Pozas de Edward James, manantial Huichihuayán y Cueva de las Quilas.',
    highlights: ['Las Pozas de Edward James', 'Manantial Huichihuayán', 'Cueva de las Quilas', 'Selva tropical'],
  },
  {
    id: 'cascadas-meco',
    name: 'Cascadas del Meco',
    subtitle: 'Turquesas, Mirador & El Gran Salto',
    category: 'Cascadas & Fotografía',
    difficulty: 'Fácil',
    price: '$1,600',
    priceUnit: 'MXN / persona',
    duration: '9–11 horas',
    image: '/images/atracciones/cascadas_de_micos.jpg',
    description:
      'Tres caídas de agua, tres emociones distintas. Cascada El Meco, mirador panorámico y Cascada El Salto en un solo recorrido.',
    highlights: ['Cascada El Meco', 'Mirador panorámico', 'Cascada El Salto', 'Pozas naturales turquesas'],
  },
  {
    id: 'paraiso-escalonado',
    name: 'Paraíso Escalonado',
    subtitle: 'Minas Viejas & Cascadas de Micos',
    category: 'Cascadas & Bienestar',
    difficulty: 'Fácil',
    price: '$1,500',
    priceUnit: 'MXN / persona',
    duration: '9–11 horas',
    image: '/images/atracciones/nacimiento_de_huichihuayan.jpg',
    description:
      'Dos joyas naturales, un día perfecto para desconectar. Cascadas de Minas Viejas y las famosas Cascadas de Micos.',
    highlights: ['Cascadas de Minas Viejas', 'Cascadas de Micos', 'Baño en pozas naturales', 'Paisaje de selva'],
  },
  {
    id: 'ruta-acuatica',
    name: 'Ruta Acuática',
    subtitle: 'Puente de Dios, Hacienda & Siete Cascadas',
    category: 'Aventura Acuática',
    difficulty: 'Media',
    price: '$1,500',
    priceUnit: 'MXN / persona',
    duration: '10–12 horas',
    image: '/images/atracciones/puente_de_dios.jpg',
    description:
      'El recorrido más refrescante y completo de la región. Puente de Dios, Hacienda Los Gómez y las Siete Cascadas.',
    highlights: ['Puente de Dios', 'Hacienda Los Gómez', 'Siete Cascadas', 'Senderismo guiado'],
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

const packageHighlight = {
  name: 'Las Pozas Experience',
  price: '$4,600',
  includes: [
    '2 noches en suite seleccionada',
    'Desayuno huasteco cada mañana',
    'Entrada a Las Pozas de Edward James',
    'Tour guiado por Xilitla (3 hrs)',
    'Cóctel de bienvenida',
  ],
};

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
      '@type': ['TouristAttraction', 'Product'],
      name: `${tour.name} — Tour Huasteca Potosina`,
      description: tour.description,
      url: `https://www.paraisoencantado.com/experiencias#${tour.id}`,
      image: `https://www.paraisoencantado.com${tour.image}`,
      touristType: 'Adventure traveler',
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
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.9,
        reviewCount: (tourReviews[tour.id] || []).length,
        bestRating: 5,
      },
      review: (tourReviews[tour.id] || []).map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.text,
        datePublished: r.date,
      })),
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
        text: 'Ofrecemos 5 tours con guía certificado: Expedición Tamul (Cascada Tamul + Sótano de las Huahuastecas), Ruta Surrealista (Las Pozas de Edward James), Cascadas del Meco, Paraíso Escalonado (Minas Viejas + Micos) y Ruta Acuática (Puente de Dios). Todos salen desde el hotel e incluyen transporte, guía y desayuno.',
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
              <span className={styles.statNum}>5</span>
              <span className={styles.statLabel}>Tours disponibles</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>9</span>
              <span className={styles.statLabel}>Atracciones cubiertas</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>4.9</span>
              <span className={styles.statLabel}>Calificación promedio</span>
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

      {/* Paquete Destacado */}
      <section className={styles.packageSection}>
        <div className={styles.packageCard}>
          <div className={styles.packageBadge}>Paquete Recomendado</div>
          <div className={styles.packageContent}>
            <div>
              <p className={styles.eyebrow}>Paquete Especial</p>
              <h2 className={styles.packageName}>{packageHighlight.name}</h2>
              <ul className={styles.packageList}>
                {packageHighlight.includes.map((item) => (
                  <li key={item} className={styles.packageItem}>
                    <CheckCircle size={14} strokeWidth={2} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.packagePricing}>
              <p className={styles.packageFrom}>Desde</p>
              <p className={styles.packagePrice}>{packageHighlight.price}</p>
              <p className={styles.packageUnit}>MXN por pareja</p>
              <a
                href={`${WHATSAPP_URL}?text=Hola,%20me%20interesa%20el%20Paquete%20Las%20Pozas%20Experience`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.packageBtn}
              >
                Solicitar Paquete
              </a>
              <a
                href={BOOKING_URL}
                className={styles.packageBtnOutline}
              >
                Reservar Suite
              </a>
            </div>
          </div>
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
              {/* Reseñas del tour */}
              {(tourReviews[tour.id] || []).length > 0 && (
                <div className={styles.tourReviews}>
                  <p className={styles.tourReviewsTitle}>
                    ★★★★★ <span>Lo que dicen quienes lo vivieron</span>
                  </p>
                  <div className={styles.tourReviewsList}>
                    {(tourReviews[tour.id] || []).map((r) => (
                      <div key={r.name} className={styles.tourReviewCard}>
                        <div className={styles.tourReviewHeader}>
                          <span className={styles.tourReviewAvatar}>{r.name.charAt(0)}</span>
                          <div>
                            <span className={styles.tourReviewName}>{r.name}</span>
                            <span className={styles.tourReviewMeta}>{r.location} · {r.date}</span>
                          </div>
                        </div>
                        <p className={styles.tourReviewText}>"{r.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              { icon: <GraduationCap size={22} strokeWidth={1.5} />, title: 'Guía Certificado', desc: 'Guía local con certificación y seguro.' },
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
