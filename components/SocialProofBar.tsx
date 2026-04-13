import { Star, MapPin, Award, ShieldCheck } from 'lucide-react';
import styles from './SocialProofBar.module.css';

export default function SocialProofBar() {
  return (
    <section className={styles.bar} aria-label="Indicadores de calidad">
      <div className={styles.container}>

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <Star size={24} strokeWidth={0} fill="currentColor" />
          </div>
          <div className={styles.content}>
            <strong>4.6 / 5</strong>
            <p>519 reseñas verificadas en Google</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <MapPin size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>#1 en Ubicación</strong>
            <p>El más cercano al Jardín de Edward James</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <Award size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>Mejor Precio Garantizado</strong>
            <p>Reserve directo y ahorre vs. Booking o Airbnb</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <ShieldCheck size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>Pago Seguro</strong>
            <p>Plataforma Stripe — encriptación total</p>
          </div>
        </div>

      </div>
    </section>
  );
}
