import { Star } from 'lucide-react';
import styles from './VIPQuote.module.css';

export default function VIPQuote() {
  return (
    <section className={styles.section} aria-labelledby="vip-quote-heading">
      <div className={styles.inner}>
        {/* Video de YouTube en lugar de foto */}
        <div className={styles.imageWrap}>
          <div className={styles.videoContainer}>
            <iframe
              src="https://www.youtube.com/embed/Y8h8CuTNLcA?start=1&rel=0&modestbranding=1"
              title="Paraíso Encantado — Visita presidencial a Xilitla 2023"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.videoIframe}
              loading="lazy"
            />
          </div>
          <div className={styles.badge} aria-label="Validación VIP">
            <Star size={12} strokeWidth={0} fill="currentColor" className={styles.badgeStar} />
            <span>Validación VIP</span>
          </div>
        </div>

        {/* Quote */}
        <div className={styles.quoteWrap}>
          <div className={styles.openQuote} aria-hidden="true">"</div>
          <blockquote className={styles.quote}>
            <p id="vip-quote-heading" className={styles.quoteText}>
              Amanecimos en el Cielo
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
