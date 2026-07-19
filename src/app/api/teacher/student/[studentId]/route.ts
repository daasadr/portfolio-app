import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

async function getTeacherFromToken(request: NextRequest) {
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
  const s = data?.[0] as { id: number; is_teacher: boolean } | null;
  if (!s?.is_teacher) return null;
  return s;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const teacher = await getTeacherFromToken(request);
  if (!teacher) return NextResponse.json({ message: 'Přístup odepřen' }, { status: 403 });

  // Ověř, že existuje přijaté propojení
  const connRes = await fetch(
    `${directusUrl}/items/student_connections?filter[teacher_id][_eq]=${teacher.id}&filter[student_id][_eq]=${studentId}&filter[status][_eq]=accepted&limit=1`,
    { headers: adminHeaders() }
  );
  const { data: conns } = await connRes.json() as { data: unknown[] };
  if (!conns?.length) return NextResponse.json({ message: 'Nemáte přístup k tomuto žákovi' }, { status: 403 });

  // Načti data žáka
  const [studentRes, pagesRes, catsRes] = await Promise.all([
    fetch(`${directusUrl}/items/students/${studentId}`, { headers: adminHeaders() }),
    fetch(`${directusUrl}/items/portfolio_pages?filter[student_id][_eq]=${studentId}&sort[]=title`, { headers: adminHeaders() }),
    fetch(`${directusUrl}/items/categories?filter[student_id][_eq]=${studentId}&sort[]=sort_order`, { headers: adminHeaders() }),
  ]);

  const { data: student } = await studentRes.json() as { data: unknown };
  const pagesJson = await pagesRes.json() as { data: unknown[]; errors?: unknown };
  const { data: categories } = await catsRes.json() as { data: unknown[] };

  console.log(`[teacher/student] studentId=${studentId} pages=${JSON.stringify(pagesJson).slice(0, 300)}`);

  return NextResponse.json({ student, pages: pagesJson.data ?? [], categories: categories ?? [] });
}
