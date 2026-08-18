import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL!;

// Types that are safe to serve inline (browser renders them natively without XSS risk)
const SAFE_INLINE_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'image/avif', 'image/bmp', 'image/ico', 'image/x-icon',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Basic UUID validation to prevent path traversal
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const search = request.nextUrl.searchParams.toString();
  const url = `${directusUrl}/assets/${id}${search ? `?${search}` : ''}`;

  const fetchHeaders: Record<string, string> = {};
  const range = request.headers.get('range');
  if (range) fetchHeaders['range'] = range;

  const upstream = await fetch(url, { headers: fetchHeaders });

  const out = new Headers();
  for (const h of ['content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  // Normalise to the MIME part only (strip charset/params for the check)
  const mimeBase = contentType.split(';')[0].trim().toLowerCase();
  out.set('content-type', contentType);

  // Prevent inline execution of dangerous types: SVG, HTML, JS, XML, etc. (C3/M6)
  if (!SAFE_INLINE_TYPES.has(mimeBase)) {
    out.set('content-disposition', 'attachment');
  }

  // Prevent MIME sniffing attacks
  out.set('x-content-type-options', 'nosniff');
  // Isolate asset content from the main app origin
  out.set('content-security-policy', "default-src 'none'");

  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}
