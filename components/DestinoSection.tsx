import Image from 'next/image';
import styles from './DestinoSection.module.css';
import { MapPinIcon, MountainIcon, CompassIcon } from './icons';

const stats = [
  {
    Icon: MapPinIcon,
    value: '400 metros',
    label: 'caminando a Las Pozas de Edward James',
  },
  {
    Icon: MountainIcon,
    value: '800 msnm',
    label: 'microclima fresco y perfecto todo el año',
  },
  {
    Icon: CompassIcon,
    value: 'Huasteca Potosina',
    label: 'patrimonio natural y cultural de México',
  },
];

export default function DestinoSection() {
  return (
    <section className={styles.section} aria-labelledby="destino-heading">
      <div className={styles.inner}>
        {/* Texto */}
        <div className={styles.textCol}>
          <p className={styles.eyebrow}>El Destino</p>
          <h2 id="destino-heading" className={styles.title}>
            Xilitla · La Joya<br />
            <em>Surrealista de la Huasteca</em>
          </h2>
          <p className={styles.body}>
            En la Sierra Madre Oriental, donde la selva tropical se encuentra con el arte,
            existe un rincón que el escultor inglés Edward James transformó en su obra
            maestra. Las Pozas —su jardín surrealista— son hoy Patrimonio Cultural de México.
            A pasos de ellas, rodeado de pozas naturales turquesas, cascadas y fauna exótica,
            está Paraíso Encantado.
          </p>
          <p className={styles.body}>
            La cultura huasteca vive aquí: en el zacahuil del desayuno, en el tucán
            que sobrevuela el jardín y en el silencio de una selva que aún no ha sido
            domesticada.
          </p>

          <div className={styles.stats}>
            {stats.map(({ Icon, value, label }) => (
              <div key={value} className={styles.stat}>
                <Icon size={20} className={styles.statIcon} />
                <div>
                  <p className={styles.statValue}>{value}</p>
                  <p className={styles.statLabel}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Imagen */}
        <div className={styles.imageCol}>
          <div className={styles.imageFrame}>
            <Image
              src="/images/atracciones/jardin_de_edward_james.jpg"
              alt="Jardín Surrealista de Edward James — Las Pozas, Xilitla"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={styles.image}
            />
            <div className={styles.imageBadge}>
              <span>Las Pozas</span>
              <span>Jardín de Edward James</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
