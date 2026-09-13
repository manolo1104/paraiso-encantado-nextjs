import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Calendar, Users, Coffee, MapPin } from 'lucide-react';
import TiltCard from '@/components/TiltCard';
import FloatingLeaves from '@/components/FloatingLeaves';
import styles from './paquetes.module.css';

export const metadata: Metadata = {
  title: 'Paquetes de Hotel y Tours · Xilitla Huasteca Potosina | Paraíso Encantado',
  description:
    'Paquetes de hotel + tours en Xilitla: Luna de Miel, Familiar, Aventura Extrema, Tu Huasteca y Odisea Huasteca. Hospedaje en Paraíso Encantado con tours guiados por la Huasteca Potosina.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/paquetes',
  },
  openGraph: {
    title: 'Paquetes de Hotel y Tours en Xilitla | Paraíso Encantado',
    description: 'De 3 a 6 días en la Huasteca Potosina: hospedaje en Paraíso Encantado y tours guiados a Tamul, Las Pozas, Puente de Dios y más.',
    url: 'https://www.paraisoencantado.com/paquetes',
    images: [{ url: 'https://www.paraisoencantado.com/images/FLOR DE LIS 1/PORTADA.jpg', alt: 'Suite Flor de Liz con spa privado — Paraíso Encantado', width: 1200, height: 630 }],
  },
};

// Los paquetes los arma y los vende Tours Huasteca Potosina en su sitio. Decisión
// del dueño (sep 2026): aquí SIN precios, sin "Ahorras" y sin ofertas en el
// JSON-LD — el precio vigente vive en huasteca-potosina.com.
const PACKAGES_URL = 'https://www.huasteca-potosina.com/paquetes';
const TOURS_WHATSAPP_URL = 'https://wa.me/524891251458';

// Nombre, subtítulo, duración, badge y slug copiados de la fuente canónica
// (repo INTINERARIO HUASTECA, rama main: src/lib/paquetes.ts). Si cambian allá,
// cámbialos aquí. Las imágenes son las del propio sitio del hotel.
const PAQUETES = [
  {
    slug: 'luna-de-miel',
    featured: false,
    badge: 'Lunamieleros',
    badgeColor: 'forest' as const,
    name: 'Luna de Miel',
    tagline: 'La Huasteca de a dos, sin prisa',
    duracion: '3 días / 2 noches',
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    imageAlt: 'Las Pozas de Edward James — Paquete Luna de Miel en Xilitla',
    waMsg: 'Hola%2C%20me%20interesa%20el%20paquete%20Luna%20de%20Miel.%20%C2%BFTienen%20disponibilidad%3F',
  },
  {
    slug: 'familiar',
    featured: true,
    badge: 'Más popular',
    badgeColor: 'gold' as const,
    name: 'Paquete Familiar',
    tagline: 'Tres días que los niños sí aguantan',
    duracion: '4 días / 3 noches',
    image: '/images/atracciones/cascadas_de_micos.jpg',
    imageAlt: 'Cascadas de Micos — Paquete Familiar en la Huasteca Potosina',
    waMsg: 'Hola%2C%20me%20interesa%20el%20Paquete%20Familiar.%20%C2%BFTienen%20disponibilidad%3F',
  },
  {
    slug: 'aventura-extrema',
    featured: false,
    badge: 'Adrenalina',
    badgeColor: 'sage' as const,
    name: 'Aventura Extrema',
    tagline: 'Cuerda, rápidos y la caída más alta de México',
    duracion: '4 días / 3 noches',
    image: '/images/atracciones/rappel_tamul.jpg',
    imageAlt: 'Rappel en la Cascada de Tamul — Paquete Aventura Extrema',
    waMsg: 'Hola%2C%20me%20interesa%20el%20paquete%20Aventura%20Extrema.%20%C2%BFTienen%20disponibilidad%3F',
  },
  {
    slug: 'tu-huasteca',
    featured: false,
    badge: 'Tú lo armas',
    badgeColor: 'forest' as const,
    name: 'Tu Huasteca',
    tagline: 'Cuatro días de tour que eliges tú',
    duracion: '5 días / 4 noches',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    imageAlt: 'Cascada de Tamul — Paquete Tu Huasteca',
    waMsg: 'Hola%2C%20me%20interesa%20el%20paquete%20Tu%20Huasteca.%20%C2%BFTienen%20disponibilidad%3F',
  },
  {
    slug: 'odisea-huasteca',
    featured: false,
    badge: 'Lo ves todo',
    badgeColor: 'sage' as const,
    name: 'Odisea Huasteca',
    tagline: 'Cinco días de tours sin repetir un solo lugar',
    duracion: '6 días / 5 noches',
    image: '/images/atracciones/tamasopo.jpg',
    imageAlt: 'Cascadas de Tamasopo — Paquete Odisea Huasteca',
    waMsg: 'Hola%2C%20me%20interesa%20el%20paquete%20Odisea%20Huasteca.%20%C2%BFTienen%20disponibilidad%3F',
  },
];

