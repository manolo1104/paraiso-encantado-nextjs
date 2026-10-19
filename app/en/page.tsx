import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { suites } from '@/data/suites';
import { HOTEL, lodgingSchema, faqSchema } from '@/lib/seo-hotel';
import { ENTITY_IDS, LAS_POZAS, XILITLA, EDWARD_JAMES, ref } from '@/lib/seo-entidades';
import styles from './en.module.css';

const URL_EN = `${HOTEL.url}/en`;

/**
 * Metadata de /en (17 oct 2026). Vivía en app/en/layout.tsx y tenía dos problemas:
 * - El title medía 83 caracteres y Google lo cortaba; el nuevo mide 58 y lleva
 *   «Xilitla», que es como se busca.
 * - En el layout, el canonical y los hreflang se heredan: cualquier página nueva
 *   /en/* que no declarara los suyos saldría con canonical a /en y no se indexaría.
 *   Aquí solo valen para esta página.
 * Next no mezcla `openGraph` entre layout y página (el de la página lo reemplaza
 * entero), por eso va completo aquí.
 */
export const metadata: Metadata = {
  title: `Hotel near Las Pozas, Xilitla · ${HOTEL.minutosCaminandoALasPozas}-Min Walk to Edward James`,
  description:
    `${HOTEL.suites} boutique suites, ${HOTEL.suitesConSpaPrivado} with a private spa, on the road to Las Pozas in Xilitla, Mexico: a ${HOTEL.minutosCaminandoALasPozas}-minute walk to the Edward James garden. Book direct.`,
  keywords: [
    'hotel near las pozas',
    'hotel las pozas xilitla',
    'hotels near las pozas xilitla',
    'hotel near edward james garden',
    'edward james surrealist garden hotel',
    'boutique hotel xilitla mexico',
    'xilitla accommodation',
    'huasteca potosina hotel english',
  ],
  alternates: {
    canonical: URL_EN,
    languages: {
      es: HOTEL.url,
      en: URL_EN,
      'x-default': HOTEL.url,
    },
  },
  openGraph: {
    siteName: HOTEL.nombre,
    title: 'Hotel near Las Pozas in Xilitla, Mexico — Hotel Paraíso Encantado',
    description:
      `${HOTEL.suites} boutique suites, ${HOTEL.suitesConSpaPrivado} with a private spa, a ${HOTEL.minutosCaminandoALasPozas}-minute walk from the Edward James Surrealist Garden. Direct booking, no commissions.`,
    locale: 'en_US',
    type: 'website',
    url: URL_EN,
    images: [
      {
        url: `${HOTEL.url}/og/home.jpg`,
        width: 1200,
        height: 630,
        alt: 'Hotel Paraíso Encantado — boutique hotel near the Edward James Garden, Xilitla, Mexico',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${HOTEL.url}/og/home.jpg`],
  },
};

/**
 * Sin precios (17 oct 2026). Las tarjetas decían «from $122 USD/night» y similares:
 * una conversión hecha a mano que no cuadraba con el motor (Jungla y LindaVista
 * cuestan lo mismo y salían distintas) y que el precio dinámico cambia cada noche.
 * Ahora cada tarjeta abre el motor con esa suite, y el motor dice el precio real.
 */
const SUITES = [
  {
    id: 'jungla',
    name: 'Jungle Suite',
    desc: 'A retreat surrounded by jungle. Private plunge spa, king bed, mountain views.',
    img: '/images/JUNGLA/PORTADA.JPG',
  },
  {
    id: 'lindavista',
    name: 'LindaVista Suite',
    desc: 'Total forest immersion with private jacuzzi and uninterrupted views from the treetops.',
    img: '/images/LINDAVISTA/PORTADA.jpg',
  },
  {
    id: 'helechos-1',
    name: 'Helechos Suite',
    desc: 'Family-friendly suite with three double beds and direct pool access.',
    img: '/images/HELECHOS 1/PORTADA.jpg',
  },
  {
    id: 'lirios-1',
    name: 'Lirios Suite',
    desc: 'Quiet retreat with garden views, perfect for couples seeking total relaxation.',
    img: '/images/LIRIOS 1/PORTADA.jpg',
  },
];

/** Capacidad real de cada suite, de data/suites.ts (la misma que usa la ficha). */
const capacidad = (id: string) => suites.find(s => s.id === id)?.maxOccupancy;

const AMENITIES = [
  // Las Pozas NO es "UNESCO-listed" (solo está en la Lista Indicativa desde 2009): es
  // Monumento Artístico desde 2012. Hoja única de cifras, 2 oct 2026.
  { icon: '🌿', title: `${HOTEL.minutosCaminandoALasPozas}-minute walk to Las Pozas`, desc: 'The Edward James Surrealist Garden, declared an Artistic Monument of Mexico in 2012.' },
  { icon: '🛁', title: `Private spa in ${HOTEL.suitesConSpaPrivado} suites`, desc: 'Outdoor plunge pools and jacuzzis surrounded by tropical jungle.' },
  { icon: '🍽️', title: 'Restaurant on-site', desc: 'El Papán Huasteco — regional cuisine with panoramic terrace views.' },
  { icon: '🚗', title: 'Free parking', desc: 'Secure private parking for all guests.' },
  { icon: '📶', title: 'High-speed WiFi', desc: 'Throughout the hotel and in every suite.' },
  // "Daily tours to Las Pozas" era falso: el jardín cierra los martes y los tours los
  // opera Huasteca Potosina Tours, no el hotel.
  { icon: '🎯', title: 'Day tours of the Huasteca', desc: 'Run by Huasteca Potosina Tours, with pick-up at the hotel. Las Pozas needs no tour: you walk there.' },
];

/**
 * Preguntas (17 oct 2026). Una sola lista para lo visible y para el FAQPage. Se
 * quitaron tres afirmaciones que nadie había comprobado y que esta página iba a
 * repetir desde el pie de todo el sitio: «Our team speaks English», «Thousands of
 * international visitors explore it safely every year» y «We confirm within 2 hours»
 * (el motor confirma al pagar). Si Manolo confirma que alguien atiende en inglés, la
 * pregunta del idioma vuelve con su respuesta.
 */
const FAQS = [
  {
    q: 'How far is the hotel from the Edward James Surrealist Garden?',
    a: `${HOTEL.metrosALasPozas} meters — a ${HOTEL.minutosCaminandoALasPozas}-minute walk, on the road to Las Pozas. Visits are guided (1 h 30 min) and need a time slot booked in advance; the garden is closed on Tuesdays and last entry is at 4:00 PM.`,
  },
  {
    q: 'How much does a night cost?',
    a: 'Rates are in Mexican pesos and change by night and season. The booking page shows the exact price of each suite for your dates before you pay, with nothing added at the end.',
  },
  {
    q: 'Can I book in English?',
    a: 'The booking page is in Spanish for now, but it only asks for your dates, the number of guests and your contact details, and you pay by card. If anything is unclear, message us on WhatsApp.',
  },
  {
    q: 'What is the cancellation policy?',
    a: 'Full refund if you cancel at least 7 days before arrival; 50% refund with at least 72 hours’ notice.',
  },
  {
    q: 'What is the best time of year to visit Xilitla?',
    a: 'November through May is the dry season, with the most comfortable weather and the clearest rivers. The gardens are lush year-round thanks to the humid mountain microclimate.',
  },
  {
    q: 'Can I book directly without a commission fee?',
    a: `Yes — booking directly means no third-party commissions, and you can see all ${HOTEL.suites} suites (OTAs do not always list everything).`,
  },
  {
    q: 'Is Xilitla safe to visit?',
    a: 'Xilitla is a small mountain town and a Pueblo Mágico since 2011. Practical advice from us: drive the mountain roads in daylight, and check your government’s current travel advice for San Luis Potosí before you go. We are happy to help with directions on WhatsApp.',
  },
];

/**
 * JSON-LD de /en (17 oct 2026). Antes era un LodgingBusiness SIN `@id`, con la
 * dirección a medias: para Google y las IA, un segundo hotel con el mismo nombre.
 * Ahora es el mismo `#hotel` de todo el sitio, con su descripción en inglés, más un
 * WebPage en inglés que dice de qué habla la página y el FAQPage de lo visible.
 * La calificación va porque la página la muestra en la franja de cifras.
 */
const schemaEn = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      ...lodgingSchema({
        description: `Boutique hotel with ${HOTEL.suites} suites, ${HOTEL.suitesConSpaPrivado} with a private spa, on the road to Las Pozas: ${HOTEL.metrosALasPozas} m (a ${HOTEL.minutosCaminandoALasPozas}-minute walk) from the Edward James sculpture garden in Xilitla, San Luis Potosí, Mexico.`,
        url: URL_EN,
        image: `${HOTEL.url}/og/home.jpg`,
        calificacion: true,
      }),
      checkinTime: '15:00',
      checkoutTime: '12:00',
    },
    {
      '@type': 'WebPage',
      '@id': `${URL_EN}#webpage`,
      url: URL_EN,
      name: 'Hotel near Las Pozas, Xilitla',
      inLanguage: 'en',
      about: { '@id': ENTITY_IDS.hotel },
      mentions: [ref(LAS_POZAS), ref(EDWARD_JAMES), ref(XILITLA)],
      isPartOf: { '@id': ENTITY_IDS.website },
    },
    faqSchema(FAQS),
  ],
};

export default function EnglishPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaEn) }}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroEye}>Xilitla · Huasteca Potosina · Mexico</p>
          {/* Era «The hotel next to Las Pozas»: sin «Xilitla», que es como se busca, y
              sonaba a que es el único o el más cercano (no lo es: ver /hotel-cerca-de-las-pozas). */}
          <h1 className={styles.heroTitle}>
            Hotel in Xilitla<br />
            <em>near Las Pozas</em>
          </h1>
          <p className={styles.heroSub}>
            {HOTEL.suites} boutique suites, {HOTEL.suitesConSpaPrivado} with a private spa · a {HOTEL.minutosCaminandoALasPozas}-minute walk to the Edward James Surrealist Garden
          </p>
          <div className={styles.heroCtas}>
            <Link href="/reservar" className={styles.ctaPrimary}>Book directly — no fees</Link>
            <a href="https://wa.me/524891007679?text=Hello!%20I%27d%20like%20information%20about%20Paraíso%20Encantado."
              className={styles.ctaSecondary}
              target="_blank" rel="noopener noreferrer">
              WhatsApp us
            </a>
          </div>
          <p className={styles.heroLang}>
            {/* <a> y no <Link>: con la carga completa el servidor vuelve a pintar
                `<html lang="es">` (el layout raíz no se repinta al navegar con <Link>). */}
            <a href="/" hrefLang="es" lang="es" className={styles.langLink}>🇲🇽 Ver en español</a>
          </p>
        </div>
      </section>

      {/* ── WHY STAY HERE ────────────────────────────────────────────────── */}
      <section className={styles.why}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Why Paraíso Encantado</p>
          <h2 className={styles.sectionTitle}>A {HOTEL.minutosCaminandoALasPozas}-minute walk<br /><em>to Edward James' masterpiece</em></h2>
          {/* Sin «chose Xilitla for its magical microclimate»: no tiene fuente. La hoja de
              datos dice que llegó en 1945 y compró la finca en 1947, para orquídeas. */}
          <p className={styles.sectionSub}>
            Edward James — the British surrealist patron who built Las Pozas — first came to Xilitla
            in 1945 and bought land here in 1947 to grow orchids. We are {HOTEL.metrosALasPozas} meters
            from the garden he created, on the road to its entrance: a {HOTEL.minutosCaminandoALasPozas}-minute walk.
          </p>
          <div className={styles.amenitiesGrid}>
            {AMENITIES.map(a => (
              <div key={a.title} className={styles.amenityCard}>
                <span className={styles.amenityIcon}>{a.icon}</span>
                <h3 className={styles.amenityTitle}>{a.title}</h3>
                <p className={styles.amenityDesc}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUITES ───────────────────────────────────────────────────────── */}
      <section className={styles.suites}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Accommodations</p>
          <h2 className={styles.sectionTitle}>{HOTEL.suites} suites · <em>each one unique</em></h2>
          <p className={styles.sectionSub}>
            From intimate retreats for couples to family suites for up to {HOTEL.capacidadMaxima} guests.
            Four of them include a private outdoor spa pool surrounded by tropical jungle. Rates are in
            Mexican pesos and change by night: the booking page shows the exact price for your dates.
          </p>
          <div className={styles.suitesGrid}>
            {SUITES.map(s => (
              <article key={s.id} className={styles.suiteCard}>
                <div className={styles.suiteImgWrap}>
                  <Image
                    src={s.img}
                    alt={`${s.name} — Hotel Paraíso Encantado, Xilitla`}
                    fill
                    className={styles.suiteImg}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className={styles.suiteBody}>
                  <h3 className={styles.suiteName}>{s.name}</h3>
                  <p className={styles.suiteDesc}>{s.desc}</p>
                  <div className={styles.suiteFooter}>
                    <span className={styles.suitePrice}>
                      {capacidad(s.id) ? `Sleeps up to ${capacidad(s.id)}` : ''}
                    </span>
                    {/* El motor abre con esta suite y enseña el precio real de cada noche. */}
                    <Link href={`/reservar?suiteId=${s.id}&autoselect=1`} className={styles.suiteBtn}>See rates & availability</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.suitesCtaWrap}>
            <Link href="/reservar" className={styles.ctaPrimary}>See all {HOTEL.suites} suites & book</Link>
          </div>
        </div>
      </section>

      {/* ── EDWARD JAMES CONTEXT ─────────────────────────────────────────── */}
      <section className={styles.context}>
        <div className={styles.contextInner}>
          <div className={styles.contextText}>
            <p className={styles.eyebrow}>About Las Pozas</p>
            <h2 className={styles.contextTitle}>
              Edward James built a surrealist paradise<br />
              <em>right here in the jungle</em>
            </h2>
            <p className={styles.contextBody}>
              Las Pozas is a sculpture garden of about 9 hectares, within a 37-hectare estate,
              created by the British surrealist patron Edward James (1907–1984), close friend of
              Salvador Dalí and René Magritte. He first came to Xilitla in 1945, bought the land in
              1947 and, after the frost of 1962, began building more than 30 concrete structures
              among natural pools and waterfalls, until his death in 1984. Nestled in the Sierra
              Madre Oriental, it was declared an Artistic Monument of Mexico in 2012.
            </p>
            <p className={styles.contextBody}>
              Visits are guided only (1 h 30 min, groups of up to 25), with English-language tours
              at 10:00 and 15:00. There is no online ticket sale for now: you book a time slot on the
              official website and pay at the gate — MXN $180 for adults, $120 for children aged 6
              to 12 and seniors over 65, plus the mandatory guide (MXN $30 per person; $60 in another
              language). Open Wednesday to Monday, 9:00 to 18:00, last entry at 16:00; closed on
              Tuesdays. Swimming in the pools is not allowed.
            </p>
            <p className={styles.contextBody}>
              Paraíso Encantado sits {HOTEL.metrosALasPozas} meters from the garden entrance — close enough to walk,
              far enough to offer complete tranquility.
            </p>
            <a
              href="https://maps.google.com/?q=Las+Pozas+Xilitla+San+Luis+Potosi"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapsLink}
            >
              📍 View on Google Maps
            </a>
          </div>
          <div className={styles.contextStats}>
            {[
              { value: `${HOTEL.metrosALasPozas}m`, label: 'walking distance to Las Pozas' },
              { value: '675m', label: 'altitude of Xilitla — humid mountain climate' },
              { value: `${HOTEL.suites}`, label: 'unique suites, each individually designed' },
              { value: `${HOTEL.rating}★`, label: `on Google — ${HOTEL.reviewCount} reviews` },
            ].map(s => (
              <div key={s.label} className={styles.statCard}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>FAQ</p>
          <h2 className={styles.sectionTitle}>Questions from <em>international guests</em></h2>
          <div className={styles.faqGrid}>
            {FAQS.map(f => (
              <div key={f.q} className={styles.faqItem}>
                <h3 className={styles.faqQ}>{f.q}</h3>
                <p className={styles.faqA}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2 className={styles.finalCtaTitle}>
            Ready to stay near<br /><em>Edward James' garden?</em>
          </h2>
          {/* Decía «We confirm within 2 hours»: el motor confirma en cuanto pagas
              (en español se promete «Confirmación instantánea»). */}
          <p className={styles.finalCtaSub}>
            Book directly — no commissions, and you see all {HOTEL.suites} suites.<br />
            Your booking is confirmed as soon as you pay.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/reservar" className={styles.ctaPrimary}>Book directly</Link>
            <a
              href="https://wa.me/524891007679?text=Hello!%20I%27d%20like%20to%20book%20at%20Paraíso%20Encantado."
              className={styles.ctaSecondary}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
