'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

interface Props {
  suiteName: string;
  suiteId: string;
  price: number;
}

export default function StickySuiteCTA({ suiteName, suiteId, price }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);

  const show = useCallback(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    setVisible(true);
    trackEvent('STICKY_CTA_SHOWN', { suite: suiteId, suiteName });
  }, [suiteId, suiteName]);

  useEffect(() => {
    trackEvent('SUITE_ENTER', { suite: suiteId, suiteName });

    const timer = setTimeout(show, 3000);
    const handleScroll = () => { if (window.scrollY > 300) show(); };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      trackEvent('SUITE_EXIT', { suite: suiteId, suiteName });
    };
  }, [suiteId, suiteName, show]);

  function buildReservarUrl() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    let ci = today, co = tomorrow, adults = '2';
    try {
      const raw = sessionStorage.getItem('pe_last_dates');
      if (raw) { const d = JSON.parse(raw); ci = d.checkin || today; co = d.checkout || tomorrow; adults = d.adults || '2'; }
    } catch { /* ignore */ }
    return `/reservar?checkin=${ci}&checkout=${co}&adults=${adults}&suiteId=${suiteId}&autoselect=1`;
  }

  const handleClick = () => {
    trackEvent('STICKY_CTA_CLICK', { suite: suiteId, suiteName, price });
    router.push(buildReservarUrl());
  };

  if (!visible) return null;

  const formattedPrice = price.toLocaleString('es-MX');

  return (
    <>
      <style>{`
        .sticky-suite-cta {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1e3012;
          color: #faf8f5;
          padding: 12px 20px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          z-index: 90;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.25);
          animation: stickySlideUp 0.3s ease-out;
        }
        @keyframes stickySlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .sticky-cta-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .sticky-cta-name {
          font-size: 0.75rem;
          opacity: 0.75;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sticky-cta-price {
          font-family: var(--font-cormorant, Georgia, serif);
          font-size: 1.25rem;
          font-weight: 600;
          color: #c9a97a;
          line-height: 1;
        }
        .sticky-cta-price small {
          font-size: 0.65em;
          font-weight: 400;
          color: rgba(250,248,245,0.7);
        }
        .sticky-cta-btn {
          background: #c9a97a;
          color: #1e3012;
          font-weight: 700;
          padding: 12px 18px;
          border-radius: 2px;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          min-height: 44px;
          min-width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .sticky-cta-btn:hover { background: #ddb989; }
        @media (min-width: 768px) {
          .sticky-suite-cta {
            bottom: auto;
            top: 64px;
            padding: 10px 40px;
            animation: stickySlideDown 0.3s ease-out;
          }
          @keyframes stickySlideDown {
            from { transform: translateY(-100%); }
            to   { transform: translateY(0); }
          }
          .sticky-cta-info { flex-direction: row; align-items: center; gap: 12px; }
          .sticky-cta-name { font-size: 0.875rem; }
          .sticky-cta-btn  { padding: 10px 24px; }
        }
      `}</style>
      <div className="sticky-suite-cta" role="complementary" aria-label="Reservar suite">
        <div className="sticky-cta-info">
          <span className="sticky-cta-name">{suiteName}</span>
          <span className="sticky-cta-price">
            ${formattedPrice}
            <small> /noche</small>
          </span>
        </div>
        <button className="sticky-cta-btn" onClick={handleClick}>
          Reservar →
        </button>
      </div>
    </>
  );
}
