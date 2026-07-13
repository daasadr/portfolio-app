import { NextRequest, NextResponse } from 'next/server';
import { BADGES } from '@/lib/badges';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

async function getStudentId(token: string): Promise<string | null> {
  const meRes = await fetch(`${directusUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return null;
  const { data: user } = await meRes.json() as { data: { id: string } };
  const sr = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
    { headers: h() }
  );
  if (!sr.ok) return null;
  const { data } = await sr.json() as { data: { id: string }[] };
  return data?.[0]?.id ?? null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const studentId = await getStudentId(auth.replace('Bearer ', ''));
  if (!studentId) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const ubRes = await fetch(`${directusUrl}/items/user_badges/${id}`, { headers: h() });
  if (!ubRes.ok) return NextResponse.json({ message: 'Bobřík nenalezen' }, { status: 404 });
  const { data: ub } = await ubRes.json() as {
    data: {
      id: number; student_id: string; badge_slug: string;
      steps_done: number; last_step_date: string | null; status: string;
    }
  };

  if (String(ub.student_id) !== String(studentId)) return NextResponse.json({ message: 'Neautorizováno' }, { status: 403 });
  if (ub.status !== 'active') return NextResponse.json({ message: 'Bobřík není aktivní' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  if (ub.last_step_date === today) {
    return NextResponse.json({ message: 'Dnes jsi bobříka již splnil/a. Zítra zase!' }, { status: 409 });
  }

  const badge = BADGES.find(b => b.slug === ub.badge_slug);
  if (!badge) return NextResponse.json({ message: 'Bobřík nenalezen' }, { status: 404 });

  const newSteps = ub.steps_done + 1;
  const isCompleted = newSteps >= badge.total_steps;

  const patch: Record<string, unknown> = { steps_done: newSteps, last_step_date: today };
  if (isCompleted) {
    patch.status = 'completed';
    patch.completed_at = new Date().toISOString();
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 1);
    patch.expires_at = exp.toISOString();
  }

  const patchRes = await fetch(`${directusUrl}/items/user_badges/${id}`, {
    method: 'PATCH',
    headers: h(),
    body: JSON.stringify(patch),
  });
  const { data: updated } = await patchRes.json() as { data: unknown };
  return NextResponse.json({ user_badge: updated, completed: isCompleted });
}
