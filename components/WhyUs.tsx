import Link from 'next/link';
import styles from './WhyUs.module.css';

/**
 * Las páginas de /hoteles-en-xilitla, /hotel-cerca-de-las-pozas y compañía solo
 * recibían enlaces desde el pie de página, y por eso llevaban semanas sin aparecer
 * en Google: un enlace de pie de página vale poco porque se repite en las 34 páginas
 * del sitio y no dice nada del contenido. Estos cuatro van en el cuerpo de la portada
 * —la página con más autoridad— y justo después de "¿por qué este hotel?", que es
 * donde la pregunta natural del visitante pasa a ser "¿es para mí?".
 */
const guias = [
  {
    href: '/hoteles-en-xilitla',
    texto: 'Los hoteles de Xilitla, comparados uno por uno',
    nota: 'Zona, precio por noche y distancia a Las Pozas de diez opciones del pueblo.',
  },
  {
    href: '/hotel-cerca-de-las-pozas',
    texto: 'Qué hotel queda más cerca de Las Pozas de Edward James',
    nota: 'Los 400 metros que nos separan del jardín y a qué hora conviene entrar.',
  },
  {
    href: '/hotel-familias-xilitla',
    texto: 'Ir a Xilitla con la familia: suites grandes y piscina',
    nota: 'Las suites Helechos, los tours que sí funcionan con niños y el restaurante.',
  },
  {
    href: '/hotel-luna-de-miel-xilitla',
    texto: 'Luna de miel y aniversarios en la Huasteca Potosina',
    nota: 'Las suites con spa privado en la terraza y los detalles que preparamos.',
  },
];

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

      <aside className={styles.guias} aria-labelledby="whyus-guias-titulo">
        <h3 id="whyus-guias-titulo" className={styles.guiasTitulo}>
          Antes de reservar, quizá te sirva leer
        </h3>
        <ul className={styles.guiasLista}>
          {guias.map(({ href, texto, nota }) => (
            <li key={href} className={styles.guiaItem}>
              <Link href={href} className={styles.guiaEnlace}>
                {texto}
              </Link>
              <p className={styles.guiaNota}>{nota}</p>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
