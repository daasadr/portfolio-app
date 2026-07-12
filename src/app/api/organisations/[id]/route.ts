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

// POST /api/organisations/[id] → připojit se
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  // Zkontroluj duplicitu
  const dup = await fetch(
    `${directusUrl}/items/organisation_members?filter[organisation_id][_eq]=${id}&filter[student_id][_eq]=${student.id}&limit=1`,
    { headers: h() }
  );
  const { data: existing } = await dup.json() as { data: unknown[] };
  if (existing?.length) return NextResponse.json({ message: 'Již jste členem' }, { status: 409 });

  await fetch(`${directusUrl}/items/organisation_members`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({ organisation_id: Number(id), student_id: student.id, role: 'member' }),
  });
  return NextResponse.json({ success: true });
}

// DELETE /api/organisations/[id] → odejít nebo smazat (admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const action = new URL(request.url).searchParams.get('action');

  if (action === 'delete') {
    // Smazat celou organizaci (jen admin)
    const memRes = await fetch(
      `${directusUrl}/items/organisation_members?filter[organisation_id][_eq]=${id}&filter[student_id][_eq]=${student.id}&fields=role&limit=1`,
      { headers: h() }
    );
    const { data: mem } = await memRes.json() as { data: { role: string }[] };
    if (mem?.[0]?.role !== 'admin') return NextResponse.json({ message: 'Jen admin může smazat organizaci' }, { status: 403 });

    // Smaž členy a organizaci
    await fetch(`${directusUrl}/items/organisation_members?filter[organisation_id][_eq]=${id}`, { method: 'DELETE', headers: h() });
    await fetch(`${directusUrl}/items/organisations/${id}`, { method: 'DELETE', headers: h() });
  } else {
    // Odejít
    const memRes = await fetch(
      `${directusUrl}/items/organisation_members?filter[organisation_id][_eq]=${id}&filter[student_id][_eq]=${student.id}&fields=id,role&limit=1`,
      { headers: h() }
    );
    const { data: mem } = await memRes.json() as { data: { id: number; role: string }[] };
    if (!mem?.length) return NextResponse.json({ message: 'Nejste členem' }, { status: 404 });
    await fetch(`${directusUrl}/items/organisation_members/${mem[0].id}`, { method: 'DELETE', headers: h() });
  }

  return NextResponse.json({ success: true });
}
