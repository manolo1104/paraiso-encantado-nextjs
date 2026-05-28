'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Cuenta hacia arriba cuando entra en vista. Conserva sufijos no numéricos
 * ("4.8★", "5 min"). Respeta prefers-reduced-motion (muestra el valor final).
 */
export default function StatCounter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string>(value);

  // Separa el número inicial del resto ("4.8★" -> 4.8 + "★").
  const match = value.match(/^([\d.,]+)(.*)$/);
  const target = match ? parseFloat(match[1].replace(',', '')) : null;
  const suffix = match ? match[2] : '';
  const decimals = match && match[1].includes('.') ? 1 : 0;

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }

    setDisplay(`0${suffix}`);
    let raf = 0;
    let started = false;
    const duration = 1100;

    const animate = (start: number) => {
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
        const current = (target * eased).toFixed(decimals);
        setDisplay(`${current}${suffix}`);
        if (t < 1) raf = requestAnimationFrame(step);
        else setDisplay(value);
      };
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          animate(performance.now());
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
