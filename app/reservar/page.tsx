'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Wifi, Bath, BedDouble, Sparkles, Users, Plus, Minus, ChevronRight, X, Tag, ShieldCheck, CalendarDays } from 'lucide-react';
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

export default function ReservarPage() {
  const router = useRouter();

  // ── Search state ──────────────────────────────────────
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // ── Cart ──────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [roomGuestOverrides, setRoomGuestOverrides] = useState<Record<number, number>>({});

  // ── Promo ─────────────────────────────────────────────
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  // ── UI ────────────────────────────────────────────────
  const [lightboxRoom, setLightboxRoom] = useState<BookingRoom | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const nights = calcNights(checkin, checkout);

  // Fetch blocked dates on mount
  useEffect(() => {
    fetch(`${API}/api/fully-booked-dates`)
      .then(r => r.json())
      .then(d => setBlockedDates(d.blockedDates || []))
      .catch(() => {});
  }, []);

  // Today as min date
  const today = new Date().toISOString().split('T')[0];
  const minCheckout = checkin
    ? new Date(new Date(checkin).getTime() + 86400000).toISOString().split('T')[0]
    : today;

  function handleCheckinChange(v: string) {
    setCheckin(v);
    if (checkout && v >= checkout) {
      const next = new Date(new Date(v).getTime() + 86400000).toISOString().split('T')[0];
      setCheckout(next);
    }
    setSearched(false);
    setCart([]);
    setPromoCode(null);
    setPromoDiscount(0);
  }

  async function handleSearch() {
    if (!checkin || !checkout || nights <= 0) return;
    setSearching(true);
    try {
      const roomNames = BOOKING_ROOMS.map(r => r.name);
      const res = await fetch(`${API}/api/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin, checkout, rooms: roomNames }),
      });
      const data = await res.json();
      setUnavailable(data.unavailableRooms || []);
    } catch {
      setUnavailable([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  // ── Cart helpers ──────────────────────────────────────
  function getRoomGuests(roomId: number): number {
    const room = BOOKING_ROOMS.find(r => r.id === roomId)!;
    const override = roomGuestOverrides[roomId];
    const selected = override != null ? override : adults;
    return Math.max(1, Math.min(selected, room.maxGuests));
  }

  function addToCart(room: BookingRoom) {
    if (cart.find(c => c.roomId === room.id)) return;
    setCart(prev => [...prev, { roomId: room.id, guestCount: getRoomGuests(room.id) }]);
  }

  function removeFromCart(roomId: number) {
    setCart(prev => prev.filter(c => c.roomId !== roomId));
    recalcPromo(cart.filter(c => c.roomId !== roomId));
  }

  function updateCartGuests(roomId: number, delta: number) {
    const room = BOOKING_ROOMS.find(r => r.id === roomId)!;
    setRoomGuestOverrides(prev => {
      const current = prev[roomId] ?? adults;
      const next = Math.max(1, Math.min(current + delta, room.maxGuests));
      const updated = { ...prev, [roomId]: next };
      setCart(c => c.map(item => item.roomId === roomId ? { ...item, guestCount: next } : item));
      return updated;
    });
  }

  // ── Promo ─────────────────────────────────────────────
  function recalcPromo(newCart: CartItem[]) {
    if (!promoCode) return;
    const disc = calcPromoDiscount(promoCode, newCart, checkin, checkout, nights);
    setPromoDiscount(disc);
  }

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    const { valid, error } = validatePromo(code, nights, cart.length);
    if (!valid) { setPromoError(error!); return; }
    setPromoCode(code as PromoCode);
    setPromoError('');
    const disc = calcPromoDiscount(code as PromoCode, cart, checkin, checkout, nights);
    setPromoDiscount(disc);
  }

  // ── Subtotals ─────────────────────────────────────────
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

  // ── Room grid ─────────────────────────────────────────
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
              onChange={e => { setCheckout(e.target.value); setSearched(false); setCart([]); }}
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
          {searching ? 'Buscando…' : searched ? 'Actualizar' : 'Ver disponibilidad'}
        </button>
      </div>

      {nights > 0 && checkin && checkout && (
        <p className={styles.nightsSummary}>
          <CalendarDays size={14} strokeWidth={1.5} />
          {' '}{nights} noche{nights !== 1 ? 's' : ''} · {new Date(`${checkin}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} → {new Date(`${checkout}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
        </p>
      )}

      <div className={styles.layout}>
        {/* ── Room grid ── */}
        <div className={styles.roomGrid}>
          {!searched && (
            <div className={styles.promptBanner}>
              <CalendarDays size={20} strokeWidth={1.5} />
              <span>Selecciona tus fechas y haz clic en <strong>Ver disponibilidad</strong> para ver precios exactos.</span>
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
            const nightly = searched ? calcRoomStayTotal(room, guestCount, checkin, checkout) / Math.max(nights, 1) : room.price;

            return (
              <article key={room.id} className={`${styles.roomCard} ${unavail ? styles.unavailable : ''} ${added ? styles.inCart : ''}`}>
                {/* Image */}
                <div className={styles.roomImageWrap}>
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
                  {room.images.length > 1 && (
                    <button className={styles.photoBtn} onClick={() => { setLightboxRoom(room); setLightboxIdx(0); }}>
                      Ver fotos ({room.images.length})
                    </button>
                  )}
                  {unavail && <div className={styles.unavailOverlay}>No disponible en estas fechas</div>}
                  {added && <div className={styles.addedOverlay}><span>✓ Agregada al carrito</span></div>}
                </div>

                {/* Content */}
                <div className={styles.roomContent}>
                  <div className={styles.roomTop}>
                    <h3 className={styles.roomName}>{room.name}</h3>
                    <p className={styles.roomDesc}>{room.description}</p>
                    <div className={styles.roomFeatures}>
                      {room.features.slice(0, 4).map(f => (
                        <span key={f} className={styles.featureTag}>{f}</span>
                      ))}
                    </div>
                    <div className={styles.roomAttrs}>
                      {room.attributes.wifi && <span title="WiFi"><Wifi size={14} strokeWidth={1.5} /> WiFi</span>}
                      {room.attributes.jacuzzi && <span title="Spa/Jacuzzi"><Sparkles size={14} strokeWidth={1.5} /> Spa</span>}
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

                    {!unavail && searched && (
                      <button
                        className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
                        onClick={() => added ? removeFromCart(room.id) : addToCart(room)}
                      >
                        {added ? '✓ Quitar' : 'Seleccionar'}
                      </button>
                    )}
                    {!searched && (
                      <span className={styles.selectDateHint}>Elige fechas para reservar</span>
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

            {/* Dates summary */}
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

            {/* Cart items */}
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
                        <span>Adultos:</span>
                        <button onClick={() => updateCartGuests(item.roomId, -1)}><Minus size={11} /></button>
                        <span>{item.guestCount}</span>
                        <button onClick={() => updateCartGuests(item.roomId, 1)}><Plus size={11} /></button>
                        {children > 0 && <span className={styles.cartMinors}>· {children} menor{children > 1 ? 'es' : ''}</span>}
                      </div>
                      <div className={styles.cartItemPrice}>{formatMXN(roomTotal)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {cart.length === 0 && searched && (
              <p className={styles.sidebarEmpty}>Selecciona una habitación del listado</p>
            )}

            {/* Promo code */}
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

            {/* Totals */}
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

            {/* CTA */}
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

      {/* Lightbox */}
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
