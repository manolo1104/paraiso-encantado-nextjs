'use client';

import { useState, useEffect } from 'react';
import { Star, MapPin, Award, ShieldCheck } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import styles from './SocialProofBar.module.css';

const RATING = 4.6;
const REVIEWS = 519;

const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export default function SocialProofBar() {
  const [ref, inView] = useInView<HTMLElement>();
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const animate = (
      setter: (v: number) => void,
      target: number,
      duration: number,
      delay: number,
      toFixed?: number
    ) => {
      const start = performance.now() + delay;
      const frame = (now: number) => {
        if (now < start) { requestAnimationFrame(frame); return; }
        const t = Math.min(1, (now - start) / duration);
        const value = target * easeOutExpo(t);
        setter(toFixed !== undefined ? parseFloat(value.toFixed(toFixed)) : Math.round(value));
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    animate(setRating, RATING, 1100, 0, 1);
    animate(setReviews, REVIEWS, 1400, 200);
  }, [inView]);

  return (
    <section ref={ref} className={styles.bar} aria-label="Indicadores de calidad">
      <div className={styles.container}>

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <Star size={24} strokeWidth={0} fill="currentColor" />
          </div>
          <div className={styles.content}>
            <strong>{rating.toFixed(1)} / 5</strong>
            <p>{reviews} reseñas verificadas en Google</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <MapPin size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>#1 en Ubicación</strong>
            <p>El más cercano al Jardín de Edward James</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <Award size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>Reserva Directa</strong>
            <p>Sin comisiones · Confirmación instantánea</p>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.item}>
          <div className={styles.icon} aria-hidden="true">
            <ShieldCheck size={24} strokeWidth={1.5} />
          </div>
          <div className={styles.content}>
            <strong>Pago Seguro</strong>
            <p>Plataforma Stripe — encriptación total</p>
          </div>
        </div>

      </div>
    </section>
  );
}
