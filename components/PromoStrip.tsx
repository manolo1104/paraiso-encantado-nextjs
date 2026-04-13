import { CheckCircle } from 'lucide-react';
import styles from './PromoStrip.module.css';

export default function PromoStrip() {
  return (
    <div className={styles.strip} role="banner" aria-label="Promoción vigente">
      <div className={styles.inner}>
        <span className={styles.badge}>Oferta Especial</span>
        <p className={styles.text}>
          <strong>3ª Noche Gratis</strong>
          <span className={styles.sep}>·</span>
          Reserva 2 noches y la tercera es completamente gratis
        </p>
        <div className={styles.checks}>
          <span><CheckCircle size={13} strokeWidth={2} /> Aplica todas las suites</span>
          <span><CheckCircle size={13} strokeWidth={2} /> Reserva directa</span>
        </div>
      </div>
    </div>
  );
}
