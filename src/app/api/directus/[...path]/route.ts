import { NextRequest, NextResponse } from 'next/server';

// Internal Directus URL — not accessible from the browser, only from the server
const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;

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

async function proxyRequest(token: string | null, path: string, request: NextRequest) {
  const search = request.nextUrl.searchParams.toString();
  const url = `${directusUrl}${path}${search ? `?${search}` : ''}`;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const ct = request.headers.get('content-type');
  // Only forward content-type for non-GET/HEAD (avoids confusing Directus on reads)
  if (ct && !['GET', 'HEAD'].includes(request.method)) headers['content-type'] = ct;

  const init: RequestInit = { method: request.method, headers };
  if (!['GET', 'HEAD'].includes(request.method)) {
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

  // Expired tokens are refreshed by middleware before we get here (x-pp-token)
  const upstream = await proxyRequest(token, path, request);

  const out = new Headers();
  for (const h of ['content-type', 'content-length', 'cache-control']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE, handle as PUT };
