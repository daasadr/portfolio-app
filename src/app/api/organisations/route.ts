import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

async function getStudent(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const me = await fetch(`${directusUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!me.ok) return null;
  const { data: user } = await me.json() as { data: { id: string } };
  const sr = await fetch(`${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`, { headers: h() });
  if (!sr.ok) return null;
  const { data } = await sr.json() as { data: unknown[] };
  return (data?.[0] ?? null) as { id: number; first_name: string; last_name: string } | null;
}

// GET /api/organisations?search=&all=1
// all=1 → všechny organizace (pro hledání), jinak jen moje
export async function GET(request: NextRequest) {
  const student = await getStudent(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const search = request.nextUrl.searchParams.get('search') ?? '';
  const all = request.nextUrl.searchParams.get('all') === '1';

  if (all) {
    const url = search
      ? `${directusUrl}/items/organisations?filter[name][_icontains]=${encodeURIComponent(search)}&sort[]=name`
      : `${directusUrl}/items/organisations?sort[]=name&limit=50`;
    const res = await fetch(url, { headers: h() });
    const { data } = await res.json() as { data: unknown[] };
    return NextResponse.json({ organisations: data ?? [] });
  }

  // Moje organizace (přes organisation_members)
  const memRes = await fetch(
    `${directusUrl}/items/organisation_members?filter[student_id][_eq]=${student.id}&fields=organisation_id,role`,
    { headers: h() }
  );
  const { data: memberships } = await memRes.json() as { data: { organisation_id: number; role: string }[] };
  if (!memberships?.length) return NextResponse.json({ organisations: [] });

  const ids = memberships.map(m => m.organisation_id).join(',');
  const orgRes = await fetch(`${directusUrl}/items/organisations?filter[id][_in]=${ids}&sort[]=name`, { headers: h() });
  const { data: orgs } = await orgRes.json() as { data: { id: number; name: string; description?: string; created_by: number; created_at: string }[] };

  // Přidej roli a počet členů
  const memberCountRes = await fetch(
    `${directusUrl}/items/organisation_members?groupBy[]=organisation_id&aggregate[count]=id&filter[organisation_id][_in]=${ids}`,
    { headers: h() }
  );
  const { data: counts } = await memberCountRes.json() as { data: { organisation_id: number; count: { id: number } }[] };
  const countMap = Object.fromEntries((counts ?? []).map(c => [c.organisation_id, c.count?.id ?? 0]));
  const roleMap = Object.fromEntries(memberships.map(m => [m.organisation_id, m.role]));

  const enriched = (orgs ?? []).map(o => ({
    ...o,
    my_role: roleMap[o.id] ?? 'member',
    member_count: countMap[o.id] ?? 1,
  }));

  return NextResponse.json({ organisations: enriched });
}

// POST /api/organisations — vytvoří organizaci (a přidá tvůrce jako admin)
export async function POST(request: NextRequest) {
  const student = await getStudent(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const { name, description } = await request.json() as { name: string; description?: string };
  if (!name?.trim()) return NextResponse.json({ message: 'Název je povinný' }, { status: 400 });

  const createRes = await fetch(`${directusUrl}/items/organisations`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({ name: name.trim(), description: description?.trim() || null, created_by: student.id }),
  });
  if (!createRes.ok) return NextResponse.json({ message: 'Chyba při vytváření' }, { status: 500 });
  const { data: org } = await createRes.json() as { data: { id: number } };

  // Auto-join jako admin
  await fetch(`${directusUrl}/items/organisation_members`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({ organisation_id: org.id, student_id: student.id, role: 'admin' }),
  });

  return NextResponse.json({ organisation: { ...org, my_role: 'admin', member_count: 1 } });
}
