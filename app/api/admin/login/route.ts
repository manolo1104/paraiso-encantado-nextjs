import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, createToken } from '@/lib/admin/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password) return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });

    const ok = await checkPassword(password);
    if (!ok) return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });

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
