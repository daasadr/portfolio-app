import { NextRequest, NextResponse } from 'next/server';
import { getStudentId, directusUrl, adminHeaders } from '@/lib/reading-diary-server';
import { PAGE_ID_RE, accessFor, loadPages, loadReactions, summarize } from '@/lib/reactions-server';
import { isReactionType } from '@/lib/reactions';
import { isRateLimited } from '@/lib/security';
import { requestT } from '@/lib/i18n-server';

// GET /api/reactions?pages=1,2,3 — reaction summaries for pages the caller may see
export async function GET(request: NextRequest) {
  const t = requestT(request);
  const viewerId = await getStudentId(request);
  if (!viewerId) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });

  const ids = [...new Set((request.nextUrl.searchParams.get('pages') ?? '').split(',').filter(id => PAGE_ID_RE.test(id)))].slice(0, 200);
  const pages = await loadPages(ids);
  const { own, canReact } = await accessFor(viewerId, pages);
  const visible = [...own, ...canReact];
  const rows = await loadReactions(visible);
  if (rows === null) return NextResponse.json({ reactions: {}, available: false });

  const reactions = await summarize(viewerId, visible, own, rows);
  return NextResponse.json({ reactions, canReact: [...canReact], available: true });
}

// POST /api/reactions { page_id, type } — toggles the caller's reaction on a page
export async function POST(request: NextRequest) {
  const t = requestT(request);
  const viewerId = await getStudentId(request);
  if (!viewerId) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });
  if (isRateLimited(`reactions:${viewerId}`, 60, 60)) {
    return NextResponse.json({ message: t('Moc rychle — chvilku počkej.', 'Too fast — please wait a moment.') }, { status: 429 });
  }

  const body = await request.json().catch(() => ({})) as { page_id?: unknown; type?: unknown };
  const pageId = String(body.page_id ?? '');
  if (!PAGE_ID_RE.test(pageId) || !isReactionType(body.type)) {
    return NextResponse.json({ message: t('Neplatná data', 'Invalid data') }, { status: 400 });
  }
  const type = body.type;

  const pages = await loadPages([pageId]);
  const { canReact } = await accessFor(viewerId, pages);
  if (!canReact.has(pageId)) {
    return NextResponse.json({ message: t('Na tuto stránku nemůžete reagovat.', 'You cannot react to this page.') }, { status: 403 });
  }

  const existingRes = await fetch(
    `${directusUrl}/items/page_reactions?filter[page_id][_eq]=${encodeURIComponent(pageId)}&filter[student_id][_eq]=${viewerId}&filter[type][_eq]=${type}&fields=id&limit=1`,
    { headers: adminHeaders() },
  );
  if (!existingRes.ok) {
    return NextResponse.json({ message: t('Reakce zatím nejsou na serveru zapnuté.', 'Reactions are not enabled on the server yet.') }, { status: 503 });
  }
  const existing = ((await existingRes.json()) as { data?: { id: number }[] }).data?.[0];

  const res = existing
    ? await fetch(`${directusUrl}/items/page_reactions/${existing.id}`, { method: 'DELETE', headers: adminHeaders() })
    : await fetch(`${directusUrl}/items/page_reactions`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ page_id: pages[0].id, student_id: viewerId, type }),
      });
  if (!res.ok) {
    console.error('[reactions] write failed', res.status);
    return NextResponse.json({ message: t('Reakci se nepodařilo uložit.', 'Could not save the reaction.') }, { status: 502 });
  }

  const rows = (await loadReactions([pageId])) ?? [];
  const reactions = await summarize(viewerId, [pageId], new Set(), rows);
  return NextResponse.json({ reaction: reactions[pageId], active: !existing });
}
