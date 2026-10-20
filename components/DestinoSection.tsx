import Image from 'next/image';
import Link from 'next/link';
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
    // La cabecera de Xilitla está a 675 msnm (no 800 ni 1,100): hoja única, 2 oct 2026.
    value: '675 msnm',
    label: 'clima de sierra, húmedo y verde todo el año',
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
            existe un rincón que el poeta y mecenas británico Edward James transformó en su obra
            maestra. Las Pozas —su jardín surrealista— fueron declaradas Monumento Artístico en 2012.
            A pasos de ellas, rodeado de pozas naturales turquesas, cascadas y fauna exótica,
            está Paraíso Encantado.
          </p>
          <p className={styles.body}>
            La cultura huasteca vive aquí: en el zacahuil del desayuno, en el tucán
            que sobrevuela el jardín y en el silencio de una selva que aún no ha sido
            domesticada.
          </p>

          <div className={styles.destinoLinks}>
            <Link href="/xilitla" className={styles.destinoLink}>
              Guía completa de Xilitla →
            </Link>
            <Link href="/blog/las-pozas-edward-james-guia" className={styles.destinoLink}>
              Las Pozas de Edward James: precio y horario →
            </Link>
          </div>

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
            {/* Foto real de Las Pozas (CC0, Wikimedia Commons; oct 2026). La de antes,
                jardin-edward-james-aerial.png, estaba hecha con IA y traía la estrella de
                Gemini. Es panorámica: en este marco casi cuadrado el recorte se corre un
                poco a la izquierda para que entren las columnas y el arco. */}
            <Image
              src="/images/las-pozas/columnas-las-pozas-edward-james-xilitla.jpg"
              alt="Columnas de concreto de Las Pozas, el jardín surrealista de Edward James, entre la selva de Xilitla"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={styles.image}
              style={{ objectPosition: '40% 50%' }}
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
