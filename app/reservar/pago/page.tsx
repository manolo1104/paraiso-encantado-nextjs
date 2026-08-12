'use client';

/**
 * PASO 3 de la reserva — pago.
 *
 * Llega aquí con los datos de contacto ya capturados en /reservar/checkout
 * (paso 2) y guardados en `pe_guest_info` + en la hoja ReservasIncompletas.
 * Si alguien entra directo sin esos datos, se le regresa al paso 2.
 */
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, Lock, ChevronLeft, Pencil } from 'lucide-react';
import {
  loadBookingState,
  BookingState,
  BOOKING_ROOMS,
  calcRoomStayTotal,
  calcCartSubtotal,
  calcDepositAmount,
  formatMXN,
} from '@/lib/booking';
import styles from '../checkout/checkout.module.css';
import CheckoutProgressBar from '@/components/CheckoutProgressBar';
import BookingSummary from '@/components/BookingSummary';
import { trackEvent } from '@/lib/analytics';
import { getHoldSessionId } from '@/lib/hold-session';
import { GuestInfo, loadGuestInfo } from '@/lib/guest-info';

const API = '';
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51TBljS2NTr97DEMsM069f4O7Zp5uHM2L4HkJZrButJxsHmcluZNR0OQ2qfpX9EFhoXBRW2AY2ADs2bbLin4kszJ900HuSVXYz0'
);

