import { NextRequest, NextResponse } from 'next/server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

// GET /api/reset-password?email=... → returns security_question index (or 404)
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) return NextResponse.json({ message: 'Chybí email' }, { status: 400 });

  const userRes = await fetch(
    `${directusUrl}/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id`,
    { headers: adminHeaders() }
  );
  const { data: users } = await userRes.json() as { data: { id: string }[] };
  if (!users?.length) return NextResponse.json({ message: 'Účet nenalezen' }, { status: 404 });

  const userId = users[0].id;
  const studentRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${userId}`,
    { headers: adminHeaders() }
  );
  const studentBody = await studentRes.json() as { data?: { security_question?: number }[]; errors?: unknown };
  const students = studentBody.data;
  if (!students?.length) return NextResponse.json({ message: 'Účet nenalezen' }, { status: 404 });

  const q = students[0].security_question;
  if (q == null) return NextResponse.json({ message: 'Bezpečnostní otázka pro tento účet není nastavena. Kontaktujte správce.' }, { status: 400 });

  return NextResponse.json({ security_question: q });
}

// POST /api/reset-password { email, answer, newPassword }
export async function POST(request: NextRequest) {
  const { email, answer, newPassword } = await request.json() as {
    email: string; answer: string; newPassword: string;
  };

  if (!email || !answer || !newPassword) {
    return NextResponse.json({ message: 'Neúplná data' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: 'Heslo musí mít alespoň 8 znaků' }, { status: 400 });
  }

  const userRes = await fetch(
    `${directusUrl}/users?filter[email][_eq]=${encodeURIComponent(email.trim().toLowerCase())}&fields=id`,
    { headers: adminHeaders() }
  );
  const { data: users } = await userRes.json() as { data: { id: string }[] };
  if (!users?.length) return NextResponse.json({ message: 'Nesprávný email nebo odpověď' }, { status: 400 });

  const userId = users[0].id;
  const studentRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${userId}`,
    { headers: adminHeaders() }
  );
  const studentBody = await studentRes.json() as { data?: { security_answer?: string }[] };
  const students = studentBody.data;
  if (!students?.length) return NextResponse.json({ message: 'Nesprávný email nebo odpověď' }, { status: 400 });

  const storedAnswer = students[0].security_answer?.trim().toLowerCase();
  const givenAnswer = answer.trim().toLowerCase();

  if (!storedAnswer || storedAnswer !== givenAnswer) {
    return NextResponse.json({ message: 'Nesprávná odpověď na bezpečnostní otázku' }, { status: 400 });
  }

  // Reset password
  const patchRes = await fetch(`${directusUrl}/users/${userId}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ password: newPassword }),
  });

  if (!patchRes.ok) {
    return NextResponse.json({ message: 'Chyba při změně hesla' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
