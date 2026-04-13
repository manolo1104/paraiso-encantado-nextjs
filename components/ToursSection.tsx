import Image from 'next/image';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import styles from './ToursSection.module.css';

const TOURS_URL = 'https://www.huasteca-potosina.com/';
const TOURS_BOOK_URL = 'https://www.huasteca-potosina.com/tours';

const tours = [
  {
    id: 'tamul',
    name: 'Expedición Tamul',
    subtitle: 'Cascada Tamul · Sótano · Cenote',
    description:
      'La cascada más impresionante de San Luis Potosí. Navega en canoa hasta el salto de 105 metros de caída libre. Incluye sótano de las Huahuastecas y Cenote Cueva del Agua.',
    duration: '10–12 hrs',
    from: 'Desde $1,450 MXN/persona',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    href: TOURS_BOOK_URL,
  },
  {
    id: 'xilitla',
    name: 'Ruta Surrealista',
    subtitle: 'Jardín de Edward James · Las Pozas',
    description:
      'Arte surrealista, agua turquesa y selva húmeda en un solo recorrido. Las Pozas de Edward James, el manantial de Huichihuayán y la magia de la sierra potosina.',
    duration: '8–10 hrs',
    from: 'Desde $1,300 MXN/persona',
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    href: TOURS_BOOK_URL,
  },
  {
    id: 'puente-de-dios',
    name: 'Ruta Acuática',
    subtitle: 'Puente de Dios · Siete Cascadas',
    description:
      'El recorrido más refrescante de la Huasteca. Aguas cristalinas del Puente de Dios, Hacienda Los Gómez y las Siete Cascadas escalonadas rodeadas de selva.',
    duration: '10–12 hrs',
    from: 'Desde $1,500 MXN/persona',
    image: '/images/atracciones/puente_de_dios.jpg',
    href: TOURS_BOOK_URL,
  },
];

export default function ToursSection() {
  return (
    <section className={styles.section} aria-labelledby="tours-heading">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Huasteca Potosina</p>
        <h2 id="tours-heading">
          Tours desde <em>el Hotel</em>
        </h2>
        <p className={styles.subtitle}>
          Guía certificado, transporte y desayuno incluidos. Salidas diarias desde Paraíso Encantado.
        </p>
      </div>

      <div className={styles.grid}>
        {tours.map((tour) => (
          <article key={tour.id} className={styles.card}>
            <div className={styles.imageWrap}>
              <Image
                src={tour.image}
                alt={tour.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className={styles.image}
              />
              <div className={styles.overlay} />
            </div>
            <div className={styles.content}>
              <p className={styles.cardEyebrow}>{tour.subtitle}</p>
              <h3 className={styles.name}>{tour.name}</h3>
              <p className={styles.desc}>{tour.description}</p>
              <div className={styles.meta}>
                <span className={styles.duration}>
                  <Clock size={13} strokeWidth={1.5} /> {tour.duration}
                </span>
                <span className={styles.price}>{tour.from}</span>
              </div>
              <a
                href={tour.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btn}
              >
                Ver tour <ArrowRight size={14} strokeWidth={2} />
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.cta}>
        <a
          href={TOURS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaBtn}
        >
          Ver todos los tours en Huasteca-Potosina.com
          <ArrowRight size={15} strokeWidth={2} />
        </a>
        <p className={styles.ctaNote}>
          <MapPin size={12} strokeWidth={1.5} /> Todas las salidas parten desde el hotel
        </p>
      </div>
    </section>
  );
}
