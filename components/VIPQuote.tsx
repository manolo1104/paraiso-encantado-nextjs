import Image from 'next/image';
import styles from './VIPQuote.module.css';

export default function VIPQuote() {
  return (
    <section className={styles.section} aria-labelledby="vip-quote-heading">
      <div className={styles.inner}>
        {/* Imagen + Badge */}
        <div className={styles.imageWrap}>
          <Image
            src="/images/amlo-xilitla.webp"
            alt="Visita oficial a Xilitla — Paraíso Encantado 2023"
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className={styles.image}
          />
          <div className={styles.imageOverlay} aria-hidden="true" />
          <div className={styles.badge} aria-label="Validación VIP">
            <span className={styles.badgeStar}>★</span>
            <span>Validación VIP</span>
          </div>
        </div>

        {/* Quote */}
        <div className={styles.quoteWrap}>
          <div className={styles.openQuote} aria-hidden="true">"</div>
          <blockquote className={styles.quote}>
            <p id="vip-quote-heading" className={styles.quoteText}>
              Despertamos en el cielo
            </p>
            <footer>
              <cite className={styles.cite}>
                Presidente de México
              </cite>
              <p className={styles.citeContext}>Visita Oficial a Xilitla · 2023</p>
            </footer>
          </blockquote>
          <p className={styles.context}>
            El único hotel boutique de la región que recibió a un mandatario en funciones.
            No es marketing — es historia.
          </p>
        </div>
      </div>
    </section>
  );
}
