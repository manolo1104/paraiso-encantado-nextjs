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
import { ChevronLeft, ChevronRight, Lock, ShieldCheck, Coffee, CalendarX, Clock, CalendarDays } from 'lucide-react';
import {
  loadBookingState,
  saveBookingState,
  BookingState,
  BookingAddons,
  BOOKING_ROOMS,
  calcStayTotals,
  calcNights,
  validatePromo,
  calcPromoDiscount,
  formatMXN,
  DESAYUNO_PRECIO,
  DESAYUNO_MENU,
  LATE_CHECKOUT_PRECIO,
  LATE_CHECKOUT_REGLA,
  CANCELACION_FLEX_REGLA,
  calcDepositAmount,
} from '@/lib/booking';
import { recortarFactores } from '@/lib/precios';
import styles from './checkout.module.css';
import CheckoutProgressBar from '@/components/CheckoutProgressBar';
import BookingSummary from '@/components/BookingSummary';
import StayDateField from '@/components/calendario/StayDateField';
import WhatsAppRecoveryWidget from '@/components/WhatsAppRecoveryWidget';
import { trackEvent } from '@/lib/analytics';
import { getHoldSessionId } from '@/lib/hold-session';
import { loadGuestInfo, saveGuestInfo } from '@/lib/guest-info';

const API = '';

