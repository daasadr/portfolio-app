import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, verifyAnswer, hashAnswer, getClientIp } from '@/lib/security';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

// GET /api/reset-password?email=...
// Always returns 200 to prevent email enumeration (M1).
// Returns { security_question: number | null } — null when account not found or no question set.
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`reset-get:${ip}`, 10, 900)) {
    return NextResponse.json({ security_question: null }, { status: 200 });
  }

  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) return NextResponse.json({ security_question: null }, { status: 200 });

  const userRes = await fetch(
    `${directusUrl}/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id`,
    { headers: adminHeaders() }
  );
  const { data: users } = await userRes.json() as { data: { id: string }[] };
  if (!users?.length) return NextResponse.json({ security_question: null }, { status: 200 });

  const userId = users[0].id;
  const studentRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${userId}`,
    { headers: adminHeaders() }
  );
  const studentBody = await studentRes.json() as { data?: { security_question?: number }[] };
  const students = studentBody.data;
  if (!students?.length) return NextResponse.json({ security_question: null }, { status: 200 });

  const q = students[0].security_question;
  return NextResponse.json({ security_question: q ?? null });
}

// POST /api/reset-password { email, answer, newPassword }
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`reset-post:${ip}`, 5, 900)) {
    return NextResponse.json({ message: 'Příliš mnoho pokusů. Zkuste to za 15 minut.' }, { status: 429 });
  }

  const { email, answer, newPassword } = await request.json() as {
    email: string; answer: string; newPassword: string;
  };

  if (!email || !answer || !newPassword) {
    return NextResponse.json({ message: 'Neúplná data' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: 'Heslo musí mít alespoň 8 znaků' }, { status: 400 });
  }
  // Per-account limit — IP limit alone can be shared/rotated
  if (isRateLimited(`reset-post-email:${email.trim().toLowerCase()}`, 5, 900)) {
    return NextResponse.json({ message: 'Příliš mnoho pokusů. Zkuste to za 15 minut.' }, { status: 429 });
  }

  const userRes = await fetch(
    `${directusUrl}/users?filter[email][_eq]=${encodeURIComponent(email.trim().toLowerCase())}&fields=id`,
    { headers: adminHeaders() }
  );
  const { data: users } = await userRes.json() as { data: { id: string }[] };

  // Always return same error to prevent enumeration
  const genericError = NextResponse.json({ message: 'Nesprávný email nebo odpověď' }, { status: 400 });

  if (!users?.length) return genericError;

  const userId = users[0].id;
  const studentRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${userId}`,
    { headers: adminHeaders() }
  );
  const studentBody = await studentRes.json() as { data?: { id: number; security_answer?: string }[] };
  const students = studentBody.data;
  if (!students?.length) return genericError;

  const storedAnswer = students[0].security_answer;
  if (!storedAnswer) return genericError;

  const correct = await verifyAnswer(answer, storedAnswer);
  if (!correct) return genericError;

  // Legacy plaintext answer → store hashed from now on
  if (!storedAnswer.startsWith('scrypt:')) {
    await fetch(`${directusUrl}/items/students/${students[0].id}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ security_answer: await hashAnswer(answer) }),
    });
  }

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
