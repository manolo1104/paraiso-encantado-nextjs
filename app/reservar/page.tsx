'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Wifi, Bath, BedDouble, Sparkles, Droplets, Users, Baby, Plus, Minus, ChevronRight, X, Tag, ShieldCheck, CalendarDays, ChevronLeft, Info, AlertTriangle, Check, Ban, Star, Flame, Clock } from 'lucide-react';
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
  calcDepositAmount,
  saveBookingState,
  formatMXN,
} from '@/lib/booking';
import styles from './reservar.module.css';
import CheckoutProgressBar from '@/components/CheckoutProgressBar';
import TrustBadgesReservar from '@/components/TrustBadgesReservar';
import WhatsAppRecoveryWidget from '@/components/WhatsAppRecoveryWidget';
import RecentBookingsLive, { LiveBookingItem } from '@/components/RecentBookingsLive';
import { getQuoteForRoom, getStripQuotes } from '@/lib/review-quotes';
import { trackEvent } from '@/lib/analytics';
import { getHoldSessionId } from '@/lib/hold-session';

const API = '';
const WA_NUMBER = '524891007679';

// Formato corto para botones: "$2,000" (sin sufijo MXN)
function fmtShort(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

// "9:42" para el cronómetro de apartado
function fmtCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Por qué una suite no está disponible, y desde qué noche (viene del motor)
type UnavailableDetail = { room: string; date: string; reason: string };

// "2026-08-15" → "sáb 15 de ago"
function fmtNight(date: string): string {
  const d = new Date(date + 'T12:00:00');
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

// "Hoy" en la zona horaria del hotel (no UTC) — evita bloquear reservas del mismo día por la tarde
function hotelToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}
// Suma días a una fecha YYYY-MM-DD con aritmética pura (sin desfase de zona horaria)
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split('T')[0];
}

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
      <div className={styles.drawer} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={room.name}>
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
                <button className={styles.drawerPrev} onClick={() => setImgIdx(i => (i - 1 + room.images.length) % room.images.length)} aria-label="Foto anterior">
                  <ChevronLeft size={20} strokeWidth={2} />
                </button>
                <button className={styles.drawerNext} onClick={() => setImgIdx(i => (i + 1) % room.images.length)} aria-label="Foto siguiente">
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
          {(() => {
            const q = getQuoteForRoom(room.name, room.id);
            return (
              <blockquote className={styles.drawerQuote}>
                <div className={styles.reviewStars} aria-label={`${q.rating} de 5 estrellas`}>{'★'.repeat(q.rating)}</div>
                <p>“{q.text}”</p>
                <footer>{q.name} · {q.location} · reseña de Google</footer>
              </blockquote>
            );
          })()}
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
  const [unavailableDetail, setUnavailableDetail] = useState<UnavailableDetail[]>([]);
  const [availabilityDegraded, setAvailabilityDegraded] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [datesOverlapBlocked, setDatesOverlapBlocked] = useState(false);
  const [checkinError, setCheckinError] = useState('');
  const [autoSelectUnavailable, setAutoSelectUnavailable] = useState<string | null>(null);

  // ── Cart ──────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  // ── Promo ─────────────────────────────────────────────
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);

  // ── UI ────────────────────────────────────────────────
  const [lightboxRoom, setLightboxRoom] = useState<BookingRoom | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [detailRoom, setDetailRoom] = useState<BookingRoom | null>(null);

  // ── Apartado temporal REAL (cronómetro de 10 min) ─────
  const holdSessionRef = useRef<string>('');
  const holdHadRef = useRef(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdRemaining, setHoldRemaining] = useState<number | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);

  // Sesión de apartado compartida con el checkout (ver lib/hold-session.ts)
  useEffect(() => {
    holdSessionRef.current = getHoldSessionId();
  }, []);

  async function renewHold(currentCart: CartItem[], ci: string, co: string) {
    const sid = holdSessionRef.current || getHoldSessionId();
    holdSessionRef.current = sid;
    if (!sid) return;
    const roomNames = currentCart
      .map(item => BOOKING_ROOMS.find(r => r.id === item.roomId)?.name)
      .filter(Boolean);
    try {
      const res = await fetch(`${API}/api/renew-temporary-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin: ci, checkout: co, rooms: roomNames, sessionId: sid }),
      });
      const data = await res.json();
      if (roomNames.length > 0 && data.expiresInSeconds) {
        // El vencimiento se ancla al reloj DEL VISITANTE, no al del servidor:
        // con una hora absoluta, un celular con el reloj adelantado veía el
        // apartado nacer expirado (o con la mitad del tiempo).
        setHoldExpiresAt(Date.now() + Number(data.expiresInSeconds) * 1000);
        setHoldExpired(false);
        holdHadRef.current = true;
      } else if (roomNames.length === 0) {
        setHoldExpiresAt(null);
        setHoldExpired(false);
      }
    } catch { /* sin apartado visible si falla — no bloquea la reserva */ }
  }

  /**
   * Libera el apartado YA (sin debounce). Se llama al cambiar fechas: si el
   * apartado de las fechas viejas sigue vivo cuando el huésped vuelve a buscar,
   * su propia suite le puede aparecer ocupada.
   */
  function releaseHoldNow() {
    const sid = holdSessionRef.current || getHoldSessionId();
    holdSessionRef.current = sid;
    setHoldExpiresAt(null);
    setHoldExpired(false);
    if (!sid || !holdHadRef.current) return;
    holdHadRef.current = false;
    fetch(`${API}/api/renew-temporary-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkin: '', checkout: '', rooms: [], sessionId: sid }),
      keepalive: true,
    }).catch(() => {});
  }

  // Renovar/liberar el apartado cuando cambia el carrito o las fechas (debounce)
  useEffect(() => {
    if (cart.length === 0) {
      setHoldExpiresAt(null);
      setHoldExpired(false);
      if (holdHadRef.current) {
        holdHadRef.current = false;
        renewHold([], checkin, checkout);
      }
      return;
    }
    const t = setTimeout(() => renewHold(cart, checkin, checkout), 700);
    return () => clearTimeout(t);
  }, [cart, checkin, checkout]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tic del cronómetro
  useEffect(() => {
    if (holdExpiresAt === null) {
      setHoldRemaining(null);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000));
      setHoldRemaining(rem);
      if (rem <= 0) {
        setHoldExpiresAt(null);
        setHoldExpired(true);
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [holdExpiresAt]);

  // Latido: mientras el huésped siga en la pestaña con suites en el carrito, el
  // apartado se renueva solo. Sin esto, elegir habitación y tomarse 10 min para
  // decidir terminaba en un aviso rojo de "expiró" sin que nada se hubiera perdido.
  useEffect(() => {
    if (cart.length === 0) return;
    const iv = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const rem = holdExpiresAt === null ? 0 : holdExpiresAt - Date.now();
      if (rem < 3 * 60 * 1000) renewHold(cart, checkin, checkout);
    }, 30_000);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const rem = holdExpiresAt === null ? 0 : holdExpiresAt - Date.now();
      if (rem < 3 * 60 * 1000) renewHold(cart, checkin, checkout);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [cart, checkin, checkout, holdExpiresAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Prueba social REAL (reservas anonimizadas + ocupación de la hoja) ──
  const [socialProof, setSocialProof] = useState<{ count30d: number; recent: LiveBookingItem[]; occupancyPct: number | null } | null>(null);
  useEffect(() => {
    fetch(`${API}/api/social-proof`)
      .then(r => r.json())
      .then(d => setSocialProof({ count30d: d.count30d || 0, recent: d.recent || [], occupancyPct: d.occupancyPct ?? null }))
      .catch(() => {});
  }, []);

  const nights = calcNights(checkin, checkout);
  const today = hotelToday();
  const minCheckout = checkin ? addDays(checkin, 1) : today;

  // ── Fetch blocked dates from Sheets on mount ──────────
  useEffect(() => {
    fetch(`${API}/api/fully-booked-dates`)
      .then(r => r.json())
      .then(d => setBlockedDates(d.blockedDates || []))
      .catch(() => {});
  }, []);

  // Suite a agregar automáticamente al carrito después de la búsqueda
  const pendingAutoSelectId = useRef<number | null>(null);
  // Carrito completo a restaurar (enlace "Terminar mi reserva" del correo de
  // recuperación): `?rooms=12:4,7:2` → habitación 12 con 4 personas, 7 con 2.
  const pendingRestoreCart = useRef<CartItem[] | null>(null);

  // ── Pre-fill + auto-search from URL params ────────────
  useEffect(() => {
    const ci = searchParams.get('checkin');
    const co = searchParams.get('checkout');
    const a = searchParams.get('adults');
    const suiteSlug = searchParams.get('suiteId');
    const autoselect = searchParams.get('autoselect') === '1';

    // Leer fechas guardadas en sessionStorage si no vienen en la URL
    const today = hotelToday();
    const tomorrow = addDays(today, 1);
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

    // Restaurar el carrito completo desde el correo de recuperación
    const roomsParam = searchParams.get('rooms');
    if (roomsParam) {
      const restored: CartItem[] = [];
      for (const part of roomsParam.split(',').slice(0, 13)) {
        const [rawId, rawGuests] = part.split(':');
        const room = BOOKING_ROOMS.find(r => r.id === Number(rawId));
        if (!room || restored.some(c => c.roomId === room.id)) continue;
        restored.push({
          roomId: room.id,
          guestCount: Math.max(1, Math.min(Number(rawGuests) || 1, room.maxGuests)),
        });
      }
      if (restored.length > 0) pendingRestoreCart.current = restored;
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

  // ── Señal para que el botón flotante de WhatsApp no tape la barra móvil ──
  useEffect(() => {
    if (cart.length > 0) document.body.dataset.peBookingBar = '1';
    else delete document.body.dataset.peBookingBar;
    return () => { delete document.body.dataset.peBookingBar; };
  }, [cart.length]);

  // ── Analytics tracking ────────────────────────────────
  const startTime = useRef(Date.now());
  const cartAbandonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchedRef = useRef(false);

  useEffect(() => {
    trackEvent('PAGE_VIEW', { path: '/reservar' });
    // Solo disparar BOOKING_START si las fechas iniciales son válidas (no en el pasado)
    const todayStr = hotelToday();
    if (!checkin || checkin >= todayStr) {
      trackEvent('BOOKING_START');
    }
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
    setAutoSelectUnavailable(null);
    setAvailabilityDegraded(false);
    setUnavailableDetail([]);
    let currentUnavailable: string[] = [];
    let currentDetail: UnavailableDetail[] = [];
    try {
      const roomNames = BOOKING_ROOMS.map(r => r.name);
      // Hasta 3 intentos: un timeout transitorio de Sheets NO debe mostrarse
      // como "hotel lleno" — eso mata reservas reales.
      let degraded = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(`${API}/api/check-availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkin: ci, checkout: co, rooms: roomNames, sessionId: holdSessionRef.current || undefined }),
        });
        const data = await res.json();
        currentUnavailable = data.unavailableRooms || [];
        currentDetail = data.unavailableDetail || [];
        degraded = Boolean(data.degraded);
        if (!degraded) break;
        if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
      }
      setUnavailable(currentUnavailable);
      setUnavailableDetail(degraded ? [] : currentDetail);
      setAvailabilityDegraded(degraded);
    } catch {
      setUnavailable([]);
      setUnavailableDetail([]);
    } finally {
      setSearching(false);
      setSearched(true);
      // Scroll to results after short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      // Restaurar el carrito del correo de recuperación (solo lo que siga libre)
      if (pendingRestoreCart.current) {
        const wanted = pendingRestoreCart.current;
        pendingRestoreCart.current = null;
        const stillFree = wanted.filter(item => {
          const room = BOOKING_ROOMS.find(r => r.id === item.roomId);
          return room && !currentUnavailable.includes(room.name);
        });
        if (stillFree.length > 0) {
          setCart(stillFree);
          trackEvent('CART_RESTORED', { rooms: stillFree.length, source: 'email_recuperacion' });
          setTimeout(() => {
            sidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 400);
        }
        if (stillFree.length < wanted.length) {
          const lost = wanted.find(item => !stillFree.some(s => s.roomId === item.roomId));
          const lostRoom = lost && BOOKING_ROOMS.find(r => r.id === lost.roomId);
          if (lostRoom) setAutoSelectUnavailable(lostRoom.name);
        }
      }

      // Auto-agregar suite al carrito si viene de una página de habitación
      if (pendingAutoSelectId.current !== null) {
        const roomId = pendingAutoSelectId.current;
        pendingAutoSelectId.current = null;
        const room = BOOKING_ROOMS.find(r => r.id === roomId);
        if (room) {
          if (currentUnavailable.includes(room.name)) {
            // Suite no disponible para estas fechas — mostrar aviso, no agregar
            setAutoSelectUnavailable(room.name);
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
          } else {
            const guestCount = Math.max(1, Math.min(adults, room.maxGuests));
            setCart([{ roomId: room.id, guestCount }]);
            trackEvent('SUITE_SELECTED', { suite: room.name, guests: guestCount, source: 'suite_page_cta' });
            setTimeout(() => {
              sidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 400);
          }
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
    if (v && v < today) {
      setCheckinError('Esta fecha ya pasó. Selecciona una fecha futura.');
      setCheckin('');
      return;
    }
    setCheckinError('');
    setCheckin(v);
    let newCo = checkout;
    if (checkout && v >= checkout) {
      const next = addDays(v, 1);
      setCheckout(next);
      newCo = next;
    }
    saveDatesToSession(v, newCo, adults);
    releaseHoldNow();
    setSearched(false);
    setUnavailable([]);
    setUnavailableDetail([]);
    setCart([]);
    setPromoCode(null);
    setPromoDiscount(0);
  }

  function handleCheckoutChange(v: string) {
    setCheckout(v);
    saveDatesToSession(checkin, v, adults);
    releaseHoldNow();
    setSearched(false);
    setUnavailable([]);
    setUnavailableDetail([]);
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
    // Assign remaining unassigned adults to this room
    const assignedSoFar = cart.reduce((sum, item) => sum + item.guestCount, 0);
    const remaining = Math.max(1, adults - assignedSoFar);
    const guestCount = Math.min(remaining, room.maxGuests);
    const next = [...cart, { roomId: room.id, guestCount }];
    setCart(next);
    // Recalcular descuento de promo con el carrito actualizado (consistente con quitar/editar)
    if (promoCode) setPromoDiscount(calcPromoDiscount(promoCode, next, checkin, checkout, nights));
    // Usuario eligió habitación — ya no es abandono
    if (cartAbandonTimer.current) { clearTimeout(cartAbandonTimer.current); cartAbandonTimer.current = null; }
  }

  function updateCartGuestCount(roomId: number, delta: number) {
    const next = cart.map(item => {
      if (item.roomId !== roomId) return item;
      const r = BOOKING_ROOMS.find(r => r.id === roomId)!;
      return { ...item, guestCount: Math.max(1, Math.min(r.maxGuests, item.guestCount + delta)) };
    });
    setCart(next);
    if (promoCode) {
      setPromoDiscount(calcPromoDiscount(promoCode, next, checkin, checkout, nights));
    }
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
  function applyPromoCode(rawCode: string, source: 'input' | 'suggestion') {
    const code = rawCode.trim().toUpperCase();
    const { valid, error } = validatePromo(code, nights, cart.length);
    if (!valid) { setPromoError(error!); return; }
    setPromoCode(code as PromoCode);
    setPromoError('');
    const disc = calcPromoDiscount(code as PromoCode, cart, checkin, checkout, nights);
    setPromoDiscount(disc);
    trackEvent('PROMO_APPLIED', { code, source });
  }

  function applyPromo() {
    applyPromoCode(promoInput, 'input');
  }

  // ── Totals ────────────────────────────────────────────
  const subtotal = calcCartSubtotal(cart, checkin, checkout);
  const total = Math.max(0, subtotal - promoDiscount);
  // Mismo cálculo que el checkout: 50% hoy si son 2+ noches
  const payToday = calcDepositAmount(total, nights);
  const payLater = Math.max(0, total - payToday);
  const isDeposit = nights >= 2 && cart.length > 0;
  // Ahorro potencial si aplica la promo de 3ª noche gratis (para sugerirla con monto exacto)
  const potential3xSaving = cart.length > 0 && nights === 3 && !promoCode
    ? calcPromoDiscount('XILITLA3MX', cart, checkin, checkout, nights)
    : 0;

  // ── Proceed to checkout ───────────────────────────────
  function goToCheckout() {
    if (cart.length === 0 || !checkin || !checkout) return;
    // Block if any cart room is unavailable for current dates
    const hasUnavailableInCart = cart.some(item => {
      const room = BOOKING_ROOMS.find(r => r.id === item.roomId);
      return room && unavailable.includes(room.name);
    });
    if (hasUnavailableInCart) return;
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
  // Los menores (0–5 años) SÍ ocupan cupo en la habitación, aunque NO se cobren.
  const totalGuests = adults + children;
  const cartCapacity = cart.reduce((sum, item) => {
    const room = BOOKING_ROOMS.find(r => r.id === item.roomId);
    return sum + (room?.maxGuests ?? 0);
  }, 0);
  const cartHasUnavailable = cart.some(item => {
    const room = BOOKING_ROOMS.find(r => r.id === item.roomId);
    return room && unavailable.includes(room.name);
  });
  // Qué noche exacta choca, para explicárselo al huésped en vez de un "no disponible" seco
  const unavailableCartDetail = cart
    .map(item => {
      const room = BOOKING_ROOMS.find(r => r.id === item.roomId);
      return room ? unavailableDetail.find(d => d.room === room.name) : undefined;
    })
    .filter((d): d is UnavailableDetail => Boolean(d));
  const capacityOk = cart.length === 0 || cartCapacity >= totalGuests;

  // ── Room grid helpers ─────────────────────────────────
  const visibleRooms = BOOKING_ROOMS.filter(r => !r.disabled);
  const isUnavailable = (r: BookingRoom) => unavailable.includes(r.name);
  const inCart = (id: number) => cart.some(c => c.roomId === id);
  // Urgencia honesta: cuántas habitaciones reales ya están agotadas en estas fechas
  const unavailCount = visibleRooms.filter(r => unavailable.includes(r.name)).length;
  const allUnavailable = searched && visibleRooms.length > 0 && unavailCount === visibleRooms.length;
  // Disponibles primero; agotadas al final (orden estable dentro de cada grupo)
  const sortedRooms = searched
    ? [...visibleRooms].sort((a, b) => Number(isUnavailable(a)) - Number(isUnavailable(b)))
    : visibleRooms;

  // WhatsApp de rescate cuando no hay disponibilidad
  const waFullMsg = `Hola, quiero reservar en Paraíso Encantado del ${checkin} al ${checkout} para ${adults} adulto${adults !== 1 ? 's' : ''}${children > 0 ? ` y ${children} menor${children !== 1 ? 'es' : ''}` : ''}, pero el sitio marca todo ocupado. ¿Tienen alguna opción o lista de espera?`;
  const waFullHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waFullMsg)}`;

  // Continuar desde la barra móvil: si hay advertencias, llevar al resumen para que se vean
  function handleMobileContinue() {
    if (!capacityOk || cartHasUnavailable) {
      sidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    goToCheckout();
  }

  return (
    <main className={styles.main}>
      <div className={styles.pageHeader}>
        <p className={styles.eyebrow}>Reserva Directa · Sin Comisiones</p>
        <h1>Reserva tu <em>Suite</em></h1>
        <p className={styles.headerSub}>
          Sin intermediarios · Confirmación instantánea · Reembolso 100% hasta 7 días antes
        </p>
      </div>

      <CheckoutProgressBar currentStep={1} />
      <TrustBadgesReservar />

      {socialProof !== null && (socialProof.count30d >= 5 || (socialProof.occupancyPct !== null && socialProof.occupancyPct >= 50)) && (
        <div className={styles.demandStrip} role="status">
          <Flame size={14} strokeWidth={2} />
          <span>
            {socialProof.occupancyPct !== null && socialProof.occupancyPct >= 50 && (
              <><strong>{socialProof.occupancyPct}% de ocupación</strong> en los próximos 30 días — quedan pocas fechas</>
            )}
            {socialProof.occupancyPct !== null && socialProof.occupancyPct >= 50 && socialProof.count30d >= 5 && ' · '}
            {socialProof.count30d >= 5 && (
              <><strong>{socialProof.count30d} reservas confirmadas</strong> este mes</>
            )}
          </span>
        </div>
      )}

      {/* ── Checkin error ── */}
      {checkinError && (
        <div style={{ maxWidth: 1100, margin: '0 auto 8px', padding: '0 24px' }}>
          <p role="alert" style={{ background: '#fff3cd', border: '1px solid #f5c542', borderRadius: 8, padding: '10px 16px', fontSize: '0.85rem', color: '#7a4f00', margin: 0 }}>
            ⚠️ {checkinError}
          </p>
        </div>
      )}

      {/* ── Search bar (selectores) ── */}
      <div className={styles.searchBar}>
        <div className={styles.searchFields}>
          <label className={styles.fieldCell}>
            <span className={styles.fieldIcon}><CalendarDays size={18} strokeWidth={1.5} /></span>
            <span className={styles.fieldText}>
              <span className={styles.fieldLabel}>Llegada</span>
              <input
                type="date"
                className={styles.dateInput}
                value={checkin}
                min={today}
                onChange={e => handleCheckinChange(e.target.value)}
                aria-label="Fecha de llegada"
              />
            </span>
          </label>

          <label className={styles.fieldCell}>
            <span className={styles.fieldIcon}><CalendarDays size={18} strokeWidth={1.5} /></span>
            <span className={styles.fieldText}>
              <span className={styles.fieldLabel}>Salida</span>
              <input
                type="date"
                className={styles.dateInput}
                value={checkout}
                min={minCheckout}
                onChange={e => handleCheckoutChange(e.target.value)}
                aria-label="Fecha de salida"
              />
            </span>
          </label>

          <div className={styles.fieldCell}>
            <span className={styles.fieldIcon}><Users size={18} strokeWidth={1.5} /></span>
            <span className={styles.fieldText}>
              <span className={styles.fieldLabel}>Adultos</span>
              <div className={styles.counter} role="group" aria-label="Número de adultos">
                <button type="button" onClick={() => setAdults(a => Math.max(1, a - 1))} disabled={adults <= 1} aria-label="Quitar un adulto"><Minus size={15} strokeWidth={2} /></button>
                <span aria-live="polite">{adults}</span>
                <button type="button" onClick={() => setAdults(a => Math.min(12, a + 1))} disabled={adults >= 12} aria-label="Agregar un adulto"><Plus size={15} strokeWidth={2} /></button>
              </div>
            </span>
          </div>

          <div className={styles.fieldCell}>
            <span className={styles.fieldIcon}><Baby size={18} strokeWidth={1.5} /></span>
            <span className={styles.fieldText}>
              <span className={styles.fieldLabel}>Menores <em className={styles.fieldHint}>0&ndash;5 años</em></span>
              <div className={styles.counter} role="group" aria-label="Número de menores de 6 años">
                <button type="button" onClick={() => setChildren(c => Math.max(0, c - 1))} disabled={children <= 0} aria-label="Quitar un menor"><Minus size={15} strokeWidth={2} /></button>
                <span aria-live="polite">{children}</span>
                <button type="button" onClick={() => setChildren(c => Math.min(10, c + 1))} disabled={children >= 10} aria-label="Agregar un menor"><Plus size={15} strokeWidth={2} /></button>
              </div>
            </span>
          </div>
        </div>
        <button
          className={styles.searchBtn}
          onClick={handleSearch}
          disabled={!checkin || !checkout || nights <= 0 || searching}
          aria-busy={searching}
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
            <p className={styles.blockedWarning} role="alert">
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
            <div className={styles.searchingBanner} role="status" aria-live="polite">
              <div className={styles.searchSpinner} />
              <span>Consultando disponibilidad en tiempo real…</span>
            </div>
          )}

          {autoSelectUnavailable && (
            <div className={styles.autoSelectWarning} role="alert">
              <AlertTriangle size={15} strokeWidth={2} />
              <span>
                <strong>{autoSelectUnavailable}</strong> no está disponible para las fechas seleccionadas.
                Cambia las fechas o elige otra suite.
              </span>
            </div>
          )}

          {availabilityDegraded && !searching && (
            <div className={styles.degradedBanner} role="alert">
              <AlertTriangle size={15} strokeWidth={2} />
              <span>
                No pudimos verificar la disponibilidad en este momento (no significa que estemos llenos).
              </span>
              <button className={styles.degradedRetry} onClick={handleSearch}>Reintentar</button>
              <a
                href={waFullHref}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.degradedWa}
                onClick={() => trackEvent('WHATSAPP_CLICK', { action: 'availability_degraded', checkin, checkout })}
              >
                Reservar por WhatsApp
              </a>
            </div>
          )}

          {allUnavailable && !searching && !availabilityDegraded && (
            <div className={styles.noAvailability}>
              <h3>Estamos llenos en esas fechas</h3>
              <p>
                Las {visibleRooms.length} habitaciones ya están reservadas del{' '}
                {new Date(`${checkin}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} al{' '}
                {new Date(`${checkout}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}.
                Prueba otras fechas, o escríbenos: a veces se libera espacio por cambios de última hora.
              </p>
              <div className={styles.noAvailActions}>
                <a
                  href={waFullHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.noAvailWa}
                  onClick={() => trackEvent('WHATSAPP_CLICK', { action: 'no_availability', checkin, checkout })}
                >
                  Preguntar por WhatsApp
                </a>
                <button
                  className={styles.noAvailDates}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Probar otras fechas
                </button>
              </div>
            </div>
          )}

          {searched && !searching && !allUnavailable && !availabilityDegraded && unavailCount > 0 && (
            <div className={styles.urgencyBanner} role="status">
              <Flame size={15} strokeWidth={2} />
              <span>
                <strong>{unavailCount} de {visibleRooms.length} habitaciones</strong> ya están reservadas en tus fechas — asegura la tuya.
              </span>
            </div>
          )}

          {sortedRooms.map(room => {
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
                    {searched && !unavail && (
                      <span className={styles.lastOneBadge}>Solo queda 1 — suite única</span>
                    )}
                  </div>
                  <button
                    className={styles.photoBtn}
                    onClick={e => { e.stopPropagation(); setLightboxRoom(room); setLightboxIdx(0); }}
                    aria-label={`Ver galería de ${room.name}`}
                  >
                    Ver fotos ({room.images.length})
                  </button>
                  {unavail && (() => {
                    const d = unavailableDetail.find(x => x.room === room.name);
                    return (
                      <div className={styles.unavailOverlay}>
                        <span><Ban size={14} strokeWidth={2} /> No disponible</span>
                        <span className={styles.unavailSub}>
                          {d ? `Ocupada desde la noche del ${fmtNight(d.date)}` : 'Agotada en estas fechas'}
                        </span>
                      </div>
                    );
                  })()}
                  {added && <div className={styles.addedOverlay}><span><Check size={14} strokeWidth={2} /> Agregada al carrito</span></div>}
                  {!unavail && !added && totalGuests > room.maxGuests && (
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

          {/* ── Reseñas reales (de /reviews) ── */}
          <div className={styles.reviewsStrip}>
            <div className={styles.reviewsStripHeader}>
              <span className={styles.ratingStars} aria-hidden="true">
                <Star size={15} strokeWidth={0} fill="currentColor" />
              </span>
              <span><strong>4.5/5</strong> · 523 reseñas verificadas en Google</span>
            </div>
            <div className={styles.reviewsStripGrid}>
              {getStripQuotes().map(q => (
                <blockquote key={q.name} className={styles.reviewCard}>
                  <div className={styles.reviewStars} aria-label={`${q.rating} de 5 estrellas`}>{'★'.repeat(q.rating)}</div>
                  <p>“{q.text}”</p>
                  <footer>{q.name} · {q.location} · Google</footer>
                </blockquote>
              ))}
            </div>
            <Link href="/reviews" className={styles.reviewsLink}>Leer las 523 reseñas →</Link>
          </div>
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
              <p className={styles.sidebarEmpty}>Selecciona fechas para comenzar</p>
            )}

            {cart.length === 0 && (
              <>
                <div className={styles.promoReminder}>
                  <Tag size={14} strokeWidth={1.5} />
                  <div>
                    <strong>3ª Noche Gratis</strong>
                    <p>
                      {nights === 3
                        ? <>Tus fechas califican: reserva ahora con el código <strong>XILITLA3MX</strong> y la 3ª noche es gratis.</>
                        : <>Reserva 3 noches con el código <strong>XILITLA3MX</strong> y la 3ª noche es gratis (hasta {formatMXN(3000)}).</>}
                    </p>
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
                        <button onClick={() => updateCartGuestCount(item.roomId, -1)} aria-label="Menos adultos" disabled={item.guestCount <= 1}><Minus size={11} /></button>
                        <span>{item.guestCount} adulto{item.guestCount !== 1 ? 's' : ''}</span>
                        <button onClick={() => updateCartGuestCount(item.roomId, 1)} aria-label="Más adultos" disabled={item.guestCount >= room.maxGuests}><Plus size={11} /></button>
                        {children > 0 && <span className={styles.cartMinors}>· {children} menor{children > 1 ? 'es' : ''}</span>}
                      </div>
                      <div className={styles.cartItemPrice}>{formatMXN(roomTotal)}</div>
                    </div>
                  );
                })}
                {cart.length > 1 && (() => {
                  const assigned = cart.reduce((s, i) => s + i.guestCount, 0);
                  return (
                    <div className={styles.guestDistNote}>
                      <Users size={11} strokeWidth={1.5} />
                      <span>{assigned} de {adults} adulto{adults !== 1 ? 's' : ''} asignado{assigned !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {cart.length === 0 && searched && (
              <p className={styles.sidebarEmpty}>Selecciona una habitación disponible</p>
            )}

            {cart.length > 0 && !promoCode && nights === 3 && potential3xSaving > 0 && (
              <div className={styles.promoSuggest}>
                <Tag size={14} strokeWidth={1.5} />
                <div className={styles.promoSuggestText}>
                  <strong>Tu estancia califica: 3ª noche gratis</strong>
                  <p>Aplica el código XILITLA3MX y ahorra {formatMXN(potential3xSaving)}.</p>
                </div>
                <button className={styles.promoSuggestBtn} onClick={() => applyPromoCode('XILITLA3MX', 'suggestion')}>
                  Aplicar
                </button>
              </div>
            )}

            {cart.length > 0 && !promoCode && nights === 2 && (
              <p className={styles.nightUpsell}>
                <Tag size={12} strokeWidth={1.5} />
                <span>Con 3 noches, la 3ª te sale <strong>gratis</strong> (código XILITLA3MX).</span>
              </p>
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
                ) : showPromoInput ? (
                  <div className={styles.promoInput}>
                    <input
                      type="text"
                      placeholder="Código de descuento"
                      aria-label="Código de descuento"
                      value={promoInput}
                      autoFocus
                      onChange={e => { setPromoInput(e.target.value); setPromoError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    />
                    <button onClick={applyPromo}>Aplicar</button>
                  </div>
                ) : (
                  <button className={styles.promoToggle} onClick={() => setShowPromoInput(true)}>
                    ¿Tienes un código de descuento?
                  </button>
                )}
                {promoError && <p className={styles.promoError} role="alert">{promoError}</p>}
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
                {isDeposit && (
                  <div className={styles.depositSplit}>
                    <div className={`${styles.totalRow} ${styles.payTodayRow}`}>
                      <span>Pagas hoy (50%)</span>
                      <span>{formatMXN(payToday)}</span>
                    </div>
                    <div className={`${styles.totalRow} ${styles.payLaterRow}`}>
                      <span>Al llegar al hotel</span>
                      <span>{formatMXN(payLater)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!capacityOk && cart.length > 0 && (
              <div className={styles.capacityWarning} role="alert">
                <AlertTriangle size={14} strokeWidth={2} />
                <span>
                  {totalGuests} huésped{totalGuests !== 1 ? 'es' : ''} ({adults} adulto{adults !== 1 ? 's' : ''}{children > 0 ? ` + ${children} menor${children !== 1 ? 'es' : ''}` : ''}) pero la capacidad del carrito es {cartCapacity}.
                  Agrega otra habitación o elige Helechos 1 ó 2 (hasta 6 personas).
                </span>
              </div>
            )}

            {cartHasUnavailable && cart.length > 0 && (
              <div className={styles.capacityWarning} role="alert">
                <AlertTriangle size={14} strokeWidth={2} />
                <span>
                  {unavailableCartDetail.length > 0 ? (
                    <>
                      {unavailableCartDetail.map(d => (
                        <span key={d.room}>
                          <strong>{d.room}</strong> ya está ocupada la noche del <strong>{fmtNight(d.date)}</strong>.{' '}
                        </span>
                      ))}
                      Ajusta las fechas o elige otra suite.
                    </>
                  ) : (
                    <>Una o más habitaciones del carrito no están disponibles para estas fechas. Cámbialas o elige otras fechas.</>
                  )}
                </span>
              </div>
            )}

            {holdRemaining !== null && cart.length > 0 && (
              <div className={styles.holdChip} role="status">
                <Clock size={14} strokeWidth={2} />
                <span>Tu selección está <strong>apartada</strong> por <strong className={styles.holdTime}>{fmtCountdown(holdRemaining)}</strong> min</span>
              </div>
            )}

            {holdExpired && cart.length > 0 && (
              <div className={styles.holdExpiredNote} role="alert">
                <AlertTriangle size={14} strokeWidth={2} />
                <span>Tu apartado de 10 min terminó. Tu selección sigue aquí; puedes reactivarlo.</span>
                <button onClick={() => renewHold(cart, checkin, checkout)}>Renovar apartado</button>
              </div>
            )}

            <button
              className={styles.checkoutBtn}
              disabled={cart.length === 0 || !checkin || !checkout || !capacityOk || cartHasUnavailable}
              onClick={goToCheckout}
            >
              {cart.length === 0
                ? 'Elige tu habitación'
                : isDeposit
                  ? `Continuar — ${fmtShort(payToday)} hoy`
                  : `Continuar — ${fmtShort(total)}`}
              {' '}<ChevronRight size={16} strokeWidth={2} />
            </button>

            <div className={styles.guarantees}>
              <span><ShieldCheck size={12} strokeWidth={1.5} /> Pago seguro con Stripe</span>
              <span><ShieldCheck size={12} strokeWidth={1.5} /> Reembolso 100% hasta 7 días antes</span>
              <span><ShieldCheck size={12} strokeWidth={1.5} /> Precio final — sin cargos ocultos</span>
            </div>

            <div className={styles.socialProofLine}>
              <span className={styles.ratingStars} aria-hidden="true">
                <Star size={13} strokeWidth={0} fill="currentColor" />
              </span>
              <span><strong>4.5/5</strong> · 523 reseñas verificadas en Google</span>
            </div>

            <blockquote className={styles.sidebarQuote}>
              <p>“{getStripQuotes()[0].text}”</p>
              <footer>— {getStripQuotes()[0].name} · Google</footer>
            </blockquote>

            <div className={styles.payMethods} aria-label="Métodos de pago aceptados">
              <span>Visa</span><span>Mastercard</span><span>Amex</span><span>Apple Pay</span><span>Google Pay</span>
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

      {/* ── Sticky mobile booking bar ── */}
      {cart.length > 0 && (
        <div className={styles.mobileBar}>
          <button
            className={styles.mobileBarInfo}
            onClick={() => sidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            aria-label="Ver resumen de tu reserva"
          >
            <span className={styles.mobileBarTotal}>{formatMXN(total)}</span>
            <span className={styles.mobileBarSub}>
              {holdRemaining !== null ? `Apartada ${fmtCountdown(holdRemaining)} · ` : ''}
              {isDeposit
                ? `hoy solo ${fmtShort(payToday)}`
                : `${nights} noche${nights !== 1 ? 's' : ''} · ${cart.length} hab.`}
            </span>
          </button>
          <button className={styles.mobileBarCta} onClick={handleMobileContinue}>
            Continuar <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
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
        <div className={styles.lightbox} onClick={() => setLightboxRoom(null)} role="dialog" aria-modal="true" aria-label={`Galería de ${lightboxRoom.name}`}>
          <button className={styles.lbClose} onClick={() => setLightboxRoom(null)} aria-label="Cerrar galería">✕</button>
          <button className={styles.lbPrev} onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + lightboxRoom.images.length) % lightboxRoom.images.length); }} aria-label="Foto anterior">‹</button>
          <div className={styles.lbImg} onClick={e => e.stopPropagation()}>
            <Image src={lightboxRoom.images[lightboxIdx]} alt={lightboxRoom.name} fill sizes="100vw" className={styles.lbImage} priority />
          </div>
          <button className={styles.lbNext} onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % lightboxRoom.images.length); }} aria-label="Foto siguiente">›</button>
          <p className={styles.lbCaption}>{lightboxRoom.name} · {lightboxIdx + 1}/{lightboxRoom.images.length}</p>
        </div>
      )}
      <RecentBookingsLive items={socialProof?.recent ?? []} />
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
