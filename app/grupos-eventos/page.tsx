import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Users, CalendarCheck, Home, Leaf, Star, Shield } from 'lucide-react';
import GruposForm from './GruposForm';
import styles from './grupos-eventos.module.css';

export const metadata: Metadata = {
  title: 'Grupos, Bodas y Eventos en Xilitla | Paraíso Encantado',
  description:
    'Renta exclusiva del hotel para bodas, eventos corporativos y celebraciones familiares en Xilitla, Huasteca Potosina. 13 suites, hasta 78 personas, jardín tropical. Cotización sin costo.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/grupos-eventos',
  },
  openGraph: {
    title: 'Bodas y Eventos en Xilitla · Paraíso Encantado',
    description: 'Reserva el hotel completo para tu boda o evento. 13 suites boutique, jardín tropical y restaurante de cocina huasteca auténtica. Xilitla, SLP.',
    url: 'https://www.paraisoencantado.com/grupos-eventos',
    images: [{ url: 'https://www.paraisoencantado.com/images/Areas comunes/DSC09447-HDR.jpg', alt: 'Jardín y piscina Hotel Paraíso Encantado para eventos' }],
  },
};

const gruposSchema = {
  '@context': 'https://schema.org',
  '@type': 'EventVenue',
  name: 'Hotel Paraíso Encantado — Grupos y Eventos',
  description: 'Venue exclusivo para bodas, eventos corporativos y celebraciones privadas en Xilitla, Huasteca Potosina. 13 suites boutique, jardín tropical, piscina spa y restaurante de cocina huasteca.',
  url: 'https://www.paraisoencantado.com/grupos-eventos',
  telephone: '+524891007679',
  email: 'reservas@paraisoencantado.com',
  maximumAttendeeCapacity: 78,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Xilitla',
    addressRegion: 'San Luis Potosí',
    postalCode: '79910',
    addressCountry: 'MX',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 21.383, longitude: -99.002 },
  containedInPlace: { '@type': 'Hotel', name: 'Hotel Paraíso Encantado', url: 'https://www.paraisoencantado.com' },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Jardín tropical privado', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Piscina spa', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Restaurante exclusivo', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Estacionamiento privado', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'WiFi de alta velocidad', value: true },
  ],
};

const FEATURES = [
  { icon: <Home size={24} strokeWidth={1.5} />, title: 'Renta exclusiva del hotel', desc: '13 suites completamente para tu grupo. Sin extraños — solo tu celebración.' },
  { icon: <Users size={24} strokeWidth={1.5} />, title: 'Hasta 78 personas', desc: 'Capacidad de hospedaje para grupos grandes con suites de 2 a 6 personas cada una.' },
  { icon: <Leaf size={24} strokeWidth={1.5} />, title: 'Jardín tropical privado', desc: 'Jardín y piscina spa en medio de la selva de Xilitla para ceremonias al aire libre.' },
  { icon: <CalendarCheck size={24} strokeWidth={1.5} />, title: 'Coordinación completa', desc: 'Te ayudamos con catering, tours, traslados y lo que necesites para el evento perfecto.' },
  { icon: <Star size={24} strokeWidth={1.5} />, title: 'Restaurante El Papán', desc: 'Cocina huasteca auténtica. Menús especiales para eventos con ingredientes locales y tortillas de comal.' },
  { icon: <Shield size={24} strokeWidth={1.5} />, title: 'A 5 min de Las Pozas', desc: 'El Jardín Surrealista de Edward James como telón de fondo único para fotos y actividades.' },
];

const TESTIMONIALS = [
  {
    text: 'Celebramos nuestro aniversario con 18 personas y fue perfecto. El equipo del hotel se encargó de todo y el jardín era exactamente lo que imaginamos.',
    name: 'Carmen y Rodrigo Salcedo',
    detail: 'Festejo de aniversario · 18 personas · Abril 2025',
  },
  {
    text: 'Hicimos el retiro corporativo de nuestro equipo aquí. La combinación de naturaleza, instalaciones y la comida del Papán Huasteco fue imbatible. El equipo regresó recargado.',
    name: 'Sofía Méndez',
    detail: 'Directora RH · Retiro corporativo 25 personas · Febrero 2025',
  },
];

