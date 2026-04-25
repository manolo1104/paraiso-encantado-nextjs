import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Stamp a server-side session cookie if missing
  if (!req.cookies.get('pe_session')) {
    const sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    res.cookies.set('pe_session', sid, {
      maxAge: 60 * 60 * 24, // 24 hours
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

// Run on all pages except static assets and the analytics endpoint itself
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/analytics).*)',
  ],
};
