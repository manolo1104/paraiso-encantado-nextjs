'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Calendar, Users, MessageCircle, Phone } from 'lucide-react';
import { BookingState, BOOKING_ROOMS, calcRoomStayTotal, formatMXN, calcCartSubtotal } from '@/lib/booking';
import styles from './confirmacion.module.css';

const WHATSAPP_URL = 'https://wa.me/524891007679';

export default function ConfirmacionPage() {
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [booking, setBooking] = useState<BookingState | null>(null);

  useEffect(() => {
    const cn = sessionStorage.getItem('pe_confirmation_number') || '';
    const raw = sessionStorage.getItem('pe_booking_for_confirm');
    setConfirmationNumber(cn);
    if (raw) {
      try { setBooking(JSON.parse(raw)); } catch {}
    }
    // Clear so back navigation doesn't re-show confirmation
    sessionStorage.removeItem('pe_confirmation_number');
    sessionStorage.removeItem('pe_booking_for_confirm');
    sessionStorage.removeItem('pe_booking_state');
  }, []);

  const subtotal = booking ? calcCartSubtotal(booking.cart, booking.checkin, booking.checkout) : 0;
  const total = booking ? Math.max(0, subtotal - booking.promoDiscount) : 0;

  const checkinFmt = booking
    ? new Date(`${booking.checkin}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const checkoutFmt = booking
    ? new Date(`${booking.checkout}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        {/* Success icon */}
        <div className={styles.iconWrap} aria-hidden="true">
          <CheckCircle size={56} strokeWidth={1.5} className={styles.checkIcon} />
        </div>

        <p className={styles.eyebrow}>¡Reserva Confirmada!</p>
        <h1 className={styles.title}>
          Nos vemos en <em>Paraíso Encantado</em>
        </h1>
        <p className={styles.subtitle}>
          Recibirás un correo de confirmación en los próximos minutos.
          Cualquier duda, escríbenos por WhatsApp.
        </p>

        {confirmationNumber && (
          <div className={styles.confirmationBadge}>
            <span>Número de confirmación</span>
            <strong>{confirmationNumber}</strong>
          </div>
        )}

        {/* Booking details */}
        {booking && (
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <Calendar size={16} strokeWidth={1.5} />
              <div>
                <span className={styles.detailLabel}>Check-in</span>
                <span className={styles.detailValue}>{checkinFmt}</span>
              </div>
            </div>
            <div className={styles.detailRow}>
              <Calendar size={16} strokeWidth={1.5} />
              <div>
                <span className={styles.detailLabel}>Check-out</span>
                <span className={styles.detailValue}>{checkoutFmt}</span>
              </div>
            </div>
            <div className={styles.detailRow}>
              <Users size={16} strokeWidth={1.5} />
              <div>
                <span className={styles.detailLabel}>Huéspedes</span>
                <span className={styles.detailValue}>
                  {booking.adults} adulto{booking.adults !== 1 ? 's' : ''}
                  {booking.children > 0 ? ` · ${booking.children} menor${booking.children !== 1 ? 'es' : ''}` : ''}
                </span>
              </div>
            </div>

            {/* Room list */}
            <div className={styles.rooms}>
              {booking.cart.map(item => {
                const room = BOOKING_ROOMS.find(r => r.id === item.roomId)!;
                const rt = calcRoomStayTotal(room, item.guestCount, booking.checkin, booking.checkout);
                return (
                  <div key={item.roomId} className={styles.roomRow}>
                    <span>{room.name}</span>
                    <span>{formatMXN(rt)}</span>
                  </div>
                );
              })}
              {booking.promoDiscount > 0 && (
                <div className={`${styles.roomRow} ${styles.discountRow}`}>
                  <span>Descuento ({booking.promoCode})</span>
                  <span>−{formatMXN(booking.promoDiscount)}</span>
                </div>
              )}
              <div className={`${styles.roomRow} ${styles.totalRow}`}>
                <span>Total estadía</span>
                <span>{formatMXN(total)}</span>
              </div>
              {booking.isDeposit && booking.amountPaid != null && (
                <>
                  <div className={`${styles.roomRow} ${styles.paidRow}`}>
                    <span>✓ Pagado ahora (50%)</span>
                    <span>{formatMXN(booking.amountPaid)}</span>
                  </div>
                  <div className={`${styles.roomRow} ${styles.pendingRow}`}>
                    <span>Pendiente al check-in</span>
                    <span>{formatMXN(booking.amountPending ?? 0)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Info boxes */}
        <div className={styles.infoGrid}>
          <div className={styles.infoBox}>
            <strong>Check-in</strong>
            <span>A partir de las 15:00 hrs</span>
          </div>
          <div className={styles.infoBox}>
            <strong>Check-out</strong>
            <span>Antes de las 12:00 hrs</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <a
            href={`${WHATSAPP_URL}?text=Hola,%20tengo%20la%20confirmaci%C3%B3n%20${confirmationNumber || ''}%20y%20quisiera%20coordinar%20mi%20llegada`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnWhatsApp}
          >
            <MessageCircle size={16} strokeWidth={1.5} /> Coordinar llegada por WhatsApp
          </a>
          <a href="tel:+524891007679" className={styles.btnPhone}>
            <Phone size={16} strokeWidth={1.5} /> +52 489-100-7679
          </a>
        </div>

        <Link href="/" className={styles.homeLink}>
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
