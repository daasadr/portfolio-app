import { NextRequest } from 'next/server';

/**
 * Extract the Directus JWT from the request.
 * x-pp-token header (set by middleware after auto-refresh) takes priority,
 * then the HttpOnly cookie, then Authorization header as fallback.
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const refreshed = request.headers.get('x-pp-token');
  if (refreshed) return refreshed;
  const cookie = request.cookies.get('pp_token')?.value;
  if (cookie) return cookie;
  const header = request.headers.get('Authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}
