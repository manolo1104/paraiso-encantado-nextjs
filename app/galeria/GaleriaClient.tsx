'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, Download, X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import styles from './galeria.module.css';

type Category = 'Todo' | 'Suites' | 'Áreas Comunes' | 'Restaurante' | 'Naturaleza' | 'Experiencias' | 'Videos';

interface GalleryImage {
  src: string;
  alt: string;
  category: Category;
  aspect?: 'tall' | 'wide' | 'square';
}

interface GalleryVideo {
  id: string;
  title: string;
  category: 'Videos';
  startAt?: number;
  thumbnail?: string;
}

const images: GalleryImage[] = [
  // Suites
  { src: '/images/JUNGLA/PORTADA.JPG', alt: 'Suite Jungla con piscina spa privada — Hotel Paraíso Encantado, Xilitla', category: 'Suites', aspect: 'tall' },
  { src: '/images/JUNGLA/DSCF1065.jpg', alt: 'Suite Jungla interior — selva de la Huasteca Potosina', category: 'Suites' },
  { src: '/images/JUNGLA/DSCF1078.jpg', alt: 'Suite Jungla baño y detalles', category: 'Suites' },
  { src: '/images/JUNGLA/DSCF1094.jpg', alt: 'Suite Jungla terraza con vista a la montaña', category: 'Suites' },
  { src: '/images/LINDAVISTA/PORTADA.jpg', alt: 'Suite LindaVista con tina de hidromasaje — Paraíso Encantado', category: 'Suites', aspect: 'wide' },
  { src: '/images/LINDAVISTA/Copia de DSC09539-HDR.jpg', alt: 'Suite LindaVista vista panorámica Xilitla', category: 'Suites' },
  { src: '/images/LINDAVISTA/Copia de DSC09569.jpg', alt: 'Suite LindaVista interior', category: 'Suites' },
  { src: '/images/FLOR DE LIS 1/DSCF1191.jpg', alt: 'Suite Flor de Lis 1 con spa privado al aire libre', category: 'Suites' },
  { src: '/images/FLOR DE LIS 1/DSCF1312.jpeg', alt: 'Suite Flor de Lis 1 detalle interior', category: 'Suites' },
  { src: '/images/FLOR DE LIS 2/PORTADA.jpeg', alt: 'Suite Flor de Lis 2 — terraza panorámica Xilitla', category: 'Suites', aspect: 'tall' },
  { src: '/images/LAJAS/PORTADA.jpg', alt: 'Suite Lajas con sala de estar privada', category: 'Suites' },
  { src: '/images/LAJAS/Copia de DSC09610-HDR.jpg', alt: 'Suite Lajas interior y terraza', category: 'Suites' },
  { src: '/images/HELECHOS 1/PORTADA.jpg', alt: 'Suite Helechos 1 — familiar con 3 camas', category: 'Suites' },
  { src: '/images/HELECHOS 1/Copia de DSC09461-HDR 2.jpg', alt: 'Suite Helechos 1 interior', category: 'Suites' },
  { src: '/images/HELECHOS 2/PORTADA.jpg', alt: 'Suite Helechos 2 — hasta 8 personas', category: 'Suites', aspect: 'wide' },
  { src: '/images/LIRIOS 1/Copia de DSCF1620.jpg', alt: 'Suite Lirios 1 — vista al jardín y selva', category: 'Suites' },
  { src: '/images/LIRIOS 2/PORTADA.jpg', alt: 'Suite Lirios 2 con balcón privado', category: 'Suites' },
  { src: '/images/ORQUIDEAS 2/PORTADA.jpg', alt: 'Suite Orquídeas 2 — cama king y terraza piscina', category: 'Suites' },
  { src: '/images/ORQUIDEAS 3/PORTADA.jpg', alt: 'Suite Orquídeas 3 — vista elevada a la selva', category: 'Suites', aspect: 'tall' },
  { src: '/images/ORQUIDEAS DOBLE/PORTADA.jpg', alt: 'Suite Orquídeas Doble — 2 camas matrimoniales', category: 'Suites' },
  { src: '/images/ORQUIDEAS DOBLE/Copia de DSC09602-HDR.jpg', alt: 'Suite Orquídeas Doble interior y terraza', category: 'Suites' },
  { src: '/images/BROMELIAS 1/PORTADA.jpg', alt: 'Suite Bromelias — acceso directo piscina', category: 'Suites' },
  // Áreas Comunes
  { src: '/images/Areas comunes/DSC09442-HDR.jpg', alt: 'Jardín tropical — Hotel Paraíso Encantado, Xilitla', category: 'Áreas Comunes', aspect: 'wide' },
  { src: '/images/Areas comunes/DSC09447-HDR.jpg', alt: 'Piscina y jardín del hotel — Paraíso Encantado', category: 'Áreas Comunes', aspect: 'tall' },
  { src: '/images/Areas comunes/DSC09452.jpg', alt: 'Terraza exterior con vista a la Huasteca', category: 'Áreas Comunes' },
  { src: '/images/Areas comunes/DSC09453.jpg', alt: 'Vista panorámica del Hotel Paraíso Encantado', category: 'Áreas Comunes' },
  { src: '/images/Areas comunes/DSC09456-HDR.jpg', alt: 'Fachada y piscina — Hotel Paraíso Encantado Xilitla', category: 'Áreas Comunes', aspect: 'wide' },
  { src: '/images/Areas comunes/DSC09461-HDR.jpg', alt: 'Acceso al hotel — selva tropical de Xilitla', category: 'Áreas Comunes' },
  { src: '/images/Areas comunes/DSC09462-HDR.jpg', alt: 'Jardines del hotel entre selva y montaña', category: 'Áreas Comunes', aspect: 'tall' },
  { src: '/images/Areas comunes/DSC09471-HDR.jpg', alt: 'Atardecer en Paraíso Encantado — Huasteca Potosina', category: 'Áreas Comunes' },
  { src: '/images/Areas comunes/DSC09692-2.jpg', alt: 'Área de descanso con vista — Paraíso Encantado', category: 'Áreas Comunes' },
  { src: '/images/Areas comunes/DSC09693.jpg', alt: 'Vista desde el hotel hacia Xilitla', category: 'Áreas Comunes', aspect: 'wide' },
  { src: '/images/Areas comunes/DSC09694.jpg', alt: 'Pasillo exterior entre jardines tropicales', category: 'Áreas Comunes' },
  { src: '/images/Areas comunes/DSC09695.jpg', alt: 'Entorno natural del Hotel Paraíso Encantado', category: 'Áreas Comunes' },
  // Restaurante
  { src: '/images/RESTAURANTE/DSC09679.jpg', alt: 'El Papán Huasteco — restaurante con vista al jardín', category: 'Restaurante', aspect: 'wide' },
  { src: '/images/RESTAURANTE/DSC09682.jpg', alt: 'El Papán Huasteco — ambiente del restaurante en Xilitla', category: 'Restaurante' },
  { src: '/images/RESTAURANTE/DSC09699.jpg', alt: 'El Papán Huasteco — cocina huasteca auténtica', category: 'Restaurante' },
  { src: '/images/RESTAURANTE/DSCF1117.jpg', alt: 'Gastronomía huasteca — tortillas y platillos regionales', category: 'Restaurante', aspect: 'tall' },
  { src: '/images/RESTAURANTE/DSCF1142.jpg', alt: 'El Papán Huasteco — platillos de la Huasteca Potosina', category: 'Restaurante' },
  { src: '/images/RESTAURANTE/DSCF1275.jpg', alt: 'El Papán — mesas con vista a la selva', category: 'Restaurante' },
  { src: '/images/RESTAURANTE/sirviendo-zacahuil.webp', alt: 'Zacahuil tradicional — especialidad de El Papán Huasteco', category: 'Restaurante', aspect: 'wide' },
  // Naturaleza
  { src: '/images/atracciones/jardin-edward-james-aerial.png', alt: 'Jardín de Edward James — Las Pozas, Xilitla', category: 'Naturaleza', aspect: 'tall' },
  { src: '/images/atracciones/ruta-surrealista-pozas.png', alt: 'Las Pozas — Jardín Surrealista de Edward James, Xilitla', category: 'Naturaleza', aspect: 'wide' },
  { src: '/images/atracciones/cascada_de_tamul.jpg', alt: 'Cascada de Tamul — Huasteca Potosina', category: 'Naturaleza' },
  { src: '/images/atracciones/cascadas_de_micos.jpg', alt: 'Cascadas de Micos — San Luis Potosí', category: 'Naturaleza', aspect: 'wide' },
  { src: '/images/atracciones/puente_de_dios.jpg', alt: 'Puente de Dios — aguas turquesas de la Huasteca', category: 'Naturaleza' },
  { src: '/images/atracciones/nacimiento_de_huichihuayan.jpg', alt: 'Nacimiento de Huichihuayán — selva y agua turquesa', category: 'Naturaleza' },
  { src: '/images/atracciones/tamasopo.jpg', alt: 'Cascadas de Tamasopo — joya de la Huasteca Potosina', category: 'Naturaleza', aspect: 'tall' },
  // Experiencias
  { src: '/images/atracciones/sotano_de_las_golondrinas.jpg', alt: 'Sótano de las Golondrinas — Aquismón, San Luis Potosí', category: 'Experiencias', aspect: 'wide' },
  { src: '/images/atracciones/sotano_de_las_huahuas.jpg', alt: 'Sótano de las Huahuastecas — Huasteca Potosina', category: 'Experiencias' },
  { src: '/images/atracciones/cascada_el_salto.jpg', alt: 'Cascada El Salto — tour desde Paraíso Encantado', category: 'Experiencias' },
];

