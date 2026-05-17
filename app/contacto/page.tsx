import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, MessageCircle, MapPin, CalendarCheck, Mail, Clock, ChevronDown } from 'lucide-react';
import styles from './contacto.module.css';
import ContactForm from './ContactForm';

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Contacto y Reservas | Paraíso Encantado Xilitla · ☎ 489-100-7679',
  description:
    'WhatsApp, teléfono o formulario — respondemos en menos de 2 horas. Reserva directa y consigue el mejor precio. Hotel Paraíso Encantado, Xilitla, Huasteca Potosina.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/contacto',
  },
  openGraph: {
    title: 'Contacto — Hotel Paraíso Encantado, Xilitla',
    description:
      'Escríbenos por WhatsApp, llámanos o usa el formulario. Respondemos en menos de 2 horas. Estamos en Xilitla a 5 min del Jardín de Edward James.',
    url: 'https://www.paraisoencantado.com/contacto',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/Areas comunes/DSC09442-HDR.jpg',
        width: 1200,
        height: 630,
        alt: 'Jardines del Hotel Paraíso Encantado — Xilitla, Huasteca Potosina',
      },
    ],
  },
};

// ── Schema ContactPage + LocalBusiness ────────────────────────────────────────
const contactSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ContactPage',
      name: 'Contacto — Hotel Paraíso Encantado',
      url: 'https://www.paraisoencantado.com/contacto',
      description: 'Formas de contactar al Hotel Paraíso Encantado en Xilitla, Huasteca Potosina.',
      mainEntity: { '@id': 'https://www.paraisoencantado.com/#localbusiness' },
    },
    {
      '@type': ['LocalBusiness', 'LodgingBusiness'],
      '@id': 'https://www.paraisoencantado.com/#localbusiness',
      name: 'Hotel Paraíso Encantado',
      url: 'https://www.paraisoencantado.com',
      telephone: ['+524891007679', '+524891007601'],
      email: 'reservas@paraisoencantado.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Xilitla',
        addressRegion: 'San Luis Potosí',
        postalCode: '79910',
        addressCountry: 'MX',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 21.383,
        longitude: -99.002,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
          opens: '08:00',
          closes: '21:00',
        },
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'reservations',
          telephone: '+524891007679',
          availableLanguage: ['Spanish', 'English'],
        },
        {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          telephone: '+524891007601',
          availableLanguage: 'Spanish',
        },
      ],
      sameAs: [
        'https://www.instagram.com/_paraiso_encantado/',
        'https://www.facebook.com/cabanas.encantado/',
        'https://www.youtube.com/@hotelparaisoencantadoxilit8111',
        `https://wa.me/524891007679`,
      ],
    },
  ],
};

const BOOKING_URL = '/reservar';
const WHATSAPP_URL = 'https://wa.me/524891007679';
const MAPS_URL = 'https://www.google.com/maps/place/Hotel+Paraiso+Encantado/@21.3842,-99.0033,17z';

// FAQ de pre-llegada
const faqs = [
  {
    q: '¿Hay estacionamiento en el hotel?',
    a: 'Sí — estacionamiento privado y gratuito para todos los huéspedes. Capacidad limitada, pero hay espacio disponible para todos los coches sin cargo adicional.',
  },
  {
    q: '¿Cómo llego al hotel desde el centro de Xilitla?',
    a: 'El hotel está a 5 minutos caminando del centro de Xilitla y a 400 metros de la entrada al Jardín de Edward James (Las Pozas). Al llegar al pueblo, sigue las señales hacia Las Pozas — el hotel está señalizado en la misma calle.',
  },
  {
    q: '¿Aceptan mascotas?',
    a: 'Actualmente no aceptamos mascotas en las suites para preservar el ecosistema del hotel y el confort de todos los huéspedes. Si tienes necesidades especiales, contáctanos — evaluamos caso por caso.',
  },
  {
    q: '¿Puedo visitar el restaurante sin hospedarme?',
    a: 'Sí — El Papán Huasteco está abierto al público de 8:00 AM a 8:00 PM todos los días. Recomendamos llamar con anticipación para reservar mesa, especialmente en fines de semana.',
  },
  {
    q: '¿Qué incluye el desayuno?',
    a: 'El desayuno en El Papán Huasteco incluye: tortillas hechas a mano en comal, huevos al gusto, frijoles de olla, café de olla o bebida caliente y jugo natural. El zacahuil y otros platillos regionales tienen costo adicional.',
  },
  {
    q: '¿Cómo los contacto en caso de emergencia nocturna?',
    a: 'La recepción está disponible hasta las 9:00 PM. En emergencias fuera de horario, escríbenos por WhatsApp al +52 489-100-7679 — monitoreamos el chat aunque la oficina esté cerrada.',
  },
  {
    q: '¿Con cuánta anticipación debo reservar?',
    a: 'En temporada alta (Semana Santa, vacaciones de verano, fines de semana puente) recomendamos reservar con 2-4 semanas de anticipación. Entre semana y en temporada baja suele haber disponibilidad con poca antelación — consulta en tiempo real en nuestro motor de reservas.',
  },
];

