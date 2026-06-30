import Image from 'next/image';
import styles from './Hero.module.css';
import HeroDatePicker from './HeroDatePicker';
import VideoBackground from './VideoBackground';

export default function Hero() {
  return (
    <section className={styles.hero} aria-label="Sección principal">
      {/* Vídeo de fondo — carga diferida para no bloquear LCP */}
      <VideoBackground />

      {/* Imagen de fondo fallback (siempre presente; cubierta por video en desktop) */}
      <div className={styles.heroBackground}>
        <Image
          src="/images/JUNGLA/PORTADA.JPG"
          alt="Suite Jungla — Paraíso Encantado, Xilitla"
          fill
          priority
          quality={75}
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
          Hotel Boutique en Xilitla<br />
          <em>a pasos del Jardín de Edward James</em>
        </h1>

        <p className={styles.heroSubtitle}>
          13 suites boutique, 4 con spa privado, a 5 minutos caminando de Las Pozas.<br />
          Desde $1,500 MXN la noche.
        </p>

        {/* Date picker */}
        <HeroDatePicker />

        <div className={styles.ctaRow}>
          <a
            href="/reservar"
            className={styles.heroCta}
            aria-label="Encontrar suite perfecta en el motor de reservas"
          >
            Encuentra tu Suite Perfecta
          </a>

          <a
            href="tel:+524891007679"
            className={styles.heroPhone}
            aria-label="Llamar al hotel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            489 100 7679
          </a>
        </div>

        <p className={styles.ctaNote}>
          Reserva directa &nbsp;·&nbsp; Confirmación inmediata &nbsp;·&nbsp; Reembolso 100% hasta 7 días antes
        </p>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
