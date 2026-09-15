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
import { ChevronLeft, ChevronRight, Lock, ShieldCheck, Coffee, CalendarX } from 'lucide-react';
import {
  loadBookingState,
  saveBookingState,
  BookingState,
  BookingAddons,
  BOOKING_ROOMS,
  calcStayTotals,
  formatMXN,
  DESAYUNO_PRECIO,
  DESAYUNO_MENU,
  CANCELACION_FLEX_REGLA,
} from '@/lib/booking';
import styles from './checkout.module.css';
import CheckoutProgressBar from '@/components/CheckoutProgressBar';
import BookingSummary from '@/components/BookingSummary';
import WhatsAppRecoveryWidget from '@/components/WhatsAppRecoveryWidget';
import { trackEvent } from '@/lib/analytics';
import { getHoldSessionId } from '@/lib/hold-session';
import { loadGuestInfo, saveGuestInfo } from '@/lib/guest-info';

const API = '';

function withAmounts(state: BookingState): BookingState {
  const t = calcStayTotals(state);
  return { ...state, amountTotal: t.total, amountPaid: t.deposit, amountPending: t.pending, isDeposit: t.isDeposit };
}

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
    setBooking(withAmounts(state));

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

  // Los add-ons se guardan en el estado de la reserva (sessionStorage) para que
  // el paso de pago cobre lo mismo que el huésped eligió aquí.
  function toggleAddon(key: keyof BookingAddons, on: boolean) {
    if (!booking) return;
    const addons: BookingAddons = { desayuno: false, cancelacionFlexible: false, ...booking.addons, [key]: on };
    const next = withAmounts({ ...booking, addons });
    const { amountTotal, amountPaid, amountPending, isDeposit, ...persist } = next; // eslint-disable-line @typescript-eslint/no-unused-vars
    saveBookingState(persist);
    setBooking(next);
    trackEvent('ADDON_TOGGLE', { addon: key, on });
  }

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

  // Precio de cada add-on como si estuviera activado, para que el huésped vea
  // cuánto suma ANTES de marcarlo.
  const personas = booking.adults + booking.children;
  const conTodo = calcStayTotals({ ...booking, addons: { desayuno: true, cancelacionFlexible: true } });
  const sinCancel = calcStayTotals({ ...booking, addons: { desayuno: !!booking.addons?.desayuno, cancelacionFlexible: true } });
  const addonsTotals = {
    desayunoMonto: conTodo.addons.desayuno,
    desayunoLabel: `${personas} persona${personas !== 1 ? 's' : ''} × ${booking.nights} noche${booking.nights !== 1 ? 's' : ''}`,
    cancelMonto: sinCancel.addons.cancelacionFlexible,
  };

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

            <fieldset className={styles.addons}>
              <legend className={styles.addonsTitle}>Mejora tu estancia</legend>

              <label className={`${styles.addonCard} ${booking.addons?.desayuno ? styles.addonCardOn : ''}`}>
                <input
                  type="checkbox"
                  checked={!!booking.addons?.desayuno}
                  onChange={e => toggleAddon('desayuno', e.target.checked)}
                />
                <Coffee size={20} strokeWidth={1.5} className={styles.addonIcon} aria-hidden="true" />
                <span className={styles.addonText}>
                  <strong>Desayuno americano</strong>
                  <small>{DESAYUNO_MENU}</small>
                  <small>
                    {formatMXN(DESAYUNO_PRECIO)} por persona por noche · {addonsTotals.desayunoLabel}
                  </small>
                </span>
                <span className={styles.addonPrice}>+{formatMXN(addonsTotals.desayunoMonto)}</span>
              </label>

              <label className={`${styles.addonCard} ${booking.addons?.cancelacionFlexible ? styles.addonCardOn : ''}`}>
                <input
                  type="checkbox"
                  checked={!!booking.addons?.cancelacionFlexible}
                  onChange={e => toggleAddon('cancelacionFlexible', e.target.checked)}
                />
                <CalendarX size={20} strokeWidth={1.5} className={styles.addonIcon} aria-hidden="true" />
                <span className={styles.addonText}>
                  <strong>Cancelación flexible</strong>
                  <small>{CANCELACION_FLEX_REGLA} 10% extra sobre el total.</small>
                </span>
                <span className={styles.addonPrice}>+{formatMXN(addonsTotals.cancelMonto)}</span>
              </label>
            </fieldset>

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
