import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import styles from './xilitla.module.css';

export const metadata: Metadata = {
  title: 'Qué Hacer en Xilitla, SLP · Guía Completa 2026 | Paraíso Encantado',
  description:
    'Guía definitiva de Xilitla, San Luis Potosí: Las Pozas de Edward James, Cascada Tamul, Puente de Dios, cuándo ir, cómo llegar y dónde hospedarse. Todo desde un solo hotel.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/xilitla',
  },
  openGraph: {
    title: 'Qué Hacer en Xilitla — Guía Completa de la Huasteca Potosina',
    description:
      'Las Pozas de Edward James, Cascada Tamul, gastronomía huasteca y naturaleza única. Todo lo que necesitas saber para visitar Xilitla, San Luis Potosí.',
    url: 'https://www.paraisoencantado.com/xilitla',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/atracciones/jardin-edward-james-aerial.png',
        width: 1200,
        height: 630,
        alt: 'Las Pozas de Edward James — Xilitla, San Luis Potosí, Huasteca Potosina',
      },
    ],
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TouristDestination',
      name: 'Xilitla',
      description:
        'Municipio de San Luis Potosí ubicado en la Huasteca Potosina, famoso por Las Pozas de Edward James, su biodiversidad y su arquitectura colonial enclavada en la selva.',
      url: 'https://www.paraisoencantado.com/xilitla',
      image: 'https://www.paraisoencantado.com/images/atracciones/jardin-edward-james-aerial.png',
      geo: { '@type': 'GeoCoordinates', latitude: 21.383, longitude: -99.002 },
      touristType: ['Nature tourists', 'Cultural tourists', 'Adventure tourists'],
      includesAttraction: [
        {
          '@type': 'TouristAttraction',
          name: 'Las Pozas de Edward James',
          description:
            'Jardín surrealista único en el mundo creado por el excéntrico poeta inglés Edward James en las décadas de 1960 a 1980. Esculturas de concreto de varios pisos rodeadas de selva tropical y pozas de agua cristalina.',
          url: 'https://www.paraisoencantado.com/xilitla#las-pozas',
          image: 'https://www.paraisoencantado.com/images/atracciones/jardin_de_edward_james.jpg',
        },
        {
          '@type': 'TouristAttraction',
          name: 'Cascada de Tamul',
          description:
            'Cascada más alta de San Luis Potosí con 105 metros de caída. Se accede en canoa por el río Tampaón.',
          url: 'https://www.paraisoencantado.com/xilitla#tamul',
          image: 'https://www.paraisoencantado.com/images/atracciones/cascada_de_tamul.jpg',
        },
        {
          '@type': 'TouristAttraction',
          name: 'Sótano de las Huahuastecas',
          description: 'Caverna vertical de 450 metros de profundidad, una de las más grandes de México.',
          url: 'https://www.paraisoencantado.com/xilitla#sotano',
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
        { '@type': 'ListItem', position: 2, name: 'Xilitla — Qué Hacer', item: 'https://www.paraisoencantado.com/xilitla' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Qué es lo más famoso de Xilitla?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Las Pozas de Edward James (también conocidas como el Jardín Surrealista de Edward James) son la principal atracción. Es un jardín escultórico único en el mundo, declarado Patrimonio Cultural de México.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuántos días se necesitan para visitar Xilitla?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Con 2-3 noches tienes tiempo para visitar Las Pozas con calma, hacer un tour a Cascada Tamul y explorar el pueblo. Si quieres combinar con Puente de Dios o Cascada El Meco, recomendamos 3-4 noches.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuándo es la mejor época para visitar Xilitla?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'La temporada seca (noviembre a mayo) es ideal para actividades acuáticas como Tamul en canoa. De junio a octubre llueve más pero la selva está espectacularmente verde. Xilitla se visita todo el año.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo llegar a Xilitla desde Ciudad de México?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'En carro son aproximadamente 5-6 horas por la carretera México-Tampico pasando por Ciudad Valles. También hay autobuses directos desde la Central del Norte CDMX hasta Ciudad Valles, y de ahí transporte a Xilitla (45 min).',
          },
        },
        {
          '@type': 'Question',
          name: '¿Hay hotel cerca de Las Pozas de Edward James?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Hotel Paraíso Encantado está a solo 5 minutos caminando de Las Pozas — es el hotel boutique más cercano al jardín en todo Xilitla. Con 13 suites con spa privado y reserva directa sin comisiones en paraisoencantado.com.',
          },
        },
      ],
    },
  ],
};

