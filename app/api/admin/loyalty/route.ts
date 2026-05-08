import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings } from '@/lib/admin/sheets-admin';
import { computeTier, tierDiscount, getLoyaltyByEmail } from '@/lib/admin/loyalty';

export const dynamic = 'force-dynamic';

// GET /api/admin/loyalty?email=foo@bar.com
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim();
  if (!email) return NextResponse.json({ tier: '', discountPct: 0 });

  const [bookings, loyaltyInfo] = await Promise.all([
    getAllBookings(),
    getLoyaltyByEmail(email),
  ]);

  const totalReservas = bookings.filter(
    b => b.email?.toLowerCase() === email && b.estado !== 'CANCELADA'
  ).length;

  const derivedTier = computeTier(totalReservas);
  const tier = loyaltyInfo.tier || derivedTier;
  const discountPct = tierDiscount(tier);

  return NextResponse.json({ tier, discountPct, totalReservas, enrolledAt: loyaltyInfo.enrolledAt });
}
