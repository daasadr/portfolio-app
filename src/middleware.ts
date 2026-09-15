import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const isProd = process.env.NODE_ENV === 'production';

// Paths that never need auth checking
const PUBLIC_PREFIXES = ['/api/auth', '/api/register', '/api/reset-password', '/api/security-question',
  '/api/portfolio', '/login', '/register', '/forgot-password', '/portfolio', '/privacy', '/shared'];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

function needsAuth(pathname: string) {
  return pathname.startsWith('/dashboard') || pathname.startsWith('/api/');
}

function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!needsAuth(pathname) || isPublic(pathname)) {
    return securityHeaders(NextResponse.next());
  }

  const ppToken = request.cookies.get('pp_token')?.value;
  const ppTokenExp = request.cookies.get('pp_token_exp')?.value;
  const ppRefresh = request.cookies.get('pp_refresh')?.value;

  // Determine if access token is expired (30s buffer)
  const isExpired = !ppToken
    || (ppTokenExp && Date.now() / 1000 > parseInt(ppTokenExp) - 30);

  if (isExpired && ppRefresh) {
    // Proactively refresh the token
    try {
      const refreshRes = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: ppRefresh, mode: 'json' }),
      });

      if (refreshRes.ok) {
        const { data } = await refreshRes.json() as {
          data: { access_token: string; refresh_token: string; expires?: number };
        };

        const expTs = Math.floor((Date.now() + (data.expires ?? 900_000)) / 1000);
        const cookieBase = { secure: isProd, sameSite: 'strict' as const };

        // Forward new token to this request via header so the route handler gets it immediately
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-pp-token', data.access_token);

        const response = NextResponse.next({ request: { headers: requestHeaders } });

        // Set new cookies for future requests
        response.cookies.set('pp_token', data.access_token, { ...cookieBase, httpOnly: true, path: '/' });
        response.cookies.set('pp_refresh', data.refresh_token, { ...cookieBase, httpOnly: true, path: '/api/auth' });
        response.cookies.set('pp_token_exp', String(expTs), { ...cookieBase, httpOnly: false, path: '/' });

        return securityHeaders(response);
      }
    } catch { /* network error — fall through */ }

    // Refresh failed — clear cookies and redirect to login if dashboard
    if (pathname.startsWith('/dashboard')) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('pp_token', '', { httpOnly: true, maxAge: 0, path: '/' });
      response.cookies.set('pp_refresh', '', { httpOnly: true, maxAge: 0, path: '/api/auth' });
      response.cookies.set('pp_token_exp', '', { httpOnly: false, maxAge: 0, path: '/' });
      return response;
    }
    // API call with expired session → 401 will be handled by the route
    return securityHeaders(NextResponse.next());
  }

  // No token at all — redirect dashboard to login
  if (!ppToken && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return securityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
