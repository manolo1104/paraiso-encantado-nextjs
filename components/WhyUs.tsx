import styles from './WhyUs.module.css';

const benefits = [
  {
    title: 'A pasos de Las Pozas',
    highlight: '5 minutos caminando al Jardín de Edward James',
    description:
      'Sin traslados ni prisas. Desayunas en el hotel y caminas hasta la entrada de Las Pozas. Llegas temprano, cuando el jardín todavía está en calma.',
    proof: 'El hotel más cercano al Jardín de Edward James en Xilitla.',
  },
  {
    title: 'Reserva directa',
    highlight: 'Trato directo con el hotel',
    description:
      'Al reservar con nosotros tratas directo con el hotel y ves las 13 suites completas, sin intermediarios ni comisiones de plataformas como Booking o Airbnb.',
    proof: 'Hablas siempre con el hotel, nunca con una central.',
  },
  {
    title: 'Auténtico de la Huasteca',
    highlight: '13 suites, cada una con su carácter',
    description:
      'Cada suite tiene su propio nombre y diseño. Y en El Papán Huasteco se cocina al momento: tortillas hechas a mano en comal, zacahuil y café de olla.',
    proof: 'Una experiencia genuina de Xilitla.',
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
          Tres razones por las que nuestros huéspedes regresan: dónde estamos,
          cómo reservas y lo que se vive aquí.
        </p>
      </div>

      <div className={styles.list}>
        {benefits.map(({ title, highlight, description, proof }, index) => (
          <article key={title} className={styles.item}>
            <div className={styles.itemNumber} aria-hidden="true">
              0{index + 1}
            </div>
            <div className={styles.itemContent}>
              <h3 className={styles.itemTitle}>{title}</h3>
              <p className={styles.highlight}>{highlight}</p>
              <p className={styles.description}>{description}</p>
              <p className={styles.proof}>{proof}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
