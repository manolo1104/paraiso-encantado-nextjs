import Image from 'next/image';
import Link from 'next/link';
import FinDeTemporada from './FinDeTemporada';
import XantoloNoches from './XantoloNoches';
import styles from './XantoloSection.module.css';

// Sección de temporada de la portada (oct 2026). Lleva al artículo de Xantolo, que es
// lo que se quiere posicionar, y a las noches que todavía tienen cuartos. Debajo, en
// segundo plano, el paquete y la guía regional de Tours Huasteca.
//
// Se apaga sola al terminar el 2 de noviembre, hora de México. La portada es estática,
// así que la fecha se revisa dos veces: al compilar (si ya pasó, ni se pinta) y en el
// navegador (si nadie volvió a desplegar después del 3 de noviembre, se esconde igual).
export const XANTOLO_FIN = '2026-11-03T06:00:00Z';

// Tours Huasteca (la otra marca de la casa). El paquete incluye la noche del 1 de
// noviembre en este hotel; el artículo cuenta la fiesta en toda la región, no solo en Xilitla.
const TOURS_PAQUETE = 'https://www.huasteca-potosina.com/paquetes/xantolo-2026';
const TOURS_GUIA = 'https://www.huasteca-potosina.com/blog/xantolo-en-la-huasteca-potosina-la-fiesta-de-muertos-guia';

export default function XantoloSection() {
  if (Date.now() > Date.parse(XANTOLO_FIN)) return null;

  return (
    <FinDeTemporada fin={XANTOLO_FIN}>
      <section className={styles.section} aria-labelledby="xantolo-titulo">
        <div className={styles.inner}>
          <div className={styles.texto}>
            <h2 id="xantolo-titulo" className={styles.titulo}>
              Xantolo en Xilitla
              <em>el Día de Muertos de la Huasteca</em>
            </h2>
            <p className={styles.cuerpo}>
              Arcos de cempasúchil, altares y comparsas de huehues que bailan de noche en la plaza.
              Te contamos qué pasa cada noche y cómo vivirlo con respeto.
            </p>

            <XantoloNoches />

            <div className={styles.acciones}>
              <Link href="/blog/xantolo-en-xilitla" className={styles.primario}>
                Leer la guía de Xantolo
              </Link>
              <Link
                href="/reservar?checkin=2026-11-01&checkout=2026-11-03&adults=2"
                className={styles.secundario}
              >
                Suites del 1 al 3 de nov.
              </Link>
            </div>

            {/* Sin noreferrer a propósito: así el GA4 de Tours ve que la visita vino del hotel. */}
            <a href={TOURS_PAQUETE} target="_blank" rel="noopener" className={styles.paquete}>
              <span className={styles.paqueteEtiqueta}>Paquete Tours Huasteca · solo el domingo 1 de nov.</span>
              <span className={styles.paqueteNombre}>Las Pozas de día y la noche de Xantolo con guía</span>
              <span className={styles.paqueteDetalle}>
                Incluye tu noche aquí, la Ruta Surrealista, degustación de temporada y transporte
                al centro para ver las comparsas. Cupo para 4 parejas.
                <span className={styles.paqueteFlecha} aria-hidden="true">→</span>
              </span>
            </a>

            <p className={styles.masHuasteca}>
              ¿Vas a recorrer más pueblos?{' '}
              <a href={TOURS_GUIA} target="_blank" rel="noopener">
                El Xantolo en toda la Huasteca Potosina<span aria-hidden="true"> ↗</span>
              </a>
            </p>
          </div>

          <figure className={styles.foto}>
            <div className={styles.fotoMarco}>
              {/* La misma foto que usa la guía de Xantolo de Tours Huasteca. */}
              <Image
                src="/images/xantolo/altar-cempasuchil.jpg"
                alt="Visitante frente a un altar de Xantolo con arco de cempasúchil, veladoras y retratos de los difuntos, en la Huasteca Potosina"
                fill
                sizes="(max-width: 960px) 100vw, 40vw"
                style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
              />
            </div>
          </figure>
        </div>
      </section>
    </FinDeTemporada>
  );
}