// Fuentes de «¿Cómo nos conociste?». `valor` es lo que se guarda en la hoja
// (columna «¿Cómo nos conociste?» de Reservas): no cambiarlo sin cambiar los
// informes que lo leen.
const FUENTES = [
  { valor: 'google_busqueda', texto: 'Google' },
  { valor: 'google_maps', texto: 'Google Maps' },
  { valor: 'chatgpt_ia', texto: 'ChatGPT / IA' },
  { valor: 'facebook', texto: 'Facebook' },
  { valor: 'instagram', texto: 'Instagram' },
  { valor: 'tiktok', texto: 'TikTok' },
  { valor: 'youtube', texto: 'YouTube' },
  { valor: 'recomendacion', texto: 'Me lo recomendaron' },
  { valor: 'booking', texto: 'Booking' },
  { valor: 'otro', texto: 'Otro' },
] as const;

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
  // Cambiar fechas aquí mismo (10 nov 2026, Clarity: en celular «Volver» se
  // tocaba más que «Continuar al pago» y 9 personas tocaron las fechas del
  // resumen, que no hacían nada; «Volver» además tira la suite y los extras).
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [cambiandoFechas, setCambiandoFechas] = useState(false);
  const [avisoFechas, setAvisoFechas] = useState('');

  useEffect(() => {
    // Llega desde /reservar bajado: Next no sube solo porque esta página se
    // pinta después de leer la reserva. Arriba están el resumen y el nombre.
    window.scrollTo(0, 0);
    const state = loadBookingState();
    if (!state || state.cart.length === 0 || !state.checkin) {
      router.replace('/reservar');
      return;
    }
    setBooking(withAmounts(state));

    // Precio dinámico vigente: si cambió desde que armó el carrito, se adopta
    // aquí para que el resumen, el correo de recuperación y el cobro coincidan.
    fetch(`${API}/api/precios`)
      .then(r => r.json())
      .then(d => {
        // Solo las noches de ESTA estancia. Sin recortar, el estado guardaba el
        // calendario del año entero y la comparación con los factores recortados
        // del servidor (en /reservar/pago) nunca empataba: la detección de
        // "el precio se movió" no detectaba nada y el estado se reescribía en
        // cada carga.
        const vigentes = d?.activo && d?.factores
          ? recortarFactores(d.factores, state.checkin, state.checkout)
          : {};
        if (JSON.stringify(vigentes) === JSON.stringify(state.factores || {})) return;
        const actualizado = withAmounts({ ...state, factores: vigentes });
        saveBookingState(actualizado);
        setBooking(actualizado);
      })
      .catch(() => {});

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
    const addons: BookingAddons = { desayuno: false, cancelacionFlexible: false, lateCheckout: false, ...booking.addons, [key]: on };
    const next = withAmounts({ ...booking, addons });
    const { amountTotal, amountPaid, amountPending, isDeposit, ...persist } = next; // eslint-disable-line @typescript-eslint/no-unused-vars
    saveBookingState(persist);
    setBooking(next);
    trackEvent('ADDON_TOGGLE', { addon: key, on });
  }

  /**
   * Fechas nuevas elegidas en el calendario de esta pantalla. Se confirma con
   * el servidor que las MISMAS suites del carrito sigan libres (la verdad final:
   * el calendario puede tener unos minutos de atraso y no ve los apartados), y
   * solo entonces se rehace la reserva como en `goToCheckout` de /reservar:
   * noches, precio dinámico de esas noches, código de descuento (se quita si ya
   * no aplica) y el apartado temporal, que se mueve a las fechas nuevas.
   */
  async function cambiarFechas(v: { checkin: string; checkout: string }) {
    if (!booking || cambiandoFechas) return;
    const noches = calcNights(v.checkin, v.checkout);
    if (!v.checkin || !v.checkout || noches <= 0) return;
    if (v.checkin === booking.checkin && v.checkout === booking.checkout) return;

    const nombres = booking.cart.map(i => BOOKING_ROOMS.find(r => r.id === i.roomId)!.name);
    const antes = { checkin: booking.checkin, checkout: booking.checkout };
    setCambiandoFechas(true);
    setAvisoFechas('');
    try {
      const res = await fetch(`${API}/api/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin: v.checkin, checkout: v.checkout, rooms: nombres,
          guests: booking.adults + booking.children, sessionId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.degraded) {
        setAvisoFechas('No pudimos confirmar esas fechas. Inténtalo otra vez en un momento.');
        return;
      }
      const sinLugar: string[] = Array.isArray(data.unavailableRooms) ? data.unavailableRooms : [];
      if (sinLugar.length > 0) {
        setAvisoFechas(`${sinLugar.join(' y ')} ya no ${sinLugar.length > 1 ? 'tienen' : 'tiene'} lugar esas noches. Elige otras fechas.`);
        trackEvent('CHECKOUT_FECHAS_CAMBIADAS', { ok: false, checkin: v.checkin, checkout: v.checkout, rooms: booking.cart.length });
        return;
      }

      let factores = {};
      try {
        const d = await fetch(`${API}/api/precios`).then(r => r.json());
        if (d?.activo && d?.factores) factores = recortarFactores(d.factores, v.checkin, v.checkout);
      } catch { /* sin precio dinámico: precio de lista, igual que si el servidor no responde */ }

      const promo = booking.promoCode && validatePromo(booking.promoCode, noches, booking.cart.length).valid
        ? booking.promoCode : null;
      const { amountTotal, amountPaid, amountPending, isDeposit, ...base } = booking; // eslint-disable-line @typescript-eslint/no-unused-vars
      const nuevo: BookingState = {
        ...base,
        checkin: v.checkin,
        checkout: v.checkout,
        nights: noches,
        factores,
        promoCode: promo,
        promoDiscount: promo ? calcPromoDiscount(promo, booking.cart, v.checkin, v.checkout, noches, factores) : 0,
      };
      saveBookingState(nuevo);
      setBooking(withAmounts(nuevo));

      // El apartado de 10 min es por noche: renovar con las fechas nuevas y la
      // misma sesión reemplaza el anterior en una sola escritura.
      fetch(`${API}/api/renew-temporary-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin: v.checkin, checkout: v.checkout, rooms: nombres, sessionId }),
      }).catch(() => {});
      // Si después toca «Volver», /reservar abre con estas fechas.
      try {
        sessionStorage.setItem('pe_last_dates', JSON.stringify({ checkin: v.checkin, checkout: v.checkout, adults: String(booking.adults) }));
      } catch { /* ignore */ }

      trackEvent('CHECKOUT_FECHAS_CAMBIADAS', {
        ok: true, antes: `${antes.checkin}→${antes.checkout}`, checkin: v.checkin, checkout: v.checkout,
        nights: noches, rooms: booking.cart.length, promoQuitada: !!booking.promoCode && !promo,
      });
    } catch {
      setAvisoFechas('No pudimos confirmar esas fechas. Inténtalo otra vez en un momento.');
    } finally {
      setCambiandoFechas(false);
    }
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

  // Antes de leer la reserva: el mismo cascarón que la pantalla final (barras +
  // espacio reservado). Con `return null` el pie de página subía hasta arriba y
  // luego bajaba de golpe al aparecer el formulario (Clarity: CLS 2.3 aquí).
  if (!booking) {
    return (
      <main className={styles.main} aria-busy="true">
        <CheckoutProgressBar currentStep={2} />
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => router.push('/reservar')}>
            <ChevronLeft size={15} strokeWidth={2} /> Volver
          </button>
          <span className={styles.topTitle}>Tus Datos</span>
          <span className={styles.topSecure}><Lock size={12} strokeWidth={1.5} /> Pago Seguro</span>
        </div>
        <div className={`${styles.resumenMovil} ${styles.resumenMovilCascaron}`} aria-hidden="true" />
        <div className={styles.layout}>
          <div className={`${styles.formCol} ${styles.formCascaron}`} />
        </div>
      </main>
    );
  }

  // Precio de cada add-on como si estuviera activado, para que el huésped vea
  // cuánto suma ANTES de marcarlo.
  const personas = booking.adults + booking.children;
  const habs = booking.cart.length;
  const noches = `${booking.nights} noche${booking.nights !== 1 ? 's' : ''}`;
  const totalesResumen = calcStayTotals(booking);
  const pagaHoy = calcDepositAmount(totalesResumen.total, booking.nights);
  const fmtCorta = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  const conTodo = calcStayTotals({ ...booking, addons: { desayuno: true, cancelacionFlexible: true, lateCheckout: true } });
  const conCancel = calcStayTotals({ ...booking, addons: { ...booking.addons, desayuno: !!booking.addons?.desayuno, cancelacionFlexible: true } });
  const addonsTotals = {
    desayunoMonto: conTodo.addons.desayuno,
    desayunoLabel: `${personas} persona${personas !== 1 ? 's' : ''} × ${noches}`,
    lateMonto: conTodo.addons.lateCheckout,
    lateLabel: `${habs} habitación${habs !== 1 ? 'es' : ''}`,
    cancelMonto: conCancel.addons.cancelacionFlexible,
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

      {/* Resumen corto arriba en celular (28 oct 2026): que se vea qué suite,
          qué fechas y cuánto se paga HOY antes de pedir un solo dato. El
          Resumen completo sigue abajo del formulario. */}
      <div className={styles.resumenMovil}>
        <span className={styles.resumenMovilSuite}>
          {booking.cart.map(i => BOOKING_ROOMS.find(r => r.id === i.roomId)?.name).filter(Boolean).join(' + ')}
        </span>
        <button
          type="button"
          className={styles.resumenMovilFechas}
          onClick={() => setCalendarioAbierto(true)}
          disabled={cambiandoFechas}
          aria-label={`Cambiar fechas: ${fmtCorta(booking.checkin)} a ${fmtCorta(booking.checkout)}`}
        >
          <CalendarDays size={14} strokeWidth={1.6} aria-hidden="true" />
          <span>{fmtCorta(booking.checkin)} → {fmtCorta(booking.checkout)} · {noches} · {personas} {personas === 1 ? 'persona' : 'personas'}</span>
          <span className={styles.cambiarFechas}>{cambiandoFechas ? 'Revisando…' : 'Cambiar'}</span>
        </button>
        <span className={styles.resumenMovilTotal}>
          <strong>{formatMXN(totalesResumen.total)}</strong>
          {pagaHoy < totalesResumen.total
            ? <> · hoy pagas <strong>{formatMXN(pagaHoy)}</strong> (50%), el resto al llegar</>
            : <> · se paga al reservar</>}
        </span>
      </div>

      <div className={styles.layout}>
        <div className={styles.formCol}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {avisoFechas && <p className={styles.avisoFechas} role="alert">{avisoFechas}</p>}

            <h2 className={styles.formTitle}>Datos del Huésped</h2>

            {/* 🔴 data-clarity-mask: nombre, correo y teléfono. Clarity ya tapa
                los campos de formulario por omisión, pero la marca explícita
                sobrevive a que alguien cambie el nivel de enmascaramiento en
                el panel, que es un ajuste de la cuenta y no del código. */}
            <div className={styles.formGrid} data-clarity-mask="true">
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

            </div>

            {/* «¿Cómo nos conociste?» va A LA VISTA y en botones de un toque.
                El 28 oct se plegó junto con las peticiones y 5 de 6 reservas web
                (29 oct–7 nov) llegaron sin fuente, contra 12 de 12 cuando se
                veía: sin esto no se sabe qué canal vende. Sigue sin ser
                obligatoria. Los valores son los mismos que lee la hoja. */}
            <fieldset className={styles.conociste}>
              <legend className={styles.conocisteTitulo}>¿Cómo nos conociste?</legend>
              <div className={styles.conocisteOpciones}>
                {FUENTES.map(f => (
                  <button
                    key={f.valor}
                    type="button"
                    className={`${styles.conocisteChip} ${howDidYouHear === f.valor ? styles.conocisteChipOn : ''}`}
                    aria-pressed={howDidYouHear === f.valor}
                    onClick={() => setHowDidYouHear(howDidYouHear === f.valor ? '' : f.valor)}
                  >
                    {f.texto}
                  </button>
                ))}
              </div>
            </fieldset>

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

              <label className={`${styles.addonCard} ${booking.addons?.lateCheckout ? styles.addonCardOn : ''}`}>
                <input
                  type="checkbox"
                  checked={!!booking.addons?.lateCheckout}
                  onChange={e => toggleAddon('lateCheckout', e.target.checked)}
                />
                <Clock size={20} strokeWidth={1.5} className={styles.addonIcon} aria-hidden="true" />
                <span className={styles.addonText}>
                  <strong>Late check-out</strong>
                  <small>{LATE_CHECKOUT_REGLA}</small>
                  <small>
                    {formatMXN(LATE_CHECKOUT_PRECIO)} por habitación, una sola vez · {addonsTotals.lateLabel}
                  </small>
                </span>
                <span className={styles.addonPrice}>+{formatMXN(addonsTotals.lateMonto)}</span>
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


            {/* Lo que no hace falta para reservar va plegado (28 oct 2026, Clarity:
                quien llegaba aquí se iba en <35 s sin escribir; 7 campos a la vista). */}
            <details className={styles.opcional}>
              <summary>Peticiones especiales <em>(opcional)</em></summary>

            {/* Texto libre del huésped: alergias, celebraciones, salud. Lo más
                delicado del formulario. */}
            <label className={styles.formLabel} style={{ marginTop: 8 }} data-clarity-mask="true">
              <span>Peticiones especiales (opcional)</span>
              <textarea
                className={`${styles.formInput} ${styles.formTextarea}`}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Alergias, celebraciones, llegada tardía…"
                rows={3}
              />
            </label>
            </details>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button type="submit" className={styles.payBtn} disabled={saving}>
              {saving ? <span>Guardando…</span> : (<>Continuar al pago <ChevronRight size={16} strokeWidth={2} /></>)}
            </button>

            <p className={styles.secureNote}>
              <ShieldCheck size={12} strokeWidth={1.5} /> Todavía no se te cobra nada. En el siguiente paso eliges cómo pagar.
            </p>
          </form>
        </div>

        <BookingSummary
          booking={booking}
          onCambiarFechas={() => setCalendarioAbierto(true)}
          cambiandoFechas={cambiandoFechas}
        />
      </div>

      {/* 1 suite: el calendario de ESA suite (solo sus noches libres, con su
          precio). 2+ suites: el general, y el servidor confirma las del carrito. */}
      <StayDateField
        sinCampo
        valor={{ checkin: booking.checkin, checkout: booking.checkout }}
        onChange={cambiarFechas}
        grupo={booking.cart.length === 1
          ? { adultos: booking.cart[0].guestCount, menores: booking.children, suiteId: booking.cart[0].roomId }
          : { adultos: booking.adults, menores: booking.children }}
        abierto={calendarioAbierto}
        onAbiertoChange={setCalendarioAbierto}
        titulo="Cambia tus fechas"
      />
      <WhatsAppRecoveryWidget />
    </main>
  );
}
