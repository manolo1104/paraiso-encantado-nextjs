import { NextResponse } from 'next/server';
import { getFactoresVigentes } from '@/lib/precios-vigentes';

export const dynamic = 'force-dynamic';

// Calendario de precios dinámicos para el motor de reservas (/reservar).
// Público a propósito: son los precios que el huésped va a ver de todos modos.
// No expone reglas, piso, techo ni propuestas de la IA: solo el factor por noche.
export async function GET() {
  const vigentes = await getFactoresVigentes();
  return NextResponse.json(vigentes, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
