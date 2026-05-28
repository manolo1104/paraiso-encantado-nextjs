import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
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

export const dynamic = 'force-dynamic';

// Monto mínimo que Stripe acepta en MXN (en centavos) — evita PI de $0/$1.
const MIN_AMOUNT_CENTS = 1000; // $10 MXN

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const body = await req.json();
    const { cart, checkin, checkout, promoCode, customerEmail, customerName, bookingDetails } = body;

    // ── Validación servidor: el precio se calcula AQUÍ, nunca se confía en el cliente ──
    if (!Array.isArray(cart) || cart.length === 0 || !checkin || !checkout) {
      return NextResponse.json({ error: 'cart, checkin y checkout son requeridos' }, { status: 400 });
    }

    // Sanear el carrito contra el catálogo real de habitaciones
    const cleanCart: CartItem[] = [];
    for (const item of cart) {
      const room = BOOKING_ROOMS.find(r => r.id === Number(item?.roomId));
      if (!room) continue;
      const guestCount = Math.max(1, Math.min(Number(item?.guestCount) || 1, room.maxGuests));
      cleanCart.push({ roomId: room.id, guestCount });
    }
    if (cleanCart.length === 0) {
      return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 });
    }

    const nights = calcNights(checkin, checkout);
    if (nights <= 0) {
      return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 });
    }

    const subtotal = calcCartSubtotal(cleanCart, checkin, checkout);

    // Validar y aplicar promo SOLO si el servidor la reconoce
    let discount = 0;
    let appliedPromo: PromoCode | null = null;
    if (promoCode) {
      const upper = String(promoCode).toUpperCase() as PromoCode;
      if (VALID_PROMO_CODES.includes(upper)) {
        discount = calcPromoDiscount(upper, cleanCart, checkin, checkout, nights);
        appliedPromo = upper;
      }
    }

    const stayTotal = Math.max(0, subtotal - discount);
    const deposit = calcDepositAmount(stayTotal, nights);
    const pending = stayTotal - deposit;
    const isDeposit = nights >= 2;

    const amountCents = Math.round(deposit * 100);
    if (amountCents < MIN_AMOUNT_CENTS) {
      return NextResponse.json({ error: 'El monto calculado es inválido' }, { status: 400 });
    }

    // Resumen compacto del carrito para que el webhook pueda reconstruir la reserva
    const roomsMeta = cleanCart
      .map(c => `${BOOKING_ROOMS.find(r => r.id === c.roomId)!.name}:${c.guestCount}`)
      .join('|')
      .slice(0, 480);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      description: `Reserva Hotel Paraíso Encantado - ${customerName || ''}`,
      receipt_email: customerEmail || undefined,
      metadata: {
        // Montos AUTORITATIVOS calculados en servidor (fuente de verdad para confirmación)
        stayTotal: String(stayTotal),
        depositPaid: String(deposit),
        pending: String(pending),
        isDeposit: String(isDeposit),
        promoCode: appliedPromo || '',
        checkin: String(checkin),
        checkout: String(checkout),
        nights: String(nights),
        adults: String(bookingDetails?.adults ?? bookingDetails?.guests ?? ''),
        children: String(bookingDetails?.children ?? bookingDetails?.minors ?? ''),
        rooms: roomsMeta,
        customerEmail: customerEmail || '',
        customerName: customerName || '',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      // Devolvemos los montos del servidor para que el cliente muestre lo correcto
      stayTotal,
      depositPaid: deposit,
      pending,
      isDeposit,
    });
  } catch (e: any) {
    console.error('❌ create-payment-intent error:', e.message, '| STRIPE_KEY_SET:', !!process.env.STRIPE_SECRET_KEY, '| STRIPE_KEY_PREFIX:', process.env.STRIPE_SECRET_KEY?.slice(0, 7));
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
