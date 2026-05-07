import { NextResponse } from 'next/server';
import { getAllBookings, getAgentMetrics } from '@/lib/admin/sheets-admin';
import { calcInsights } from '@/lib/admin/insights';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [bookings, agentMetrics] = await Promise.all([
    getAllBookings(),
    getAgentMetrics(),
  ]);
  const data = calcInsights(bookings, agentMetrics);
  return NextResponse.json(data);
}
