import 'server-only';
import { directusUrl, adminHeaders } from '@/lib/reading-diary-server';
import { REACTION_TYPES, emptyCounts, type PageReactionSummary, type ReactionType } from '@/lib/reactions';

// Server-only helpers for /api/reactions. Reactions are read and written with the admin token;
// who may react is decided here, never by the client.

export const PAGE_ID_RE = /^[0-9a-z-]{1,36}$/i;

interface PageRow { id: string | number; student_id: string | number; visibility: string; title?: string }

export async function loadPages(ids: string[]): Promise<PageRow[]> {
  if (ids.length === 0) return [];
  const res = await fetch(
    `${directusUrl}/items/portfolio_pages?filter[id][_in]=${ids.map(encodeURIComponent).join(',')}&fields=id,student_id,visibility,title&limit=-1`,
    { headers: adminHeaders() },
  );
  if (!res.ok) return [];
  return ((await res.json()) as { data?: PageRow[] }).data ?? [];
}

/** People connected to `viewerId` by an accepted connection (in either direction). */
async function connectedIds(viewerId: number): Promise<Set<string>> {
  const res = await fetch(
    `${directusUrl}/items/student_connections?filter[_or][0][teacher_id][_eq]=${viewerId}&filter[_or][1][student_id][_eq]=${viewerId}&filter[status][_eq]=accepted&fields=teacher_id,student_id&limit=-1`,
    { headers: adminHeaders() },
  );
  if (!res.ok) return new Set();
  const { data } = await res.json() as { data?: { teacher_id: number; student_id: number }[] };
  return new Set((data ?? []).map(c => String(String(c.teacher_id) === String(viewerId) ? c.student_id : c.teacher_id)));
}

/** Page ids shared directly with `viewerId` (page_shares). */
async function sharedWithMe(viewerId: number, pageIds: string[]): Promise<Set<string>> {
  if (pageIds.length === 0) return new Set();
  const res = await fetch(
    `${directusUrl}/items/page_shares?filter[to_id][_eq]=${viewerId}&filter[page_id][_in]=${pageIds.map(encodeURIComponent).join(',')}&fields=page_id&limit=-1`,
    { headers: adminHeaders() },
  );
  if (!res.ok) return new Set();
  const { data } = await res.json() as { data?: { page_id: string | number }[] };
  return new Set((data ?? []).map(s => String(s.page_id)));
}

/**
 * Which of `pages` the viewer may see reactions on, and which they may react to.
 * The owner sees reactions on all own pages but does not react to them. Others may react
 * only to pages they can actually see: shared pages of someone they are connected with,
 * or a page shared with them directly. Private pages stay private.
 */
export async function accessFor(viewerId: number, pages: PageRow[]) {
  const others = pages.filter(p => String(p.student_id) !== String(viewerId));
  const [connected, direct] = others.length
    ? await Promise.all([connectedIds(viewerId), sharedWithMe(viewerId, others.map(p => String(p.id)))])
    : [new Set<string>(), new Set<string>()];
  const own = new Set<string>();
  const canReact = new Set<string>();
  for (const p of pages) {
    const id = String(p.id);
    if (String(p.student_id) === String(viewerId)) own.add(id);
    else if ((p.visibility === 'shared' && connected.has(String(p.student_id))) || direct.has(id)) canReact.add(id);
  }
  return { own, canReact };
}

interface ReactionRow { id: number; page_id: string | number; student_id: number; type: string; date_created?: string }

/** All reactions on the given pages; `null` when the collection does not exist yet. */
export async function loadReactions(pageIds: string[]): Promise<ReactionRow[] | null> {
  if (pageIds.length === 0) return [];
  const res = await fetch(
    `${directusUrl}/items/page_reactions?filter[page_id][_in]=${pageIds.map(encodeURIComponent).join(',')}&fields=id,page_id,student_id,type,date_created&sort[]=date_created&limit=-1`,
    { headers: adminHeaders() },
  );
  if (!res.ok) return null;
  return ((await res.json()) as { data?: ReactionRow[] }).data ?? [];
}

export async function loadPeople(ids: (string | number)[]) {
  const unique = [...new Set(ids.map(String))];
  if (unique.length === 0) return new Map<string, { name: string; is_teacher: boolean }>();
  const res = await fetch(
    `${directusUrl}/items/students?filter[id][_in]=${unique.join(',')}&fields=id,first_name,last_name,is_teacher&limit=-1`,
    { headers: adminHeaders() },
  );
  const rows = res.ok ? (((await res.json()) as { data?: { id: number; first_name: string; last_name: string; is_teacher: boolean }[] }).data ?? []) : [];
  return new Map(rows.map(r => [String(r.id), { name: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(), is_teacher: !!r.is_teacher }]));
}

/** Builds the per-page summary the viewer is allowed to see. */
export async function summarize(viewerId: number, pageIds: string[], own: Set<string>, rows: ReactionRow[]) {
  const people = await loadPeople(rows.filter(r => own.has(String(r.page_id))).map(r => r.student_id));
  const out: Record<string, PageReactionSummary> = {};
  for (const id of pageIds) out[id] = { counts: emptyCounts(), mine: [], ...(own.has(id) ? { people: [] } : {}) };
  const seen = new Set<string>(); // a double click can race into two identical rows — count them once
  for (const r of rows) {
    const s = out[String(r.page_id)];
    if (!s || !(REACTION_TYPES as readonly string[]).includes(r.type)) continue;
    const key = `${r.page_id}:${r.student_id}:${r.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const type = r.type as ReactionType;
    s.counts[type]++;
    if (String(r.student_id) === String(viewerId)) s.mine.push(type);
    const person = people.get(String(r.student_id));
    if (s.people && person) s.people.push({ name: person.name, type, is_teacher: person.is_teacher });
  }
  return out;
}
