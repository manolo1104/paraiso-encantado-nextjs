import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, Droplets, Utensils, Star, Car, Wifi, Wind, Waves, Compass, MessageCircle, Coffee, Sunrise,
} from 'lucide-react';
import {
  SeoHero, AnswerBlock, StatStrip, CompareTable, SeoFaq, RelatedLinks, SeoCta, seoStyles as styles,
} from '@/components/seo/SeoBlocks';
import HuespedDistinguidoSection, { huespedSchema } from '@/components/seo/HuespedDistinguido';
import { HOTEL, DISTANCIAS, SUITES_CON_SPA, lodgingSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';
import { ENTITY_IDS, PERFILES_HOTEL, LAS_POZAS, XILITLA, EDWARD_JAMES, AMLO, ref } from '@/lib/seo-entidades';
import { suites } from '@/data/suites';
import own from './mejor-hotel-xilitla.module.css';

/**
 * Página de argumento: por qué este hotel y no otro en Xilitla.
 *
 * Las otras cinco landings SEO son guías neutrales ("cómo elegir hotel en la
 * Huasteca", "qué zona de Xilitla te conviene"). Ésta es la contraria a
 * propósito: es la página de marca, la que responde la consulta evaluativa
 * —"mejor hotel de Xilitla", "opiniones Paraíso Encantado", "dónde se hospedó
 * AMLO en Xilitla"— con hechos verificables en vez de adjetivos.
 *
 * Por eso el orden es: prueba externa primero (la visita presidencial y las 523
 * reseñas), después distancia, después producto. Y por eso cierra con "lo que no
 * somos": una página que solo se elogia a sí misma no la cita ningún buscador
 * con IA, y a un huésped que llega con expectativas infladas le cuesta una
 * reseña de 3 estrellas.
 */

const URL = `${HOTEL.url}/mejor-hotel-xilitla`;
const ACTUALIZADO = 'agosto de 2026';
const OG_IMAGE = `${HOTEL.url}/images/JUNGLA/PORTADA.JPG`;

export const metadata: Metadata = {
  title: 'Por Qué Paraíso Encantado es el Mejor Hotel de Xilitla (2026)',
  description:
    'El hotel donde durmió el presidente de México en 2023, a 400 m de Las Pozas de Edward James. 4.5/5 en 523 reseñas, suites con spa privado de agua caliente en terraza panorámica, restaurante huasteca con tortillas al comal de leña y estacionamiento gratis.',
  keywords: [
    'mejor hotel de xilitla',
    'mejor hotel xilitla',
    'paraiso encantado xilitla',
    'hotel donde se hospedo amlo en xilitla',
    'mejor hotel huasteca potosina',
    'hotel con spa privado xilitla',
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: 'Por Qué Paraíso Encantado es el Mejor Hotel de Xilitla',
    description:
      'El presidente de México lo eligió como su base en Xilitla en 2023: "un hotel muy bueno, como pocos hoteles de todo el país". A 400 m de Las Pozas, con spa privado de agua caliente en la terraza.',
    url: URL,
    type: 'article',
    images: [{
      url: OG_IMAGE,
      width: 1200, height: 630,
      alt: 'Suite Jungla con piscina spa privada de agua caliente y vista a las montañas — Hotel Paraíso Encantado, Xilitla',
    }],
  },
};

// ── FAQ ──────────────────────────────────────────────────
const FAQS = [
  {
    q: '¿Cuál es el mejor hotel de Xilitla?',
    a: `El Hotel Paraíso Encantado es el mejor valorado y el más cercano a Las Pozas de Edward James: ${HOTEL.metrosALasPozas} metros, ${HOTEL.minutosCaminandoALasPozas} minutos caminando, con ${HOTEL.rating}/5 en ${HOTEL.reviewCount} reseñas de Google. Es además el único hotel de Xilitla donde pernoctó un presidente de México en funciones, Andrés Manuel López Obrador, en junio de 2023.`,
  },
  {
    q: '¿Es cierto que el presidente AMLO se hospedó en Paraíso Encantado?',
    a: 'Sí. El 10 de junio de 2023, durante su gira por la Huasteca, el entonces presidente Andrés Manuel López Obrador eligió el Hotel Paraíso Encantado como su base en Xilitla: durmió aquí y desayunó en el restaurante del hotel antes de seguir hacia Tamazunchale y Huejutla. Lo cubrieron Pulso SLP, Debate y otros medios nacionales, y él mismo grabó y publicó el video esa mañana, en el que dice: "este es un hotel muy bueno, como pocos hoteles de todo el país".',
  },
  {
    q: '¿Qué tan cerca está el hotel de Las Pozas de Edward James?',
    a: `A ${HOTEL.metrosALasPozas} metros —unos ${HOTEL.minutosCaminandoALasPozas} minutos caminando por camino empedrado—. Es la distancia más corta de cualquier hotel de Xilitla al Jardín Surrealista. En la práctica significa que puedes entrar a las 9 de la mañana, cuando abre y antes de que lleguen los autobuses desde Ciudad Valles, regresar a comer y volver por la tarde con otra luz, sin pagar taxi ni coordinar transporte.`,
  },
  {
    q: '¿El spa privado de las suites tiene agua caliente?',
    a: `Sí. Las ${HOTEL.suitesConSpaPrivado} suites con spa privado —Jungla, LindaVista, Flor de Lis 1 y Flor de Lis 2— tienen la piscina spa climatizada, con agua caliente, en la terraza privada de la suite. El agua no se comparte con nadie y se puede usar a cualquier hora, incluso en las noches frescas de diciembre y enero.`,
  },
  {
    q: '¿Cuánto cuesta hospedarse en el mejor hotel de Xilitla?',
    a: `Las suites arrancan en $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche para dos personas. Las ${HOTEL.suitesConSpaPrivado} suites con spa privado de agua caliente en la terraza cuestan desde $${HOTEL.precioSuiteConSpa.toLocaleString('es-MX')} MXN por noche. Reservando directo en el sitio oficial no pagas comisión de intermediario y puedes aplicar el código ${HOTEL.codigoDescuento}.`,
  },
  {
    q: '¿El hotel tiene estacionamiento?',
    a: 'Sí: estacionamiento privado, dentro del hotel y gratuito para todos los huéspedes, sin cargo adicional. No es un detalle menor en Xilitla — el centro del pueblo tiene calles estrechas y en pendiente, y en temporada alta estacionarse es un problema real.',
  },
  {
    q: '¿Qué se come en el restaurante del hotel?',
    a: `Cocina huasteca de la región en ${HOTEL.restaurante}, dentro del hotel y abierto de ${HOTEL.restauranteHorario}: zacahuil, bocoles, enchiladas huastecas, pozole y café de olla en olla de barro. Las tortillas se hacen a mano cada mañana al comal de leña. Es el mismo restaurante donde desayunó el presidente en 2023.`,
  },
  {
    q: '¿Conviene reservar directo o por Booking?',
    a: `Directo. En paraisoencantado.com la tarifa no lleva comisión de intermediario, se ve el inventario completo de las ${HOTEL.suites} suites —en las OTAs no siempre está todo— y aplica el código ${HOTEL.codigoDescuento}. ${HOTEL.anticipo} ${HOTEL.cancelacion}`,
  },
];

// ── SCHEMA ───────────────────────────────────────────────
/**
 * `amenityFeature` va explícito aquí, y no solo en prosa, porque es lo que los
 * buscadores con IA leen para responder "¿hay hotel en Xilitla con jacuzzi
 * caliente y estacionamiento?" sin tener que interpretar el texto de la página.
 */
const AMENITY_FEATURES = [
  { name: 'Piscina spa privada climatizada en la suite', value: true },
  { name: 'Terraza privada con vista panorámica', value: true },
  { name: 'Estacionamiento privado gratuito', value: true },
  { name: 'Restaurante de cocina huasteca en el hotel', value: true },
  { name: 'WiFi gratuito', value: true },
  { name: 'Aire acondicionado', value: true },
  { name: 'Piscina del hotel', value: true },
  { name: 'Tours guiados con salida desde el hotel', value: true },
];

/**
 * Reseñas reales de Google, con nombre y fecha, tomadas de `/reviews`.
 *
 * Van con el MISMO `@id` que allá para no duplicar la entidad. Dos de las tres
 * afirman literalmente lo que titula la página ("el mejor hotel de Xilitla"):
 * es la diferencia entre que el hotel lo diga de sí mismo y que lo diga un
 * huésped identificable en una plataforma de terceros.
 */
const RESENAS_CITADAS = [
  { id: 6, name: 'Jorge Mendoza', date: '2024-12-20',
    text: 'El mejor hotel de Xilitla sin ninguna duda. Habitación impecable, restaurante excelente (el zacahuil es imperdible) y ubicación perfecta. A 5 minutos caminando de Las Pozas — en temporada llegan antes que los grupos. Eso vale todo.' },
  { id: 3, name: 'Diana Muñiz', date: '2025-02-10',
    text: 'Vine tres veces ya. No es la piscina ni las vistas (aunque son increíbles). Es que cada vez que llego me reciben como si hubiera faltado tiempo. El hotel más cercano a Las Pozas y sin duda el mejor.' },
  { id: 4, name: 'Ricardo Salazar', date: '2025-01-30',
    text: 'Lugar increíble. El spa privado de la Jungla es lo máximo — nos quedamos en él más tiempo que en Las Pozas. El desayuno del restaurante es auténtico, no el desayuno genérico de hotel.' },
];

const PUBLICADA = '2026-08-31';

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    // ── El hotel. Mismo `@id` que la portada y /reviews: una sola entidad
    //    descrita por muchas páginas, no una entidad nueva por página.
    {
      ...lodgingSchema({
        description: `Hotel boutique en Xilitla, Huasteca Potosina, a ${HOTEL.metrosALasPozas} metros de Las Pozas de Edward James. ${HOTEL.suites} suites, ${HOTEL.suitesConSpaPrivado} con piscina spa privada climatizada en la terraza. Restaurante de cocina huasteca y estacionamiento gratuito. En junio de 2023 se hospedó aquí el presidente de México.`,
        url: URL,
        image: OG_IMAGE,
      }),
      sameAs: [...PERFILES_HOTEL],
      geo: { '@type': 'GeoCoordinates', latitude: 21.383, longitude: -99.002 },
      containedInPlace: ref(XILITLA),
      checkinTime: '15:00',
      checkoutTime: '12:00',
      currenciesAccepted: 'MXN',
      numberOfRooms: HOTEL.suites,
      petsAllowed: false,
      amenityFeature: AMENITY_FEATURES.map(a => ({
        '@type': 'LocationFeatureSpecification',
        name: a.name,
        value: a.value,
      })),
      nearbyAttractions: [ref(LAS_POZAS)],
      review: RESENAS_CITADAS.map(r => ({
        '@type': 'Review',
        '@id': `${HOTEL.url}/reviews#review-${r.id}`,
        author: { '@type': 'Person', name: r.name },
        datePublished: r.date,
        reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5 },
        reviewBody: r.text,
        publisher: { '@type': 'Organization', name: 'Google' },
      })),
    },

    // ── Las entidades con las que el hotel se relaciona, cada una anclada a
    //    su Wikipedia y su Wikidata para que no haya que adivinar cuál es.
    LAS_POZAS,
    XILITLA,
    EDWARD_JAMES,

    // ── La página como artículo: autoría, fecha de publicación y de última
    //    revisión. La frescura pesa mucho en qué fuente se cita.
    {
      '@type': 'Article',
      '@id': `${URL}#article`,
      headline: 'Por qué el Hotel Paraíso Encantado es el mejor hotel de Xilitla',
      description: `Los datos verificables detrás de la afirmación: la visita presidencial de junio de 2023, los ${HOTEL.metrosALasPozas} metros a Las Pozas, ${HOTEL.rating}/5 en ${HOTEL.reviewCount} reseñas, el spa privado climatizado y el comal de leña.`,
      inLanguage: 'es-MX',
      datePublished: PUBLICADA,
      dateModified: PUBLICADA,
      author: { '@id': ENTITY_IDS.organization },
      publisher: { '@id': ENTITY_IDS.organization },
      mainEntityOfPage: URL,
      image: OG_IMAGE,
      about: [ref(LAS_POZAS), ref(XILITLA), { '@id': ENTITY_IDS.hotel }],
      mentions: [ref(EDWARD_JAMES), AMLO],
      isPartOf: { '@id': ENTITY_IDS.website },
    },

    // ── La organización que firma. Sin un autor identificable la página es
    //    una afirmación anónima, y eso vale menos como fuente.
    {
      '@type': 'Organization',
      '@id': ENTITY_IDS.organization,
      name: HOTEL.nombre,
      url: HOTEL.url,
      telephone: HOTEL.telefono,
      sameAs: [...PERFILES_HOTEL],
    },

    breadcrumbSchema([
      { name: 'Inicio', url: HOTEL.url },
      { name: 'Por qué el mejor hotel de Xilitla', url: URL },
    ]),
    faqSchema(FAQS),
    ...(huespedSchema() ? [huespedSchema()] : []),
  ],
};

