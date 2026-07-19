import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Najdi share link
  const linkRes = await fetch(
    `${directusUrl}/items/shared_links?filter[share_token][_eq]=${token}&limit=1`,
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

  // Navýš view_count
  await fetch(`${directusUrl}/items/shared_links/${link.id}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ view_count: link.view_count + 1 }),
  });

  // Načti data studenta
  const studentRes = await fetch(
    `${directusUrl}/items/students/${link.student_id}?fields=id,first_name,last_name,avatar`,
    { headers: adminHeaders() }
  );
  const { data: student } = await studentRes.json() as {
    data: { id: string; first_name: string; last_name: string; avatar?: string }
  };

  // Sestav filter pro stránky
  let pagesFilter = `filter[student_id][_eq]=${link.student_id}&filter[visibility][_eq]=shared`;
  if (link.share_type === 'single_page' && link.page_id) {
    pagesFilter = `filter[id][_eq]=${link.page_id}`;
  } else if (link.share_type === 'category' && link.category_id) {
    pagesFilter += `&filter[category_id][_eq]=${link.category_id}`;
  }

  const [pagesRes, catsRes] = await Promise.all([
    fetch(`${directusUrl}/items/portfolio_pages?${pagesFilter}&sort[]=sort_order&sort[]=title`, { headers: adminHeaders() }),
    fetch(`${directusUrl}/items/categories?filter[student_id][_eq]=${link.student_id}&sort[]=sort_order`, { headers: adminHeaders() }),
  ]);

  const { data: pages } = await pagesRes.json() as { data: unknown[] };
  const { data: categories } = await catsRes.json() as { data: unknown[] };

  return NextResponse.json({
    student,
    pages: pages ?? [],
    categories: categories ?? [],
    share_type: link.share_type,
  });
}
