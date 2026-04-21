'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, Lock, ChevronLeft } from 'lucide-react';
import {
  loadBookingState,
  BookingState,
  BOOKING_ROOMS,
  calcRoomStayTotal,
  calcCartSubtotal,
  formatMXN,
} from '@/lib/booking';
import styles from './checkout.module.css';

const API = '';
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51SuFNKPRwYk9rOzoUc56CjtGJ2VdnUkHvRNlP6N6EXX2PHdemLg0oHcOhXTUyv1jl1XHKvxcMfoIJErQSBBp4ojT00UPdWzcaR'
);

const PROMO_CODE = 'PARAISO10';

// ── Exit-intent popup ─────────────────────────────────────
function ExitIntentPopup({ sessionId }: { sessionId: string }) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fired = useRef(false);

  useEffect(() => {
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0 && !fired.current) {
        fired.current = true;
        setVisible(true);
        fetch('/api/track-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'EXIT_INTENT_TRIGGER', sessionId, payload: { page: 'checkout' } }),
        }).catch(() => {});
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un correo válido.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSuccess(true);
        fetch('/api/track-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'EXIT_POPUP_CONVERT', sessionId, payload: { email: email.trim() } }),
        }).catch(() => {});
      } else {
        setError('No se pudo guardar. Intenta de nuevo.');
        setSubmitting(false);
      }
    } catch {
      setError('Error de conexión.');
      setSubmitting(false);
    }
  }

  if (!visible) return null;

  return (
    <div className={styles.exitOverlay} onClick={e => { if (e.target === e.currentTarget) setVisible(false); }}>
      <div className={styles.exitPopup}>
        <button className={styles.exitClose} onClick={() => setVisible(false)} aria-label="Cerrar">×</button>
        <span className={styles.exitTag}>Oferta exclusiva</span>
        <h2 className={styles.exitTitle}>¡Espera! 10% de descuento</h2>
        <p className={styles.exitDesc}>
          Déjanos tu correo y recibe un cupón de 10% de descuento para aplicar en tu reserva directa.
        </p>
        {!success ? (
          <form onSubmit={handleSubmit} className={styles.exitForm}>
            <input
              type="email"
              className={styles.exitInput}
              placeholder="tu@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <button type="submit" className={styles.exitBtn} disabled={submitting}>
              {submitting ? 'Enviando…' : 'Obtener cupón'}
            </button>
            {error && <p className={styles.exitError}>{error}</p>}
          </form>
        ) : (
          <div className={styles.exitSuccess}>
            <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '0.85rem', color: '#2d5a27' }}>
              ¡Listo! Tu cupón:
            </p>
            <div className={styles.exitCode}>{PROMO_CODE}</div>
            <p className={styles.exitSuccessNote}>Aplícalo en el campo de código promocional al pagar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inner form (needs Stripe context) ────────────────────
function CheckoutForm({
  booking,
  paymentIntentId,
  sessionId,
  onSuccess,
}: {
  booking: BookingState;
  paymentIntentId: string;
  sessionId: string;
  onSuccess: (cn: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [howDidYouHear, setHowDidYouHear] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const subtotal = calcCartSubtotal(booking.cart, booking.checkin, booking.checkout);
  const total = Math.max(0, subtotal - booking.promoDiscount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Por favor completa nombre, correo y teléfono.');
      return;
    }
    setPaying(true);
    setError('');

    // Confirm payment with Stripe Elements
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        payment_method_data: {
          billing_details: { name, email, phone },
        },
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Error procesando el pago. Intenta de nuevo.');
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // Notify backend: save booking + send email + block dates
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
            email,
            customerName: name,
            customerPhone: phone,
            notes,
            howDidYouHear,
            total,
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
              notes,
            },
            rooms,
          }),
        });
        const data = await res.json();
        onSuccess(data.confirmationNumber || 'PE-OK');
      } catch {
        // Even if confirmation API fails, payment succeeded — still show success
        onSuccess('PE-OK');
      }
    } else {
      setError('El pago no fue procesado. Intenta de nuevo.');
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.formTitle}>Datos del Huésped</h2>

      <div className={styles.formGrid}>
        <label className={styles.formLabel}>
          <span>Nombre completo *</span>
          <input
            type="text"
            className={styles.formInput}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            required
            autoComplete="name"
          />
        </label>

        <label className={styles.formLabel}>
          <span>Correo electrónico *</span>
          <input
            type="email"
            className={styles.formInput}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            autoComplete="email"
          />
        </label>

        <label className={styles.formLabel}>
          <span>Teléfono / WhatsApp *</span>
          <input
            type="tel"
            className={styles.formInput}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+52 489 100 7679"
            required
            autoComplete="tel"
          />
        </label>

        <label className={styles.formLabel}>
          <span>¿Cómo nos conociste?</span>
          <select
            className={styles.formInput}
            value={howDidYouHear}
            onChange={e => setHowDidYouHear(e.target.value)}
          >
            <option value="">Selecciona una opción</option>
            <option value="google_busqueda">Google Búsqueda</option>
            <option value="google_maps">Google Maps</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="recomendacion">Recomendación</option>
            <option value="booking">Booking.com</option>
            <option value="otro">Otro</option>
          </select>
        </label>
      </div>

      <label className={styles.formLabel} style={{ marginTop: 8 }}>
        <span>Peticiones especiales (opcional)</span>
        <textarea
          className={`${styles.formInput} ${styles.formTextarea}`}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Alergias, celebraciones, llegada tardía…"
          rows={3}
        />
      </label>

      {/* Stripe payment element */}
      <div className={styles.paymentSection}>
        <h2 className={styles.formTitle}>
          <Lock size={15} strokeWidth={1.5} /> Información de Pago
        </h2>
        <div className={styles.stripeWrap}>
          <PaymentElement
            options={{
              layout: 'tabs',
              fields: { billingDetails: { name: 'never', email: 'never', phone: 'never' } },
            }}
          />
        </div>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <button type="submit" className={styles.payBtn} disabled={paying || !stripe || !elements}>
        {paying ? (
          <span>Procesando…</span>
        ) : (
          <>
            <Lock size={15} strokeWidth={2} />
            Pagar {formatMXN(total)} — Confirmar Reserva
          </>
        )}
      </button>

      <p className={styles.secureNote}>
        <ShieldCheck size={12} strokeWidth={1.5} /> Pago cifrado con Stripe. Nunca almacenamos datos de tarjeta.
      </p>
    </form>
  );
}

