import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { suites } from '@/data/suites';
import styles from './luna-de-miel.module.css';

export const metadata: Metadata = {
  title: 'Hotel Romántico Xilitla · Luna de Miel en la Huasteca Potosina | Paraíso Encantado',
  description:
    'Suites románticas con spa privado a 5 min de Las Pozas de Edward James, Xilitla. La escapada perfecta para parejas y luna de miel en la Huasteca Potosina. Desde $1,500 MXN.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/hotel-luna-de-miel-xilitla',
  },
  openGraph: {
    title: 'Hotel Romántico para Luna de Miel en Xilitla — Paraíso Encantado',
    description:
      'Spa privado, selva, Las Pozas de Edward James y cocina huasteca. La escapada romántica más especial de la Huasteca Potosina.',
    url: 'https://www.paraisoencantado.com/hotel-luna-de-miel-xilitla',
    images: [{
      url: 'https://www.paraisoencantado.com/images/LINDAVISTA/PORTADA.jpg',
      width: 1200, height: 630,
      alt: 'Suite LindaVista romántica — Hotel Paraíso Encantado, Xilitla',
    }],
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LodgingBusiness',
      name: 'Hotel Paraíso Encantado — Escapadas Románticas',
      description: 'Hotel boutique romántico en Xilitla para lunas de miel y aniversarios. Suites con spa privado a 5 minutos de Las Pozas de Edward James.',
      url: 'https://www.paraisoencantado.com/hotel-luna-de-miel-xilitla',
      image: 'https://www.paraisoencantado.com/images/LINDAVISTA/PORTADA.jpg',
      telephone: '+524891007679',
      address: { '@type': 'PostalAddress', addressLocality: 'Xilitla', addressRegion: 'San Luis Potosí', addressCountry: 'MX' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.6, reviewCount: 519, bestRating: 5 },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
        { '@type': 'ListItem', position: 2, name: 'Hotel Romántico Xilitla', item: 'https://www.paraisoencantado.com/hotel-luna-de-miel-xilitla' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: '¿Es Xilitla un buen destino para luna de miel?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Xilitla combina naturaleza tropical, el jardín surrealista de Edward James, spa privado en cada suite y gastronomía huasteca auténtica. Es uno de los destinos más especiales e íntimos de México para una escapada romántica.' } },
        { '@type': 'Question', name: '¿Qué suites son las más románticas?', acceptedAnswer: { '@type': 'Answer', text: 'LindaVista (tina de hidromasaje, vistas panorámicas), Jungla (piscina spa privada en la selva), Lajas (vista a Xilitla, balcón privado) y Lirios 2 (balcón privado hacia los jardines).' } },
        { '@type': 'Question', name: '¿Ofrecen decoración especial para luna de miel?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Si nos avisas que es luna de miel o aniversario al reservar, preparamos detalles especiales en la suite. Escríbenos por WhatsApp.' } },
      ],
    },
  ],
};

const romanticSuites = suites.filter((s) =>
  ['lindavista', 'jungla', 'lajas', 'lirios-2', 'lirios-1'].includes(s.id)
);

const REASONS = [
  { icon: '🛁', title: 'Spa Privado en tu Suite', body: 'Cada suite tiene su propio spa o tina de hidromasaje — no compartes el agua con nadie. Completamente privado, a cualquier hora.' },
  { icon: '🌿', title: 'Selva y Silencio', body: 'Rodeados de vegetación tropical. Por las noches solo se escucha el río y los grillos. Sin ruido de tráfico, sin vecinos ruidosos.' },
  { icon: '📍', title: 'A 5 Min de Las Pozas', body: 'El jardín surrealista de Edward James a 5 minutos caminando. Un lugar mágico para vivir juntos — único en el mundo.' },
  { icon: '🍽️', title: 'Cenas en El Papán', body: 'Gastronomía huasteca auténtica a pasos de tu suite. Reserva una mesa privada con anticipación.' },
  { icon: '🏔️', title: 'Vistas Panorámicas', body: 'Varias suites tienen terraza con vistas a las montañas de la Huasteca y al pueblo de Xilitla.' },
  { icon: '💐', title: 'Detalles Especiales', body: 'Avísanos que es luna de miel o aniversario y preparamos detalles en la suite sin costo adicional.' },
];

