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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
