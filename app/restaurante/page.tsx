import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import styles from './restaurante.module.css';

export const metadata: Metadata = {
  title: 'El Papán Huasteco · Restaurante | Hotel Paraíso Encantado',
  description:
    'Gastronomía auténtica de la Huasteca Potosina. Tortillas de comal, zacahuil, pozole y sabores que no encontrarás en ningún otro lado. Abierto de 8am a 8pm.',
};

const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';

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

export default function RestaurantePage() {
  return (
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
          <p className={styles.eyebrow}>Gastronomía Auténtica</p>
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
              <span className={styles.hoursLabel}>Reservaciones</span>
              <span className={styles.hoursValue}>Abierto a huéspedes y público</span>
            </div>
            <div className={styles.hoursDivider} />
            <div className={styles.hoursItem}>
              <span className={styles.hoursLabel}>Precio promedio</span>
              <span className={styles.hoursValue}>$100 – $200 MXN por persona</span>
            </div>
          </div>
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

      {/* Info adicional */}
      <section className={styles.infoSection}>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🌿</div>
            <h3>Ingredientes Locales</h3>
            <p>
              Trabajamos con productores de Xilitla y la sierra potosina.
              Maíz criollo, frijol negro, chile serrano y hierbas del huerto propio.
            </p>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🫘</div>
            <h3>Recetas Tradicionales</h3>
            <p>
              El zacahuil y el pozole siguen recetas familiares de varias generaciones.
              Sin atajos ni ingredientes industriales.
            </p>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🌄</div>
            <h3>Vista a la Selva</h3>
            <p>
              Las mesas del restaurante tienen vistas directas al jardín y la selva tropical.
              El mejor desayuno es el que se toma escuchando los pájaros.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <p className={styles.eyebrow}>¿Listo para Hospedarte?</p>
        <h2 className={styles.ctaTitle}>
          El desayuno está <em>esperándote</em>
        </h2>
        <p className={styles.ctaDesc}>
          Reserva tu suite y despierta con tortillas de comal y café de olla
          con vista a la Huasteca Potosina.
        </p>
        <div className={styles.ctaButtons}>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaBtn}
          >
            Reservar Suite
          </a>
          <a
            href="https://wa.me/524891007679"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaBtnOutline}
          >
            💬 Preguntar por WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
