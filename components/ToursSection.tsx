import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Users, ArrowRight, MapPin } from 'lucide-react';
import styles from './ToursSection.module.css';

const PACKAGES_URL = '/paquetes';

const packages = [
  {
    id: 'esencial',
    name: 'Paquete Esencial',
    subtitle: 'Ruta Surrealista · Edward James',
    description:
      '1 noche en el hotel + desayuno + tour Ruta Surrealista (Las Pozas de Edward James) con guía certificado NOM-09, transporte y entradas.',
    nights: '2 días · 1 noche',
    guests: '2 personas',
    price: 'Desde $5,000 MXN',
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    badge: 'Primera visita',
    featured: false,
  },
  {
    id: 'aventura',
    name: 'Paquete Aventura',
    subtitle: 'Tamul + Cascadas del Meco',
    description:
      '2 noches + desayunos + tour Expedición Tamul y tour Cascadas del Meco con guías certificados, transporte y entradas a todas las atracciones.',
    nights: '3 días · 2 noches',
    guests: '2 personas',
    price: 'Desde $9,000 MXN',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    badge: 'Más popular',
    featured: true,
  },
  {
    id: 'completo',
    name: 'Paquete Completo Huasteca',
    subtitle: '3 tours a elegir + fotos y video',
    description:
      '3 noches + desayunos + 3 tours completos a elegir, transporte, entradas y fotografías y video profesional de cada recorrido.',
    nights: '4 días · 3 noches',
    guests: '2 personas',
    price: 'Desde $12,200 MXN',
    image: '/images/HELECHOS 1/PORTADA.jpg',
    badge: 'Experiencia total',
    featured: false,
  },
];

export default function ToursSection() {
  return (
    <section className={styles.section} aria-labelledby="tours-heading">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Xilitla · Huasteca Potosina</p>
        <h2 id="tours-heading">
          Paquetes <em>Todo Incluido</em>
        </h2>
        <p className={styles.subtitle}>
          Hotel + desayunos + tours guiados en un solo precio. Reserva directo y ahorra hasta 15% vs. plataformas externas.
        </p>
      </div>

      <div className={styles.grid}>
        {packages.map((pkg) => (
          <article
            key={pkg.id}
            className={`${styles.card} ${pkg.featured ? styles.cardFeatured : ''}`}
          >
            <div className={styles.imageWrap}>
              <Image
                src={pkg.image}
                alt={`${pkg.name} — Paquete todo incluido en Xilitla, Huasteca Potosina`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className={styles.image}
              />
              <div className={styles.overlay} />
              <span className={styles.badge}>{pkg.badge}</span>
            </div>
            <div className={styles.content}>
              <p className={styles.cardEyebrow}>{pkg.subtitle}</p>
              <h3 className={styles.name}>{pkg.name}</h3>
              <p className={styles.desc}>{pkg.description}</p>
              <div className={styles.meta}>
                <span className={styles.duration}>
                  <Calendar size={13} strokeWidth={1.5} /> {pkg.nights}
                </span>
                <span className={styles.duration}>
                  <Users size={13} strokeWidth={1.5} /> {pkg.guests}
                </span>
              </div>
              <div className={styles.priceRow}>
                <span className={styles.price}>{pkg.price}</span>
                <span className={styles.priceUnit}>por pareja</span>
              </div>
              <Link href={PACKAGES_URL} className={styles.btn}>
                Ver paquete <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.cta}>
        <Link href={PACKAGES_URL} className={styles.ctaBtn}>
          Ver todos los paquetes
          <ArrowRight size={15} strokeWidth={2} />
        </Link>
        <p className={styles.ctaNote}>
          <MapPin size={12} strokeWidth={1.5} /> Hotel + tours + desayunos · un solo precio, sin sorpresas
        </p>
      </div>
    </section>
  );
}
