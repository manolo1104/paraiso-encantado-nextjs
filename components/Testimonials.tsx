import Image from 'next/image';
import { Star } from 'lucide-react';
import { HOTEL } from '@/lib/seo-hotel';
import { PERFIL_GOOGLE } from '@/lib/seo-entidades';
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
    avatar: '/images/reviews/alejandra.jpeg',
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
    avatar: '/images/reviews/carlos-sofia.jpg',
  },
  {
    id: 5,
    name: 'Fernando R.',
    location: 'Guadalajara, Jal.',
    date: 'Marzo 2026',
    rating: 5,
    text: 'Buscábamos desconectarnos sin sacrificar comodidad. Paraíso Encantado es exactamente eso: confort auténtico en la Huasteca. Los niños disfrutaron la piscina y nosotros la calma total.',
    suite: 'Helechos 1',
    nights: 3,
    verified: true,
    avatar: '/images/reviews/fernando.jpg',
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
          {/* Cifras de Google de lib/seo-hotel.ts (17 oct 2026): decía 523 a mano y
              «verificadas», y Google no comprueba que quien reseña se haya hospedado. */}
          <div className={styles.ratingNumber} aria-label={`Calificación ${HOTEL.rating} de 5`}>
            {HOTEL.rating}
          </div>
          <div className={styles.ratingStars} aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={18} strokeWidth={0} fill="currentColor" />
            ))}
          </div>
          <p>Basado en {HOTEL.reviewCount} reseñas en Google</p>
        </div>
      </div>

      <div className={styles.grid}>
        {testimonials.map((t) => (
          <blockquote key={t.id} className={styles.card}>
            <header className={styles.cardHeader}>
              <div className={styles.avatar} aria-hidden="true">
                {t.avatar ? (
                  <Image src={t.avatar} alt={t.name} fill sizes="48px" className={styles.avatarImg} />
                ) : (
                  t.name.charAt(0)
                )}
              </div>
              <div className={styles.info}>
                <strong className={styles.name}>{t.name}</strong>
                <span className={styles.location}>{t.location}</span>
                <StarRating count={t.rating} />
                <span className={styles.date}>{t.date}</span>
                {/* Sin la etiqueta «Estancia Verificada» (17 oct 2026): nadie comprobó
                    estas estancias, y la etiqueta lo afirmaba. Vuelve si Manolo enlaza
                    cada testimonio con su reseña real. */}
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
        {/* El perfil del hotel por su cid: la búsqueda por nombre podía abrir la OTRA
            ficha («Posada Paraiso Encantado», ver lib/seo-entidades.ts). */}
        <a
          href={PERFIL_GOOGLE}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.reviewsLink}
        >
          Ver las {HOTEL.reviewCount} reseñas en Google →
        </a>
      </div>
    </section>
  );
}
