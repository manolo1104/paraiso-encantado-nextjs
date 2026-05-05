'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wifi, Bath, BedDouble, Sparkles, Droplets, Users, Plus, Minus, ChevronRight, X, Tag, ShieldCheck, CalendarDays, ChevronLeft, Info, AlertTriangle, Check, Ban } from 'lucide-react';
import {
  BOOKING_ROOMS,
  SUITE_ID_TO_ROOM_ID,
  BookingRoom,
  CartItem,
  BookingState,
  PromoCode,
  calcRoomStayTotal,
  calcRoomStayNormal,
  calcNights,
  calcCartSubtotal,
  calcPromoDiscount,
  validatePromo,
  VALID_PROMO_CODES,
  saveBookingState,
  formatMXN,
} from '@/lib/booking';
import styles from './reservar.module.css';
import ReservationUrgencyBar from '@/components/ReservationUrgencyBar';
import RecentBookingsTicker from '@/components/RecentBookingsTicker';
import CheckoutProgressBar from '@/components/CheckoutProgressBar';
import TrustBadgesReservar from '@/components/TrustBadgesReservar';
import WhatsAppRecoveryWidget from '@/components/WhatsAppRecoveryWidget';
import { trackEvent } from '@/lib/analytics';

const API = '';

// ── Room Detail Drawer ────────────────────────────────────
function RoomDrawer({
  room,
  onClose,
  onAdd,
  onRemove,
  inCart,
  searched,
  guestCount,
  checkin,
  checkout,
  nights,
}: {
  room: BookingRoom;
  onClose: () => void;
  onAdd: (room: BookingRoom) => void;
  onRemove: (id: number) => void;
  inCart: boolean;
  searched: boolean;
  guestCount: number;
  checkin: string;
  checkout: string;
  nights: number;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const total = searched ? calcRoomStayTotal(room, guestCount, checkin, checkout) : null;
  const normal = searched ? calcRoomStayNormal(room, guestCount, checkin, checkout) : null;
  const hasDiscount = normal != null && total != null && normal > total;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>{room.name}</h2>
          <button className={styles.drawerClose} onClick={onClose} aria-label="Cerrar">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className={styles.drawerGallery}>
          <div className={styles.drawerMainImg}>
            <Image
              src={room.images[imgIdx]}
              alt={`${room.name} — foto ${imgIdx + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className={styles.drawerMainImgEl}
              priority
            />
            {room.images.length > 1 && (
              <>
                <button className={styles.drawerPrev} onClick={() => setImgIdx(i => (i - 1 + room.images.length) % room.images.length)}>
                  <ChevronLeft size={20} strokeWidth={2} />
                </button>
                <button className={styles.drawerNext} onClick={() => setImgIdx(i => (i + 1) % room.images.length)}>
                  <ChevronRight size={20} strokeWidth={2} />
                </button>
                <span className={styles.drawerImgCount}>{imgIdx + 1} / {room.images.length}</span>
              </>
            )}
          </div>
          {room.images.length > 1 && (
            <div className={styles.drawerThumbs}>
              {room.images.map((src, i) => (
                <button key={i} className={`${styles.drawerThumb} ${i === imgIdx ? styles.drawerThumbActive : ''}`} onClick={() => setImgIdx(i)} aria-label={`Foto ${i + 1}`}>
                  <Image src={src} alt="" fill sizes="80px" className={styles.drawerThumbImg} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.drawerMeta}>
            <span className={styles.drawerCategory}>{room.category}</span>
            <span className={styles.drawerMaxGuests}><Users size={13} strokeWidth={1.5} /> Hasta {room.maxGuests} personas</span>
          </div>
          <p className={styles.drawerDesc}>{room.description}</p>
          <div className={styles.drawerAttrs}>
            {room.attributes.wifi && <span><Wifi size={14} strokeWidth={1.5} /> WiFi incluido</span>}
            {room.attributes.spaPrivado && <span><Sparkles size={14} strokeWidth={1.5} /> Spa privado</span>}
            {room.attributes.jacuzzi && <span><Droplets size={14} strokeWidth={1.5} /> Tina de hidromasaje</span>}
            {room.attributes.kingBed && <span><BedDouble size={14} strokeWidth={1.5} /> Cama King Size</span>}
            {room.attributes.balcony && <span><Bath size={14} strokeWidth={1.5} /> Terraza / Balcón</span>}
          </div>
          <div className={styles.drawerSection}>
            <h3 className={styles.drawerSectionTitle}>Lo que incluye</h3>
            <ul className={styles.drawerFeatures}>
              {room.features.map(f => <li key={f}>{f}</li>)}
            </ul>
          </div>
          <div className={styles.drawerPricing}>
            {searched && total !== null ? (
              <>
                {hasDiscount && <span className={styles.drawerPriceNormal}>{formatMXN(normal!)}</span>}
                <span className={styles.drawerPriceMain}>{formatMXN(total)}</span>
                <span className={styles.drawerPriceSub}>{nights} noche{nights !== 1 ? 's' : ''} · {guestCount} adulto{guestCount !== 1 ? 's' : ''}</span>
                {hasDiscount && <span className={styles.drawerPriceSavings}>Ahorro: {formatMXN(normal! - total)} con tarifa entre semana</span>}
              </>
            ) : (
              <>
                <span className={styles.drawerPriceMain}>desde {formatMXN(room.price)}</span>
                <span className={styles.drawerPriceSub}>por noche · 2 personas</span>
              </>
            )}
          </div>
          <button
            className={`${styles.drawerCta} ${inCart ? styles.drawerCtaAdded : ''}`}
            onClick={() => inCart ? onRemove(room.id) : onAdd(room)}
            disabled={!searched}
          >
            {!searched ? 'Selecciona fechas para reservar' : inCart ? <><Check size={14} strokeWidth={2} /> Quitar del carrito</> : `Agregar al carrito — ${formatMXN(total ?? room.price)}`}
          </button>
          {!searched && <p className={styles.drawerCtaNote}>Elige tus fechas arriba y busca disponibilidad</p>}
        </div>
      </div>
    </div>
  );
}

// ── Inner page (needs useSearchParams) ───────────────────
function ReservarPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // ── Search state ──────────────────────────────────────
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [datesOverlapBlocked, setDatesOverlapBlocked] = useState(false);

  // ── Cart ──────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  // ── Promo ─────────────────────────────────────────────
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  // ── UI ────────────────────────────────────────────────
  const [lightboxRoom, setLightboxRoom] = useState<BookingRoom | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [detailRoom, setDetailRoom] = useState<BookingRoom | null>(null);

  const nights = calcNights(checkin, checkout);
  const today = new Date().toISOString().split('T')[0];
  const minCheckout = checkin
    ? new Date(new Date(checkin).getTime() + 86400000).toISOString().split('T')[0]
    : today;

  // ── Fetch blocked dates from Sheets on mount ──────────
  useEffect(() => {
    fetch(`${API}/api/fully-booked-dates`)
      .then(r => r.json())
      .then(d => setBlockedDates(d.blockedDates || []))
      .catch(() => {});
  }, []);

  // Suite a agregar automáticamente al carrito después de la búsqueda
  const pendingAutoSelectId = useRef<number | null>(null);

  // ── Pre-fill + auto-search from URL params ────────────
  useEffect(() => {
    const ci = searchParams.get('checkin');
    const co = searchParams.get('checkout');
    const a = searchParams.get('adults');
    const suiteSlug = searchParams.get('suiteId');
    const autoselect = searchParams.get('autoselect') === '1';

    // Leer fechas guardadas en sessionStorage si no vienen en la URL
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    let saved: { checkin: string; checkout: string; adults: string } | null = null;
    try {
      const raw = sessionStorage.getItem('pe_last_dates');
      if (raw) saved = JSON.parse(raw);
    } catch { /* ignore */ }

    const finalCi = ci || saved?.checkin || today;
    const finalCo = co || saved?.checkout || tomorrow;
    const finalA  = a  || saved?.adults  || '2';

    setCheckin(finalCi);
    setCheckout(finalCo);
    setAdults(Math.max(1, Math.min(12, parseInt(finalA, 10) || 2)));

    // Guardar fechas para que las páginas de suite puedan leerlas
    try {
      sessionStorage.setItem('pe_last_dates', JSON.stringify({ checkin: finalCi, checkout: finalCo, adults: finalA }));
    } catch { /* ignore */ }

    // Si viene con suiteId + autoselect, preparar auto-agregar al carrito
    if (autoselect && suiteSlug && SUITE_ID_TO_ROOM_ID[suiteSlug]) {
      pendingAutoSelectId.current = SUITE_ID_TO_ROOM_ID[suiteSlug];
    }

    // Auto-buscar si hay fechas válidas
    if (calcNights(finalCi, finalCo) > 0) {
      triggerSearch(finalCi, finalCo);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Warn when selected dates overlap fully-booked ────
  useEffect(() => {
    if (!checkin || !checkout || blockedDates.length === 0) {
      setDatesOverlapBlocked(false);
      return;
    }
    // Build list of nights in the selected range
    const start = new Date(`${checkin}T12:00:00`);
    const end = new Date(`${checkout}T12:00:00`);
    const cursor = new Date(start);
    while (cursor < end) {
      const ds = cursor.toISOString().split('T')[0];
      if (blockedDates.includes(ds)) {
        setDatesOverlapBlocked(true);
        return;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    setDatesOverlapBlocked(false);
  }, [checkin, checkout, blockedDates]);

  // ── Analytics tracking ────────────────────────────────
  const startTime = useRef(Date.now());
  const cartAbandonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchedRef = useRef(false);

  useEffect(() => {
    trackEvent('PAGE_VIEW', { path: '/reservar' });
    trackEvent('BOOKING_START');
    return () => { if (cartAbandonTimer.current) clearTimeout(cartAbandonTimer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (checkin && checkout && nights > 0) {
      trackEvent('DATES_SELECTED', { checkin, checkout, nights });
    }
  }, [checkin, checkout, nights]);

  useEffect(() => {
    trackEvent('GUEST_COUNT_CHANGED', { guests: adults });
  }, [adults]);

  // ── Core search function ──────────────────────────────
  async function triggerSearch(ci: string, co: string) {
    const n = calcNights(ci, co);
    if (!ci || !co || n <= 0) return;
    setSearching(true);
    setCart([]);
    setPromoCode(null);
    setPromoDiscount(0);
    try {
      const roomNames = BOOKING_ROOMS.map(r => r.name);
      const res = await fetch(`${API}/api/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin: ci, checkout: co, rooms: roomNames }),
      });
      const data = await res.json();
      setUnavailable(data.unavailableRooms || []);
    } catch {
      setUnavailable([]);
    } finally {
      setSearching(false);
      setSearched(true);
      // Scroll to results after short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      // Auto-agregar suite al carrito si viene de una página de habitación
      if (pendingAutoSelectId.current !== null) {
        const roomId = pendingAutoSelectId.current;
        pendingAutoSelectId.current = null;
        const room = BOOKING_ROOMS.find(r => r.id === roomId);
        if (room) {
          const guestCount = Math.max(1, Math.min(adults, room.maxGuests));
          setCart([{ roomId: room.id, guestCount }]);
          trackEvent('SUITE_SELECTED', { suite: room.name, guests: guestCount, source: 'suite_page_cta' });
          // Scroll al sidebar después de agregar
          setTimeout(() => {
            sidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 400);
        }
      }
      // Arrancar timer de abandono SOLO después de ver resultados (primera vez)
      if (!searchedRef.current) {
        searchedRef.current = true;
        if (cartAbandonTimer.current) clearTimeout(cartAbandonTimer.current);
        cartAbandonTimer.current = setTimeout(() => {
          trackEvent('CART_ABANDON', {
            timeOnPage: Math.round((Date.now() - startTime.current) / 1000),
            checkin: ci, checkout: co, guests: adults,
          });
        }, 180_000);
      }
    }
  }

  async function handleSearch() {
    await triggerSearch(checkin, checkout);
  }

  function saveDatesToSession(ci: string, co: string, a: number) {
    try { sessionStorage.setItem('pe_last_dates', JSON.stringify({ checkin: ci, checkout: co, adults: String(a) })); } catch { /* ignore */ }
  }

  function handleCheckinChange(v: string) {
    setCheckin(v);
    let newCo = checkout;
    if (checkout && v >= checkout) {
      const next = new Date(new Date(v).getTime() + 86400000).toISOString().split('T')[0];
      setCheckout(next);
      newCo = next;
    }
    saveDatesToSession(v, newCo, adults);
    setSearched(false);
    setUnavailable([]);
    setCart([]);
    setPromoCode(null);
    setPromoDiscount(0);
  }

  function handleCheckoutChange(v: string) {
    setCheckout(v);
    saveDatesToSession(checkin, v, adults);
    setSearched(false);
    setUnavailable([]);
    setCart([]);
    setPromoCode(null);
    setPromoDiscount(0);
  }

  // ── Cart helpers ──────────────────────────────────────
  function getRoomGuests(roomId: number): number {
    const room = BOOKING_ROOMS.find(r => r.id === roomId)!;
    return Math.max(1, Math.min(adults, room.maxGuests));
  }

  function addToCart(room: BookingRoom) {
    if (cart.find(c => c.roomId === room.id)) return;
    setCart(prev => [...prev, { roomId: room.id, guestCount: getRoomGuests(room.id) }]);
    // Usuario eligió habitación — ya no es abandono
    if (cartAbandonTimer.current) { clearTimeout(cartAbandonTimer.current); cartAbandonTimer.current = null; }
  }

  function removeFromCart(roomId: number) {
    const next = cart.filter(c => c.roomId !== roomId);
    setCart(next);
    if (promoCode) {
      const disc = calcPromoDiscount(promoCode, next, checkin, checkout, nights);
      setPromoDiscount(disc);
    }
  }

  // ── Promo ─────────────────────────────────────────────
  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    const { valid, error } = validatePromo(code, nights, cart.length);
    if (!valid) { setPromoError(error!); return; }
    setPromoCode(code as PromoCode);
    setPromoError('');
    const disc = calcPromoDiscount(code as PromoCode, cart, checkin, checkout, nights);
    setPromoDiscount(disc);
  }

  // ── Totals ────────────────────────────────────────────
  const subtotal = calcCartSubtotal(cart, checkin, checkout);
  const total = Math.max(0, subtotal - promoDiscount);

  // ── Proceed to checkout ───────────────────────────────
  function goToCheckout() {
    if (cart.length === 0 || !checkin || !checkout) return;
    const state: BookingState = {
      checkin, checkout, nights, adults, children,
      cart, promoCode, promoDiscount,
    };
    saveBookingState(state);
    trackEvent('CHECKOUT_STEP_1', { rooms: cart.length, checkin, checkout, guests: adults });
    if (cartAbandonTimer.current) clearTimeout(cartAbandonTimer.current);
    router.push('/reservar/checkout');
  }

  // ── Capacity validation ───────────────────────────────
  const cartCapacity = cart.reduce((sum, item) => {
    const room = BOOKING_ROOMS.find(r => r.id === item.roomId);
    return sum + (room?.maxGuests ?? 0);
  }, 0);
  const capacityOk = cart.length === 0 || cartCapacity >= adults;

  // ── Room grid helpers ─────────────────────────────────
  const visibleRooms = BOOKING_ROOMS.filter(r => !r.disabled);
  const isUnavailable = (r: BookingRoom) => unavailable.includes(r.name);
  const inCart = (id: number) => cart.some(c => c.roomId === id);

  return (
    <main className={styles.main}>
      <div className={styles.pageHeader}>
        <p className={styles.eyebrow}>Reserva Directa · Sin Comisiones</p>
        <h1>Reserva tu <em>Suite</em></h1>
        <p className={styles.headerSub}>
          Sin intermediarios · Confirmación instantánea · Cancela hasta 48 hrs antes
        </p>
      </div>

      <CheckoutProgressBar currentStep={1} />
      <TrustBadgesReservar />
      <RecentBookingsTicker />
      <ReservationUrgencyBar />

      {/* ── Search bar ── */}
      <div className={styles.searchBar}>
        <div className={styles.searchFields}>
          <label className={styles.fieldLabel}>
            <span>Llegada</span>
            <input
              type="date"
              className={styles.dateInput}
              value={checkin}
              min={today}
              onChange={e => handleCheckinChange(e.target.value)}
            />
          </label>
          <div className={styles.fieldDivider} />
          <label className={styles.fieldLabel}>
            <span>Salida</span>
            <input
              type="date"
              className={styles.dateInput}
              value={checkout}
              min={minCheckout}
              onChange={e => handleCheckoutChange(e.target.value)}
            />
          </label>
          <div className={styles.fieldDivider} />
          <div className={styles.guestField}>
            <span className={styles.guestLabel}>Adultos</span>
            <div className={styles.counter}>
              <button onClick={() => setAdults(a => Math.max(1, a - 1))} aria-label="Menos adultos"><Minus size={14} /></button>
              <span>{adults}</span>
              <button onClick={() => setAdults(a => Math.min(12, a + 1))} aria-label="Más adultos"><Plus size={14} /></button>
            </div>
          </div>
          <div className={styles.fieldDivider} />
          <div className={styles.guestField}>
            <span className={styles.guestLabel}>Menores (−6)</span>
            <div className={styles.counter}>
              <button onClick={() => setChildren(c => Math.max(0, c - 1))} aria-label="Menos menores"><Minus size={14} /></button>
              <span>{children}</span>
              <button onClick={() => setChildren(c => c + 1)} aria-label="Más menores"><Plus size={14} /></button>
            </div>
          </div>
        </div>
        <button
          className={styles.searchBtn}
          onClick={handleSearch}
          disabled={!checkin || !checkout || nights <= 0 || searching}
        >
          {searching ? 'Verificando…' : searched ? 'Actualizar' : 'Ver disponibilidad'}
        </button>
      </div>

      {/* ── Date summary + blocked warning ── */}
      {nights > 0 && checkin && checkout && (
        <div className={styles.dateSummaryRow}>
          <p className={styles.nightsSummary}>
            <CalendarDays size={14} strokeWidth={1.5} />
            {' '}{nights} noche{nights !== 1 ? 's' : ''} · {new Date(`${checkin}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} → {new Date(`${checkout}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
          </p>
          {datesOverlapBlocked && (
            <p className={styles.blockedWarning}>
              <AlertTriangle size={13} strokeWidth={2} />
              {' '}Algunas noches en este rango están completamente reservadas. Podría haber disponibilidad limitada.
            </p>
          )}
        </div>
      )}

      <div className={styles.layout} ref={resultsRef}>
        {/* ── Room grid ── */}
        <div className={styles.roomGrid}>
          {!searched && !searching && (
            <div className={styles.promptBanner}>
              <CalendarDays size={20} strokeWidth={1.5} />
              <span>Selecciona tus fechas y haz clic en <strong>Ver disponibilidad</strong> para ver precios exactos y disponibilidad en tiempo real.</span>
            </div>
          )}
          {searching && (
            <div className={styles.searchingBanner}>
              <div className={styles.searchSpinner} />
              <span>Consultando disponibilidad en tiempo real…</span>
            </div>
          )}

          {visibleRooms.map(room => {
            const unavail = isUnavailable(room);
            const added = inCart(room.id);
            const guestCount = getRoomGuests(room.id);
            const total_room = searched ? calcRoomStayTotal(room, guestCount, checkin, checkout) : null;
            const normal_room = searched ? calcRoomStayNormal(room, guestCount, checkin, checkout) : null;
            const hasDiscount = normal_room != null && total_room != null && normal_room > total_room;
            const discPct = hasDiscount ? Math.round(((normal_room! - total_room!) / normal_room!) * 100) : 0;

            return (
              <article
                key={room.id}
                className={`${styles.roomCard} ${unavail ? styles.unavailable : ''} ${added ? styles.inCart : ''}`}
                onClick={() => setDetailRoom(room)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                aria-label={`Ver detalles de ${room.name}`}
                onKeyDown={e => e.key === 'Enter' && setDetailRoom(room)}
              >
                {/* Image */}
                <div
                  className={styles.roomImageWrap}
                  onClick={e => e.stopPropagation()}
                >
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={styles.roomImage}
                  />
                  <div className={styles.roomBadges}>
                    <span className={styles.categoryBadge}>{room.category}</span>
                    {room.occupancy === 'HIGH' && <span className={styles.hotBadge}>Alta demanda</span>}
                    {hasDiscount && <span className={styles.discountBadge}>−{discPct}%</span>}
                  </div>
                  <button
                    className={styles.photoBtn}
                    onClick={e => { e.stopPropagation(); setLightboxRoom(room); setLightboxIdx(0); }}
                    aria-label={`Ver galería de ${room.name}`}
                  >
                    Ver fotos ({room.images.length})
                  </button>
                  {unavail && (
                    <div className={styles.unavailOverlay}>
                      <span><Ban size={14} strokeWidth={2} /> No disponible</span>
                      <span className={styles.unavailSub}>Agotada en estas fechas</span>
                    </div>
                  )}
                  {added && <div className={styles.addedOverlay}><span><Check size={14} strokeWidth={2} /> Agregada al carrito</span></div>}
                  {!unavail && !added && adults > room.maxGuests && (
                    <div className={styles.overCapacityBadge}>
                      <Users size={12} strokeWidth={2} /> Máx. {room.maxGuests} personas
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={styles.roomContent}>
                  <div className={styles.roomTop}>
                    <div className={styles.roomNameRow}>
                      <h3 className={styles.roomName}>{room.name}</h3>
                      <button className={styles.detailBtn} onClick={e => { e.stopPropagation(); setDetailRoom(room); }} aria-label={`Ver detalles de ${room.name}`} title="Ver detalles">
                        <Info size={15} strokeWidth={1.5} />
                      </button>
                    </div>
                    <p className={styles.roomDesc}>{room.description}</p>
                    <div className={styles.roomFeatures}>
                      {room.features.slice(0, 4).map(f => (
                        <span key={f} className={styles.featureTag}>{f}</span>
                      ))}
                      {room.features.length > 4 && (
                        <button className={styles.moreFeatures} onClick={() => setDetailRoom(room)}>
                          +{room.features.length - 4} más
                        </button>
                      )}
                    </div>
                    <div className={styles.roomAttrs}>
                      {room.attributes.wifi && <span title="WiFi"><Wifi size={14} strokeWidth={1.5} /> WiFi</span>}
                      {room.attributes.spaPrivado && <span title="Spa privado"><Sparkles size={14} strokeWidth={1.5} /> Spa privado</span>}
                      {room.attributes.jacuzzi && <span title="Tina de hidromasaje"><Droplets size={14} strokeWidth={1.5} /> Hidromasaje</span>}
                      {room.attributes.kingBed && <span title="Cama King"><BedDouble size={14} strokeWidth={1.5} /> King</span>}
                      {room.attributes.balcony && <span title="Terraza"><Bath size={14} strokeWidth={1.5} /> Terraza</span>}
                      <span title={`Hasta ${room.maxGuests} personas`}><Users size={14} strokeWidth={1.5} /> Hasta {room.maxGuests}</span>
                    </div>
                  </div>

                  <div className={styles.roomFooter}>
                    <div className={styles.priceBlock}>
                      {searched && hasDiscount && (
                        <span className={styles.priceNormal}>{formatMXN(normal_room!)}</span>
                      )}
                      <span className={styles.priceMain}>
                        {searched ? formatMXN(total_room!) : formatMXN(room.price)}
                      </span>
                      <span className={styles.priceSub}>
                        {searched
                          ? `total · ${nights} noche${nights !== 1 ? 's' : ''} · ${guestCount} pax`
                          : 'por noche · 2 personas'}
                      </span>
                      {searched && (
                        <span className={styles.pricePerNight}>
                          {formatMXN(Math.round(total_room! / nights))}/noche
                        </span>
                      )}
                    </div>

                    {unavail ? (
                      <span className={styles.unavailTag}>Agotada</span>
                    ) : searched ? (
                      <button
                        className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
                        onClick={e => { e.stopPropagation(); added ? removeFromCart(room.id) : addToCart(room); }}
                      >
                        {added ? <><Check size={13} strokeWidth={2} /> Quitar</> : 'Seleccionar'}
                      </button>
                    ) : (
                      <button className={styles.detailCta} onClick={e => { e.stopPropagation(); setDetailRoom(room); }}>
                        Ver detalles
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Cart sidebar ── */}
        <aside className={styles.sidebar} ref={sidebarRef}>
          <div className={styles.sidebarInner}>
            <h2 className={styles.sidebarTitle}>Tu Reserva</h2>

            {checkin && checkout ? (
              <div className={styles.sidebarDates}>
                <div><span>Llegada</span><strong>{new Date(`${checkin}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                <div><span>Salida</span><strong>{new Date(`${checkout}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                <div><span>Noches</span><strong>{nights}</strong></div>
                <div><span>Adultos</span><strong>{adults}</strong></div>
                {children > 0 && <div><span>Menores</span><strong>{children}</strong></div>}
              </div>
            ) : (
              <>
                <p className={styles.sidebarEmpty}>Selecciona fechas para comenzar</p>
                <div className={styles.promoReminder}>
                  <Tag size={14} strokeWidth={1.5} />
                  <div>
                    <strong>3ª Noche Gratis</strong>
                    <p>Reserva 3 noches con código <strong>XILITLA3MX</strong> y ahorra hasta {formatMXN(2400)} MXN</p>
                  </div>
                </div>
                <div className={styles.depositNote}>
                  <ShieldCheck size={13} strokeWidth={1.5} />
                  <span>2 noches o más: solo pagas el 50% ahora. El resto al llegar.</span>
                </div>
              </>
            )}

            {cart.length > 0 && (
              <div className={styles.cartItems}>
                {cart.map(item => {
                  const room = BOOKING_ROOMS.find(r => r.id === item.roomId)!;
                  const roomTotal = calcRoomStayTotal(room, item.guestCount, checkin, checkout);
                  return (
                    <div key={item.roomId} className={styles.cartItem}>
                      <div className={styles.cartItemHeader}>
                        <span className={styles.cartItemName}>{room.name}</span>
                        <button className={styles.cartRemove} onClick={() => removeFromCart(item.roomId)} aria-label="Quitar">
                          <X size={12} />
                        </button>
                      </div>
                      <div className={styles.cartItemGuests}>
                        <span>{item.guestCount} adulto{item.guestCount !== 1 ? 's' : ''}</span>
                        {children > 0 && <span className={styles.cartMinors}>· {children} menor{children > 1 ? 'es' : ''}</span>}
                      </div>
                      <div className={styles.cartItemPrice}>{formatMXN(roomTotal)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {cart.length === 0 && searched && (
              <p className={styles.sidebarEmpty}>Selecciona una habitación disponible</p>
            )}

            {cart.length > 0 && (
              <div className={styles.promoBlock}>
                {promoCode ? (
                  <div className={styles.promoApplied}>
                    <Tag size={13} strokeWidth={1.5} />
                    <span>Código <strong>{promoCode}</strong> aplicado — ahorraste {formatMXN(promoDiscount)}</span>
                    <button onClick={() => { setPromoCode(null); setPromoDiscount(0); setPromoInput(''); }} aria-label="Quitar código">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.promoInput}>
                    <input
                      type="text"
                      placeholder="Código de descuento"
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value); setPromoError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    />
                    <button onClick={applyPromo}>Aplicar</button>
                  </div>
                )}
                {promoError && <p className={styles.promoError}>{promoError}</p>}
              </div>
            )}

            {cart.length > 0 && (
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatMXN(subtotal)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className={`${styles.totalRow} ${styles.discount}`}>
                    <span>Descuento</span>
                    <span>−{formatMXN(promoDiscount)}</span>
                  </div>
                )}
                <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                  <span>Total</span>
                  <span>{formatMXN(total)}</span>
                </div>
              </div>
            )}

            {!capacityOk && cart.length > 0 && (
              <div className={styles.capacityWarning}>
                <AlertTriangle size={14} strokeWidth={2} />
                <span>
                  {adults} adultos pero capacidad del carrito es {cartCapacity}.
                  Agrega otra habitación o elige Helechos 1 ó 2 (hasta 6 personas).
                </span>
              </div>
            )}

            <button
              className={styles.checkoutBtn}
              disabled={cart.length === 0 || !checkin || !checkout || !capacityOk}
              onClick={goToCheckout}
            >
              Continuar <ChevronRight size={16} strokeWidth={2} />
            </button>

            <div className={styles.guarantees}>
              <span><ShieldCheck size={12} strokeWidth={1.5} /> Pago seguro con Stripe</span>
              <span><ShieldCheck size={12} strokeWidth={1.5} /> Cancelación gratuita 48 hrs</span>
            </div>

            {/* ── Incluido en tu reserva ── */}
            <div className={styles.includesBlock}>
              <h3 className={styles.includesTitle}>Incluido en tu reserva</h3>
              <ul className={styles.includesList}>
                {/* Room-specific amenities */}
                {cart.map(item => {
                  const room = BOOKING_ROOMS.find(r => r.id === item.roomId)!;
                  return (
                    <li key={`suite-${item.roomId}`} className={styles.includesItem}>
                      <BedDouble size={13} strokeWidth={1.5} />
                      <span>{room.name} — suite completa</span>
                    </li>
                  );
                })}
                {cart.some(item => BOOKING_ROOMS.find(r => r.id === item.roomId)?.attributes.spaPrivado) && (
                  <li className={`${styles.includesItem} ${styles.includesHighlight}`}>
                    <Sparkles size={13} strokeWidth={1.5} />
                    <span>Piscina spa privada en tu suite</span>
                  </li>
                )}
                {cart.some(item => BOOKING_ROOMS.find(r => r.id === item.roomId)?.attributes.jacuzzi) && (
                  <li className={`${styles.includesItem} ${styles.includesHighlight}`}>
                    <Droplets size={13} strokeWidth={1.5} />
                    <span>Tina de hidromasaje privada</span>
                  </li>
                )}
                {cart.some(item => BOOKING_ROOMS.find(r => r.id === item.roomId)?.attributes.kingBed) && (
                  <li className={styles.includesItem}>
                    <BedDouble size={13} strokeWidth={1.5} />
                    <span>Cama King Size</span>
                  </li>
                )}
                {cart.some(item => BOOKING_ROOMS.find(r => r.id === item.roomId)?.attributes.balcony) && (
                  <li className={styles.includesItem}>
                    <Users size={13} strokeWidth={1.5} />
                    <span>Terraza o balcón privado</span>
                  </li>
                )}
                {/* Always included */}
                <li className={styles.includesItem}>
                  <Wifi size={13} strokeWidth={1.5} />
                  <span>WiFi de alta velocidad gratuito</span>
                </li>
                <li className={styles.includesItem}>
                  <ShieldCheck size={13} strokeWidth={1.5} />
                  <span>Estacionamiento privado gratuito</span>
                </li>
                <li className={styles.includesItem}>
                  <Check size={13} strokeWidth={2} />
                  <span>Toallas y amenidades de baño premium</span>
                </li>
                <li className={styles.includesItem}>
                  <Droplets size={13} strokeWidth={1.5} />
                  <span>Acceso a piscinas y áreas comunes</span>
                </li>
                <li className={styles.includesItem}>
                  <Check size={13} strokeWidth={2} />
                  <span>Servicio de limpieza diario</span>
                </li>
                <li className={styles.includesItem}>
                  <Check size={13} strokeWidth={2} />
                  <span>A 5 min del Jardín de Edward James</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Sticky cart jump button ── */}
      {cart.length > 0 && (
        <button
          className={styles.stickyCartBtn}
          onClick={() => sidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          aria-label="Ver carrito de reserva"
        >
          <ShieldCheck size={15} strokeWidth={2} />
          Ver carrito ({cart.length})
        </button>
      )}

      {/* ── Room Detail Drawer ── */}
      {detailRoom && (
        <RoomDrawer
          room={detailRoom}
          onClose={() => setDetailRoom(null)}
          onAdd={(r) => { addToCart(r); setDetailRoom(null); }}
          onRemove={(id) => { removeFromCart(id); setDetailRoom(null); }}
          inCart={inCart(detailRoom.id)}
          searched={searched}
          guestCount={getRoomGuests(detailRoom.id)}
          checkin={checkin}
          checkout={checkout}
          nights={nights}
        />
      )}

      {/* ── Lightbox ── */}
      {lightboxRoom && (
        <div className={styles.lightbox} onClick={() => setLightboxRoom(null)}>
          <button className={styles.lbClose} onClick={() => setLightboxRoom(null)}>✕</button>
          <button className={styles.lbPrev} onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + lightboxRoom.images.length) % lightboxRoom.images.length); }}>‹</button>
          <div className={styles.lbImg} onClick={e => e.stopPropagation()}>
            <Image src={lightboxRoom.images[lightboxIdx]} alt={lightboxRoom.name} fill sizes="100vw" className={styles.lbImage} priority />
          </div>
          <button className={styles.lbNext} onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % lightboxRoom.images.length); }}>›</button>
          <p className={styles.lbCaption}>{lightboxRoom.name} · {lightboxIdx + 1}/{lightboxRoom.images.length}</p>
        </div>
      )}
      <WhatsAppRecoveryWidget />
    </main>
  );
}

export default function ReservarPage() {
  return (
    <Suspense fallback={null}>
      <ReservarPageInner />
    </Suspense>
  );
}
