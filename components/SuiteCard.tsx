import Image from 'next/image';
import Link from 'next/link';
import type { Suite } from '@/data/suites';
import { mxnToUsd } from '@/lib/config';
import styles from './SuiteCard.module.css';

export type SuiteCardVariant = 'default' | 'elegant' | 'minimal';

interface SuiteCardProps {
  suite: Suite;
  showBadge?: boolean;
  variant?: SuiteCardVariant;
}

const variantStyles: Record<SuiteCardVariant, string> = {
  default: styles.card,
  elegant: styles.cardElegant,
  minimal: styles.cardMinimal,
};

export default function SuiteCard({ suite, showBadge = false, variant = 'default' }: SuiteCardProps) {
  const usd = mxnToUsd(suite.price);
  const cardClass = variantStyles[variant];

  return (
    <Link href={`/habitaciones/${suite.id}`} className={cardClass} aria-label={`Ver ${suite.name}`}>
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
            <span className={styles.priceUsd}>~${usd} USD</span>
          </div>

          <span className={styles.viewBtn}>
            Ver Suite →
          </span>
        </div>
      </div>
    </Link>
  );
}
