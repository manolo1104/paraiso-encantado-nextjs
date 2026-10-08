import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/sheets';
import { registrarBusqueda } from '@/lib/busquedas';
import { calcNights } from '@/lib/booking';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { checkin, checkout, rooms, sessionId, guests } = await req.json();
    if (!checkin || !checkout || !rooms || !Array.isArray(rooms)) {
      return NextResponse.json({ error: 'checkin, checkout y rooms son requeridos' }, { status: 400 });
    }
    // sessionId (opcional): excluye el apartado temporal del propio visitante
    const result = await checkAvailability(checkin, checkout, rooms, typeof sessionId === 'string' ? sessionId : null);

    // Señal de demanda para los precios dinámicos. No bloquea la respuesta y,
    // si la hoja falla, la búsqueda del huésped sigue su camino.
    if (!result.degraded) {
      registrarBusqueda({
        checkin: String(checkin),
        checkout: String(checkout),
        noches: calcNights(String(checkin), String(checkout)),
        huespedes: Number(guests) || 0,
        // "Sin cupo" = no quedó ni una suite libre de las que preguntó.
        sinCupo: rooms.length > 0 && result.unavailableRooms.length >= rooms.length,
        sesion: typeof sessionId === 'string' ? sessionId : '',
      });
    }

    return NextResponse.json({
      available: result.available,
      unavailableRooms: result.unavailableRooms,
      unavailableDetail: result.unavailableDetail ?? [],
      degraded: result.degraded ?? false,
      message: result.degraded
        ? 'No se pudo verificar la disponibilidad — reintenta'
        : result.available
          ? 'Habitaciones disponibles'
          : `No disponibles: ${result.unavailableRooms.join(', ')}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
