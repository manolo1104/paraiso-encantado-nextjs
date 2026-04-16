import { NextResponse } from 'next/server';
import { getFullyBookedDates } from '@/lib/sheets';

export async function GET() {
  try {
    const dates = await getFullyBookedDates(6);
    return NextResponse.json({ blockedDates: dates });
  } catch {
    return NextResponse.json({ blockedDates: [] });
  }
}
