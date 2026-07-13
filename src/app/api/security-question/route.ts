import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

async function getStudentId(token: string): Promise<string | null> {
  const meRes = await fetch(`${directusUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return null;
  const { data: user } = await meRes.json() as { data: { id: string } };
  const sr = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
    { headers: h() }
  );
  if (!sr.ok) return null;
  const { data } = await sr.json() as { data: { id: string }[] };
  return data?.[0]?.id ?? null;
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const studentId = await getStudentId(auth.replace('Bearer ', ''));
  if (!studentId) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const res = await fetch(
    `${directusUrl}/items/students/${studentId}?fields=security_question`,
    { headers: h() }
  );
  const { data } = await res.json() as { data: { security_question?: number } };
  return NextResponse.json({ security_question: data?.security_question ?? null });
}

export async function PATCH(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const studentId = await getStudentId(auth.replace('Bearer ', ''));
  if (!studentId) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const { security_question, security_answer } = await request.json() as {
    security_question: number; security_answer: string;
  };
  if (security_question == null || !security_answer?.trim()) {
    return NextResponse.json({ message: 'Neúplná data' }, { status: 400 });
  }

  await fetch(`${directusUrl}/items/students/${studentId}`, {
    method: 'PATCH',
    headers: h(),
    body: JSON.stringify({
      security_question,
      security_answer: security_answer.trim().toLowerCase(),
    }),
  });
  return NextResponse.json({ success: true });
}