export default function LunaDePageMielPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroImg}>
            <Image src="/images/LINDAVISTA/PORTADA.jpg" alt="Suite romántica con tina de hidromasaje — Hotel Paraíso Encantado, Xilitla" fill priority quality={80} sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center 40%' }} />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Inicio</Link><span aria-hidden="true"> › </span><span>Hotel Romántico Xilitla</span>
            </nav>
            <p className={styles.eyebrow}>Luna de Miel · Aniversarios · Escapadas en Pareja</p>
            <h1>El Hotel Romántico <em>Más Especial</em><br />de la Huasteca Potosina</h1>
            <p className={styles.heroSub}>Spa privado, selva y el jardín de Edward James a 5 minutos. La escapada perfecta para dos.</p>
            <div className={styles.heroCtas}>
              <Link href="/reservar" className={styles.heroCtaPrimary}>Reservar Suite Romántica</Link>
              <a href="https://wa.me/524891007679?text=Hola%2C%20es%20para%20una%20luna%20de%20miel" target="_blank" rel="noopener noreferrer" className={styles.heroCtaSecondary}>Consultar por WhatsApp</a>
            </div>
          </div>
        </section>

        {/* RAZONES */}
        <section className={styles.reasons}>
          <div className={styles.reasonsInner}>
            <p className={styles.eyebrowCenter}>Por Qué Elegirnos</p>
            <h2>Una Escapada que No Olvidarán</h2>
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

        {/* SUITES ROMÁNTICAS */}
        <section className={styles.suites}>
          <div className={styles.suitesInner}>
            <p className={styles.eyebrowCenter}>Suites para Parejas</p>
            <h2>Las Más Románticas del Hotel</h2>
            <p className={styles.suitesSubtitle}>Seleccionadas por privacidad, amenidades y vistas</p>
            <div className={styles.suitesGrid}>
              {romanticSuites.map((s) => (
                <Link key={s.id} href={`/habitaciones/${s.id}`} className={styles.suiteCard}>
                  <div className={styles.suiteImg}>
                    <Image src={s.images[0]} alt={`${s.name} — Suite Romántica Hotel Paraíso Encantado, Xilitla`} fill sizes="(max-width: 768px) 100vw, 50vw" quality={75} style={{ objectFit: 'cover' }} />
                  </div>
                  <div className={styles.suiteInfo}>
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
                    <div className={styles.suiteAmenities}>
                      {s.amenities.slice(0, 3).map((a) => <span key={a} className={styles.suiteTag}>{a}</span>)}
                    </div>
                    <div className={styles.suiteFooter}>
                      <span>Desde ${s.price.toLocaleString('es-MX')} MXN/noche</span>
                      <span className={styles.suiteLink}>Ver suite →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link href="/habitaciones" className={styles.moreSuites}>Ver las 13 Suites →</Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.faq}>
          <div className={styles.faqInner}>
            <h2>Preguntas Frecuentes</h2>
            <dl className={styles.faqList}>
              {[
                { q: '¿Es Xilitla un buen destino para luna de miel?', a: 'Sí — es uno de los destinos más especiales e íntimos de México. Selva tropical, el jardín surrealista de Edward James, spa privado y gastronomía huasteca auténtica. Pocas regiones combinan naturaleza, arte y privacidad de esta manera.' },
                { q: '¿Qué suites son las más románticas?', a: 'LindaVista (tina de hidromasaje, vistas panorámicas), Jungla (piscina spa privada entre la selva), Lajas (balcón con vista a Xilitla) y Lirios 2 (balcón privado con jardines). Todas son para máximo 4 personas — en pareja tienes el espacio para ustedes.' },
                { q: '¿Ofrecen decoración especial para luna de miel o aniversario?', a: 'Sí. Avísanos por WhatsApp al reservar y preparamos detalles en la suite. Sin costo adicional.' },
                { q: '¿Qué actividades románticas hay en Xilitla?', a: 'Las Pozas de Edward James (5 min caminando), tour privado a Tamul en canoa, cenas en El Papán, paseo por el pueblo al atardecer y disfrutar el spa privado en tu terraza con vista a las montañas.' },
              ].map(({ q, a }) => (
                <div key={q} className={styles.faqItem}>
                  <dt>{q}</dt><dd>{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className={styles.finalCta}>
          <div className={styles.finalCtaInner}>
            <h2>Regálense una Escapada Inolvidable</h2>
            <p>Confirma tu suite y dinos que es luna de miel o aniversario — preparamos los detalles.</p>
            <div className={styles.finalCtaBtns}>
              <Link href="/reservar" className={styles.ctaPrimary}>Reservar Ahora</Link>
              <a href="https://wa.me/524891007679?text=Hola%2C%20queremos%20reservar%20para%20luna%20de%20miel" target="_blank" rel="noopener noreferrer" className={styles.ctaWa}>WhatsApp</a>
            </div>
            <p className={styles.ctaNote}>Cancelación gratuita 48h · Reserva directa sin comisiones</p>
          </div>
        </section>

      </main>
    </>
  );
}
