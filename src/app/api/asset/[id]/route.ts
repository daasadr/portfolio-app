import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const search = request.nextUrl.searchParams.toString();
  const url = `${directusUrl}/assets/${id}${search ? `?${search}` : ''}`;

  const fetchHeaders: Record<string, string> = {};
  const range = request.headers.get('range');
  if (range) fetchHeaders['range'] = range;

  const upstream = await fetch(url, { headers: fetchHeaders });

  const out = new Headers();
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}
