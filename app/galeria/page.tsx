'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './galeria.module.css';

type Category = 'Todo' | 'Suites' | 'Restaurante' | 'Naturaleza' | 'Experiencias';

interface GalleryImage {
  src: string;
  alt: string;
  category: Category;
  aspect?: 'tall' | 'wide' | 'square';
}

const images: GalleryImage[] = [
  // Suites
  { src: '/images/JUNGLA/PORTADA.JPG', alt: 'Suite Jungla — Paraíso Encantado', category: 'Suites', aspect: 'tall' },
  { src: '/images/JUNGLA/DSCF1065.jpg', alt: 'Suite Jungla interior', category: 'Suites' },
  { src: '/images/JUNGLA/DSCF1078.jpg', alt: 'Suite Jungla baño', category: 'Suites' },
  { src: '/images/JUNGLA/DSCF1094.jpg', alt: 'Suite Jungla terraza', category: 'Suites' },
  { src: '/images/LINDAVISTA/PORTADA.jpg', alt: 'Suite LindaVista', category: 'Suites', aspect: 'wide' },
  { src: '/images/LINDAVISTA/Copia de DSC09539-HDR.jpg', alt: 'Suite LindaVista vista panorámica', category: 'Suites' },
  { src: '/images/LINDAVISTA/Copia de DSC09569.jpg', alt: 'Suite LindaVista interior', category: 'Suites' },
  { src: '/images/FLOR DE LIS 1/DSCF1191.jpg', alt: 'Suite Flor de Lis 1', category: 'Suites' },
  { src: '/images/FLOR DE LIS 1/DSCF1312.jpeg', alt: 'Suite Flor de Lis 1 detalle', category: 'Suites' },
  { src: '/images/FLOR DE LIS 2/PORTADA.jpeg', alt: 'Suite Flor de Lis 2', category: 'Suites', aspect: 'tall' },
  { src: '/images/LAJAS/PORTADA.jpg', alt: 'Suite Lajas', category: 'Suites' },
  { src: '/images/LAJAS/Copia de DSC09610-HDR.jpg', alt: 'Suite Lajas interior', category: 'Suites' },
  { src: '/images/HELECHOS 1/PORTADA.jpg', alt: 'Suite Helechos 1', category: 'Suites' },
  { src: '/images/HELECHOS 1/Copia de DSC09461-HDR 2.jpg', alt: 'Suite Helechos 1 interior', category: 'Suites' },
  { src: '/images/HELECHOS 2/PORTADA.jpg', alt: 'Suite Helechos 2', category: 'Suites', aspect: 'wide' },
  { src: '/images/LIRIOS 1/Copia de DSCF1620.jpg', alt: 'Suite Lirios 1', category: 'Suites' },
  { src: '/images/LIRIOS 2/PORTADA.jpg', alt: 'Suite Lirios 2', category: 'Suites' },
  { src: '/images/ORQUIDEAS 2/PORTADA.jpg', alt: 'Suite Orquídeas 2', category: 'Suites' },
  { src: '/images/ORQUIDEAS 3/PORTADA.jpg', alt: 'Suite Orquídeas 3', category: 'Suites', aspect: 'tall' },
  { src: '/images/ORQUIDEAS DOBLE/PORTADA.jpg', alt: 'Suite Orquídeas Doble', category: 'Suites' },
  { src: '/images/ORQUIDEAS DOBLE/Copia de DSC09602-HDR.jpg', alt: 'Suite Orquídeas Doble interior', category: 'Suites' },
  { src: '/images/BROMELIAS 1/PORTADA.jpg', alt: 'Suite Bromelias 1', category: 'Suites' },
  // Restaurante
  { src: '/images/RESTAURANTE/DSC09679.jpg', alt: 'El Papán Huasteco — restaurante', category: 'Restaurante', aspect: 'wide' },
  { src: '/images/RESTAURANTE/DSC09682.jpg', alt: 'El Papán Huasteco — ambiente', category: 'Restaurante' },
  { src: '/images/RESTAURANTE/DSC09699.jpg', alt: 'El Papán Huasteco — cocina', category: 'Restaurante' },
  { src: '/images/RESTAURANTE/DSCF1117.jpg', alt: 'Gastronomía huasteca', category: 'Restaurante', aspect: 'tall' },
  { src: '/images/RESTAURANTE/DSCF1142.jpg', alt: 'El Papán — platillos', category: 'Restaurante' },
  { src: '/images/RESTAURANTE/DSCF1275.jpg', alt: 'El Papán Huasteco — mesas', category: 'Restaurante' },
  // Naturaleza
  { src: '/images/atracciones/jardin_de_edward_james.jpg', alt: 'Jardín de Edward James — Las Pozas', category: 'Naturaleza', aspect: 'tall' },
  { src: '/images/atracciones/cascada_de_tamul.jpg', alt: 'Cascada de Tamul — Huasteca Potosina', category: 'Naturaleza' },
  { src: '/images/atracciones/cascadas_de_micos.jpg', alt: 'Cascadas de Micos', category: 'Naturaleza', aspect: 'wide' },
  { src: '/images/atracciones/puente_de_dios.jpg', alt: 'Puente de Dios', category: 'Naturaleza' },
  { src: '/images/atracciones/nacimiento_de_huichihuayan.jpg', alt: 'Nacimiento de Huichihuayán', category: 'Naturaleza' },
  { src: '/images/atracciones/tamasopo.jpg', alt: 'Cascadas de Tamasopo', category: 'Naturaleza', aspect: 'tall' },
  // Experiencias
  { src: '/images/atracciones/sotano_de_las_golondrinas.jpg', alt: 'Sótano de las Golondrinas', category: 'Experiencias', aspect: 'wide' },
  { src: '/images/atracciones/sotano_de_las_huahuas.jpg', alt: 'Sótano de las Huahuas', category: 'Experiencias' },
  { src: '/images/atracciones/cascada_el_salto.jpg', alt: 'Cascada El Salto', category: 'Experiencias' },
];

