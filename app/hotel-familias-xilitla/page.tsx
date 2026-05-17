import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Droplets, Bed, Leaf, Compass, Utensils, MapPin } from 'lucide-react';
import { suites } from '@/data/suites';
import styles from './familias.module.css';

export const metadata: Metadata = {
  title: 'Hotel para Familias en Xilitla · Piscina y Suites Familiares | Paraíso Encantado',
  description:
    'Hotel boutique familiar en Xilitla con suites para 4-8 personas, piscina y a 5 min de Las Pozas de Edward James. Tours seguros para niños en la Huasteca Potosina. Desde $1,500 MXN.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/hotel-familias-xilitla',
  },
  openGraph: {
    title: 'Hotel Familiar en Xilitla — Piscina y Suites Grandes | Paraíso Encantado',
    description:
      '13 suites con capacidad para hasta 8 personas, piscina, tours seguros para niños y a 5 min de Las Pozas de Edward James en Xilitla, Huasteca Potosina.',
    url: 'https://www.paraisoencantado.com/hotel-familias-xilitla',
    images: [{
      url: 'https://www.paraisoencantado.com/images/HELECHOS 1/PORTADA.jpg',
      width: 1200, height: 630,
      alt: 'Suite Helechos 1 — ideal para familias, Hotel Paraíso Encantado, Xilitla',
    }],
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LodgingBusiness',
      name: 'Hotel Paraíso Encantado — Hotel Familiar Xilitla',
      description: 'Hotel boutique familiar en Xilitla con suites para 4-8 personas y piscina. A 5 minutos de Las Pozas de Edward James en la Huasteca Potosina.',
      url: 'https://www.paraisoencantado.com/hotel-familias-xilitla',
      telephone: '+524891007679',
      address: { '@type': 'PostalAddress', addressLocality: 'Xilitla', addressRegion: 'San Luis Potosí', addressCountry: 'MX' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.6, reviewCount: 519, bestRating: 5 },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
        { '@type': 'ListItem', position: 2, name: 'Hotel Familias Xilitla', item: 'https://www.paraisoencantado.com/hotel-familias-xilitla' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: '¿Tienen suites para familias grandes?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Helechos 1 tiene 3 camas matrimoniales (hasta 6 personas) y Helechos 2 tiene 4 camas matrimoniales (hasta 8 personas). También Lajas y Orquídeas Doble son ideales para familias de 4.' } },
        { '@type': 'Question', name: '¿Son seguros los tours para niños?', acceptedAnswer: { '@type': 'Answer', text: 'El Puente de Dios y Cascadas de Micos son ideales para niños mayores de 6-8 años. Tamul es para mayores de 8 años en temporada seca. El Papán Huasteco en el hotel tiene menú para niños.' } },
        { '@type': 'Question', name: '¿Tienen piscina para niños?', acceptedAnswer: { '@type': 'Answer', text: 'Cada suite tiene su propia piscina spa privada. Algunas suites familiares como Helechos tienen acceso a piscina con agua apropiada para que los niños disfruten con supervisión.' } },
      ],
    },
  ],
};

const familySuites = suites.filter((s) =>
  ['helechos-1', 'helechos-2', 'lajas', 'orquideas-doble', 'jungla'].includes(s.id)
);

const REASONS = [
  { icon: <Droplets size={22} strokeWidth={1.5} />, title: 'Piscina en tu Suite', body: 'Cada suite tiene su propio spa o piscina privada. Los niños pueden disfrutarla con supervisión sin compartir con otros huéspedes.' },
  { icon: <Bed size={22} strokeWidth={1.5} />, title: 'Suites hasta 8 Personas', body: 'Helechos 1 (hasta 6) y Helechos 2 (hasta 8) tienen 3-4 camas matrimoniales. Toda la familia en el mismo espacio.' },
  { icon: <Leaf size={22} strokeWidth={1.5} />, title: 'Naturaleza Segura', body: 'El hotel tiene jardines seguros, áreas comunes amplias y está en el centro de Xilitla — un pueblo tranquilo y familiar.' },
  { icon: <Compass size={22} strokeWidth={1.5} />, title: 'Tours para Niños', body: 'El Puente de Dios, Cascadas de Micos y Las Pozas son ideales para familias con niños. Guía certificado en todos los tours.' },
  { icon: <Utensils size={22} strokeWidth={1.5} />, title: 'Restaurante en el Hotel', body: 'El Papán Huasteco tiene opciones para toda la familia. No necesitas salir del hotel para la primera comida del día.' },
  { icon: <MapPin size={22} strokeWidth={1.5} />, title: '5 Min de Las Pozas', body: 'Las Pozas de Edward James son fascinantes para los niños: estructuras enormes, pozas de agua y selva tropical. Un mundo de exploración.' },
];

