import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('pp_refresh')?.value;

  if (refreshToken) {
    // Best-effort Directus logout — ignore errors
    await fetch(`${directusUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {});
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('pp_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  response.cookies.set('pp_refresh', '', { httpOnly: true, maxAge: 0, path: '/api/auth' });
  return response;
}
