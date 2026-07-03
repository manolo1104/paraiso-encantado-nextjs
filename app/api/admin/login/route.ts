import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, createToken } from '@/lib/admin/auth';

// Rate limiting en memoria: máx 5 intentos fallidos por IP cada 15 minutos.
// (Una sola instancia en Railway → un Map basta; se reinicia con el proceso.)
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const now = Date.now();
    const entry = failedAttempts.get(ip);
    if (entry && now > entry.resetAt) failedAttempts.delete(ip);
    const active = failedAttempts.get(ip);
    if (active && active.count >= MAX_ATTEMPTS) {
      const mins = Math.ceil((active.resetAt - now) / 60000);
      return NextResponse.json(
        { error: `Demasiados intentos. Espera ${mins} min e intenta de nuevo.` },
        { status: 429 }
      );
    }

    const { password } = await req.json();
    if (!password) return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });

    const ok = await checkPassword(password);
    if (!ok) {
      const cur = failedAttempts.get(ip);
      if (cur) cur.count += 1;
      else failedAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }
    failedAttempts.delete(ip);

    const token = await createToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
