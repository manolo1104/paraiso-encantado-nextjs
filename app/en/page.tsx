import Image from 'next/image';
import Link from 'next/link';
import styles from './en.module.css';

const jsonLdEn = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Hotel Paraíso Encantado',
  description:
    '13 boutique suites with private spa 5 minutes walk from the Edward James Surrealist Garden (Las Pozas) in Xilitla, Huasteca Potosina, Mexico.',
  url: 'https://www.paraisoencantado.com',
  telephone: '+524891007679',
  email: 'reservas@paraisoencantado.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Xilitla',
    addressRegion: 'San Luis Potosí',
    addressCountry: 'MX',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 21.383, longitude: -99.002 },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.6,
    reviewCount: 519,
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
    price: 'from $80 USD/night',
    img: '/images/JUNGLA/PORTADA.JPG',
  },
  {
    name: 'LindaVista Suite',
    spanish: 'LindaVista',
    desc: 'Total forest immersion with private jacuzzi and uninterrupted views from the treetops.',
    price: 'from $80 USD/night',
    img: '/images/LINDAVISTA/PORTADA.jpg',
  },
  {
    name: 'Helechos Suite',
    spanish: 'Helechos 1',
    desc: 'Family-friendly suite with three queen beds and direct pool access. Sleeps up to 6.',
    price: 'from $80 USD/night',
    img: '/images/HELECHOS 1/PORTADA.jpg',
  },
  {
    name: 'Lirios Suite',
    spanish: 'Lirios 1',
    desc: 'Quiet retreat with garden views, perfect for couples seeking total relaxation.',
    price: 'from $63 USD/night',
    img: '/images/LIRIOS 1/PORTADA.jpg',
  },
];

const AMENITIES = [
  { icon: '🌿', title: '5-minute walk to Las Pozas', desc: 'The Edward James Surrealist Garden, a UNESCO-listed masterpiece.' },
  { icon: '🛁', title: 'Private spa in most suites', desc: 'Outdoor plunge pools and jacuzzis surrounded by tropical jungle.' },
  { icon: '🍽️', title: 'Restaurant on-site', desc: 'El Papán Huasteco — regional cuisine with panoramic terrace views.' },
  { icon: '🚗', title: 'Free parking', desc: 'Secure private parking for all guests.' },
  { icon: '📶', title: 'High-speed WiFi', desc: 'Throughout the hotel and in every suite.' },
  { icon: '🎯', title: 'Daily tours to Las Pozas', desc: 'Guided excursions departing directly from the hotel.' },
];

const FAQS = [
  {
    q: 'How far is the hotel from the Edward James Surrealist Garden?',
    a: '400 meters — a 5-minute walk. We are the closest hotel to Las Pozas.',
  },
  {
    q: 'Do you have English-speaking staff?',
    a: 'Yes. Our team speaks English and can assist with tours, directions, and any special requests.',
  },
  {
    q: 'What is the best time of year to visit Xilitla?',
    a: 'October through April offers the driest and most comfortable weather. The gardens are lush year-round thanks to the tropical microclimate at 800m elevation.',
  },
  {
    q: 'Can I book directly without a commission fee?',
    a: 'Yes — booking directly through our website or WhatsApp saves you up to 15% vs. third-party platforms.',
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
            13 boutique suites with private spa · 5 minutes walk from the Edward James Surrealist Garden
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
          <h2 className={styles.sectionTitle}>The closest hotel<br /><em>to Edward James' masterpiece</em></h2>
          <p className={styles.sectionSub}>
            Edward James — the English surrealist patron who built Las Pozas — chose Xilitla for its magical
            microclimate and lush jungle. We are 400 meters from the garden he created. No other hotel puts
            you this close to one of the most extraordinary artistic environments in the world.
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
            Most include a private outdoor spa pool surrounded by tropical jungle.
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
              Las Pozas is a 32-hectare sculpture garden created by the British surrealist
              patron Edward James (1907–1984), close friend of Salvador Dalí and René Magritte.
              Nestled in the Sierra Madre Oriental at 800 meters elevation, it combines concrete
              surrealist sculptures with natural turquoise pools and cascading waterfalls.
              Today it is listed as Cultural Heritage of Mexico and draws visitors from Europe,
              the United States, Japan and beyond.
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
              { value: '800m', label: 'altitude — perfect cool climate year-round' },
              { value: '13', label: 'unique suites, each individually designed' },
              { value: '4.6★', label: 'average rating — 519+ reviews' },
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
            Book directly and save up to 15% vs. OTAs.<br />
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
