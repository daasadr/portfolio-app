import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

function adminH() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

async function getAdminUser(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const res = await fetch(`${directusUrl}/users/me?fields=email`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const { data } = await res.json() as { data: { email: string } };
  if (!ADMIN_EMAILS.includes(data.email.toLowerCase())) return null;
  return data;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ message: 'Přístup odepřen' }, { status: 403 });

  const { id } = await params;
  const body = await request.json() as { is_teacher: boolean };

  const res = await fetch(`${directusUrl}/items/students/${id}`, {
    method: 'PATCH',
    headers: adminH(),
    body: JSON.stringify({ is_teacher: body.is_teacher }),
  });

  if (!res.ok) return NextResponse.json({ message: 'Chyba při ukládání' }, { status: 500 });
  const { data } = await res.json() as { data: unknown };
  return NextResponse.json({ student: data });
}
