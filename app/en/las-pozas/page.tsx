import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HOTEL, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';
import { ENTITY_IDS, LAS_POZAS, EDWARD_JAMES, XILITLA, ref } from '@/lib/seo-entidades';
import en from '../en.module.css';
import styles from './las-pozas.module.css';

/**
 * /en/las-pozas — Las Pozas en inglés: boletos, horario y reglas (19 oct 2026).
 *
 * Para las búsquedas en inglés: «las pozas xilitla tickets», «las pozas hours»,
 * «edward james garden tickets», «edward james surrealist garden» y «hotels near
 * las pozas». Es el par en inglés de /blog/las-pozas-edward-james-guia, con
 * hreflang en los dos sentidos: no compite con ella, Google enseña a cada quien
 * la de su idioma.
 *
 * Cada dato sale de la guía en español (verificada el 2 oct 2026 contra el sitio
 * oficial y el sistema de reservaciones) y de la hoja única de cifras
 * (marketing/HOJA-DATOS-VERIFICADOS-OCT-2026.md). Si allá cambia un precio, un
 * horario o una regla, se cambia aquí en el mismo commit.
 *
 * Dos cosas a propósito:
 * - Sin metros ni minutos del hotel al jardín: la distancia a pie se está volviendo
 *   a medir (ver `metrosALasPozas` en lib/seo-hotel.ts). Aquí dice «a short walk».
 * - Precios solo en pesos, sin conversión a dólares (como /en desde el 17 oct 2026).
 */

const URL_PAGINA = `${HOTEL.url}/en/las-pozas`;
const URL_GUIA_ES = `${HOTEL.url}/blog/las-pozas-edward-james-guia`;

// 54 caracteres. Una sola constante para el <title>, Open Graph y el WebPage.
const TITULO = 'Las Pozas Xilitla 2026: Tickets, Hours and How to Book';
const DESCRIPCION =
  'Las Pozas costs $180 MXN at the gate plus a required guide ($60 in English). Closed Tuesdays, last entry 4 PM, no swimming. How to get your time slot.';

// Las mismas fuentes que cita la guía en español.
const SITIO_OFICIAL = 'https://laspozasxilitla.org.mx/';
const RESERVAS = 'https://boletos.laspozasxilitla.org.mx/guest';
const REGLAMENTO = 'https://laspozasxilitla.org.mx/wp-content/uploads/2024/09/Reglamento2024.pdf';
// La declaratoria es de la SEP (Acuerdo 658), no del INBA: el INBA solo aloja el PDF.
const ACUERDO_658 = 'https://inba.gob.mx/multimedia/transparencia/inmuebles/47/47-ARCH-47_conjunto_xilitla.pdf';
const ANUNCIO_NOCHE =
  'https://www.facebook.com/JardinEscultoricoEdwardJamesLasPozas/posts/pfbid02E15SgZ4PHW7sqHa9SvpGYMPRFRzFBAvpVSPq22fVeq51RaiGUxY3VQ5FVvRfvUi4l';
const MURAL_CARRINGTON =
  'https://www.revistadelauniversidad.mx/downloads/9aadc057-f15e-4426-9bd9-90e4f3ad82e4/rum-ABR.2009-reportaje%20gr%c3%a1fico-un-mural-en-la-selva-el-de-leonora-carrington.pdf';
// El pin oficial del jardín (lib/seo-entidades.ts), no una búsqueda por nombre.
const MAPA = `https://www.google.com/maps/search/?api=1&query=${LAS_POZAS.geo.latitude},${LAS_POZAS.geo.longitude}`;

// Foto real de Las Pozas (CC0, Wikimedia Commons), la misma de /xilitla y de
// /hotel-cerca-de-las-pozas; la versión -og está recortada a 1200×630.
const FOTO = '/images/las-pozas/columnas-las-pozas-edward-james-xilitla.jpg';
const FOTO_OG = '/images/las-pozas/columnas-las-pozas-edward-james-xilitla-og.jpg';
const FOTO_ALT =
  'Concrete columns of Las Pozas, Edward James’ surrealist garden, in the jungle of Xilitla, Mexico';

/**
 * Canonical y hreflang PROPIOS: el layout de /en ya no los hereda (17 oct 2026), y
 * sin ellos esta página no tendría canonical. El par en español es la guía del blog,
 * que también es el x-default (el sitio es primero en español, como en /en).
 */
