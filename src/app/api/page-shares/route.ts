import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

async function getStudentFromToken(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const meRes = await fetch(`${directusUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return null;
  const { data: user } = await meRes.json() as { data: { id: string } };
  const sRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
    { headers: adminHeaders() }
  );
  if (!sRes.ok) return null;
  const { data } = await sRes.json() as { data: unknown[] };
  return (data?.[0] ?? null) as { id: number; first_name: string; last_name: string } | null;
}

// GET /api/page-shares?type=incoming|outgoing
export async function GET(request: NextRequest) {
  const student = await getStudentFromToken(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const type = request.nextUrl.searchParams.get('type') ?? 'incoming';
  const filterField = type === 'outgoing' ? 'from_id' : 'to_id';

  const sharesRes = await fetch(
    `${directusUrl}/items/page_shares?filter[${filterField}][_eq]=${student.id}&sort[]=-date_created`,
    { headers: adminHeaders() }
  );
  if (!sharesRes.ok) return NextResponse.json({ shares: [] });
  const { data: shares } = await sharesRes.json() as {
    data: { id: number; page_id: string; from_id: number; to_id: number; date_created: string }[]
  };

  if (!shares?.length) return NextResponse.json({ shares: [] });

  // Načti detaily stránek
  const pageIds = [...new Set(shares.map(s => s.page_id))];
  const pagesRes = await fetch(
    `${directusUrl}/items/portfolio_pages?filter[id][_in]=${pageIds.join(',')}&fields=id,title,content,visibility,updated_at,student_id`,
    { headers: adminHeaders() }
  );
  const { data: pages } = await pagesRes.json() as {
    data: { id: string; title: string; content?: string; visibility: string; updated_at: string; student_id: string }[]
  };
  const pagesMap = Object.fromEntries((pages ?? []).map(p => [p.id, p]));

  // Načti jména autorů a příjemců
  const personIds = [...new Set([...shares.map(s => s.from_id), ...shares.map(s => s.to_id)])];
  const personsRes = await fetch(
    `${directusUrl}/items/students?filter[id][_in]=${personIds.join(',')}&fields=id,first_name,last_name`,
    { headers: adminHeaders() }
  );
  const { data: persons } = await personsRes.json() as {
    data: { id: number; first_name: string; last_name: string }[]
  };
  const personsMap = Object.fromEntries((persons ?? []).map(p => [p.id, p]));

  const enriched = shares.map(s => ({
    ...s,
    page: pagesMap[s.page_id] ?? null,
    from: personsMap[s.from_id] ?? null,
    to: personsMap[s.to_id] ?? null,
  }));

  return NextResponse.json({ shares: enriched });
}

// POST /api/page-shares — sdílí stránku s konkrétním uživatelem
export async function POST(request: NextRequest) {
  const student = await getStudentFromToken(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const { page_id, to_id } = await request.json() as { page_id: string; to_id: number };
  if (!page_id || !to_id) return NextResponse.json({ message: 'Chybí page_id nebo to_id' }, { status: 400 });

  // Ověř, že stránka patří aktuálnímu uživateli
  const pageRes = await fetch(
    `${directusUrl}/items/portfolio_pages/${page_id}?fields=id,student_id`,
    { headers: adminHeaders() }
  );
  if (!pageRes.ok) return NextResponse.json({ message: 'Stránka nenalezena' }, { status: 404 });
  const { data: page } = await pageRes.json() as { data: { id: string; student_id: string } };
  if (String(page.student_id) !== String(student.id)) {
    return NextResponse.json({ message: 'Nemáte oprávnění sdílet tuto stránku' }, { status: 403 });
  }

  // Zkontroluj duplicitu
  const dupRes = await fetch(
    `${directusUrl}/items/page_shares?filter[page_id][_eq]=${page_id}&filter[from_id][_eq]=${student.id}&filter[to_id][_eq]=${to_id}&limit=1`,
    { headers: adminHeaders() }
  );
  const { data: dup } = await dupRes.json() as { data: unknown[] };
  if (dup?.length) return NextResponse.json({ message: 'Stránka je již sdílena s tímto uživatelem' }, { status: 409 });

  const createRes = await fetch(`${directusUrl}/items/page_shares`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ page_id, from_id: student.id, to_id }),
  });
  if (!createRes.ok) return NextResponse.json({ message: 'Chyba při sdílení' }, { status: 500 });

  const { data: created } = await createRes.json() as { data: unknown };
  return NextResponse.json({ share: created });
}
