import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Bath, Leaf, MapPin, Utensils, Mountain, Flower2 } from 'lucide-react';
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
      aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.8, reviewCount: 514, bestRating: 5 },
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
        { '@type': 'Question', name: '¿Es Xilitla un buen destino para luna de miel?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Xilitla combina naturaleza tropical única, el jardín surrealista de Edward James — único en el mundo — spa privado en cada suite y gastronomía huasteca auténtica. Pocas regiones de México ofrecen esa combinación de privacidad, belleza natural y experiencia cultural en un solo lugar.' } },
        { '@type': 'Question', name: '¿Qué suites son las más románticas del hotel?', acceptedAnswer: { '@type': 'Answer', text: 'LindaVista: tina de hidromasaje y vistas panorámicas a la sierra. Jungla: piscina spa privada inmersa en la selva, completa privacidad. Lajas: balcón privado con vista a Xilitla y dos camas matrimoniales. Lirios 2: balcón privado hacia los jardines del hotel. Todas para máximo 4 personas — en pareja tienes el espacio para ustedes solos.' } },
        { '@type': 'Question', name: '¿Ofrecen decoración especial para luna de miel o aniversario?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Al reservar, indícanos en los comentarios que es luna de miel o aniversario y preparamos detalles especiales en la suite sin costo adicional: flores, velas y un detalle de bienvenida. También puedes avisarnos por WhatsApp.' } },
        { '@type': 'Question', name: '¿Qué actividades románticas hay cerca del hotel?', acceptedAnswer: { '@type': 'Answer', text: 'Las Pozas de Edward James a 5 min caminando — ideal al amanecer cuando está vacío. Tour privado en canoa a la Cascada de Tamul. Cenas a la luz de velas en El Papán Huasteco. Paseo al atardecer por el pueblo mágico de Xilitla. Y las noches en el spa privado de tu suite con la sierra al fondo.' } },
        { '@type': 'Question', name: '¿En qué época del año es más romántico visitar Xilitla?', acceptedAnswer: { '@type': 'Answer', text: 'Octubre a abril es la temporada ideal: clima fresco (18-24°C), sin lluvia, cascadas en buen caudal y Las Pozas con su mejor luz. Diciembre y enero son especialmente mágicos por el ambiente del pueblo. Semana Santa y verano son temporada alta — más visitantes en Las Pozas.' } },
        { '@type': 'Question', name: '¿Cuántas noches recomienda para una luna de miel en Xilitla?', acceptedAnswer: { '@type': 'Answer', text: 'Mínimo 3 noches para disfrutar el hotel, Las Pozas con calma y un tour a Tamul o a las cascadas. Con 4 noches puedes hacer el tour completo de la Huasteca y aún tener un día de descanso absoluto en el spa privado.' } },
        { '@type': 'Question', name: '¿El hotel Paraíso Encantado está en el pueblo o alejado?', acceptedAnswer: { '@type': 'Answer', text: 'En el corazón de Xilitla, a 400 metros de Las Pozas y a 5 minutos a pie del centro del pueblo. Tienen estacionamiento privado gratuito y se puede llegar caminando a restaurantes, mercado y el mirador. Lo mejor de ambos mundos: naturaleza rodeándote y el pueblo a pasos.' } },
        { '@type': 'Question', name: '¿Cuánto cuesta una noche en pareja en el Hotel Paraíso Encantado?', acceptedAnswer: { '@type': 'Answer', text: 'Las suites para parejas comienzan desde $1,500 MXN por noche (Lirios 1 y 2) hasta $1,900 MXN para las suites master con spa privado (Jungla, LindaVista, Flor de Liz). Persona adicional: $300 MXN. Las reservas de 2 noches o más solo requieren 50% de anticipo.' } },
      ],
    },
  ],
};

const romanticSuites = suites.filter((s) =>
  ['lindavista', 'jungla', 'lajas', 'lirios-2', 'lirios-1'].includes(s.id)
);

