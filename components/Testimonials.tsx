import { Star, CheckCircle } from 'lucide-react';
import styles from './Testimonials.module.css';

const testimonials = [
  {
    id: 1,
    name: 'Alejandra M.',
    location: 'Ciudad de México',
    date: 'Febrero 2026',
    rating: 5,
    text: 'El spa en medio de la selva fue algo que no esperaba. El vapor entre los helechos al amanecer — completamente diferente a cualquier hotel en México. El restaurante El Papán es auténtico, nada turístico.',
    suite: 'Jungla',
    nights: 3,
    verified: true,
  },
  {
    id: 2,
    name: 'Carlos & Sofía',
    location: 'Monterrey, N.L.',
    date: 'Enero 2026',
    rating: 5,
    text: 'A pasos del Jardín de Edward James pero con silencio absoluto. Las tortillas del restaurante y el tucán al amanecer — irrepetible. Nos encantó la terraza y el hidromasaje.',
    suite: 'Suite LindaVista',
    nights: 2,
    verified: true,
  },
  {
    id: 3,
    name: 'Isabel C.',
    location: 'Ciudad de México',
    date: 'Diciembre 2025',
    rating: 5,
    text: 'Navidad en la selva fue mágico. La piscina de spa privado y el silencio nocturno. El personal es increíblemente atento, superaron todas mis expectativas.',
    suite: 'Suite Flor de Liz 1',
    nights: 4,
    verified: true,
  },
  {
    id: 4,
    name: 'Rodrigo & Ana',
    location: 'San Luis Potosí',
    date: 'Enero 2026',
    rating: 5,
    text: 'Aniversario perfecto. Vista panorámica de la selva desde la terraza, desayuno huasteco auténtico y acceso sencillo a Las Pozas. Lo recomendaremos siempre.',
    suite: 'Suite Lajas',
    nights: 2,
    verified: true,
  },
  {
    id: 5,
    name: 'Fernando R.',
    location: 'Guadalajara, Jal.',
    date: 'Marzo 2026',
    rating: 5,
    text: 'Buscábamos desconectarnos sin sacrificar comodidad. Paraíso Encantado es exactamente eso: lujo auténtico en la Huasteca. Los niños disfrutaron la piscina y nosotros la calma total.',
    suite: 'Helechos 1',
    nights: 3,
    verified: true,
  },
  {
    id: 6,
    name: 'Sofía R.',
    location: 'León, Gto.',
    date: 'Febrero 2026',
    rating: 5,
    text: 'Romance 100%. El balcón con vista a los jardines hizo el San Valentín memorable. El chef preparó una cena especial que no pedimos — simplemente nos sorprendieron.',
    suite: 'Lirios 2',
    nights: 2,
    verified: true,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className={styles.stars} aria-label={`${count} estrellas de 5`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={13} strokeWidth={0} fill="currentColor" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className={styles.section} id="resenas" aria-label="Reseñas de huéspedes">
      <div className={styles.sectionHeader}>
        <h2>
          Lo Que Dicen <em>Quienes Ya Lo Vivieron</em>
        </h2>
        <div className={styles.ratingSummary}>
          <div className={styles.ratingNumber} aria-label="Calificación 4.8 de 5">
            4.8
          </div>
          <div className={styles.ratingStars} aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={18} strokeWidth={0} fill="currentColor" />
            ))}
          </div>
          <p>Basado en 514 reseñas verificadas en Google</p>
        </div>
      </div>

      <div className={styles.grid}>
        {testimonials.map((t) => (
          <blockquote key={t.id} className={styles.card}>
            <header className={styles.cardHeader}>
              <div className={styles.avatar} aria-hidden="true">
                {t.name.charAt(0)}
              </div>
              <div className={styles.info}>
                <strong className={styles.name}>{t.name}</strong>
                <span className={styles.location}>{t.location}</span>
                <StarRating count={t.rating} />
                <span className={styles.date}>{t.date}</span>
                {t.verified && (
                  <span className={styles.verified} aria-label="Estancia verificada">
                    <CheckCircle size={12} strokeWidth={2} />
                    Estancia Verificada
                  </span>
                )}
              </div>
            </header>

            <p className={styles.text}>&#8220;{t.text}&#8221;</p>

            <footer className={styles.meta}>
              Suite: <strong>{t.suite}</strong>
              {' · '}
              Estadía: <strong>{t.nights} {t.nights === 1 ? 'noche' : 'noches'}</strong>
            </footer>
          </blockquote>
        ))}
      </div>

      <div className={styles.cta}>
        <a
          href="https://www.google.com/search?q=Hotel+Paraíso+Encantado+Xilitla+reseñas"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.reviewsLink}
        >
          Ver las 514 reseñas en Google →
        </a>
      </div>
    </section>
  );
}
