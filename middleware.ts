import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

function resolveAdminSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET;
  if (s) return new TextEncoder().encode(s);
  // En producción NO usar un secreto público conocido (sería falsificable).
  // Usamos uno aleatorio por proceso → fail-closed: el admin queda inutilizable
  // hasta configurar ADMIN_JWT_SECRET, pero el sitio público sigue funcionando.
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ ADMIN_JWT_SECRET no configurado en producción — admin deshabilitado (fail-closed)');
    return new TextEncoder().encode('disabled-' + crypto.randomUUID());
  }
  return new TextEncoder().encode('paraiso-encantado-admin-secret-dev-only');
}

const ADMIN_SECRET = resolveAdminSecret();

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Protección de las APIs admin (/api/admin/*) ───────────
  // Antes NO estaban protegidas: cualquiera podía leer clientes/reservas.
  // Login y logout deben ser accesibles sin token.
  const isAdminApi = pathname.startsWith('/api/admin') &&
    pathname !== '/api/admin/login' && pathname !== '/api/admin/logout';

  if (isAdminApi) {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    try {
      await jwtVerify(token, ADMIN_SECRET);
    } catch {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
    }
  }

  // ── Protección de las páginas admin ───────────────────────
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
