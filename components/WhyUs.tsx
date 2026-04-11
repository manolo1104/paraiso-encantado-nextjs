import styles from './WhyUs.module.css';
import { MapPinIcon, AwardIcon, LeafIcon } from './icons';

const benefits = [
  {
    Icon: MapPinIcon,
    title: 'Ubicación Privilegiada',
    highlight: '5 minutos caminando a Las Pozas',
    description:
      'Mientras otros hoteles están a 15-30 min en auto, tú caminas 5 minutos después del desayuno. Llegas al Jardín de Edward James antes que los tours (9am vs 11am) y lo disfrutas casi solo.',
    proof: '"La ubicación es perfecta" — 94% de nuestras reseñas',
  },
  {
    Icon: AwardIcon,
    title: 'Validación VIP',
    highlight: '"Despertamos en el cielo"',
    description:
      'Palabras del Presidente de México durante su visita oficial a Xilitla en 2023. El único hotel boutique de la región que recibió a un mandatario en funciones.',
    proof: 'No es marketing — es historia.',
  },
  {
    Icon: LeafIcon,
    title: 'Autenticidad Huasteca',
    highlight: '13 suites únicas, no clonadas',
    description:
      'Cada suite tiene nombre, diseño y carácter propio. No es una cadena genérica. Nuestro restaurante El Papán Huasteco sirve tortillas hechas a mano en comal, no buffet turístico.',
    proof: 'Experiencia real. Sin escenografía.',
  },
];

export default function WhyUs() {
  return (
    <section className={styles.section} id="por-que-nosotros">
      <div className={styles.sectionHeader}>
        <h2>
          ¿Por Qué <em>Paraíso Encantado</em>?
        </h2>
        <p className={styles.subtitle}>
          No somos un hotel más en Xilitla. Somos la única experiencia que combina
          ubicación privilegiada, validación VIP y autenticidad huasteca.
        </p>
      </div>

      <div className={styles.grid}>
        {benefits.map(({ Icon, title, highlight, description, proof }) => (
          <article key={title} className={styles.card}>
            <div className={styles.icon} aria-hidden="true">
              <Icon size={32} />
            </div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.highlight}>{highlight}</p>
            <p className={styles.description}>{description}</p>
            <p className={styles.proof}>{proof}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
