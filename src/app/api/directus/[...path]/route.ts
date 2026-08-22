import { NextRequest, NextResponse } from 'next/server';

// Internal Directus URL — not accessible from the browser, only from the server
const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;

// Paths the client SDK is allowed to access through this proxy.
// Directus's own role-based permissions apply on top of this whitelist.
const ALLOWED = [
  /^\/items\/(portfolio_pages|categories|personal_goals|dreams|dream_board_items|calendar_entries|shared_links)(\/[a-z0-9-]+)?$/,
  /^\/users\/me$/,
  /^\/files(\/[0-9a-f-]+)?$/,
];

function isAllowed(path: string): boolean {
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

  if (!isAllowed(path)) {
    return NextResponse.json({ message: 'Not allowed' }, { status: 403 });
  }

  const token = request.cookies.get('pp_token')?.value ?? null;

  let upstream = await proxyRequest(token, path, request);

  // Auto-refresh on 401 (expired token)
  if (upstream.status === 401 && request.cookies.get('pp_refresh')?.value) {
    const refreshRes = await fetch(
      new URL('/api/auth/refresh', request.url).toString(),
      { method: 'POST', headers: { cookie: request.headers.get('cookie') ?? '' } }
    );
    if (refreshRes.ok) {
      const newToken = refreshRes.headers.get('set-cookie')?.match(/pp_token=([^;]+)/)?.[1];
      upstream = await proxyRequest(newToken ?? token, path, request);
    }
  }

  const out = new Headers();
  for (const h of ['content-type', 'content-length', 'cache-control']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE, handle as PUT };
