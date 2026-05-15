'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  calcDepositAmount,
  formatMXN,
} from '@/lib/booking';
import styles from './checkout.module.css';
import CheckoutProgressBar from '@/components/CheckoutProgressBar';
import WhatsAppRecoveryWidget from '@/components/WhatsAppRecoveryWidget';
import { trackEvent } from '@/lib/analytics';

const API = '';
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51TBljS2NTr97DEMsM069f4O7Zp5uHM2L4HkJZrButJxsHmcluZNR0OQ2qfpX9EFhoXBRW2AY2ADs2bbLin4kszJ900HuSVXYz0'
);

const PROMO_CODE = 'PARAISO10';

// ── Exit-intent popup ─────────────────────────────────────
function ExitIntentPopup({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fired = useRef(false);

  useEffect(() => {
    if (pathname.includes('/checkout')) return;
    function trigger() {
      if (fired.current) return;
      fired.current = true;
      setVisible(true);
      fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'EXIT_INTENT_TRIGGER', sessionId, payload: { page: 'checkout' } }),
      }).catch(() => {});
    }

    // Cursor sale por arriba del viewport
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0) trigger();
    }

    // Botón atrás del browser — empujamos un estado extra al cargar
    // para interceptar el popstate
    window.history.pushState(null, '', window.location.href);
    function handlePopState() {
      trigger();
      // Volvemos a poner el estado para que si cierra el popup pueda seguir
      window.history.pushState(null, '', window.location.href);
    }

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [sessionId, pathname]);

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
              // 'auto' muestra Apple Pay / Google Pay como botones prominentes
              // cuando el dispositivo los soporta (Safari en iOS/Mac con Apple Pay activo)
              layout: { type: 'accordion', defaultCollapsed: false },
              wallets: { applePay: 'auto', googlePay: 'auto' },
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
            `*Nombre:* ${name || '(pendiente)'}`,
            `*Correo:* ${email || '(pendiente)'}`,
            `*Tel:* ${phone || '(pendiente)'}`,
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
            notes ? `*Peticiones especiales:* ${notes}` : '',
          ].filter(Boolean).join('\n');

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
    const subtotal = calcCartSubtotal(state.cart, state.checkin, state.checkout);
    const total = Math.max(0, subtotal - state.promoDiscount);
    const deposit = calcDepositAmount(total, state.nights);
    const pending = total - deposit;
    const isDeposit = state.nights >= 2;

    // Persist deposit info into booking state
    const stateWithDeposit: BookingState = {
      ...state,
      amountTotal: total,
      amountPaid: deposit,
      amountPending: pending,
      isDeposit,
    };
    setBooking(stateWithDeposit);
    const amountCents = Math.round(deposit * 100);

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

    trackEvent('CHECKOUT_STEP_2', { rooms: state.cart.length, checkin: state.checkin, checkout: state.checkout });

    // CART_ABANDON: si el usuario llega a checkout pero no completa el pago en 180s
    const startTime = Date.now();
    const abandonTimer = setTimeout(() => {
      trackEvent('CART_ABANDON', {
        step: 'checkout',
        timeOnPage: Math.round((Date.now() - startTime) / 1000),
        checkin: state.checkin,
        checkout: state.checkout,
        guests: state.adults,
      });
    }, 180_000);

    // Cleanup: remove block + cancel abandon timer if user leaves
    return () => {
      clearTimeout(abandonTimer);
      fetch(`${API}/api/remove-temporary-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    };
  }, []);

  function handleSuccess(confirmationNumber: string) {
    trackEvent('BOOKING_SUCCESS', { confirmationNumber });
    sessionStorage.setItem('pe_confirmation_number', confirmationNumber);
    if (booking) {
      sessionStorage.setItem('pe_booking_for_confirm', JSON.stringify(booking));
    }
    router.push('/reservar/confirmacion');
  }

  // Expose deposit info to CheckoutForm via context alternative
  const depositInfo = booking ? {
    isDeposit: booking.isDeposit ?? false,
    amountPaid: booking.amountPaid ?? 0,
    amountPending: booking.amountPending ?? 0,
    amountTotal: booking.amountTotal ?? 0,
  } : null;

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
      <CheckoutProgressBar currentStep={2} />
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.push('/reservar')}>
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
              <span>Total estadía</span>
              <span>{formatMXN(total)}</span>
            </div>
            {depositInfo?.isDeposit && (
              <>
                <div className={`${styles.summaryRow} ${styles.summaryDeposit}`}>
                  <span>Pagas ahora (50%)</span>
                  <span>{formatMXN(depositInfo.amountPaid)}</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.summaryPending}`}>
                  <span>Resto al check-in</span>
                  <span>{formatMXN(depositInfo.amountPending)}</span>
                </div>
              </>
            )}
          </div>

          <div className={styles.summaryGuarantees}>
            <p><ShieldCheck size={13} strokeWidth={1.5} /> Confirmación instantánea por email</p>
            <p><ShieldCheck size={13} strokeWidth={1.5} /> Cancelación gratuita hasta 48 hrs antes</p>
            {depositInfo?.isDeposit
              ? <p><ShieldCheck size={13} strokeWidth={1.5} /> Resto ({formatMXN(depositInfo.amountPending)}) se paga al llegar</p>
              : <p><ShieldCheck size={13} strokeWidth={1.5} /> Reserva directa sin comisiones</p>
            }
          </div>
        </aside>
      </div>
      <WhatsAppRecoveryWidget />
    </main>
  );
}
