import { NextRequest, NextResponse } from 'next/server';
import { requestT } from '@/lib/i18n-server';

// Internal Directus URL — not accessible from the browser, only from the server
const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT']);
const MAX_ITEM_BODY = 5 * 1024 * 1024;

// Collections the client SDK may use through this proxy. Every one of them has `student_id`,
// and the proxy itself limits the caller to their own items — it does not rely on the
// Directus role permissions being configured correctly.
const OWNED_COLLECTIONS = 'portfolio_pages|categories|personal_goals|dreams|dream_board_items|calendar_entries|shared_links';
const ITEMS_RE = new RegExp(`^/items/(${OWNED_COLLECTIONS})(?:/([a-z0-9-]+))?$`);
const FILES_RE = /^\/files(?:\/([0-9a-f-]+))?$/;

// Read-only paths — profile changes go through dedicated routes (/api/student, /api/change-password …)
const READ_ONLY = [/^\/users\/me$/];

interface Caller { userId: string; studentId: string }

async function getCaller(token: string): Promise<Caller | null> {
  const me = await fetch(`${directusUrl}/users/me?fields=id`, { headers: { Authorization: `Bearer ${token}` } });
  if (!me.ok) return null;
  const { data: user } = await me.json() as { data: { id: string } };
  const sr = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&fields=id&limit=1`,
    { headers: adminHeaders() }
  );
  if (!sr.ok) return null;
  const { data } = await sr.json() as { data: { id: number | string }[] };
  return data?.[0]?.id != null ? { userId: user.id, studentId: String(data[0].id) } : null;
}

/**
 * Directus permission validation only sees the payload, so it cannot tell whether a
 * `student_id` belongs to the caller. Every item created through the proxy must carry the
 * caller's own student id; updates may only keep it unchanged.
 */
function studentIdsAreOwn(payload: unknown, ownId: string, required: boolean): boolean {
  const items = Array.isArray(payload) ? payload : [payload];
  return items.every(item => {
    if (!item || typeof item !== 'object') return false;
    if (!('student_id' in item)) return !required;
    const sid = (item as { student_id: unknown }).student_id;
    return (typeof sid === 'number' || typeof sid === 'string') && String(sid) === ownId;
  });
}

/** Turns `filter[a][b][_eq]=x` query params into `{ a: { b: { _eq: 'x' } } }`. */
function bracketFilter(params: URLSearchParams): Record<string, unknown> | null {
  let found = false;
  const root: Record<string, unknown> = {};
  for (const [key, value] of params) {
    if (!key.startsWith('filter[')) continue;
    const parts = key.slice('filter'.length).match(/\[([^\]]*)\]/g)?.map(p => p.slice(1, -1));
    if (!parts?.length) continue;
    found = true;
    let node = root;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) node[part] = value;
      else node = (node[part] ??= {}) as Record<string, unknown>;
    });
  }
  return found ? root : null;
}

/**
 * Rewrites a list query so it can only ever return the caller's own rows: the client's
 * filter (JSON or bracket form) is AND-ed with the ownership condition.
 */
function withOwnerFilter(params: URLSearchParams, ownerCondition: Record<string, unknown>): URLSearchParams | null {
  const conditions: unknown[] = [];
  const json = params.get('filter');
  if (json) {
    try { conditions.push(JSON.parse(json)); } catch { return null; }
  }
  const brackets = bracketFilter(params);
  if (brackets) conditions.push(brackets);
  conditions.push(ownerCondition);

  const out = new URLSearchParams();
  for (const [key, value] of params) {
    if (key === 'filter' || key.startsWith('filter[')) continue;
    out.append(key, value);
  }
  out.set('filter', JSON.stringify({ _and: conditions }));
  return out;
}

async function ownsItem(collection: string, id: string, studentId: string): Promise<boolean> {
  const res = await fetch(`${directusUrl}/items/${collection}/${encodeURIComponent(id)}?fields=student_id`, { headers: adminHeaders() });
  if (!res.ok) return false;
  const { data } = await res.json() as { data?: { student_id?: unknown } };
  const sid = data?.student_id;
  return sid != null && String(typeof sid === 'object' ? (sid as { id?: unknown }).id : sid) === studentId;
}

async function ownsFile(id: string, userId: string): Promise<boolean> {
  const res = await fetch(`${directusUrl}/files/${encodeURIComponent(id)}?fields=uploaded_by`, { headers: adminHeaders() });
  if (!res.ok) return false;
  const { data } = await res.json() as { data?: { uploaded_by?: string | null } };
  return !!data?.uploaded_by && data.uploaded_by === userId;
}

async function forward(token: string, path: string, query: URLSearchParams, request: NextRequest, bodyText?: string) {
  const search = query.toString();
  const url = `${directusUrl}${path}${search ? `?${search}` : ''}`;

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const ct = request.headers.get('content-type');
  // Only forward content-type for non-GET/HEAD (avoids confusing Directus on reads)
  if (ct && !['GET', 'HEAD'].includes(request.method)) headers['content-type'] = ct;

  const init: RequestInit = { method: request.method, headers };
  if (bodyText !== undefined) {
    init.body = bodyText;
  } else if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body;
    // @ts-expect-error — duplex needed for streaming body in Node.js fetch
    init.duplex = 'half';
  }

  const upstream = await fetch(url, init);
  const out = new Headers();
  for (const h of ['content-type', 'content-length', 'cache-control']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const t = requestT(request);
  const { path: segments } = await params;
  const path = '/' + segments.join('/');
  const method = request.method;
  const query = new URLSearchParams(request.nextUrl.searchParams);
  const forbidden = () => NextResponse.json({ message: t('Nemáte oprávnění', 'You do not have permission') }, { status: 403 });
  const notFound = () => NextResponse.json({ message: t('Nenalezeno', 'Not found') }, { status: 404 });

  // x-pp-token is set by middleware after a proactive token refresh
  const token = request.headers.get('x-pp-token') ?? request.cookies.get('pp_token')?.value ?? null;

  if (READ_ONLY.some(re => re.test(path))) {
    if (method !== 'GET' && method !== 'HEAD') return forbidden();
    if (!token) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });
    return forward(token, path, query, request);
  }

  const itemMatch = path.match(ITEMS_RE);
  const fileMatch = itemMatch ? null : path.match(FILES_RE);
  if (!itemMatch && !fileMatch) return NextResponse.json({ message: 'Not allowed' }, { status: 403 });

  if (!token) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });
  const caller = await getCaller(token);
  if (!caller) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });

  // ── Files ────────────────────────────────────────────────────────────────
  if (fileMatch) {
    const id = fileMatch[1];
    if (!id) {
      if (method === 'POST') return forward(token, path, query, request); // upload — Directus sets uploaded_by
      if (method !== 'GET') return forbidden();
      const scoped = withOwnerFilter(query, { uploaded_by: { _eq: caller.userId } });
      return scoped ? forward(token, path, scoped, request) : forbidden();
    }
    if (!['GET', 'PATCH', 'DELETE'].includes(method)) return forbidden();
    if (!(await ownsFile(id, caller.userId))) return notFound();
    return forward(token, path, query, request);
  }

  // ── Items ────────────────────────────────────────────────────────────────
  const [, collection, id] = itemMatch!;

  let bodyText: string | undefined;
  if (WRITE_METHODS.has(method)) {
    bodyText = await request.text();
    if (bodyText.length > MAX_ITEM_BODY) return NextResponse.json({ message: t('Příliš velký požadavek', 'Request too large') }, { status: 413 });
    let payload: unknown;
    try { payload = JSON.parse(bodyText); } catch {
      return NextResponse.json({ message: t('Neplatná data', 'Invalid data') }, { status: 400 });
    }
    // New items must name their owner; updates may not move an item to someone else
    if (!studentIdsAreOwn(payload, caller.studentId, method === 'POST')) return forbidden();
  }

  if (!id) {
    if (method === 'GET') {
      const scoped = withOwnerFilter(query, { student_id: { _eq: caller.studentId } });
      return scoped ? forward(token, path, scoped, request) : forbidden();
    }
    if (method === 'POST') return forward(token, path, query, request, bodyText);
    return forbidden(); // batch update/delete is not used by the app
  }

  if (!['GET', 'PATCH', 'DELETE'].includes(method)) return forbidden();
  if (!(await ownsItem(collection, id, caller.studentId))) return notFound();
  return forward(token, path, query, request, bodyText);
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE, handle as PUT };
