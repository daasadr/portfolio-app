import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ student: null }, { status: 401 });
  }

  const userToken = authHeader.replace('Bearer ', '');

  const meRes = await fetch(`${directusUrl}/users/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  if (!meRes.ok) {
    return NextResponse.json({ student: null }, { status: 401 });
  }

  const { data: user } = await meRes.json() as { data: { id: string } };

  const studentsRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  if (!studentsRes.ok) {
    return NextResponse.json({ student: null }, { status: 500 });
  }

  const { data } = await studentsRes.json() as { data: unknown[] };
  return NextResponse.json({ student: data?.[0] ?? null });
}
