import Image from 'next/image';
import Link from 'next/link';
import FinDeTemporada from './FinDeTemporada';
import XantoloNoches from './XantoloNoches';
import styles from './XantoloSection.module.css';

// Sección de temporada de la portada (oct 2026). Lleva al artículo de Xantolo, que es
// lo que se quiere posicionar, y a las noches que todavía tienen cuartos. Debajo, en
// segundo plano, la guía regional de Tours Huasteca.
//
// Se apaga sola al terminar el 2 de noviembre, hora de México. La fecha se revisa dos
// veces: en el servidor (hoy la portada se arma en cada visita: si ya pasó, ni se pinta)
// y en el navegador (por si la página llega a quedar en caché o compilada de antes).
export const XANTOLO_FIN = '2026-11-03T06:00:00Z';

// Botones a fechas fijas. Al 16 oct, las noches del 30 y 31 de octubre estaban llenas y
// la del 1 de noviembre casi (el 13 oct, llena: el botón de antes, «del 1 al 3 de nov.»,
// mandaba ahí). Los que tenían cuartos eran los días de entre semana de alrededor: el
// jueves 29, cuando se levantan los arcos, y del lunes 2 al jueves 5. No prometen cupo:
// /reservar enseña la disponibilidad real. Las noches centrales, en vivo, en XantoloNoches.
// Cada botón se apaga solo al acabar el día de su llegada (`fin`, medianoche de México en
// UTC): la sección sigue hasta el 3 nov y, del 30 oct en adelante, «29 al 30 de oct.»
// mandaba a una llegada pasada que /reservar descarta (abría el calendario vacío).
const NOCHES_ENTRE_SEMANA = [
  { href: '/reservar?checkin=2026-10-29&checkout=2026-10-30&adults=2', texto: 'Suites del 29 al 30 de oct.', fin: '2026-10-30T06:00:00Z' },
  { href: '/reservar?checkin=2026-11-02&checkout=2026-11-04&adults=2', texto: 'Suites del 2 al 4 de nov.', fin: XANTOLO_FIN },
];

// Tours Huasteca (la otra marca de la casa): su artículo cuenta la fiesta en toda la
// región, no solo en Xilitla. El paquete de Tours con la noche del 1 de nov. en este
// hotel se quitó el 16 oct: Tours ya no lo vende («el paquete con hotel ya no se vende»).
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
              {NOCHES_ENTRE_SEMANA.filter((n) => Date.now() <= Date.parse(n.fin)).map((n) => (
                <FinDeTemporada key={n.href} fin={n.fin}>
                  <Link href={n.href} className={styles.secundario}>
                    {n.texto}
                  </Link>
                </FinDeTemporada>
              ))}
            </div>

            {/* Sin noreferrer a propósito: así el GA4 de Tours ve que la visita vino del hotel. */}
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