// Distancias con links a Google Maps
const distances = [
  {
    city: 'CDMX',
    time: '~7.5 hrs',
    km: '460 km',
    mapsUrl: 'https://www.google.com/maps/dir/Ciudad+de+Mexico,+CDMX/Hotel+Paraiso+Encantado,+Xilitla,+San+Luis+Potos%C3%AD',
  },
  {
    city: 'Monterrey',
    time: '~7 hrs',
    km: '430 km',
    mapsUrl: 'https://www.google.com/maps/dir/Monterrey,+Nuevo+Le%C3%B3n/Hotel+Paraiso+Encantado,+Xilitla,+San+Luis+Potos%C3%AD',
  },
  {
    city: 'SLP',
    time: '~5 hrs',
    km: '250 km',
    mapsUrl: 'https://www.google.com/maps/dir/San+Luis+Potos%C3%AD,+S.L.P./Hotel+Paraiso+Encantado,+Xilitla,+San+Luis+Potos%C3%AD',
  },
  {
    city: 'Tampico',
    time: '~3.5 hrs',
    km: '200 km',
    mapsUrl: 'https://www.google.com/maps/dir/Tampico,+Tamps./Hotel+Paraiso+Encantado,+Xilitla,+San+Luis+Potos%C3%AD',
  },
];

// FAQPage — convierte las preguntas del acordeón en schema para rich snippets
const contactFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

