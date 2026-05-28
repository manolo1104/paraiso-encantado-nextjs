'use client';

import { useRef, type ReactNode, type CSSProperties } from 'react';

/**
 * Inclinación 3D sutil siguiendo el cursor. Sin librerías, sin re-renders:
 * escribe variables CSS directo sobre el nodo con un ref.
 * Se desactiva en táctil y con prefers-reduced-motion.
 */
export default function TiltCard({
  children,
  className,
  max = 5,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const allowed = useRef<boolean>(true);

  const ensureAllowed = () => {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const el = ref.current;
    if (!el || !allowed.current) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
    el.style.setProperty('--tlift', '-4px');
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--tlift', '0px');
  };

  const handleEnter = () => {
    allowed.current = ensureAllowed();
  };

  return (
    <div
      ref={ref}
      className={className}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{
        transform:
          'perspective(900px) translateY(var(--tlift, 0px)) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
