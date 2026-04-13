'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wifi, Bath, BedDouble, Sparkles, Droplets, Users, Plus, Minus, ChevronRight, X, Tag, ShieldCheck, CalendarDays, ChevronLeft, Info, AlertTriangle } from 'lucide-react';
import {
  BOOKING_ROOMS,
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

const API = process.env.NEXT_PUBLIC_BOOKING_API_URL!;

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
            {!searched ? 'Selecciona fechas para reservar' : inCart ? '✓ Quitar del carrito' : `Agregar al carrito — ${formatMXN(total ?? room.price)}`}
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

  // ── Pre-fill + auto-search from URL params ────────────
  useEffect(() => {
    const ci = searchParams.get('checkin');
    const co = searchParams.get('checkout');
    const a = searchParams.get('adults');
    if (ci) setCheckin(ci);
    if (co) setCheckout(co);
    if (a) setAdults(Math.max(1, Math.min(12, parseInt(a, 10) || 2)));
    // If both dates provided via URL, auto-trigger search
    if (ci && co && calcNights(ci, co) > 0) {
      triggerSearch(ci, co);
    }
  }, []);

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
    }
  }

  async function handleSearch() {
    await triggerSearch(checkin, checkout);
  }

  function handleCheckinChange(v: string) {
    setCheckin(v);
    if (checkout && v >= checkout) {
      const next = new Date(new Date(v).getTime() + 86400000).toISOString().split('T')[0];
      setCheckout(next);
    }
    // Clear stale results when dates change
    setSearched(false);
    setUnavailable([]);
    setCart([]);
    setPromoCode(null);
    setPromoDiscount(0);
  }

  function handleCheckoutChange(v: string) {
    setCheckout(v);
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
    router.push('/reservar/checkout');
  }

  // ── Room grid helpers ─────────────────────────────────
  const visibleRooms = BOOKING_ROOMS.filter(r => !r.disabled);
  const isUnavailable = (r: BookingRoom) => unavailable.includes(r.name);
  const inCart = (id: number) => cart.some(c => c.roomId === id);

  return (
    <main className={styles.main}>
      <div className={styles.pageHeader}>
        <p className={styles.eyebrow}>Reserva Directa · Mejor Precio Garantizado</p>
        <h1>Reserva tu <em>Suite</em></h1>
        <p className={styles.headerSub}>
          Sin intermediarios · Confirmación instantánea · Cancela hasta 48 hrs antes
        </p>
      </div>

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
              >
                {/* Image — click opens detail drawer */}
                <div
                  className={styles.roomImageWrap}
                  onClick={() => setDetailRoom(room)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalles de ${room.name}`}
                  onKeyDown={e => e.key === 'Enter' && setDetailRoom(room)}
                  style={{ cursor: 'pointer' }}
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
                  >
                    Ver fotos ({room.images.length})
                  </button>
                  {unavail && (
                    <div className={styles.unavailOverlay}>
                      <span>🚫 No disponible</span>
                      <span className={styles.unavailSub}>Agotada en estas fechas</span>
                    </div>
                  )}
                  {added && <div className={styles.addedOverlay}><span>✓ Agregada al carrito</span></div>}
                </div>

                {/* Content */}
                <div className={styles.roomContent}>
                  <div className={styles.roomTop}>
                    <div className={styles.roomNameRow}>
                      <h3 className={styles.roomName}>{room.name}</h3>
                      <button className={styles.detailBtn} onClick={() => setDetailRoom(room)} aria-label={`Ver detalles de ${room.name}`} title="Ver detalles">
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
                        {searched ? `${nights} noche${nights !== 1 ? 's' : ''}` : 'por noche · 2 personas'}
                      </span>
                    </div>

                    {unavail ? (
                      <span className={styles.unavailTag}>Agotada</span>
                    ) : searched ? (
                      <button
                        className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
                        onClick={() => added ? removeFromCart(room.id) : addToCart(room)}
                      >
                        {added ? '✓ Quitar' : 'Seleccionar'}
                      </button>
                    ) : (
                      <button className={styles.detailCta} onClick={() => setDetailRoom(room)}>
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
        <aside className={styles.sidebar}>
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
              <p className={styles.sidebarEmpty}>Selecciona fechas para comenzar</p>
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

            <button
              className={styles.checkoutBtn}
              disabled={cart.length === 0 || !checkin || !checkout}
              onClick={goToCheckout}
            >
              Continuar <ChevronRight size={16} strokeWidth={2} />
            </button>

            <div className={styles.guarantees}>
              <span><ShieldCheck size={12} strokeWidth={1.5} /> Pago seguro con Stripe</span>
              <span><ShieldCheck size={12} strokeWidth={1.5} /> Cancelación gratuita 48 hrs</span>
            </div>
          </div>
        </aside>
      </div>

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
