import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Basic token format validation
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(token)) {
    return NextResponse.json({ message: 'Odkaz nenalezen' }, { status: 404 });
  }

  const linkRes = await fetch(
    `${directusUrl}/items/shared_links?filter[share_token][_eq]=${encodeURIComponent(token)}&limit=1`,
    { headers: adminHeaders() }
  );
  if (!linkRes.ok) return NextResponse.json({ message: 'Odkaz nenalezen' }, { status: 404 });
  const { data: links } = await linkRes.json() as {
    data: {
      id: string;
      student_id: string;
      share_type: 'full_portfolio' | 'category' | 'single_page';
      category_id?: string;
      page_id?: string;
      expires_at?: string;
      is_active: boolean;
      view_count: number;
    }[]
  };
  const link = links?.[0];
  if (!link) return NextResponse.json({ message: 'Odkaz nenalezen' }, { status: 404 });
  if (!link.is_active) return NextResponse.json({ message: 'Odkaz je neaktivní' }, { status: 403 });
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ message: 'Platnost odkazu vypršela' }, { status: 403 });
  }

  // Increment view counter asynchronously (don't await — non-critical)
  fetch(`${directusUrl}/items/shared_links/${link.id}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ view_count: link.view_count + 1 }),
  }).catch(() => {});

  const studentRes = await fetch(
    `${directusUrl}/items/students/${link.student_id}?fields=id,first_name,last_name,avatar`,
    { headers: adminHeaders() }
  );
  const { data: student } = await studentRes.json() as {
    data: { id: string; first_name: string; last_name: string; avatar?: string }
  };

  // Build pages filter — all share types enforce visibility=shared (H2)
  let pagesFilter: string;
  let categoriesFilter: string;

  if (link.share_type === 'single_page' && link.page_id) {
    // Only the specific page, and only if it's marked shared (H2 fix)
    pagesFilter = `filter[id][_eq]=${link.page_id}&filter[visibility][_eq]=shared`;
    // No categories needed for single-page view (M4 fix)
    categoriesFilter = '';
  } else if (link.share_type === 'category' && link.category_id) {
    pagesFilter = `filter[student_id][_eq]=${link.student_id}&filter[visibility][_eq]=shared&filter[category_id][_eq]=${link.category_id}`;
    // Only expose the specific category, not all student categories (M4 fix)
    categoriesFilter = `filter[id][_eq]=${link.category_id}`;
  } else {
    // full_portfolio
    pagesFilter = `filter[student_id][_eq]=${link.student_id}&filter[visibility][_eq]=shared`;
    categoriesFilter = `filter[student_id][_eq]=${link.student_id}`;
  }

  const fetches: [Promise<Response>, Promise<Response> | null] = [
    fetch(`${directusUrl}/items/portfolio_pages?${pagesFilter}&sort[]=title`, { headers: adminHeaders() }),
    categoriesFilter
      ? fetch(`${directusUrl}/items/categories?${categoriesFilter}&sort[]=name`, { headers: adminHeaders() })
      : null,
  ];

  const [pagesRes, catsRes] = await Promise.all(fetches);

  const { data: pages } = await pagesRes.json() as { data: unknown[] };
  const categories = catsRes ? (await catsRes.json() as { data: unknown[] }).data : [];

  return NextResponse.json({
    student,
    pages: pages ?? [],
    categories: categories ?? [],
    share_type: link.share_type,
  });
}