// ── Componente ─────────────────────────────────────────────────────────────────
export default function ContactoPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactFaqSchema) }} />

      <main className={styles.main}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <span>Contacto</span>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Estamos para ayudarte</p>
          <h1 className={styles.heroTitle}>
            Hablemos de tu <em>Escapada</em>
          </h1>
          <p className={styles.heroDesc}>
            Resolvemos tus dudas y te ayudamos a elegir la suite perfecta.
            Respondemos en menos de 2 horas por WhatsApp.
          </p>
        </section>

        {/* Botones de acción rápida — H2→H3 fix */}
        <section className={styles.actionsSection}>
          <div className={styles.actionsGrid}>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className={`${styles.actionCard} ${styles.actionWhatsapp}`}>
              <div className={styles.actionIcon}><MessageCircle size={32} strokeWidth={1.5} /></div>
              <div className={styles.actionContent}>
                <h3>WhatsApp</h3>
                <p>Respuesta en menos de 2 horas. La forma más rápida de contactarnos.</p>
                <span className={styles.actionLink}>Escribir por WhatsApp →</span>
              </div>
            </a>
            <a href={BOOKING_URL} className={`${styles.actionCard} ${styles.actionReserva}`}>
              <div className={styles.actionIcon}><CalendarCheck size={32} strokeWidth={1.5} /></div>
              <div className={styles.actionContent}>
                <h3>Motor de Reservas</h3>
                <p>Verifica disponibilidad y reserva en línea con confirmación instantánea.</p>
                <span className={styles.actionLink}>Reservar ahora →</span>
              </div>
            </a>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer"
              className={`${styles.actionCard} ${styles.actionMaps}`}>
              <div className={styles.actionIcon}><MapPin size={32} strokeWidth={1.5} /></div>
              <div className={styles.actionContent}>
                <h3>Cómo Llegarnos</h3>
                <p>Xilitla, San Luis Potosí. A 5 minutos del Jardín de Edward James.</p>
                <span className={styles.actionLink}>Ver en Google Maps →</span>
              </div>
            </a>
          </div>
        </section>

        {/* Formulario de contacto + imagen */}
        <section className={styles.formSection} aria-labelledby="form-heading">
          <div className={styles.formLayout}>
            <div className={styles.formCol}>
              <p className={styles.eyebrow}>Escríbenos</p>
              <h2 id="form-heading" className={styles.formTitle}>
                ¿Tienes dudas? <em>Cuéntanos</em>
              </h2>
              <p className={styles.formSubtitle}>
                Déjanos tus datos y te respondemos en menos de 2 horas — por email y por WhatsApp si nos dejas tu número.
              </p>
              <ContactForm />
            </div>
            <div className={styles.formImageCol}>
              <div className={styles.formImageWrap}>
                <Image
                  src="/images/Areas comunes/DSC09471-HDR.jpg"
                  alt="Hotel Paraíso Encantado — atardecer en Xilitla"
                  fill
                  sizes="(max-width:768px) 100vw, 40vw"
                  className={styles.formImage}
                />
                <div className={styles.formImageOverlay} />
                <div className={styles.formImageContent}>
                  <p className={styles.formImageQuote}>"La Huasteca que siempre quisiste conocer — te esperamos."</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Información de contacto */}
        <section className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoBlock}>
              <h3>Teléfonos</h3>
              <ul className={styles.contactList}>
                <li>
                  <Phone size={16} strokeWidth={1.5} />
                  <div>
                    <a href="tel:+524891007679">+52 489-100-7679</a>
                    <span>Reservaciones y atención general</span>
                  </div>
                </li>
                <li>
                  <Phone size={16} strokeWidth={1.5} />
                  <div>
                    <a href="tel:+524891007601">+52 489-100-7601</a>
                    <span>Línea directa de recepción</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className={styles.infoBlock}>
              <h3>WhatsApp</h3>
              <ul className={styles.contactList}>
                <li>
                  <MessageCircle size={16} strokeWidth={1.5} />
                  <div>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">+52 489-100-7679</a>
                    <span>Lunes a domingo, 8 am – 9 pm</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className={styles.infoBlock}>
              <h3>Correo Electrónico</h3>
              <ul className={styles.contactList}>
                <li>
                  <Mail size={16} strokeWidth={1.5} />
                  <div>
                    <a href="mailto:reservas@paraisoencantado.com">reservas@paraisoencantado.com</a>
                    <span>Reservas y cotizaciones grupales</span>
                  </div>
                </li>
                <li>
                  <Mail size={16} strokeWidth={1.5} />
                  <div>
                    <a href="mailto:hola@paraisoencantado.com">hola@paraisoencantado.com</a>
                    <span>Prensa, eventos y colaboraciones</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className={styles.infoBlock}>
              <h3>Horarios</h3>
              <ul className={styles.contactList}>
                <li>
                  <Clock size={16} strokeWidth={1.5} />
                  <div><strong>Check-in:</strong><span>15:00 hrs en adelante</span></div>
                </li>
                <li>
                  <Clock size={16} strokeWidth={1.5} />
                  <div><strong>Check-out:</strong><span>antes de las 12:00 hrs</span></div>
                </li>
                <li>
                  <Clock size={16} strokeWidth={1.5} />
                  <div><strong>Recepción:</strong><span>8:00 am – 9:00 pm diario</span></div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Redes sociales */}
        <section className={styles.socialSection} aria-labelledby="social-heading">
          <p className={styles.eyebrow}>Síguenos</p>
          <h2 id="social-heading" className={styles.socialTitle}>Paraíso Encantado <em>en redes</em></h2>
          <p className={styles.socialSubtitle}>Antes de reservar, muchos viajeros nos conocen a través de Instagram. Aquí estamos:</p>
          <div className={styles.socialLinks}>
            <a href="https://www.instagram.com/_paraiso_encantado/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} style={{ background: '#E1306C' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              <span>@_paraiso_encantado</span>
            </a>
            <a href="https://www.facebook.com/cabanas.encantado/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} style={{ background: '#1877F2' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              <span>cabanas.encantado</span>
            </a>
            <a href="https://www.youtube.com/@hotelparaisoencantadoxilit8111" target="_blank" rel="noopener noreferrer" className={styles.socialLink} style={{ background: '#FF0000' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
              <span>Canal de YouTube</span>
            </a>
          </div>
        </section>

        {/* Mapa */}
        <section className={styles.mapSection}>
          <div className={styles.mapHeader}>
            <h2>Cómo <em>Llegarnos</em></h2>
            <p>
              Xilitla, San Luis Potosí · Huasteca Potosina, México<br />
              A 5 minutos caminando del Jardín Surrealista de Edward James (Las Pozas)
            </p>
          </div>
          <div className={styles.mapWrap}>
            <iframe
              title="Ubicación Hotel Paraíso Encantado en Xilitla"
              src="https://maps.google.com/maps?q=Hotel+Paraiso+Encantado+Xilitla&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className={styles.mapFrame}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          {/* Distancias con links de ruta */}
          <div className={styles.distanceRow}>
            {distances.map((d) => (
              <a key={d.city} href={d.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.distanceItem}>
                <strong>{d.city}</strong>
                <span>{d.time}</span>
                <span className={styles.km}>{d.km}</span>
                <span className={styles.distanceRoute}>Cómo llegar →</span>
              </a>
            ))}
          </div>
        </section>

        {/* FAQ de pre-llegada */}
        <section className={styles.faqSection} aria-labelledby="faq-heading">
          <div className={styles.faqHeader}>
            <p className={styles.eyebrow}>Antes de llegar</p>
            <h2 id="faq-heading" className={styles.faqTitle}>
              Preguntas <em>frecuentes</em>
            </h2>
            <p className={styles.faqSubtitle}>Lo que más nos preguntan antes del check-in.</p>
          </div>
          <div className={styles.faqList}>
            {faqs.map((f) => (
              <details key={f.q} className={styles.faqItem}>
                <summary className={styles.faqQ}>
                  {f.q}
                  <ChevronDown size={18} className={styles.faqChevron} />
                </summary>
                <p className={styles.faqA}>{f.a}</p>
              </details>
            ))}
          </div>
          <p className={styles.faqExtra}>
            ¿Otra pregunta? <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a> — respondemos en menos de 2 horas.
          </p>
        </section>

      </main>
    </>
  );
}
