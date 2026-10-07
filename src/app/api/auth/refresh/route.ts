import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies, clearAuthCookies, type AuthTokens } from '@/lib/auth-cookies';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('pp_refresh')?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'Žádný refresh token' }, { status: 401 });
  }

  const res = await fetch(`${directusUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken, mode: 'json' }),
  });

  if (!res.ok) {
    const response = NextResponse.json({ message: 'Refresh selhal' }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const { data } = await res.json() as { data: AuthTokens };
  const response = NextResponse.json({ success: true });
  setAuthCookies(response, data);
  return response;
}
