'use client';

import { useState, useEffect } from 'react';
import { Zap, Check } from 'lucide-react';

const NAMES  = ['Ana', 'Carlos', 'María', 'Luis', 'Sofía', 'Diego', 'Valentina', 'Andrés', 'Camila', 'Roberto'];
const CITIES = ['CDMX', 'Monterrey', 'Guadalajara', 'Querétaro', 'Puebla', 'Tampico', 'León', 'Mérida'];
const SUITES = ['Jungla', 'LindaVista', 'Helechos 1', 'Lirios 1', 'Flor de Lis'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export default function HeroLiveSignals() {
  const [viewers, setViewers]   = useState(3);
  const [scarcity]              = useState(() => Math.floor(Math.random() * 5) + 2);
  const [booking, setBooking]   = useState(() => ({
    name: pick(NAMES), city: pick(CITIES), suite: pick(SUITES),
    hours: Math.floor(Math.random() * 4) + 1,
  }));
  const [bookFade, setBookFade] = useState(true);
  const currentMonth = new Date().toLocaleString('es-MX', { month: 'long' });

  useEffect(() => {
    const viewerTimer = setInterval(() => {
      setViewers(Math.floor(Math.random() * 4) + 2);
    }, (15 + Math.random() * 15) * 1000);

    const bookingTimer = setInterval(() => {
      setBookFade(false);
      setTimeout(() => {
        setBooking({
          name: pick(NAMES), city: pick(CITIES), suite: pick(SUITES),
          hours: Math.floor(Math.random() * 4) + 1,
        });
        setBookFade(true);
      }, 400);
    }, 60_000);

    return () => { clearInterval(viewerTimer); clearInterval(bookingTimer); };
  }, []);

  return (
    <>
      <style>{`
        .hero-signals {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin: 14px 0 18px;
          align-items: flex-start;
        }
        @media (min-width: 640px) {
          .hero-signals {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px 16px;
          }
        }
        .hs-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.78rem;
          color: rgba(250,248,245,0.88);
          background: rgba(0,0,0,0.28);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(201,169,122,0.25);
          border-radius: 20px;
          padding: 5px 12px;
          white-space: nowrap;
        }
        .hs-item svg { flex-shrink: 0; }
        .hs-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          animation: hsPulse 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes hsPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.7); }
        }
        .hs-booking { transition: opacity 0.4s ease; }
      `}</style>
      <div className="hero-signals" role="status" aria-live="polite">
        <div className="hs-item">
          <span className="hs-dot" aria-hidden="true" />
          <span><strong>{viewers}</strong> personas viendo ahora</span>
        </div>
        <div className="hs-item">
          <Zap size={12} strokeWidth={2} color="#c9a97a" aria-hidden="true" />
          <span>Solo <strong>{scarcity} suites</strong> para {currentMonth}</span>
        </div>
        <div className="hs-item hs-booking" style={{ opacity: bookFade ? 1 : 0 }}>
          <Check size={12} strokeWidth={2.5} color="#22c55e" aria-hidden="true" />
          <span><strong>{booking.name}</strong> de {booking.city} reservó {booking.suite} hace {booking.hours}h</span>
        </div>
      </div>
    </>
  );
}
