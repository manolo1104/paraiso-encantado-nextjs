import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Calendar, Users, Coffee, MapPin } from 'lucide-react';
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
    images: [{ url: 'https://www.paraisoencantado.com/images/FLOR DE LIS 1/PORTADA.jpg', alt: 'Suite Flor de Liz con spa privado — Paraíso Encantado' }],
  },
};

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
        name: 'Escapada Romántica',
        description: '2 noches en suite con spa privado + 2 desayunos huastecos para dos + visita a Las Pozas de Edward James.',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'MXN',
          price: 5200,
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Hotel', name: 'Hotel Paraíso Encantado' },
        },
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Product',
        name: 'Aventura Huasteca',
        description: '3 noches + 3 desayunos para dos + tour a Las Pozas + tour a la Cascada de Tamul con guía local certificado.',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'MXN',
          price: 8900,
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Hotel', name: 'Hotel Paraíso Encantado' },
        },
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Product',
        name: 'Explorer Familiar',
        description: '3 noches en suite familiar Helechos (hasta 6 personas) + desayunos para toda la familia + tour a Las Pozas.',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'MXN',
          price: 13500,
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Hotel', name: 'Hotel Paraíso Encantado' },
        },
      },
    },
  ],
};

const PAQUETES = [
  {
    id: 'romantica',
    badge: 'Más solicitado',
    badgeColor: 'gold' as const,
    name: 'Escapada Romántica',
    tagline: 'Para los que necesitan desconectarse — juntos',
    noches: 2,
    personas: '2 personas',
    image: '/images/FLOR DE LIS 1/PORTADA.jpg',
    imageAlt: 'Suite Flor de Liz con spa privado y vistas al bosque — Escapada Romántica',
    includes: [
      '2 noches en suite con spa privado al aire libre',
      '2 desayunos huastecos para dos (El Papán)',
      'Visita a Las Pozas de Edward James coordinada',
      'Decoración romántica en suite (flores, velas)',
      'Botella de vino de bienvenida',
      'Check-in anticipado sujeto a disponibilidad',
    ],
    price: 5200,
    priceNote: 'por pareja, 2 noches',
    saving: 'Ahorras ~$800 vs. reservar por separado',
    cta: '/reservar',
    waMsg: 'Hola%2C%20me%20interesa%20el%20Paquete%20Escapada%20Romántica.%20¿Tienen%20disponibilidad%3F',
  },
  {
    id: 'aventura',
    badge: 'La experiencia completa',
    badgeColor: 'forest' as const,
    name: 'Aventura Huasteca',
    tagline: 'Para los que quieren vivir la Huasteca de verdad',
    noches: 3,
    personas: '2 personas',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    imageAlt: 'Cascada de Tamul — Tour incluido en el paquete Aventura Huasteca',
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
    waMsg: 'Hola%2C%20me%20interesa%20el%20Paquete%20Aventura%20Huasteca.%20¿Tienen%20disponibilidad%3F',
  },
  {
    id: 'familiar',
    badge: 'Ideal para familias',
    badgeColor: 'sage' as const,
    name: 'Explorer Familiar',
    tagline: 'Para familias que quieren que sus hijos recuerden este viaje',
    noches: 3,
    personas: '4–6 personas',
    image: '/images/HELECHOS 1/PORTADA.jpg',
    imageAlt: 'Suite Helechos familiar — hasta 6 personas, terraza privada',
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
    waMsg: 'Hola%2C%20me%20interesa%20el%20Paquete%20Explorer%20Familiar.%20¿Tienen%20disponibilidad%3F',
  },
];

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
            <h1>Paquetes <em>Vacaciones</em><br />sin sorpresas</h1>
            <p className={styles.heroSub}>
              Suite + desayunos huastecos + tours coordinados. Un solo precio, todo resuelto.
              Reserva directo y ahorra hasta 15% vs. plataformas externas.
            </p>
            <div className={styles.heroTrust}>
              <span>★★★★★ 4.8 · 514 reseñas Google</span>
              <span className={styles.dot} aria-hidden="true">·</span>
              <span>Cancelación gratis 48 hrs</span>
              <span className={styles.dot} aria-hidden="true">·</span>
              <span>Precio final en MXN</span>
            </div>
          </div>
        </section>

        {/* PAQUETES */}
        <section className={styles.paquetesSection} aria-labelledby="paquetes-heading">
          <div className={styles.paquetesInner}>
            <h2 id="paquetes-heading" className={styles.sectionTitle}>
              Elige tu <em>paquete ideal</em>
            </h2>
            <p className={styles.sectionSub}>
              Todos incluyen suite con amenidades completas, WiFi y estacionamiento privado.
            </p>

            <div className={styles.cards}>
              {PAQUETES.map((p) => (
                <article key={p.id} className={`${styles.card} ${styles[`card_${p.badgeColor}`]}`}>
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
                        Ver suites disponibles
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* STRIP PERSONALIZACIÓN */}
        <section className={styles.customStrip}>
          <div className={styles.customInner}>
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
              Paquete a la medida →
            </a>
          </div>
        </section>

        {/* LO QUE INCLUYE SIEMPRE */}
        <section className={styles.baseSection}>
          <div className={styles.baseInner}>
            <h2 className={styles.sectionTitle}>Siempre incluido <em>en todos los paquetes</em></h2>
            <div className={styles.baseGrid}>
              {[
                { icon: <Coffee size={22} strokeWidth={1.5} />, title: 'WiFi de alta velocidad', desc: 'En todas las suites y áreas comunes sin límite.' },
                { icon: <MapPin size={22} strokeWidth={1.5} />, title: 'Estacionamiento privado', desc: 'Gratuito dentro del hotel. Sin preocupaciones.' },
                { icon: <Check size={22} strokeWidth={1.5} />, title: 'Check-in flexible', desc: 'Coordinamos tu llegada según el vuelo o carretera.' },
                { icon: <Users size={22} strokeWidth={1.5} />, title: 'Atención personalizada', desc: 'No eres un número de reserva — somos un hotel boutique.' },
              ].map((b) => (
                <div key={b.title} className={styles.baseItem}>
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
            <h2 className={styles.sectionTitle}>Preguntas <em>frecuentes</em></h2>
            <dl className={styles.faqList}>
              {FAQ.map((f) => (
                <div key={f.q} className={styles.faqItem}>
                  <dt>{f.q}</dt>
                  <dd>{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
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
