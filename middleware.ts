import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'paraiso-encantado-admin-secret-change-in-prod'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Protección del admin ──────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    try {
      await jwtVerify(token, ADMIN_SECRET);
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // ── Cookie de sesión pública ──────────────────────────────
  const res = NextResponse.next({
    request: { headers: new Headers({ ...Object.fromEntries(req.headers), 'x-pathname': pathname }) },
  });
  if (!req.cookies.get('pe_session')) {
    const sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    res.cookies.set('pe_session', sid, {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    res.headers.set('x-session-id', sid);
  } else {
    res.headers.set('x-session-id', req.cookies.get('pe_session')!.value);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/analytics).*)'],
};