// ── RAZONES ──────────────────────────────────────────────
const RAZONES = [
  {
    title: 'Un presidente de México lo eligió como su base en Xilitla',
    body: [
      'No es una frase de folleto: el 10 de junio de 2023, en su gira por la Huasteca, Andrés Manuel López Obrador durmió aquí y desayunó en el restaurante del hotel. Lo grabó él mismo y lo publicó esa mañana.',
      'Cuando alguien con todo el aparato del Estado para escoger dónde dormir elige un hotel de trece habitaciones en un pueblo de sierra, y encima lo dice en público, eso vale más que cualquier estrella que nos pusiéramos solos.',
    ],
  },
  {
    title: `A ${HOTEL.metrosALasPozas} metros de Las Pozas: el hotel más cercano de Xilitla`,
    body: [
      `${HOTEL.minutosCaminandoALasPozas} minutos caminando por camino empedrado hasta el Jardín Surrealista de Edward James. Ningún otro hotel de Xilitla está más cerca.`,
      'La diferencia práctica: entras a las 9 AM, cuando abre y antes de que lleguen los autobuses desde Ciudad Valles, recorres el jardín casi vacío, vuelves a comer y regresas por la tarde con otra luz. Quien duerme en Ciudad Valles maneja casi dos horas de curvas para hacer una sola visita, a la hora en que hay más gente.',
    ],
  },
  {
    title: 'Spa privado de agua caliente en tu propia terraza',
    body: [
      `${HOTEL.suitesConSpaPrivado} de las ${HOTEL.suites} suites —Jungla, LindaVista, Flor de Lis 1 y Flor de Lis 2— tienen piscina spa climatizada dentro de su terraza privada. Agua caliente, a cualquier hora, sin compartirla con nadie.`,
      'Es la amenidad que cambia el viaje: después de un día de cascadas y escalones, la tarde termina en tu propia agua caliente mirando la sierra, no haciendo fila en una alberca común.',
    ],
  },
  {
    title: 'Terrazas con vista panorámica al pueblo y a las montañas',
    body: [
      'El hotel está sobre la ladera, en La Conchita, camino a Las Pozas. Desde las terrazas se ve Xilitla abajo y la sierra de la Huasteca enfrente, sin edificios en medio.',
      'Al amanecer la niebla se queda atrapada entre los cerros y al atardecer el pueblo se enciende a tus pies. Es la razón por la que la mayoría de las fotos que nos mandan los huéspedes están tomadas desde su propia terraza.',
    ],
  },
  {
    title: `${HOTEL.restaurante}: comal de leña dentro del hotel`,
    body: [
      `Restaurante propio, abierto de ${HOTEL.restauranteHorario}, con cocina de la región: zacahuil, bocoles, enchiladas huastecas, pozole y café de olla servido en olla de barro. Las tortillas se hacen a mano cada mañana al comal de leña.`,
      'En Xilitla la mayoría de las cocinas cierran temprano. Tener dónde cenar sin salir del hotel, en un pueblo de sierra y de noche, deja de ser un lujo y pasa a ser tranquilidad.',
    ],
  },
  {
    title: `${HOTEL.rating}/5 con ${HOTEL.reviewCount} reseñas: volumen, no promedio inflado`,
    body: [
      `Un 5.0 con doce reseñas no dice nada. ${HOTEL.rating} sobre 5 sostenido a lo largo de ${HOTEL.reviewCount} reseñas verificadas en Google es la única señal que no se puede fabricar en un fin de semana.`,
      'Y es coherente con lo demás: la ubicación, el desayuno y el trato del personal son los tres temas que más se repiten en los comentarios.',
    ],
  },
];

