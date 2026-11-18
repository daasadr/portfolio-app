import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-server';
import { requestT } from '@/lib/i18n-server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const adminHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

/** Never sent to the browser — not even to the account owner. */
function publicStudent(s: Record<string, unknown> | undefined | null) {
  if (!s) return null;
  const { security_answer: _hidden, ...rest } = s;
  return rest;
}

async function findOwnStudent(request: NextRequest): Promise<Record<string, unknown> | null | 'unauthorized'> {
  const userToken = getTokenFromRequest(request);
  if (!userToken) return 'unauthorized';
  const meRes = await fetch(`${directusUrl}/users/me?fields=id`, { headers: { Authorization: `Bearer ${userToken}` } });
  if (!meRes.ok) return 'unauthorized';
  const { data: user } = await meRes.json() as { data: { id: string } };
  const studentsRes = await fetch(`${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`, { headers: adminHeaders() });
  if (!studentsRes.ok) return null;
  const { data } = await studentsRes.json() as { data: Record<string, unknown>[] };
  return data?.[0] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const student = await findOwnStudent(request);
    if (student === 'unauthorized') return NextResponse.json({ student: null }, { status: 401 });
    return NextResponse.json({ student: publicStudent(student) });
  } catch (e) {
    console.error('[api/student] unexpected error:', e);
    return NextResponse.json({ student: null }, { status: 500 });
  }
}

// PATCH /api/student — own profile: name and date of birth
export async function PATCH(request: NextRequest) {
  const t = requestT(request);
  const student = await findOwnStudent(request);
  if (student === 'unauthorized' || !student) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { first_name?: unknown; last_name?: unknown; date_of_birth?: unknown };
  const name = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const first_name = name(body.first_name);
  const last_name = name(body.last_name);
  if (!first_name || !last_name || first_name.length > 100 || last_name.length > 100) {
    return NextResponse.json({ message: t('Vyplňte jméno a příjmení (nejvýše 100 znaků).', 'Please fill in your first and last name (at most 100 characters).') }, { status: 400 });
  }
  const dob = typeof body.date_of_birth === 'string' && body.date_of_birth ? body.date_of_birth : null;
  if (dob !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return NextResponse.json({ message: t('Neplatné datum narození.', 'Invalid date of birth.') }, { status: 400 });
  }

  const res = await fetch(`${directusUrl}/items/students/${encodeURIComponent(String(student.id))}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ first_name, last_name, date_of_birth: dob }),
  });
  if (!res.ok) {
    console.error('[api/student] PATCH failed', res.status);
    return NextResponse.json({ message: t('Profil se nepodařilo uložit.', 'Could not save your profile.') }, { status: 502 });
  }
  const { data } = await res.json() as { data: Record<string, unknown> };
  return NextResponse.json({ student: publicStudent(data) });
}