export default function GruposEventosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gruposSchema) }} />
      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroImg}>
            <Image
              src="/images/Areas comunes/DSC09456-HDR.jpg"
              alt="Jardín tropical del Hotel Paraíso Encantado — bodas y eventos en Xilitla"
              fill priority quality={80}
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Inicio</Link>
              <span aria-hidden="true"> › </span>
              <span>Grupos y Eventos</span>
            </nav>
            <p className={styles.eyebrow}>Bodas · Corporativos · Celebraciones · Xilitla</p>
            <h1>Tu <em>celebración</em><br />en la Huasteca</h1>
            <p className={styles.heroSub}>
              13 suites boutique en la selva de Xilitla. Renta el hotel completo para tu grupo
              y celebra rodeado de naturaleza a 5 minutos del Jardín de Edward James.
            </p>
            <div className={styles.heroCtas}>
              <a href="#cotizar" className={styles.heroCtaPrimary}>Solicitar cotización gratis</a>
              <a href="https://wa.me/524891007679?text=Hola%2C%20me%20interesa%20información%20para%20grupos%20y%20eventos." target="_blank" rel="noopener noreferrer" className={styles.heroCtaWa}>
                WhatsApp directo
              </a>
            </div>
          </div>
        </section>

        {/* CAPACIDAD RÁPIDA */}
        <div className={styles.statsBar} role="list" aria-label="Capacidades del hotel para eventos">
          {[
            { num: '13', label: 'Suites disponibles' },
            { num: '78', label: 'Personas de hospedaje' },
            { num: '4.8★', label: 'Google · 514 reseñas' },
            { num: '5 min', label: 'A Las Pozas' },
          ].map((s) => (
            <div key={s.label} role="listitem" className={styles.statItem}>
              <span className={styles.statNum}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* TIPOS DE EVENTO */}
        <section className={styles.tiposSection}>
          <div className={styles.tiposInner}>
            <div className={styles.tipo}>
              <div className={styles.tipoImg}>
                <Image
                  src="/images/Areas comunes/DSC09471-HDR.jpg"
                  alt="Boda en jardín tropical — Hotel Paraíso Encantado, Xilitla"
                  fill sizes="(max-width: 768px) 100vw, 50vw" quality={80}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.tipoContent}>
                <p className={styles.tipoEyebrow}>Bodas y Celebraciones</p>
                <h2>La boda que siempre <em>imaginaste</em></h2>
                <p>
                  El jardín tropical del hotel, rodeado de selva y con la sierra potosina de fondo,
                  es un escenario único en México para tu ceremonia. Renta el hotel completo y
                  tendrás el espacio solo para ti y tus invitados, desde el ensayo hasta el desayuno
                  del día siguiente.
                </p>
                <ul className={styles.tipoList}>
                  <li>Ceremonia civil o religiosa en jardín privado</li>
                  <li>Banquete con cocina huasteca auténtica (El Papán)</li>
                  <li>Suites decoradas para los novios</li>
                  <li>Tour a Las Pozas para todos los invitados</li>
                  <li>Coordinación total: floristería, música, fotografía local</li>
                </ul>
                <p className={styles.tipoPrice}>Inversión desde <strong>$45,000 MXN</strong> · Hotel completo por noche</p>
                <a href="#cotizar" className={styles.tipoCta}>Cotizar boda →</a>
              </div>
            </div>

            <div className={`${styles.tipo} ${styles.tipoReverse}`}>
              <div className={styles.tipoImg}>
                <Image
                  src="/images/Areas comunes/DSC09456-HDR.jpg"
                  alt="Retiro corporativo en Xilitla — Hotel Paraíso Encantado"
                  fill sizes="(max-width: 768px) 100vw, 50vw" quality={80}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.tipoContent}>
                <p className={styles.tipoEyebrow}>Corporativos y Retiros</p>
                <h2>Donde los equipos <em>se reconectan</em></h2>
                <p>
                  Alejado de la ciudad, inmerso en la naturaleza y con instalaciones boutique,
                  Paraíso Encantado es el lugar donde los equipos hablan diferente. Sin distracciones,
                  con la creatividad que da la selva. Trabajamos con agencias de viajes corporativos
                  y RH para hacer el retiro perfecto.
                </p>
                <ul className={styles.tipoList}>
                  <li>Espacio de reunión al aire libre con pantalla y proyector</li>
                  <li>Catering de desayunos, comidas y cenas del equipo</li>
                  <li>Actividades de team building (tours, senderismo)</li>
                  <li>Facturación a empresa con RFC</li>
                  <li>Traslados desde Tampico o San Luis Potosí</li>
                </ul>
                <p className={styles.tipoPrice}>Inversión desde <strong>$38,000 MXN</strong> · Hotel completo por noche</p>
                <a href="#cotizar" className={styles.tipoCta}>Cotizar retiro →</a>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className={styles.featuresSection} aria-labelledby="features-heading">
          <div className={styles.featuresInner}>
            <h2 id="features-heading" className={styles.sectionTitle}>
              Por qué elegir <em>Paraíso Encantado</em>
            </h2>
            <div className={styles.featuresGrid}>
              {FEATURES.map((f) => (
                <div key={f.title} className={styles.featureCard}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALES */}
        <section className={styles.testimonialsSection}>
          <div className={styles.testimonialsInner}>
            <h2 className={styles.sectionTitle}>Lo que dicen <em>nuestros grupos</em></h2>
            <div className={styles.testimonialsGrid}>
              {TESTIMONIALS.map((t) => (
                <blockquote key={t.name} className={styles.testimonialCard}>
                  <p className={styles.testimonialText}>{t.text}</p>
                  <footer>
                    <span className={styles.testimonialName}>{t.name}</span>
                    <span className={styles.testimonialDetail}>{t.detail} · ★★★★★</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* FORMULARIO DE COTIZACIÓN */}
        <section id="cotizar" className={styles.formSection} aria-labelledby="form-heading">
          <div className={styles.formInner}>
            <div className={styles.formHeader}>
              <p className={styles.eyebrow}>Sin compromiso · Respuesta en 2 horas</p>
              <h2 id="form-heading">Solicita tu <em>cotización</em></h2>
              <p className={styles.formSubtitle}>
                Cuéntanos sobre tu evento y te enviamos disponibilidad y precio en menos de 2 horas.
                También puedes escribirnos directamente al{' '}
                <a href="https://wa.me/524891007679" target="_blank" rel="noopener noreferrer">
                  WhatsApp +52 489-100-7679
                </a>.
              </p>
            </div>
            <GruposForm />
          </div>
        </section>

        {/* CTA FINAL */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <h2>¿Prefieres hablar <em>directamente</em>?</h2>
            <p>Llámanos o escríbenos y en minutos te damos disponibilidad.</p>
            <div className={styles.ctaButtons}>
              <a href="https://wa.me/524891007679" target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
                WhatsApp: +52 489-100-7679
              </a>
              <a href="tel:+524891007679" className={styles.ctaBtnOutline}>
                Llamar al hotel
              </a>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
