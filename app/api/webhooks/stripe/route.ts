import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { addBookingToSheet, blockDates, removeTemporaryBlock, findConfirmationByPaymentIntent } from '@/lib/sheets';
import { buildEmailHtml } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Webhook de Stripe — RED DE SEGURIDAD.
 * Si el navegador del cliente no llama a /api/send-confirmation (cerró la pestaña,
 * perdió internet, etc.) tras pagar, Stripe igualmente nos avisa aquí y la reserva
 * se guarda. Es idempotente: si la reserva ya existe para ese pago, no la duplica.
 *
 * Requiere configurar STRIPE_WEBHOOK_SECRET y el endpoint en el Dashboard de Stripe
 * (Developers → Webhooks → evento payment_intent.succeeded).
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET no configurado — webhook inactivo');
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig || '', webhookSecret);
  } catch (e: any) {
    console.error('❌ Firma de webhook inválida:', e.message);
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const pi = event.data.object as Stripe.PaymentIntent;

  try {
    // Idempotencia: si ya está registrada (p.ej. send-confirmation ya corrió), salir.
    const existing = await findConfirmationByPaymentIntent(pi.id);
    if (existing) {
      return NextResponse.json({ received: true, alreadyRecorded: existing });
    }

    const md = pi.metadata || {};
    const checkin = md.checkin || '';
    const checkout = md.checkout || '';

    // Reconstruir habitaciones desde metadata "Nombre:huespedes|Nombre:huespedes"
    const rooms = (md.rooms || '')
      .split('|')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const idx = s.lastIndexOf(':');
        const name = idx > 0 ? s.slice(0, idx) : s;
        const guestCount = idx > 0 ? Number(s.slice(idx + 1)) || 1 : 1;
        return { name, guestCount };
      });

    // Datos de contacto desde el cargo (billing_details capturados al confirmar)
    let name = md.customerName || '';
    let email = md.customerEmail || (pi.receipt_email ?? '') || '';
    let phone = '';
    try {
      const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id;
      if (chargeId) {
        const charge = await stripe.charges.retrieve(chargeId);
        name = name || charge.billing_details?.name || '';
        email = email || charge.billing_details?.email || '';
        phone = charge.billing_details?.phone || '';
      }
    } catch { /* no bloqueante */ }

    const stayTotal = Number(md.stayTotal) || (pi.amount_received ?? pi.amount) / 100;
    const depositPaid = Number(md.depositPaid) || (pi.amount_received ?? pi.amount) / 100;
    const pending = Number(md.pending) || 0;
    const isDeposit = md.isDeposit === 'true';
    const adults = Number(md.adults) || 1;
    const minors = Number(md.children) || 0;
    let nights = Number(md.nights) || 0;
    if (nights <= 0 && checkin && checkout) {
      const ms = new Date(checkout + 'T00:00:00').getTime() - new Date(checkin + 'T00:00:00').getTime();
      nights = ms > 0 ? Math.round(ms / 86400000) : 1;
    }

    const confirmationNumber = 'PE' + Date.now().toString(36).toUpperCase();

    await addBookingToSheet({
      confirmation_number: confirmationNumber,
      customer_name: name,
      customer_phone: phone || 'N/A',
      email,
      total: Math.round(stayTotal),
      anticipo: Math.round(depositPaid),
      payment_intent_id: pi.id,
      booking_details: {
        checkin, checkout, checkin_date: checkin, checkout_date: checkout,
        nights, guests: adults + minors, adults, minors, children: minors, notes: '',
      },
      rooms,
      how_did_you_hear: '',
      created_at: new Date().toISOString(),
    });

    if (checkin && checkout && rooms.length > 0) {
      await blockDates(checkin, checkout, rooms);
    }
    if (md.sessionId) {
      await removeTemporaryBlock(md.sessionId).catch(() => {});
    }

    // Email de confirmación (red de seguridad: el cliente no completó el flujo normal)
    if (process.env.RESEND_API_KEY && email && email.includes('@')) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const from = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';
        const adminTo = process.env.ADMIN_EMAIL || 'reservas@paraisoencantado.com';
        await resend.emails.send({
          from,
          to: [email],
          bcc: Array.from(new Set([adminTo, 'marioarturocovarrubias@hotmail.com'])),
          subject: `Tu estadía está confirmada — ${confirmationNumber}`,
          html: buildEmailHtml({
            customerName: name, confirmationNumber, paymentIntentId: pi.id,
            checkin: checkin || undefined, checkout: checkout || undefined,
            nights, guests: adults + minors, adults, minors,
            rooms, total: stayTotal, amountPaid: depositPaid,
            amountPending: pending, isDeposit,
          }),
        });
      } catch (e: any) {
        console.error('❌ webhook email error:', e.message);
      }
    }

    console.log(`✅ [webhook] Reserva recuperada y guardada: ${confirmationNumber} (${pi.id})`);
    return NextResponse.json({ received: true, created: confirmationNumber });
  } catch (e: any) {
    console.error('❌ webhook handler error:', e.message);
    // Devolver 500 para que Stripe reintente más tarde
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
