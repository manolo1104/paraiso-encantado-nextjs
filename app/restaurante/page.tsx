import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Leaf, BookOpen, Sun, MessageCircle, Star, UtensilsCrossed } from 'lucide-react';
import styles from './restaurante.module.css';

const BOOKING_URL = '/reservar';
const RESTAURANT_WA = 'https://wa.me/524891255181?text=Hola%2C%20quisiera%20reservar%20una%20mesa%20en%20El%20Pap%C3%A1n%20Huasteco.%20%C2%BFTienen%20disponibilidad%3F';

// ── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'El Papán Huasteco · Restaurante Huasteca | Paraíso Encantado',
  description:
    'Gastronomía auténtica de la Huasteca Potosina. Zacahuil, tortillas de comal, pozole y café de olla. Abierto de 8am a 8pm para huéspedes y público general en Xilitla, SLP.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/restaurante',
  },
  openGraph: {
    title: 'El Papán Huasteco · Restaurante Huasteca | Paraíso Encantado',
    description:
      'Zacahuil, tortillas hechas a mano y café de olla con vista a la selva. Cocina huasteca auténtica en Xilitla, San Luis Potosí.',
    url: 'https://www.paraisoencantado.com/restaurante',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/RESTAURANTE/sirviendo-zacahuil.webp',
        width: 1200,
        height: 675,
        alt: 'El Papán Huasteco — Zacahuil tradicional de la Huasteca Potosina',
      },
    ],
  },
};

// ── Restaurant JSON-LD Schema ─────────────────────────────────────────────────
const restaurantSchema = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'El Papán Huasteco',
  description: 'Restaurante de cocina huasteca tradicional en el Hotel Paraíso Encantado. Especialidad en zacahuil, tortillas de comal, pozole huasteco y café de olla.',
  url: 'https://www.paraisoencantado.com/restaurante',
  telephone: '+524891255181',
  image: 'https://www.paraisoencantado.com/images/RESTAURANTE/sirviendo-zacahuil.webp',
  servesCuisine: ['Mexican', 'Huastec', 'Cocina Huasteca'],
  priceRange: '$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      opens: '08:00',
      closes: '20:00',
    },
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Hotel Paraíso Encantado',
    addressLocality: 'Xilitla',
    addressRegion: 'San Luis Potosí',
    postalCode: '79910',
    addressCountry: 'MX',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 21.383,
    longitude: -99.002,
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.7,
    reviewCount: 312,
    bestRating: 5,
    worstRating: 1,
  },
  hasMenu: 'https://www.paraisoencantado.com/restaurante',
  acceptsReservations: true,
  containedInPlace: {
    '@type': 'LodgingBusiness',
    name: 'Hotel Paraíso Encantado',
    url: 'https://www.paraisoencantado.com',
  },
};

// ── Contenido ─────────────────────────────────────────────────────────────────

