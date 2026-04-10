import Image from 'next/image';
import type { Suite } from '@/data/suites';
import styles from './SuiteCard.module.css';

const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';

interface SuiteCardProps {
  suite: Suite;
  showBadge?: boolean;
}

export default function SuiteCard({ suite, showBadge = false }: SuiteCardProps) {
  return (
    <article className={styles.card}>
      {showBadge && (
        <div className={styles.badge} aria-label="Suite más popular">
          Más Popular
        </div>
      )}

      {/* Imagen */}
      <div className={styles.imageWrapper}>
        <Image
          src={suite.images[0]}
          alt={`${suite.name} — Paraíso Encantado, Xilitla`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
          loading="lazy"
        />
        <div className={styles.categoryBadge}>{suite.category}</div>
      </div>

      {/* Contenido */}
      <div className={styles.content}>
        <h3 className={styles.name}>{suite.name}</h3>
        <p className={styles.description}>{suite.description}</p>

        <ul className={styles.amenities} aria-label="Amenidades principales">
          {suite.amenities.slice(0, 3).map((amenity) => (
            <li key={amenity} className={styles.amenityTag}>
              {amenity}
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <div className={styles.price}>
            <span className={styles.priceLabel}>Desde</span>
            <span className={styles.priceAmount}>
              ${suite.price.toLocaleString('es-MX')}
            </span>
            <span className={styles.priceUnit}>/noche</span>
          </div>

          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewBtn}
            aria-label={`Reservar ${suite.name}`}
          >
            Reservar →
          </a>
        </div>
      </div>
    </article>
  );
}
