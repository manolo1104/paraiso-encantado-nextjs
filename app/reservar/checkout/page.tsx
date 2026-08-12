'use client';

/**
 * PASO 2 de la reserva — datos del huésped.
 *
 * El pago vive en /reservar/pago (paso 3). Están separados a propósito: al
 * terminar este paso ya tenemos nombre, correo y teléfono, así que una reserva
 * que se cae en el pago deja de ser un carrito anónimo y se puede recuperar por
 * correo (ver /api/guest-info y /api/cron/recuperacion).
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import {
  loadBookingState,
  BookingState,
  BOOKING_ROOMS,
  calcCartSubtotal,
  calcDepositAmount,
} from '@/lib/booking';
import styles from './checkout.module.css';
import CheckoutProgressBar from '@/components/CheckoutProgressBar';
import BookingSummary from '@/components/BookingSummary';
import WhatsAppRecoveryWidget from '@/components/WhatsAppRecoveryWidget';
import { trackEvent } from '@/lib/analytics';
import { getHoldSessionId } from '@/lib/hold-session';
import { loadGuestInfo, saveGuestInfo } from '@/lib/guest-info';

const API = '';

export default function GuestInfoPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [sessionId] = useState(() => getHoldSessionId());

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [howDidYouHear, setHowDidYouHear] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const state = loadBookingState();
    if (!state || state.cart.length === 0 || !state.checkin) {
      router.replace('/reservar');
      return;
    }
    const subtotal = calcCartSubtotal(state.cart, state.checkin, state.checkout);
    const total = Math.max(0, subtotal - state.promoDiscount);
    const deposit = calcDepositAmount(total, state.nights);
    setBooking({
      ...state,
      amountTotal: total,
      amountPaid: deposit,
      amountPending: total - deposit,
      isDeposit: state.nights >= 2,
    });

    // Recuperar datos ya escritos (si volvió desde el paso de pago)
    const saved = loadGuestInfo();
    if (saved) {
      setName(saved.name); setEmail(saved.email); setPhone(saved.phone);
      setNotes(saved.notes); setHowDidYouHear(saved.howDidYouHear);
    }

    // Mantener apartada la suite mientras llena sus datos
    const roomNames = state.cart.map(item => BOOKING_ROOMS.find(r => r.id === item.roomId)!.name);
    fetch(`${API}/api/renew-temporary-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkin: state.checkin, checkout: state.checkout, rooms: roomNames, sessionId }),
    }).catch(() => {});

    trackEvent('CHECKOUT_STEP_2', { rooms: state.cart.length, checkin: state.checkin, checkout: state.checkout });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Por favor completa nombre, correo y teléfono.');
      return;
    }
    if (!email.includes('@')) {
      setError('Revisa tu correo — ahí te llega la confirmación.');
      return;
    }
    setSaving(true);
    setError('');

    const info = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      notes: notes.trim(),
      howDidYouHear,
    };
    saveGuestInfo(info);

    // Guardar la reserva incompleta para poder recuperarla si no paga.
    // Si falla (Sheets caído), NO bloqueamos el avance al pago: cobrar es
    // prioritario sobre poder mandar un correo de recuperación.
    try {
      await fetch(`${API}/api/guest-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...info,
          sessionId,
          cart: booking.cart,
          checkin: booking.checkin,
          checkout: booking.checkout,
          promoCode: booking.promoCode,
          adults: booking.adults,
          children: booking.children,
        }),
      });
    } catch { /* seguimos al pago igual */ }

    trackEvent('GUEST_INFO_SUBMITTED', { checkin: booking.checkin, nights: booking.nights });
    router.push('/reservar/pago');
  }

  if (!booking) return null;

  return (
    <main className={styles.main}>
      <CheckoutProgressBar currentStep={2} />
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.push('/reservar')}>
          <ChevronLeft size={15} strokeWidth={2} /> Volver
        </button>
        <span className={styles.topTitle}>Tus Datos</span>
        <span className={styles.topSecure}><Lock size={12} strokeWidth={1.5} /> Pago Seguro</span>
      </div>

      <div className={styles.layout}>
        <div className={styles.formCol}>
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
                  <option value="chatgpt_ia">ChatGPT / IA (Gemini, Perplexity, etc.)</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
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

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button type="submit" className={styles.payBtn} disabled={saving}>
              {saving ? <span>Guardando…</span> : (<>Continuar al pago <ChevronRight size={16} strokeWidth={2} /></>)}
            </button>

            <p className={styles.secureNote}>
              <ShieldCheck size={12} strokeWidth={1.5} /> Todavía no se te cobra nada. En el siguiente paso eliges cómo pagar.
            </p>
          </form>
        </div>

        <BookingSummary booking={booking} />
      </div>
      <WhatsAppRecoveryWidget />
    </main>
  );
}
