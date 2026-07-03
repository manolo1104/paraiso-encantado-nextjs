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

// Rutas admin que el agente de WhatsApp puede usar con x-agent-token.
// El token de servicio NO da acceso al resto de la API admin (DELETE de
// reservas, CRM, disponibilidad, etc.) — solo a lo que el bot necesita.
const AGENT_ALLOWED: Array<{ method: string; pattern: RegExp }> = [
  { method: 'GET', pattern: /^\/api\/admin\/bot-status$/ },
  { method: 'GET', pattern: /^\/api\/admin\/guest-notes$/ },
  { method: 'POST', pattern: /^\/api\/admin\/cotizaciones$/ },
  { method: 'POST', pattern: /^\/api\/admin\/cotizaciones\/[^/]+\/send-email$/ },
];

// Comparación en tiempo constante (Edge no tiene node:crypto.timingSafeEqual).
function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length, 1);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i % Math.max(ab.length, 1)] ?? 0) ^ (bb[i % Math.max(bb.length, 1)] ?? 0);
  }
  return diff === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Protección de las APIs admin (/api/admin/*) ───────────
  // Antes NO estaban protegidas: cualquiera podía leer clientes/reservas.
  // Login y logout deben ser accesibles sin token.
  const isAdminApi = pathname.startsWith('/api/admin') &&
    pathname !== '/api/admin/login' && pathname !== '/api/admin/logout';

  if (isAdminApi) {
    // Servicio interno (agente de WhatsApp) autenticado por token compartido.
    // Si AGENT_API_TOKEN está configurado y el header coincide, se permite el acceso
    // sin sesión JWT (el agente no tiene cookie de navegador).
    const agentToken = process.env.AGENT_API_TOKEN;
    const presentedAgentToken = req.headers.get('x-agent-token');
    const isAgent = Boolean(agentToken) &&
      typeof presentedAgentToken === 'string' &&
      timingSafeEqualStr(presentedAgentToken, agentToken as string);
    const agentAllowed = isAgent &&
      AGENT_ALLOWED.some(r => r.method === req.method && r.pattern.test(pathname));

    if (!agentAllowed) {
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
      secure: process.env.NODE_ENV === 'production',
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
