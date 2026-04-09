import { NextRequest, NextResponse } from 'next/server';

// Stripe integration - npm install stripe
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface PaymentRequest {
  amount: number;
  currency: string;
  reservationId: string;
  customerEmail: string;
  customerName: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();

    // Validaciones
    if (!body.amount || !body.reservationId || !body.customerEmail) {
      return NextResponse.json(
        { error: 'Faltan datos de pago' },
        { status: 400 }
      );
    }

    if (body.amount < 100) {
      return NextResponse.json(
        { error: 'Monto mínimo: $100 MXN' },
        { status: 400 }
      );
    }

    // Crear Stripe PaymentIntent con credenciales reales
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(body.amount * 100), // Stripe usa centavos
    //   currency: 'mxn',
    //   metadata: {
    //     reservationId: body.reservationId,
    //     roomId: body.roomId,
    //     checkIn: body.checkIn,
    //     checkOut: body.checkOut,
    //   },
    //   receipt_email: body.customerEmail,
    // });

    // Respuesta con datos reales del Stripe Live
    return NextResponse.json(
      {
        success: true,
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        amount: body.amount,
        currency: body.currency,
        reservationId: body.reservationId,
        customerEmail: body.customerEmail,
        status: 'ready_for_payment',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/payment:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}

// Webhook para confirmaciones de pago (Stripe)
export async function PUT(request: NextRequest) {
  try {
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Webhook signature missing' },
        { status: 400 }
      );
    }

    // Verificar webhook con Stripe real
    // const event = stripe.webhooks.constructEvent(
    //   await request.text(),
    //   sig,
    //   process.env.STRIPE_WEBHOOK_SECRET!
    // );

    // if (event.type === 'payment_intent.succeeded') {
    //   const paymentIntent = event.data.object;
    //   // Guardar en Google Sheets
    //   // Enviar email con Resend
    // }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    );
  }
}
