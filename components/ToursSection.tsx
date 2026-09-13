import Image from 'next/image';
import { Calendar, ArrowRight, MessageCircle } from 'lucide-react';
import styles from './ToursSection.module.css';

// Los paquetes (hotel + tours) los arma y los vende Tours Huasteca Potosina en su
// sitio; aquí solo se enseñan. Decisión del dueño (sep 2026): SIN precios, sin
// "Ahorras" y sin "desde $" — el precio vigente vive en huasteca-potosina.com.
const PACKAGES_URL = 'https://www.huasteca-potosina.com/paquetes';
const TOURS_WHATSAPP_URL = 'https://wa.me/524891251458';

// Nombre, subtítulo, duración, badge y slug copiados de la fuente canónica
// (repo INTINERARIO HUASTECA, rama main: src/lib/paquetes.ts). Si cambian allá,
// cámbialos aquí. Las imágenes son las del propio sitio del hotel.
const packages = [
  {
    slug: 'luna-de-miel',
    name: 'Luna de Miel',
    description: 'La Huasteca de a dos, sin prisa',
    duration: '3 días · 2 noches',
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    badge: 'Lunamieleros',
    featured: false,
  },
  {
    slug: 'familiar',
    name: 'Paquete Familiar',
    description: 'Tres días que los niños sí aguantan',
    duration: '4 días · 3 noches',
    image: '/images/atracciones/cascadas_de_micos.jpg',
    badge: 'Más popular',
    featured: true,
  },
  {
    slug: 'aventura-extrema',
    name: 'Aventura Extrema',
    description: 'Cuerda, rápidos y la caída más alta de México',
    duration: '4 días · 3 noches',
    image: '/images/atracciones/rappel_tamul.jpg',
    badge: 'Adrenalina',
    featured: false,
  },
  {
    slug: 'tu-huasteca',
    name: 'Tu Huasteca',
    description: 'Cuatro días de tour que eliges tú',
    duration: '5 días · 4 noches',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    badge: 'Tú lo armas',
    featured: false,
  },
  {
    slug: 'odisea-huasteca',
    name: 'Odisea Huasteca',
    description: 'Cinco días de tours sin repetir un solo lugar',
    duration: '6 días · 5 noches',
    image: '/images/atracciones/tamasopo.jpg',
    badge: 'Lo ves todo',
    featured: false,
  },
];

export default function ToursSection() {
  return (
    <section className={styles.section} aria-labelledby="tours-heading">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Xilitla · Huasteca Potosina</p>
        <h2 id="tours-heading">
          Paquetes <em>hotel + tours</em>
        </h2>
        <p className={styles.subtitle}>
          Hospédate en Paraíso Encantado y recorre la Huasteca con tours guiados. Nuestro equipo de
          tours te comparte el itinerario y la disponibilidad de cada paquete.
        </p>
      </div>

      <div className={styles.grid}>
        {packages.map((pkg) => (
          <article
            key={pkg.slug}
            className={`${styles.card} ${pkg.featured ? styles.cardFeatured : ''}`}
          >
            <div className={styles.imageWrap}>
              <Image
                src={pkg.image}
                alt={`${pkg.name} — Paquete de hotel y tours en Xilitla, Huasteca Potosina`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className={styles.image}
              />
              <div className={styles.overlay} />
              <span className={styles.badge}>{pkg.badge}</span>
            </div>
            <div className={styles.content}>
              <h3 className={styles.name}>{pkg.name}</h3>
              <p className={styles.desc}>{pkg.description}</p>
              <div className={styles.meta}>
                <span className={styles.duration}>
                  <Calendar size={13} strokeWidth={1.5} /> {pkg.duration}
                </span>
              </div>
              <a
                href={`${PACKAGES_URL}/${pkg.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btn}
              >
                Ver paquete <ArrowRight size={14} strokeWidth={2} />
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.cta}>
        <a href={PACKAGES_URL} target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
          Ver todos los paquetes
          <ArrowRight size={15} strokeWidth={2} />
        </a>
        <p className={styles.ctaNote}>
          <MessageCircle size={12} strokeWidth={1.5} /> Equipo de tours por WhatsApp:{' '}
          <a
            href={`${TOURS_WHATSAPP_URL}?text=Hola%2C%20me%20interesa%20un%20paquete%20de%20hotel%20y%20tours.`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            +52 489 125 1458
          </a>
        </p>
      </div>
    </section>
  );
}
