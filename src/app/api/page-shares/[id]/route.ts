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
  return (data?.[0] ?? null) as { id: number } | null;
}

// DELETE /api/page-shares/[id] — odesílatel nebo příjemce může zrušit sdílení
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentFromToken(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const shareRes = await fetch(`${directusUrl}/items/page_shares/${id}`, { headers: adminHeaders() });
  if (!shareRes.ok) return NextResponse.json({ message: 'Sdílení nenalezeno' }, { status: 404 });
  const { data: share } = await shareRes.json() as { data: { id: number; from_id: number; to_id: number } };

  if (share.from_id !== student.id && share.to_id !== student.id) {
    return NextResponse.json({ message: 'Přístup odepřen' }, { status: 403 });
  }

  await fetch(`${directusUrl}/items/page_shares/${id}`, { method: 'DELETE', headers: adminHeaders() });
  return NextResponse.json({ ok: true });
}
