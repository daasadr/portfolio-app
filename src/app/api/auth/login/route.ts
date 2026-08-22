import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const isProd = process.env.NODE_ENV === 'production';

function cookieOpts(maxAge?: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict' as const,
    path: '/',
    ...(maxAge != null ? { maxAge } : {}),
  };
}

export async function POST(request: NextRequest) {
  const { email, password, remember } = await request.json() as {
    email: string; password: string; remember?: boolean;
  };

  if (!email || !password) {
    return NextResponse.json({ message: 'Chybí přihlašovací údaje' }, { status: 400 });
  }

  const res = await fetch(`${directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json() as { errors?: { message: string }[] };
    return NextResponse.json(
      { message: err.errors?.[0]?.message ?? 'Neplatné přihlašovací údaje' },
      { status: 401 }
    );
  }

  const { data } = await res.json() as {
    data: { access_token: string; refresh_token: string; expires: number };
  };

  // remember=true → persistent cookie (30 days); otherwise session cookie
  const tokenMaxAge = remember ? 60 * 60 * 24 * 30 : undefined;
  const refreshMaxAge = remember ? 60 * 60 * 24 * 30 : undefined;

  const response = NextResponse.json({ success: true });
  response.cookies.set('pp_token', data.access_token, cookieOpts(tokenMaxAge));
  response.cookies.set('pp_refresh', data.refresh_token, {
    ...cookieOpts(refreshMaxAge),
    path: '/api/auth',
  });
  return response;
}