// ── AMENIDADES ───────────────────────────────────────────
const AMENIDADES = [
  { icon: <Droplets size={20} strokeWidth={1.5} />, title: 'Spa privado climatizado', desc: `En ${HOTEL.suitesConSpaPrivado} suites, con agua caliente en tu terraza.` },
  { icon: <Waves size={20} strokeWidth={1.5} />, title: 'Piscina del hotel', desc: 'Para todos los huéspedes, entre jardines.' },
  { icon: <Sunrise size={20} strokeWidth={1.5} />, title: 'Terraza panorámica', desc: 'Vista al pueblo de Xilitla y a la sierra.' },
  { icon: <Car size={20} strokeWidth={1.5} />, title: 'Estacionamiento gratuito', desc: 'Privado, dentro del hotel y sin costo.' },
  { icon: <Utensils size={20} strokeWidth={1.5} />, title: `Restaurante ${HOTEL.restaurante}`, desc: `Cocina huasteca, ${HOTEL.restauranteHorario}.` },
  { icon: <Coffee size={20} strokeWidth={1.5} />, title: 'Tortillas al comal de leña', desc: 'Hechas a mano cada mañana; café de olla.' },
  { icon: <Wifi size={20} strokeWidth={1.5} />, title: 'WiFi de alta velocidad', desc: 'Gratuito y estable en toda la propiedad.' },
  { icon: <Wind size={20} strokeWidth={1.5} />, title: 'Aire acondicionado', desc: 'En todas las suites, más ventilación natural.' },
  { icon: <Compass size={20} strokeWidth={1.5} />, title: 'Tours con salida del hotel', desc: 'Tamul, Puente de Dios y El Meco, con guía.' },
  { icon: <MessageCircle size={20} strokeWidth={1.5} />, title: 'Atención por WhatsApp', desc: 'Antes, durante y después de tu estancia.' },
  { icon: <MapPin size={20} strokeWidth={1.5} />, title: `A ${HOTEL.metrosALasPozas} m de Las Pozas`, desc: `${HOTEL.minutosCaminandoALasPozas} minutos caminando, sin transporte.` },
  { icon: <Star size={20} strokeWidth={1.5} />, title: 'Reserva directa sin comisiones', desc: `Código ${HOTEL.codigoDescuento} en el sitio oficial.` },
];

