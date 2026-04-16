import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const { paymentIntentId, amount } = await req.json();
    if (!paymentIntentId || !amount) {
      return NextResponse.json({ error: 'paymentIntentId y amount son requeridos' }, { status: 400 });
    }
    if (amount < 1000) {
      return NextResponse.json({ error: 'El monto mínimo es $10 MXN' }, { status: 400 });
    }
    const updated = await stripe.paymentIntents.update(paymentIntentId, { amount: Math.round(amount) });
    return NextResponse.json({ success: true, amount: updated.amount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
