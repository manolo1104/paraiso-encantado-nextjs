import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Leaf, Target, Eye, Heart, TreePine, Users, Play, Quote } from 'lucide-react';
import { HOTEL, lodgingSchema } from '@/lib/seo-hotel';
import { ENTITY_IDS } from '@/lib/seo-entidades';
import styles from './sobre-nosotros.module.css';

const URL = `${HOTEL.url}/sobre-nosotros`;

// Foto real de Las Pozas (CC0, Wikimedia Commons), la misma de /xilitla. Hasta el
// 17 oct 2026 aquí iba jardin-edward-james-aerial.png, hecha con IA.
const FOTO_LAS_POZAS = '/images/las-pozas/columnas-las-pozas-edward-james-xilitla.jpg';

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Sobre Paraíso Encantado · Hotel en Xilitla desde 2018',
  description:
    `La historia del hotel boutique a ${HOTEL.metrosALasPozas} m de Las Pozas de Edward James: ${HOTEL.suites} suites, restaurante huasteco y familia potosina. Conócenos y reserva.`,
  alternates: {
    canonical: 'https://www.paraisoencantado.com/sobre-nosotros',
  },
  openGraph: {
    title: 'El hotel que nació de la selva — Paraíso Encantado, Xilitla',
    description:
      'La historia detrás del hotel boutique sobre el camino al Jardín de Edward James. 13 suites, un restaurante auténtico y un compromiso real con la Huasteca Potosina.',
    url: 'https://www.paraisoencantado.com/sobre-nosotros',
    images: [
      {
        url: '/og/sobre-nosotros.jpg',
        width: 1200,
        height: 630,
        alt: 'Jardín y piscina — Hotel Paraíso Encantado, Xilitla',
      },
    ],
  },
};

// ── Schema AboutPage + el hotel + Person (fundador) ───────────────────────────
/**
 * Una sola entidad (17 oct 2026). Hasta esta fecha la página declaraba un segundo
 * negocio, `#organization` de tipo [Organization, LodgingBusiness], con el mismo
 * nombre, otra dirección (CP 79910) y sus propias reseñas: para Google y las IA eran
 * dos hoteles. Ahora es el MISMO `#hotel` de la portada, armado con `lodgingSchema()`
 * (dirección, punto, Xilitla y perfil de Google de un solo lugar), más lo que solo
 * cuenta esta página: fundación, fundador y correo.
 *
 * Del fundador se quitaron dos cosas que no eran suyas: el `sameAs` (eran las
 * cuentas del HOTEL, y así la persona y el negocio quedaban como la misma cosa) y la
 * `image` (era la foto de la fachada, no de él).
 *
 * El FAQPage que había aquí no se veía en la página y además contradecía la línea
 * del tiempo visible (decía que el hotel abrió en 2018; la línea del tiempo, que
 * abrió en 2019): se quitó.
 */
const aboutSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': `${URL}#webpage`,
      name: 'Sobre Nosotros — Hotel Paraíso Encantado',
      description: 'Historia, misión y valores del Hotel Paraíso Encantado en Xilitla, Huasteca Potosina.',
      url: URL,
      inLanguage: 'es-MX',
      mainEntity: { '@id': ENTITY_IDS.hotel },
      author: { '@id': 'https://www.paraisoencantado.com/#founder' },
      isPartOf: { '@id': ENTITY_IDS.website },
    },
    {
      ...lodgingSchema({
        description: `${HOTEL.suites} suites boutique, ${HOTEL.suitesConSpaPrivado} con spa privado, a ${HOTEL.minutosCaminandoALasPozas} minutos caminando del Jardín Surrealista de Edward James (Las Pozas) en Xilitla, Huasteca Potosina, México.`,
        url: URL,
        // La página enseña el 4.5 y las reseñas de Google en la franja de cifras.
        calificacion: true,
      }),
      email: 'reservas@paraisoencantado.com',
      foundingDate: '2018',
      founder: { '@id': 'https://www.paraisoencantado.com/#founder' },
      numberOfEmployees: { '@type': 'QuantitativeValue', value: 15 },
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
      worksFor: { '@id': ENTITY_IDS.hotel },
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
    // Era «Equipo de Guías · Guías Certificados Locales», como si el hotel operara los
    // tours. No los opera: los opera Huasteca Potosina Tours, otra entidad (hoja de
    // datos verificados, §2). 17 oct 2026.
    initial: 'H',
    name: 'Huasteca Potosina Tours',
    role: 'Los tours de la región',
    bio: 'No es parte del hotel: es la operadora, con guías de la sierra, que lleva los tours a Tamul, Puente de Dios y las cascadas, y pasa por ti al hotel.',
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
  { year: '2019', event: 'Primeras suites', desc: 'Se abren las primeras suites: Jungla y Flor de Liz. El hotel abre sus puertas.' },
  { year: '2020', event: 'El Papán Huasteco', desc: 'Abre el restaurante con cocina auténtica de la Huasteca, ingredientes locales y tortillas hechas a mano.' },
  { year: '2022', event: '13 suites completas', desc: 'La última suite queda lista. 13 espacios únicos, cada uno con nombre e identidad propios.' },
  { year: '2023', event: 'Visita presidencial', desc: 'El hotel recibe al presidente Andrés Manuel López Obrador, en funciones, durante su gira por la Huasteca.' },
  // Sin «verificadas»: Google no comprueba que quien reseña se haya hospedado.
  { year: '2024', event: '+500 reseñas', desc: 'Más de 500 reseñas en Google, con una calificación de 4.5 de 5.' },
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

const aboutBreadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
    { '@type': 'ListItem', position: 2, name: 'Sobre Nosotros', item: 'https://www.paraisoencantado.com/sobre-nosotros' },
  ],
};

