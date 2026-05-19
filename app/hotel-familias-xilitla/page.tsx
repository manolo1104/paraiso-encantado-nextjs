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
      aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.8, reviewCount: 514, bestRating: 5 },
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
        { '@type': 'Question', name: '¿Tienen suites para familias de 6 u 8 personas?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Helechos 1 tiene 3 camas matrimoniales (hasta 6 personas) con terraza y piscina spa. Helechos 2 tiene 4 camas matrimoniales (hasta 8 personas). Ambas están diseñadas para que toda la familia duerma junta sin comprometer comodidad. También Lajas y Orquídeas Doble son perfectas para familias de 4.' } },
        { '@type': 'Question', name: '¿Son seguros los tours para niños en Xilitla?', acceptedAnswer: { '@type': 'Answer', text: 'El Puente de Dios (pozas turquesas someras), Las Pozas de Edward James y Cascadas de Micos son perfectos desde los 5-6 años. La Cascada de Tamul en canoa es recomendable a partir de los 8 años en temporada seca (oct-abril). Todos los tours incluyen guía certificado local que conoce cada destino.' } },
        { '@type': 'Question', name: '¿Tiene el hotel piscina o área de juegos para niños?', acceptedAnswer: { '@type': 'Answer', text: 'Cada suite tiene su propia piscina spa privada. Las suites Helechos tienen piscina en terraza — los niños pueden disfrutarla con supervisión. El hotel tiene jardines amplios de vegetación tropical que los niños pueden explorar libremente. No hay toboganes, pero la naturaleza del lugar hace que los niños no pidan pantallas.' } },
        { '@type': 'Question', name: '¿Cuánto cuesta una suite para 4-6 personas?', acceptedAnswer: { '@type': 'Answer', text: 'Las suites familiares Helechos 1 y 2 comienzan desde $1,900 MXN por noche para 2 personas. La persona adicional cuesta $300 MXN/noche. Para una familia de 4 (2 adultos + 2 niños mayores de 12 años): a partir de $2,500 MXN/noche todo incluido en la misma suite.' } },
        { '@type': 'Question', name: '¿Qué pueden comer los niños en el restaurante El Papán?', acceptedAnswer: { '@type': 'Answer', text: 'El restaurante tiene opciones que a los niños encantan: tamales de elote dulce, enchiladas huastecas, frijoles de olla y tortillas hechas a mano en comal. Para los más pequeños, se preparan platillos sencillos como huevos con tortillas. El restaurante opera de 8 AM a 8 PM.' } },
        { '@type': 'Question', name: '¿Qué edad mínima tienen los tours?', acceptedAnswer: { '@type': 'Answer', text: 'Las Pozas de Edward James: sin edad mínima (es caminar en terreno seguro). Cascadas de Micos y Puente de Dios: recomendado 5+ años. Tamul en canoa: 8+ años en temporada seca, 12+ en temporada de lluvias. Sótano de las Golondrinas: 10+ años.' } },
        { '@type': 'Question', name: '¿Xilitla es un destino seguro para familias con niños?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Xilitla es un pueblo serrano tranquilo con muy bajo índice de inseguridad. El hotel está en el centro histórico a 400 metros de Las Pozas. Las carreteras de acceso son buenas autopistas y federales pavimentadas. El único riesgo real es el tiempo en las cascadas durante temporada de lluvias (jun-sep).' } },
        { '@type': 'Question', name: '¿Cuántos días necesita una familia en Xilitla?', acceptedAnswer: { '@type': 'Answer', text: 'Mínimo 3 noches: día 1 descanso y Las Pozas, día 2 tour a cascadas (Micos o Tamul), día 3 mañana libre y regreso. Con 4 noches pueden hacer 2 tours diferentes y aún tener tiempo de explorar el pueblo de Xilitla con calma.' } },
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

        {/* QUÉ HACER CON NIÑOS */}
        <section className={styles.reasons} style={{ background: 'var(--forest)', color: 'white' }}>
          <div className={styles.reasonsInner}>
            <p className={styles.eyebrowCenter} style={{ color: 'var(--gold)' }}>Itinerario familiar</p>
            <h2 style={{ color: 'white' }}>3 Días Perfectos con la Familia</h2>
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              {[
                { dia: 'Día 1 — Llegada y Las Pozas', actividades: 'Llegada al hotel, check-in, tarde en el spa privado de la suite. Al día siguiente temprano: Las Pozas de Edward James (5 min caminando) — los niños van a flipar con las estructuras gigantes y las pozas de agua.' },
                { dia: 'Día 2 — Cascadas', actividades: 'Tour al Puente de Dios o Cascadas de Micos. Perfectas para niños mayores de 6 años. Pozas turquesas donde pueden nadar con supervisión. Comida en restaurante local y regreso al hotel.' },
                { dia: 'Día 3 — Pueblo y descanso', actividades: 'Mañana libre: mercado del pueblo, café de olla y artesanías. Tarde en el spa privado de la suite. Si se quedan más noches: tour Tamul en canoa (para mayores de 8 años).' },
              ].map(d => (
                <div key={d.dia} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: 'var(--font-jost)' }}>{d.dia}</p>
                  <p style={{ fontSize: 14, opacity: 0.85, margin: 0, lineHeight: 1.7 }}>{d.actividades}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIOS FAMILIAS */}
        <section className={styles.reasons}>
          <div className={styles.reasonsInner}>
            <p className={styles.eyebrowCenter}>Familias que lo vivieron</p>
            <h2>Lo que Dicen las Familias</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 32 }}>
              {[
                { text: 'Mis hijos (8 y 11 años) aún hablan de Las Pozas y del tour a Tamul en canoa. La suite Helechos 2 nos dio espacio para que todos durmiéramos cómodos. El desayuno del restaurante con tortillas de comal fue otro hit inesperado.', name: 'Carlos R. y familia', detail: 'Monterrey · Familia de 5 · Dic 2024 · ★★★★★' },
                { text: 'Lo mejor fue no tener que coordinar nada. Los guías del hotel conocen los destinos, los tours son seguros para niños y las suites son perfectas para grupos grandes. El spa privado para que los adultos descansen mientras los niños se quedan en la terraza — no tiene precio.', name: 'Mariana T. y familia', detail: 'Ciudad de México · Familia de 6 · Feb 2025 · ★★★★★' },
                { text: 'Mi hija de 7 años se enamoró de Las Pozas. Decía que era "el castillo de la selva". El equipo del hotel fue increíblemente paciente con nosotros y nos recomendó exactamente qué tour era seguro para ella. Lo haremos otra vez.', name: 'Andrea C. y familia', detail: 'Querétaro · Familia de 4 · Oct 2024 · ★★★★★' },
              ].map(t => (
                <div key={t.name} style={{ background: 'var(--parch)', borderRadius: 10, padding: '24px', borderLeft: '3px solid var(--gold)' }}>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: '#444', fontStyle: 'italic', margin: '0 0 16px' }}>"{t.text}"</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest)', margin: 0 }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: '#999', margin: '3px 0 0' }}>{t.detail}</p>
                </div>
              ))}
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
