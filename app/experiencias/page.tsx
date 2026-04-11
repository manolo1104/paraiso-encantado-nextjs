import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bus, Coffee, GraduationCap, ShieldCheck, Leaf, Camera, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import styles from './experiencias.module.css';

export const metadata: Metadata = {
  title: 'Tours y Experiencias | Hotel Paraíso Encantado · Huasteca Potosina',
  description:
    'Tours por la Huasteca Potosina desde Xilitla. Cascada Tamul, Jardín de Edward James, Cascadas de Micos, Puente de Dios y más. Guía certificado, transporte y desayuno incluidos.',
};

const WHATSAPP_URL = 'https://wa.me/524891007679';
const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';

const tours = [
  {
    id: 'expedicion-tamul',
    name: 'Expedición Tamul',
    subtitle: 'Sótano, Cañón & Cueva del Agua',
    category: 'Aventura & Naturaleza',
    difficulty: 'Media',
    price: '$1,450',
    priceUnit: 'MXN / persona',
    duration: '10–12 horas',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    description:
      'El tour más completo de la Huasteca en un solo día. Incluye Sótano de las Huahuastecas, Cascada Tamul en canoa y Cenote Cueva del Agua.',
    highlights: ['Sótano de las Huahuastecas', 'Cascada Tamul en canoa', 'Cenote Cueva del Agua', 'Guía certificado'],
  },
  {
    id: 'ruta-surrealista',
    name: 'Ruta Surrealista',
    subtitle: 'Edward James, Manantiales & Selva',
    category: 'Cultura & Naturaleza',
    difficulty: 'Fácil',
    price: '$1,300',
    priceUnit: 'MXN / persona',
    duration: '8–10 horas',
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    description:
      'Arte, agua y misterio en un recorrido de contrastes únicos. Las Pozas de Edward James, manantial Huichihuayán y Cueva de las Quilas.',
    highlights: ['Las Pozas de Edward James', 'Manantial Huichihuayán', 'Cueva de las Quilas', 'Selva tropical'],
  },
  {
    id: 'cascadas-meco',
    name: 'Cascadas del Meco',
    subtitle: 'Turquesas, Mirador & El Gran Salto',
    category: 'Cascadas & Fotografía',
    difficulty: 'Fácil',
    price: '$1,600',
    priceUnit: 'MXN / persona',
    duration: '9–11 horas',
    image: '/images/atracciones/cascadas_de_micos.jpg',
    description:
      'Tres caídas de agua, tres emociones distintas. Cascada El Meco, mirador panorámico y Cascada El Salto en un solo recorrido.',
    highlights: ['Cascada El Meco', 'Mirador panorámico', 'Cascada El Salto', 'Pozas naturales turquesas'],
  },
  {
    id: 'paraiso-escalonado',
    name: 'Paraíso Escalonado',
    subtitle: 'Minas Viejas & Cascadas de Micos',
    category: 'Cascadas & Bienestar',
    difficulty: 'Fácil',
    price: '$1,500',
    priceUnit: 'MXN / persona',
    duration: '9–11 horas',
    image: '/images/atracciones/nacimiento_de_huichihuayan.jpg',
    description:
      'Dos joyas naturales, un día perfecto para desconectar. Cascadas de Minas Viejas y las famosas Cascadas de Micos.',
    highlights: ['Cascadas de Minas Viejas', 'Cascadas de Micos', 'Baño en pozas naturales', 'Paisaje de selva'],
  },
  {
    id: 'ruta-acuatica',
    name: 'Ruta Acuática',
    subtitle: 'Puente de Dios, Hacienda & Siete Cascadas',
    category: 'Aventura Acuática',
    difficulty: 'Media',
    price: '$1,500',
    priceUnit: 'MXN / persona',
    duration: '10–12 horas',
    image: '/images/atracciones/puente_de_dios.jpg',
    description:
      'El recorrido más refrescante y completo de la región. Puente de Dios, Hacienda Los Gómez y las Siete Cascadas.',
    highlights: ['Puente de Dios', 'Hacienda Los Gómez', 'Siete Cascadas', 'Senderismo guiado'],
  },
];

