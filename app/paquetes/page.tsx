import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Calendar, Users, Coffee, MapPin } from 'lucide-react';
import TiltCard from '@/components/TiltCard';
import styles from './paquetes.module.css';

export const metadata: Metadata = {
  title: 'Paquetes Todo Incluido · Xilitla Huasteca Potosina | Paraíso Encantado',
  description:
    'Paquetes vacacionales todo incluido en Xilitla: habitación + desayunos + tours. Escapada Romántica, Aventura Huasteca y Explorer Familiar. Precio final, sin sorpresas.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/paquetes',
  },
  openGraph: {
    title: 'Paquetes Todo Incluido en Xilitla | Paraíso Encantado',
    description: 'Suite + desayunos huastecos + tours coordinados. Precio total desde $5,200 MXN por pareja. Reserva directo y ahorra hasta 15%.',
    url: 'https://www.paraisoencantado.com/paquetes',
    images: [{ url: 'https://www.paraisoencantado.com/images/FLOR DE LIS 1/PORTADA.jpg', alt: 'Suite Flor de Liz con spa privado — Paraíso Encantado', width: 1200, height: 630 }],
  },
};

const SELLER = { '@type': 'Hotel', name: 'Hotel Paraíso Encantado', url: 'https://www.paraisoencantado.com' };

const paquetesSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Paquetes Todo Incluido — Hotel Paraíso Encantado',
  url: 'https://www.paraisoencantado.com/paquetes',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Product',
        name: 'Noche de Selva',
        description: '2 noches en suite con spa privado + 2 desayunos huastecos para dos + visita coordinada a Las Pozas de Edward James + decoración romántica.',
        image: 'https://www.paraisoencantado.com/images/FLOR DE LIS 1/PORTADA.jpg',
        brand: SELLER,
        aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.9, reviewCount: 32, bestRating: 5 },
        offers: {
          '@type': 'Offer', priceCurrency: 'MXN', price: 5200,
          priceValidUntil: '2026-12-31',
          availability: 'https://schema.org/InStock',
          url: 'https://www.paraisoencantado.com/paquetes',
          seller: SELLER,
        },
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Product',
        name: 'Ruta de las Pozas',
        description: '3 noches + 3 desayunos para dos + tour Las Pozas + tour Cascada de Tamul con guía local certificado + traslados.',
        image: 'https://www.paraisoencantado.com/images/atracciones/cascada_de_tamul.jpg',
        brand: SELLER,
        aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.9, reviewCount: 41, bestRating: 5 },
        offers: {
          '@type': 'Offer', priceCurrency: 'MXN', price: 8900,
          priceValidUntil: '2026-12-31',
          availability: 'https://schema.org/InStock',
          url: 'https://www.paraisoencantado.com/paquetes',
          seller: SELLER,
        },
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Product',
        name: 'Familia Huasteca',
        description: '3 noches en suite familiar Helechos (hasta 6 personas) + desayunos + tour Las Pozas + kit bienvenida para niños.',
        image: 'https://www.paraisoencantado.com/images/HELECHOS 1/PORTADA.jpg',
        brand: SELLER,
        aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.8, reviewCount: 27, bestRating: 5 },
        offers: {
          '@type': 'Offer', priceCurrency: 'MXN', price: 13500,
          priceValidUntil: '2026-12-31',
          availability: 'https://schema.org/InStock',
          url: 'https://www.paraisoencantado.com/paquetes',
          seller: SELLER,
        },
      },
    },
  ],
};

const paquetesBreadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
    { '@type': 'ListItem', position: 2, name: 'Paquetes Todo Incluido', item: 'https://www.paraisoencantado.com/paquetes' },
  ],
};

