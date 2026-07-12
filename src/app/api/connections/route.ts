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

  const meRes = await fetch(`${directusUrl}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) return null;
  const { data: user } = await meRes.json() as { data: { id: string } };

  const sRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
    { headers: adminHeaders() }
  );
  if (!sRes.ok) return null;
  const { data } = await sRes.json() as { data: unknown[] };
  return (data?.[0] ?? null) as { id: number; first_name: string; last_name: string; is_teacher: boolean } | null;
}

// GET /api/connections — vrátí propojení přihlášeného uživatele
export async function GET(request: NextRequest) {
  const student = await getStudentFromToken(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const isTeacher = student.is_teacher;
  const filterField = isTeacher ? 'teacher_id' : 'student_id';

  const connRes = await fetch(
    `${directusUrl}/items/student_connections?filter[${filterField}][_eq]=${student.id}&sort[]=-created_at`,
    { headers: adminHeaders() }
  );
  const { data: connections } = await connRes.json() as {
    data: { id: number; teacher_id: number; student_id: number; status: string; created_at: string }[]
  };

  if (!connections?.length) return NextResponse.json({ connections: [] });

  // Načti jména druhé strany
  const otherIds = connections.map(c => isTeacher ? c.student_id : c.teacher_id);
  const uniqueIds = [...new Set(otherIds)];
  const studentsRes = await fetch(
    `${directusUrl}/items/students?filter[id][_in]=${uniqueIds.join(',')}&fields=id,first_name,last_name`,
    { headers: adminHeaders() }
  );
  const { data: others } = await studentsRes.json() as {
    data: { id: number; first_name: string; last_name: string }[]
  };
  const othersMap = Object.fromEntries((others ?? []).map(s => [s.id, s]));

  const enriched = connections.map(c => ({
    ...c,
    other_person: othersMap[isTeacher ? c.student_id : c.teacher_id] ?? null,
  }));

  return NextResponse.json({ connections: enriched, is_teacher: isTeacher });
}

// POST /api/connections — učitel připojí žáka podle emailu
export async function POST(request: NextRequest) {
  const student = await getStudentFromToken(request);
  if (!student) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  if (!student.is_teacher) return NextResponse.json({ message: 'Pouze učitelé mohou přidávat žáky' }, { status: 403 });

  const { targetEmail } = await request.json() as { targetEmail: string };
  if (!targetEmail) return NextResponse.json({ message: 'Chybí email žáka' }, { status: 400 });

  // Najdi uživatele podle emailu
  const userRes = await fetch(
    `${directusUrl}/users?filter[email][_eq]=${encodeURIComponent(targetEmail.trim().toLowerCase())}&fields=id`,
    { headers: adminHeaders() }
  );
  const { data: users } = await userRes.json() as { data: { id: string }[] };
  if (!users?.length) return NextResponse.json({ message: 'Žák s tímto emailem nebyl nalezen' }, { status: 404 });

  // Najdi student záznam
  const targetSRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${users[0].id}&limit=1&fields=id,is_teacher`,
    { headers: adminHeaders() }
  );
  const { data: targetStudents } = await targetSRes.json() as {
    data: { id: number; is_teacher: boolean }[]
  };
  if (!targetStudents?.length) return NextResponse.json({ message: 'Žák nenalezen' }, { status: 404 });
  if (targetStudents[0].is_teacher) return NextResponse.json({ message: 'Tento účet je učitelský, nelze přidat jako žáka' }, { status: 400 });

  const targetId = targetStudents[0].id;

  // Zkontroluj duplicitu
  const dupRes = await fetch(
    `${directusUrl}/items/student_connections?filter[teacher_id][_eq]=${student.id}&filter[student_id][_eq]=${targetId}&limit=1`,
    { headers: adminHeaders() }
  );
  const { data: dup } = await dupRes.json() as { data: unknown[] };
  if (dup?.length) return NextResponse.json({ message: 'Toto propojení již existuje' }, { status: 409 });

  // Vytvoř propojení
  const createRes = await fetch(`${directusUrl}/items/student_connections`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      teacher_id: student.id,
      student_id: targetId,
      status: 'pending',
    }),
  });
  if (!createRes.ok) return NextResponse.json({ message: 'Chyba při vytváření propojení' }, { status: 500 });

  const { data: created } = await createRes.json() as { data: unknown };
  return NextResponse.json({ connection: created });
}
