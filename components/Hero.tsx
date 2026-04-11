import Image from 'next/image';
import styles from './Hero.module.css';
import HeroDatePicker from './HeroDatePicker';
import { StarIcon, ShieldCheckIcon, CheckCircleIcon } from './icons';

const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';

export default function Hero() {
  return (
    <section className={styles.hero} aria-label="Sección principal">
      {/* Vídeo de fondo (Vimeo) — se oculta en mobile */}
      <div className={styles.videoBackground} aria-hidden="true">
        <iframe
          src="https://player.vimeo.com/video/998914372?background=1&autoplay=1&loop=1&muted=1&byline=0&title=0&dnt=1"
          className={styles.videoIframe}
          allow="autoplay; fullscreen"
          title="Video de fondo — Hotel Paraíso Encantado"
        />
      </div>

      {/* Imagen de fondo fallback (siempre presente; cubierta por video en desktop) */}
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
      </div>

      {/* Overlay oscuro */}
      <div className={styles.heroOverlay} aria-hidden="true" />

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

        {/* Date picker */}
        <HeroDatePicker />

        {/* Trust bar con SVG */}
        <div className={styles.heroTrust} role="list" aria-label="Indicadores de confianza">
          <span role="listitem" className={styles.trustItem}>
            <StarIcon size={14} className={styles.trustIcon} />
            4.8/5 · 514 reseñas
          </span>
          <span className={styles.separator} aria-hidden="true">·</span>
          <span role="listitem" className={styles.trustItem}>
            <ShieldCheckIcon size={14} className={styles.trustIcon} />
            Pago 100% seguro
          </span>
          <span className={styles.separator} aria-hidden="true">·</span>
          <span role="listitem" className={styles.trustItem}>
            <CheckCircleIcon size={14} className={styles.trustIcon} />
            Cancelación gratis 48hrs
          </span>
        </div>

        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.heroCta}
          aria-label="Encontrar suite perfecta en el motor de reservas"
        >
          Encuentra tu Suite Perfecta
        </a>

        <p className={styles.ctaNote}>
          Confirmación instantánea &nbsp;·&nbsp; Sin comisiones de OTAs
        </p>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
