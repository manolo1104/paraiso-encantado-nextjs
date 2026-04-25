'use client';

import { useState, useEffect } from 'react';

const BOOKINGS = [
  { name: 'María', city: 'CDMX', suite: 'Suite Jungla', hours: 2 },
  { name: 'Carlos', city: 'Monterrey', suite: 'Suite LindaVista', hours: 4 },
  { name: 'Ana', city: 'Guadalajara', suite: 'Flor de Lis', hours: 1 },
  { name: 'Luis', city: 'Querétaro', suite: 'Lirios 1', hours: 3 },
  { name: 'Sofía', city: 'Puebla', suite: 'Helechos 1', hours: 2 },
  { name: 'Diego', city: 'Tijuana', suite: 'Suite Jungla', hours: 5 },
  { name: 'Valentina', city: 'León', suite: 'Suite LindaVista', hours: 1 },
  { name: 'Andrés', city: 'Mérida', suite: 'Orquídeas 2', hours: 6 },
  { name: 'Camila', city: 'San Luis Potosí', suite: 'Lirios 2', hours: 3 },
  { name: 'Roberto', city: 'Tampico', suite: 'Bromelias', hours: 2 },
];

export default function RecentBookingsTicker() {
  const [idx, setIdx] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setIdx((prev) => (prev + 1) % BOOKINGS.length);
        setFadeIn(true);
      }, 350);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const b = BOOKINGS[idx];

  return (
    <>
      <style>{`
        .ticker-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(30,48,18,0.035);
          border: 1px solid rgba(201,169,122,0.22);
          border-radius: 4px;
          padding: 10px 14px;
          font-size: 0.83rem;
          color: #1e3012;
          margin-bottom: 16px;
          transition: opacity 0.35s ease;
        }
        .ticker-icon { font-size: 1.1rem; flex-shrink: 0; }
      `}</style>
      <div
        className="ticker-wrap"
        style={{ opacity: fadeIn ? 1 : 0 }}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="ticker-icon" aria-hidden="true">🏨</span>
        <span>
          <strong>{b.name}</strong> de {b.city} reservó la {b.suite} hace {b.hours}h
        </span>
      </div>
    </>
  );
}
