import { NextRequest, NextResponse } from 'next/server';

// Internal Directus URL — not accessible from the browser, only from the server
const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT']);
const MAX_ITEM_BODY = 5 * 1024 * 1024;

// Paths the client SDK is allowed to access through this proxy.
// Directus's own role-based permissions apply on top of this whitelist.
const ALLOWED = [
  /^\/items\/(portfolio_pages|categories|personal_goals|dreams|dream_board_items|calendar_entries|shared_links)(\/[a-z0-9-]+)?$/,
  /^\/files(\/[0-9a-f-]+)?$/,
];

// Read-only paths — profile changes go through dedicated routes (/api/change-password …)
const READ_ONLY = [/^\/users\/me$/];

function isAllowed(path: string, method: string): boolean {
  if (READ_ONLY.some(re => re.test(path))) return method === 'GET' || method === 'HEAD';
  return ALLOWED.some(re => re.test(path));
}

async function getOwnStudentId(token: string): Promise<string | null> {
  const me = await fetch(`${directusUrl}/users/me?fields=id`, { headers: { Authorization: `Bearer ${token}` } });
  if (!me.ok) return null;
  const { data: user } = await me.json() as { data: { id: string } };
  const sr = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&fields=id&limit=1`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (!sr.ok) return null;
  const { data } = await sr.json() as { data: { id: number | string }[] };
  return data?.[0]?.id != null ? String(data[0].id) : null;
}

/**
 * Directus permission validation only sees the payload, so it cannot tell whether a
 * `student_id` belongs to the caller. Every item written through the proxy must carry
 * the caller's own student id (or none) — otherwise a pupil could create e.g. a share
 * link for a classmate's portfolio.
 */
function studentIdsAreOwn(payload: unknown, ownId: string): boolean {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && 'data' in payload && 'keys' in payload
      ? [(payload as { data: unknown }).data]            // batch update { keys, data }
      : [payload];
  return items.every(item => {
    if (!item || typeof item !== 'object' || !('student_id' in item)) return true;
    const sid = (item as { student_id: unknown }).student_id;
    return (typeof sid === 'number' || typeof sid === 'string') && String(sid) === ownId;
  });
}

async function proxyRequest(token: string | null, path: string, request: NextRequest, bodyText?: string) {
  const search = request.nextUrl.searchParams.toString();
  const url = `${directusUrl}${path}${search ? `?${search}` : ''}`;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
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

  return fetch(url, init);
}

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const path = '/' + segments.join('/');

  if (!isAllowed(path, request.method)) {
    return NextResponse.json({ message: 'Not allowed' }, { status: 403 });
  }

  // x-pp-token is set by middleware after a proactive token refresh
  const token = request.headers.get('x-pp-token')
    ?? request.cookies.get('pp_token')?.value
    ?? null;

  // Item writes: check student_id ownership before forwarding
  let bodyText: string | undefined;
  if (WRITE_METHODS.has(request.method) && path.startsWith('/items/')) {
    if (!token) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
    bodyText = await request.text();
    if (bodyText.length > MAX_ITEM_BODY) return NextResponse.json({ message: 'Příliš velký požadavek' }, { status: 413 });
    let payload: unknown;
    try { payload = JSON.parse(bodyText); } catch {
      return NextResponse.json({ message: 'Neplatná data' }, { status: 400 });
    }
    const ownId = await getOwnStudentId(token);
    if (!ownId) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
    if (!studentIdsAreOwn(payload, ownId)) {
      return NextResponse.json({ message: 'Nemáte oprávnění' }, { status: 403 });
    }
  }

  // Expired tokens are refreshed by middleware before we get here (x-pp-token)
  const upstream = await proxyRequest(token, path, request, bodyText);

  const out = new Headers();
  for (const h of ['content-type', 'content-length', 'cache-control']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE, handle as PUT };