const REASONS = [
  { icon: <Bath size={22} strokeWidth={1.5} />, title: 'Spa Privado en tu Suite', body: 'Cada suite tiene su propio spa o tina de hidromasaje — no compartes el agua con nadie. Completamente privado, a cualquier hora.' },
  { icon: <Leaf size={22} strokeWidth={1.5} />, title: 'Selva y Silencio', body: 'Rodeados de vegetación tropical. Por las noches solo se escucha el río y los grillos. Sin ruido de tráfico, sin vecinos ruidosos.' },
  { icon: <MapPin size={22} strokeWidth={1.5} />, title: 'A 5 Min de Las Pozas', body: 'El jardín surrealista de Edward James a 5 minutos caminando. Un lugar mágico para vivir juntos — único en el mundo.' },
  { icon: <Utensils size={22} strokeWidth={1.5} />, title: 'Cenas en El Papán', body: 'Gastronomía huasteca auténtica a pasos de tu suite. Reserva una mesa privada con anticipación.' },
  { icon: <Mountain size={22} strokeWidth={1.5} />, title: 'Vistas Panorámicas', body: 'Varias suites tienen terraza con vistas a las montañas de la Huasteca y al pueblo de Xilitla.' },
  { icon: <Flower2 size={22} strokeWidth={1.5} />, title: 'Detalles Especiales', body: 'Avísanos que es luna de miel o aniversario y preparamos detalles en la suite sin costo adicional.' },
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

        {/* MEJOR ÉPOCA */}
        <section className={styles.reasons} style={{ background: 'var(--forest)', color: 'white' }}>
          <div className={styles.reasonsInner}>
            <p className={styles.eyebrowCenter} style={{ color: 'var(--gold)' }}>¿Cuándo ir?</p>
            <h2 style={{ color: 'white' }}>La Mejor Época para tu Escapada</h2>
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { mes: 'Oct – Dic', tipo: '✦ Temporada ideal', desc: 'Clima fresco (18-22°C), cascadas llenas, sin turistas masivos. Diciembre es mágico en el pueblo.' },
                { mes: 'Ene – Mar', tipo: '✦ Temporada ideal', desc: 'Los meses más tranquilos del año. Las Pozas casi vacías en la mañana. Perfectas para fotos.' },
                { mes: 'Abr – May', tipo: '★ Buena época', desc: 'Clima cálido, Semana Santa concurrida. Reserva con anticipación. Las cascadas aún tienen agua.' },
                { mes: 'Jun – Sep', tipo: '— Temporada lluviosa', desc: 'Lluvia frecuente pero la selva está en su máximo esplendor. Pozas con agua cristalina.' },
              ].map(e => (
                <div key={e.mes} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: 'var(--font-jost)' }}>{e.mes}</p>
                  <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 8px', color: 'white' }}>{e.tipo}</p>
                  <p style={{ fontSize: 13, opacity: 0.75, margin: 0, lineHeight: 1.6 }}>{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIOS PAREJAS */}
        <section className={styles.reasons}>
          <div className={styles.reasonsInner}>
            <p className={styles.eyebrowCenter}>Parejas que lo vivieron</p>
            <h2>Lo que Dicen quienes Vinieron</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 32 }}>
              {[
                { text: 'Vinimos para nuestra luna de miel y fue el mejor regalo que nos pudimos dar. El spa privado, las vistas desde la terraza y Las Pozas a 5 minutos. El equipo del hotel preparó flores en la suite sin que pidiéramos nada. Regresamos el año que viene para el aniversario.', name: 'Valentina & Jorge M.', detail: 'Ciudad de México · Luna de miel · Nov 2024 · ★★★★★' },
                { text: 'La tina de hidromasaje de LindaVista con vista a la sierra al amanecer — no existe nada igual en México. Fuimos a Las Pozas al día siguiente y éramos los únicos. Esa soledad compartida es algo que no se puede comprar en ninguna plataforma.', name: 'Fernanda O. & Ramón V.', detail: 'Guadalajara · Aniversario · Ene 2025 · ★★★★★' },
                { text: 'Tres días que se sintieron como una semana. El hotel es pequeño pero precisamente por eso te tratan como si fuera tu casa. El restaurante, el spa privado, y el pueblo de Xilitla — todo perfecto para una pareja que quiere desconectarse.', name: 'Daniela M. & Carlos A.', detail: 'Monterrey · Escapada en pareja · Feb 2025 · ★★★★★' },
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