export default function HotelFamiliasPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroImg}>
            <Image src="/images/HELECHOS 1/PORTADA.jpg" alt="Suite Helechos para familias — Hotel Paraíso Encantado, Xilitla, Huasteca Potosina" fill priority quality={80} sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Inicio</Link><span aria-hidden="true"> › </span><span>Hotel Familias Xilitla</span>
            </nav>
            <p className={styles.eyebrow}>Familias · Grupos · Viaje con Niños</p>
            <h1>El Hotel <em>Ideal para Familias</em><br />en Xilitla, Huasteca Potosina</h1>
            <p className={styles.heroSub}>Suites para hasta 8 personas, piscina privada y a 5 minutos caminando de Las Pozas de Edward James.</p>
            <div className={styles.heroCtas}>
              <Link href="/reservar" className={styles.heroCtaPrimary}>Reservar Suite Familiar</Link>
              <Link href="/habitaciones" className={styles.heroCtaSecondary}>Ver las 13 Suites</Link>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className={styles.stats}>
          <div className={styles.statsInner}>
            <div className={styles.stat}><span className={styles.statNum}>8</span><span className={styles.statLabel}>personas máximo en suites familiares</span></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><span className={styles.statNum}>5</span><span className={styles.statLabel}>minutos a Las Pozas de Edward James</span></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><span className={styles.statNum}>13</span><span className={styles.statLabel}>suites todas con spa privado</span></div>
          </div>
        </section>

        {/* RAZONES */}
        <section className={styles.reasons}>
          <div className={styles.reasonsInner}>
            <p className={styles.eyebrowCenter}>Por Qué Elegirnos</p>
            <h2>Todo lo que Necesita una Familia</h2>
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

        {/* SUITES FAMILIARES */}
        <section className={styles.suites}>
          <div className={styles.suitesInner}>
            <p className={styles.eyebrowCenter}>Suites para Familias</p>
            <h2>Espacio para Todos</h2>
            <p className={styles.suitesSubtitle}>Suites con mayor capacidad y amenidades pensadas para grupos</p>
            <div className={styles.suitesGrid}>
              {familySuites.map((s) => (
                <Link key={s.id} href={`/habitaciones/${s.id}`} className={styles.suiteCard}>
                  <div className={styles.suiteImg}>
                    <Image src={s.images[0]} alt={`${s.name} — Suite Familiar, Hotel Paraíso Encantado, Xilitla`} fill sizes="(max-width: 768px) 100vw, 33vw" quality={75} style={{ objectFit: 'cover' }} />
                    <div className={styles.suiteCapacity}>Hasta {s.maxOccupancy} personas</div>
                  </div>
                  <div className={styles.suiteInfo}>
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
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
            <h2>Preguntas Frecuentes para Familias</h2>
            <dl className={styles.faqList}>
              {[
                { q: '¿Tienen suites para familias grandes (6-8 personas)?', a: 'Sí. Helechos 1 tiene 3 camas matrimoniales (hasta 6 personas) y Helechos 2 tiene 4 camas matrimoniales (hasta 8 personas). Ambas incluyen piscina spa y terraza.' },
                { q: '¿Son seguros los tours para niños?', a: 'El Puente de Dios (pozas turquesas) y Cascadas de Micos son perfectos para niños mayores de 6 años. Tamul en canoa es ideal a partir de 8-10 años en temporada seca. Las Pozas de Edward James son fascinantes para cualquier edad.' },
                { q: '¿Tiene el hotel área de juegos o actividades para niños?', a: 'El hotel tiene jardines amplios y los niños pueden explorar la vegetación tropical del entorno. El spa privado de cada suite es disfrutable para toda la familia.' },
                { q: '¿Cuál es el precio por persona adicional?', a: 'La tarifa base incluye 2 personas. La persona adicional tiene un costo de $300 MXN por noche. Las suites Helechos y Lajas están diseñadas para familias y tienen tarifas ya incluidas para mayor número de personas.' },
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
            <h2>El Mejor Viaje Familiar de la Huasteca</h2>
            <p>Xilitla, Las Pozas y la naturaleza de la sierra potosina para toda la familia.</p>
            <div className={styles.finalCtaBtns}>
              <Link href="/reservar" className={styles.ctaPrimary}>Reservar Ahora</Link>
              <a href="https://wa.me/524891007679?text=Hola%2C%20viajamos%20en%20familia%20y%20quisiera%20información" target="_blank" rel="noopener noreferrer" className={styles.ctaWa}>Consultar por WhatsApp</a>
            </div>
            <p className={styles.ctaNote}>Cancelación gratuita 48h · Sin comisiones · Confirmación instantánea</p>
          </div>
        </section>

      </main>
    </>
  );
}
