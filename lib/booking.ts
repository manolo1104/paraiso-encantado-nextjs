// ============================================================
// BOOKING ENGINE — types, room data, pricing logic
// Mirrors the JS logic in hotel-paraiso-encantado-reservas.html
// ============================================================

export interface RoomAttributes {
  wifi: boolean;
  kingBed: boolean;
  balcony: boolean;
  jacuzzi: boolean;      // tina de hidromasaje (LindaVista)
  spaPrivado: boolean;   // piscina spa privada (Jungla, Flor de Liz 1 & 2)
}

export interface BookingRoom {
  id: number;
  name: string;
  description: string;
  price: number;
  priceTiers: Record<number, number>;
  categoryGroup: string;
  category: string;
  image: string;
  images: string[];
  features: string[];
  attributes: RoomAttributes;
  maxGuests: number;
  occupancy: 'HIGH' | 'MEDIUM' | 'LOW';
  disabled?: boolean;
}

export const BOOKING_ROOMS: BookingRoom[] = [
  { id: 1, name: 'Suite Flor de Liz 1', description: 'Vistas panorámicas a la montaña y spa privado al aire libre para detener el tiempo.', price: 1900, priceTiers: { 2: 1900, 3: 2400, 4: 2400 }, categoryGroup: 'Suites con Vista', category: 'Suite Plus', image: '/images/FLOR DE LIS 1/PORTADA.jpg', images: ['/images/FLOR DE LIS 1/PORTADA.jpg', '/images/FLOR DE LIS 1/Copia de DSC09450-2.jpg', '/images/FLOR DE LIS 1/DSCF1191.jpg'], features: ['2 Camas matrimoniales', 'Baño completo', 'WiFi', 'Terraza con vista', 'Spa privado', 'Aire acondicionado'], attributes: { wifi: true, kingBed: false, balcony: true, jacuzzi: false, spaPrivado: true }, maxGuests: 4, occupancy: 'MEDIUM' },
  { id: 2, name: 'Suite Flor de Liz 2', description: 'Relajación profunda con tu propio spa privado y atardeceres incomparables sobre el pueblo.', price: 1900, priceTiers: { 2: 1900, 3: 2400, 4: 2400 }, categoryGroup: 'Suites con Vista', category: 'Suite Plus', image: '/images/FLOR DE LIS 2/PORTADA.jpeg', images: ['/images/FLOR DE LIS 2/PORTADA.jpeg', '/images/FLOR DE LIS 2/Copia de FDL2.jpg', '/images/FLOR DE LIS 2/DSCF1191.jpg'], features: ['2 Camas matrimoniales', 'Baño completo', 'WiFi', 'Terraza con vista', 'Spa privado', 'Aire acondicionado'], attributes: { wifi: true, kingBed: false, balcony: true, jacuzzi: false, spaPrivado: true }, maxGuests: 4, occupancy: 'HIGH' },
  { id: 3, name: 'Suite LindaVista', description: 'Inmersión total en el bosque con tina de hidromasaje y vistas ininterrumpidas desde las alturas.', price: 1900, priceTiers: { 2: 1900, 3: 2400, 4: 2400 }, categoryGroup: 'Suites con Vista', category: 'Suite Master', image: '/images/LINDAVISTA/PORTADA.jpg', images: ['/images/LINDAVISTA/PORTADA.jpg', '/images/LINDAVISTA/Copia de DSC09539-HDR.jpg', '/images/LINDAVISTA/Copia de DSC09569.jpg'], features: ['1 Cama kingsize', '1 Cama matrimonial', 'Tina de hidromasaje', 'Terraza privada', 'WiFi', 'Vista montaña', 'Aire acondicionado'], attributes: { wifi: true, kingBed: true, balcony: true, jacuzzi: true, spaPrivado: false }, maxGuests: 4, occupancy: 'LOW' },
  { id: 4, name: 'Jungla', description: 'Un santuario inmerso en la selva con spa privado de inmersión y exclusividad total.', price: 1900, priceTiers: { 2: 1900, 3: 2400, 4: 2400 }, categoryGroup: 'Suites con Vista', category: 'Suite Master', image: '/images/JUNGLA/PORTADA.JPG', images: ['/images/JUNGLA/PORTADA.JPG', '/images/JUNGLA/DSCF1065.jpg', '/images/JUNGLA/DSCF1078.jpg', '/images/JUNGLA/DSCF1094.jpg'], features: ['1 Cama kingsize', '1 Cama matrimonial', 'Terraza privada', 'Spa privado', 'Vista montaña', 'WiFi', 'Aire acondicionado'], attributes: { wifi: true, kingBed: true, balcony: true, jacuzzi: false, spaPrivado: true }, maxGuests: 4, occupancy: 'MEDIUM' },
  { id: 5, name: 'Suite Lajas', description: 'Amplitud elegante con sala de estar y terraza frente al majestuoso paisaje de Xilitla.', price: 1900, priceTiers: { 2: 1900, 3: 2400, 4: 2400 }, categoryGroup: 'Suites con Vista', category: 'Suite Standard', image: '/images/LAJAS/PORTADA.jpg', images: ['/images/LAJAS/PORTADA.jpg', '/images/LAJAS/Copia de DSC09610-HDR.jpg', '/images/LAJAS/Copia de DSC09615.jpg'], features: ['2 Camas matrimoniales', 'Sala de estar', '2 Baños completos', 'Terraza privada', 'WiFi', 'Aire acondicionado'], attributes: { wifi: true, kingBed: false, balcony: true, jacuzzi: false, spaPrivado: false }, maxGuests: 4, occupancy: 'LOW' },
  { id: 6, name: 'Lirios 1', description: 'Desconexión total y descanso reparador en un espacio abrazado por la vegetación.', price: 1500, priceTiers: { 2: 1500, 3: 1900, 4: 1900 }, categoryGroup: 'Habitaciones Estándar', category: 'Standard', image: '/images/LIRIOS 1/PORTADA.jpg', images: ['/images/LIRIOS 1/PORTADA.jpg', '/images/LIRIOS 1/Copia de DSC09524-HDR.jpg', '/images/LIRIOS 1/Copia de DSCF1620.jpg'], features: ['2 Camas matrimoniales', 'Vista jardín y selva', 'Baño completo', 'Aire acondicionado', 'WiFi'], attributes: { wifi: true, kingBed: false, balcony: false, jacuzzi: false, spaPrivado: false }, maxGuests: 4, occupancy: 'LOW' },
  { id: 7, name: 'Lirios 2', description: 'Un rincón de paz y silencio absoluto con balcón privado hacia los jardines.', price: 1500, priceTiers: { 2: 1500, 3: 1900, 4: 1900 }, categoryGroup: 'Habitaciones Estándar', category: 'Standard Plus', image: '/images/LIRIOS 2/PORTADA.jpg', images: ['/images/LIRIOS 2/PORTADA.jpg', '/images/LIRIOS 2/Copia de DSC09483-HDR.jpg', '/images/LIRIOS 2/Copia de DSC09489-2.jpg'], features: ['Balcón privado con vista jardines', '2 Camas matrimoniales', 'Baño completo', 'Aire acondicionado', 'WiFi'], attributes: { wifi: true, kingBed: false, balcony: true, jacuzzi: false, spaPrivado: false }, maxGuests: 4, occupancy: 'MEDIUM' },
  { id: 8, name: 'Orquídeas 2', description: 'Confort superior en cama King Size con perspectiva elevada de la selva.', price: 1500, priceTiers: { 2: 1500 }, categoryGroup: 'Habitaciones Estándar', category: 'Superior King', image: '/images/ORQUIDEAS 2/PORTADA.jpg', images: ['/images/ORQUIDEAS 2/PORTADA.jpg', '/images/ORQUIDEAS 2/Copia de DSC09568-HDR.jpg', '/images/ORQUIDEAS 2/DSCF1607.jpg'], features: ['Cama kingsize', 'Terraza con vista a piscina', 'Baño completo', 'Aire acondicionado', 'WiFi'], attributes: { wifi: true, kingBed: true, balcony: true, jacuzzi: false, spaPrivado: false }, maxGuests: 2, occupancy: 'MEDIUM' },
  { id: 9, name: 'Orquídeas Doble', description: 'Amplitud para cuatro personas con terraza y vistas a la piscina.', price: 1500, priceTiers: { 2: 1500, 3: 1900, 4: 1900 }, categoryGroup: 'Habitaciones Estándar', category: 'Superior', image: '/images/ORQUIDEAS DOBLE/PORTADA.jpg', images: ['/images/ORQUIDEAS DOBLE/PORTADA.jpg', '/images/ORQUIDEAS DOBLE/Copia de DSC09602-HDR.jpg'], features: ['2 Camas matrimoniales', 'Terraza con vista a piscina', 'Baño completo', 'Aire acondicionado', 'WiFi'], attributes: { wifi: true, kingBed: false, balcony: true, jacuzzi: false, spaPrivado: false }, maxGuests: 4, occupancy: 'HIGH' },
  { id: 10, name: 'Orquídeas 3', description: 'Vista elevada de la selva desde King Size, paz absoluta y acceso a piscina.', price: 1500, priceTiers: { 2: 1500 }, categoryGroup: 'Habitaciones Estándar', category: 'Superior King', image: '/images/ORQUIDEAS 3/PORTADA.jpg', images: ['/images/ORQUIDEAS 3/PORTADA.jpg', '/images/ORQUIDEAS 3/Copia de DSC09567-HDR.jpg', '/images/ORQUIDEAS 3/DSCF1612.jpg'], features: ['Cama kingsize', 'Terraza con vista a piscina', 'Baño completo', 'Aire acondicionado', 'WiFi'], attributes: { wifi: true, kingBed: true, balcony: true, jacuzzi: false, spaPrivado: false }, maxGuests: 2, occupancy: 'HIGH' },
  { id: 11, name: 'Bromelias', description: 'Diseño contemporáneo en planta baja con acceso fluido a la piscina.', price: 1500, priceTiers: { 2: 1500, 3: 1900, 4: 1900 }, categoryGroup: 'Habitaciones Estándar', category: 'Standard Plus', image: '/images/BROMELIAS 1/PORTADA.jpg', images: ['/images/BROMELIAS 1/PORTADA.jpg', '/images/BROMELIAS 1/Copia de DSC09385-HDR.jpg', '/images/BROMELIAS 1/Copia de DSC09419-HDR.jpg'], features: ['2 Camas matrimoniales', 'Planta baja', 'Acceso directo piscina', 'Baño completo', 'Aire acondicionado', 'WiFi'], attributes: { wifi: true, kingBed: false, balcony: false, jacuzzi: false, spaPrivado: false }, maxGuests: 4, occupancy: 'LOW' },
  { id: 12, name: 'Helechos 1', description: 'El espacio perfecto para la familia con tres camas matrimoniales y acceso a la piscina.', price: 1900, priceTiers: { 2: 1900, 3: 2400, 4: 2400, 5: 2700, 6: 3000 }, categoryGroup: 'Suites Familiares', category: 'Suite Familiar', image: '/images/HELECHOS 1/PORTADA.jpg', images: ['/images/HELECHOS 1/PORTADA.jpg', '/images/HELECHOS 1/Copia de DSC09461-HDR 2.jpg', '/images/HELECHOS 1/Copia de DSC09516-HDR.jpg'], features: ['3 Camas matrimoniales', 'Terraza con vista a piscina', 'Baño completo', 'Aire acondicionado', 'WiFi'], attributes: { wifi: true, kingBed: false, balcony: false, jacuzzi: false, spaPrivado: false }, maxGuests: 6, occupancy: 'MEDIUM' },
  { id: 13, name: 'Helechos 2', description: 'El refugio ideal para grupos: cuatro camas matrimoniales y vistas a la naturaleza.', price: 1900, priceTiers: { 2: 1900, 3: 2400, 4: 2400, 5: 2700, 6: 3000 }, categoryGroup: 'Suites Familiares', category: 'Suite Familiar Plus', image: '/images/HELECHOS 2/PORTADA.jpg', images: ['/images/HELECHOS 2/PORTADA.jpg', '/images/HELECHOS 2/Copia de DSC09461-HDR.jpg', '/images/HELECHOS 2/Copia de DSC09556-HDR.jpg'], features: ['4 Camas matrimoniales', 'Terraza con vista a piscina', 'Baño completo', 'Aire acondicionado', 'WiFi'], attributes: { wifi: true, kingBed: false, balcony: false, jacuzzi: false, spaPrivado: false }, maxGuests: 6, occupancy: 'HIGH' },
];