const PAQUETES = [
  {
    id: 'selva',
    featured: true,
    badge: 'Más solicitado',
    badgeColor: 'gold' as const,
    name: 'Noche de Selva',
    tagline: 'La selva, el spa y la persona que amas. Nada más.',
    noches: 2,
    personas: '2 personas',
    image: '/images/FLOR DE LIS 1/PORTADA.jpg',
    imageAlt: 'Suite Flor de Liz con spa privado al amanecer — Paquete Noche de Selva',
    experienceImg: '/images/atracciones/jardin_de_edward_james.jpg',
    experienceAlt: 'Las Pozas de Edward James incluidas en el paquete',
    experienceLabel: 'Visita Las Pozas incluida',
    includes: [
      '2 noches en suite con spa privado al aire libre',
      '2 desayunos huastecos para dos (El Papán)',
      'Visita a Las Pozas de Edward James coordinada',
      'Decoración romántica en suite (flores y velas)',
      'Botella de vino de bienvenida',
      'Check-in anticipado sujeto a disponibilidad',
    ],
    price: 5200,
    priceNote: 'por pareja, 2 noches',
    saving: 'Ahorras ~$800 vs. reservar por separado',
    cta: '/reservar',
    waMsg: 'Hola%2C%20me%20interesa%20el%20Paquete%20Noche%20de%20Selva.%20%C2%BFTienen%20disponibilidad%3F',
  },
  {
    id: 'pozas',
    featured: false,
    badge: 'La experiencia completa',
    badgeColor: 'forest' as const,
    name: 'Ruta de las Pozas',
    tagline: 'Tres días. Dos cascadas. Una Huasteca que no olvidarás.',
    noches: 3,
    personas: '2 personas',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    imageAlt: 'Cascada de Tamul — Tour incluido en el Paquete Ruta de las Pozas',
    experienceImg: '/images/atracciones/jardin-edward-james-aerial.png',
    experienceAlt: 'Vista aérea Las Pozas de Edward James',
    experienceLabel: 'Las Pozas + Tamul incluidos',
    includes: [
      '3 noches en suite (libre elección)',
      '3 desayunos huastecos para dos (El Papán)',
      'Tour a Las Pozas de Edward James con guía local',
      'Tour a Cascada de Tamul (canoa incluida)',
      'Traslado desde/hacia terminal de Xilitla',
      'Mapa y guía impresa de la región',
    ],
    price: 8900,
    priceNote: 'por pareja, 3 noches',
    saving: 'Ahorras ~$1,400 vs. reservar por separado',
    cta: '/reservar',
    waMsg: 'Hola%2C%20me%20interesa%20el%20Paquete%20Ruta%20de%20las%20Pozas.%20%C2%BFTienen%20disponibilidad%3F',
  },
  {
    id: 'familiar',
    featured: false,
    badge: 'Ideal para familias',
    badgeColor: 'sage' as const,
    name: 'Familia Huasteca',
    tagline: 'El viaje que tus hijos van a contar de adultos.',
    noches: 3,
    personas: '4–6 personas',
    image: '/images/HELECHOS 1/PORTADA.jpg',
    imageAlt: 'Suite Helechos familiar — hasta 6 personas, acceso a piscina',
    experienceImg: '/images/atracciones/tamasopo.jpg',
    experienceAlt: 'Cascadas de Tamasopo — Huasteca Potosina',
    experienceLabel: 'Tour Las Pozas para la familia',
    includes: [
      '3 noches en suite familiar Helechos (hasta 6 personas)',
      'Desayunos huastecos para toda la familia',
      'Tour a Las Pozas de Edward James',
      'Kit de bienvenida para niños',
      'Recomendaciones personalizadas de rutas familiares',
      'Estacionamiento privado gratuito',
    ],
    price: 13500,
    priceNote: 'por familia de 4, 3 noches',
    saving: 'Ahorras ~$2,100 vs. reservar por separado',
    cta: '/reservar',
    waMsg: 'Hola%2C%20me%20interesa%20el%20Paquete%20Familia%20Huasteca.%20%C2%BFTienen%20disponibilidad%3F',
  },
];