// ── Page shell ────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Load state + create PaymentIntent
  useEffect(() => {
    const state = loadBookingState();
    if (!state || state.cart.length === 0 || !state.checkin) {
      router.replace('/reservar');
      return;
    }
    setBooking(state);

    const subtotal = calcCartSubtotal(state.cart, state.checkin, state.checkout);
    const total = Math.max(0, subtotal - state.promoDiscount);
    const amountCents = Math.round(total * 100);

    // Create temporary block
    const roomNames = state.cart.map(item => BOOKING_ROOMS.find(r => r.id === item.roomId)!.name);
    fetch(`${API}/api/create-temporary-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkin: state.checkin, checkout: state.checkout, rooms: roomNames, sessionId }),
    }).catch(() => {});

    // Create payment intent
    fetch(`${API}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountCents,
        currency: 'mxn',
        bookingDetails: {
          checkin: state.checkin,
          checkout: state.checkout,
          nights: state.nights,
          guests: state.adults,
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

    // Cleanup: remove block if user leaves
    return () => {
      fetch(`${API}/api/remove-temporary-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    };
  }, []);

  function handleSuccess(confirmationNumber: string) {
    sessionStorage.setItem('pe_confirmation_number', confirmationNumber);
    if (booking) {
      sessionStorage.setItem('pe_booking_for_confirm', JSON.stringify(booking));
    }
    router.push('/reservar/confirmacion');
  }

  if (!booking) return null;

  const subtotal = calcCartSubtotal(booking.cart, booking.checkin, booking.checkout);
  const total = Math.max(0, subtotal - booking.promoDiscount);

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
      <ExitIntentPopup sessionId={sessionId} />
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ChevronLeft size={15} strokeWidth={2} /> Volver
        </button>
        <span className={styles.topTitle}>Confirmar Reserva</span>
        <span className={styles.topSecure}><Lock size={12} strokeWidth={1.5} /> Pago Seguro</span>
      </div>

      <div className={styles.layout}>
        {/* ── Left: form ── */}
        <div className={styles.formCol}>
          {loadError && (
            <div className={styles.loadError}>{loadError}</div>
          )}
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
              <CheckoutForm
                booking={booking}
                paymentIntentId={paymentIntentId}
                sessionId={sessionId}
                onSuccess={handleSuccess}
              />
            </Elements>
          )}
        </div>

        {/* ── Right: summary ── */}
        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Resumen</h2>

          <div className={styles.summaryDates}>
            <div><span>Check-in</span><strong>{new Date(`${booking.checkin}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</strong></div>
            <div><span>Check-out</span><strong>{new Date(`${booking.checkout}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</strong></div>
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
                    <span className={styles.summaryRoomDetail}>{item.guestCount} adulto{item.guestCount > 1 ? 's' : ''} · {booking.nights} noche{booking.nights > 1 ? 's' : ''}</span>
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
              <span>Total a pagar</span>
              <span>{formatMXN(total)}</span>
            </div>
          </div>

          <div className={styles.summaryGuarantees}>
            <p><ShieldCheck size={13} strokeWidth={1.5} /> Confirmación instantánea por email</p>
            <p><ShieldCheck size={13} strokeWidth={1.5} /> Cancelación gratuita hasta 48 hrs antes</p>
            <p><ShieldCheck size={13} strokeWidth={1.5} /> Reserva directa sin comisiones</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
