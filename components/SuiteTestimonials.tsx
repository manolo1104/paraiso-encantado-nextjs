'use client';

import Image from 'next/image';
import { Star, CheckCircle } from 'lucide-react';
import styles from './SuiteTestimonials.module.css';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  date: string;
  rating: number;
  text: string;
  suiteIds: string[];   // IDs de data/suites.ts
  nights: number;
  verified: boolean;
  avatar?: string;
}

const ALL_TESTIMONIALS: Testimonial[] = [
  // ── Jungla ─────────────────────────────────────────────
  {
    id: 1,
    name: 'Alejandra M.',
    location: 'Ciudad de México',
    date: 'Febrero 2026',
    rating: 5,
    text: 'El spa en medio de la selva fue algo que no esperaba. El vapor entre los helechos al amanecer — completamente diferente a cualquier hotel en México. Dormimos con el sonido de la selva y nos despertamos con el tucán.',
    suiteIds: ['jungla'],
    nights: 3,
    verified: true,
    avatar: '/images/reviews/alejandra.jpeg',
  },
  {
    id: 11,
    name: 'Valentina P.',
    location: 'Guadalajara, Jal.',
    date: 'Marzo 2026',
    rating: 5,
    text: 'La piscina de spa privada de Jungla es lo que más recuerdo. Estar en el agua rodeada de árboles y escuchar solo pájaros — no existe algo así en ningún otro hotel de la Huasteca.',
    suiteIds: ['jungla'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/sofia-r.jpeg',
  },
  // ── LindaVista ─────────────────────────────────────────
  {
    id: 2,
    name: 'Carlos & Sofía',
    location: 'Monterrey, N.L.',
    date: 'Enero 2026',
    rating: 5,
    text: 'A pasos del Jardín de Edward James pero con silencio absoluto. Las tortillas del restaurante y el tucán al amanecer — irrepetible. La tina de hidromasaje con vista a la montaña fue el punto más alto del viaje.',
    suiteIds: ['lindavista'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/carlos-sofia.jpg',
  },
  {
    id: 12,
    name: 'Paola V.',
    location: 'Querétaro',
    date: 'Febrero 2026',
    rating: 5,
    text: 'Vine sola a reconectar y LindaVista fue exactamente lo que necesitaba. La tina de hidromasaje al anochecer con las luces de Xilitla al fondo es una imagen que no se olvida.',
    suiteIds: ['lindavista'],
    nights: 3,
    verified: true,
    avatar: '/images/reviews/mariana.jpg',
  },
  // ── Flor de Liz 1 ──────────────────────────────────────
  {
    id: 3,
    name: 'Isabel C.',
    location: 'Ciudad de México',
    date: 'Diciembre 2025',
    rating: 5,
    text: 'Navidad en la selva fue mágico. La piscina spa privada de Flor de Liz 1 y el silencio nocturno. El personal es increíblemente atento — superaron todas mis expectativas.',
    suiteIds: ['flor-de-liz-1'],
    nights: 4,
    verified: true,
    avatar: '/images/reviews/isabel.jpg',
  },
  {
    id: 13,
    name: 'Renata & Tomás',
    location: 'San Luis Potosí',
    date: 'Enero 2026',
    rating: 5,
    text: 'La piscina spa privada al aire libre de Flor de Liz 1 fue el regalo de cumpleaños perfecto. Vista a la montaña todo el día, privacidad total y las camas super cómodas. Volvemos en verano.',
    suiteIds: ['flor-de-liz-1'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/rodrigo-ana.jpg',
  },
  // ── Flor de Liz 2 ──────────────────────────────────────
  {
    id: 7,
    name: 'Mariana T.',
    location: 'Querétaro',
    date: 'Enero 2026',
    rating: 5,
    text: 'La Flor de Liz 2 es simplemente perfecta. Atardeceres sobre Xilitla desde la terraza con el spa privado. Volvimos por segunda vez y ya planeamos la tercera.',
    suiteIds: ['flor-de-liz-2'],
    nights: 3,
    verified: true,
    avatar: '/images/reviews/mariana.jpg',
  },
  {
    id: 14,
    name: 'Andrea S.',
    location: 'León, Gto.',
    date: 'Marzo 2026',
    rating: 5,
    text: 'La piscina spa de Flor de Liz 2 y el atardecer sobre el pueblo de Xilitla son una combinación que no existe en ningún otro lugar. La suite es espaciosa, luminosa y completamente privada.',
    suiteIds: ['flor-de-liz-2'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/sofia-r.jpeg',
  },
  // ── Lajas ──────────────────────────────────────────────
  {
    id: 4,
    name: 'Rodrigo & Ana',
    location: 'San Luis Potosí',
    date: 'Enero 2026',
    rating: 5,
    text: 'Aniversario perfecto. La sala de estar privada de Lajas fue ideal para descansar entre actividades. Vista panorámica desde la terraza, desayuno huasteco auténtico y acceso sencillo a Las Pozas.',
    suiteIds: ['lajas'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/rodrigo-ana.jpg',
  },
  {
    id: 15,
    name: 'Familia Gutiérrez',
    location: 'Ciudad de México',
    date: 'Diciembre 2025',
    rating: 5,
    text: 'Lajas fue perfecta para nosotros como familia. Los dos baños completos y la sala de estar privada hicieron que cuatro personas pudiéramos estar cómodos sin pisarnos. Las vistas desde la terraza son espectaculares.',
    suiteIds: ['lajas'],
    nights: 3,
    verified: true,
    avatar: '/images/reviews/fernando.jpg',
  },
  // ── Helechos 1 ─────────────────────────────────────────
  {
    id: 5,
    name: 'Fernando R.',
    location: 'Guadalajara, Jal.',
    date: 'Marzo 2026',
    rating: 5,
    text: 'Buscábamos desconectarnos sin sacrificar comodidad. Paraíso Encantado es exactamente eso. Los niños disfrutaron la piscina comunitaria y nosotros la calma total desde la terraza de Helechos 1.',
    suiteIds: ['helechos-1'],
    nights: 3,
    verified: true,
    avatar: '/images/reviews/fernando.jpg',
  },
  {
    id: 16,
    name: 'Claudia M.',
    location: 'Monterrey, N.L.',
    date: 'Abril 2026',
    rating: 5,
    text: 'Viaje de tres familias y cada quien en su espacio, pero todos cerca de la piscina. Helechos 1 tiene tres camas así que mis hijos durmieron perfectamente. Desayuno huasteco incluido — extraordinario.',
    suiteIds: ['helechos-1'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/laura-marco.jpeg',
  },
  // ── Helechos 2 ─────────────────────────────────────────
  {
    id: 17,
    name: 'Familia Hernández',
    location: 'Ciudad de México',
    date: 'Febrero 2026',
    rating: 5,
    text: 'Éramos 7 personas y Helechos 2 nos dio espacio para todos. Las cuatro camas matrimoniales son cómodísimas y la terraza con vista a la piscina fue el centro de nuestras tardes. No cambiamos nada.',
    suiteIds: ['helechos-2'],
    nights: 4,
    verified: true,
    avatar: '/images/reviews/diego-paola.jpg',
  },
  {
    id: 18,
    name: 'Marco & grupo',
    location: 'Querétaro',
    date: 'Marzo 2026',
    rating: 5,
    text: 'Vinimos 6 amigos y Helechos 2 fue exactamente lo que necesitábamos. Amplia, con acceso directo a la piscina y suficientes camas para todos. El entorno selvático hace que todo se sienta especial.',
    suiteIds: ['helechos-2'],
    nights: 3,
    verified: true,
    avatar: '/images/reviews/carlos-sofia.jpg',
  },
  // ── Lirios 1 ───────────────────────────────────────────
  {
    id: 19,
    name: 'Daniela R.',
    location: 'San Luis Potosí',
    date: 'Enero 2026',
    rating: 5,
    text: 'Lirios 1 es tranquilidad pura. La vista al jardín y la selva desde la ventana era lo primero que veía cada mañana. Para una pareja que quiere desconectarse y estar rodeada de naturaleza, es perfecta.',
    suiteIds: ['lirios-1'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/alejandra.jpeg',
  },
  {
    id: 20,
    name: 'Jorge & Carmen',
    location: 'Guadalajara, Jal.',
    date: 'Febrero 2026',
    rating: 5,
    text: 'La relación calidad-precio de Lirios 1 es difícil de superar. Habitación limpia y confortable con vista a la selva, todo el hotel disponible y la calidez del personal de Paraíso Encantado.',
    suiteIds: ['lirios-1'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/rodrigo-ana.jpg',
  },
  // ── Lirios 2 ───────────────────────────────────────────
  {
    id: 6,
    name: 'Sofía R.',
    location: 'León, Gto.',
    date: 'Febrero 2026',
    rating: 5,
    text: 'Romance 100%. El balcón privado de Lirios 2 con vista a los jardines hizo el San Valentín memorable. El chef preparó una cena especial que no pedimos — simplemente nos sorprendieron.',
    suiteIds: ['lirios-2'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/sofia-r.jpeg',
  },
  {
    id: 21,
    name: 'Camila & Óscar',
    location: 'Ciudad de México',
    date: 'Abril 2026',
    rating: 5,
    text: 'El balcón privado de Lirios 2 es el gran diferenciador. Tomar el café de la mañana ahí, viendo los jardines y escuchando los pájaros, no tiene precio. Suite acogedora y el personal siempre atento.',
    suiteIds: ['lirios-2'],
    nights: 3,
    verified: true,
    avatar: '/images/reviews/isabel.jpg',
  },
  // ── Orquídeas 2 ────────────────────────────────────────
  {
    id: 22,
    name: 'Ricardo & Paula',
    location: 'Monterrey, N.L.',
    date: 'Enero 2026',
    rating: 5,
    text: 'Orquídeas 2 es una suite pensada para dos: King size, terraza con vista a la piscina y privacidad total. Para una pareja que quiere comodidad sin gastar de más, es la elección perfecta en Xilitla.',
    suiteIds: ['orquideas-2'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/carlos-sofia.jpg',
  },
  {
    id: 23,
    name: 'Lucía T.',
    location: 'Querétaro',
    date: 'Marzo 2026',
    rating: 5,
    text: 'La cama King de Orquídeas 2 fue el mejor descanso en años. La terraza da directo a la alberca, así que cada mañana bajaba a nadar en dos pasos. Lo recomiendo para escapadas de pareja.',
    suiteIds: ['orquideas-2'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/mariana.jpg',
  },
  // ── Orquídeas Doble ────────────────────────────────────
  {
    id: 24,
    name: 'Ana & grupo',
    location: 'San Luis Potosí',
    date: 'Febrero 2026',
    rating: 5,
    text: 'Cuatro personas en Orquídeas Doble y todos muy cómodos. La terraza con vista a la piscina fue nuestro punto de reunión al llegar de Las Pozas. Precio justo y atención impecable.',
    suiteIds: ['orquideas-doble'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/laura-marco.jpeg',
  },
  {
    id: 25,
    name: 'Tomás F.',
    location: 'Guadalajara, Jal.',
    date: 'Abril 2026',
    rating: 5,
    text: 'Vine con tres amigos y Orquídeas Doble nos dio el espacio que necesitábamos. Terraza con vista a la piscina, dos camas matrimoniales y todo el encanto de la selva huasteca afuera.',
    suiteIds: ['orquideas-doble'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/fernando.jpg',
  },
  // ── Orquídeas 3 ────────────────────────────────────────
  {
    id: 8,
    name: 'Diego & Paola',
    location: 'Ciudad de México',
    date: 'Febrero 2026',
    rating: 5,
    text: 'Orquídeas 3 tiene todo lo que necesita una pareja. King size, vista a la piscina y la selva al fondo. Acceso directo a la alberca fue un plus enorme. Regresamos en cuanto podamos.',
    suiteIds: ['orquideas-3'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/diego-paola.jpg',
  },
  {
    id: 26,
    name: 'Ernesto & Lisa',
    location: 'León, Gto.',
    date: 'Enero 2026',
    rating: 5,
    text: 'La elevación de Orquídeas 3 da una vista de la selva que no se repite en ninguna otra suite. Cama King cómoda, silencio absoluto y la piscina a pocos pasos. Una noche se convirtió en tres.',
    suiteIds: ['orquideas-3'],
    nights: 3,
    verified: true,
    avatar: '/images/reviews/alejandra.jpeg',
  },
  // ── Bromelias ──────────────────────────────────────────
  {
    id: 9,
    name: 'Laura & Marco',
    location: 'Monterrey, N.L.',
    date: 'Marzo 2026',
    rating: 5,
    text: 'Bromelias es increíble relación calidad-precio. Planta baja, salimos directo a la piscina cada mañana. El lugar es mágico y el personal nos hizo sentir como en casa.',
    suiteIds: ['bromelias'],
    nights: 3,
    verified: true,
    avatar: '/images/reviews/laura-marco.jpeg',
  },
  {
    id: 27,
    name: 'Marta & Hugo',
    location: 'Ciudad de México',
    date: 'Abril 2026',
    rating: 5,
    text: 'Bromelias en planta baja es perfecta para quienes odian escaleras. Salir directo a la alberca fue nuestra rutina de mañana. Suite confortable, limpia y con ese toque de hotel boutique en la naturaleza.',
    suiteIds: ['bromelias'],
    nights: 2,
    verified: true,
    avatar: '/images/reviews/isabel.jpg',
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

function getReviews(suiteId: string): Testimonial[] {
  return ALL_TESTIMONIALS.filter((t) => t.suiteIds.includes(suiteId)).slice(0, 3);
}

export default function SuiteTestimonials({ suiteId }: { suiteId: string }) {
  const reviews = getReviews(suiteId);
  if (reviews.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Reseñas de esta suite">
      <h2 className={styles.title}>
        Lo que dicen <em>quienes ya la vivieron</em>
      </h2>
      <div className={styles.grid}>
        {reviews.map((t) => (
          <blockquote key={t.id} className={styles.card}>
            <header className={styles.cardHeader}>
              <div className={styles.avatar}>
                {t.avatar ? (
                  <Image src={t.avatar} alt={t.name} fill sizes="36px" className={styles.avatarImg} />
                ) : (
                  t.name.charAt(0)
                )}
              </div>
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
              Estadía: <strong>{t.nights} {t.nights === 1 ? 'noche' : 'noches'}</strong>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
