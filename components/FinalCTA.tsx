import styles from './FinalCTA.module.css';

const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';

export default function FinalCTA() {
  return (
    <section className={styles.section} aria-label="Reserva ahora">
      <div className={styles.content}>
        <h2>
          ¿Listo para Tu Escapada a la <em>Huasteca</em>?
        </h2>

        <p className={styles.subtitle}>
          Solo 13 suites disponibles. Reserva hoy y asegura tu lugar
          en el hotel más cercano al Jardín de Edward James.
        </p>

        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaBtn}
          aria-label="Reservar ahora — confirmación instantánea"
        >
          Reservar Ahora — Confirmación Instantánea
        </a>

        <ul className={styles.guarantees} role="list" aria-label="Garantías">
          <li>✓ Pago 100% seguro</li>
          <li>✓ Cancela hasta 48hrs antes</li>
          <li>✓ Mejor precio garantizado</li>
        </ul>

        <div className={styles.alternatives} aria-label="Otras formas de contacto">
          <a href="tel:+524891007679" className={styles.altLink}>
            📞 489-100-7679
          </a>
          <a
            href="https://wa.me/524891007679"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.altLink}
          >
            💬 WhatsApp
          </a>
          <a href="mailto:reservas@paraisoencantado.com" className={styles.altLink}>
            📧 reservas@paraisoencantado.com
          </a>
        </div>
      </div>
    </section>
  );
}
