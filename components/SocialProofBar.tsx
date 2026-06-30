import { Star, MapPin, Waves, ShieldCheck } from 'lucide-react';
import styles from './SocialProofBar.module.css';

const RATING = 4.5;
const REVIEWS = 523;

export default function SocialProofBar() {
  return (
    <section className={styles.bar} aria-label="Indicadores de calidad">
      <div className={styles.container}>

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <Star size={24} strokeWidth={0} fill="currentColor" />
          </div>
          <div className={styles.content}>
            <strong>{RATING.toFixed(1)} / 5</strong>
            <p>{REVIEWS} reseñas verificadas en Google</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <MapPin size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>A 5 min de Las Pozas</strong>
            <p>El hotel más cercano al Jardín de Edward James</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <Waves size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>13 suites, 4 con spa privado</strong>
            <p>Cada una con su propio carácter</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <ShieldCheck size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>Pago seguro</strong>
            <p>Procesado por Stripe</p>
          </div>
        </div>

      </div>
    </section>
  );
}
