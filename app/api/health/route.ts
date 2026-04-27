import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: {
      RESEND_API_KEY:            !!process.env.RESEND_API_KEY,
      RESEND_FROM:               process.env.RESEND_FROM || '(default) reservas@paraisoencantado.com',
      ADMIN_EMAIL:               process.env.ADMIN_EMAIL || '(default) reservas@paraisoencantado.com',
      STRIPE_SECRET_KEY:         !!process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_STRIPE_KEY:    !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      GOOGLE_SHEET_ID:           !!process.env.GOOGLE_SHEET_ID,
      GOOGLE_SHEETS_CREDENTIALS: !!process.env.GOOGLE_SHEETS_CREDENTIALS,
    },
  };
  return NextResponse.json(checks);
}
