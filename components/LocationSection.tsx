import styles from './LocationSection.module.css';
import { MapPinIcon } from './icons';

export default function LocationSection() {
  return (
    <section className={styles.section} id="como-llegar" aria-labelledby="location-heading">
      <div className={styles.inner}>
        {/* Info */}
        <div className={styles.infoCol}>
          <p className={styles.eyebrow}>Cómo Llegar</p>
          <h2 id="location-heading" className={styles.title}>
            Estamos en el <em>corazón de Xilitla</em>
          </h2>

          <div className={styles.addressBlock}>
            <MapPinIcon size={18} className={styles.pinIcon} />
            <div>
              <p className={styles.addressMain}>Hotel Paraíso Encantado</p>
              <p className={styles.addressSub}>Xilitla, San Luis Potosí · Huasteca Potosina, México</p>
              <p className={styles.addressNote}>A 400 metros caminando del Jardín de Edward James (Las Pozas)</p>
            </div>
          </div>

          <div className={styles.distances}>
            <h3 className={styles.distTitle}>Distancias desde:</h3>
            <ul className={styles.distList}>
              <li>
                <span className={styles.distCity}>Ciudad de México</span>
                <span className={styles.distTime}>~5.5 horas en auto · 450 km</span>
              </li>
              <li>
                <span className={styles.distCity}>Monterrey</span>
                <span className={styles.distTime}>~5 horas en auto · 380 km</span>
              </li>
              <li>
                <span className={styles.distCity}>San Luis Potosí</span>
                <span className={styles.distTime}>~3 horas en auto · 210 km</span>
              </li>
              <li>
                <span className={styles.distCity}>Tampico</span>
                <span className={styles.distTime}>~2.5 horas en auto · 170 km</span>
              </li>
            </ul>
          </div>

          <div className={styles.instructions}>
            <p><strong>Por carretera:</strong> Toma la carretera federal 120 dirección Xilitla desde Ciudad Valles o desde San Luis Potosí. El hotel está señalizado a la entrada del pueblo.</p>
          </div>

          <a
            href="https://maps.google.com/maps?q=Hotel+Paraiso+Encantado+Xilitla+San+Luis+Potosi&t=&z=15"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapsBtn}
          >
            Obtener Indicaciones →
          </a>
        </div>

        {/* Mapa */}
        <div className={styles.mapCol}>
          <iframe
            title="Ubicación Hotel Paraíso Encantado Xilitla"
            src="https://maps.google.com/maps?q=Hotel+Paraiso+Encantado+Xilitla&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className={styles.mapIframe}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