const videos: GalleryVideo[] = [
  { id: 'hD7LbX9Xoqw', title: 'Hotel Paraíso Encantado — Xilitla', category: 'Videos' },
  { id: 'lwSRSc-zdpE', title: 'Las Pozas de Edward James — Xilitla', category: 'Videos' },
  { id: 'v2cc-49uYEU', title: 'Cascadas de la Huasteca Potosina', category: 'Videos', startAt: 16 },
  { id: 'Y8h8CuTNLcA', title: 'Xilitla — La joya de la Huasteca', category: 'Videos' },
  { id: 'i3R_OBwoucw', title: 'Naturaleza y aventura en la Huasteca', category: 'Videos', startAt: 3 },
];

const categories: Category[] = ['Todo', 'Suites', 'Áreas Comunes', 'Restaurante', 'Naturaleza', 'Experiencias', 'Videos'];

const CATEGORY_CTAS: Partial<Record<Category, { text: string; href: string; label: string }>> = {
  Suites: { text: '¿Te enamoraste de alguna suite?', href: '/habitaciones', label: 'Ver disponibilidad y precios →' },
  Restaurante: { text: '¿Se te abrió el apetito?', href: '/restaurante', label: 'Ver menú y reservar mesa →' },
  Naturaleza: { text: '¿Quieres vivir estas experiencias?', href: '/experiencias', label: 'Ver tours desde el hotel →' },
  Experiencias: { text: 'Tours con guía certificado desde el hotel', href: '/experiencias', label: 'Ver todos los tours →' },
};

