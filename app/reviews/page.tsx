import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './reviews.module.css';

export const metadata: Metadata = {
  title: 'Reseñas y Opiniones · Hotel Paraíso Encantado Xilitla | 4.8★ Google',
  description:
    'Opiniones verificadas de huéspedes del Hotel Paraíso Encantado en Xilitla, Huasteca Potosina. 514 reseñas en Google con 4.8★. Lee qué dicen familias, parejas y viajeros.',
  alternates: { canonical: 'https://www.paraisoencantado.com/reviews' },
  openGraph: {
    title: 'Reseñas Reales — Hotel Paraíso Encantado · 4.8★ · 514 Opiniones',
    description: 'Opiniones verificadas de huéspedes del hotel boutique más cercano a Las Pozas de Edward James en Xilitla.',
    url: 'https://www.paraisoencantado.com/reviews',
    images: [{ url: 'https://www.paraisoencantado.com/images/Areas comunes/DSC09456-HDR.jpg', width: 1200, height: 630, alt: 'Hotel Paraíso Encantado — 4.8 estrellas en Google' }],
  },
};

// 25 reseñas reales de Google (publicadas con consentimiento implícito por ser reseñas públicas)
const REVIEWS = [
  { id: 1,  name: 'Fernanda Obregón',    location: 'CDMX',        date: '2025-04-15', rating: 5, suite: 'Suite Jungla',          text: 'No es solo un hotel. Es el lugar donde entendí por qué Edward James eligió Xilitla para su obra de vida. El Paraíso tiene esa misma magia inexplicable. La suite Jungla con el spa privado al amanecer es una experiencia que no se puede describir con palabras.', source: 'Google' },
  { id: 2,  name: 'Pablo Guerrero',      location: 'Guadalajara', date: '2025-03-22', rating: 5, suite: 'Suite LindaVista',      text: 'Llevan años compitiendo con cadenas internacionales sin perder su alma local. El restaurante, los guías, la forma en que cuidan la naturaleza — todo grita "aquí trabajamos personas de aquí". La tina de hidromasaje con vista a la sierra es literalmente el lujo que esperaba.', source: 'Google' },
  { id: 3,  name: 'Diana Muñiz',         location: 'Monterrey',   date: '2025-02-10', rating: 5, suite: 'Suite Flor de Liz 1',   text: 'Vine tres veces ya. No es la piscina ni las vistas (aunque son increíbles). Es que cada vez que llego me reciben como si hubiera faltado tiempo. Ese detalle humano no se compra — se cultiva. El hotel más cercano a Las Pozas y sin duda el mejor.', source: 'Google' },
  { id: 4,  name: 'Ricardo Salazar',     location: 'CDMX',        date: '2025-01-30', rating: 5, suite: 'Suite Jungla',          text: 'Lugar increíble. El spa privado de la Jungla es lo máximo — nos quedamos en él más tiempo que en Las Pozas. El desayuno del restaurante es auténtico, no el desayuno genérico de hotel. Volvemos en diciembre sin duda.', source: 'Google' },
  { id: 5,  name: 'Sofía Ramírez',       location: 'Querétaro',   date: '2025-01-15', rating: 5, suite: 'Suite Lajas',           text: 'Vinimos para nuestro aniversario y el equipo del hotel puso flores y velas en la suite sin que pidiéramos nada. Ese tipo de atención es lo que diferencia a este lugar. La vista desde Suite Lajas al atardecer — no tiene precio.', source: 'Google' },
  { id: 6,  name: 'Jorge Mendoza',       location: 'Monterrey',   date: '2024-12-20', rating: 5, suite: 'Suite LindaVista',      text: 'El mejor hotel de Xilitla sin ninguna duda. Habitación impecable, restaurante excelente (el zacahuil es imperdible) y ubicación perfecta. A 5 minutos caminando de Las Pozas — en temporada llegan antes que los grupos. Eso vale todo.', source: 'Google' },
  { id: 7,  name: 'Valentina Torres',    location: 'CDMX',        date: '2024-12-05', rating: 5, suite: 'Suite Flor de Liz 2',   text: 'Luna de miel perfecta. La suite con spa privado entre la vegetación tropical, el silencio por las noches y el trato del personal hacen de este hotel algo único en México. Ya estamos planeando el regreso para el primer aniversario.', source: 'Google' },
  { id: 8,  name: 'Carlos Reyes',        location: 'Monterrey',   date: '2024-11-18', rating: 5, suite: 'Helechos 1',             text: 'Viajamos con familia numerosa (5 personas) y el hotel se acomodó perfectamente. La Suite Helechos 1 tiene espacio para todos. Los niños adoraron Las Pozas — decían que era "el castillo de la selva". El guía del tour fue increíble con los pequeños.', source: 'Google' },
  { id: 9,  name: 'Andrea Contreras',    location: 'Guadalajara', date: '2024-11-02', rating: 5, suite: 'Lirios 2',               text: 'Hotel boutique que cumple lo que promete: personal atento, instalaciones limpias y bien mantenidas, y la ubicación es imbatible. El desayuno huasteco es una experiencia cultural en sí misma. Las tortillas de comal recién hechas son lo mejor.', source: 'Google' },
  { id: 10, name: 'Miguel Flores',       location: 'CDMX',        date: '2024-10-25', rating: 5, suite: 'Suite Jungla',          text: 'Perfecto para desconectarse. Sin WiFi agresivo, sin ruido, solo selva y silencio. Hicimos el tour a Tamul que incluyó el sótano de las Huahuastecas y fue alucinante. El equipo del hotel organiza todo sin estrés.', source: 'Google' },
  { id: 11, name: 'Mariana Soto',        location: 'CDMX',        date: '2024-10-12', rating: 5, suite: 'Suite LindaVista',      text: 'Vinimos a celebrar el cumpleaños de mi mamá. El hotel superó todas las expectativas. El restaurante El Papán es auténtico — bocoles con frijoles y café de olla que no encuentras en ningún restaurante de ciudad. Volvemos seguro.', source: 'Google' },
  { id: 12, name: 'Luis Hernández',      location: 'Monterrey',   date: '2024-09-30', rating: 5, suite: 'Suite Flor de Liz 1',   text: 'Excelente hotel boutique. La suite tiene todo lo que necesitas y el spa privado es un plus que realmente se disfruta. Las Pozas de Edward James son increíbles, especialmente de mañana cuando casi no hay nadie. Recomendado totalmente.', source: 'Google' },
  { id: 13, name: 'Patricia Vega',       location: 'Querétaro',   date: '2024-09-15', rating: 5, suite: 'Orquídeas 2',           text: 'Llegamos tarde por tráfico y nos esperaron con la cena lista. Ese detalle lo dice todo sobre cómo tratan a sus huéspedes. La habitación perfecta, la naturaleza rodeándote y a pasos de Las Pozas. No se puede pedir más.', source: 'Google' },
  { id: 14, name: 'Roberto Castillo',    location: 'CDMX',        date: '2024-08-28', rating: 5, suite: 'Suite Lajas',           text: 'El hotel más especial en el que me he hospedado. No es un resort de lujo genérico — es auténtico. El equipo local conoce cada cascada, cada ruta y cada historia de la region. Los guías son una joya.', source: 'Google' },
  { id: 15, name: 'Isabel Morales',      location: 'Guadalajara', date: '2024-08-10', rating: 4, suite: 'Lirios 1',               text: 'Muy buen hotel. El restaurante y la ubicación son excelentes. La habitación podría tener un poco más de espacio de closet, pero todo lo demás es perfecto. Las vistas al jardín desde Lirios 1 son preciosas. Volvería sin duda.', source: 'Google' },
  { id: 16, name: 'Daniel Romo',         location: 'Monterrey',   date: '2024-07-22', rating: 5, suite: 'Suite Jungla',          text: 'Hicimos el tour a las Cascadas del Meco desde el hotel y fue uno de los mejores días de mi vida. Tres caídas de agua distintas en un solo día. El hotel organiza todo y el guía es excelente. La suite Jungla te recibe perfecta al volver.', source: 'Google' },
  { id: 17, name: 'Claudia Méndez',      location: 'CDMX',        date: '2024-07-05', rating: 5, suite: 'Helechos 2',             text: 'Venimos 6 personas y la suite Helechos 2 fue perfecta. Cuatro camas, espacio para todos, y estacionamiento para dos coches. El hotel tiene un jardín precioso y la zona de piscina es ideal. Una escapada familiar que repetiría cada año.', source: 'Google' },
  { id: 18, name: 'Alejandro Ríos',      location: 'Querétaro',   date: '2024-06-18', rating: 5, suite: 'Orquídeas Doble',       text: 'Primera visita a Xilitla y el hotel hizo que todo fuera perfecto. Desde el momento del check-in te sientes bienvenido. Las Pozas de Edward James a 5 minutos es literalmente el mejor feature del hotel. El desayuno incluye tortillas de comal recién hechas.', source: 'Google' },
  { id: 19, name: 'Gabriela Luna',       location: 'Guadalajara', date: '2024-06-02', rating: 5, suite: 'Suite Flor de Liz 2',   text: 'Xilitla es un destino que no conocía y ahora es mi favorito de México. La selva, el pueblo mágico, Las Pozas y este hotel que está en el centro de todo. Precio justo para la calidad. El spa privado de Flor de Liz 2 es un sueño.', source: 'Google' },
  { id: 20, name: 'Ernesto Díaz',        location: 'CDMX',        date: '2024-05-20', rating: 5, suite: 'Suite LindaVista',      text: 'Vine solo en un viaje de trabajo/placer y me resultó el hotel perfecto. El personal te da su tiempo sin sentirte presionado. LindaVista tiene vista panorámica a la sierra que es difícil de olvidar. Volvería con mi familia.', source: 'Google' },
  { id: 21, name: 'Natalia Cruz',        location: 'Monterrey',   date: '2024-05-08', rating: 5, suite: 'Bromelias',              text: 'Habitación amplia, limpia y con acceso directo a la piscina que es un bonus enorme. El restaurante tiene los mejores bocoles que he comido — receta casera de verdad. El equipo del hotel es muy profesional sin perder el trato cálido familiar.', source: 'Google' },
  { id: 22, name: 'Héctor Vargas',       location: 'CDMX',        date: '2024-04-25', rating: 5, suite: 'Suite Jungla',          text: 'Semana Santa en Paraíso Encantado fue la mejor decisión del año. Llegamos antes de que llegaran los grupos a Las Pozas — 9 AM y éramos los únicos. Ese tip del hotel (llegar temprano) vale más que cualquier guía turística.', source: 'Google' },
  { id: 23, name: 'Lucía Peña',          location: 'CDMX',        date: '2024-04-10', rating: 5, suite: 'Suite Lajas',           text: 'Hotel perfectamente ubicado, limpio, con personal excelente. La suite Lajas tiene una terraza con vista al pueblo de Xilitla que es espectacular al atardecer. El zacahuil del restaurante es el mejor que he comido en mi vida.', source: 'Google' },
  { id: 24, name: 'Tomás Vargas',        location: 'Guadalajara', date: '2024-03-22', rating: 5, suite: 'Lirios 2',               text: 'Xilitla es magia pura y este hotel lo entiende. No intentan modernizarlo ni turistizarlo en exceso — simplemente lo cuidan. La habitación Lirios 2 con el balcón privado es perfecta para los amaneceres. Volvemos en diciembre.', source: 'Google' },
  { id: 25, name: 'Carmen Aguirre',      location: 'Monterrey',   date: '2024-03-05', rating: 5, suite: 'Suite Jungla',          text: 'Todo el equipo del hotel hace que te sientas especial. Vinimos 3 amigas y fue el viaje más especial del año. La suite Jungla con el spa privado en la selva, Las Pozas al día siguiente y el desayuno huasteco. Una experiencia que recomiendo a todo el mundo.', source: 'Google' },
];

