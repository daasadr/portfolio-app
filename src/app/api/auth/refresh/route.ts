import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const isProd = process.env.NODE_ENV === 'production';

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
    response.cookies.set('pp_token', '', { httpOnly: true, maxAge: 0, path: '/' });
    response.cookies.set('pp_refresh', '', { httpOnly: true, maxAge: 0, path: '/api/auth' });
    return response;
  }

  const { data } = await res.json() as {
    data: { access_token: string; refresh_token: string };
  };

  const response = NextResponse.json({ success: true });
  response.cookies.set('pp_token', data.access_token, {
    httpOnly: true, secure: isProd, sameSite: 'strict', path: '/',
  });
  response.cookies.set('pp_refresh', data.refresh_token, {
    httpOnly: true, secure: isProd, sameSite: 'strict', path: '/api/auth',
  });
  return response;
}