// ── Pricing ──────────────────────────────────────────────
export function getRoomBasePrice(room: BookingRoom, guests: number): number {
  const tiers = room.priceTiers;
  const g = Math.max(1, Math.min(guests, room.maxGuests));
  // Try exact match first, then fall back to nearest lower tier
  if (tiers[g] !== undefined) return tiers[g];
  for (let i = g - 1; i >= 1; i--) {
    if (tiers[i] !== undefined) return tiers[i];
  }
  return room.price;
}

/** Mon–Thu get -$300 MXN/night (same logic as motor) */
export function getRoomNightPrice(room: BookingRoom, guests: number, dateStr: string): number {
  const base = getRoomBasePrice(room, guests);
  const d = new Date(`${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return base;
  const day = d.getDay(); // 0=Sun, 1=Mon … 4=Thu
  const isWeekdayDiscount = day >= 1 && day <= 4;
  return isWeekdayDiscount ? Math.max(0, base - 300) : base;
}

export function calcRoomStayTotal(room: BookingRoom, guests: number, checkin: string, checkout: string): number {
  const start = new Date(`${checkin}T12:00:00`);
  const end = new Date(`${checkout}T12:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return getRoomBasePrice(room, guests);
  }
  let total = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    total += getRoomNightPrice(room, guests, `${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

export function calcRoomStayNormal(room: BookingRoom, guests: number, checkin: string, checkout: string): number {
  const start = new Date(`${checkin}T12:00:00`);
  const end = new Date(`${checkout}T12:00:00`);
  const nights = isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start
    ? 1
    : Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  return getRoomBasePrice(room, guests) * nights;
}

export function calcNights(checkin: string, checkout: string): number {
  const start = new Date(`${checkin}T12:00:00`);
  const end = new Date(`${checkout}T12:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

// ── Cart types ───────────────────────────────────────────
export interface CartItem {
  roomId: number;
  guestCount: number; // adults assigned to this room
}

// ── Coupon logic ─────────────────────────────────────────
export type PromoCode = 'XILITLA50' | 'XILITLA3MX' | 'XILITLA2026PE' | '2026GOOGLE';

export const VALID_PROMO_CODES: PromoCode[] = ['XILITLA50', 'XILITLA3MX', 'XILITLA2026PE', '2026GOOGLE'];

export interface PromoValidation {
  valid: boolean;
  error?: string;
}

export function validatePromo(code: string, nights: number, cartLength: number): PromoValidation {
  const upper = code.toUpperCase() as PromoCode;
  if (!VALID_PROMO_CODES.includes(upper)) return { valid: false, error: '❌ Código inválido. Verifica e intenta de nuevo.' };
  if (upper === 'XILITLA50' && nights < 3) return { valid: false, error: '❌ XILITLA50 aplica solo para reservas de 3 noches o más.' };
  if (upper === 'XILITLA3MX' && nights !== 3) return { valid: false, error: '❌ XILITLA3MX aplica únicamente para reservas de exactamente 3 noches.' };
  if (cartLength === 0) return { valid: false, error: '❌ Agrega al menos una habitación primero.' };
  return { valid: true };
}

function getNightByIndex(checkin: string, checkout: string, idx: number): string | null {
  const start = new Date(`${checkin}T12:00:00`);
  const end = new Date(`${checkout}T12:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + idx);
  if (cursor >= end) return null;
  const y = cursor.getFullYear();
  const m = String(cursor.getMonth() + 1).padStart(2, '0');
  const d = String(cursor.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calcPromoDiscount(
  code: PromoCode,
  cart: CartItem[],
  checkin: string,
  checkout: string,
  nights: number,
): number {
  const subtotal = cart.reduce((sum, item) => {
    const room = BOOKING_ROOMS.find(r => r.id === item.roomId)!;
    return sum + calcRoomStayTotal(room, item.guestCount, checkin, checkout);
  }, 0);

  if (code === 'XILITLA50') {
    // 50% of 3rd night value
    const thirdNightDate = getNightByIndex(checkin, checkout, 2);
    if (!thirdNightDate || nights !== 3) return 0;
    return cart.reduce((sum, item) => {
      const room = BOOKING_ROOMS.find(r => r.id === item.roomId)!;
      return sum + getRoomNightPrice(room, item.guestCount, thirdNightDate) * 0.5;
    }, 0);
  }
  if (code === 'XILITLA3MX') {
    // 3rd night free
    const thirdNightDate = getNightByIndex(checkin, checkout, 2);
    if (!thirdNightDate || nights !== 3) return 0;
    return cart.reduce((sum, item) => {
      const room = BOOKING_ROOMS.find(r => r.id === item.roomId)!;
      return sum + getRoomNightPrice(room, item.guestCount, thirdNightDate);
    }, 0);
  }
  if (code === 'XILITLA2026PE') return Math.round(subtotal * 0.10);
  if (code === '2026GOOGLE') return subtotal;
  return 0;
}

// ── Booking state (persisted to sessionStorage) ──────────
export interface BookingState {
  checkin: string;
  checkout: string;
  nights: number;
  adults: number;
  children: number;
  cart: CartItem[];
  promoCode: PromoCode | null;
  promoDiscount: number;
  // Deposit info (50% for 2+ nights)
  amountTotal?: number;
  amountPaid?: number;
  amountPending?: number;
  isDeposit?: boolean;
}

/** Returns how much to charge now: 50% for 2+ nights, 100% for 1 night */
export function calcDepositAmount(total: number, nights: number): number {
  return nights >= 2 ? Math.round(total * 0.5) : Math.round(total);
}

export const BOOKING_STATE_KEY = 'pe_booking_state';

export function saveBookingState(state: BookingState): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(BOOKING_STATE_KEY, JSON.stringify(state));
  }
}

export function loadBookingState(): BookingState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(BOOKING_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingState;
  } catch {
    return null;
  }
}

export function calcCartSubtotal(cart: CartItem[], checkin: string, checkout: string): number {
  return cart.reduce((sum, item) => {
    const room = BOOKING_ROOMS.find(r => r.id === item.roomId);
    if (!room) return sum;
    return sum + calcRoomStayTotal(room, item.guestCount, checkin, checkout);
  }, 0);
}

export function formatMXN(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')} MXN`;
}
