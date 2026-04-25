import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { addBookingToSheet, blockDates, removeTemporaryBlock } from '@/lib/sheets';
import { buildEmailHtml } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  try {
    const body = await req.json();
    const { email, customerName, customerPhone, notes, total, paymentIntentId,
            bookingDetails, rooms, howDidYouHear, sessionId,
            amountPaid, amountPending, isDeposit } = body;

    const checkin  = bookingDetails?.checkin  || bookingDetails?.checkin_date  || null;
    const checkout = bookingDetails?.checkout || bookingDetails?.checkout_date || null;
    const adults   = Number(bookingDetails?.adults ?? bookingDetails?.guests ?? 1) || 1;
    const minors   = Number(bookingDetails?.minors ?? bookingDetails?.children ?? 0) || 0;
    const guests   = adults + minors;
    const normalizedRooms = Array.isArray(rooms) ? rooms : [];

    let nights = Number(bookingDetails?.nights);
    if (!Number.isFinite(nights) || nights <= 0) {
      if (checkin && checkout) {
        const ms = new Date(checkout + 'T00:00:00').getTime() - new Date(checkin + 'T00:00:00').getTime();
        nights = ms > 0 ? Math.round(ms / 86400000) : 1;
      } else { nights = 1; }
    }

    // 1. Número de confirmación
    const confirmationNumber = 'PE' + Date.now().toString(36).toUpperCase();

    // 2. Datos de la reserva
    const bookingData = {
      confirmation_number: confirmationNumber,
      customer_name: customerName,
      customer_phone: customerPhone || 'N/A',
      email,
      total: Math.round(total || 0),
      payment_intent_id: paymentIntentId || null,
      booking_details: {
        ...bookingDetails, checkin, checkout,
        checkin_date: checkin, checkout_date: checkout,
        nights, guests, adults, minors, children: minors, notes: notes || '',
      },
      rooms: normalizedRooms,
      how_did_you_hear: howDidYouHear || '',
      created_at: new Date().toISOString(),
    };

    // 3. Google Sheets — SIEMPRE (base de datos principal)
    try { await addBookingToSheet(bookingData); } catch (e: any) {
      console.error('❌ addBookingToSheet:', e.message);
    }

    // 4. Bloquear fechas
    try {
      if (checkin && checkout && normalizedRooms.length > 0) {
        await blockDates(checkin, checkout, normalizedRooms);
      }
    } catch (e: any) { console.error('❌ blockDates:', e.message); }

    // 5. Remover bloqueo temporal
    try {
      if (sessionId) await removeTemporaryBlock(sessionId);
    } catch (e: any) { console.error('❌ removeTemporaryBlock:', e.message); }

    // 6. Email (opcional)
    if (resend) {
      try {
        const html = buildEmailHtml({
          customerName, confirmationNumber, paymentIntentId,
          checkin: checkin ?? undefined, checkout: checkout ?? undefined,
          nights, guests, adults, minors,
          rooms: normalizedRooms, total: total || 0,
          amountPaid: amountPaid ?? undefined,
          amountPending: amountPending ?? undefined,
          isDeposit: isDeposit ?? false,
        });
        const from    = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';
        const adminTo = process.env.ADMIN_EMAIL || 'reservas@paraisoencantado.com';
        const bcc     = Array.from(new Set([adminTo, 'marioarturocovarrubias@hotmail.com']));

        await resend.emails.send({
          from,
          to: [email],
          bcc,
          subject: `Tu estadía está confirmada — ${confirmationNumber}`,
          html,
        });
        console.log('✅ Email enviado');
      } catch (e: any) { console.error('⚠️ Email error:', e.message); }
    }

    return NextResponse.json({ status: 'ok', confirmationNumber });
  } catch (e: any) {
    console.error('❌ send-confirmation crítico:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
