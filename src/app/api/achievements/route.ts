import { NextRequest, NextResponse } from 'next/server';
import { getStudentId, directusUrl, adminHeaders } from '@/lib/reading-diary-server';
import type { AchievementCounts } from '@/lib/achievements';
import { requestT } from '@/lib/i18n-server';

/** Number of items in a collection matching the filter query; 0 if the collection is missing. */
async function count(collection: string, filter: string): Promise<number> {
  try {
    const res = await fetch(`${directusUrl}/items/${collection}?aggregate[count]=*&${filter}`, { headers: adminHeaders() });
    if (!res.ok) return 0;
    const { data } = await res.json() as { data?: { count?: number | string }[] };
    return Number(data?.[0]?.count ?? 0) || 0;
  } catch {
    return 0;
  }
}

// GET /api/achievements — activity counts for the signed-in student
export async function GET(request: NextRequest) {
  const t = requestT(request);
  const studentId = await getStudentId(request);
  if (!studentId) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });

  const own = `filter[student_id][_eq]=${studentId}`;
  const [portfolio, reading, goals, beavers, calendar, dreams, appreciated] = await Promise.all([
    count('portfolio_pages', own),
    count('reading_diary', own),
    count('personal_goals', `${own}&filter[completed][_eq]=true`),
    count('user_badges', `${own}&filter[completed_at][_nnull]=true`), // stays earned even after the badge expires
    count('calendar_entries', own),
    count('dreams', own),
    count('page_reactions', `filter[page_id][student_id][_eq]=${studentId}&filter[student_id][_neq]=${studentId}`),
  ]);

  const counts: AchievementCounts = { portfolio, reading, goals, beavers, calendar, dreams, appreciated };
  return NextResponse.json({ counts }, { headers: { 'Cache-Control': 'no-store' } });
}