const PAQUETE_TEMPORADA = {
  id: 'temporada',
  badge: 'EDICIÓN LIMITADA',
  name: 'Selva en Silencio',
  tagline: 'Temporada baja: el hotel más vacío, la naturaleza más presente.',
  noches: 3,
  personas: '2 personas',
  image: '/images/Areas comunes/DSC09447-HDR.jpg',
  imageAlt: 'Jardín y piscina del hotel en temporada baja — Paquete Selva en Silencio',
  includes: [
    '3 noches en la suite de tu elección',
    '3 desayunos huastecos para dos',
    'Tour a Las Pozas con grupo reducido (máx. 6 personas)',
    'Sesión fotográfica en Las Pozas al amanecer',
    'Late check-out hasta las 2 PM incluido',
    'Precio especial de temporada baja',
  ],
  price: 6900,
  priceNote: 'por pareja, 3 noches · temporada baja',
  saving: 'Disponible oct–nov y ene–feb · Precio especial',
  waMsg: 'Hola%2C%20me%20interesa%20el%20Paquete%20Selva%20en%20Silencio.%20%C2%BFEst%C3%A1%20disponible%3F',
};

const FAQ = [
  {
    q: '¿Puedo personalizar los paquetes?',
    a: 'Sí. Escríbenos por WhatsApp o al correo y ajustamos fechas, tipo de suite, número de personas y actividades. Los precios son una base — si tu grupo es más grande o quieres agregar más tours, te cotizamos sin compromiso.',
  },
  {
    q: '¿Los precios incluyen impuestos?',
    a: 'Los precios mostrados son precio final en pesos mexicanos. No hay cargos ocultos ni comisiones de plataformas.',
  },
  {
    q: '¿Puedo cambiar la suite incluida en el paquete?',
    a: 'Sí. Los paquetes están diseñados con suites base, pero puedes actualizar a cualquier suite disponible. Si la suite que quieres tiene un precio mayor, solo cubres la diferencia. Pregúntanos por WhatsApp.',
  },
  {
    q: '¿Los niños pagan igual que los adultos?',
    a: 'Niños menores de 5 años son gratuitos. De 6 a 11 años pagan 50% del costo de adulto adicional. Para el paquete Familia Huasteca el precio ya contempla 2 adultos y 2 niños de hasta 12 años.',
  },
  {
    q: '¿Cómo reservo un paquete?',
    a: 'Escríbenos por WhatsApp al +52 489-100-7679 con las fechas deseadas y el paquete que te interesa. Te confirmamos disponibilidad en menos de 2 horas y te enviamos el link de pago directo.',
  },
  {
    q: '¿Qué pasa si necesito cancelar?',
    a: 'Política de cancelación gratuita hasta 48 horas antes de tu llegada, con reembolso del 100%. Más flexible que cualquier plataforma externa.',
  },
];

