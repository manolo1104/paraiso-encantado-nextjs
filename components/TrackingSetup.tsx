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

    // ── Todo clic a WhatsApp, venga de donde venga ────────────────────────
    // Hay enlaces a wa.me repartidos en ~15 archivos (restaurante, grupos y
    // eventos, luna de miel, familias, blog, suites…) y casi ninguno medía.
    // Un solo detector en fase de captura los cubre todos, incluidos los que
    // se agreguen después, sin tener que acordarse de poner el onClick.
    // El botón flotante y la barra móvil sí traen el suyo, así que se marcan
    // con data-wa-medido para no contarlos dos veces.
    const onClicEnlace = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const enlace = el?.closest?.('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
      if (!(enlace instanceof HTMLAnchorElement)) return;
      if (enlace.dataset.waMedido === '1') return;

      // El número distingue a quién le escriben: el hotel, el restaurante o tours.
      const numero = enlace.getAttribute('href')?.match(/(?:wa\.me\/|phone=)(\d+)/)?.[1] ?? null;
      track('clic_whatsapp', {
        origen: 'enlace_en_pagina',
        numero,
        texto: enlace.textContent?.trim().slice(0, 40) || null,
      }, true);
    };
    document.addEventListener('click', onClicEnlace, true);

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
      document.removeEventListener('click', onClicEnlace, true);
    };
  }, [pathname]);

  return null;
}
