import { NextRequest, NextResponse } from 'next/server';
import { addLead } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });
    }
    await addLead(email.trim().toLowerCase());
    console.log(`💰 LEAD_CAPTURED  email=${email.slice(0, 4)}***`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
