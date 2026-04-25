'use client';

import { useState, useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

const NAMES = ['Ana', 'Carlos', 'María', 'Luis', 'Sofía', 'Diego', 'Valentina', 'Andrés', 'Camila', 'Roberto'];
const CITIES = ['CDMX', 'Monterrey', 'Guadalajara', 'Querétaro', 'Puebla', 'Tampico', 'León', 'Mérida'];
const SUITES = ['Jungla', 'LindaVista', 'Helechos 1', 'Lirios 1', 'Flor de Lis'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Booking { name: string; city: string; suite: string; hours: number }

export default function ReservationUrgencyBar() {
  const [viewers, setViewers] = useState(3);
  const [scarcity] = useState(() => Math.floor(Math.random() * 4) + 2);
  const [booking, setBooking] = useState<Booking>(() => ({
    name: pick(NAMES), city: pick(CITIES), suite: pick(SUITES), hours: Math.floor(Math.random() * 5) + 1,
  }));
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const timerFired = useRef(false);

  useEffect(() => {
    trackEvent('URGENCY_BAR_VIEW');
    trackEvent('TIMER_STARTED');

    // Rotate live-viewer count every 15–30 s
    const viewInterval = setInterval(() => {
      setViewers(Math.floor(Math.random() * 4) + 2);
    }, (15 + Math.random() * 15) * 1000);

    // Rotate last booking notification every 60 s
    const bookingInterval = setInterval(() => {
      setBooking({
        name: pick(NAMES), city: pick(CITIES), suite: pick(SUITES),
        hours: Math.floor(Math.random() * 5) + 1,
      });
    }, 60_000);

    // Countdown
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!timerFired.current) {
            timerFired.current = true;
            trackEvent('TIMER_EXPIRED');
          }
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(viewInterval);
      clearInterval(bookingInterval);
      clearInterval(countdown);
    };
  }, []);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const currentMonth = new Date().toLocaleString('es-MX', { month: 'long' });

  return (
    <>
      <style>{`
        @keyframes pulseGreen {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }
        .urgency-bar {
          background: linear-gradient(135deg, rgba(201,169,122,0.09), rgba(30,48,18,0.04));
          border-top: 3px solid #c9a97a;
          padding: 9px 16px;
          font-size: 0.78rem;
          color: #1e3012;
        }
        .urgency-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          gap: 6px 14px;
          align-items: center;
          justify-content: center;
        }
        .urgency-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .urgency-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulseGreen 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        .urgency-divider {
          color: #c9a97a;
          opacity: 0.5;
          font-size: 0.9em;
          user-select: none;
        }
        .urgency-timer {
          color: #c9a97a;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
      <div className="urgency-bar" role="status" aria-live="polite">
        <div className="urgency-inner">
          <div className="urgency-item">
            <span className="urgency-dot" aria-hidden="true" />
            <span>{viewers} personas viendo disponibilidad ahora</span>
          </div>
          <span className="urgency-divider" aria-hidden="true">·</span>
          <div className="urgency-item">
            <span aria-hidden="true">⚡</span>
            <span>Solo {scarcity} suites disponibles en {currentMonth}</span>
          </div>
          <span className="urgency-divider" aria-hidden="true">·</span>
          <div className="urgency-item">
            <span aria-hidden="true">✓</span>
            <span>
              <strong>{booking.name}</strong> de {booking.city} reservó {booking.suite} hace {booking.hours}h
            </span>
          </div>
          {timeLeft > 0 && (
            <>
              <span className="urgency-divider" aria-hidden="true">·</span>
              <div className="urgency-item">
                <span aria-hidden="true">⏱</span>
                <span>
                  Precio garantizado:&nbsp;
                  <span className="urgency-timer" aria-label={`${mm} minutos ${ss} segundos`}>
                    {mm}:{ss}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