// Sin Offer ni aggregateRating: el precio no se publica aquí y las
// calificaciones que había eran inventadas.
const paquetesSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Paquetes de hotel y tours en Xilitla, Huasteca Potosina',
  url: 'https://www.paraisoencantado.com/paquetes',
  numberOfItems: PAQUETES.length,
  itemListElement: PAQUETES.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'TouristTrip',
      name: p.name,
      description: `${p.tagline}. ${p.duracion} con hospedaje en Hotel Paraíso Encantado (Xilitla) y tours guiados por la Huasteca Potosina.`,
      url: `${PACKAGES_URL}/${p.slug}`,
    },
  })),
};

const paquetesBreadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
    { '@type': 'ListItem', position: 2, name: 'Paquetes de hotel y tours', item: 'https://www.paraisoencantado.com/paquetes' },
  ],
};

const FAQ = [
  {
    q: '¿Puedo personalizar los paquetes?',
    a: 'Sí. Escríbele a nuestro equipo de tours por WhatsApp al +52 489 125 1458 y ajustan fechas, habitación, número de personas y actividades. Si tu grupo es más grande o quieres agregar más tours, te arman una cotización sin compromiso.',
  },
  {
    q: '¿Puedo cambiar la habitación incluida en el paquete?',
    a: 'Sí, según disponibilidad. Cada paquete trae una habitación base y puedes pedir otra del hotel; el equipo de tours te confirma si cambia el costo. Pregúntales por WhatsApp.',
  },
  {
    q: '¿Los niños pagan igual que los adultos?',
    a: 'No. Niños de 6 a 10 años pagan 70% de los tours y menores de 6 el 50%. Si viajas con niños o en grupo, escríbele al equipo de tours y te arman el paquete a la medida.',
  },
  {
    q: '¿Cómo reservo un paquete?',
    a: 'Entra a la página del paquete en huasteca-potosina.com/paquetes para ver el itinerario día por día, o escríbele a nuestro equipo de tours por WhatsApp al +52 489 125 1458 con tus fechas y el paquete que te interesa. Ellos confirman la disponibilidad del hotel y te dicen cómo apartar.',
  },
  {
    q: '¿Qué pasa si necesito cancelar?',
    a: 'Reembolso del 100% si cancelas hasta 7 días antes de tu llegada, y 50% hasta 3 días antes; con menos de 72 horas, solo cambio de fecha. Igual o más flexible que las plataformas externas.',
  },
];

