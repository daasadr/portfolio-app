import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/lib/security';
import { setAuthCookies, type AuthTokens } from '@/lib/auth-cookies';
import { requestT } from '@/lib/i18n-server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
export async function POST(request: NextRequest) {
  const t = requestT(request);
  const { email, password, remember } = await request.json() as {
    email: string; password: string; remember?: boolean;
  };

  if (!email || !password) {
    return NextResponse.json({ message: t('Chybí přihlašovací údaje', 'Missing login details') }, { status: 400 });
  }

  // Strict per account, generous per IP (a whole class shares one school IP)
  if (
    isRateLimited(`login-email:${String(email).trim().toLowerCase()}`, 10, 900) ||
    isRateLimited(`login-ip:${getClientIp(request)}`, 200, 900)
  ) {
    return NextResponse.json({ message: t('Příliš mnoho pokusů. Zkuste to za 15 minut.', 'Too many attempts. Please try again in 15 minutes.') }, { status: 429 });
  }

  const res = await fetch(`${directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json() as { errors?: { message: string }[] };
    return NextResponse.json(
      { message: err.errors?.[0]?.message ?? t('Neplatné přihlašovací údaje', 'Invalid login details') },
      { status: 401 }
    );
  }

  const { data } = await res.json() as { data: AuthTokens };

  // remember=true → persistent cookies (30 days); otherwise session cookies
  const response = NextResponse.json({ success: true });
  setAuthCookies(response, data, remember ? 60 * 60 * 24 * 30 : undefined);
  return response;
}
