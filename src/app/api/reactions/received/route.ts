import { NextRequest, NextResponse } from 'next/server';
import { getStudentId, directusUrl, adminHeaders } from '@/lib/reading-diary-server';
import { loadPeople } from '@/lib/reactions-server';
import { isReactionType, type ReceivedReaction } from '@/lib/reactions';
import { requestT } from '@/lib/i18n-server';

// GET /api/reactions/received — the latest reactions others gave to my pages
export async function GET(request: NextRequest) {
  const t = requestT(request);
  const studentId = await getStudentId(request);
  if (!studentId) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });

  const res = await fetch(
    `${directusUrl}/items/page_reactions?filter[page_id][student_id][_eq]=${studentId}&filter[student_id][_neq]=${studentId}` +
      `&fields=id,type,date_created,student_id,page_id.id,page_id.title&sort[]=-date_created&limit=30`,
    { headers: adminHeaders() },
  );
  if (!res.ok) return NextResponse.json({ reactions: [] });
  const { data } = await res.json() as {
    data?: { id: number; type: string; date_created: string; student_id: number; page_id: { id: string; title: string } | null }[];
  };
  const rows = (data ?? []).filter(r => r.page_id && isReactionType(r.type));
  const people = await loadPeople(rows.map(r => r.student_id));

  const reactions: ReceivedReaction[] = rows.flatMap(r => {
    const from = people.get(String(r.student_id));
    if (!from || !isReactionType(r.type)) return [];
    return [{ id: r.id, type: r.type, date_created: r.date_created, page: { id: String(r.page_id!.id), title: r.page_id!.title }, from }];
  });
  return NextResponse.json({ reactions }, { headers: { 'Cache-Control': 'no-store' } });
}