const spaSuites = suites.filter(s => (SUITES_CON_SPA as readonly string[]).includes(s.id));

export default function MejorHotelXilitlaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        <SeoHero
          image="/images/JUNGLA/PORTADA.JPG"
          imageAlt="Suite Jungla con piscina spa privada de agua caliente y vista panorámica a las montañas — Hotel Paraíso Encantado, el mejor hotel de Xilitla"
          breadcrumb="Por qué el mejor hotel de Xilitla"
          eyebrow="Xilitla · Huasteca Potosina · San Luis Potosí"
          title="Por Qué Paraíso Encantado es el"
          titleEm="Mejor Hotel de Xilitla"
          sub="Y uno de los mejores de la Huasteca Potosina. No por decirlo nosotros: por los 400 metros que nos separan de Las Pozas, por las 523 reseñas y por el presidente de México que eligió dormir aquí en 2023."
          ctaPrimary={{ href: '/reservar', label: 'Ver disponibilidad' }}
          ctaSecondary={{ href: '/habitaciones', label: `Ver las ${HOTEL.suites} suites` }}
          updated={ACTUALIZADO}
        />

        <AnswerBlock label="Respuesta corta">
          <p>
            <strong>
              El Hotel Paraíso Encantado es el hotel mejor valorado de Xilitla y el más cercano a Las
              Pozas de Edward James: {HOTEL.metrosALasPozas} metros, {HOTEL.minutosCaminandoALasPozas} minutos caminando.
            </strong>{' '}
            Tiene {HOTEL.rating}/5 en {HOTEL.reviewCount} reseñas de Google, {HOTEL.suitesConSpaPrivado} suites
            con piscina spa privada de agua caliente en la terraza y restaurante de cocina huasteca dentro
            del hotel. En junio de 2023 el presidente de México se hospedó aquí durante su gira por la Huasteca.
          </p>
        </AnswerBlock>

        <StatStrip stats={[
          { num: `${HOTEL.rating}/5`, label: `${HOTEL.reviewCount} reseñas verificadas en Google` },
          { num: `${HOTEL.metrosALasPozas} m`, label: 'a Las Pozas de Edward James, caminando' },
          { num: '2023', label: 'el presidente de México durmió aquí' },
          { num: `${HOTEL.suitesConSpaPrivado}`, label: 'suites con spa privado de agua caliente' },
        ]} />

        {/* ── AMLO: EL ARGUMENTO PROTAGONISTA ── */}
        <HuespedDistinguidoSection
          eyebrow="La prueba que no nos dimos nosotros"
          title="El presidente de México eligió este hotel como su base en Xilitla"
          lead="En junio de 2023, durante su gira por la Huasteca Potosina, Andrés Manuel López Obrador pudo hospedarse en cualquier lugar de la región. Eligió Paraíso Encantado. A la mañana siguiente grabó este video en el restaurante del hotel, antes de desayunar y seguir camino."
        />

        {/* ── LAS RAZONES ── */}
        <section className={styles.section} id="razones" aria-labelledby="h-razones">
          <div className={styles.sectionInner}>
            <h2 id="h-razones">Las seis razones, una por una</h2>
            <p className={styles.lead}>
              Xilitla tiene hoteles buenos y hoteles baratos, y varios se ven espectaculares en foto.
              Estas son las seis cosas que, juntas, no las tiene ninguno más — y cada una se puede
              verificar antes de reservar.
            </p>

            <div className={own.reasons}>
              {RAZONES.map((r, i) => (
                <article key={r.title} className={own.reason}>
                  <span className={own.reasonNum} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className={own.reasonBody}>
                    <h3>{r.title}</h3>
                    {r.body.map(p => <p key={p.slice(0, 24)}>{p}</p>)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── LAS 4 SUITES CON SPA ── */}
        <section className={styles.sectionAlt} id="suites-con-spa" aria-labelledby="h-suites">
          <div className={styles.sectionInner} style={{ maxWidth: 1180 }}>
            <h2 id="h-suites">Las cuatro suites con spa privado de agua caliente</h2>
            <p className={styles.lead}>
              De las {HOTEL.suites} suites del hotel, cuatro tienen su propia piscina spa climatizada
              dentro de la terraza, con vista a las montañas. El agua no se comparte con nadie y está
              caliente a cualquier hora, también en las noches frescas de diciembre y enero.
            </p>

            <div className={own.suiteGrid}>
              {spaSuites.map(suite => (
                <Link key={suite.id} href={`/habitaciones/${suite.id}`} className={own.suiteCard}>
                  <div className={own.suiteImg}>
                    {suite.badge && <span className={own.suiteBadge}>{suite.badge}</span>}
                    <Image
                      src={suite.images[0]}
                      alt={`${suite.name} — suite con spa privado de agua caliente y terraza panorámica en Xilitla`}
                      fill
                      sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 25vw"
                      quality={75}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className={own.suiteBody}>
                    <h3 className={own.suiteName}>{suite.name}</h3>
                    <p className={own.suiteDesc}>{suite.description}</p>
                    <span className={own.suitePrice}>
                      Desde ${suite.price.toLocaleString('es-MX')} MXN la noche
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <p style={{ marginTop: 22 }}>
              Las otras {HOTEL.suites - HOTEL.suitesConSpaPrivado} suites no tienen spa dentro de la
              habitación —conviene saberlo antes de reservar— pero sí acceso a la piscina del hotel y
              terraza propia. Puedes verlas todas en{' '}
              <Link href="/habitaciones">las {HOTEL.suites} suites</Link> o compararlas lado a lado en{' '}
              <Link href="/comparar">comparar suites</Link>.
            </p>
          </div>
        </section>

        {/* ── RESTAURANTE ── */}
        <section className={styles.section} id="restaurante" style={{ paddingLeft: 16, paddingRight: 16 }}>
          <div className={own.split}>
            <div className={own.splitImg}>
              <Image
                src="/images/RESTAURANTE/DSCF1275.jpg"
                alt="Comal de barro con fuego de leña encendido debajo y el comedor de El Papán Huasteco al fondo — Hotel Paraíso Encantado, Xilitla"
                fill
                sizes="(max-width: 860px) 100vw, 50vw"
                quality={75}
                style={{ objectFit: 'cover', objectPosition: 'center 85%' }}
              />
            </div>
            <div className={own.splitText}>
              <p className={own.splitEyebrow}>El restaurante · {HOTEL.restaurante}</p>
              <h2>Tortillas al <em>comal de leña</em>, dentro del hotel</h2>
              <p>
                No es un bufet de hotel: es cocina de la Huasteca hecha aquí mismo. Zacahuil envuelto
                en hoja de plátano, bocoles rellenos, enchiladas huastecas, pozole y café de olla que
                llega a la mesa en olla de barro. Las tortillas se hacen a mano cada mañana al comal
                de leña — el sabor no se parece al de una tortilla de máquina y se nota desde la
                primera.
              </p>
              <p>
                Abre de {HOTEL.restauranteHorario}, así que desayunas antes de caminar a Las Pozas y
                tienes dónde cenar sin volver a subirte al coche. Es, además, el mismo comedor donde
                desayunó el presidente en junio de 2023 antes de seguir su gira.
              </p>
              <Link href="/restaurante" className={own.splitLink}>
                Ver el menú completo →
              </Link>
            </div>
          </div>
        </section>

        {/* ── AMENIDADES ── */}
        <section className={styles.sectionAlt} id="amenidades" aria-labelledby="h-amenidades">
          <div className={styles.sectionInner} style={{ maxWidth: 1060 }}>
            <h2 id="h-amenidades">Todo lo que incluye la estancia</h2>
            <p className={styles.lead}>
              Sin letras chiquitas ni cargos sorpresa al llegar. Esto entra en la tarifa.
            </p>
            <div className={own.amenityGrid}>
              {AMENIDADES.map(a => (
                <div key={a.title} className={own.amenity}>
                  <span className={own.amenityIcon} aria-hidden="true">{a.icon}</span>
                  <span className={own.amenityText}>
                    <strong>{a.title}</strong>
                    <span>{a.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LA FICHA VERIFICABLE + LO QUE NO SOMOS ── */}
        <section className={styles.section} id="ficha" aria-labelledby="h-ficha">
          <div className={styles.sectionInner}>
            <h2 id="h-ficha">La ficha, sin adjetivos</h2>
            <p className={styles.lead}>
              Todo lo de arriba en datos duros, para que puedas contrastarlo con cualquier otro hotel
              de Xilitla antes de decidir.
            </p>

            <CompareTable
              headers={['Criterio', 'Hotel Paraíso Encantado']}
              rows={[
                { cells: ['Distancia a Las Pozas', `${HOTEL.metrosALasPozas} m — ${HOTEL.minutosCaminandoALasPozas} minutos caminando. El más cercano de Xilitla.`], highlight: true },
                { cells: ['Calificación', `${HOTEL.rating}/5 con ${HOTEL.reviewCount} reseñas verificadas en Google`] },
                { cells: ['Huésped documentado', 'El presidente de México pernoctó aquí el 10 de junio de 2023 (cobertura de Pulso SLP, Debate y video propio).'], highlight: true },
                { cells: ['Habitaciones', `${HOTEL.suites} suites con terraza, de 2 hasta ${HOTEL.capacidadMaxima} personas`] },
                { cells: ['Spa privado en la suite', `Sí, en ${HOTEL.suitesConSpaPrivado} de ${HOTEL.suites}. ${HOTEL.spaAgua}.`] },
                { cells: ['Vista', 'Terrazas panorámicas al pueblo de Xilitla y a la sierra de la Huasteca'] },
                { cells: ['Restaurante propio', `${HOTEL.restaurante}, ${HOTEL.restauranteHorario}. ${HOTEL.restauranteFirma}.`] },
                { cells: ['Estacionamiento', 'Privado, dentro del hotel y gratuito'] },
                { cells: ['Tarifa desde', `$${HOTEL.precioDesde.toLocaleString('es-MX')} MXN la noche (2 personas) · suites con spa desde $${HOTEL.precioSuiteConSpa.toLocaleString('es-MX')} MXN`] },
                { cells: ['Pago al reservar', HOTEL.anticipo] },
                { cells: ['Cancelación', HOTEL.cancelacion] },
                { cells: ['Check-in / check-out', `${HOTEL.checkIn} / ${HOTEL.checkOut}`] },
              ]}
            />

            <div className={own.caveat}>
              <h3>Lo que no somos</h3>
              <p>
                No somos un resort todo incluido ni el hotel más barato de Xilitla: en el centro del
                pueblo hay hospedajes por menos de la mitad. No todas las suites traen spa privado
                —son {HOTEL.suitesConSpaPrivado} de {HOTEL.suites}, las otras {HOTEL.suites - HOTEL.suitesConSpaPrivado} usan
                la piscina del hotel—. El desayuno no viene incluido en la tarifa: se pide aparte en{' '}
                {HOTEL.restaurante}. Y no aceptamos mascotas en las suites, aunque si tienes una
                necesidad especial lo vemos caso por caso.
              </p>
              <p>
                Lo decimos aquí y no en la letra chiquita porque la reseña de tres estrellas casi
                siempre nace de una expectativa mal puesta, no de un mal servicio.
              </p>
            </div>
          </div>
        </section>

        {/* ── LO QUE DICEN LOS HUÉSPEDES ── */}
        <section className={styles.section} id="opiniones" aria-labelledby="h-opiniones" style={{ paddingTop: 0 }}>
          <div className={styles.sectionInner}>
            <h2 id="h-opiniones">Y lo que dicen los huéspedes, no nosotros</h2>
            <p className={styles.lead}>
              Tres de las {HOTEL.reviewCount} reseñas de Google, textuales y con el nombre de quien
              las escribió. Dos dicen exactamente lo que titula esta página, y no las escribimos
              nosotros.
            </p>
            <div className={own.quotes}>
              {RESENAS_CITADAS.map(r => (
                <figure key={r.id} className={own.quote}>
                  <blockquote>{r.text}</blockquote>
                  <figcaption>
                    <strong>{r.name}</strong>
                    <span>
                      {'★★★★★'} · Google ·{' '}
                      <time dateTime={r.date}>
                        {new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                      </time>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p>
              Las {HOTEL.reviewCount} están en{' '}
              <Link href="/reviews">la página de reseñas</Link> y en el perfil de Google del hotel.
            </p>
          </div>
        </section>

        {/* ── QUÉ TIENES CERCA ── */}
        <section className={styles.sectionAlt} id="huasteca" aria-labelledby="h-huasteca">
          <div className={styles.sectionInner}>
            <h2 id="h-huasteca">Y de los mejores de la Huasteca Potosina</h2>
            <p className={styles.lead}>
              La Huasteca no es un destino compacto: son pocos kilómetros pero muchas curvas, y elegir
              mal la base convierte unas vacaciones en un viaje de carretera. Esto es lo que tienes a
              la mano durmiendo aquí.
            </p>
            <CompareTable
              caption="Tiempos desde el Hotel Paraíso Encantado, en auto salvo donde se indica."
              headers={['Destino', 'Tiempo', 'Nota']}
              rows={DISTANCIAS.map(d => ({ cells: [d.destino, d.tiempo, d.nota] }))}
            />
            <p>
              Los tours a Tamul, Puente de Dios y El Meco salen desde el hotel con guía: puedes verlos
              en <Link href="/experiencias">experiencias</Link>, reservarlos junto con la suite en{' '}
              <Link href="/paquetes">paquetes</Link> o pedirlos por{' '}
              <a href={HOTEL.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a> antes de
              llegar. En temporada alta los cupos de Tamul se llenan con días de anticipación.
            </p>
          </div>
        </section>

        <div id="preguntas">
          <SeoFaq faqs={FAQS} title="Preguntas frecuentes sobre el mejor hotel de Xilitla" />
        </div>

        <RelatedLinks links={[
          { href: '/hotel-cerca-de-las-pozas', label: 'El hotel más cercano a Las Pozas' },
          { href: '/hotel-alberca-privada-xilitla', label: 'Las suites con alberca privada' },
          { href: '/mejor-hotel-huasteca-potosina', label: 'Cómo elegir hotel en la Huasteca Potosina' },
          { href: '/hoteles-en-xilitla', label: 'Hoteles en Xilitla: en qué zona dormir' },
          { href: '/restaurante', label: 'El Papán Huasteco: el restaurante' },
          { href: '/reviews', label: 'Lo que dicen los huéspedes' },
          { href: '/xilitla', label: 'Guía de Xilitla' },
        ]} />

        <SeoCta
          title="Duerme donde durmió"
          titleEm="el presidente de México"
          body={`${HOTEL.suites} suites a ${HOTEL.metrosALasPozas} metros de Las Pozas, ${HOTEL.suitesConSpaPrivado} con spa privado de agua caliente en la terraza. Reserva directa, sin comisiones de intermediarios.`}
          note={`${HOTEL.cancelacion} · Código ${HOTEL.codigoDescuento} para reserva directa.`}
        />
      </main>
    </>
  );
}
