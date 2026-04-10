import Image from 'next/image';
import styles from './Hero.module.css';

const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';

export default function Hero() {
  return (
    <section className={styles.hero} aria-label="Sección principal">
      {/* Imagen de fondo */}
      <div className={styles.heroBackground}>
        <Image
          src="/images/JUNGLA/PORTADA.JPG"
          alt="Suite Jungla — Paraíso Encantado, Xilitla"
          fill
          priority
          quality={90}
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        <div className={styles.heroOverlay} aria-hidden="true" />
      </div>

      {/* Contenido */}
      <div className={styles.heroContent}>
        <p className={styles.heroEyebrow}>
          Xilitla, San Luis Potosí &nbsp;·&nbsp; Huasteca Potosina
        </p>

        <h1 className={styles.heroTitle}>
          El Hotel Más Cercano al<br />
          <em>Jardín Surrealista de Edward James</em>
        </h1>

        <p className={styles.heroSubtitle}>
          13 suites boutique con spa privado a 5 minutos caminando de Las Pozas.<br />
          Desde $1,500/noche con el mejor precio garantizado.
        </p>

        <div className={styles.heroTrust} role="list" aria-label="Indicadores de confianza">
          <span role="listitem">⭐ 4.8/5 · 514 reseñas</span>
          <span className={styles.separator} aria-hidden="true">·</span>
          <span role="listitem">🔒 Pago 100% seguro</span>
          <span className={styles.separator} aria-hidden="true">·</span>
          <span role="listitem">✓ Cancelación gratis 48hrs</span>
        </div>

        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.heroCta}
          aria-label="Ver disponibilidad y precios en el motor de reservas"
        >
          Ver Disponibilidad y Precios
        </a>

        <p className={styles.ctaNote}>
          Confirmación instantánea &nbsp;·&nbsp; Sin comisiones de OTAs
        </p>

        <blockquote className={styles.heroQuote}>
          <p>&#8220;Despertamos en el cielo&#8221;</p>
          <cite>— Presidente de México, Visita Oficial a Xilitla 2023</cite>
        </blockquote>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