const categories: Category[] = ['Todo', 'Suites', 'Restaurante', 'Naturaleza', 'Experiencias'];

export default function GaleriaPage() {
  const [active, setActive] = useState<Category>('Todo');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = active === 'Todo' ? images : images.filter((i) => i.category === active);

  function openLightbox(idx: number) {
    setLightbox(idx);
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    setLightbox(null);
    document.body.style.overflow = '';
  }

  function prev() {
    if (lightbox === null) return;
    setLightbox((lightbox - 1 + filtered.length) % filtered.length);
  }

  function next() {
    if (lightbox === null) return;
    setLightbox((lightbox + 1) % filtered.length);
  }

  return (
    <main className={styles.main}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/">Inicio</Link>
        <span> / </span>
        <span>Galería</span>
      </nav>

      {/* Hero */}
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Paraíso Encantado · Xilitla</p>
        <h1 className={styles.title}>
          Galería de <em>Fotos</em>
        </h1>
        <p className={styles.subtitle}>
          Explora las suites, el restaurante, la naturaleza y las experiencias de la Huasteca Potosina.
        </p>
      </div>

      {/* Filtros */}
      <div className={styles.filters} role="tablist" aria-label="Filtrar por categoría">
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={active === cat}
            className={`${styles.filter} ${active === cat ? styles.filterActive : ''}`}
            onClick={() => setActive(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid masonry */}
      <div className={styles.masonry}>
        {filtered.map((img, idx) => (
          <button
            key={img.src}
            className={`${styles.item} ${img.aspect === 'tall' ? styles.itemTall : img.aspect === 'wide' ? styles.itemWide : ''}`}
            onClick={() => openLightbox(idx)}
            aria-label={`Ver ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={styles.itemImg}
            />
            <div className={styles.itemOverlay}>
              <span className={styles.itemLabel}>{img.alt}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className={styles.lightbox} onClick={closeLightbox} role="dialog" aria-modal="true" aria-label="Galería ampliada">
          <button className={styles.lbClose} onClick={closeLightbox} aria-label="Cerrar">✕</button>
          <button className={`${styles.lbArrow} ${styles.lbPrev}`} onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Anterior">‹</button>
          <div className={styles.lbImageWrap} onClick={(e) => e.stopPropagation()}>
            <Image
              src={filtered[lightbox].src}
              alt={filtered[lightbox].alt}
              fill
              sizes="100vw"
              className={styles.lbImage}
              priority
            />
          </div>
          <button className={`${styles.lbArrow} ${styles.lbNext}`} onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Siguiente">›</button>
          <p className={styles.lbCaption}>{filtered[lightbox].alt}</p>
          <p className={styles.lbCounter}>{lightbox + 1} / {filtered.length}</p>
        </div>
      )}
    </main>
  );
}
