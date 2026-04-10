import { featuredSuites } from '@/data/suites';
import SuiteCard from './SuiteCard';
import styles from './SuitesGrid.module.css';

const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';

export default function SuitesGrid() {
  return (
    <section className={styles.section} id="habitaciones" aria-label="Nuestras suites">
      <div className={styles.sectionHeader}>
        <h2>
          Nuestras <em>Suites</em>
        </h2>
        <p className={styles.subtitle}>
          13 espacios únicos. Cada uno con carácter propio, diseñado para
          privacidad absoluta y lujo en la naturaleza de la Huasteca Potosina.
        </p>
      </div>

      <div className={styles.grid}>
        {featuredSuites.map((suite, index) => (
          <SuiteCard
            key={suite.id}
            suite={suite}
            showBadge={index === 0}
          />
        ))}
      </div>

      <div className={styles.cta}>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaBtn}
        >
          Ver Disponibilidad de las 13 Suites →
        </a>
        <p className={styles.ctaNote}>
          Confirmación instantánea · Mejor precio garantizado
        </p>
      </div>
    </section>
  );
}