export default function PaquetesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(paquetesSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(paquetesBreadcrumb) }} />
      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Inicio</Link>
              <span aria-hidden="true"> › </span>
              <span>Paquetes</span>
            </nav>
            <p className={styles.eyebrow}>Xilitla, Huasteca Potosina · Todo incluido</p>
            <h1>Vacaciones<br /><em>sin sorpresas</em></h1>
            <p className={styles.heroSub}>
              Suite + desayunos huastecos + tours coordinados. Un solo precio, todo resuelto.
              Reserva directo y ahorra hasta 15% vs. plataformas externas.
            </p>
          </div>
        </section>

        {/* BANNER DE CONFIANZA — separa el hero de la info */}
        <div className={styles.trustBanner} role="list" aria-label="Garantías de reserva directa" data-reveal>
          <span role="listitem" className={styles.trustItem}>
            <span className={styles.stars} aria-hidden="true">★★★★★</span> 4.8 · 514 reseñas Google
          </span>
          <span className={styles.trustSep} aria-hidden="true" />
          <span role="listitem" className={styles.trustItem}>Cancelación gratis 48 hrs</span>
          <span className={styles.trustSep} aria-hidden="true" />
          <span role="listitem" className={styles.trustItem}>Precio final en MXN</span>
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
                  key={p.id}
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
                        <span><Calendar size={13} strokeWidth={1.8} />{p.noches} noches</span>
                        <span><Users size={13} strokeWidth={1.8} />{p.personas}</span>
                      </div>

                      <ul className={styles.includes} aria-label="Qué incluye">
                        {p.includes.map((item) => (
                          <li key={item}>
                            <Check size={13} strokeWidth={2.5} className={styles.checkIcon} />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <div className={styles.cardPricing}>
                        <div>
                          <span className={styles.priceFrom}>desde</span>
                          <span className={styles.price}>${p.price.toLocaleString('es-MX')}</span>
                          <span className={styles.priceCurrency}>MXN</span>
                        </div>
                        <p className={styles.priceNote}>{p.priceNote}</p>
                        <p className={styles.priceSaving}>{p.saving}</p>
                      </div>

                      <div className={styles.cardActions}>
                        <a
                          href={`https://wa.me/524891007679?text=${p.waMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.ctaPrimary}
                        >
                          Consultar disponibilidad
                        </a>
                        <Link href={p.cta} className={styles.ctaSecondary}>
                          Ver suites disponibles <span className="pe-arrow">→</span>
                        </Link>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              ))}
            </div>

            {/* PAQUETE TEMPORADA — cierre destacado */}
            <div className={styles.cardTemporada} data-reveal>
              <div className={styles.cardTemporadaImg}>
                <Image
                  src={PAQUETE_TEMPORADA.image}
                  alt={PAQUETE_TEMPORADA.imageAlt}
                  fill sizes="(max-width: 768px) 100vw, 40vw" quality={80}
                  style={{ objectFit: 'cover' }}
                />
                <div className={styles.cardTemporadaOverlay} />
              </div>
              <div className={styles.cardTemporadaBody}>
                <span className={styles.badgeTemporada}>{PAQUETE_TEMPORADA.badge}</span>
                <h3 className={styles.cardTemporadaName}>{PAQUETE_TEMPORADA.name}</h3>
                <p className={styles.cardTemporadaTagline}>{PAQUETE_TEMPORADA.tagline}</p>
                <div className={styles.cardMeta} style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span><Calendar size={13} strokeWidth={1.8} />{PAQUETE_TEMPORADA.noches} noches</span>
                  <span><Users size={13} strokeWidth={1.8} />{PAQUETE_TEMPORADA.personas}</span>
                </div>
                <ul className={styles.includes} style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {PAQUETE_TEMPORADA.includes.map((item) => (
                    <li key={item}>
                      <Check size={13} strokeWidth={2.5} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className={styles.cardTemporadaPricing}>
                  <span className={styles.cardTemporadaPrice}>${PAQUETE_TEMPORADA.price.toLocaleString('es-MX')} MXN</span>
                  <span className={styles.cardTemporadaPriceNote}>{PAQUETE_TEMPORADA.priceNote}</span>
                </div>
                <a
                  href={`https://wa.me/524891007679?text=${PAQUETE_TEMPORADA.waMsg}`}
                  target="_blank" rel="noopener noreferrer"
                  className={styles.cardTemporadaCta}
                >
                  Consultar disponibilidad
                </a>
              </div>
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
              href="https://wa.me/524891007679?text=Hola%2C%20me%20gustar%C3%ADa%20un%20paquete%20personalizado."
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
          <div className={styles.ctaInner} data-reveal>
            <p className={styles.eyebrow}>¿Listo para reservar?</p>
            <h2>El Jardín de Edward James<br /><em>te espera</em></h2>
            <p className={styles.ctaDesc}>
              Confirmación en menos de 2 horas · Sin comisiones de OTAs · Cancelación gratuita
            </p>
            <div className={styles.ctaButtons}>
              <a
                href="https://wa.me/524891007679?text=Hola%2C%20me%20interesa%20reservar%20un%20paquete."
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaBtn}
              >
                WhatsApp — Reservar ahora
              </a>
              <Link href="/habitaciones" className={styles.ctaBtnOutline}>
                Ver todas las suites
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
