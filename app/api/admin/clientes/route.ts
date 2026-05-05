import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, buildCRM, saveGuestNote } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const bookings = await getAllBookings();
  const crm = await buildCRM(bookings);
  return NextResponse.json(crm);
}

export async function PATCH(req: NextRequest) {
  const { email, notas } = await req.json();
  await saveGuestNote(email, notas);
  return NextResponse.json({ ok: true });
}
