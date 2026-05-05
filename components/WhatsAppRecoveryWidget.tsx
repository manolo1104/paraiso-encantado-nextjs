'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

const WA_NUMBER = '524891007679';

interface BookingData {
  suite?: string;
  suiteName?: string;
  checkin?: string;
  checkout?: string;
}

interface Props {
  bookingData?: BookingData;
}

export default function WhatsAppRecoveryWidget({ bookingData = {} }: Props) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState('');
  const shown = useRef(false);

  const showPopup = useCallback((triggerReason: string) => {
    if (shown.current) return;
    shown.current = true;
    setReason(triggerReason);
    setShow(true);
    trackEvent('EXIT_POPUP_SHOWN', { reason: triggerReason });
  }, []);

  // En checkout NO interrumpir — zona sagrada sin distracciones
  const isCheckout = pathname === '/reservar/checkout';

  // Timers + exit intent — solo en /reservar, nunca en checkout
  useEffect(() => {
    if (isCheckout) return;

    // 3 min sin completar
    const t3 = setTimeout(() => showPopup('booking_abandoned'), 3 * 60_000);
    // 5 min fallback
    const t5 = setTimeout(() => showPopup('stuck_in_step'), 5 * 60_000);

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        trackEvent('EXIT_INTENT_TRIGGER');
        showPopup('exit_intent');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(t3);
      clearTimeout(t5);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showPopup, isCheckout]);

  // Auto-close after 30 s of inaction
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 30_000);
    return () => clearTimeout(timer);
  }, [show]);

  const handleWhatsAppClick = () => {
    const parts: string[] = ['Hola, quiero reservar en Paraíso Encantado'];
    if (bookingData.suiteName) parts.push(`la ${bookingData.suiteName}`);
    if (bookingData.checkin && bookingData.checkout) {
      parts.push(`del ${bookingData.checkin} al ${bookingData.checkout}`);
    }
    parts.push('y necesito ayuda para confirmar.');
    const message = parts.join(' ');

    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');

    trackEvent('WHATSAPP_RECOVERY_CLICK', {
      reason,
      suite: bookingData.suite,
      checkin: bookingData.checkin,
      checkout: bookingData.checkout,
    });
    trackEvent('EXIT_POPUP_CONVERT', { reason });
    setShow(false);
  };

  const handleClose = () => {
    setShow(false);
    trackEvent('WHATSAPP_CLICK', { action: 'dismissed_popup', reason });
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes waFadeIn {
          from { opacity: 0; transform: translate(-50%, -46%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes waSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wa-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.52);
          z-index: 998;
          cursor: pointer;
        }
        .wa-popup {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #faf8f5;
          border-radius: 8px;
          padding: 32px 24px 24px;
          z-index: 999;
          max-width: 340px;
          width: 90vw;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.22);
          animation: waFadeIn 0.25s ease-out;
        }
        @media (max-width: 480px) {
          .wa-popup {
            top: auto; bottom: 0;
            left: 0; right: 0;
            transform: none;
            max-width: 100%;
            width: 100%;
            border-radius: 16px 16px 0 0;
            animation: waSlideUp 0.3s ease-out;
          }
        }
        .wa-close {
          position: absolute; top: 10px; right: 14px;
          background: none; border: none;
          font-size: 1.4rem; line-height: 1;
          cursor: pointer; color: #aaa;
          padding: 4px 6px;
          min-width: 32px; min-height: 32px;
        }
        .wa-icon { font-size: 2.5rem; margin-bottom: 6px; }
        .wa-title {
          font-family: var(--font-cormorant, Georgia, serif);
          font-size: 1.5rem;
          color: #1e3012;
          margin: 0 0 8px;
        }
        .wa-desc {
          font-size: 0.88rem;
          color: #555;
          line-height: 1.55;
          margin: 0 0 20px;
        }
        .wa-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: #25D366;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 14px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 48px;
          margin-bottom: 10px;
          transition: background 0.2s;
        }
        .wa-btn:hover { background: #1fb958; }
        .wa-no {
          background: none; border: none;
          color: #aaa; font-size: 0.82rem;
          cursor: pointer; padding: 8px 16px;
          width: 100%; min-height: 40px;
        }
      `}</style>

      {/* Overlay */}
      <div className="wa-overlay" onClick={handleClose} aria-hidden="true" />

      {/* Popup */}
      <div className="wa-popup" role="dialog" aria-modal="true" aria-labelledby="wa-popup-title">
        <button className="wa-close" onClick={handleClose} aria-label="Cerrar">×</button>
        <div className="wa-icon" aria-hidden="true">💬</div>
        <h3 className="wa-title" id="wa-popup-title">¿Tu reserva no avanzó?</h3>
        <p className="wa-desc">
          Escríbenos por WhatsApp y te ayudamos a confirmar tu habitación en menos de 5 minutos.
        </p>

        <button className="wa-btn" onClick={handleWhatsAppClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Confirmar por WhatsApp →
        </button>

        <button className="wa-no" onClick={handleClose}>Seguir reservando aquí</button>
      </div>
    </>
  );
}
