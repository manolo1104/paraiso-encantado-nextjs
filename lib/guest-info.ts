/**
 * Datos de contacto del huésped, capturados en el paso 2 (/reservar/checkout) y
 * usados en el paso 3 (/reservar/pago). Viven en sessionStorage, igual que
 * `pe_booking_state`.
 */
export const GUEST_INFO_KEY = 'pe_guest_info';

export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
  howDidYouHear: string;
}

export function saveGuestInfo(info: GuestInfo): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(GUEST_INFO_KEY, JSON.stringify(info)); } catch { /* ignore */ }
}

export function loadGuestInfo(): GuestInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(GUEST_INFO_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.name || !p?.email || !p?.phone) return null;
    return {
      name: String(p.name),
      email: String(p.email),
      phone: String(p.phone),
      notes: String(p.notes || ''),
      howDidYouHear: String(p.howDidYouHear || ''),
    };
  } catch {
    return null;
  }
}

export function clearGuestInfo(): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(GUEST_INFO_KEY); } catch { /* ignore */ }
}
