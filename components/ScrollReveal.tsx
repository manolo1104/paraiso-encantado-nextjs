'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Observador global de animaciones de entrada.
 * Monta una sola vez en el layout; al cambiar de ruta vuelve a escanear el DOM.
 *
 * Uso en cualquier Server Component:
 *   <section data-reveal>…</section>
 *   <div data-reveal style={{ '--reveal-delay': '90ms' }}>…</div>   // escalonado
 *   <div data-reveal="blur">…</div>                                  // variante con desenfoque
 *
 * Respeta prefers-reduced-motion (revela todo al instante) y degrada sin IntersectionObserver.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let observer: IntersectionObserver | null = null;

    // Esperar un frame para que el DOM de la nueva ruta esté pintado.
    const raf = window.requestAnimationFrame(() => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)')
      );
      if (els.length === 0) return;

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !('IntersectionObserver' in window)) {
        els.forEach((el) => el.classList.add('is-visible'));
        return;
      }

      observer = new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      );

      els.forEach((el) => observer!.observe(el));
    });

    return () => {
      window.cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
