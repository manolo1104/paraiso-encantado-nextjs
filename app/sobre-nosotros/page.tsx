import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Leaf, Target, Eye, Heart, TreePine, Users, Play, Quote } from 'lucide-react';
import styles from './sobre-nosotros.module.css';

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Hotel Boutique Paraíso Encantado · Xilitla desde 2018 | Nuestra Historia',
  description:
    'El hotel boutique más cercano a Las Pozas de Edward James en Xilitla. Fundado en 2018. 13 suites con spa privado y restaurante de cocina huasteca auténtica.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/sobre-nosotros',
  },
  openGraph: {
    title: 'El hotel que nació de la selva — Paraíso Encantado, Xilitla',
    description:
      'La historia detrás del hotel boutique más cercano al Jardín de Edward James. 13 suites, un restaurante auténtico y un compromiso real con la Huasteca Potosina.',
    url: 'https://www.paraisoencantado.com/sobre-nosotros',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/Areas comunes/DSC09447-HDR.jpg',
        width: 1200,
        height: 630,
        alt: 'Jardín y piscina — Hotel Paraíso Encantado, Xilitla',
      },
    ],
  },
};

// ── Schema AboutPage + Organization + Person (fundador) ───────────────────────
const aboutSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      name: 'Sobre Nosotros — Hotel Paraíso Encantado',
      description: 'Historia, misión y valores del Hotel Paraíso Encantado en Xilitla, Huasteca Potosina.',
      url: 'https://www.paraisoencantado.com/sobre-nosotros',
      mainEntity: { '@id': 'https://www.paraisoencantado.com/#organization' },
      author: { '@id': 'https://www.paraisoencantado.com/#founder' },
    },
    {
      '@type': ['Organization', 'LodgingBusiness'],
      '@id': 'https://www.paraisoencantado.com/#organization',
      name: 'Hotel Paraíso Encantado',
      url: 'https://www.paraisoencantado.com',
      description: '13 suites boutique con spa privado a 5 minutos caminando del Jardín Surrealista de Edward James (Las Pozas) en Xilitla, Huasteca Potosina, México.',
      telephone: '+524891007679',
      email: 'reservas@paraisoencantado.com',
      foundingDate: '2018',
      founder: { '@id': 'https://www.paraisoencantado.com/#founder' },
      numberOfEmployees: { '@type': 'QuantitativeValue', value: 15 },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Xilitla',
        addressRegion: 'San Luis Potosí',
        postalCode: '79910',
        addressCountry: 'MX',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 21.383,
        longitude: -99.002,
      },
      sameAs: [
        'https://www.instagram.com/_paraiso_encantado/',
        'https://www.facebook.com/cabanas.encantado/',
        'https://www.youtube.com/@hotelparaisoencantadoxilit8111',
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.8,
        reviewCount: 514,
        bestRating: 5,
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: '13 suites boutique con spa privado en Xilitla',
      },
    },
    {
      // Person — fundador del hotel. Permite a Google mostrar card de entidad
      // en búsquedas de marca y vincular al propietario con el negocio.
      '@type': 'Person',
      '@id': 'https://www.paraisoencantado.com/#founder',
      name: 'Manolo Covarrubias',
      givenName: 'Manolo',
      familyName: 'Covarrubias',
      jobTitle: 'Fundador y Director',
      description: 'Fundador del Hotel Paraíso Encantado en Xilitla. Nació en la Huasteca Potosina y decidió que el turismo debía enriquecer el territorio, no extractarlo. Lleva años construyendo el hotel con su equipo local.',
      image: {
        '@type': 'ImageObject',
        url: 'https://www.paraisoencantado.com/images/Areas comunes/DSC09456-HDR.jpg',
        description: 'Manolo Covarrubias — Fundador Hotel Paraíso Encantado, Xilitla',
      },
      worksFor: { '@id': 'https://www.paraisoencantado.com/#organization' },
      sameAs: [
        'https://www.instagram.com/_paraiso_encantado/',
        'https://www.facebook.com/cabanas.encantado/',
        'https://www.youtube.com/@hotelparaisoencantadoxilit8111',
        'https://www.linkedin.com/company/hotel-paraiso-encantado-xilitla/',
      ],
      knowsAbout: [
        'Huasteca Potosina',
        'Xilitla',
        'Las Pozas de Edward James',
        'Turismo boutique',
        'Gastronomía huasteca',
      ],
    },
  ],
};