// ── Formulario de pago (necesita el contexto de Stripe) ──
function PaymentForm({
  booking,
  guest,
  paymentIntentId,
  sessionId,
  onSuccess,
}: {
  booking: BookingState;
  guest: GuestInfo;
  paymentIntentId: string;
  sessionId: string;
  onSuccess: (cn: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const subtotal = calcCartSubtotal(booking.cart, booking.checkin, booking.checkout);
  const total = Math.max(0, subtotal - booking.promoDiscount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: 'https://www.paraisoencantado.com/reservar/confirmacion',
        payment_method_data: {
          billing_details: { name: guest.name, email: guest.email, phone: guest.phone },
        },
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Error procesando el pago. Intenta de nuevo.');
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      const rooms = booking.cart.map(item => {
        const room = BOOKING_ROOMS.find(r => r.id === item.roomId)!;
        const totalPrice = calcRoomStayTotal(room, item.guestCount, booking.checkin, booking.checkout);
        return { name: room.name, guestCount: item.guestCount, totalPrice };
      });

      try {
        const res = await fetch(`${API}/api/send-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: guest.email,
            customerName: guest.name,
            customerPhone: guest.phone,
            notes: guest.notes,
            howDidYouHear: guest.howDidYouHear,
            total,
            amountPaid: booking.amountPaid,
            amountPending: booking.amountPending,
            isDeposit: booking.isDeposit,
            paymentIntentId,
            sessionId,
            bookingDetails: {
              checkin: booking.checkin,
              checkout: booking.checkout,
              checkin_date: booking.checkin,
              checkout_date: booking.checkout,
              nights: booking.nights,
              adults: booking.adults,
              minors: booking.children,
              guests: booking.adults + booking.children,
              notes: guest.notes,
            },
            rooms,
          }),
        });
        // El pago YA tuvo éxito. Si la confirmación se guardó usamos su folio real;
        // si la API falla, el webhook de Stripe registra la reserva como red de
        // seguridad. Seguimos mostrando éxito a propósito: cobrar y luego decir
        // "error" haría que el cliente intente pagar otra vez (doble cargo).
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        onSuccess(data.confirmationNumber || 'PE-OK');
      } catch {
        onSuccess('PE-OK');
      }
    } else {
      setError('El pago no fue procesado. Intenta de nuevo.');
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.formTitle}>
        <Lock size={15} strokeWidth={1.5} /> Información de Pago
      </h2>

      <div className={styles.stripeWrap}>
        <PaymentElement
          options={{
            // 'auto' muestra Apple Pay / Google Pay como botones prominentes
            // cuando el dispositivo los soporta (Safari en iOS/Mac con Apple Pay activo)
            layout: { type: 'accordion', defaultCollapsed: false },
            wallets: { applePay: 'auto', googlePay: 'auto' },
            fields: { billingDetails: { name: 'never', email: 'never', phone: 'never' } },
          }}
        />
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <button type="submit" className={styles.payBtn} disabled={paying || !stripe || !elements}>
        {paying ? (
          <span>Procesando…</span>
        ) : (
          <>
            <Lock size={15} strokeWidth={2} />
            {booking.isDeposit
              ? `Pagar ${formatMXN(booking.amountPaid ?? total)} — Depósito 50%`
              : `Pagar ${formatMXN(total)} — Confirmar Reserva`}
          </>
        )}
      </button>
      {booking.isDeposit && (
        <p className={styles.depositNote}>
          Pagas ahora el 50% ({formatMXN(booking.amountPaid ?? 0)}). El resto ({formatMXN(booking.amountPending ?? 0)}) se liquida al llegar.
        </p>
      )}

      <p className={styles.secureNote}>
        <ShieldCheck size={12} strokeWidth={1.5} /> Pago cifrado con Stripe. Nunca almacenamos datos de tarjeta.
      </p>

      {/* ── Alternativa: OXXO / Transferencia vía WhatsApp ── */}
      <div className={styles.altPayDivider}>
        <span>¿Prefieres otra forma de pago?</span>
      </div>
      <button
        type="button"
        className={styles.whatsappPayBtn}
        onClick={() => {
          const rooms = booking.cart.map(item => {
            const room = BOOKING_ROOMS.find(r => r.id === item.roomId)!;
            const roomTotal = calcRoomStayTotal(room, item.guestCount, booking.checkin, booking.checkout);
            return `• ${room.name} (${item.guestCount} persona${item.guestCount > 1 ? 's' : ''}) — ${formatMXN(roomTotal)}`;
          }).join('\n');

          const msg = [
            '¡Hola! Quiero reservar en Paraíso Encantado y pagar por OXXO o transferencia.',
            '',
            `*Nombre:* ${guest.name}`,
            `*Correo:* ${guest.email}`,
            `*Tel:* ${guest.phone}`,
            '',
            `*Check-in:* ${booking.checkin}`,
            `*Check-out:* ${booking.checkout}`,
            `*Noches:* ${booking.nights}`,
            `*Adultos:* ${booking.adults}`,
            '',
            '*Habitaciones:*',
            rooms,
            '',
            `*Total estadía:* ${formatMXN(total)}`,
            booking.promoDiscount > 0 ? `*Descuento aplicado:* −${formatMXN(booking.promoDiscount)} (${booking.promoCode})` : '',
            guest.notes ? `*Peticiones especiales:* ${guest.notes}` : '',
          ].filter(Boolean).join('\n');

          trackEvent('WHATSAPP_PAY_CLICK', { checkin: booking.checkin });
          window.open(`https://wa.me/524891007679?text=${encodeURIComponent(msg)}`, '_blank');
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Pagar por OXXO o Transferencia Bancaria
      </button>
      <p className={styles.whatsappPayNote}>
        Te enviaremos los datos de pago por WhatsApp. Un coordinador te confirmará la reserva en menos de 1 hora.
      </p>
    </form>
  );
}

// ── Página ────────────────────────────────────────────────
export default function PagoPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [sessionId] = useState(() => getHoldSessionId());
  const bookingRef = useRef<BookingState | null>(null);

  useEffect(() => {
    const state = loadBookingState();
    if (!state || state.cart.length === 0 || !state.checkin) {
      router.replace('/reservar');
      return;
    }
    const info = loadGuestInfo();
    if (!info) {
      router.replace('/reservar/checkout');
      return;
    }
    setGuest(info);

    const subtotal = calcCartSubtotal(state.cart, state.checkin, state.checkout);
    const total = Math.max(0, subtotal - state.promoDiscount);
    const deposit = calcDepositAmount(total, state.nights);
    const withDeposit: BookingState = {
      ...state,
      amountTotal: total,
      amountPaid: deposit,
      amountPending: total - deposit,
      isDeposit: state.nights >= 2,
    };
    setBooking(withDeposit);
    bookingRef.current = withDeposit;

    const roomNames = state.cart.map(item => BOOKING_ROOMS.find(r => r.id === item.roomId)!.name);
    const renewHold = () => {
      fetch(`${API}/api/renew-temporary-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin: state.checkin, checkout: state.checkout, rooms: roomNames, sessionId }),
      }).catch(() => {});
    };
    renewHold();
    // Renovar mientras el huésped teclea su tarjeta: el apartado dura 10 min y
    // llenar el pago (o buscar la tarjeta) puede tomar más.
    const holdTimer = setInterval(renewHold, 5 * 60 * 1000);

    // Crear PaymentIntent — el SERVIDOR recalcula el precio desde el carrito.
    fetch(`${API}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: state.cart,
        checkin: state.checkin,
        checkout: state.checkout,
        promoCode: state.promoCode,
        customerEmail: info.email,
        customerName: info.name,
        bookingDetails: {
          checkin: state.checkin,
          checkout: state.checkout,
          nights: state.nights,
          adults: state.adults,
          children: state.children,
          guests: state.adults + state.children,
        },
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.clientSecret) {
          setClientSecret(d.clientSecret);
          setPaymentIntentId(d.paymentIntentId);
        } else {
          setLoadError('No se pudo iniciar el pago. Intenta de nuevo.');
        }
      })
      .catch(() => setLoadError('Error de conexión. Verifica tu internet e intenta de nuevo.'));

    trackEvent('CHECKOUT_STEP_3', { rooms: state.cart.length, checkin: state.checkin, checkout: state.checkout });

    const startTime = Date.now();
    const abandonTimer = setTimeout(() => {
      trackEvent('CART_ABANDON', {
        step: 'pago',
        timeOnPage: Math.round((Date.now() - startTime) / 1000),
        checkin: state.checkin,
        checkout: state.checkout,
        guests: state.adults,
      });
    }, 180_000);

    return () => {
      clearInterval(holdTimer);
      clearTimeout(abandonTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSuccess(confirmationNumber: string) {
    trackEvent('BOOKING_SUCCESS', { confirmationNumber });
    sessionStorage.setItem('pe_confirmation_number', confirmationNumber);
    if (bookingRef.current) {
      sessionStorage.setItem('pe_booking_for_confirm', JSON.stringify(bookingRef.current));
    }
    router.push('/reservar/confirmacion');
  }

  if (!booking || !guest) return null;

  const stripeAppearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#1a2e1a',
      colorBackground: '#ffffff',
      colorText: '#1a2e1a',
      colorDanger: '#8a1a1a',
      fontFamily: 'Jost, sans-serif',
      borderRadius: '6px',
    },
  };

  return (
    <main className={styles.main}>
      <CheckoutProgressBar currentStep={3} />
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.push('/reservar/checkout')}>
          <ChevronLeft size={15} strokeWidth={2} /> Volver
        </button>
        <span className={styles.topTitle}>Pago</span>
        <span className={styles.topSecure}><Lock size={12} strokeWidth={1.5} /> Pago Seguro</span>
      </div>

      <div className={styles.layout}>
        <div className={styles.formCol}>
          {/* Datos ya capturados en el paso anterior */}
          <div className={styles.guestRecap}>
            <div>
              <span className={styles.guestRecapName}>{guest.name}</span>
              <span className={styles.guestRecapLine}>{guest.email} · {guest.phone}</span>
            </div>
            <button type="button" onClick={() => router.push('/reservar/checkout')} className={styles.guestRecapEdit}>
              <Pencil size={13} strokeWidth={2} /> Editar
            </button>
          </div>

          {loadError && <div className={styles.loadError}>{loadError}</div>}
          {!loadError && !clientSecret && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Preparando formulario de pago…</p>
            </div>
          )}
          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: stripeAppearance, locale: 'es' }}
            >
              <PaymentForm
                booking={booking}
                guest={guest}
                paymentIntentId={paymentIntentId}
                sessionId={sessionId}
                onSuccess={handleSuccess}
              />
            </Elements>
          )}
        </div>

        <BookingSummary booking={booking} />
      </div>
    </main>
  );
}
