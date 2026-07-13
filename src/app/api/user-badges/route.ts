import { NextRequest, NextResponse } from 'next/server';
import { BADGES } from '@/lib/badges';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

interface UserBadgeRow {
  id: number;
  student_id: string;
  badge_slug: string;
  steps_done: number;
  last_step_date: string | null;
  completed_at: string | null;
  expires_at: string | null;
  status: 'active' | 'completed' | 'expired';
  date_created: string;
}

async function getStudent(token: string): Promise<{ id: string } | null> {
  const meRes = await fetch(`${directusUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return null;
  const { data: user } = await meRes.json() as { data: { id: string } };
  const sr = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
    { headers: h() }
  );
  if (!sr.ok) return null;
  const { data } = await sr.json() as { data: { id: string }[] };
  return data?.[0] ?? null;
}

// GET: my user_badges with badge definition merged
export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const student = await getStudent(auth.replace('Bearer ', ''));
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const res = await fetch(
    `${directusUrl}/items/user_badges?filter[student_id][_eq]=${student.id}&sort=-date_created`,
    { headers: h() }
  );
  const { data } = await res.json() as { data: UserBadgeRow[] };

  const merged = (data ?? []).map(ub => ({
    ...ub,
    badge: BADGES.find(b => b.slug === ub.badge_slug) ?? null,
  }));

  return NextResponse.json({ user_badges: merged });
}

// POST: start a badge { badge_slug }
export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const student = await getStudent(auth.replace('Bearer ', ''));
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const { badge_slug } = await request.json() as { badge_slug: string };
  const badge = BADGES.find(b => b.slug === badge_slug);
  if (!badge) return NextResponse.json({ message: 'Bobřík nenalezen' }, { status: 404 });

  // Check for duplicate active/completed
  const dupRes = await fetch(
    `${directusUrl}/items/user_badges?filter[student_id][_eq]=${student.id}&filter[badge_slug][_eq]=${badge_slug}&filter[status][_in]=active,completed&limit=1`,
    { headers: h() }
  );
  const { data: dup } = await dupRes.json() as { data: unknown[] };
  if (dup?.length) {
    return NextResponse.json({ message: 'Tohoto bobříka už máš aktivního nebo splněného' }, { status: 409 });
  }

  const createRes = await fetch(`${directusUrl}/items/user_badges`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({
      student_id: student.id,
      badge_slug,
      steps_done: 0,
      status: 'active',
      last_step_date: null,
    }),
  });
  const { data: created } = await createRes.json() as { data: UserBadgeRow };
  return NextResponse.json({ user_badge: { ...created, badge } }, { status: 201 });
}
