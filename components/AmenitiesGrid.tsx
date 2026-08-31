import styles from './AmenitiesGrid.module.css';
import { DropletsIcon, UtensilsIcon, CompassIcon, SunriseIcon, WifiIcon, CarIcon } from './icons';

const amenities = [
  {
    Icon: DropletsIcon,
    title: 'Spa privado climatizado',
    desc: 'Agua caliente en tu propia terraza, en las suites que lo incluyen.',
  },
  {
    Icon: UtensilsIcon,
    title: 'Restaurante El Papán',
    desc: 'Cocina huasteca hecha a mano, dentro del hotel.',
  },
  {
    Icon: CompassIcon,
    title: 'Tours a Las Pozas',
    desc: 'Salidas diarias al Jardín de Edward James y la Huasteca.',
  },
  {
    Icon: SunriseIcon,
    title: 'Terraza panorámica',
    desc: 'Desayuna frente a la sierra de la Huasteca.',
  },
  {
    Icon: WifiIcon,
    title: 'WiFi gratuito',
    desc: 'Conexión estable en toda la propiedad.',
  },
  {
    Icon: CarIcon,
    title: 'Estacionamiento gratuito',
    desc: 'Privado y seguro, incluido sin costo.',
  },
];

export default function AmenitiesGrid() {
  return (
    <section className={styles.section} aria-labelledby="amenities-heading">
      <div className={styles.header}>
        <p className={styles.eyebrow}>La estancia</p>
        <h2 id="amenities-heading" className={styles.title}>
          Servicios del <em>hotel</em>
        </h2>
        <p className={styles.subtitle}>
          Lo más importante para tu estancia, cuidado con calma.
        </p>
      </div>
      <div className={styles.grid}>
        {amenities.map(({ Icon, title, desc }) => (
          <div key={title} className={styles.cell}>
            <span className={styles.iconBadge} aria-hidden="true">
              <Icon size={28} className={styles.cellIcon} />
            </span>
            <p className={styles.cellTitle}>{title}</p>
            <p className={styles.cellDesc}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
