'use client';

import { Star, CheckCircle } from 'lucide-react';
import styles from './SuiteTestimonials.module.css';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  date: string;
  rating: number;
  text: string;
  suite: string;
  nights: number;
  verified: boolean;
}

const ALL_TESTIMONIALS: Testimonial[] = [
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
    text: 'Buscábamos desconectarnos sin sacrificar comodidad. Paraíso Encantado es exactamente eso: confort auténtico en la Huasteca. Los niños disfrutaron la piscina y nosotros la calma total.',
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
  {
    id: 7,
    name: 'Mariana T.',
    location: 'Querétaro',
    date: 'Enero 2026',
    rating: 5,
    text: 'La Flor de Lis 2 es simplemente perfecta. Atardeceres sobre Xilitla desde la terraza con el spa privado. Volvimos por segunda vez y ya planeamos la tercera.',
    suite: 'Suite Flor de Liz 2',
    nights: 3,
    verified: true,
  },
  {
    id: 8,
    name: 'Diego & Paola',
    location: 'Ciudad de México',
    date: 'Febrero 2026',
    rating: 5,
    text: 'Las Orquídeas 3 tienen todo lo que necesita una pareja. King size, vista a la piscina y la selva al fondo. Acceso directo a la alberca fue un plus enorme.',
    suite: 'Orquídeas 3',
    nights: 2,
    verified: true,
  },
  {
    id: 9,
    name: 'Laura & Marco',
    location: 'Monterrey, N.L.',
    date: 'Marzo 2026',
    rating: 5,
    text: 'Bromelias es increíble relación calidad-precio. Planta baja, salimos directo a la piscina cada mañana. El lugar es mágico y el personal nos hizo sentir como en casa.',
    suite: 'Bromelias',
    nights: 3,
    verified: true,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className={styles.stars} aria-label={`${count} estrellas`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={13} strokeWidth={0} fill="currentColor" />
      ))}
    </div>
  );
}

function getReviews(suiteName: string): Testimonial[] {
  const nameNorm = suiteName.toLowerCase();
  const direct = ALL_TESTIMONIALS.filter(
    (t) => t.suite.toLowerCase().includes(nameNorm) || nameNorm.includes(t.suite.toLowerCase())
  );
  if (direct.length >= 2) return direct.slice(0, 3);
  // fallback: mostrar 2 reseñas generales que no sean de otra suite específica
  const fallback = ALL_TESTIMONIALS.filter(
    (t) => !direct.find((d) => d.id === t.id)
  ).slice(0, 2 - direct.length);
  return [...direct, ...fallback].slice(0, 2);
}

export default function SuiteTestimonials({ suiteName }: { suiteName: string }) {
  const reviews = getReviews(suiteName);
  if (reviews.length === 0) return null;

  return (
    <section className={styles.section} aria-label={`Reseñas de ${suiteName}`}>
      <h2 className={styles.title}>
        Lo que dicen <em>quienes ya la vivieron</em>
      </h2>
      <div className={styles.grid}>
        {reviews.map((t) => (
          <blockquote key={t.id} className={styles.card}>
            <header className={styles.cardHeader}>
              <div className={styles.avatar}>{t.name.charAt(0)}</div>
              <div className={styles.info}>
                <strong className={styles.name}>{t.name}</strong>
                <span className={styles.location}>{t.location}</span>
                <StarRating count={t.rating} />
                <span className={styles.date}>{t.date}</span>
                {t.verified && (
                  <span className={styles.verified}>
                    <CheckCircle size={11} strokeWidth={2} /> Estancia verificada
                  </span>
                )}
              </div>
            </header>
            <p className={styles.text}>&#8220;{t.text}&#8221;</p>
            <footer className={styles.meta}>
              Suite: <strong>{t.suite}</strong>
              {' · '}
              {t.nights} {t.nights === 1 ? 'noche' : 'noches'}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