const ATTRACTIONS = [
  {
    id: 'las-pozas',
    title: 'Las Pozas de Edward James',
    subtitle: 'El Jardín Surrealista',
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    imageAlt: 'Las Pozas de Edward James — Jardín Surrealista, Xilitla, San Luis Potosí',
    distance: 'A 5 min caminando desde el hotel',
    time: '3-4 horas',
    body: `Las Pozas es una de las obras de arte más inusuales y fascinantes del mundo. El poeta y mecenas inglés Edward James (1907-1984) invirtió más de 5 millones de dólares y 20 años de trabajo en construir un jardín escultórico surrealista en plena selva tropical de Xilitla.

Las esculturas de concreto —columnas, arcos, espirales y estructuras sin techo— surgen entre la vegetación tropical densa y ríos de agua cristalina. El jardín tiene aproximadamente 32 estructuras de concreto entrelazadas con pozas naturales donde puedes nadar.

Cada ángulo es una fotografía diferente. Llegar temprano (apertura a las 9 AM) te permite disfrutarlo casi en soledad antes de que lleguen los grupos organizados desde Ciudad Valles.`,
  },
  {
    id: 'tamul',
    title: 'Cascada de Tamul',
    subtitle: 'La más impresionante de SLP',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    imageAlt: 'Cascada de Tamul — la más alta de San Luis Potosí, Huasteca Potosina',
    distance: '2.5 horas desde Xilitla',
    time: 'Tour de día completo',
    body: `La Cascada de Tamul es la más alta e impresionante de San Luis Potosí: 105 metros de caída libre donde el río Santa María se une al Tampaón. El acceso es exclusivamente en canoa —navegas 3 kilómetros por el río entre paredes de roca calcárea cubierta de vegetación— y la cascada aparece de golpe a la vuelta de un recodo.

El recorrido completo incluye el Sótano de las Huahuastecas (una caverna vertical de 450 metros) y el Cenote Cueva del Agua. Son 10-12 horas de excursión. Los tours salen a las 7 AM desde el hotel.`,
  },
  {
    id: 'puente-de-dios',
    title: 'Puente de Dios',
    subtitle: 'Agua turquesa y selva',
    image: '/images/atracciones/puente_de_dios.jpg',
    imageAlt: 'Puente de Dios — aguas turquesas, Huasteca Potosina desde Xilitla',
    distance: '1.5 horas desde Xilitla',
    time: 'Tour de día completo',
    body: `El Puente de Dios es un arco natural de piedra caliza bajo el cual fluye un río de aguas turquesas casi increíbles. El color del agua se debe a la alta concentración de minerales calcáreos —similar al agua de las cenotes de Yucatán, pero en plena sierra potosina.

El tour incluye Hacienda Los Gómez y las Siete Cascadas escalonadas donde puedes nadar. El agua tiene temperatura perfecta todo el año (entre 22 y 24°C). Ideal para familias y para quienes buscan un día más relajado que la expedición Tamul.`,
  },
  {
    id: 'el-meco',
    title: 'Cascada El Meco',
    subtitle: 'Mirador y cascadas en cadena',
    image: '/images/atracciones/cascada_el_salto.jpg',
    imageAlt: 'Cascada El Meco y mirador — Sierra Potosina, Huasteca desde Xilitla',
    distance: '1 hora desde Xilitla',
    time: 'Tour de medio día a día completo',
    body: `La Ruta Acuática incluye la Cascada El Meco con su mirador panorámico desde donde se ven tres cascadas al mismo tiempo con la selva como fondo. Es uno de los paisajes más fotogénicos de toda la Huasteca. A diferencia de Tamul, este tour es más accesible para niños pequeños y personas con movilidad reducida.`,
  },
];

