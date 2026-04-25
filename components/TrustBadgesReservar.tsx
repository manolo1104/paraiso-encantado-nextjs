'use client';

import { ShieldCheckIcon, CheckCircleIcon } from '@/components/icons';
import { Lock, RotateCcw, Tag } from 'lucide-react';

const BADGES = [
  {
    icon: <Lock size={18} strokeWidth={1.5} />,
    title: 'Pago 100% Seguro',
    sub: 'Stripe SSL',
  },
  {
    icon: <CheckCircleIcon size={18} />,
    title: 'Confirmación Instantánea',
    sub: 'Email automático',
  },
  {
    icon: <RotateCcw size={18} strokeWidth={1.5} />,
    title: 'Cancela Gratis',
    sub: 'Hasta 48hrs antes',
  },
  {
    icon: <Tag size={18} strokeWidth={1.5} />,
    title: 'Mejor Precio',
    sub: 'Reserva directa',
  },
];

export default function TrustBadgesReservar() {
  return (
    <>
      <style>{`
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (min-width: 640px) {
          .trust-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .trust-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(30,48,18,0.03);
          border: 1px solid rgba(30,48,18,0.08);
          border-radius: 6px;
          padding: 12px 14px;
          min-height: 56px;
        }
        .trust-icon-wrap {
          color: #c9a97a;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .trust-title { font-size: 0.75rem; font-weight: 600; color: #1e3012; line-height: 1.3; }
        .trust-sub   { font-size: 0.68rem; color: #888; margin-top: 1px; }
      `}</style>
      <div className="trust-grid" role="list" aria-label="Garantías de reserva">
        {BADGES.map((b) => (
          <div key={b.title} className="trust-badge" role="listitem">
            <span className="trust-icon-wrap" aria-hidden="true">{b.icon}</span>
            <div>
              <div className="trust-title">{b.title}</div>
              <div className="trust-sub">{b.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