const menuHighlights = [
  {
    category: 'Desayunos Huastecos',
    items: [
      { name: 'Zacahuil', desc: 'Tamal gigante de masa gruesa relleno de cerdo en adobo rojo, envuelto en hoja de plátano. Especialidad de la casa.', price: '$120' },
      { name: 'Enchiladas Huastecas', desc: 'Tortillas de maíz enchiladas con salsa de jitomate, frijoles y queso fresco. Con huevo al gusto.', price: '$90' },
      { name: 'Desayuno Completo', desc: 'Huevos al gusto, frijoles negros de olla, tortillas hechas a mano en comal, café de olla y jugo natural.', price: '$130' },
      { name: 'Tamales de Elote', desc: 'Tamales dulces y tiernos de elote fresco, servidos con crema y queso. Receta de temporada.', price: '$80' },
    ],
  },
  {
    category: 'Platillos Principales',
    items: [
      { name: 'Pozole Rojo Huasteco', desc: 'Caldo rojo con maíz cacahuazintle, cerdo y hierbas del monte. Servido con tostadas, cebolla y orégano.', price: '$165' },
      { name: 'Bocoles Rellenos', desc: 'Tortillas gruesas de masa rellenas de frijoles y queso, cocinadas en comal de barro. Sabor auténtico de la región.', price: '$110' },
      { name: 'Caldo de Res Huasteco', desc: 'Caldo generoso de res con elote, chayote, papa y verduras del huerto. Reconfortante y nutritivo.', price: '$145' },
      { name: 'Pollo en Salsa Verde', desc: 'Pollo de rancho en salsa de tomate verde con chile serrano y epazote. Servido con arroz y frijoles.', price: '$160' },
    ],
  },
  {
    category: 'Antojitos & Bebidas',
    items: [
      { name: 'Garnachas Huastecas', desc: 'Tortillas fritas con frijoles, carne de res deshebrada y salsa verde. El antojito más solicitado del restaurante.', price: '$85' },
      { name: 'Café de Olla', desc: 'Café negro preparado en olla de barro con canela y piloncillo. Aroma inconfundible de la sierra potosina.', price: '$35' },
      { name: 'Agua de Tamarindo', desc: 'Agua fresca de tamarindo con piloncillo, preparada con fruta de la región. Refrescante y natural.', price: '$40' },
      { name: 'Limonada de Hierbabuena', desc: 'Limonada fresca con hierbabuena del jardín del hotel. Perfecta después de un tour por la Huasteca.', price: '$45' },
    ],
  },
];

const restaurantImages = [
  '/images/RESTAURANTE/DSC09679.jpg',
  '/images/RESTAURANTE/DSC09682.jpg',
  '/images/RESTAURANTE/DSC09699.jpg',
  '/images/RESTAURANTE/DSCF1117.jpg',
  '/images/RESTAURANTE/DSCF1142.jpg',
  '/images/RESTAURANTE/DSCF1275.jpg',
];

// Reseñas específicas del restaurante (estilo Testimonials de homepage)
const restaurantReviews = [
  {
    name: 'Claudia Vega',
    location: 'Ciudad de México',
    date: 'Abril 2025',
    rating: 5,
    text: 'El zacahuil es una experiencia en sí mismo. Nunca había comido algo así — masa gruesa, el adobo rojo con un aroma a hoja de plátano que no olvidaré. Nos quedamos a desayunar dos días seguidos solo por eso.',
    badge: 'Visita verificada',
  },
  {
    name: 'Jorge Ramírez',
    location: 'Monterrey, N.L.',
    date: 'Enero 2025',
    rating: 5,
    text: 'El desayuno completo con tortillas de comal me hizo entender por qué la gente dice que la comida sabe diferente en las montañas. El café de olla llegó a la mesa en olla de barro, caliente y con canela. Perfecto.',
    badge: 'Estancia verificada',
  },
  {
    name: 'Marcela Fuentes',
    location: 'Guadalajara, Jal.',
    date: 'Marzo 2025',
    rating: 5,
    text: 'Vine solo a comer, no soy huésped del hotel, y fue una de las mejores decisiones del viaje. Las enchiladas huastecas y el pozole rojo están a otro nivel. El ambiente con vista al jardín es increíble.',
    badge: 'Visita verificada',
  },
  {
    name: 'Rodrigo Castellanos',
    location: 'Querétaro, Qro.',
    date: 'Febrero 2025',
    rating: 5,
    text: 'Las garnachas huastecas y el agua de tamarindo son imprescindibles. El servicio es cálido y los precios muy accesibles para la calidad que ofrecen. Si vas a Xilitla, come aquí aunque no te hospedes.',
    badge: 'Visita verificada',
  },
];

