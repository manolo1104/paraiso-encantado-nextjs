'use client';

/**
 * Resumen de la reserva (columna derecha). Compartido por los dos pasos del
 * checkout —/reservar/checkout (datos) y /reservar/pago (pago)— para que el
 * huésped vea exactamente lo mismo en ambos.
 */
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import {
  BookingState,
  BOOKING_ROOMS,
  calcRoomStayTotal,
  calcCartSubtotal,
  formatMXN,
} from '@/lib/booking';
import styles from '@/app/reservar/checkout/checkout.module.css';

function fmtDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export default function BookingSummary({ booking }: { booking: BookingState }) {
  const subtotal = calcCartSubtotal(booking.cart, booking.checkin, booking.checkout);
  const total = Math.max(0, subtotal - booking.promoDiscount);
  const isDeposit = booking.isDeposit ?? false;

  return (
    <aside className={styles.summary}>
      <h2 className={styles.summaryTitle}>Resumen</h2>

      <div className={styles.summaryDates}>
        <div><span>Check-in</span><strong>{fmtDate(booking.checkin)}</strong></div>
        <div><span>Check-out</span><strong>{fmtDate(booking.checkout)}</strong></div>
        <div><span>Noches</span><strong>{booking.nights}</strong></div>
        <div><span>Adultos</span><strong>{booking.adults}</strong></div>
        {booking.children > 0 && <div><span>Menores</span><strong>{booking.children}</strong></div>}
      </div>

      <div className={styles.summaryRooms}>
        {booking.cart.map(item => {
          const room = BOOKING_ROOMS.find(r => r.id === item.roomId)!;
          const roomTotal = calcRoomStayTotal(room, item.guestCount, booking.checkin, booking.checkout);
          return (
            <div key={item.roomId} className={styles.summaryRoom}>
              <div className={styles.summaryRoomImg}>
                <Image src={room.image} alt={room.name} fill sizes="80px" className={styles.summaryRoomImgEl} />
              </div>
              <div className={styles.summaryRoomInfo}>
                <span className={styles.summaryRoomName}>{room.name}</span>
                <span className={styles.summaryRoomDetail}>
                  {item.guestCount} adulto{item.guestCount > 1 ? 's' : ''} · {booking.nights} noche{booking.nights > 1 ? 's' : ''}
                </span>
                <span className={styles.summaryRoomPrice}>{formatMXN(roomTotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.summaryTotals}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>{formatMXN(subtotal)}</span>
        </div>
        {booking.promoDiscount > 0 && (
          <div className={`${styles.summaryRow} ${styles.summaryDiscount}`}>
            <span>Descuento ({booking.promoCode})</span>
            <span>−{formatMXN(booking.promoDiscount)}</span>
          </div>
        )}
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>Total estadía</span>
          <span>{formatMXN(total)}</span>
        </div>
        {isDeposit && (
          <>
            <div className={`${styles.summaryRow} ${styles.summaryDeposit}`}>
              <span>Pagas ahora (50%)</span>
              <span>{formatMXN(booking.amountPaid ?? 0)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryPending}`}>
              <span>Resto al check-in</span>
              <span>{formatMXN(booking.amountPending ?? 0)}</span>
            </div>
          </>
        )}
      </div>

      <div className={styles.summaryGuarantees}>
        <p><ShieldCheck size={13} strokeWidth={1.5} /> Confirmación instantánea por email</p>
        <p><ShieldCheck size={13} strokeWidth={1.5} /> Reembolso 100% hasta 7 días antes</p>
        {isDeposit
          ? <p><ShieldCheck size={13} strokeWidth={1.5} /> Resto ({formatMXN(booking.amountPending ?? 0)}) se paga al llegar</p>
          : <p><ShieldCheck size={13} strokeWidth={1.5} /> Reserva directa sin comisiones</p>
        }
      </div>

      {/* Reseña real (de /reviews) — refuerzo de confianza */}
      <blockquote className={styles.summaryReview}>
        <div className={styles.summaryReviewStars} aria-label="5 de 5 estrellas">★★★★★</div>
        <p>“El mejor hotel de Xilitla sin ninguna duda. Habitación impecable, restaurante excelente y ubicación perfecta.”</p>
        <footer>Jorge Mendoza · Monterrey · Google — <strong>4.5/5</strong> · 523 reseñas</footer>
      </blockquote>
    </aside>
  );
}
