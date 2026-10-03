import { NextRequest, NextResponse } from 'next/server';
import { BADGES } from '@/lib/badges';
import { getTokenFromRequest } from '@/lib/auth-server';
import { isValidId, pragueToday } from '@/lib/security';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

// In-flight check-ins — parallel requests must not each see "not done today"
// (single-instance deployment, same assumption as the rate limiter)
const inFlight = new Set<string>();

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

function previousDay(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) return NextResponse.json({ message: 'Neplatné ID' }, { status: 400 });
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const studentId = await getStudentId(token);
  if (!studentId) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  if (inFlight.has(id)) {
    return NextResponse.json({ message: 'Dnes jsi bobříka již splnil/a. Zítra zase!' }, { status: 409 });
  }
  inFlight.add(id);
  try {
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

    const today = pragueToday();
    const lastDay = ub.last_step_date?.slice(0, 10) ?? null;
    if (lastDay === today) {
      return NextResponse.json({ message: 'Dnes jsi bobříka již splnil/a. Zítra zase!' }, { status: 409 });
    }

    const badge = BADGES.find(b => b.slug === ub.badge_slug);
    if (!badge) return NextResponse.json({ message: 'Bobřík nenalezen' }, { status: 404 });

    // Days must follow each other — a skipped day starts the streak again
    const restarted = ub.steps_done > 0 && lastDay !== previousDay(today);
    const newSteps = restarted ? 1 : ub.steps_done + 1;
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
    if (!patchRes.ok) return NextResponse.json({ message: 'Chyba při ukládání' }, { status: 500 });
    const { data: updated } = await patchRes.json() as { data: unknown };
    return NextResponse.json({ user_badge: updated, completed: isCompleted, restarted });
  } finally {
    inFlight.delete(id);
  }
}
