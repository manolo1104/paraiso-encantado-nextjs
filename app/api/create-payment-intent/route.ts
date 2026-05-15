import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const { amount, currency, customerEmail, customerName, bookingDetails } = await req.json();
    if (!amount || !currency) {
      return NextResponse.json({ error: 'amount y currency son requeridos' }, { status: 400 });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      // automatic_payment_methods enables Apple Pay, Google Pay, etc. on compatible devices
      automatic_payment_methods: { enabled: true },
      description: `Reserva Hotel Paraíso Encantado - ${customerName || ''}`,
      receipt_email: customerEmail,
      metadata: {
        customerEmail: customerEmail || '',
        customerName: customerName || '',
        checkin: bookingDetails?.checkin || '',
        checkout: bookingDetails?.checkout || '',
        guests: String(bookingDetails?.guests || ''),
        nights: String(bookingDetails?.nights || ''),
      },
    });
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (e: any) {
    console.error('❌ create-payment-intent error:', e.message, '| STRIPE_KEY_SET:', !!process.env.STRIPE_SECRET_KEY, '| STRIPE_KEY_PREFIX:', process.env.STRIPE_SECRET_KEY?.slice(0, 7));
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