export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  keywords: [
    'las pozas xilitla tickets',
    'las pozas hours',
    'edward james garden tickets',
    'edward james surrealist garden',
    'hotels near las pozas',
  ],
  alternates: {
    canonical: URL_PAGINA,
    languages: {
      es: URL_GUIA_ES,
      en: URL_PAGINA,
      'x-default': URL_GUIA_ES,
    },
  },
  // Next no mezcla el openGraph del layout con el de la página: va completo aquí.
  openGraph: {
    siteName: HOTEL.nombre,
    locale: 'en_US',
    type: 'website',
    url: URL_PAGINA,
    title: TITULO,
    description: DESCRIPCION,
    images: [
      {
        url: `${HOTEL.url}${FOTO_OG}`,
        width: 1200,
        height: 630,
        alt: FOTO_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${HOTEL.url}${FOTO_OG}`],
  },
};

/**
 * Una sola lista para lo visible y para el FAQPage: Google descarta el schema si
 * no dice literalmente lo mismo que la página. Por eso las respuestas se pintan
 * como texto plano, sin negritas ni enlaces.
 */
const FAQS = [
  {
    q: 'How much are Las Pozas tickets?',
    a: 'Entry costs $180 MXN for adults and $120 MXN for children aged 6 to 12 and for over-65s with an INAPAM card; children under 6 and Xilitla residents with their INE ID get in free. The guide is required and paid separately, to the guide: $30 MXN per person in Spanish or $60 MXN in another language. You book your time slot online for free and pay the entry at the gate, in cash or by card. You may still see an online price of $170 MXN on some pages, including the official «Planea tu visita» page: that was the early-2026 scheme, and the notice on the official homepage (checked on October 19, 2026) says there are no online sales for now.',
  },
  {
    q: 'Is Las Pozas open on Tuesdays?',
    a: 'No. Las Pozas is closed on Tuesdays. It opens Wednesday to Monday, from 9:00 AM to 6:00 PM, and the last entry is at 4:00 PM.',
  },
  {
    q: 'Can you swim at Las Pozas?',
    a: 'No. The garden’s rules do not allow swimming in the river or in the pools, or going in wearing swimwear: the pools are there to be seen.',
  },
  {
    q: 'Is a guide required at Las Pozas?',
    a: 'Yes. You can only visit with an authorized guide, in groups of up to 25, and the tour lasts 1 hour 30 minutes. The guide costs $30 MXN per person in Spanish or $60 MXN in another language; tours in English start at 10:00 AM and 3:00 PM.',
  },
  {
    q: 'How long is the visit?',
    a: 'The guided tour lasts 1 hour 30 minutes. Arrive 10 minutes before your slot, and if you add the ticket office and some time at the Museo Edward James or the Los Comales waterfall, both next to the entrance, set aside half a day.',
  },
  {
    q: 'Is there parking at Las Pozas?',
    a: 'No. The garden has no parking of its own, so it is best to arrive by taxi or on foot from your hotel.',
  },
];

// Licencia de la foto declarada como en /xilitla: es lo que lee Google Imágenes.
const IMAGEN = {
  '@type': 'ImageObject',
  contentUrl: `${HOTEL.url}${FOTO}`,
  url: `${HOTEL.url}${FOTO}`,
  width: 1920,
  height: 908,
  caption: 'Concrete columns of Las Pozas in the jungle of Xilitla, San Luis Potosí, Mexico.',
  creator: { '@type': 'Person', name: 'A01701823 SergioC' },
  creditText: 'A01701823 SergioC / Wikimedia Commons (CC0)',
  license: 'https://creativecommons.org/publicdomain/zero/1.0/',
  acquireLicensePage:
    'https://commons.wikimedia.org/wiki/File:Lugar_de_Fantasia,_Jardin_de_Edward_James._Xilitla,_San_Luis_Potosi,_Mexico.jpg',
};

/**
 * JSON-LD: la página trata de Las Pozas y nombra a Edward James, a Xilitla y al
 * hotel. Las entidades van por su `@id` (Wikidata), igual que en /en; el hotel es el
 * mismo `#hotel` de todo el sitio, nunca un segundo nodo Hotel. La fecha es la del
 * último cambio de contenido: si cambia el texto, cambia aquí y en el sitemap.
 */
const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${URL_PAGINA}#webpage`,
      url: URL_PAGINA,
      name: TITULO,
      description: DESCRIPCION,
      inLanguage: 'en',
      about: ref(LAS_POZAS),
      mentions: [ref(EDWARD_JAMES), ref(XILITLA), { '@id': ENTITY_IDS.hotel }],
      isPartOf: { '@id': ENTITY_IDS.website },
      primaryImageOfPage: IMAGEN,
      breadcrumb: { '@id': `${URL_PAGINA}#breadcrumb` },
      datePublished: '2026-10-20',
      dateModified: '2026-10-20',
    },
    // Las tres entidades completas (Wikidata, Wikipedia, coordenadas), no solo su @id:
    // `ref()` apunta a un nodo que tiene que estar en ESTE @graph para que un buscador
    // lo resuelva sin ir a otra página.
    LAS_POZAS,
    EDWARD_JAMES,
    XILITLA,
    { '@id': `${URL_PAGINA}#faq`, ...faqSchema(FAQS), inLanguage: 'en' },
    {
      '@id': `${URL_PAGINA}#breadcrumb`,
      ...breadcrumbSchema([
        { name: 'Home', url: `${HOTEL.url}/en` },
        { name: 'Las Pozas', url: URL_PAGINA },
      ]),
    },
  ],
};

