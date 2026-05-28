import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import Stripe from 'stripe';
import { addBookingToSheet, blockDates, removeTemporaryBlock, findConfirmationByPaymentIntent } from '@/lib/sheets';
import { buildEmailHtml } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  try {
    const body = await req.json();
    const { email, customerName, customerPhone, notes, total, paymentIntentId,
            bookingDetails, rooms, howDidYouHear, sessionId,
            amountPaid, amountPending, isDeposit } = body;

    // ── 0. VERIFICAR EL PAGO CON STRIPE (no confiar en el cliente) ──────────────
    // Sin un PaymentIntent realmente pagado NO se crea reserva ni se bloquean fechas.
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId requerido' }, { status: 400 });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    let pi: Stripe.PaymentIntent;
    try {
      pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 402 });
    }
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: `Pago no completado (estado: ${pi.status})` }, { status: 402 });
    }

    // ── 1. IDEMPOTENCIA: si ya existe la reserva para este pago, no duplicar ─────
    const existing = await findConfirmationByPaymentIntent(pi.id);
    if (existing) {
      console.log(`↩️  Reserva ya existe para ${pi.id} → ${existing} (no se duplica)`);
      return NextResponse.json({ status: 'ok', confirmationNumber: existing, duplicate: true });
    }

    // ── 2. Montos AUTORITATIVOS desde la metadata del PI (los puso el servidor) ──
    const md = pi.metadata || {};
    const paidReal = (pi.amount_received ?? pi.amount) / 100; // lo realmente cobrado
    const stayTotal = Number(md.stayTotal) || Number(total) || paidReal;
    const depositPaid = Number(md.depositPaid) || (Number(amountPaid) || paidReal);
    const pending = Number(md.pending) ?? (Number(amountPending) || 0);
    const isDepositFinal = md.isDeposit ? md.isDeposit === 'true' : Boolean(isDeposit);

    const checkin  = bookingDetails?.checkin  || bookingDetails?.checkin_date  || md.checkin  || null;
    const checkout = bookingDetails?.checkout || bookingDetails?.checkout_date || md.checkout || null;
    const adults   = Number(bookingDetails?.adults ?? bookingDetails?.guests ?? md.adults ?? 1) || 1;
    const minors   = Number(bookingDetails?.minors ?? bookingDetails?.children ?? md.children ?? 0) || 0;
    const guests   = adults + minors;
    const normalizedRooms = Array.isArray(rooms) ? rooms : [];

    let nights = Number(bookingDetails?.nights);
    if (!Number.isFinite(nights) || nights <= 0) {
      if (checkin && checkout) {
        const ms = new Date(checkout + 'T00:00:00').getTime() - new Date(checkin + 'T00:00:00').getTime();
        nights = ms > 0 ? Math.round(ms / 86400000) : 1;
      } else { nights = 1; }
    }

    // 3. Número de confirmación
    const confirmationNumber = 'PE' + Date.now().toString(36).toUpperCase();

    // 4. Datos de la reserva
    const bookingData = {
      confirmation_number: confirmationNumber,
      customer_name: customerName,
      customer_phone: customerPhone || 'N/A',
      email,
      total: Math.round(stayTotal),
      anticipo: Math.round(depositPaid),
      payment_intent_id: pi.id,
      booking_details: {
        ...bookingDetails, checkin, checkout,
        checkin_date: checkin, checkout_date: checkout,
        nights, guests, adults, minors, children: minors, notes: notes || '',
      },
      rooms: normalizedRooms,
      how_did_you_hear: howDidYouHear || '',
      created_at: new Date().toISOString(),
    };

    // 5. Google Sheets — SIEMPRE (base de datos principal)
    try { await addBookingToSheet(bookingData); } catch (e: any) {
      console.error('❌ addBookingToSheet:', e.message);
    }

    // 6. Bloquear fechas
    try {
      if (checkin && checkout && normalizedRooms.length > 0) {
        await blockDates(checkin, checkout, normalizedRooms);
      }
    } catch (e: any) { console.error('❌ blockDates:', e.message); }

    // 7. Remover bloqueo temporal
    try {
      if (sessionId) await removeTemporaryBlock(sessionId);
    } catch (e: any) { console.error('❌ removeTemporaryBlock:', e.message); }

    // 8. Email (opcional)
    if (!resend) {
      console.warn('⚠️ RESEND_API_KEY no configurada — email omitido');
    } else {
      try {
        if (!email || !email.includes('@')) throw new Error('Email del cliente inválido');

        const html = buildEmailHtml({
          customerName, confirmationNumber, paymentIntentId: pi.id,
          checkin: checkin ?? undefined, checkout: checkout ?? undefined,
          nights, guests, adults, minors,
          rooms: normalizedRooms, total: stayTotal,
          amountPaid: depositPaid,
          amountPending: pending,
          isDeposit: isDepositFinal,
        });

        const from    = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';
        const adminTo = process.env.ADMIN_EMAIL || 'reservas@paraisoencantado.com';
        const bcc     = Array.from(new Set([adminTo, 'marioarturocovarrubias@hotmail.com']));

        // Resend v4: errors are returned in the response object, NOT thrown
        const { data, error: resendError } = await resend.emails.send({
          from,
          to: [email],
          bcc,
          subject: `Tu estadía está confirmada — ${confirmationNumber}`,
          html,
        });

        if (resendError) {
          console.error(`❌ Resend error: ${resendError.message} | from=${from} | to=${email}`);
        } else {
          console.log(`✅ Email enviado | id=${data?.id} | to=${email} | cn=${confirmationNumber}`);
        }
      } catch (e: any) {
        console.error('❌ Email exception:', e.message);
      }
    }

    return NextResponse.json({ status: 'ok', confirmationNumber });
  } catch (e: any) {
    console.error('❌ send-confirmation crítico:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