// ── Componente ────────────────────────────────────────────────────────────────
export default function SobreNosotrosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutBreadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: 'Hotel Paraíso Encantado — Tour Virtual por Xilitla y las Suites',
        description: 'Recorre el Hotel Paraíso Encantado en Xilitla, Huasteca Potosina: las 13 suites boutique, 4 con spa privado, el jardín tropical, el restaurante El Papán Huasteco y Las Pozas de Edward James a 5 minutos.',
        thumbnailUrl: 'https://img.youtube.com/vi/hD7LbX9Xoqw/maxresdefault.jpg',
        uploadDate: '2024-06-01',
        duration: 'PT3M',
        contentUrl: 'https://www.youtube.com/watch?v=hD7LbX9Xoqw',
        embedUrl: 'https://www.youtube.com/embed/hD7LbX9Xoqw',
        // El mismo `#hotel` de arriba, no una organización anónima con el mismo nombre,
        // y con el mismo tipo (Hotel, que para schema.org también es Organization).
        publisher: {
          '@type': 'Hotel',
          '@id': ENTITY_IDS.hotel,
          name: HOTEL.nombre,
          url: HOTEL.url,
          logo: { '@type': 'ImageObject', url: 'https://www.paraisoencantado.com/logo.png' },
        },
        inLanguage: 'es-MX',
        isFamilyFriendly: true,
      }) }} />

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
              Paraíso Encantado es un hotel boutique en La Conchita, Xilitla, San Luis Potosí,
              a {HOTEL.minutosCaminandoALasPozas} minutos caminando del Jardín Surrealista de Edward James. Nacimos con la convicción
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
              // Las cifras de Google salen de HOTEL (540 reseñas el 13 oct 2026; decía «523+»
              // y «verificadas», y Google no comprueba que quien reseña se haya hospedado).
              { num: `${HOTEL.suites}`, label: 'Suites únicas' },
              { num: `${HOTEL.rating}★`, label: 'Calificación en Google' },
              { num: `${HOTEL.reviewCount}`, label: 'Reseñas en Google' },
              { num: `${HOTEL.minutosCaminandoALasPozas} min`, label: 'A pie del Jardín de Edward James' },
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
                Hoy estamos sobre el camino al Jardín Surrealista de Edward James (Las Pozas), a solo
                {' '}{HOTEL.minutosCaminandoALasPozas} minutos caminando. Nuestros huéspedes llegan a pie al primer turno de la mañana, antes
                que los tours organizados — esa es nuestra ventaja real.
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
                Potosina. Con 13 suites únicas, un restaurante auténtico y tours con guías de la región,
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
                src={FOTO_LAS_POZAS}
                alt="Columnas de concreto de Las Pozas, el jardín surrealista de Edward James, entre la selva de Xilitla"
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
                Los tours de la región no los opera el hotel: los opera Huasteca Potosina Tours,
                con guías de la sierra, y así el viaje deja trabajo en la región.
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
            Reserva directo, sin comisiones de intermediarios.
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