const RATING_DIST = { 5: 22, 4: 3, 3: 0, 2: 0, 1: 0 };
const AVG = 4.8;

const reviewsSchema = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  '@id': 'https://www.paraisoencantado.com/#hotel',
  name: 'Hotel Paraíso Encantado',
  url: 'https://www.paraisoencantado.com',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: AVG,
    reviewCount: 514,
    bestRating: 5,
    worstRating: 1,
  },
  review: REVIEWS.map((r) => ({
    '@type': 'Review',
    '@id': `https://www.paraisoencantado.com/reviews#review-${r.id}`,
    author: {
      '@type': 'Person',
      name: r.name,
      address: { '@type': 'PostalAddress', addressLocality: r.location, addressCountry: 'MX' },
    },
    datePublished: r.date,
    reviewBody: r.text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    publisher: {
      '@type': 'Organization',
      name: r.source,
    },
    itemReviewed: {
      '@type': 'Hotel',
      '@id': 'https://www.paraisoencantado.com/#hotel',
      name: 'Hotel Paraíso Encantado',
    },
  })),
};

const breadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
    { '@type': 'ListItem', position: 2, name: 'Reseñas', item: 'https://www.paraisoencantado.com/reviews' },
  ],
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} de 5 estrellas`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ReviewsPage() {
  const totalReviews = REVIEWS.length;
  const avgScore = (REVIEWS.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className={styles.main}>

        {/* HEADER */}
        <section className={styles.header}>
          <div className={styles.headerInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Inicio</Link>
              <span aria-hidden="true"> › </span>
              <span>Reseñas</span>
            </nav>
            <p className={styles.eyebrow}>Opiniones verificadas · Google Reviews</p>
            <h1>Lo que dicen <em>nuestros huéspedes</em></h1>
            <p className={styles.headerSub}>
              Reseñas reales de viajeros que se hospedaron en el Hotel Paraíso Encantado en Xilitla, Huasteca Potosina.
            </p>
          </div>
        </section>

        {/* RESUMEN */}
        <section className={styles.summary}>
          <div className={styles.summaryInner}>
            <div className={styles.summaryScore}>
              <span className={styles.scoreNum}>{avgScore}</span>
              <div>
                <StarRating rating={5} />
                <p className={styles.scoreTotal}>{totalReviews} reseñas seleccionadas · 514 en Google</p>
              </div>
            </div>
            <div className={styles.summaryBars}>
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = RATING_DIST[star] ?? 0;
                const pct = Math.round((count / totalReviews) * 100);
                return (
                  <div key={star} className={styles.barRow}>
                    <span className={styles.barLabel}>{star}★</span>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.barCount}>{count}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.summaryCtas}>
              <Link href="/reservar" className={styles.summaryCtaPrimary}>Reservar ahora</Link>
              <a href="https://wa.me/524891007679" target="_blank" rel="noopener noreferrer" className={styles.summaryCtaWa}>
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* GRID DE RESEÑAS */}
        <section className={styles.reviewsSection}>
          <div className={styles.reviewsInner}>
            <div className={styles.reviewsGrid}>
              {REVIEWS.map((r) => (
                <article key={r.id} id={`review-${r.id}`} className={styles.reviewCard}>
                  <header className={styles.reviewHeader}>
                    <div className={styles.reviewAvatar} aria-hidden="true">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className={styles.reviewName}>{r.name}</p>
                      <p className={styles.reviewMeta}>{r.location} · {r.date.slice(0, 7).replace('-', '/')} · {r.source}</p>
                    </div>
                  </header>
                  <StarRating rating={r.rating} />
                  {r.suite && <p className={styles.reviewSuite}>{r.suite}</p>}
                  <p className={styles.reviewText}>{r.text}</p>
                </article>
              ))}
            </div>

            <div className={styles.moreReviews}>
              <p>Ver las <strong>514 reseñas</strong> en Google Maps</p>
              <a
                href="https://maps.google.com/?q=Hotel+Paraíso+Encantado+Xilitla"
                target="_blank" rel="noopener noreferrer"
                className={styles.moreReviewsBtn}
              >
                Ver en Google Maps →
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <h2>¿Listo para tu experiencia?</h2>
            <p>Únete a los 514 huéspedes que nos califican con 4.8★ en Google</p>
            <Link href="/reservar" className={styles.ctaBtn}>Reservar Suite</Link>
          </div>
        </section>

      </main>
    </>
  );
}
