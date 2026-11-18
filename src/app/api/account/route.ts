import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-server';
import { requestT } from '@/lib/i18n-server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

async function getStudentForRequest(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const meRes = await fetch(`${directusUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return null;
  const { data: user } = await meRes.json() as { data: { id: string } };
  const sRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
    { headers: adminHeaders() }
  );
  if (!sRes.ok) return null;
  const { data } = await sRes.json() as { data: { id: number; user_id: string }[] };
  const student = data?.[0];
  if (!student) return null;
  return { student, userId: user.id };
}

/** Deletes every item of `collection` matching the filter query; missing collections are skipped. */
async function deleteWhere(collection: string, filter: string) {
  const res = await fetch(`${directusUrl}/items/${collection}?${filter}&fields=id&limit=-1`, { headers: adminHeaders() });
  if (!res.ok) return;
  const { data } = await res.json() as { data?: { id: string | number }[] };
  const ids = (data ?? []).map(d => d.id);
  if (ids.length === 0) return;
  const del = await fetch(`${directusUrl}/items/${collection}`, { method: 'DELETE', headers: adminHeaders(), body: JSON.stringify(ids) });
  if (!del.ok) console.error(`[account delete] ${collection}: ${del.status}`);
}

// GET /api/account — export všech dat uživatele (GDPR čl. 20)
export async function GET(request: NextRequest) {
  const t = requestT(request);
  const ctx = await getStudentForRequest(request);
  if (!ctx) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });
  const { student, userId } = ctx;

  const own = `filter[student_id][_eq]=${student.id}&limit=-1`;
  const list = async (collection: string): Promise<unknown[]> => {
    const r = await fetch(`${directusUrl}/items/${collection}?${own}`, { headers: adminHeaders() });
    return r.ok ? (((await r.json()) as { data?: unknown[] }).data ?? []) : [];
  };
  const [userRes, pages, categories, readingDiary, goals, dreams, dreamBoard, calendar, badges] = await Promise.all([
    fetch(`${directusUrl}/users/${userId}?fields=email,first_name,last_name`, { headers: adminHeaders() }),
    list('portfolio_pages'),
    list('categories'),
    list('reading_diary'),
    list('personal_goals'),
    list('dreams'),
    list('dream_board_items'),
    list('calendar_entries'),
    list('user_badges'),
  ]);

  const { data: user } = await userRes.json() as { data: { email: string; first_name: string; last_name: string } };

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      date_of_birth: (student as { date_of_birth?: string }).date_of_birth ?? null,
    },
    categories,
    portfolio_pages: pages,
    reading_diary: readingDiary,
    personal_goals: goals,
    dreams,
    dream_board_items: dreamBoard,
    calendar_entries: calendar,
    beavers: badges,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="portfolio-paradise-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

// DELETE /api/account — smaže celý účet a všechna data (GDPR čl. 17)
export async function DELETE(request: NextRequest) {
  const t = requestT(request);
  const ctx = await getStudentForRequest(request);
  if (!ctx) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });
  const { student, userId } = ctx;

  const sid = student.id;

  // Smazat všechna data žáka — po vrstvách, aby závislé záznamy zmizely dřív než ty, na které odkazují
  await Promise.allSettled([
    deleteWhere('portfolio_pages', `filter[student_id][_eq]=${sid}`),
    deleteWhere('shared_links', `filter[student_id][_eq]=${sid}`),
    deleteWhere('student_connections', `filter[teacher_id][_eq]=${sid}`),
    deleteWhere('student_connections', `filter[student_id][_eq]=${sid}`),
    deleteWhere('page_shares', `filter[from_id][_eq]=${sid}`),
    deleteWhere('page_shares', `filter[to_id][_eq]=${sid}`),
    deleteWhere('user_badges', `filter[student_id][_eq]=${sid}`),
    deleteWhere('reading_diary', `filter[student_id][_eq]=${sid}`),
    deleteWhere('dream_board_items', `filter[student_id][_eq]=${sid}`),
    deleteWhere('personal_goals', `filter[student_id][_eq]=${sid}`),
    deleteWhere('calendar_entries', `filter[student_id][_eq]=${sid}`),
    deleteWhere('organisation_members', `filter[student_id][_eq]=${sid}`),
    deleteWhere('group_members', `filter[student_id][_eq]=${sid}`),
  ]);
  await Promise.allSettled([
    deleteWhere('dreams', `filter[student_id][_eq]=${sid}`),
    deleteWhere('categories', `filter[student_id][_eq]=${sid}`),
  ]);

  // Nahrané soubory (obrázky, přílohy)
  try {
    const fr = await fetch(`${directusUrl}/files?filter[uploaded_by][_eq]=${userId}&fields=id&limit=-1`, { headers: adminHeaders() });
    const ids = fr.ok ? ((await fr.json()) as { data: { id: string }[] }).data.map(f => f.id) : [];
    if (ids.length) await fetch(`${directusUrl}/files`, { method: 'DELETE', headers: adminHeaders(), body: JSON.stringify(ids) });
  } catch (e) {
    console.error('[account delete] files', e);
  }

  // Smazat studenta a uživatele
  await fetch(`${directusUrl}/items/students/${sid}`, { method: 'DELETE', headers: adminHeaders() });
  await fetch(`${directusUrl}/users/${userId}`, { method: 'DELETE', headers: adminHeaders() });

  return NextResponse.json({ success: true });
}
