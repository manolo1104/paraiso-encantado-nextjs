import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Droplets, Sunrise, Utensils, ShieldCheck, Leaf } from 'lucide-react';
import { suites } from '@/data/suites';
import FloatingLeaves from '@/components/FloatingLeaves';
import { HOTEL, lodgingSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';
import { ENTITY_IDS, LAS_POZAS, XILITLA, EDWARD_JAMES, ref } from '@/lib/seo-entidades';
import { CAMINO_A_LAS_POZAS, HOTELES_XILITLA } from '@/lib/hoteles-xilitla';
import styles from './hotel-las-pozas.module.css';

const URL = `${HOTEL.url}/hotel-cerca-de-las-pozas`;

// Foto real de Las Pozas (CC0, Wikimedia Commons), la misma de /xilitla. Hasta el
// 16 oct 2026 el hero y la tarjeta para compartir de esta página eran
// ruta-surrealista-pozas.png, hecha con IA y con la estrella de Gemini en la esquina.
const FOTO_LAS_POZAS = '/images/las-pozas/columnas-las-pozas-edward-james-xilitla.jpg';
const FOTO_LAS_POZAS_OG = '/images/las-pozas/columnas-las-pozas-edward-james-xilitla-og.jpg';
const FOTO_LAS_POZAS_ALT =
  'Columnas de concreto de Las Pozas, el jardín surrealista de Edward James, entre la selva de Xilitla';

export const metadata: Metadata = {
  // Se conserva "Edward James" porque es parte de la consulta real ("hoteles
  // las pozas", "hotel edward james xilitla"); lo que sale es la marca, que
  // Google ya muestra arriba en la línea del dominio.
  // 16 oct 2026: entra «Xilitla» («hotel cerca de las pozas xilitla») y sale el
  // «400 m» del título: la distancia todavía no está medida a pie (las
  // coordenadas dan 561 m en línea recta) y no se multiplica antes de medirla.
  // 51 caracteres, 478 px. Línea base del 13 oct: 6.º en «hotel cerca de las pozas xilitla».
  title: 'Hotel Cerca de Las Pozas de Edward James en Xilitla',
  description:
    `A ${HOTEL.metrosALasPozas} metros de Las Pozas de Edward James: llegas caminando a tu turno, sin buscar dónde estacionar. ${HOTEL.suites} suites en Xilitla, ${HOTEL.suitesConSpaPrivado} con spa privado.`,
  alternates: {
    canonical: URL,
  },
  openGraph: {
    title: 'Hotel cerca de Las Pozas de Edward James — Xilitla, Huasteca Potosina',
    description:
      `A ${HOTEL.minutosCaminandoALasPozas} minutos caminando del Jardín Surrealista, sobre el camino a Las Pozas. ${HOTEL.suites} suites boutique, ${HOTEL.suitesConSpaPrivado} con spa privado, en Xilitla, San Luis Potosí.`,
    url: URL,
    images: [
      {
        url: `${HOTEL.url}${FOTO_LAS_POZAS_OG}`,
        width: 1200,
        height: 630,
        alt: FOTO_LAS_POZAS_ALT,
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
    // La pregunta que de verdad se hace, contestada con nuestra propia comparativa
    // (lib/hoteles-xilitla.ts, la misma tabla de /hoteles-en-xilitla): el más
    // cercano NO es este hotel. Entre Paraíso Encantado y Posada James no se afirma
    // un orden: la distancia del hotel todavía no está medida a pie.
    q: '¿Cuál es el hotel más cercano a Las Pozas?',
    a: `Según nuestra propia comparativa de los hoteles de Xilitla, Casa Caracol, ${CAMINO_A_LAS_POZAS.casaCaracol}. Sobre el mismo camino están el Hotel Paraíso Encantado, ${CAMINO_A_LAS_POZAS.paraisoEncantado}, y Posada James, ${CAMINO_A_LAS_POZAS.posadaJames}. Desde los tres llegas caminando, sin auto ni taxi; los demás hoteles de la comparativa quedan a unos 2 km o más.`,
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

/**
 * JSON-LD (16 oct 2026). El hotel es el MISMO `@id` de todo el sitio, armado con
 * `lodgingSchema()`: antes era un LodgingBusiness escrito a mano, con `url` de
 * esta página (la portada dice otra), sin código postal y con dos cosas que no
 * debían estar:
 * - `nearbyAttractions`, que no existe en schema.org (https://schema.org/nearbyAttractions
 *   da 404): el vínculo hotel–Las Pozas nunca le llegaba a nadie. Ahora lo dice el
 *   WebPage con `about`, que sí existe.
 * - `aggregateRating`, que esta página no muestra. La calificación del hotel ya la
 *   declara la portada para el mismo `@id`.
 * Sin `additionalProperty` de distancia: no se declara «400 m» como dato mientras
 * no esté medido.
 */
const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    lodgingSchema({
      description: `Hotel boutique en Xilitla sobre el camino a Las Pozas de Edward James, a ${HOTEL.metrosALasPozas} metros (${HOTEL.minutosCaminandoALasPozas} minutos caminando) del Jardín Surrealista. ${HOTEL.suites} suites boutique, ${HOTEL.suitesConSpaPrivado} con spa privado, Huasteca Potosina.`,
      url: URL,
      image: `${HOTEL.url}/images/JUNGLA/PORTADA.JPG`,
    }),
    LAS_POZAS,
    XILITLA,
    EDWARD_JAMES,
    {
      '@type': 'WebPage',
      '@id': `${URL}#webpage`,
      url: URL,
      name: 'Hotel cerca de Las Pozas de Edward James en Xilitla',
      inLanguage: 'es-MX',
      about: [{ '@id': ENTITY_IDS.hotel }, ref(LAS_POZAS)],
      mentions: [ref(EDWARD_JAMES), ref(XILITLA)],
      isPartOf: { '@id': ENTITY_IDS.website },
    },
    breadcrumbSchema([
      { name: 'Inicio', url: HOTEL.url },
      { name: 'Hotel cerca de Las Pozas', url: URL },
    ]),
    faqSchema(FAQS),
  ],
};

/**
 * El pasaje «¿Qué hotel está más cerca de Las Pozas?» (17 oct 2026).
 *
 * Es la pregunta que trae a esta página, y hasta ahora solo la contestaban
 * /hoteles-en-xilitla y llms.txt. Se contesta con la MISMA tabla de la comparativa
 * (lib/hoteles-xilitla.ts): si una distancia cambia allá, cambia aquí sola. Va en
 * orden de cercanía según esa tabla, con Casa Caracol primero; entre Paraíso
 * Encantado y Posada James no se afirma un orden (ver CAMINO_A_LAS_POZAS).
 */
const EN_EL_CAMINO = ['Casa Caracol', 'Hotel Paraíso Encantado', 'Posada James'];
const FILAS_CERCANIA = [
  ...HOTELES_XILITLA
    .filter(h => EN_EL_CAMINO.includes(h.cells[0]))
    .sort((a, b) => EN_EL_CAMINO.indexOf(a.cells[0]) - EN_EL_CAMINO.indexOf(b.cells[0]))
    .map(h => ({ hotel: h.cells[0], distancia: h.cells[3], propio: Boolean(h.highlight) })),
  { hotel: 'Los hoteles del centro del pueblo', distancia: 'Unos 2 km o más · 5 min en carro', propio: false },
];

const REASONS = [
  {
    icon: <MapPin size={22} strokeWidth={1.5} />,
    title: `${HOTEL.minutosCaminandoALasPozas} Minutos Caminando`,
    body: `Estamos sobre el camino a Las Pozas, a ${HOTEL.metrosALasPozas} metros del jardín. Sales de tu suite y en ${HOTEL.minutosCaminandoALasPozas} minutos estás en la entrada —sin taxi ni estacionamiento, que el jardín no tiene.`,
  },
  {
    icon: <Droplets size={22} strokeWidth={1.5} />,
    title: 'Suites con Spa Privado',
    body: `${HOTEL.suitesConSpaPrivado} de nuestras ${HOTEL.suites} suites tienen su propia piscina spa o tina de hidromasaje privada. No compartes el agua con nadie. Llega de Las Pozas y sumérgete en tu spa privado con vista a la selva.`,
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
              src={FOTO_LAS_POZAS}
              alt={FOTO_LAS_POZAS_ALT}
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
              A solo <strong>{HOTEL.minutosCaminandoALasPozas} minutos caminando</strong> del Jardín Surrealista. {HOTEL.suites} suites boutique, {HOTEL.suitesConSpaPrivado} con spa privado.
              Despierta y camina hasta Las Pozas para el primer turno, antes de que lleguen los grupos.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/reservar" className={styles.heroCtaPrimary}>Reservar Ahora</Link>
              <Link href="/habitaciones" className={styles.heroCtaSecondary}>Ver las {HOTEL.suites} Suites</Link>
            </div>
            {/* Quien busca en inglés «hotels near las pozas xilitla» cae en esta página
                en español (6.º el 13 oct): el par en inglés es /en. Un <a> y no un <Link>:
                con la carga completa el servidor pinta `<html lang="en">` y el pie en inglés
                (el layout raíz no se vuelve a pintar al navegar con <Link>). */}
            <p className={styles.heroLang}>
              <a href="/en" hrefLang="en" lang="en">In English: hotel near Las Pozas →</a>
            </p>
          </div>
        </section>

        {/* DISTANCIA VISUAL */}
        <section className={styles.distance}>
          <FloatingLeaves />
          <div className={styles.distanceInner}>
            <div className={styles.distanceStat}>
              <span className={styles.distanceNum}>{HOTEL.metrosALasPozas}</span>
              <span className={styles.distanceUnit}>metros</span>
              <span className={styles.distanceLabel}>del Jardín de Edward James</span>
            </div>
            <div className={styles.distanceDivider} aria-hidden="true" />
            <div className={styles.distanceStat}>
              <span className={styles.distanceNum}>{HOTEL.minutosCaminandoALasPozas}</span>
              <span className={styles.distanceUnit}>minutos</span>
              <span className={styles.distanceLabel}>caminando desde tu suite</span>
            </div>
            <div className={styles.distanceDivider} aria-hidden="true" />
            <div className={styles.distanceStat}>
              <span className={styles.distanceNum}>{HOTEL.suites}</span>
              <span className={styles.distanceUnit}>suites</span>
              <span className={styles.distanceLabel}>boutique, {HOTEL.suitesConSpaPrivado} con spa privado</span>
            </div>
          </div>
        </section>

        {/* QUÉ HOTEL ESTÁ MÁS CERCA — la respuesta honesta, con nuestra propia tabla */}
        <section className={styles.cercania} aria-labelledby="h-cercania">
          <div className={styles.cercaniaInner}>
            <h2 id="h-cercania">¿Qué hotel está más cerca de Las Pozas?</h2>
            <p>
              En nuestra comparativa de los hoteles de Xilitla, tres están sobre el camino a Las
              Pozas, y desde los tres se llega caminando a la entrada del jardín de Edward James. El
              más cercano es Casa Caracol, {CAMINO_A_LAS_POZAS.casaCaracol}. Sobre el mismo camino
              están el Hotel Paraíso Encantado, {CAMINO_A_LAS_POZAS.paraisoEncantado}, y Posada
              James, {CAMINO_A_LAS_POZAS.posadaJames}. Los hoteles del centro del pueblo quedan a
              unos 2 km, a 5 minutos en carro, y el jardín no tiene estacionamiento.
            </p>
            <div className={styles.cercaniaTableWrap}>
              <table className={styles.cercaniaTable}>
                <caption>Distancia a la entrada de Las Pozas, según nuestra comparativa de los hoteles de Xilitla</caption>
                <thead>
                  <tr>
                    <th scope="col">Hotel</th>
                    <th scope="col">A Las Pozas</th>
                  </tr>
                </thead>
                <tbody>
                  {FILAS_CERCANIA.map(f => (
                    <tr key={f.hotel} className={f.propio ? styles.cercaniaPropio : undefined}>
                      <th scope="row">{f.hotel}</th>
                      <td>{f.distancia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link href="/hoteles-en-xilitla" className={styles.aboutLink}>
              Los 10 hoteles de Xilitla, con zona, precio y alberca →
            </Link>
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
              {/* Era «El Jardín Surrealista Más Extraordinario del Mundo»: superlativo sin fuente. */}
              <h2>Qué es Las Pozas y por qué conviene dormir cerca</h2>
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
              {/* Sin «el mejor hotel de Xilitla» (16 oct 2026): no se sostiene. La
                  comparativa de hoteles se enlaza arriba, en «¿Qué hotel está más cerca?». */}
              <Link href="/mejor-hotel-xilitla" className={styles.aboutLink}>
                Por qué elegir Paraíso Encantado: los datos →
              </Link>
            </div>
          </div>
        </section>

        {/* SUITES DESTACADAS */}
        <section className={styles.suites}>
          <div className={styles.suitesInner}>
            <p className={styles.sectionEyebrow}>El Hotel</p>
            <h2>Suites Boutique a {HOTEL.minutosCaminandoALasPozas} Minutos de Las Pozas</h2>
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
            <h2>Despierta a {HOTEL.minutosCaminandoALasPozas} Minutos<br />del Jardín de Edward James</h2>
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
