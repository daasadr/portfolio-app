import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const adminH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const token = auth.replace('Bearer ', '');

  const { currentPassword, newPassword } = await request.json() as {
    currentPassword: string; newPassword: string;
  };
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Neúplná data' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: 'Nové heslo musí mít alespoň 8 znaků' }, { status: 400 });
  }

  const meRes = await fetch(`${directusUrl}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const { data: user } = await meRes.json() as { data: { id: string; email: string } };

  // Verify current password by attempting login
  const loginRes = await fetch(`${directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: currentPassword }),
  });
  if (!loginRes.ok) {
    return NextResponse.json({ message: 'Stávající heslo je nesprávné' }, { status: 400 });
  }

  const patchRes = await fetch(`${directusUrl}/users/${user.id}`, {
    method: 'PATCH',
    headers: adminH(),
    body: JSON.stringify({ password: newPassword }),
  });
  if (!patchRes.ok) {
    return NextResponse.json({ message: 'Chyba při změně hesla' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
