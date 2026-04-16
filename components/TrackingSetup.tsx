'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/track';

const SECTIONS = [
  'hero', 'experiencias', 'habitaciones', 'restaurante',
  'tours', 'testimonios', 'ubicacion', 'faq', 'reservar',
];

export default function TrackingSetup() {
  const pathname = usePathname();

  useEffect(() => {
    // Page view
    track('ver_pagina', { path: pathname, referrer: document.referrer || null });

    // Section visibility
    const viewed = new Set<string>();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const id = (e.target as HTMLElement).id;
        if (e.isIntersecting && id && !viewed.has(id)) {
          viewed.add(id);
          track('ver_seccion', { seccion: id });
        }
      });
    }, { threshold: 0.3 });

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    // Exit
    const startedAt = Date.now();
    const onExit = () => {
      track('salir_pagina', { segundos: Math.round((Date.now() - startedAt) / 1000), path: pathname }, true);
    };
    window.addEventListener('pagehide', onExit);

    return () => {
      obs.disconnect();
      window.removeEventListener('pagehide', onExit);
    };
  }, [pathname]);

  return null;
}
