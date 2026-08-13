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
    const { conf, rating, comment, detalle } = await req.json();
    if (!conf) return NextResponse.json({ error: 'Falta conf' }, { status: 400 });
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const clamp = (v: unknown) => {
      const n = Number(v);
      return n >= 1 && n <= 5 ? Math.round(n) : undefined;
    };
    await saveFeedback(
      String(conf), Number(rating) || 0, String(comment || '').slice(0, 1000), ip,
      detalle ? {
        limpieza: clamp(detalle.limpieza),
        agua: clamp(detalle.agua),
        descanso: clamp(detalle.descanso),
        desayuno: clamp(detalle.desayuno),
        atencion: clamp(detalle.atencion),
        spa: clamp(detalle.spa),
        guia: clamp(detalle.guia),
        llegada: String(detalle.llegada || '').slice(0, 30),
        tour: String(detalle.tour || '').slice(0, 5),
        nps: Number(detalle.nps) >= 0 && Number(detalle.nps) <= 10 ? Math.round(Number(detalle.nps)) : undefined,
      } : undefined,
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
