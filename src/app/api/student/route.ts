import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

export async function GET(request: NextRequest) {
  try {
    console.log('[api/student] directusUrl:', directusUrl);
    console.log('[api/student] adminToken set:', !!adminToken);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ student: null }, { status: 401 });
    }

    const userToken = authHeader.replace('Bearer ', '');

    const meRes = await fetch(`${directusUrl}/users/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (!meRes.ok) {
      const body = await meRes.text();
      console.error('[api/student] /users/me failed:', meRes.status, body);
      return NextResponse.json({ student: null }, { status: 401 });
    }

    const { data: user } = await meRes.json() as { data: { id: string } };
    console.log('[api/student] user.id:', user?.id);

    const studentsRes = await fetch(
      `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (!studentsRes.ok) {
      const body = await studentsRes.text();
      console.error('[api/student] /items/students failed:', studentsRes.status, body);
      return NextResponse.json({ student: null }, { status: 500 });
    }

    const { data } = await studentsRes.json() as { data: unknown[] };
    console.log('[api/student] student found:', !!data?.[0]);
    return NextResponse.json({ student: data?.[0] ?? null });
  } catch (e) {
    console.error('[api/student] unexpected error:', e);
    return NextResponse.json({ student: null }, { status: 500 });
  }
}
