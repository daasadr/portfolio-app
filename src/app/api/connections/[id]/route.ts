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
  return (data?.[0] ?? null) as { id: number; is_teacher: boolean } | null;
}

// PATCH /api/connections/[id] — žák přijme propojení
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentFromToken(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const { status } = await request.json() as { status: 'accepted' | 'rejected' };

  // Ověř, že student je součástí tohoto propojení
  const connRes = await fetch(`${directusUrl}/items/student_connections/${id}`, { headers: adminHeaders() });
  if (!connRes.ok) return NextResponse.json({ message: 'Propojení nenalezeno' }, { status: 404 });
  const { data: conn } = await connRes.json() as { data: { teacher_id: number; student_id: number } };

  const isStudent = conn.student_id === student.id;
  const isTeacher = conn.teacher_id === student.id;
  if (!isStudent && !isTeacher) return NextResponse.json({ message: 'Nemáte oprávnění' }, { status: 403 });

  if (status === 'accepted' && !isStudent) {
    return NextResponse.json({ message: 'Pouze žák může přijmout propojení' }, { status: 403 });
  }

  const patchRes = await fetch(`${directusUrl}/items/student_connections/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!patchRes.ok) return NextResponse.json({ message: 'Chyba při aktualizaci' }, { status: 500 });

  const { data: updated } = await patchRes.json() as { data: unknown };
  return NextResponse.json({ connection: updated });
}

// DELETE /api/connections/[id] — odstraní propojení (může obě strany)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentFromToken(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const connRes = await fetch(`${directusUrl}/items/student_connections/${id}`, { headers: adminHeaders() });
  if (!connRes.ok) return NextResponse.json({ message: 'Propojení nenalezeno' }, { status: 404 });
  const { data: conn } = await connRes.json() as { data: { teacher_id: number; student_id: number } };

  if (conn.teacher_id !== student.id && conn.student_id !== student.id) {
    return NextResponse.json({ message: 'Nemáte oprávnění' }, { status: 403 });
  }

  await fetch(`${directusUrl}/items/student_connections/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  return NextResponse.json({ success: true });
}
