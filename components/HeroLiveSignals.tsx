'use client';

import { useState, useEffect } from 'react';

// Número aleatorio de "personas viendo ahora" entre 15 y 35.
function randomViewers() {
  return Math.floor(Math.random() * 21) + 15; // 15..35 inclusive
}

export default function HeroLiveSignals() {
  const [viewers, setViewers] = useState(randomViewers);

  useEffect(() => {
    // Pequeña variación en vivo, siempre dentro de [15, 35].
    const timer = setInterval(() => {
      setViewers((v) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
        return Math.min(35, Math.max(15, v + delta));
      });
    }, 18000 + Math.random() * 14000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{`
        .hero-viewers {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-family: var(--font-jost, sans-serif);
          font-size: 0.8rem;
          letter-spacing: 0.01em;
          color: rgba(250, 248, 245, 0.92);
          background: rgba(0, 0, 0, 0.26);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(201, 169, 122, 0.32);
          border-radius: 20px;
          padding: 6px 14px;
        }
        .hero-viewers strong { font-weight: 600; color: #fff; }
        .hv-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #5fbf6a;
          flex-shrink: 0;
          box-shadow: 0 0 0 0 rgba(95, 191, 106, 0.55);
          animation: hvPulse 2s ease-out infinite;
        }
        @keyframes hvPulse {
          0%   { box-shadow: 0 0 0 0 rgba(95, 191, 106, 0.55); }
          70%  { box-shadow: 0 0 0 7px rgba(95, 191, 106, 0); }
          100% { box-shadow: 0 0 0 0 rgba(95, 191, 106, 0); }
        }
        @media (prefers-reduced-motion: reduce) { .hv-dot { animation: none; } }
      `}</style>
      <p className="hero-viewers" role="status" aria-live="polite">
        <span className="hv-dot" aria-hidden="true" />
        <span><strong>{viewers}</strong> personas viendo ahora</span>
      </p>
    </>
  );
}