export default function XilitlaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroImg}>
            <Image
              src="/images/atracciones/jardin-edward-james-aerial.png"
              alt="Vista aérea de Las Pozas de Edward James — Xilitla, San Luis Potosí"
              fill
              priority
              quality={80}
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Inicio</Link>
              <span aria-hidden="true"> › </span>
              <span>Xilitla</span>
            </nav>
            <p className={styles.eyebrow}>Huasteca Potosina · San Luis Potosí</p>
            <h1>Qué Hacer en <em>Xilitla</em></h1>
            <p className={styles.heroSub}>
              Guía completa de atracciones, cómo llegar, cuándo ir y dónde hospedarse
              en uno de los destinos más extraordinarios de México.
            </p>
          </div>
        </section>

        {/* INTRO */}
        <section className={styles.intro}>
          <div className={styles.introInner}>
            <h2>Xilitla: La Joya Escondida de la Sierra Potosina</h2>
            <p>
              Xilitla es un municipio de San Luis Potosí ubicado a 1,100 metros de altitud en la sierra
              que separa el altiplano de la Huasteca. Su microclima subtropical —caluroso en el día, fresco
              en la noche— permite que convivan orquídeas, helechos gigantes, cascadas de agua turquesa y
              una arquitectura colonial enclavada en plena selva.
            </p>
            <p>
              El mundo descubrió Xilitla gracias a <strong>Las Pozas de Edward James</strong>, el jardín
              surrealista más singular del planeta. Pero el destino es mucho más que un jardín: la Cascada
              de Tamul (la más alta de San Luis Potosí), el Puente de Dios, la gastronomía huasteca y la
              hospitalidad de su gente hacen de Xilitla un lugar al que siempre se quiere regresar.
            </p>
            <div className={styles.quickFacts}>
              <div className={styles.fact}><strong>Altitud</strong><span>1,100 msnm</span></div>
              <div className={styles.fact}><strong>Clima</strong><span>18–28°C todo el año</span></div>
              <div className={styles.fact}><strong>Desde CDMX</strong><span>~5.5 horas en carro</span></div>
              <div className={styles.fact}><strong>Mejor época</strong><span>Nov – Mayo</span></div>
            </div>
          </div>
        </section>

        {/* ATRACCIONES */}
        <section className={styles.attractions}>
          <div className={styles.attractionsInner}>
            <h2>Principales Atracciones de Xilitla</h2>
            {ATTRACTIONS.map((a, i) => (
              <article key={a.id} id={a.id} className={`${styles.attraction} ${i % 2 === 1 ? styles.attractionReverse : ''}`}>
                <div className={styles.attractionImg}>
                  <Image
                    src={a.image}
                    alt={a.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={75}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.attractionContent}>
                  <p className={styles.attractionSub}>{a.subtitle}</p>
                  <h3>{a.title}</h3>
                  <div className={styles.attractionMeta}>
                    <span>📍 {a.distance}</span>
                    <span>🕐 {a.time}</span>
                  </div>
                  {a.body.split('\n\n').map((para, j) => (
                    <p key={j}>{para}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CÓMO LLEGAR */}
        <section className={styles.howTo}>
          <div className={styles.howToInner}>
            <h2>Cómo Llegar a Xilitla</h2>
            <div className={styles.howToGrid}>
              <div className={styles.howToCard}>
                <h3>En Carro</h3>
                <p>
                  Desde Ciudad de México: Toma la autopista México–Tampico (MEX-85D) hasta Ciudad Valles
                  (~4 horas), luego la carretera federal 120 hacia Xilitla (~1.5 horas más). Total: 5.5–6 horas.
                </p>
                <p>
                  Desde Monterrey: Carretera Linares–Cd. Valles (~3.5 horas) más el tramo a Xilitla. Total: ~5 horas.
                </p>
                <p>
                  Desde San Luis Potosí: Carretera SLP–Cd. Valles y luego a Xilitla. Total: ~3.5 horas.
                </p>
              </div>
              <div className={styles.howToCard}>
                <h3>En Autobús</h3>
                <p>
                  Líneas <strong>Viva Aerobús / Futura / Grupo Senda</strong> tienen salidas diarias desde
                  Terminal Central del Norte (CDMX) y Central de Autobuses de San Luis Potosí hasta
                  <strong> Ciudad Valles</strong>, que es la terminal más cercana.
                </p>
                <p>
                  Desde Ciudad Valles hay autobuses locales (Transportes Huastecos) hasta Xilitla cada 1-2 horas.
                  El trayecto Ciudad Valles–Xilitla toma ~45 minutos.
                </p>
              </div>
              <div className={styles.howToCard}>
                <h3>En Avión</h3>
                <p>
                  El aeropuerto más cercano es <strong>Tampico (TAM)</strong>, a ~2.5 horas en carro.
                  También puedes volar a San Luis Potosí (SLP), a ~3.5 horas, o Ciudad de México y manejar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CUÁNDO IR */}
        <section className={styles.whenTo}>
          <div className={styles.whenToInner}>
            <h2>Cuándo Visitar Xilitla</h2>
            <p>
              Xilitla tiene clima subtropical durante todo el año, lo que significa que <em>siempre</em> hay algo que
              hacer. La temperatura oscila entre 18°C y 28°C. Pero la experiencia varía bastante según la época:
            </p>
            <div className={styles.seasons}>
              <div className={styles.season}>
                <h3>Temporada Seca · Nov – Mayo</h3>
                <p>
                  Ideal para tours acuáticos: Cascada Tamul en canoa, Puente de Dios y pozas naturales.
                  El nivel del río es más bajo pero el agua está más clara y las corrientes son más seguras.
                  Semana Santa (marzo-abril) es temporada alta — reserva con anticipación.
                </p>
              </div>
              <div className={styles.season}>
                <h3>Temporada de Lluvia · Jun – Oct</h3>
                <p>
                  La selva de Las Pozas alcanza su máximo esplendor: verde intenso, cascadas al 100% de caudal,
                  flores en todo el jardín. Las lluvias son por las tardes. Algunos tours acuáticos pueden
                  cancelarse por crecidas — confirma disponibilidad antes de llegar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* QUÉ COMER */}
        <section className={styles.food}>
          <div className={styles.foodInner}>
            <h2>Gastronomía de la Huasteca Potosina</h2>
            <p>
              La cocina huasteca es una de las más ricas de México y Xilitla es el mejor lugar para probarla auténtica:
            </p>
            <ul className={styles.foodList}>
              <li><strong>Zacahuil</strong> — El "tamal gigante" de la Huasteca. Una mezcla de masa de maíz gruesa, chile rojo y carne de cerdo o pollo envuelta en hoja de plátano. Se cuece lentamente durante horas. Un platillo de temporada y celebración.</li>
              <li><strong>Bocoles</strong> — Tortillas gruesas de masa de maíz mezclada con frijoles, muy populares en el desayuno huasteco.</li>
              <li><strong>Pemole</strong> — Bebida tradicional de maíz tostado con piloncillo y especias. Fría en temporada de calor.</li>
              <li><strong>Enchiladas huastecas</strong> — Con salsa de chile piquín, queso seco local y crema. Diferentes a cualquier enchilada que hayas probado.</li>
              <li><strong>Café de la región</strong> — La sierra potosina produce café de altura excelente. El café de olla con canela es el desayuno clásico en Xilitla.</li>
            </ul>
            <p>
              En el <strong>Restaurante El Papán Huasteco</strong> del Hotel Paraíso Encantado encontrarás
              zacahuil de temporada, bocoles hechos a mano y el mejor café de olla de Xilitla —a pasos de tu suite.
            </p>
          </div>
        </section>

        {/* DÓNDE HOSPEDARSE — CTA */}
        <section className={styles.stay}>
          <div className={styles.stayInner}>
            <div className={styles.stayImg}>
              <Image
                src="/images/JUNGLA/PORTADA.JPG"
                alt="Suite Jungla con piscina spa privada — Hotel Paraíso Encantado, Xilitla"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.stayContent}>
              <p className={styles.stayEyebrow}>El Hotel Más Cercano a Las Pozas</p>
              <h2>Dónde Hospedarse en Xilitla</h2>
              <p>
                <strong>Hotel Paraíso Encantado</strong> está a <strong>5 minutos caminando</strong> del
                Jardín de Edward James —la distancia más corta de cualquier hotel en Xilitla. Llegas a Las Pozas
                antes que los grupos organizados y disfrutas el jardín casi en soledad.
              </p>
              <p>
                13 suites boutique únicas, cada una con piscina spa privada, terraza y vista a la selva.
                Desde <strong>$1,200 MXN por noche</strong>. Reserva directa: sin comisiones, cancelación
                gratuita 48 horas antes, confirmación instantánea.
              </p>
              <div className={styles.stayActions}>
                <Link href="/habitaciones" className={styles.stayCtaPrimary}>
                  Ver las 13 Suites
                </Link>
                <Link href="/reservar" className={styles.stayCtaSecondary}>
                  Reservar Ahora
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.faq}>
          <div className={styles.faqInner}>
            <h2>Preguntas Frecuentes sobre Xilitla</h2>
            <dl className={styles.faqList}>
              <div className={styles.faqItem}>
                <dt>¿Qué es lo más famoso de Xilitla?</dt>
                <dd>Las Pozas de Edward James, el jardín surrealista único en el mundo. Esculturas de concreto de varios pisos rodeadas de selva tropical y agua cristalina. Declarado Patrimonio Cultural de México.</dd>
              </div>
              <div className={styles.faqItem}>
                <dt>¿Cuántos días se necesitan para visitar Xilitla?</dt>
                <dd>Con 2-3 noches tienes tiempo para Las Pozas con calma y un tour a Cascada Tamul. Para combinar Puente de Dios y El Meco recomendamos 3-4 noches.</dd>
              </div>
              <div className={styles.faqItem}>
                <dt>¿Cuándo es la mejor época para visitar?</dt>
                <dd>La temporada seca (noviembre a mayo) es ideal para tours acuáticos. De junio a octubre llueve más pero la selva es espectacular. Xilitla se visita todo el año.</dd>
              </div>
              <div className={styles.faqItem}>
                <dt>¿Cuánto cuesta la entrada a Las Pozas?</dt>
                <dd>La entrada general cuesta alrededor de $120-150 MXN por persona. Los horarios son de 9 AM a 6 PM. El jardín es administrado por el Fideicomiso Las Pozas.</dd>
              </div>
              <div className={styles.faqItem}>
                <dt>¿Hay hotel cerca de Las Pozas de Edward James?</dt>
                <dd>Hotel Paraíso Encantado está a 5 minutos caminando — el más cercano al jardín en todo Xilitla. 13 suites boutique con spa privado desde $1,200 MXN. Reserva directa en paraisoencantado.com.</dd>
              </div>
            </dl>
          </div>
        </section>

      </main>
    </>
  );
}
