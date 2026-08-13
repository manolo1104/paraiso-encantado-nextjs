/**
 * Sección "huéspedes distinguidos".
 *
 * Solo se publica lo que una fuente pública respalda. Publicar que una persona
 * real e identificable se hospedó aquí, sin respaldo, sería a la vez un problema
 * de derecho de imagen, de confidencialidad frente al huésped y una afirmación no
 * verificable — justo lo que Google y los buscadores con IA penalizan. Por eso
 * `fuentes` es obligatorio: si está vacío, la sección no se renderiza.
 *
 * La visita de junio de 2023 está documentada por prensa independiente (Pulso SLP
 * y Debate nombran el hotel) y por el video de la propia visita, que además vive
 * en la home del sitio.
 */
import styles from './seo-landing.module.css';

export interface Fuente {
  nombre: string;
  url: string;
}

export interface HuespedDistinguido {
  /** Nombre y cargo tal como corresponde a la fecha de la visita */
  nombre: string;
  fecha: string;
  /** Frase textual publicada. Se cita entrecomillada y con fuente. */
  cita?: string;
  texto: string;
  /** Al menos una. Sin fuentes, la sección no aparece. */
  fuentes: Fuente[];
  /** Enlace público al video (para citarlo como fuente) */
  videoUrl?: string;
  /** URL de incrustación del mismo video (el que ya se usa en la portada) */
  videoEmbedUrl?: string;
}

export const HUESPED_DISTINGUIDO: HuespedDistinguido | null = {
  nombre: 'Andrés Manuel López Obrador, entonces presidente de México',
  fecha: '10 de junio de 2023',
  cita: 'Amanecimos en Xilitla, aquí muy cerca del jardín surrealista de Edward James; este es un hotel muy bueno, como pocos hoteles de todo el país.',
  texto:
    'Durante su gira por la Huasteca, el entonces presidente de México pernoctó en Paraíso Encantado y desayunó aquí antes de continuar hacia Tamazunchale y Huejutla. La visita fue cubierta por la prensa nacional y estatal, y él mismo la grabó y publicó esa mañana.',
  fuentes: [
    { nombre: 'Pulso SLP', url: 'https://pulsoslp.com.mx/estado/con-visita-por-xilitla-retoma-amlo-giras-a-ras-de-tierra-/1672314' },
    { nombre: 'Debate', url: 'https://www.debate.com.mx/politica/Amanecimos-en-el-cielo-presume-AMLO-desayuno-en-Xilitla-SLP-durante-gira-por-la-Huasteca-20230610-0110.html' },
    { nombre: 'Escapada H', url: 'https://www.escapadah.com/pueblos-magicos/2023/6/11/xilitla-el-pueblo-magico-surrealista-que-enamoro-al-presidente-andres-manuel-lopez-obrador-10763.html' },
  ],
  videoUrl: 'https://www.youtube.com/watch?v=Y8h8CuTNLcA',
  videoEmbedUrl: 'https://www.youtube.com/embed/Y8h8CuTNLcA?start=1&rel=0&modestbranding=1',
};

export default function HuespedDistinguidoSection({
  huesped = HUESPED_DISTINGUIDO,
}: { huesped?: HuespedDistinguido | null }) {
  if (!huesped || huesped.fuentes.length === 0) return null;

  return (
    <section className={styles.guest}>
      <div className={styles.guestInner}>
        <h2>Quién ha dormido aquí</h2>

        {huesped.videoEmbedUrl && (
          <div className={styles.guestVideo}>
            <iframe
              src={huesped.videoEmbedUrl}
              title={`Visita de ${huesped.nombre} al Hotel Paraíso Encantado, Xilitla`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className={styles.guestVideoIframe}
            />
          </div>
        )}

        {huesped.cita && (
          <blockquote className={styles.guestQuote}>
            <p style={{ margin: 0 }}>&ldquo;{huesped.cita}&rdquo;</p>
          </blockquote>
        )}

        <p className={styles.guestAttrib}>
          {huesped.nombre} · {huesped.fecha}
        </p>

        <p className={styles.guestBody}>{huesped.texto}</p>

        <p className={styles.guestSource}>
          Cobertura:{' '}
          {huesped.fuentes.map((f, i) => (
            <span key={f.url}>
              {i > 0 && ' · '}
              <a href={f.url} target="_blank" rel="noopener noreferrer nofollow">{f.nombre}</a>
            </span>
          ))}
          {huesped.videoUrl && (
            <>
              {' · '}
              <a href={huesped.videoUrl} target="_blank" rel="noopener noreferrer">Video de la visita</a>
            </>
          )}
        </p>

      </div>
    </section>
  );
}

/**
 * Schema.org de la visita. Se declara como `Event` con `subjectOf` apuntando a
 * las notas de prensa: así el hecho queda enlazado a quien lo publicó y no
 * depende de la palabra del hotel.
 */
export function huespedSchema(huesped: HuespedDistinguido | null = HUESPED_DISTINGUIDO) {
  if (!huesped || huesped.fuentes.length === 0) return null;
  return {
    '@type': 'Event',
    name: 'Visita del presidente de México al Hotel Paraíso Encantado',
    startDate: '2023-06-10',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'LodgingBusiness',
      name: 'Hotel Paraíso Encantado',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Xilitla',
        addressRegion: 'San Luis Potosí',
        addressCountry: 'MX',
      },
    },
    attendee: { '@type': 'Person', name: 'Andrés Manuel López Obrador' },
    subjectOf: [
      ...huesped.fuentes.map(f => ({
        '@type': 'NewsArticle',
        url: f.url,
        publisher: { '@type': 'Organization', name: f.nombre },
      })),
      ...(huesped.videoUrl ? [{
        '@type': 'VideoObject',
        name: 'Visita presidencial al Hotel Paraíso Encantado, Xilitla (2023)',
        description: 'Video de la visita del entonces presidente de México al Hotel Paraíso Encantado durante su gira por la Huasteca Potosina, junio de 2023.',
        uploadDate: '2023-06-10',
        contentUrl: huesped.videoUrl,
        embedUrl: huesped.videoEmbedUrl,
        thumbnailUrl: 'https://i.ytimg.com/vi/Y8h8CuTNLcA/hqdefault.jpg',
      }] : []),
    ],
  };
}
