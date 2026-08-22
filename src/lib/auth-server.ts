import { NextRequest } from 'next/server';

/**
 * Extract the Directus JWT from the request.
 * Cookie (HttpOnly) takes priority; Authorization header is accepted as fallback.
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get('pp_token')?.value;
  if (cookie) return cookie;
  const header = request.headers.get('Authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}
