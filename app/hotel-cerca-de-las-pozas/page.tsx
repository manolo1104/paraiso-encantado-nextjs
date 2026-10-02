import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Droplets, Sunrise, Utensils, ShieldCheck, Leaf } from 'lucide-react';
import { suites } from '@/data/suites';
import FloatingLeaves from '@/components/FloatingLeaves';
import { HOTEL } from '@/lib/seo-hotel';
import styles from './hotel-las-pozas.module.css';

export const metadata: Metadata = {
  // Se conserva "Edward James" porque es parte de la consulta real ("hoteles
  // las pozas", "hotel edward james xilitla"); lo que sale es la marca, que
  // Google ya muestra arriba en la línea del dominio.
  title: 'Hotel Cerca de Las Pozas de Edward James · A 400 m a pie',
  description:
    'Duerme a 400 metros de Las Pozas de Edward James y llega caminando a tu turno, sin traslado. 13 suites boutique en Xilitla. Reserva directa.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/hotel-cerca-de-las-pozas',
  },
  openGraph: {
    title: 'Hotel a 400 m de Las Pozas de Edward James — Xilitla, Huasteca Potosina',
    description:
      'A solo 5 minutos caminando del Jardín Surrealista, sobre el camino a Las Pozas. 13 suites boutique, 4 con spa privado, en Xilitla, San Luis Potosí.',
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

// Una sola lista para el FAQ visible y el FAQPage del JSON-LD: antes eran dos
// textos distintos y el schema decía "el hotel boutique más cercano", que nuestra
// propia tabla de /hoteles-en-xilitla contradice (2 oct 2026).
const FAQS = [
  {
    q: '¿Qué tan cerca está el hotel de Las Pozas de Edward James?',
    a: `El Hotel Paraíso Encantado está sobre el camino a Las Pozas, a ${HOTEL.metrosALasPozas} metros (${HOTEL.minutosCaminandoALasPozas} minutos caminando) del Jardín Surrealista de Edward James. Vas y vuelves a pie, sin transporte.`,
  },
  {
    q: '¿Puedo caminar desde el hotel hasta Las Pozas?',
    a: `Sí. El camino es empedrado y toma unos ${HOTEL.minutosCaminandoALasPozas} minutos. No necesitas taxi ni auto, y mejor así: el jardín no tiene estacionamiento. Vas a tu turno en la mañana y regresas al hotel a comer y a descansar.`,
  },
  {
    q: '¿Cómo se reserva la entrada a Las Pozas y cuánto cuesta?',
    a: 'Por ahora no hay venta en línea: apartas tu turno en el sistema oficial de reservas (hasta 60 días antes) y pagas en la taquilla. La entrada cuesta $180 por adulto y $120 para niños de 6 a 12 años y mayores de 65; menores de 6, gratis. La guía es obligatoria ($30 por persona) y el recorrido dura 1 h 30 min. El jardín abre de miércoles a lunes, de 9:00 a 18:00, con último acceso a las 16:00; cierra los martes. No se permite nadar en las pozas.',
  },
  {
    q: '¿El hotel organiza tours a Las Pozas?',
    a: 'Las Pozas está tan cerca que no necesitas tour: llegas caminando. Para destinos más lejanos —la Cascada de Tamul (1 h a 1 h 30 de manejo), Puente de Dios (2 h a 2 h 30) o El Meco (3 h o más)— los tours los opera Huasteca Potosina Tours: pasan por ti al hotel, van con guía certificado y son de día completo.',
  },
  {
    q: '¿Qué hace diferente a Paraíso Encantado de otros hoteles en Xilitla?',
    a: `Tres cosas: 1) Estamos sobre el camino a Las Pozas, a ${HOTEL.metrosALasPozas} metros del jardín. 2) Tenemos ${HOTEL.suitesConSpaPrivado} suites con spa o tina de hidromasaje privada — el agua no se comparte con nadie. 3) Precios directos, sin comisiones de Booking o Expedia, con reembolso del 100% si cancelas hasta 7 días antes.`,
  },
  {
    q: '¿Cuánto cuesta hospedarse en Paraíso Encantado?',
    a: `Las suites comienzan desde $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche para 2 personas. Al reservar directamente en paraisoencantado.com no pagas comisiones de intermediarios y ves las ${HOTEL.suites} suites completas — en las OTAs no siempre está todo el inventario.`,
  },
  {
    q: '¿Tienen piscina compartida?',
    a: `Sí, hay piscina del hotel para todos los huéspedes. Además, ${HOTEL.suitesConSpaPrivado} suites cuentan con su propia piscina spa o tina de hidromasaje privada — no compartida — que puedes usar a cualquier hora.`,
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LodgingBusiness',
      // Mismo `@id` que el resto del sitio: una entidad descrita por muchas
      // páginas, no una entidad nueva por página.
      '@id': 'https://www.paraisoencantado.com/#hotel',
      name: 'Hotel Paraíso Encantado',
      description:
        'Hotel boutique en Xilitla sobre el camino a Las Pozas de Edward James, a 400 metros (5 minutos caminando) del Jardín Surrealista. 13 suites boutique, 4 con spa privado, Huasteca Potosina.',
      url: 'https://www.paraisoencantado.com/hotel-cerca-de-las-pozas',
      image: 'https://www.paraisoencantado.com/images/JUNGLA/PORTADA.JPG',
      telephone: '+524891007679',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Xilitla',
        addressRegion: 'San Luis Potosí',
        addressCountry: 'MX',
      },
      // Coordenadas corregidas el 2 oct 2026 (OSM): las anteriores (21.383, -99.002)
      // caían a 1.7 km del hotel.
      geo: { '@type': 'GeoCoordinates', latitude: 21.395, longitude: -98.9915 },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.5,
        reviewCount: 523,
        bestRating: 5,
      },
      nearbyAttractions: [
        {
          '@type': 'TouristAttraction',
          '@id': 'https://www.wikidata.org/wiki/Q11688402',
          name: 'Las Pozas de Edward James',
          sameAs: ['https://es.wikipedia.org/wiki/Las_Pozas', 'https://www.wikidata.org/wiki/Q11688402'],
          // Pin oficial de laspozasxilitla.org.mx; el anterior (21.387, -98.994) caía a 1.1 km.
          geo: { '@type': 'GeoCoordinates', latitude: 21.3967, longitude: -98.9966 },
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
      mainEntity: FAQS.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

const REASONS = [
  {
    icon: <MapPin size={22} strokeWidth={1.5} />,
    title: '5 Minutos Caminando',
    body: `Estamos sobre el camino a Las Pozas, a ${HOTEL.metrosALasPozas} metros del jardín. Sales de tu suite y en ${HOTEL.minutosCaminandoALasPozas} minutos estás en la entrada —sin taxi ni estacionamiento, que el jardín no tiene.`,
  },
  {
    icon: <Droplets size={22} strokeWidth={1.5} />,
    title: 'Suites con Spa Privado',
    body: '4 de nuestras 13 suites tienen su propia piscina spa o tina de hidromasaje privada. No compartes el agua con nadie. Llega de Las Pozas y sumérgete en tu spa privado con vista a la selva.',
  },
  {
    icon: <Sunrise size={22} strokeWidth={1.5} />,
    title: 'Salida Antes que los Grupos',
    body: 'Los tours desde Ciudad Valles llegan a Las Pozas hacia las 10-11 AM. Tú puedes entrar en el primer turno de la mañana, con tu reservación hecha, antes de que lleguen los grupos.',
  },
  {
    icon: <Utensils size={22} strokeWidth={1.5} />,
    title: 'Restaurante El Papán',
    body: 'Cocina huasteca auténtica en el hotel. Desayunas zacahuil, bocoles y café de olla antes de ir al jardín. Sin salir de la propiedad.',
  },
  {
    icon: <ShieldCheck size={22} strokeWidth={1.5} />,
    title: 'Reserva Directa — Sin Comisiones',
    body: 'Al reservar en paraisoencantado.com no pagas comisiones de intermediarios y ves las 13 suites completas — en las OTAs no siempre está todo el inventario. Confirmación instantánea y reembolso del 100% si cancelas hasta 7 días antes.',
  },
  {
    icon: <Leaf size={22} strokeWidth={1.5} />,
    title: 'Tours a Toda la Huasteca',
    body: 'Huasteca Potosina Tours opera los tours a la Cascada de Tamul, Puente de Dios y más, y pasa por ti al hotel. Guía certificado, transporte y desayuno incluidos.',
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
            <h1>Hotel Boutique <em>a {HOTEL.metrosALasPozas} Metros</em><br />de Las Pozas de Edward James</h1>
            <p className={styles.heroSub}>
              A solo <strong>5 minutos caminando</strong> del Jardín Surrealista. 13 suites boutique, 4 con spa privado.
              Despierta y camina hasta Las Pozas para el primer turno, antes de que lleguen los grupos.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/reservar" className={styles.heroCtaPrimary}>Reservar Ahora</Link>
              <Link href="/habitaciones" className={styles.heroCtaSecondary}>Ver las 13 Suites</Link>
            </div>
          </div>
        </section>

        {/* DISTANCIA VISUAL */}
        <section className={styles.distance}>
          <FloatingLeaves />
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
              <span className={styles.distanceLabel}>boutique, {HOTEL.suitesConSpaPrivado} con spa privado</span>
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
                Edward James (1907–1984) fue un poeta y mecenas británico, amigo de Salvador Dalí y René
                Magritte. Conoció Xilitla en 1945 y en 1947 compró aquí una finca, primero para orquídeas
                y animales; tras la helada de 1962 empezó a levantar su visión más personal —un jardín
                escultórico de concreto en plena selva tropical— y siguió construyendo hasta su muerte,
                en 1984.
              </p>
              <p>
                Más de 30 estructuras de varios pisos —columnas, arcos, espirales y torres sin techo— están
                entrelazadas con pozas naturales de agua cristalina, que son solo para verse: ahí no se
                nada. Las orquídeas y helechos gigantes crecen entre las esculturas. Cada ángulo es
                diferente; cada visita, única.
              </p>
              <p>
                Desde Hotel Paraíso Encantado puedes entrar en el primer turno, a las 9 AM —con tu
                reservación hecha y antes de que lleguen los autobuses desde Ciudad Valles—, y regresar
                a comer caminando. El recorrido es guiado y dura 1 h 30 min; el jardín cierra los martes
                y el último acceso es a las 16:00. La proximidad cambia completamente la experiencia.
              </p>
              <Link href="/xilitla" className={styles.aboutLink}>
                Guía completa de Xilitla →
              </Link>
              <br />
              <Link href="/mejor-hotel-xilitla" className={styles.aboutLink}>
                Por qué somos el mejor hotel de Xilitla →
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
              13 espacios únicos, 4 con spa privado. Cada uno con su propio diseño y carácter.
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
              {FAQS.map((f) => (
                <div key={f.q} className={styles.faqItem}>
                  <dt>{f.q}</dt>
                  <dd>{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className={styles.finalCta}>
          <FloatingLeaves />
          <div className={styles.finalCtaInner}>
            <h2>Despierta a 5 Minutos<br />del Jardín de Edward James</h2>
            <p>Confirma tu fecha y elige la suite perfecta para tu visita a Las Pozas.</p>
            <div className={styles.finalCtaBtns}>
              <Link href="/reservar" className={styles.finalCtaPrimary}>Reservar Ahora</Link>
              <a href="https://wa.me/524891007679" target="_blank" rel="noopener noreferrer" className={styles.finalCtaWa}>
                Preguntar por WhatsApp
              </a>
            </div>
            <p className={styles.finalCtaNote}>Confirmación instantánea · Cancelación flexible · Sin comisiones</p>
          </div>
        </section>

      </main>
    </>
  );
}
