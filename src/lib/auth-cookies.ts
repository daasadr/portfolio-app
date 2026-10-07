import type { NextResponse } from 'next/server';

// Edge-safe (used by middleware too) — no Node APIs here.

const isProd = process.env.NODE_ENV === 'production';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires?: number;
}

/**
 * pp_refresh used to live on path=/api/auth, which meant middleware never saw it and
 * proactive refresh never ran. It is now on path=/; the old cookie must be expired
 * explicitly, otherwise the browser keeps sending the stale one first on /api/auth/*.
 */
function expireLegacyRefresh(response: NextResponse) {
  response.headers.append(
    'Set-Cookie',
    `pp_refresh=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`
  );
}

/** maxAge in seconds; omit for session cookies. */
export function setAuthCookies(response: NextResponse, data: AuthTokens, maxAge?: number) {
  const base = { secure: isProd, sameSite: 'strict' as const, path: '/', ...(maxAge != null ? { maxAge } : {}) };
  const expTs = Math.floor((Date.now() + (data.expires ?? 900_000)) / 1000);
  response.cookies.set('pp_token', data.access_token, { ...base, httpOnly: true });
  response.cookies.set('pp_refresh', data.refresh_token, { ...base, httpOnly: true });
  // Readable expiry timestamp — lets middleware refresh proactively
  response.cookies.set('pp_token_exp', String(expTs), { ...base, httpOnly: false });
  expireLegacyRefresh(response);
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set('pp_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  response.cookies.set('pp_refresh', '', { httpOnly: true, maxAge: 0, path: '/' });
  response.cookies.set('pp_token_exp', '', { httpOnly: false, maxAge: 0, path: '/' });
  expireLegacyRefresh(response);
}