const attractions = [
  {
    name: 'Sótano de las Golondrinas',
    image: '/images/atracciones/sotano_de_las_golondrinas.jpg',
    desc: 'Una de las cuevas-foso más grandes del mundo. Al amanecer, miles de loros y golondrinas surgen en espiral. Espectáculo natural sin igual.',
  },
  {
    name: 'Sótano de las Huahuas',
    image: '/images/atracciones/sotano_de_las_huahuas.jpg',
    desc: 'Caverna de 450 metros de profundidad en la sierra de Xilitla. Punto de partida para la expedición Tamul.',
  },
  {
    name: 'Tamasopo',
    image: '/images/atracciones/tamasopo.jpg',
    desc: 'Cascadas escalonadas de aguas verde-turquesa rodeadas de vegetación tropical. Perfectas para nadar y fotografiar.',
  },
  {
    name: 'Cascada El Salto',
    image: '/images/atracciones/cascada_el_salto.jpg',
    desc: 'Salto de agua de 40 metros encajado entre paredes de roca calcárea. Una de las cascadas más fotogénicas de la Huasteca.',
  },
];

const packageHighlight = {
  name: 'Las Pozas Experience',
  price: '$4,600',
  includes: [
    '2 noches en suite seleccionada',
    'Desayuno huasteco cada mañana',
    'Entrada a Las Pozas de Edward James',
    'Tour guiado por Xilitla (3 hrs)',
    'Cóctel de bienvenida',
  ],
};