export default function GaleriaClient() {
  const [active, setActive] = useState<Category>('Todo');
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [playingVideo, setPlayingVideo] = useState<GalleryVideo | null>(null);
  const [shareMsg, setShareMsg] = useState('');

  const showingVideos = active === 'Videos' || active === 'Todo';
  const filtered = active === 'Todo' ? images : active === 'Videos' ? [] : images.filter((i) => i.category === active);
  const lbCta = active !== 'Todo' && active !== 'Videos' ? CATEGORY_CTAS[active] : null;

  const openLightbox = useCallback((idx: number) => {
    setLightbox(idx);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
    document.body.style.overflow = '';
  }, []);

  const prev = useCallback(() => {
    if (lightbox === null) return;
    setLightbox((lightbox - 1 + filtered.length) % filtered.length);
  }, [lightbox, filtered.length]);

  const next = useCallback(() => {
    if (lightbox === null) return;
    setLightbox((lightbox + 1) % filtered.length);
  }, [lightbox, filtered.length]);

  async function handleShare(img: GalleryImage) {
    const url = `https://www.paraisoencantado.com${img.src}`;
    const shareData = {
      title: img.alt,
      text: `${img.alt} — Hotel Paraíso Encantado, Xilitla`,
      url,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg('¡Link copiado!');
      setTimeout(() => setShareMsg(''), 2000);
    }
  }

  function handleDownload(img: GalleryImage) {
    const a = document.createElement('a');
    a.href = img.src;
    a.download = img.alt.replace(/[^a-z0-9]/gi, '-').toLowerCase() + img.src.slice(img.src.lastIndexOf('.'));
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        <p className={styles.eyebrow}>Paraíso Encantado · Xilitla · Huasteca Potosina</p>
        <h1 className={styles.title}>
          Galería de <em>Fotos y Videos</em>
        </h1>
        <p className={styles.subtitle}>
          Explora las 13 suites, el restaurante El Papán Huasteco, las áreas comunes y los destinos naturales de la Huasteca Potosina — todo desde Paraíso Encantado.
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
            {cat === 'Videos' ? '▶ Videos' : cat}
          </button>
        ))}
      </div>

      {/* Grid masonry — fotos */}
      {filtered.length > 0 && (
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
                <span className={styles.itemLabel}>{img.alt.split(' — ')[0]}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* CTA contextual por categoría */}
      {lbCta && filtered.length > 0 && (
        <div className={styles.categoryCta}>
          <p className={styles.categoryCtaText}>{lbCta.text}</p>
          <Link href={lbCta.href} className={styles.categoryCtaBtn}>
            {lbCta.label}
          </Link>
        </div>
      )}

      {/* Videos */}
      {showingVideos && (
        <section className={styles.videosSection} aria-labelledby="videos-heading">
          <h2 id="videos-heading" className={styles.videosTitle}>
            {active === 'Videos' ? 'Videos de Paraíso Encantado y la Huasteca' : 'Videos'}
          </h2>
          <div className={styles.videosGrid}>
            {videos.map((v) => (
              <button
                key={v.id}
                className={styles.videoCard}
                onClick={() => setPlayingVideo(v)}
                aria-label={`Reproducir: ${v.title}`}
              >
                <Image
                  src={`https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`}
                  alt={v.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={styles.videoThumb}
                />
                <div className={styles.videoOverlay}>
                  <div className={styles.playBtn} aria-hidden="true">
                    <Play size={28} strokeWidth={1.5} fill="white" />
                  </div>
                  <p className={styles.videoTitle}>{v.title}</p>
                </div>
              </button>
            ))}
          </div>
          {active === 'Todo' && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button onClick={() => setActive('Videos')} className={styles.categoryCtaBtn}>
                Ver todos los videos →
              </button>
            </div>
          )}
        </section>
      )}

      {/* CTA final */}
      <div className={styles.finalCta}>
        <p className={styles.finalCtaText}>¿Listo para vivir la experiencia?</p>
        <Link href="/reservar" className={styles.finalCtaBtn}>Reservar suite ahora →</Link>
      </div>

      {/* Lightbox fotos */}
      {lightbox !== null && filtered[lightbox] && (
        <div className={styles.lightbox} onClick={closeLightbox} role="dialog" aria-modal="true" aria-label="Galería ampliada">
          <button className={styles.lbClose} onClick={closeLightbox} aria-label="Cerrar"><X size={20} /></button>
          <button className={`${styles.lbArrow} ${styles.lbPrev}`} onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Anterior">
            <ChevronLeft size={32} />
          </button>
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
          <button className={`${styles.lbArrow} ${styles.lbNext}`} onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Siguiente">
            <ChevronRight size={32} />
          </button>
          {/* Acciones del lightbox */}
          <div className={styles.lbActions} onClick={e => e.stopPropagation()}>
            <button className={styles.lbActionBtn} onClick={() => handleShare(filtered[lightbox!])} title="Compartir">
              <Share2 size={16} />
              <span>{shareMsg || 'Compartir'}</span>
            </button>
            <button className={styles.lbActionBtn} onClick={() => handleDownload(filtered[lightbox!])} title="Descargar">
              <Download size={16} />
              <span>Descargar</span>
            </button>
          </div>
          <p className={styles.lbCaption}>{filtered[lightbox].alt}</p>
          <p className={styles.lbCounter}>{lightbox + 1} / {filtered.length}</p>
        </div>
      )}

      {/* Modal de video */}
      {playingVideo && (
        <div className={styles.videoModal} onClick={() => setPlayingVideo(null)} role="dialog" aria-modal="true">
          <button className={styles.lbClose} onClick={() => setPlayingVideo(null)} aria-label="Cerrar"><X size={20} /></button>
          <div className={styles.videoModalContent} onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1&start=${playingVideo.startAt || 0}&rel=0`}
              title={playingVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.videoEmbed}
            />
          </div>
        </div>
      )}
    </main>
  );
}
