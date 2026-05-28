'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './grupos-eventos.module.css';

export type GaleriaImg = { src: string; alt: string; span?: 'wide' | 'normal' };

export default function GaleriaGrupos({ images }: { images: GaleriaImg[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const show = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);
  const next = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length]
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close, next, prev]);

  return (
    <>
      <div className={styles.galeriaGrid}>
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => show(i)}
            data-reveal
            style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}
            className={`${styles.galeriaItem} ${img.span === 'wide' ? styles.galeriaWide : ''}`}
            aria-label={`Ampliar: ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={78}
              style={{ objectFit: 'cover' }}
            />
            <span className={styles.galeriaZoom} aria-hidden="true">+</span>
          </button>
        ))}
      </div>

      {open && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" onClick={close}>
          <button className={styles.lbClose} onClick={close} aria-label="Cerrar">
            <X size={26} strokeWidth={1.8} />
          </button>
          <button
            className={`${styles.lbNav} ${styles.lbPrev}`}
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Anterior"
          >
            <ChevronLeft size={32} strokeWidth={1.8} />
          </button>
          <div className={styles.lbStage} onClick={(e) => e.stopPropagation()}>
            <Image
              key={images[index].src}
              src={images[index].src}
              alt={images[index].alt}
              fill
              sizes="92vw"
              quality={85}
              style={{ objectFit: 'contain' }}
              priority
            />
            <p className={styles.lbCaption}>{images[index].alt}</p>
          </div>
          <button
            className={`${styles.lbNav} ${styles.lbNext}`}
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Siguiente"
          >
            <ChevronRight size={32} strokeWidth={1.8} />
          </button>
        </div>
      )}
    </>
  );
}
