import { NextRequest, NextResponse } from 'next/server';
import {
  BOOKING_ROOMS,
  calcCartSubtotal,
  calcPromoDiscount,
  calcDepositAmount,
  calcNights,
  VALID_PROMO_CODES,
  type CartItem,
  type PromoCode,
} from '@/lib/booking';
import { saveIncompleteBooking } from '@/lib/abandoned';

export const dynamic = 'force-dynamic';

/**
 * Paso 2 del checkout: el huésped ya dio nombre, correo y teléfono pero todavía
 * no paga. Guardamos la reserva a medias para poder recuperarla por correo.
 *
 * Los montos se recalculan AQUÍ desde el carrito (igual que en
 * create-payment-intent): lo que manda el navegador solo sirve de pista.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId, name, email, phone, notes, howDidYouHear,
      cart, checkin, checkout, promoCode, adults, children,
    } = body;

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail.includes('@') || !String(name || '').trim() || !String(phone || '').trim()) {
      return NextResponse.json({ error: 'nombre, correo y teléfono son requeridos' }, { status: 400 });
    }
    if (!Array.isArray(cart) || cart.length === 0 || !checkin || !checkout) {
      return NextResponse.json({ error: 'Carrito o fechas inválidos' }, { status: 400 });
    }

    const cleanCart: CartItem[] = [];
    for (const item of cart) {
      const room = BOOKING_ROOMS.find(r => r.id === Number(item?.roomId));
      if (!room) continue;
      cleanCart.push({
        roomId: room.id,
        guestCount: Math.max(1, Math.min(Number(item?.guestCount) || 1, room.maxGuests)),
      });
    }
    if (cleanCart.length === 0) {
      return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 });
    }

    const nights = calcNights(checkin, checkout);
    if (nights <= 0) return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 });

    const subtotal = calcCartSubtotal(cleanCart, checkin, checkout);
    let discount = 0;
    let appliedPromo = '';
    if (promoCode) {
      const upper = String(promoCode).toUpperCase() as PromoCode;
      if (VALID_PROMO_CODES.includes(upper)) {
        discount = calcPromoDiscount(upper, cleanCart, checkin, checkout, nights);
        appliedPromo = upper;
      }
    }
    const total = Math.max(0, subtotal - discount);

    // Guardado best-effort: si Sheets falla, el huésped debe poder seguir al pago.
    await saveIncompleteBooking({
      sessionId: String(sessionId || '').slice(0, 100),
      nombre: String(name).trim().slice(0, 120),
      email: cleanEmail,
      telefono: String(phone).trim().slice(0, 40),
      checkin, checkout,
      noches: nights,
      adultos: Math.max(1, Number(adults) || 1),
      menores: Math.max(0, Number(children) || 0),
      habitaciones: cleanCart
        .map(i => {
          const r = BOOKING_ROOMS.find(x => x.id === i.roomId)!;
          return `${r.name} (${i.guestCount} personas)`;
        })
        .join(', '),
      roomIds: cleanCart.map(i => `${i.roomId}:${i.guestCount}`).join(','),
      total,
      pagaHoy: calcDepositAmount(total, nights),
      promoCode: appliedPromo,
      notas: String(notes || '').slice(0, 500),
      comoNosConocio: String(howDidYouHear || '').slice(0, 60),
    }).catch(() => {});

    console.log(`📝 GUEST_INFO  ${cleanEmail.slice(0, 4)}*** ${checkin}→${checkout} ${nights}n`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