// ── Componente ────────────────────────────────────────────────────────────────
export default function RestaurantePage() {
  return (
    <>
      {/* Restaurant JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />

      <main className={styles.main}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <span>Restaurante</span>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroImageGrid}>
            {restaurantImages.slice(0, 3).map((src, i) => (
              <div key={i} className={styles.heroImage}>
                <Image
                  src={src}
                  alt={`El Papán Huasteco — foto ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.heroImg}
                />
              </div>
            ))}
          </div>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Gastronomía Auténtica · Xilitla, SLP</p>
            <h1 className={styles.heroTitle}>
              El Papán<br /><em>Huasteco</em>
            </h1>
            <p className={styles.heroDesc}>
              Sabores que no encuentras en ningún otro lado. Tortillas hechas a mano en comal,
              zacahuil de receta familiar y café de olla desde que amanece la sierra.
              Cocina huasteca sin concesiones, en el corazón del hotel.
            </p>
            <div className={styles.hoursCard}>
              <div className={styles.hoursItem}>
                <span className={styles.hoursLabel}>Horario</span>
                <span className={styles.hoursValue}>8:00 AM – 8:00 PM</span>
              </div>
              <div className={styles.hoursDivider} />
              <div className={styles.hoursItem}>
                <span className={styles.hoursLabel}>Abierto a</span>
                <span className={styles.hoursValue}>Huéspedes y público general</span>
              </div>
              <div className={styles.hoursDivider} />
              <div className={styles.hoursItem}>
                <span className={styles.hoursLabel}>Precio promedio</span>
                <span className={styles.hoursValue}>$100 – $200 MXN / persona</span>
              </div>
            </div>

            {/* Botón de reservar mesa por WhatsApp — prominente en hero */}
            <a
              href={RESTAURANT_WA}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.reserveTableBtn}
            >
              <UtensilsCrossed size={16} strokeWidth={1.5} />
              Reservar Mesa por WhatsApp
            </a>
            <p className={styles.reserveTableNote}>
              Tel: +52 489 125 5181 · Respuesta en menos de 1 hora
            </p>
          </div>
        </section>

        {/* Zacahuil feature — imagen grande del platillo estrella */}
        <section className={styles.zacahuilSection}>
          <div className={styles.zacahuilImageWrap}>
            <Image
              src="/images/RESTAURANTE/sirviendo-zacahuil.webp"
              alt="Sirviendo zacahuil tradicional — El Papán Huasteco, Xilitla"
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              className={styles.zacahuilImg}
            />
            <div className={styles.zacahuilOverlay} aria-hidden="true" />
            <div className={styles.zacahuilBadge}>
              <span>Especialidad</span>
              <span className={styles.zacahuilBadgeName}>Zacahuil</span>
            </div>
          </div>
          <div className={styles.zacahuilText}>
            <p className={styles.eyebrow}>El plato más representativo</p>
            <h2 className={styles.zacahuilTitle}>
              El Zacahuil — <em>el tamal más grande de México</em>
            </h2>
            <p className={styles.zacahuilDesc}>
              El zacahuil es el emblema de la cocina huasteca. Un tamal de masa gruesa, relleno de carne de cerdo
              en adobo rojo y envuelto en hojas de plátano, que se cuece durante horas en horno de leña.
              Una sola porción puede pesar varios kilos. En El Papán lo preparamos con receta de generaciones.
            </p>
            <p className={styles.zacahuilDesc}>
              Solo se sirve cuando está disponible — pregunta en recepción el día anterior si quieres asegurarte tu porción.
            </p>
            <a
              href={RESTAURANT_WA}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.zacahuilWaBtn}
            >
              <MessageCircle size={15} strokeWidth={1.5} />
              Preguntar disponibilidad de Zacahuil
            </a>
          </div>
        </section>

        {/* Galería extra */}
        <section className={styles.gallerySection}>
          <div className={styles.galleryGrid}>
            {restaurantImages.slice(3).map((src, i) => (
              <div key={i} className={styles.galleryItem}>
                <Image
                  src={src}
                  alt={`El Papán Huasteco — ambiente ${i + 4}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.galleryImg}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Menú */}
        <section className={styles.menuSection}>
          <div className={styles.menuHeader}>
            <p className={styles.eyebrow}>Nuestra Carta</p>
            <h2 className={styles.menuTitle}>
              Sabores de la <em>Huasteca</em>
            </h2>
            <p className={styles.menuSubtitle}>
              Cada platillo refleja la tradición culinaria de San Luis Potosí.
              Ingredientes locales, recetas de generaciones.
            </p>
          </div>

          {menuHighlights.map((category) => (
            <div key={category.category} className={styles.menuCategory}>
              <h3 className={styles.categoryTitle}>{category.category}</h3>
              <div className={styles.menuGrid}>
                {category.items.map((item) => (
                  <div key={item.name} className={styles.menuItem}>
                    <div className={styles.menuItemHeader}>
                      <h4 className={styles.menuItemName}>{item.name}</h4>
                      <span className={styles.menuItemPrice}>{item.price}</span>
                    </div>
                    <p className={styles.menuItemDesc}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Info cards */}
        <section className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}><Leaf size={28} strokeWidth={1.5} /></div>
              <h3>Ingredientes Locales</h3>
              <p>
                Trabajamos con productores de Xilitla y la sierra potosina.
                Maíz criollo, frijol negro, chile serrano y hierbas del huerto propio.
              </p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}><BookOpen size={28} strokeWidth={1.5} /></div>
              <h3>Recetas Tradicionales</h3>
              <p>
                El zacahuil y el pozole siguen recetas familiares de varias generaciones.
                Sin atajos ni ingredientes industriales.
              </p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}><Sun size={28} strokeWidth={1.5} /></div>
              <h3>Vista a la Selva</h3>
              <p>
                Las mesas del restaurante tienen vistas directas al jardín y la selva tropical.
                El mejor desayuno es el que se toma escuchando los pájaros.
              </p>
            </div>
          </div>
        </section>

        {/* ── Reseñas del restaurante ──────────────────────────────────────── */}
        <section className={styles.reviewsSection} aria-labelledby="reviews-heading">
          <div className={styles.reviewsHeader}>
            <p className={styles.eyebrow}>Lo que dicen nuestros comensales</p>
            <h2 id="reviews-heading" className={styles.reviewsTitle}>
              Reseñas del <em>Restaurante</em>
            </h2>
            <div className={styles.ratingOverall}>
              <span className={styles.ratingStars}>★★★★★</span>
              <span className={styles.ratingNum}>4.7</span>
              <span className={styles.ratingCount}>/ 312 reseñas en Google</span>
            </div>
          </div>
          <div className={styles.reviewsGrid}>
            {restaurantReviews.map((r) => (
              <article key={r.name} className={styles.reviewCard}>
                <div className={styles.reviewTop}>
                  <div className={styles.reviewAvatar} aria-hidden="true">
                    {r.name.charAt(0)}
                  </div>
                  <div className={styles.reviewMeta}>
                    <span className={styles.reviewName}>{r.name}</span>
                    <span className={styles.reviewLocation}>{r.location}</span>
                  </div>
                  <div className={styles.reviewStars} aria-label={`${r.rating} estrellas`}>
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={12} strokeWidth={0} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className={styles.reviewText}>"{r.text}"</p>
                <div className={styles.reviewFooter}>
                  <span className={styles.reviewBadge}>{r.badge}</span>
                  <span className={styles.reviewDate}>{r.date}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection}>
          <p className={styles.eyebrow}>¿Listo para visitarnos?</p>
          <h2 className={styles.ctaTitle}>
            Tu mesa está <em>esperándote</em>
          </h2>
          <p className={styles.ctaDesc}>
            Abierto todos los días de 8:00 AM a 8:00 PM para huéspedes y público en general.
            Reserva tu mesa o tu suite y despierta con tortillas de comal y café de olla
            con vista a la Huasteca Potosina.
          </p>
          <div className={styles.ctaButtons}>
            <a
              href={RESTAURANT_WA}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtn}
            >
              <UtensilsCrossed size={16} strokeWidth={1.5} />
              Reservar Mesa por WhatsApp
            </a>
            <a
              href={BOOKING_URL}
              className={styles.ctaBtnOutline}
            >
              Reservar Suite con Desayuno
            </a>
          </div>
          <p className={styles.ctaContact}>
            También puedes llamarnos: <a href="tel:+524891255181" className={styles.ctaPhone}>+52 489 125 5181</a>
          </p>
        </section>
      </main>
    </>
  );
}
