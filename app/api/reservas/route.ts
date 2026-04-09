import { NextRequest, NextResponse } from 'next/server';

// Interface para validar la reserva
interface ReservationRequest {
  checkIn: string;
  checkOut: string;
  roomId: string;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReservationRequest = await request.json();

    // Validaciones básicas
    if (!body.checkIn || !body.checkOut || !body.roomId || !body.firstName || !body.email) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar fechas
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json(
        { error: 'Fechas inválidas' },
        { status: 400 }
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: 'La fecha de salida debe ser después de entrada' },
        { status: 400 }
      );
    }

    // Validar huéspedes
    if (body.guests < 1 || body.guests > 6) {
      return NextResponse.json(
        { error: 'Número de huéspedes inválido' },
        { status: 400 }
      );
    }

    // TODO: Integrar con Google Sheets para guardar reservas
    // TODO: Enviar email de confirmación
    // TODO: Integrar con Stripe para pagos

    // Por ahora, simular reserva exitosa
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const price = 1500; // Precio promedio
    const total = nights * price;

    // Log para debugging
    console.log('Reserva recibida:', {
      ...body,
      nights,
      total,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Reserva procesada exitosamente',
        reservation: {
          id: `RES-${Date.now()}`,
          ...body,
          nights,
          total,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/reservas:', error);
    return NextResponse.json(
      { error: 'Error al procesar la reserva' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Endpoint para verificar disponibilidad
    const searchParams = request.nextUrl.searchParams;
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const roomId = searchParams.get('roomId');

    if (!checkIn || !checkOut || !roomId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // TODO: Validar contra Google Sheets

    return NextResponse.json({
      available: true,
      roomId,
      checkIn,
      checkOut,
    });
  } catch (error) {
    console.error('Error en GET /api/reservas:', error);
    return NextResponse.json(
      { error: 'Error al verificar disponibilidad' },
      { status: 500 }
    );
  }
}
