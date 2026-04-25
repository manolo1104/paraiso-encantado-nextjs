'use client';

const BADGES = [
  { icon: '🔒', title: 'Pago 100% Seguro', sub: 'Stripe SSL' },
  { icon: '✅', title: 'Confirmación Instantánea', sub: 'Email automático' },
  { icon: '↩️', title: 'Cancela Gratis', sub: 'Hasta 48hrs antes' },
  { icon: '💰', title: 'Mejor Precio', sub: 'Garantizado' },
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
          gap: 9px;
          background: rgba(30,48,18,0.03);
          border: 1px solid rgba(30,48,18,0.08);
          border-radius: 4px;
          padding: 10px 12px;
        }
        .trust-icon { font-size: 1.3rem; flex-shrink: 0; }
        .trust-title { font-size: 0.75rem; font-weight: 600; color: #1e3012; line-height: 1.3; }
        .trust-sub   { font-size: 0.68rem; color: #777; }
      `}</style>
      <div className="trust-grid" role="list" aria-label="Garantías de reserva">
        {BADGES.map((b) => (
          <div key={b.title} className="trust-badge" role="listitem">
            <span className="trust-icon" aria-hidden="true">{b.icon}</span>
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
