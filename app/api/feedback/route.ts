import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback } from '@/lib/email-tracking';

export const dynamic = 'force-dynamic';

// GET /api/feedback?conf=PE-M-XXX&rating=5
// El huésped hace clic en una estrella del email de encuesta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conf   = searchParams.get('conf')?.trim() || '';
  const rating = parseInt(searchParams.get('rating') || '0');

  if (!conf || rating < 1 || rating > 5) {
    return NextResponse.redirect(new URL('/gracias-por-tu-opinion', req.url));
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';

  try {
    await saveFeedback(conf, rating, '', ip);
  } catch (e) {
    console.error('[feedback GET] error saving:', e);
  }

  const redirectUrl = new URL('/gracias-por-tu-opinion', req.url);
  redirectUrl.searchParams.set('conf', conf);
  redirectUrl.searchParams.set('rating', String(rating));
  return NextResponse.redirect(redirectUrl);
}

// POST /api/feedback   { conf, rating, comment }
// El huésped envía un comentario escrito desde la página de agradecimiento
export async function POST(req: NextRequest) {
  try {
    const { conf, rating, comment } = await req.json();
    if (!conf) return NextResponse.json({ error: 'Falta conf' }, { status: 400 });
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    await saveFeedback(String(conf), Number(rating) || 0, String(comment || '').slice(0, 1000), ip);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
