'use client';

import { useEffect, useState } from 'react';
import styles from './Hero.module.css';

// Carga el iframe de Vimeo solo después de window.load para no bloquear LCP.
export default function VideoBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (document.readyState === 'complete') {
      const t = setTimeout(() => setReady(true), 1500);
      return () => clearTimeout(t);
    }
    const onLoad = () => {
      const t = setTimeout(() => setReady(true), 1500);
      return () => clearTimeout(t);
    };
    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);

  if (!ready) return null;

  return (
    <div className={styles.videoBackground} aria-hidden="true">
      <iframe
        src="https://player.vimeo.com/video/998914372?background=1&autoplay=1&loop=1&muted=1&byline=0&title=0&dnt=1"
        className={styles.videoIframe}
        allow="autoplay; fullscreen"
        title="Video de fondo — Hotel Paraíso Encantado"
      />
    </div>
  );
}
