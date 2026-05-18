'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './RestaurantGallery.module.css';

interface Props {
  images: { src: string; alt: string }[];
}

export default function RestaurantGallery({ images }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement;
    if (child) el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(el.children).indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { root: el, threshold: 0.6 }
    );
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.wrapper}>
      {/* Carousel track */}
      <div className={styles.track} ref={scrollRef} aria-label="Galería del restaurante">
        {images.map((img, i) => (
          <div key={img.src} className={styles.slide} aria-hidden={i !== activeIndex}>
            <Image
              src={img.src} alt={img.alt}
              fill sizes="(max-width: 768px) 100vw, 33vw"
              quality={78}
              style={{ objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>

      {/* Dots — solo visible en mobile */}
      <div className={styles.dots} role="tablist" aria-label="Navegación de galería">
        {images.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Foto ${i + 1}`}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>

      {/* Grid — solo visible en desktop */}
      <div className={styles.grid} aria-label="Galería del restaurante">
        {images.map((img) => (
          <div key={img.src} className={styles.gridItem}>
            <Image
              src={img.src} alt={img.alt}
              fill sizes="33vw"
              quality={78}
              style={{ objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
