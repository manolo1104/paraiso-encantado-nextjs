import Image from 'next/image';
import Link from 'next/link';
import styles from './en.module.css';

const jsonLdEn = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Hotel Paraíso Encantado',
  description:
    '13 boutique suites (4 with private spa) 5 minutes walk from the Edward James Surrealist Garden (Las Pozas) in Xilitla, Huasteca Potosina, Mexico.',
  url: 'https://www.paraisoencantado.com',
  telephone: '+524891007679',
  email: 'reservas@paraisoencantado.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Xilitla',
    addressRegion: 'San Luis Potosí',
    addressCountry: 'MX',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 21.395, longitude: -98.9915 },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.5,
    reviewCount: 523,
    bestRating: 5,
  },
  priceRange: '$$',
  checkinTime: '15:00',
  checkoutTime: '12:00',
};

const SUITES = [
  {
    name: 'Jungle Suite',
    spanish: 'Jungla',
    desc: 'A sanctuary immersed in the cloud forest. Private plunge spa, king bed, mountain views.',
    price: 'from $122 USD/night',
    img: '/images/JUNGLA/PORTADA.JPG',
  },
  {
    name: 'LindaVista Suite',
    spanish: 'LindaVista',
    desc: 'Total forest immersion with private jacuzzi and uninterrupted views from the treetops.',
    price: 'from $133 USD/night',
    img: '/images/LINDAVISTA/PORTADA.jpg',
  },
  {
    name: 'Helechos Suite',
    spanish: 'Helechos 1',
    desc: 'Family-friendly suite with three queen beds and direct pool access. Sleeps up to 6.',
    price: 'from $101 USD/night',
    img: '/images/HELECHOS 1/PORTADA.jpg',
  },
  {
    name: 'Lirios Suite',
    spanish: 'Lirios 1',
    desc: 'Quiet retreat with garden views, perfect for couples seeking total relaxation.',
    price: 'from $80 USD/night',
    img: '/images/LIRIOS 1/PORTADA.jpg',
  },
];

const AMENITIES = [
  // Las Pozas NO es "UNESCO-listed" (solo está en la Lista Indicativa desde 2009): es
  // Monumento Artístico desde 2012. Hoja única de cifras, 2 oct 2026.
  { icon: '🌿', title: '5-minute walk to Las Pozas', desc: 'The Edward James Surrealist Garden, declared an Artistic Monument of Mexico in 2012.' },
  { icon: '🛁', title: 'Private spa in 4 suites', desc: 'Outdoor plunge pools and jacuzzis surrounded by tropical jungle.' },
  { icon: '🍽️', title: 'Restaurant on-site', desc: 'El Papán Huasteco — regional cuisine with panoramic terrace views.' },
  { icon: '🚗', title: 'Free parking', desc: 'Secure private parking for all guests.' },
  { icon: '📶', title: 'High-speed WiFi', desc: 'Throughout the hotel and in every suite.' },
  // "Daily tours to Las Pozas" era falso: el jardín cierra los martes y los tours los
  // opera Huasteca Potosina Tours, no el hotel.
  { icon: '🎯', title: 'Day tours of the Huasteca', desc: 'Run by Huasteca Potosina Tours, with pick-up at the hotel. Las Pozas needs no tour: you walk there.' },
];

const FAQS = [
  {
    q: 'How far is the hotel from the Edward James Surrealist Garden?',
    a: '400 meters — a 5-minute walk, on the road to Las Pozas. Visits are guided (1 h 30 min) and need a time slot booked in advance; the garden is closed on Tuesdays and last entry is at 4:00 PM.',
  },
  {
    q: 'Do you have English-speaking staff?',
    a: 'Yes. Our team speaks English and can assist with tours, directions, and any special requests.',
  },
  {
    q: 'What is the best time of year to visit Xilitla?',
    a: 'November through May is the dry season, with the most comfortable weather and the clearest rivers. The gardens are lush year-round thanks to the humid mountain microclimate.',
  },
  {
    q: 'Can I book directly without a commission fee?',
    a: 'Yes — booking directly means no third-party commissions, and you can see all 13 suites (OTAs do not always list everything).',
  },
  {
    q: 'Is Xilitla safe to visit?',
    a: 'Xilitla is a small, tranquil mountain town. Thousands of international visitors explore it safely every year. We are happy to advise on getting here.',
  },
];

export default function EnglishPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdEn) }}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroEye}>Xilitla · Huasteca Potosina · Mexico</p>
          <h1 className={styles.heroTitle}>
            The hotel<br />
            <em>next to Las Pozas</em>
          </h1>
          <p className={styles.heroSub}>
            13 boutique suites, 4 with private spa · 5 minutes walk from the Edward James Surrealist Garden
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
            <Link href="/" className={styles.langLink}>🇲🇽 Ver en español</Link>
          </p>
        </div>
      </section>

      {/* ── WHY STAY HERE ────────────────────────────────────────────────── */}
      <section className={styles.why}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Why Paraíso Encantado</p>
          <h2 className={styles.sectionTitle}>A 5-minute walk<br /><em>to Edward James' masterpiece</em></h2>
          <p className={styles.sectionSub}>
            Edward James — the British surrealist patron who built Las Pozas — chose Xilitla for its magical
            microclimate and lush jungle. We are 400 meters from the garden he created, on the road to its
            entrance: a 5-minute walk to one of the most extraordinary artistic environments in the world.
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
          <h2 className={styles.sectionTitle}>13 suites · <em>each one unique</em></h2>
          <p className={styles.sectionSub}>
            From intimate retreats for couples to spacious family suites sleeping 6.
            Four of them include a private outdoor spa pool surrounded by tropical jungle.
          </p>
          <div className={styles.suitesGrid}>
            {SUITES.map(s => (
              <article key={s.spanish} className={styles.suiteCard}>
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
                    <span className={styles.suitePrice}>{s.price}</span>
                    <Link href="/reservar" className={styles.suiteBtn}>Check availability</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.suitesCtaWrap}>
            <Link href="/reservar" className={styles.ctaPrimary}>See all 13 suites & book</Link>
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
              Madre Oriental, it was declared an Artistic Monument of Mexico in 2012 and draws
              visitors from Europe, the United States, Japan and beyond.
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
              Paraíso Encantado sits 400 meters from the garden entrance — close enough to walk,
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
              { value: '400m', label: 'walking distance to Las Pozas' },
              { value: '675m', label: 'altitude of Xilitla — humid mountain climate' },
              { value: '13', label: 'unique suites, each individually designed' },
              { value: '4.5★', label: 'average rating — 523+ reviews' },
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
            Ready to stay next to<br /><em>Edward James' garden?</em>
          </h2>
          <p className={styles.finalCtaSub}>
            Book directly — no commissions, all 13 suites available.<br />
            We confirm within 2 hours.
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
