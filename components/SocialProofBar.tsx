import { Star, MapPin, Waves, ShieldCheck } from 'lucide-react';
import { HOTEL } from '@/lib/seo-hotel';
import styles from './SocialProofBar.module.css';

// Las cifras salen de lib/seo-hotel.ts (17 oct 2026): aquí decía 523 escrito a mano y
// «verificadas», y Google no comprueba que quien reseña se haya hospedado.
const RATING = HOTEL.rating;
const REVIEWS = HOTEL.reviewCount;

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
            <p>{REVIEWS} reseñas en Google</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <MapPin size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>A {HOTEL.minutosCaminandoALasPozas} min de Las Pozas</strong>
            <p>{HOTEL.metrosALasPozas} metros, sobre el camino al Jardín de Edward James</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <Waves size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>{HOTEL.suites} suites, {HOTEL.suitesConSpaPrivado} con spa privado</strong>
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
