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
  return (data?.[0] ?? null) as { id: number } | null;
}

// GET /api/groups?search=&all=1&org=orgId
export async function GET(request: NextRequest) {
  const student = await getStudent(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const search = request.nextUrl.searchParams.get('search') ?? '';
  const all = request.nextUrl.searchParams.get('all') === '1';
  const orgId = request.nextUrl.searchParams.get('org');

  if (all) {
    let url = `${directusUrl}/items/groups?sort[]=name&limit=50`;
    if (search) url += `&filter[name][_icontains]=${encodeURIComponent(search)}`;
    if (orgId) url += `&filter[organisation_id][_eq]=${orgId}`;
    const res = await fetch(url, { headers: h() });
    const { data } = await res.json() as { data: unknown[] };
    return NextResponse.json({ groups: data ?? [] });
  }

  // Moje skupiny
  const memRes = await fetch(
    `${directusUrl}/items/group_members?filter[student_id][_eq]=${student.id}&fields=group_id,role`,
    { headers: h() }
  );
  const { data: memberships } = await memRes.json() as { data: { group_id: number; role: string }[] };
  if (!memberships?.length) return NextResponse.json({ groups: [] });

  const ids = memberships.map(m => m.group_id).join(',');
  const groupRes = await fetch(`${directusUrl}/items/groups?filter[id][_in]=${ids}&sort[]=name`, { headers: h() });
  const { data: groups } = await groupRes.json() as {
    data: { id: number; name: string; description?: string; organisation_id?: number; created_by: number; created_at: string }[]
  };

  const roleMap = Object.fromEntries(memberships.map(m => [m.group_id, m.role]));

  // Načti názvy organizací
  const orgIds = [...new Set((groups ?? []).filter(g => g.organisation_id).map(g => g.organisation_id!))];
  let orgMap: Record<number, string> = {};
  if (orgIds.length) {
    const orgRes = await fetch(`${directusUrl}/items/organisations?filter[id][_in]=${orgIds.join(',')}&fields=id,name`, { headers: h() });
    const { data: orgs } = await orgRes.json() as { data: { id: number; name: string }[] };
    orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]));
  }

  const enriched = (groups ?? []).map(g => ({
    ...g,
    my_role: roleMap[g.id] ?? 'member',
    organisation_name: g.organisation_id ? orgMap[g.organisation_id] : undefined,
  }));

  return NextResponse.json({ groups: enriched });
}

// POST /api/groups
export async function POST(request: NextRequest) {
  const student = await getStudent(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const { name, description, organisation_id } = await request.json() as {
    name: string; description?: string; organisation_id?: number;
  };
  if (!name?.trim()) return NextResponse.json({ message: 'Název je povinný' }, { status: 400 });

  const createRes = await fetch(`${directusUrl}/items/groups`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({
      name: name.trim(),
      description: description?.trim() || null,
      organisation_id: organisation_id ?? null,
      created_by: student.id,
    }),
  });
  if (!createRes.ok) return NextResponse.json({ message: 'Chyba při vytváření' }, { status: 500 });
  const { data: group } = await createRes.json() as { data: { id: number } };

  await fetch(`${directusUrl}/items/group_members`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({ group_id: group.id, student_id: student.id, role: 'admin' }),
  });

  return NextResponse.json({ group: { ...group, my_role: 'admin', member_count: 1 } });
}