export default function ExperienciasPage() {
  const whatsappTour = (tourName: string) =>
    `${WHATSAPP_URL}?text=Hola,%20me%20interesa%20el%20tour%20${encodeURIComponent(tourName)}`;

  return (
    <main className={styles.main}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <span>Experiencias</span>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Huasteca Potosina</p>
          <h1 className={styles.heroTitle}>
            Tours por la<br /><em>Huasteca Potosina</em>
          </h1>
          <p className={styles.heroDesc}>
            Cascadas, cañones, cenotes y arte surrealista. Salidas desde Xilitla con guía
            certificado, transporte y desayuno incluidos. La Huasteca en su estado más puro.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>5</span>
              <span className={styles.statLabel}>Tours disponibles</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>9</span>
              <span className={styles.statLabel}>Atracciones cubiertas</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>4.9</span>
              <span className={styles.statLabel}>Calificación promedio</span>
            </div>
          </div>
        </div>
        <div className={styles.heroImageWrap}>
          <Image
            src="/images/atracciones/cascada_de_tamul.jpg"
            alt="Cascada Tamul — La catarata más impresionante de San Luis Potosí"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={styles.heroImg}
          />
        </div>
      </section>

      {/* Paquete Destacado */}
      <section className={styles.packageSection}>
        <div className={styles.packageCard}>
          <div className={styles.packageBadge}>Paquete Recomendado</div>
          <div className={styles.packageContent}>
            <div>
              <p className={styles.eyebrow}>Paquete Especial</p>
              <h2 className={styles.packageName}>{packageHighlight.name}</h2>
              <ul className={styles.packageList}>
                {packageHighlight.includes.map((item) => (
                  <li key={item} className={styles.packageItem}>
                    <CheckCircle size={14} strokeWidth={2} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.packagePricing}>
              <p className={styles.packageFrom}>Desde</p>
              <p className={styles.packagePrice}>{packageHighlight.price}</p>
              <p className={styles.packageUnit}>MXN por pareja</p>
              <a
                href={`${WHATSAPP_URL}?text=Hola,%20me%20interesa%20el%20Paquete%20Las%20Pozas%20Experience`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.packageBtn}
              >
                Solicitar Paquete
              </a>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.packageBtnOutline}
              >
                Reservar Suite
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tours */}
      <section className={styles.toursSection}>
        <div className={styles.toursHeader}>
          <p className={styles.eyebrow}>Explora la Región</p>
          <h2 className={styles.toursTitle}>
            Tours con <em>guía certificado</em>
          </h2>
          <p className={styles.toursSubtitle}>
            Todos los tours salen desde el hotel. Transporte, guía y desayuno incluidos.
          </p>
        </div>

        <div className={styles.toursGrid}>
          {tours.map((tour) => (
            <article key={tour.id} className={styles.tourCard}>
              <div className={styles.tourImage}>
                <Image
                  src={tour.image}
                  alt={`${tour.name} — ${tour.subtitle}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={styles.tourImg}
                />
                <div className={styles.tourOverlay}>
                  <span className={styles.tourCategory}>{tour.category}</span>
                  <span className={styles.tourDifficulty}>Dif. {tour.difficulty}</span>
                </div>
              </div>
              <div className={styles.tourContent}>
                <div>
                  <h3 className={styles.tourName}>{tour.name}</h3>
                  <p className={styles.tourSubtitle}>{tour.subtitle}</p>
                  <p className={styles.tourDesc}>{tour.description}</p>
                  <ul className={styles.tourHighlights}>
                    {tour.highlights.map((h) => (
                      <li key={h}><span>•</span><span>{h}</span></li>
                    ))}
                  </ul>
                </div>
                <div className={styles.tourFooter}>
                  <div className={styles.tourMeta}>
                    <div className={styles.tourPrice}>
                      <span className={styles.tourPriceAmount}>{tour.price}</span>
                      <span className={styles.tourPriceUnit}>{tour.priceUnit}</span>
                    </div>
                    <span className={styles.tourDuration}><Clock size={13} strokeWidth={1.5} /> {tour.duration}</span>
                  </div>
                  <a
                    href={whatsappTour(tour.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.tourBtn}
                  >
                    Reservar Tour →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Qué incluye */}
      <section className={styles.includesSection}>
        <div className={styles.includesHeader}>
          <p className={styles.eyebrow}>Siempre Incluido</p>
          <h2 className={styles.includesTitle}>Lo que viene <em>con cada tour</em></h2>
        </div>
        <div className={styles.includesGrid}>
          {(
            [
              { icon: <Bus size={22} strokeWidth={1.5} />, title: 'Transporte', desc: 'Vehículo privado desde y hacia el hotel.' },
              { icon: <Coffee size={22} strokeWidth={1.5} />, title: 'Desayuno', desc: 'Desayuno huasteco antes de la salida.' },
              { icon: <GraduationCap size={22} strokeWidth={1.5} />, title: 'Guía Certificado', desc: 'Guía local con certificación y seguro.' },
              { icon: <ShieldCheck size={22} strokeWidth={1.5} />, title: 'Seguro de viaje', desc: 'Cobertura durante toda la excursión.' },
              { icon: <Leaf size={22} strokeWidth={1.5} />, title: 'Entradas', desc: 'Entradas a reservas y sitios naturales.' },
              { icon: <Camera size={22} strokeWidth={1.5} />, title: 'Fotografía', desc: 'Paradas en los mejores puntos de foto.' },
            ] as { icon: ReactNode; title: string; desc: string }[]
          ).map((item) => (
            <div key={item.title} className={styles.includeItem}>
              <span className={styles.includeIcon}>{item.icon}</span>
              <div>
                <p className={styles.includeTitle}>{item.title}</p>
                <p className={styles.includeDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Atracciones adicionales */}
      <section className={styles.attractionsSection}>
        <div className={styles.attractionsHeader}>
          <p className={styles.eyebrow}>También Cerca</p>
          <h2 className={styles.attractionsTitle}>
            Más <em>maravillas</em> de la Huasteca
          </h2>
        </div>
        <div className={styles.attractionsGrid}>
          {attractions.map((attr) => (
            <div key={attr.name} className={styles.attractionCard}>
              <div className={styles.attractionImage}>
                <Image
                  src={attr.image}
                  alt={attr.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className={styles.attractionImg}
                />
              </div>
              <div className={styles.attractionContent}>
                <h3>{attr.name}</h3>
                <p>{attr.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <p className={styles.eyebrow}>¿Listo para Explorar?</p>
        <h2 className={styles.ctaTitle}>
          La Huasteca <em>te espera</em>
        </h2>
        <p className={styles.ctaDesc}>
          Escríbenos por WhatsApp para armar tu itinerario personalizado
          o reserva tu suite y coordinamos el tour desde el hotel.
        </p>
        <div className={styles.ctaButtons}>
          <a
            href={`${WHATSAPP_URL}?text=Hola,%20me%20interesa%20un%20tour%20por%20la%20Huasteca`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaBtn}
          >
            <MessageCircle size={16} strokeWidth={1.5} /> Consultar por WhatsApp
          </a>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaBtnOutline}
          >
            Reservar Suite
          </a>
        </div>
      </section>
    </main>
  );
}
