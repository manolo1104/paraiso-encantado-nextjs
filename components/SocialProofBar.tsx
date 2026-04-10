import styles from './SocialProofBar.module.css';

export default function SocialProofBar() {
  return (
    <section className={styles.bar} aria-label="Indicadores de calidad">
      <div className={styles.container}>

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">⭐</div>
          <div className={styles.content}>
            <strong>4.8 / 5</strong>
            <p>514 reseñas verificadas en Google</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">📍</div>
          <div className={styles.content}>
            <strong>#1 en Ubicación</strong>
            <p>El más cercano al Jardín de Edward James</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">🏆</div>
          <div className={styles.content}>
            <strong>Validación VIP</strong>
            <p>Visita oficial del Presidente de México 2023</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">🔒</div>
          <div className={styles.content}>
            <strong>Pago Seguro</strong>
            <p>Plataforma Stripe — encriptación total</p>
          </div>
        </div>

      </div>
    </section>
  );
}
