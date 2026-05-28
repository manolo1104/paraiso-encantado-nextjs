import { CheckCircle, Tag } from 'lucide-react';
import styles from './PromoStrip.module.css';

function InnerContent() {
  return (
    <div className={styles.inner}>
      <span className={styles.badge}>Oferta Especial</span>
      <p className={styles.text}>
        <strong>3ª Noche Gratis</strong>
        <span className={styles.sep}>·</span>
        Reserva 2 noches y la tercera es completamente gratis
        <span className={styles.savings}> — ahorra hasta $2,400 MXN</span>
      </p>
      <div className={styles.checks}>
        <span><CheckCircle size={13} strokeWidth={2} /> Aplica todas las suites</span>
        <span><CheckCircle size={13} strokeWidth={2} /> Reserva directa</span>
        <span className={styles.codeChip}><Tag size={12} strokeWidth={2} /> XILITLA3MX</span>
      </div>
    </div>
  );
}

export default function PromoStrip() {
  return (
    <aside className={styles.strip} aria-label="Oferta especial vigente">
      <div className={styles.marqueTrack}>
        <InnerContent />
        <InnerContent />
      </div>
    </aside>
  );
}
