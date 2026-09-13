import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bus, Coffee, GraduationCap, ShieldCheck, Leaf, Camera, MessageCircle, Clock } from 'lucide-react';
import FloatingLeaves from '@/components/FloatingLeaves';
import styles from './experiencias.module.css';

export const metadata: Metadata = {
  title: 'Tours Huasteca Potosina · Tamul, Las Pozas, Rappel y RZR | Desde Xilitla',
  description:
    'Tours en la Huasteca desde Xilitla: Cascada de Tamul, Las Pozas de Edward James, Puente de Dios, rappel y RZR. Tours de día completo desde $1,400 MXN por persona, con recogida en tu hospedaje, guía certificado NOM-09 y desayuno buffet.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/experiencias',
  },
  openGraph: {
    title: 'Tours en la Huasteca Potosina — Desde Paraíso Encantado, Xilitla',
    description:
      'Cascada Tamul, Las Pozas de Edward James, Puente de Dios, rappel y RZR. Tours de día completo con recogida en tu hospedaje, guía certificado NOM-09 y desayuno buffet.',
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

// Los tours los opera Tours Huasteca Potosina (otra marca del mismo dueño): se
// reservan en su sitio y con su equipo por WhatsApp, no con el número del hotel.
const TOURS_WHATSAPP_URL = 'https://wa.me/524891251458';
const BOOKING_URL = '/reservar';
const TOURS_SITE_URL = 'https://www.huasteca-potosina.com';
const TOURS_LIST_URL = `${TOURS_SITE_URL}/tours`;

// Precios, duraciones y logística copiados de la fuente canónica de la operadora
// (repo INTINERARIO HUASTECA, rama main: src/lib/tours.ts). Si cambian allá,
// cámbialos aquí. `slug` es el de huasteca-potosina.com/tours/<slug>.
// `durationRange` es [mín, máx] en horas: alimenta el JSON-LD.
const tours = [
  {
    id: 'expedicion-tamul',
    slug: 'expedicion-tamul',
    name: 'Expedición Tamul',
    subtitle: 'Cañón, Cueva del Agua & Sótano',
    category: 'Aventura & Naturaleza',
    difficulty: 'Media',
    price: '$1,550',
    priceUnit: 'MXN / persona',
    duration: '8–10 horas',
    durationRange: [8, 10],
    image: '/images/atracciones/cascada_de_tamul.jpg',
    description:
      'El tour más completo de la Huasteca en un solo día. Navega en canoa por el Cañón del Tampaón hasta la Cascada de Tamul —la más alta de México—, nada en el cenote de la Cueva del Agua y cierra al atardecer en el abismo del Sótano de las Huahuas.',
    highlights: ['Cascada de Tamul en canoa', 'Cenote Cueva del Agua', 'Sótano de las Huahuas (abismo 512 m)', 'Guía certificado NOM-09', 'Recogida en tu hospedaje y desayuno buffet'],
  },
  {
    id: 'ruta-surrealista',
    slug: 'ruta-surrealista-edward-james',
    name: 'Ruta Surrealista',
    subtitle: 'Edward James, Manantiales & Selva',
    category: 'Cultura & Naturaleza',
    difficulty: 'Fácil',
    price: '$1,400',
    priceUnit: 'MXN / persona',
    duration: '8–10 horas',
    durationRange: [8, 10],
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    description:
      'Arte, agua y misterio en un día de contrastes. Las Pozas de Edward James, las aguas cristalinas del Nacimiento de Huichihuayán, la Cueva de las Quilas y el Castillo de la Salud.',
    highlights: ['Las Pozas de Edward James', 'Nacimiento de Huichihuayán', 'Cueva de las Quilas', 'Castillo de la Salud', 'Recogida en tu hospedaje y desayuno buffet'],
  },
  {
    id: 'ruta-acuatica',
    slug: 'ruta-acuatica-puente-de-dios',
    name: 'Ruta Acuática',
    subtitle: 'Puente de Dios + Siete Cascadas o Tamasopo',
    category: 'Aventura Acuática',
    difficulty: 'Media',
    price: '$1,600',
    priceUnit: 'MXN / persona',
    duration: '10 horas',
    durationRange: [10, 10],
    image: '/images/atracciones/puente_de_dios.jpg',
    description:
      'El recorrido más refrescante de la región. Atraviesa la cueva natural del Puente de Dios y después elige: la Hacienda Los Gómez con las Siete Cascadas —están en el mismo lugar— o las pozas de Tamasopo. El día da para una de las dos.',
    highlights: ['Puente de Dios', 'Hacienda Los Gómez y 7 Cascadas o Tamasopo (a elegir)', 'Pozas turquesas para nadar', 'Recogida en tu hospedaje y desayuno buffet'],
  },
  {
    id: 'cascadas-meco',
    slug: 'cascadas-del-meco',
    name: 'Cascadas del Meco',
    subtitle: 'Turquesas, Mirador & El Gran Salto',
    category: 'Cascadas & Fotografía',
    difficulty: 'Fácil',
    price: '$1,700',
    priceUnit: 'MXN / persona',
    duration: '10 horas',
    durationRange: [10, 10],
    image: '/images/atracciones/cascada_el_salto.jpg',
    description:
      'El recorrido más fotogénico de la región. Las pozas turquesa de la Cascada del Meco, un mirador panorámico que quita el aliento y la imponente Cascada del Salto de 40 metros.',
    highlights: ['Cascada del Meco', 'Mirador panorámico', 'Cascada del Salto (40 m)', 'Pozas turquesas para nadar', 'Recogida en tu hospedaje y desayuno buffet'],
  },
  {
    id: 'paraiso-escalonado',
    slug: 'paraiso-escalonado-minas-micos',
    name: 'Paraíso Escalonado',
    subtitle: 'Minas Viejas & Cascadas de Micos',
    category: 'Cascadas & Bienestar',
    difficulty: 'Fácil',
    price: '$1,600',
    priceUnit: 'MXN / persona',
    duration: '10 horas',
    durationRange: [10, 10],
    image: '/images/atracciones/cascadas_de_micos.jpg',
    description:
      'Dos joyas naturales para desconectar. Minas Viejas despliega terrazas de travertino color jade; las Cascadas de Micos encadenan pozas turquesa entre la selva. Aguas cristalinas y paz lejos del ruido.',
    highlights: ['Cascadas de Minas Viejas', 'Cascadas de Micos', 'Opcional: Salto de las 7 Cascadas (+$350 por persona)', 'Ideal para familias', 'Recogida en tu hospedaje y desayuno buffet'],
  },
  {
    id: 'rappel-tamul',
    slug: 'rappel-tamul',
    name: 'Rappel en Tamul',
    subtitle: 'Descenso frente a la caída más alta de México',
    category: 'Aventura Extrema',
    difficulty: 'Alta',
    price: '$1,700',
    priceUnit: 'MXN / persona',
    duration: '5 horas',
    durationRange: [5, 5],
    image: '/images/atracciones/rappel_tamul.jpg',
    description:
      'Adrenalina pura: desciende en rappel por la pared del cañón del Tampaón con la Cascada de Tamul —105 metros— rugiendo a tu lado. Equipo profesional, guías certificados y video con dron. Apto también para principiantes.',
    highlights: ['Rappel frente a la Cascada de Tamul', 'Equipo y guías certificados', 'Video con dron del descenso', 'Mínimo 4 personas', 'Sale de Ciudad Valles · sin alimentos'],
  },
  {
    id: 'rzr-xilitla',
    slug: 'rzr-xilitla',
    name: 'RZR por Xilitla',
    subtitle: '4 rutas · Todoterreno',
    category: 'Aventura Off-Road',
    difficulty: 'Media',
    price: 'desde $1,600',
    priceUnit: 'MXN / vehículo',
    duration: '2–5 horas',
    durationRange: [2, 5],
    image: '/images/atracciones/rzr_xilitla.jpg',
    description:
      'Maneja tu propio todoterreno por la selva húmeda de Xilitla: cruza ríos de agua cristalina, atraviesa el barro y elige entre 4 rutas de 2 a 5 horas, como la de la Aldea Nanacatli y sus casitas de hongos. Adrenalina sin necesidad de experiencia.',
    highlights: ['Maneja tu propio todoterreno', 'Cruce de ríos y selva', 'Aldea Nanacatli (casitas de hongos)', 'Casco, goggles y guía instructor', 'Sale de la base en Xilitla · sin transporte ni alimentos'],
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
    desc: 'Caverna de 450 metros de profundidad en Aquismón. La Expedición Tamul cierra aquí el día, al atardecer, cuando regresan los pericos.',
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
  description: 'Tours con guía por la Huasteca Potosina, operados por Tours Huasteca Potosina. Los de día completo pasan por ti a tu hospedaje en Xilitla o Ciudad Valles.',
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
      // ISO 8601 no admite rangos: se declara el máximo ("8–10 horas" → PT10H)
      // para no prometer un día más corto que el real.
      duration: `PT${Math.max(...tour.durationRange)}H`,
      itinerary: {
        '@type': 'ItemList',
        itemListElement: tour.highlights.map((h, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: h,
        })),
      },
      // Inicio aproximado según la operadora; la hora de regreso depende del
      // tour y del grupo, por eso ya no se calcula una llegada fija.
      departureTime: '08:30',
      offers: {
        '@type': 'Offer',
        // Solo dígitos: hay precios con prefijo ('desde $1,600') y schema.org
        // espera un número, no un texto.
        price: tour.price.replace(/[^0-9]/g, ''),
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
        url: `${TOURS_SITE_URL}/tours/${tour.slug}`,
        seller: {
          '@type': 'Organization',
          name: 'Tours Huasteca Potosina',
          url: TOURS_SITE_URL,
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

const experienciasBreadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
    { '@type': 'ListItem', position: 2, name: 'Tours y Experiencias', item: 'https://www.paraisoencantado.com/experiencias' },
  ],
};

export default function ExperienciasPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toursSchema) }} />
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
            Cascadas, cañones, cenotes y arte surrealista. Los tours de día completo pasan por ti
            a tu hospedaje en Xilitla e incluyen guía certificado y desayuno buffet. La Huasteca en su estado más puro.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>10</span>
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
            Los tours de día completo pasan por ti a tu hospedaje en Xilitla o Ciudad Valles e incluyen
            guía, entradas y desayuno buffet. El rappel y el RZR tienen su propio punto de salida.
          </p>
          <a
            href={TOURS_LIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 12, color: 'var(--forest)', fontWeight: 600, fontSize: 15, textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'var(--font-jost, sans-serif)' }}
          >
            Ver los 10 tours →
          </a>
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
                    href={`${TOURS_SITE_URL}/tours/${tour.slug}`}
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
          <p className={styles.eyebrow}>Qué Incluye</p>
          <h2 className={styles.includesTitle}>Lo que viene <em>con los tours</em></h2>
        </div>
        <div className={styles.includesGrid}>
          {(
            [
              // Logística real de la operadora: NO todos los tours incluyen
              // transporte ni desayuno (el RZR y el rappel no).
              { icon: <Bus size={22} strokeWidth={1.5} />, title: 'Transporte', desc: 'En los tours de día completo pasan por ti a tu hospedaje en Xilitla o Ciudad Valles. El RZR sale de la base en Xilitla y el rappel de Ciudad Valles.' },
              { icon: <Coffee size={22} strokeWidth={1.5} />, title: 'Desayuno', desc: 'Buffet en una parada camino a los destinos, en los tours de día completo. El RZR y el rappel no incluyen alimentos.' },
              { icon: <GraduationCap size={22} strokeWidth={1.5} />, title: 'Guía Certificado', desc: 'Guía certificado NOM-09 SECTUR en los tours de día completo; guías de alta montaña en el rappel e instructor en el RZR.' },
              { icon: <ShieldCheck size={22} strokeWidth={1.5} />, title: 'Seguro de viaje', desc: 'Para todos los integrantes, en todos los tours.' },
              { icon: <Leaf size={22} strokeWidth={1.5} />, title: 'Entradas', desc: 'Entradas a todas las atracciones en los tours de día completo.' },
              { icon: <Camera size={22} strokeWidth={1.5} />, title: 'Fotografía', desc: 'Fotos y video del recorrido que toma tu guía, sin costo extra.' },
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
        <FloatingLeaves />
        <p className={styles.eyebrow}>¿Listo para Explorar?</p>
        <h2 className={styles.ctaTitle}>
          La Huasteca <em>te espera</em>
        </h2>
        <p className={styles.ctaDesc}>
          Escríbele a nuestro equipo de tours por WhatsApp al +52 489 125 1458 para armar
          tu itinerario, y reserva tu suite para dormir a 5 minutos de Las Pozas.
        </p>
        <div className={styles.ctaButtons}>
          <a
            href={`${TOURS_WHATSAPP_URL}?text=Hola,%20me%20interesa%20un%20tour%20por%20la%20Huasteca`}
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
