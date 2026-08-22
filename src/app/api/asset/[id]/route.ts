import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminHeaders() {
  return { Authorization: `Bearer ${adminToken}` };
}

const UUID_RE = /^[0-9a-f-]{36}$/i;
const SHARE_TOKEN_RE = /^[a-zA-Z0-9_-]{10,}$/;

const SAFE_INLINE_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'image/avif', 'image/bmp', 'image/ico', 'image/x-icon',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
]);

async function serveAsset(id: string, request: NextRequest): Promise<NextResponse> {
  const qs = new URLSearchParams(request.nextUrl.searchParams);
  qs.delete('share');
  const queryString = qs.toString();

  const fetchHeaders: Record<string, string> = { ...adminHeaders() };
  const range = request.headers.get('range');
  if (range) fetchHeaders['range'] = range;

  const url = `${directusUrl}/assets/${id}${queryString ? `?${queryString}` : ''}`;
  const upstream = await fetch(url, { headers: fetchHeaders });

  const out = new Headers();
  for (const h of ['content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  const mimeBase = contentType.split(';')[0].trim().toLowerCase();
  out.set('content-type', contentType);
  if (!SAFE_INLINE_TYPES.has(mimeBase)) out.set('content-disposition', 'attachment');
  out.set('x-content-type-options', 'nosniff');
  out.set('content-security-policy', "default-src 'none'");

  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

// Check if fileId appears in pages accessible via a public share token
async function isAllowedByShareToken(shareToken: string, fileId: string): Promise<boolean> {
  if (!SHARE_TOKEN_RE.test(shareToken)) return false;

  const linkRes = await fetch(
    `${directusUrl}/items/shared_links?filter[share_token][_eq]=${encodeURIComponent(shareToken)}&limit=1`,
    { headers: adminHeaders() }
  );
  if (!linkRes.ok) return false;
  const { data: links } = await linkRes.json() as {
    data: {
      student_id: string;
      share_type: 'full_portfolio' | 'category' | 'single_page';
      category_id?: string;
      page_id?: string;
      expires_at?: string;
      is_active: boolean;
    }[]
  };
  const link = links?.[0];
  if (!link?.is_active) return false;
  if (link.expires_at && new Date(link.expires_at) < new Date()) return false;

  let pagesFilter: string;
  if (link.share_type === 'single_page' && link.page_id) {
    pagesFilter = `filter[id][_eq]=${link.page_id}&filter[visibility][_eq]=shared`;
  } else if (link.share_type === 'category' && link.category_id) {
    pagesFilter = `filter[student_id][_eq]=${link.student_id}&filter[visibility][_eq]=shared&filter[category_id][_eq]=${link.category_id}`;
  } else {
    pagesFilter = `filter[student_id][_eq]=${link.student_id}&filter[visibility][_eq]=shared`;
  }

  const pagesRes = await fetch(
    `${directusUrl}/items/portfolio_pages?${pagesFilter}&fields[]=attachments`,
    { headers: adminHeaders() }
  );
  if (!pagesRes.ok) return false;
  const { data: pages } = await pagesRes.json() as { data: { attachments?: unknown }[] };

  for (const page of pages ?? []) {
    const raw = page.attachments;
    const arr: { id: string }[] = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
        ? (JSON.parse(raw) as { id: string }[])
        : [];
    if (arr.some(a => a.id === fileId)) return true;
  }
  return false;
}

// Check if fileId is accessible by the authenticated user (owner or teacher)
async function isAllowedByUserToken(ppToken: string, fileId: string): Promise<boolean> {
  const [meRes, fileRes] = await Promise.all([
    fetch(`${directusUrl}/users/me`, { headers: { Authorization: `Bearer ${ppToken}` } }),
    fetch(`${directusUrl}/files/${fileId}`, { headers: adminHeaders() }),
  ]);
  if (!meRes.ok || !fileRes.ok) return false;

  const { data: user } = await meRes.json() as { data: { id: string } };
  const { data: file } = await fileRes.json() as { data: { uploaded_by: string } };

  // Direct owner match
  if (file.uploaded_by === user.id) return true;

  // Teacher path: verify user is a teacher, then check student_connection
  const teacherRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&filter[is_teacher][_eq]=true&limit=1&fields[]=id`,
    { headers: adminHeaders() }
  );
  if (!teacherRes.ok) return false;
  const { data: teachers } = await teacherRes.json() as { data: { id: number }[] };
  if (!teachers?.length) return false;
  const teacher = teachers[0];

  // Find the student record that owns the file
  const studentOwnerRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${file.uploaded_by}&limit=1&fields[]=id`,
    { headers: adminHeaders() }
  );
  if (!studentOwnerRes.ok) return false;
  const { data: studentOwners } = await studentOwnerRes.json() as { data: { id: number }[] };
  if (!studentOwners?.length) return false;

  // Check accepted teacher→student connection
  const connRes = await fetch(
    `${directusUrl}/items/student_connections?filter[teacher_id][_eq]=${teacher.id}&filter[student_id][_eq]=${studentOwners[0].id}&filter[status][_eq]=accepted&limit=1`,
    { headers: adminHeaders() }
  );
  if (!connRes.ok) return false;
  const { data: conns } = await connRes.json() as { data: unknown[] };
  return (conns?.length ?? 0) > 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) return new NextResponse('Not found', { status: 404 });

  // Path 1: Public share token
  const shareToken = request.nextUrl.searchParams.get('share');
  if (shareToken) {
    const allowed = await isAllowedByShareToken(shareToken, id);
    if (!allowed) return new NextResponse('Forbidden', { status: 403 });
    return serveAsset(id, request);
  }

  // Path 2: Authenticated user (owner or teacher with accepted connection)
  const ppToken = request.cookies.get('pp_token')?.value;
  if (ppToken) {
    const allowed = await isAllowedByUserToken(ppToken, id);
    if (!allowed) return new NextResponse('Forbidden', { status: 403 });
    return serveAsset(id, request);
  }

  return new NextResponse('Unauthorized', { status: 401 });
}
