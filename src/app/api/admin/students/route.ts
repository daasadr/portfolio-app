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
  const res = await fetch(`${directusUrl}/users/me?fields=id,email`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const { data } = await res.json() as { data: { id: string; email: string } };
  if (!ADMIN_EMAILS.includes(data.email.toLowerCase())) return null;
  return data;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ message: 'Přístup odepřen' }, { status: 403 });

  // Fetch all students
  const studentsRes = await fetch(
    `${directusUrl}/items/students?limit=500&sort[]=last_name&sort[]=first_name`,
    { headers: adminH() }
  );
  if (!studentsRes.ok) return NextResponse.json({ message: 'Chyba při načítání' }, { status: 500 });
  const { data: students } = await studentsRes.json() as {
    data: { id: string; user_id: string; first_name: string; last_name: string; is_teacher: boolean; email?: string }[]
  };

  if (!students?.length) return NextResponse.json({ students: [] });

  // Batch-fetch Directus user emails for all students
  const userIds = [...new Set(students.map(s => s.user_id).filter(Boolean))];
  const usersRes = await fetch(
    `${directusUrl}/users?filter[id][_in]=${userIds.join(',')}&fields=id,email&limit=500`,
    { headers: adminH() }
  );
  const emailMap = new Map<string, string>();
  if (usersRes.ok) {
    const { data: users } = await usersRes.json() as { data: { id: string; email: string }[] };
    users?.forEach(u => emailMap.set(u.id, u.email));
  }

  const merged = students.map(s => ({
    ...s,
    email: s.email ?? emailMap.get(s.user_id) ?? '',
  }));

  return NextResponse.json({ students: merged });
}
