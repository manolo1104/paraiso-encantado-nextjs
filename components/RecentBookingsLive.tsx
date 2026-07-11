'use client';

import { useEffect, useState } from 'react';
import { X, BadgeCheck } from 'lucide-react';

export interface LiveBookingItem {
  name: string;
  room: string;
  agoHours: number;
}

function ago(h: number): string {
  if (h < 24) return `hace ${Math.max(1, Math.round(h))} h`;
  const d = Math.round(h / 24);
  return `hace ${d} día${d > 1 ? 's' : ''}`;
}

// Toast rotatorio de reservas REALES (anonimizadas) — datos de /api/social-proof.
// Aparece a los 7 s de cargar, visible 6 s, pausa ~7 s, cicla. Cerrable.
export default function RecentBookingsLive({ items }: { items: LiveBookingItem[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (items.length < 3 || dismissed) return;
    const tShow = setTimeout(() => setVisible(true), 7000);
    const tHide = setTimeout(() => setVisible(false), 7000 + 6000);
    const tNext = setTimeout(() => setIdx(i => (i + 1) % items.length), 7000 + 6000 + 400);
    return () => { clearTimeout(tShow); clearTimeout(tHide); clearTimeout(tNext); };
  }, [items, idx, dismissed]);

  if (items.length < 3 || dismissed) return null;
  const item = items[idx];

  return (
    <>
      <style>{`
        .rbl-toast {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 850;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fffefb;
          border: 1px solid #d8e4d0;
          border-left: 3px solid #2d5a27;
          border-radius: 10px;
          padding: 11px 14px;
          max-width: 320px;
          box-shadow: 0 8px 30px rgba(26, 46, 26, 0.18);
          font-family: var(--font-jost), sans-serif;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.35s ease, transform 0.35s ease;
          pointer-events: none;
        }
        .rbl-toast.rbl-visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .rbl-icon { color: #2d5a27; flex-shrink: 0; }
        .rbl-text { min-width: 0; }
        .rbl-line { font-size: 0.8rem; color: #1a2e1a; line-height: 1.35; }
        .rbl-line strong { font-weight: 600; }
        .rbl-sub { font-size: 0.7rem; color: #6a7a6a; margin-top: 1px; }
        .rbl-close {
          background: none; border: none; cursor: pointer;
          color: #9aa89a; padding: 2px; flex-shrink: 0;
          display: flex; align-items: center;
        }
        .rbl-close:hover { color: #1a2e1a; }
        @media (max-width: 800px) {
          .rbl-toast { left: 12px; max-width: 280px; }
          /* No tapar la barra fija de reserva en móvil */
          body[data-pe-booking-bar='1'] .rbl-toast { bottom: 96px; }
        }
      `}</style>
      <div className={`rbl-toast ${visible ? 'rbl-visible' : ''}`} role="status" aria-live="polite">
        <BadgeCheck size={20} strokeWidth={1.6} className="rbl-icon" aria-hidden="true" />
        <div className="rbl-text">
          <div className="rbl-line"><strong>{item.name}</strong> reservó <strong>{item.room}</strong></div>
          <div className="rbl-sub">{ago(item.agoHours)} · Reserva verificada</div>
        </div>
        <button className="rbl-close" onClick={() => setDismissed(true)} aria-label="Cerrar avisos de reservas">
          <X size={13} />
        </button>
      </div>
    </>
  );
}
