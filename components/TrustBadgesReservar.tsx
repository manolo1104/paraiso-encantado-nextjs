'use client';

import { ShieldCheckIcon, CheckCircleIcon } from '@/components/icons';
import { Lock, RotateCcw, CreditCard } from 'lucide-react';

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
    sub: 'Hasta 7 días antes',
  },
  {
    icon: <CreditCard size={18} strokeWidth={1.5} />,
    title: 'Reserva con el 50%',
    sub: '2 noches o más · Resto al llegar',
  },
];

export default function TrustBadgesReservar() {
  return (
    <>
      <style>{`
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          max-width: 1100px;
          margin: 0 auto 20px;
          padding: 0 16px;
          box-sizing: border-box;
        }
        @media (min-width: 640px) {
          .trust-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            padding: 0 24px;
          }
        }
        .trust-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(30,48,18,0.03);
          border: 1px solid rgba(30,48,18,0.08);
          border-radius: 6px;
          padding: 10px 14px;
          min-height: 52px;
          min-width: 0;
          box-sizing: border-box;
        }
        .trust-icon-wrap {
          color: #c9a97a;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .trust-text { min-width: 0; }
        .trust-title { font-size: 0.72rem; font-weight: 600; color: #1e3012; line-height: 1.3; }
        .trust-sub   { font-size: 0.65rem; color: #5f5f5f; margin-top: 1px; line-height: 1.3; }
      `}</style>
      <div className="trust-grid" role="list" aria-label="Garantías de reserva">
        {BADGES.map((b) => (
          <div key={b.title} className="trust-badge" role="listitem">
            <span className="trust-icon-wrap" aria-hidden="true">{b.icon}</span>
            <div className="trust-text">
              <div className="trust-title">{b.title}</div>
              <div className="trust-sub">{b.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