const BOOKING_URL = '/reservar';

// Equipo del hotel
const team = [
  {
    initial: 'M',
    name: 'Manolo Covarrubias',
    role: 'Fundador & Director',
    bio: 'Nació en la Huasteca y decidió que el turismo debía enriquecer al territorio, no extractarlo. Lleva años construyendo el hotel con sus propias manos.',
    color: '#1a2e1a',
  },
  {
    initial: 'R',
    name: 'Restaurante El Papán',
    role: 'Chef & Cocina Huasteca',
    bio: 'La persona detrás del zacahuil, las tortillas de comal y el café de olla que hacen que los huéspedes regresen solo por el desayuno.',
    color: '#5a4e3c',
  },
  {
    initial: 'G',
    name: 'Equipo de Guías',
    role: 'Guías Certificados Locales',
    bio: 'Xilitlecos que conocen cada cascada, cada ruta y cada historia de la sierra. La diferencia entre un tour y una experiencia real.',
    color: '#2e6b8a',
  },
  {
    initial: 'C',
    name: 'Equipo de Suites',
    role: 'Hospitalidad & Housekeeping',
    bio: 'Quienes hacen que cada suite esté lista como si fuera la primera vez. El detalle que nunca se ve pero siempre se siente.',
    color: '#7a5a00',
  },
];

// Timeline de historia
const timeline = [
  { year: '2018', event: 'Nace el proyecto', desc: 'El sueño de un hotel boutique en Xilitla que estuviera a la altura de su naturaleza.' },
  { year: '2019', event: 'Primeras suites', desc: 'Se abren las primeras suites: Jungla y Flor de Lis. El hotel abre sus puertas.' },
  { year: '2020', event: 'El Papán Huasteco', desc: 'Abre el restaurante con cocina auténtica de la Huasteca, ingredientes locales y tortillas hechas a mano.' },
  { year: '2022', event: '13 suites completas', desc: 'La última suite queda lista. 13 espacios únicos, cada uno con nombre e identidad propios.' },
  { year: '2023', event: 'Visita presidencial', desc: 'El hotel recibe a un mandatario en funciones — único hotel boutique de la región en lograrlo.' },
  { year: '2024', event: '+500 reseñas', desc: 'Más de 500 reseñas verificadas con calificación de 4.6 estrellas en Google.' },
];

// Reseñas emocionales de identidad
const identityReviews = [
  {
    text: 'No es solo un hotel. Es el lugar donde entendí por qué Edward James eligió Xilitla para su obra de vida. El Paraíso tiene esa misma magia inexplicable.',
    name: 'Fernanda Obregón',
    location: 'Ciudad de México',
    date: 'Abril 2025',
  },
  {
    text: 'Llevan años compitiendo con cadenas internacionales sin perder su alma local. El restaurante, los guías, la forma en que cuidan la naturaleza — todo grita "aquí trabajamos personas de aquí". Eso es lo que busco cuando viajo.',
    name: 'Pablo Guerrero',
    location: 'Guadalajara',
    date: 'Marzo 2025',
  },
  {
    text: 'Vine tres veces ya. No es la piscina ni las vistas (aunque son increíbles). Es que cada vez que llego me reciben como si hubiera faltado tiempo. Ese detalle humano no se compra — se cultiva.',
    name: 'Diana Muñiz',
    location: 'Monterrey',
    date: 'Febrero 2025',
  },
];

const aboutFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuándo abrió el Hotel Paraíso Encantado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El Hotel Paraíso Encantado abrió sus puertas en 2018 con las primeras suites Jungla y Flor de Lis. Completó sus 13 suites en 2022 y en 2023 recibió una visita presidencial oficial, siendo el único hotel boutique de la región en lograrlo.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Dónde está ubicado exactamente el hotel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Estamos en Xilitla, San Luis Potosí, Huasteca Potosina, a 400 metros del Jardín Surrealista de Edward James (Las Pozas) — 5 minutos caminando. Somos el hotel boutique más cercano a esta atracción Patrimonio Cultural de México.',
      },
    },
    {
      '@type': 'Question',
      name: '¿El hotel tiene algún compromiso ambiental?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Distribuimos nuestras 13 suites para causar el menor impacto posible en la flora nativa de Xilitla. La mayoría de los árboles y plantas que existían antes de la construcción siguen en pie. También trabajamos exclusivamente con productores locales en nuestro restaurante El Papán Huasteco.',
      },
    },
  ],
};

// ── Componente ────────────────────────────────────────────────────────────────
export default function SobreNosotrosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutFaqSchema) }} />

      <main className={styles.main}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <span>Sobre Nosotros</span>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Xilitla, Huasteca Potosina · Desde 2018</p>
            <h1 className={styles.heroTitle}>
              El hotel que <em>nació de la selva</em>
            </h1>
            <p className={styles.heroDesc}>
              Paraíso Encantado es un hotel boutique en el corazón de Xilitla, San Luis Potosí,
              a 5 minutos caminando del Jardín Surrealista de Edward James. Nacimos con la convicción
              de que el turismo puede ser una fuerza positiva — para la comunidad y para la naturaleza.
            </p>
          </div>
          <div className={styles.heroImageWrap}>
            <Image
              src="/images/Areas comunes/DSC09456-HDR.jpg"
              alt="Hotel Paraíso Encantado — Fachada con jardín tropical, Xilitla"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.heroImg}
            />
            <div className={styles.heroImgOverlay} />
          </div>
        </section>

        {/* Stats */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            {[
              { num: '13', label: 'Suites únicas' },
              { num: '4.8★', label: 'Estrellas en Google' },
              { num: '514+', label: 'Reseñas verificadas' },
              { num: '5 min', label: 'A pie del Jardín de Edward James' },
              { num: '2018', label: 'Año de fundación' },
            ].map((s) => (
              <div key={s.label} className={styles.statItem}>
                <span className={styles.statNum}>{s.num}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Historia */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.textBlock}>
              <div className={styles.sectionIcon}><Heart size={28} strokeWidth={1.5} /></div>
              <h2>Nuestra <em>Historia</em></h2>
              <p>
                Paraíso Encantado nació del amor por la Huasteca Potosina y de la convicción de que
                Xilitla merece un hotel que esté a la altura de su naturaleza extraordinaria. Cada una
                de nuestras 13 suites tiene nombre propio, identidad y carácter único — porque creemos
                que una estancia memorable empieza desde que cruzas la puerta.
              </p>
              <p>
                Hoy somos el hotel boutique más cercano al Jardín Surrealista de Edward James (Las Pozas),
                a solo 5 minutos caminando. Nuestros huéspedes llegan antes que los tours organizados y
                disfrutan la magia de Las Pozas casi en soledad — esa es nuestra ventaja real.
              </p>
            </div>
            <div className={styles.historyImages}>
              <div className={styles.historyImg1}>
                <Image src="/images/JUNGLA/PORTADA.JPG" alt="Suite Jungla — Paraíso Encantado" fill sizes="(max-width:768px) 50vw, 25vw" className={styles.imgCover} />
              </div>
              <div className={styles.historyImg2}>
                <Image src="/images/Areas comunes/DSC09447-HDR.jpg" alt="Jardín y piscina del hotel" fill sizes="(max-width:768px) 50vw, 25vw" className={styles.imgCover} />
              </div>
              <div className={styles.historyImg3}>
                <Image src="/images/RESTAURANTE/DSC09679.jpg" alt="El Papán Huasteco" fill sizes="(max-width:768px) 50vw, 25vw" className={styles.imgCover} />
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className={styles.timelineSection} aria-labelledby="timeline-heading">
          <div className={styles.timelineHeader}>
            <p className={styles.eyebrow}>Nuestra trayectoria</p>
            <h2 id="timeline-heading">De la selva al <em>hotel</em></h2>
          </div>
          <div className={styles.timeline}>
            {timeline.map((t, i) => (
              <div key={t.year} className={`${styles.timelineItem} ${i % 2 === 0 ? styles.timelineLeft : styles.timelineRight}`}>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineYear}>{t.year}</span>
                  <h3 className={styles.timelineEvent}>{t.event}</h3>
                  <p className={styles.timelineDesc}>{t.desc}</p>
                </div>
                <div className={styles.timelineDot} aria-hidden="true" />
              </div>
            ))}
            <div className={styles.timelineLine} aria-hidden="true" />
          </div>
        </section>

        {/* Misión y Visión — reescritas con voz propia */}
        <section className={styles.mvSection}>
          <div className={styles.mvGrid}>
            <div className={styles.mvCard}>
              <div className={styles.mvIcon}><Target size={32} strokeWidth={1.5} /></div>
              <h3>Misión</h3>
              <p>
                Que cada huésped se vaya de Xilitla con una historia que contar — sobre la selva,
                sobre Las Pozas, sobre la gente que hace este lugar. No operamos habitaciones:
                construimos memorias que duran décadas.
              </p>
            </div>
            <div className={styles.mvCard}>
              <div className={styles.mvIcon}><Eye size={32} strokeWidth={1.5} /></div>
              <h3>Visión</h3>
              <p>
                Ser el hotel que prueba que el turismo puede enriquecer, no extractar, la Huasteca
                Potosina. Con 13 suites únicas, un restaurante auténtico y guías locales certificados,
                queremos que Xilitla sea conocida en el mundo sin perder su alma.
              </p>
            </div>
          </div>
        </section>

        {/* Video */}
        <section className={styles.videoSection} aria-labelledby="video-heading">
          <div className={styles.videoHeader}>
            <p className={styles.eyebrow}>Conoce el hotel</p>
            <h2 id="video-heading">Paraíso Encantado <em>en video</em></h2>
          </div>
          <div className={styles.videoWrap}>
            <iframe
              src="https://www.youtube.com/embed/hD7LbX9Xoqw?rel=0&modestbranding=1"
              title="Hotel Paraíso Encantado — Xilitla, Huasteca Potosina"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className={styles.videoIframe}
            />
          </div>
        </section>

        {/* Equipo */}
        <section className={styles.teamSection} aria-labelledby="team-heading">
          <div className={styles.teamHeader}>
            <p className={styles.eyebrow}>Las personas detrás del hotel</p>
            <h2 id="team-heading">Nuestro <em>Equipo</em></h2>
            <p className={styles.teamSubtitle}>
              Paraíso Encantado no es una cadena hotelera — es un proyecto humano.
              Estas son algunas de las personas que lo hacen posible cada día.
            </p>
          </div>
          <div className={styles.teamGrid}>
            {team.map((m) => (
              <div key={m.name} className={styles.teamCard}>
                <div className={styles.teamAvatar} style={{ background: m.color }} aria-hidden="true">
                  {m.initial}
                </div>
                <h3 className={styles.teamName}>{m.name}</h3>
                <p className={styles.teamRole}>{m.role}</p>
                <p className={styles.teamBio}>{m.bio}</p>
              </div>
            ))}
          </div>
          <p className={styles.teamNote}>
            * Las fotos del equipo se actualizan próximamente.
          </p>
        </section>

        {/* Responsabilidad Ambiental */}
        <section className={styles.ecoSection}>
          <div className={styles.ecoInner}>
            <div className={styles.ecoText}>
              <div className={styles.ecoIcon}><Leaf size={36} strokeWidth={1.3} /></div>
              <h2>Responsabilidad <em>Ambiental</em></h2>
              <p>
                Distribuimos nuestras suites para causar el menor impacto posible en la flora
                de Xilitla. La mayoría de los árboles y plantas que existían en la zona cuando
                llegamos siguen aquí — porque construir con respeto no es opcional, es la única
                forma de hacer turismo honesto.
              </p>
              <div className={styles.ecoPillars}>
                <div className={styles.ecoPillar}><TreePine size={20} strokeWidth={1.5} /><span>Conservación de flora nativa</span></div>
                <div className={styles.ecoPillar}><Users size={20} strokeWidth={1.5} /><span>Productores locales en el restaurante</span></div>
                <div className={styles.ecoPillar}><Leaf size={20} strokeWidth={1.5} /><span>Turismo de bajo impacto</span></div>
              </div>
            </div>
            <div className={styles.ecoImageWrap}>
              <Image
                src="/images/atracciones/jardin-edward-james-aerial.png"
                alt="Las Pozas de Edward James — Patrimonio Cultural de México, Xilitla"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className={styles.ecoImage}
              />
            </div>
          </div>
        </section>

        {/* Comunidad */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.textBlock}>
              <div className={styles.sectionIcon}><Users size={28} strokeWidth={1.5} /></div>
              <h2>Compromiso con la <em>Comunidad</em></h2>
              <p>
                Trabajamos con productores de Xilitla y la sierra potosina. El Papán Huasteco usa
                maíz criollo, frijol negro, chile serrano y hierbas del huerto propio — cada platillo
                en nuestra mesa representa el trabajo de familias de la región.
              </p>
              <p>
                Nuestros tours los operan guías certificados locales, generando empleo directo.
                Creemos que el turismo responsable es la única forma de preservar la Huasteca
                para las generaciones que vienen.
              </p>
            </div>
            <div className={styles.communityImages}>
              <div className={styles.communityImg1}>
                <Image src="/images/RESTAURANTE/DSCF1117.jpg" alt="Gastronomía huasteca — El Papán" fill sizes="(max-width:768px) 100vw, 30vw" className={styles.imgCover} />
              </div>
              <div className={styles.communityImg2}>
                <Image src="/images/atracciones/cascada_de_tamul.jpg" alt="Tour Cascada Tamul — guías locales" fill sizes="(max-width:768px) 100vw, 30vw" className={styles.imgCover} />
              </div>
            </div>
          </div>
        </section>

        {/* Lo que dicen quienes nos conocen */}
        <section className={styles.identityReviewsSection} aria-labelledby="identity-reviews-heading">
          <div className={styles.identityReviewsHeader}>
            <p className={styles.eyebrow}>Voces de quienes lo vivieron</p>
            <h2 id="identity-reviews-heading">Lo que dicen <em>quienes nos conocen</em></h2>
          </div>
          <div className={styles.identityReviewsGrid}>
            {identityReviews.map((r) => (
              <div key={r.name} className={styles.identityReviewCard}>
                <Quote size={24} className={styles.identityReviewQuote} aria-hidden="true" />
                <p className={styles.identityReviewText}>{r.text}</p>
                <div className={styles.identityReviewMeta}>
                  <span className={styles.identityReviewName}>{r.name}</span>
                  <span className={styles.identityReviewDetail}>{r.location} · {r.date} · ★★★★★</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection}>
          <p className={styles.eyebrow}>Únete a Nuestra Historia</p>
          <h2 className={styles.ctaTitle}>
            Ven a conocer <em>Paraíso Encantado</em>
          </h2>
          <p className={styles.ctaDesc}>
            Una experiencia auténtica en la Huasteca Potosina te espera.
            Reserva directo y ahorra hasta 15% vs. plataformas externas.
          </p>
          <div className={styles.ctaButtons}>
            <a href={BOOKING_URL} className={styles.ctaBtn}>Reservar Suite</a>
            <Link href="/contacto" className={styles.ctaBtnOutline}>Contáctanos</Link>
          </div>
        </section>
      </main>
    </>
  );
}
