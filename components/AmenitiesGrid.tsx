import Image from 'next/image';
import styles from './AmenitiesGrid.module.css';
import { DropletsIcon, SunriseIcon, UtensilsIcon, CompassIcon, WifiIcon, CarIcon } from './icons';

const amenities = [
  {
    Icon: DropletsIcon,
    title: 'Piscina Spa Privada',
    image: '/images/JUNGLA/PORTADA.JPG',
  },
  {
    Icon: SunriseIcon,
    title: 'Terraza Panorámica',
    image: '/images/LINDAVISTA/Copia de DSC09539-HDR.jpg',
  },
  {
    Icon: UtensilsIcon,
    title: 'Restaurante El Papán',
    image: '/images/RESTAURANTE/DSC09679.jpg',
  },
  {
    Icon: CompassIcon,
    title: 'Tours a Las Pozas',
    image: '/images/atracciones/jardin_de_edward_james.jpg',
  },
  {
    Icon: WifiIcon,
    title: 'WiFi de Alta Velocidad',
    image: '/images/ORQUIDEAS DOBLE/PORTADA.jpg',
  },
  {
    Icon: CarIcon,
    title: 'Estacionamiento Gratuito',
    image: '/images/LAJAS/PORTADA.jpg',
  },
];

export default function AmenitiesGrid() {
  return (
    <section className={styles.section} aria-labelledby="amenities-heading">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Todo Incluido</p>
        <h2 id="amenities-heading" className={styles.title}>
          La <em>Experiencia</em> Completa
        </h2>
        <p className={styles.subtitle}>
          Cada aspecto de tu estadía está cuidado al detalle.
        </p>
      </div>
      <div className={styles.grid}>
        {amenities.map(({ Icon, title, image }) => (
          <div key={title} className={styles.cell}>
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={styles.cellImage}
            />
            <div className={styles.cellOverlay} aria-hidden="true" />
            <div className={styles.cellContent}>
              <Icon size={28} className={styles.cellIcon} />
              <p className={styles.cellTitle}>{title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
