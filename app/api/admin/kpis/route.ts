import { NextResponse } from 'next/server';
import { getAllBookings } from '@/lib/admin/sheets-admin';
import { calcKPIs } from '@/lib/admin/kpis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const bookings = await getAllBookings();
  const kpis = calcKPIs(bookings);
  return NextResponse.json(kpis);
}
