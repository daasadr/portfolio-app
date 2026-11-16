import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-server';
import { isRateLimited } from '@/lib/security';
import { requestT } from '@/lib/i18n-server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const adminH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

export async function POST(request: NextRequest) {
  const t = requestT(request);
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });

  const { currentPassword, newPassword } = await request.json() as {
    currentPassword: string; newPassword: string;
  };
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: t('Neúplná data', 'Incomplete data') }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: t('Nové heslo musí mít alespoň 8 znaků', 'The new password must be at least 8 characters long') }, { status: 400 });
  }

  const meRes = await fetch(`${directusUrl}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });
  const { data: user } = await meRes.json() as { data: { id: string; email: string } };
  if (isRateLimited(`change-pw:${user.id}`, 5, 900)) {
    return NextResponse.json({ message: t('Příliš mnoho pokusů. Zkuste to za 15 minut.', 'Too many attempts. Please try again in 15 minutes.') }, { status: 429 });
  }

  // Verify current password by attempting login
  const loginRes = await fetch(`${directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: currentPassword }),
  });
  if (!loginRes.ok) {
    return NextResponse.json({ message: t('Stávající heslo je nesprávné', 'The current password is incorrect') }, { status: 400 });
  }

  const patchRes = await fetch(`${directusUrl}/users/${user.id}`, {
    method: 'PATCH',
    headers: adminH(),
    body: JSON.stringify({ password: newPassword }),
  });
  if (!patchRes.ok) {
    return NextResponse.json({ message: t('Chyba při změně hesla', 'Error while changing the password') }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