// FAQPage — refleja exactamente las preguntas visibles del acordeón de paquetes
const paquetesFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function PaquetesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(paquetesSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(paquetesBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(paquetesFaqSchema) }} />
      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Inicio</Link>
              <span aria-hidden="true"> › </span>
              <span>Paquetes</span>
            </nav>
            <p className={styles.eyebrow}>Xilitla, Huasteca Potosina · Hotel + tours</p>
            <h1>Vacaciones<br /><em>sin sorpresas</em></h1>
            <p className={styles.heroSub}>
              Hospedaje en Paraíso Encantado + tours guiados por la Huasteca, armados por nuestro
              equipo de tours. De 3 a 6 días, con el itinerario resuelto.
            </p>
          </div>
        </section>

        {/* BANNER DE CONFIANZA — separa el hero de la info */}
        <div className={styles.trustBanner} role="list" aria-label="Garantías de reserva directa" data-reveal>
          <FloatingLeaves />
          <span role="listitem" className={styles.trustItem}>
            <span className={styles.stars} aria-hidden="true">★★★★★</span> 4.5 · 523 reseñas Google
          </span>
          <span className={styles.trustSep} aria-hidden="true" />
          <span role="listitem" className={styles.trustItem}>Reembolso hasta 7 días antes</span>
          <span className={styles.trustSep} aria-hidden="true" />
          <span role="listitem" className={styles.trustItem}>Equipo de tours por WhatsApp</span>
        </div>

        {/* PAQUETES */}
        <section className={styles.paquetesSection} aria-labelledby="paquetes-heading">
          <div className={styles.paquetesInner}>
            <h2 id="paquetes-heading" className={styles.sectionTitle} data-reveal>
              Elige tu <em>paquete ideal</em>
            </h2>
            <p className={styles.sectionSub} data-reveal>
              Todos incluyen suite con amenidades completas, WiFi y estacionamiento privado.
            </p>

            <div className={styles.cards}>
              {PAQUETES.map((p, i) => (
                <div
                  key={p.slug}
                  data-reveal
                  style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}
                  className={styles.cardReveal}
                >
                  <TiltCard className={`${styles.card} ${p.featured ? styles.cardFeatured : ''}`}>
                    <div className={styles.cardImg}>
                      <Image
                        src={p.image}
                        alt={p.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        quality={80}
                        style={{ objectFit: 'cover' }}
                      />
                      <span className={`${styles.badge} ${styles[`badge_${p.badgeColor}`]}`}>{p.badge}</span>
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.cardName}>{p.name}</h3>
                      <p className={styles.cardTagline}>{p.tagline}</p>

                      <div className={styles.cardMeta}>
                        <span><Calendar size={13} strokeWidth={1.8} />{p.duracion}</span>
                      </div>

                      {/* marginTop auto: sin la lista de incluye ni el precio, los botones
                          se quedan abajo aunque los subtítulos midan distinto. */}
                      <div className={styles.cardActions} style={{ marginTop: 'auto' }}>
                        <a
                          href={`${TOURS_WHATSAPP_URL}?text=${p.waMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.ctaPrimary}
                        >
                          Consultar disponibilidad
                        </a>
                        <a
                          href={`${PACKAGES_URL}/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.ctaSecondary}
                        >
                          Ver paquete <span className="pe-arrow">→</span>
                        </a>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* STRIP PERSONALIZACIÓN */}
        <section className={styles.customStrip}>
          <div className={styles.customInner} data-reveal>
            <MapPin size={24} strokeWidth={1.5} className={styles.customIcon} />
            <div>
              <p className={styles.customTitle}>¿No encuentras exactamente lo que buscas?</p>
              <p className={styles.customText}>
                Diseñamos paquetes a la medida: fechas específicas, grupos grandes, luna de miel, aniversarios o eventos corporativos.
                Escríbenos y en 2 horas tienes tu cotización personalizada.
              </p>
            </div>
            <a
              href={`${TOURS_WHATSAPP_URL}?text=Hola%2C%20me%20gustar%C3%ADa%20un%20paquete%20personalizado.`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.customCta}
            >
              Paquete a la medida <span className="pe-arrow">→</span>
            </a>
          </div>
        </section>

        {/* LO QUE INCLUYE SIEMPRE */}
        <section className={styles.baseSection}>
          <div className={styles.baseInner}>
            <h2 className={styles.sectionTitle} data-reveal>Siempre incluido <em>en todos los paquetes</em></h2>
            <div className={styles.baseGrid}>
              {[
                { icon: <Coffee size={22} strokeWidth={1.5} />, title: 'WiFi de alta velocidad', desc: 'En todas las suites y áreas comunes sin límite.' },
                { icon: <MapPin size={22} strokeWidth={1.5} />, title: 'Estacionamiento privado', desc: 'Gratuito dentro del hotel. Sin preocupaciones.' },
                { icon: <Check size={22} strokeWidth={1.5} />, title: 'Check-in flexible', desc: 'Coordinamos tu llegada según el vuelo o carretera.' },
                { icon: <Users size={22} strokeWidth={1.5} />, title: 'Atención personalizada', desc: 'No eres un número de reserva, somos un hotel boutique.' },
              ].map((b, i) => (
                <div
                  key={b.title}
                  className={styles.baseItem}
                  data-reveal
                  style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
                >
                  <div className={styles.baseItemIcon}>{b.icon}</div>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.faqSection}>
          <div className={styles.faqInner}>
            <h2 className={styles.sectionTitle} data-reveal>Preguntas <em>frecuentes</em></h2>
            <dl className={styles.faqList}>
              {FAQ.map((f, i) => (
                <div
                  key={f.q}
                  className={styles.faqItem}
                  data-reveal
                  style={{ '--reveal-delay': `${i * 50}ms` } as React.CSSProperties}
                >
                  <dt>{f.q}</dt>
                  <dd>{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className={styles.ctaSection}>
          <FloatingLeaves />
          <div className={styles.ctaInner} data-reveal>
            <p className={styles.eyebrow}>¿Listo para reservar?</p>
            <h2>El Jardín de Edward James<br /><em>te espera</em></h2>
            <p className={styles.ctaDesc}>
              Confirmación en menos de 2 horas · Sin comisiones de OTAs · Cancelación gratuita
            </p>
            <div className={styles.ctaButtons}>
              <a
                href={`${TOURS_WHATSAPP_URL}?text=Hola%2C%20me%20interesa%20reservar%20un%20paquete.`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaBtn}
              >
                WhatsApp — Reservar ahora
              </a>
              <a
                href={PACKAGES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaBtnOutline}
              >
                Ver todos los paquetes
              </a>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