export default function LasPozasEnglishPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        {/* ── HERO: la respuesta va arriba, antes que nada ─────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroImg}>
            {/* Foto panorámica (2:1): en celular el recorte cae un poco a la izquierda
                del centro, para que se vean las columnas y el arco (como en /xilitla). */}
            <Image
              src={FOTO}
              alt={FOTO_ALT}
              fill
              priority
              quality={80}
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: '42% 35%' }}
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/en">Home</Link>
              <span aria-hidden="true"> › </span>
              <span aria-current="page">Las Pozas</span>
            </nav>
            <p className={styles.heroEye}>Xilitla · San Luis Potosí · Mexico</p>
            <h1 className={styles.heroTitle}>
              Las Pozas, Xilitla:{' '}
              <span className={styles.heroTitleAccent}>Tickets, Hours and Rules (2026)</span>
            </h1>
            <p className={styles.heroIntro}>
              Las Pozas is the surrealist sculpture garden that the British poet Edward James built
              in the jungle of Xilitla, Mexico, between 1962 and 1984. In 2026 entry costs{' '}
              <strong>$180 MXN</strong>, paid at the gate, and you can only visit{' '}
              <strong>with a guide</strong>: $30 MXN per person in Spanish or $60 MXN in English.{' '}
              <strong>Book your time slot first</strong> on the official booking system — it is free —
              and remember that the garden is <strong>closed on Tuesdays</strong>.
            </p>
            <div className={styles.heroCtas}>
              <a href={RESERVAS} target="_blank" rel="noopener noreferrer" className={styles.ctaGold}>
                Official booking system <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p className={styles.heroLang}>
              {/* <a> y no <Link>: con la carga completa el servidor vuelve a pintar
                  `<html lang="es">` (el layout raíz no se repinta al navegar con <Link>). */}
              <a href="/blog/las-pozas-edward-james-guia" hrefLang="es" lang="es">Leer en español</a>
            </p>
          </div>
        </section>

        {/* ── BOLETOS Y HORARIO ─────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="tickets-and-hours">
          <div className={styles.inner}>
            <h2 id="tickets-and-hours" className={en.sectionTitle}>Tickets and hours 2026</h2>
            <table className={styles.table}>
              <caption>
                Checked with the official website and the official booking system on 2 October 2026.
                Prices in Mexican pesos (MXN).
              </caption>
              <tbody>
                <tr>
                  <th scope="row">Days</th>
                  <td>Wednesday to Monday. <strong>Closed on Tuesdays.</strong></td>
                </tr>
                <tr>
                  <th scope="row">Hours</th>
                  <td>9:00 AM to 6:00 PM. <strong>Last entry: 4:00 PM.</strong></td>
                </tr>
                <tr>
                  <th scope="row">Entry</th>
                  <td>
                    $180 MXN adults<br />
                    $120 MXN children aged 6 to 12, and over-65s with an INAPAM card<br />
                    Free for children under 6, and for Xilitla residents with their INE ID
                  </td>
                </tr>
                <tr>
                  <th scope="row">Guide</th>
                  <td>
                    <strong>Required</strong>: $30 MXN per person in Spanish, $60 MXN in another
                    language. Paid to the guide at the garden, so bring cash.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Visit</th>
                  <td>Guided tour of 1 h 30 min, in groups of up to 25.</td>
                </tr>
                <tr>
                  <th scope="row">Tickets</th>
                  <td>
                    You book your time slot online for free and pay at the ticket office, in cash or by
                    card. No online ticket sales as of October 2026.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Swimming</th>
                  <td><strong>Not allowed</strong>, and no swimwear.</td>
                </tr>
                <tr>
                  <th scope="row">Parking</th>
                  <td>The garden has <strong>none</strong>.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── CÓMO RESERVAR EL TURNO ────────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="time-slot">
          <div className={`${styles.inner} ${styles.prose}`}>
            <h2 id="time-slot" className={en.sectionTitle}>How to get your time slot</h2>
            <p>
              As of October 2026 there are no online ticket sales: the official system reserves your day
              and time slot for free, and you pay at the gate.
            </p>
            <ol className={styles.steps}>
              <li>
                Go to the{' '}
                <a href={RESERVAS} target="_blank" rel="noopener noreferrer">official booking system</a>.
                You can book up to 60 days ahead and up to 15 tickets per booking. Booking is free.
              </li>
              <li>
                Choose the day and the time slot. Slots run from 9:00 AM to 4:00 PM, and on weekends the
                system often adds an extra one at 8:00 AM. For a tour in English, choose 10:00 AM or
                3:00 PM.
              </li>
              <li>
                Save your confirmation as a screenshot or print it: the phone signal inside the garden is
                limited.
              </li>
              <li>
                Arrive 10 minutes early at the ticket office, at the garden entrance, with your
                confirmation and an ID. You pay the entry there, in cash or by card.{' '}
                <strong>If you arrive late, you lose your slot.</strong>
              </li>
              <li>
                Pay the guide assigned to you: $30 MXN per person in Spanish or $60 MXN in another
                language.
              </li>
            </ol>
            <div className={styles.note}>
              <p>
                <strong>Slots sell out on long weekends and in high season.</strong> On 2 October 2026,
                Sunday 1 November (during Xantolo) no longer had places at noon, 3:00 PM or 3:30 PM. If you
                already have dates, book your slot the same day you book your hotel.
              </p>
            </div>
            <p>
              The first slot (9:00 AM, or 8:00 AM on weekends) and the last one (4:00 PM) are usually
              less crowded: organized groups from Ciudad Valles arrive mid-morning.
            </p>
          </div>
        </section>

        {/* ── TOURS EN INGLÉS ───────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="english-tours">
          <div className={`${styles.inner} ${styles.prose}`}>
            <h2 id="english-tours" className={en.sectionTitle}>English-speaking tours</h2>
            <div className={styles.times}>
              <div className={styles.time}>
                <span className={styles.timeValue}>10:00 AM</span>
                <span className={styles.timeLabel}>Tour in English</span>
              </div>
              <div className={styles.time}>
                <span className={styles.timeValue}>3:00 PM</span>
                <span className={styles.timeLabel}>Tour in English</span>
              </div>
            </div>
            <p>
              Guided tours in English start at <strong>10:00 AM and 3:00 PM</strong> (10:00 and 15:00 on
              the 24-hour clock): choose one of those two slots when you book. A tour in a language other
              than Spanish costs <strong>$60 MXN per person</strong> for the guide, instead of $30 MXN,
              paid to the guide at the garden. It is the same 1 h 30 min tour, in groups of up to 25.
            </p>
          </div>
        </section>

        {/* ── QUÉ ESTÁ PROHIBIDO ────────────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="rules">
          <div className={`${styles.inner} ${styles.prose}`}>
            <h2 id="rules" className={en.sectionTitle}>What is not allowed</h2>
            <p>
              The garden’s{' '}
              <a href={REGLAMENTO} target="_blank" rel="noopener noreferrer">2024 regulations</a>{' '}
              do not allow:
            </p>
            <ul className={styles.bullets}>
              <li>Swimming in the river or the pools, or going in wearing swimwear.</li>
              <li>Pets. Only service animals with their accreditation are allowed.</li>
              <li>Food and drink, except bottled water.</li>
              <li>Strollers or high heels.</li>
              <li>Tripods, selfie sticks or lights without permission. Drones only for authorized productions.</li>
              <li>Leaving the paths, or placing objects on the sculptures.</li>
            </ul>
            <p>
              <strong>Allowed:</strong> photos with a phone or camera (not for commercial use), bottled
              water, and closed shoes with good grip — there are stairs and wet stone all year. The garden
              also warns that the route has stairs and slopes, so it is not recommended for people with
              reduced mobility or heart problems, and there is no restaurant inside.
            </p>
          </div>
        </section>

        {/* ── QUÉ VAS A VER ─────────────────────────────────────────────────── */}
        {/* Nombres oficiales de la hoja de cifras; los que no tienen fuente
            («Flor de Cinco Pétalos», «El Laberinto»…) no entran. */}
        <section className={styles.section} aria-labelledby="what-you-will-see">
          <div className={styles.inner}>
            <h2 id="what-you-will-see" className={en.sectionTitle}>What you will see</h2>
            <div className={styles.prose}>
              <p>
                The sculpture garden covers about 9 hectares of a 37-hectare estate, on the slope of the
                La Conchita river. It has more than 30 concrete structures (the foundation that runs it
                counts 27 or 28 in the area you walk through): columns that hold nothing up, stairs that
                lead nowhere and arches open to the jungle. These are some of them, with their official
                names in Spanish:
              </p>
            </div>
            <ul className={styles.places}>
              <li className={styles.place}>
                <h3 className={styles.placeName}>
                  <span lang="es">Escalera al Cielo</span>{' '}
                  <span className={styles.placeEn}>(Stairway to Heaven)</span>
                </h3>
                <p className={styles.placeDesc}>It climbs among the trees and ends in mid-air.</p>
              </li>
              <li className={styles.place}>
                <h3 className={styles.placeName}>
                  <span lang="es">La casa de tres pisos que podrían ser cinco</span>{' '}
                  <span className={styles.placeEn}>(The House with Three Floors Which Could Be Five)</span>
                </h3>
                <p className={styles.placeDesc}>
                  Also known as the <span lang="es">Casa de las Chimeneas</span> or{' '}
                  <span lang="es">Casa de los Hoyos</span>. Hurricane Gilbert damaged it in 1988, and it
                  was restored.
                </p>
              </li>
              <li className={styles.place}>
                <h3 className={styles.placeName}>
                  <span lang="es">Palacio de Bambú</span>{' '}
                  <span className={styles.placeEn}>(Bamboo Palace)</span>
                </h3>
                <p className={styles.placeDesc}>
                  The private experience sold by the garden includes access to its upper levels.
                </p>
              </li>
              <li className={styles.place}>
                <h3 className={styles.placeName}>
                  <span lang="es">Puerta de San Pedro y San Pablo</span>{' '}
                  <span className={styles.placeEn}>(Saint Peter and Saint Paul Gate)</span>
                </h3>
              </li>
              <li className={styles.place}>
                <h3 className={styles.placeName}>
                  <span lang="es">Puente Flor de Lis</span>{' '}
                  <span className={styles.placeEn}>(Fleur-de-Lis Bridge)</span>
                </h3>
              </li>
              <li className={styles.place}>
                <h3 className={styles.placeName}>
                  <span lang="es">El Cinematógrafo</span>{' '}
                  <span className={styles.placeEn}>(The Cinematograph)</span>
                </h3>
              </li>
              <li className={styles.place}>
                <h3 className={styles.placeName}>
                  <span lang="es">La Cabaña de Don Eduardo</span>{' '}
                  <span className={styles.placeEn}>(Don Eduardo’s Cabin)</span>
                </h3>
                <p className={styles.placeDesc}>
                  James used it as his bedroom; one of his poems is written on the wall.
                </p>
              </li>
              <li className={styles.place}>
                <h3 className={styles.placeName}>
                  <span lang="es">La Larga, La Taza and La Campana</span>{' '}
                  <span className={styles.placeEn}>(the pools)</span>
                </h3>
                <p className={styles.placeDesc}>
                  Formed by the river and its waterfalls. They are for looking at, not for swimming.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* ── EDWARD JAMES ──────────────────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="edward-james">
          <div className={styles.inner}>
            <h2 id="edward-james" className={en.sectionTitle}>Who was Edward James?</h2>
            <div className={styles.prose}>
              <p>
                Edward Frank Willis James (1907–1984) was a British aristocrat, poet and collector, and a
                patron of surrealist painters such as Salvador Dalí and René Magritte. He came to Xilitla
                in 1945 with Plutarco Gastélum, whom he had met in Cuernavaca, and in 1947 bought a coffee
                farm where he grew orchids and kept animals. When a frost killed the orchids in 1962, he
                began to build in concrete, and he kept building until his death in 1984. More than 150
                people worked on the garden.
              </p>
            </div>
            <table className={`${styles.table} ${styles.tableGap}`}>
              <thead>
                <tr>
                  <th scope="col">Year</th>
                  <th scope="col">What happened</th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">1945</th><td>Edward James and Plutarco Gastélum arrive in Xilitla.</td></tr>
                <tr><th scope="row">1947</th><td>James buys the farm and fills it with orchids and animals.</td></tr>
                <tr><th scope="row">1962</th><td>A frost kills the orchids, and the concrete structures begin.</td></tr>
                <tr>
                  <th scope="row">Around 1964</th>
                  <td>
                    Leonora Carrington, a friend of James, paints a mural on a column of Plutarco
                    Gastélum’s house in the town, not in the garden.
                  </td>
                </tr>
                <tr><th scope="row">1984</th><td>James dies in San Remo, Italy. More than 150 people had worked on the garden.</td></tr>
                <tr><th scope="row">1991</th><td>The garden opens to the public.</td></tr>
                <tr>
                  <th scope="row">2007</th>
                  <td>
                    The <span lang="es">Fundación Pedro y Elena Hernández</span> buys it, with Cemex and
                    the government of San Luis Potosí.
                  </td>
                </tr>
                <tr><th scope="row">2009</th><td>It enters UNESCO’s Tentative List.</td></tr>
                <tr><th scope="row">2012</th><td>Mexico declares it an Artistic Monument.</td></tr>
                <tr><th scope="row">2020</th><td>It joins the Great Gardens of the World network.</td></tr>
                <tr><th scope="row">2022</th><td>The Museo Edward James opens next to the garden.</td></tr>
              </tbody>
            </table>
            <div className={styles.prose}>
              <p>
                <strong>Las Pozas is not a UNESCO World Heritage Site.</strong> It has been on UNESCO’s
                Tentative List, the step before a nomination, since 2009, and in 2012 Mexico declared it an
                Artistic Monument. From James’ death in 1984 until 2007 the garden belonged to the
                Gastélum family.
              </p>
            </div>
          </div>
        </section>

        {/* ── DE NOCHE ──────────────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="night-visits">
          <div className={`${styles.inner} ${styles.prose}`}>
            <h2 id="night-visits" className={en.sectionTitle}>Night visits</h2>
            <p>
              The regular visit is daytime only: the last entry is at 4:00 PM. The garden opens at night
              only for special events that it announces itself.
            </p>
            <p>
              In 2026 that event is{' '}
              <em lang="es">“Luces y Sombras: El Jardín de un Iluminado”</em>, a night tour on{' '}
              <strong>Sunday 1 November</strong>, during Xantolo (the Huasteca’s Day of the Dead), at{' '}
              <strong>7:30 PM and 8:30 PM</strong>. It is booked by phone on{' '}
              <a href="tel:+524891118050">+52 489 111 8050</a>. The garden has not published a price: ask
              when you book. Source:{' '}
              <a href={ANUNCIO_NOCHE} target="_blank" rel="noopener noreferrer">
                the garden’s official Facebook post
              </a>.
            </p>
          </div>
        </section>

        {/* ── CÓMO LLEGAR ───────────────────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="getting-there">
          <div className={`${styles.inner} ${styles.prose}`}>
            <h2 id="getting-there" className={en.sectionTitle}>Getting there</h2>
            <p>
              Las Pozas is in Barrio La Conchita, at <span lang="es">Camino Paseo Las Pozas s/n</span>,
              Xilitla: about 2.4 km from the town center, 5 minutes by car.{' '}
              <strong>The garden has no parking</strong>, so come by taxi or on foot from your hotel.{' '}
              <a href={MAPA} target="_blank" rel="noopener noreferrer">See the official location on Google Maps</a>.
            </p>
            <p>
              Xilitla is in the Huasteca Potosina, in the state of San Luis Potosí. By car it is about
              7 hours from Mexico City and 5 hours from the city of San Luis Potosí; the most practical
              airport is Tampico (TAM), about 3 h 30 min away. Drive the mountain roads in daylight: they
              are unlit and often foggy.
            </p>
          </div>
        </section>

        {/* ── DÓNDE DORMIR ──────────────────────────────────────────────────── */}
        {/* Sin metros, sin minutos y sin «el más cercano»: la distancia a pie se está
            volviendo a medir, y la tabla de /hoteles-en-xilitla pone otro hotel más cerca. */}
        <section className={styles.section} aria-labelledby="where-to-stay">
          <div className={styles.inner}>
            <h2 id="where-to-stay" className={en.sectionTitle}>Where to stay nearby</h2>
            <div className={styles.prose}>
              <p>
                If you sleep in Xilitla you can take the first slot of the morning without driving
                first; groups coming from Ciudad Valles drive more than an hour and a half.
              </p>
              <p>
                Hotel Paraíso Encantado is on the road to Las Pozas, a short walk from the garden
                entrance: {HOTEL.suites} suites, {HOTEL.suitesConSpaPrivado} of them with a private spa,
                and free parking for guests, so you can leave the car at the hotel and walk to your slot.
              </p>
            </div>
            {/* Fuera de .prose: sus estilos de enlace taparían los del botón. */}
            <div className={styles.ctaRow}>
              <Link href="/en" className={en.ctaPrimary}>
                Hotel near Las Pozas <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── PREGUNTAS FRECUENTES (las mismas del FAQPage) ─────────────────── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="faq">
          <div className={styles.inner}>
            <h2 id="faq" className={en.sectionTitle}>Frequently asked questions</h2>
            <div className={styles.faqList}>
              {FAQS.map(f => (
                <div key={f.q} className={styles.faqItem}>
                  <h3 className={styles.faqQ}>{f.q}</h3>
                  <p className={styles.faqA}>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FUENTES ───────────────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="sources">
          <div className={styles.inner}>
            <h2 id="sources" className={en.sectionTitle}>Sources</h2>
            <ul className={styles.sources}>
              <li>
                <a href={SITIO_OFICIAL} className={styles.link} target="_blank" rel="noopener noreferrer">
                  Official Las Pozas website
                </a>
                : hours, prices, guide and booking.
              </li>
              <li>
                <a href={REGLAMENTO} className={styles.link} target="_blank" rel="noopener noreferrer">
                  The garden’s 2024 regulations
                </a>{' '}
                (PDF, in Spanish).
              </li>
              <li>
                <a href={RESERVAS} className={styles.link} target="_blank" rel="noopener noreferrer">
                  Official booking system
                </a>
                , consulted on 2 October 2026.
              </li>
              <li>
                <a href={ACUERDO_658} className={styles.link} target="_blank" rel="noopener noreferrer">
                  Acuerdo 658 of the SEP declaring the Xilitla sculpture complex an Artistic Monument
                </a>{' '}
                (PDF, in Spanish), published in the <span lang="es">Diario Oficial de la Federación</span>{' '}
                on 30 November 2012.
              </li>
              <li>
                Night tour:{' '}
                <a href={ANUNCIO_NOCHE} className={styles.link} target="_blank" rel="noopener noreferrer">
                  announcement by the Jardín Escultórico Edward James on Facebook
                </a>
                , consulted on 19 October 2026.
              </li>
              <li>
                Leonora Carrington’s mural in Xilitla: Elena Poniatowska,{' '}
                <a href={MURAL_CARRINGTON} className={styles.link} target="_blank" rel="noopener noreferrer">
                  <span lang="es">“Un mural en la selva, el de Leonora Carrington”</span>
                </a>{' '}
                (in Spanish), <span lang="es">Revista de la Universidad de México</span>, April 2009.
              </li>
              <li>
                {/* Las mismas Wikipedias en inglés del `sameAs` de lib/seo-entidades.ts. */}
                <a href="https://en.wikipedia.org/wiki/Las_Pozas" className={styles.link} target="_blank" rel="noopener noreferrer">
                  Las Pozas
                </a>{' '}
                and{' '}
                <a href="https://en.wikipedia.org/wiki/Edward_James" className={styles.link} target="_blank" rel="noopener noreferrer">
                  Edward James
                </a>{' '}
                on Wikipedia.
              </li>
            </ul>
            <p className={styles.checked}>
              Facts checked on 2 October 2026 (the night tour, on 19 October 2026). If anything changes —
              prices, hours or rules — the official website prevails. Guide by Hotel Paraíso Encantado,
              on the road to Las Pozas in Xilitla.
            </p>
            <p className={styles.checked}>
              <a href="/blog/las-pozas-edward-james-guia" hrefLang="es" lang="es" className={styles.link}>
                Leer en español
              </a>
            </p>
          </div>
        </section>

      </main>
    </>
  );
}
