import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-server';
import { hashAnswer, customQuestionSupported } from '@/lib/security';
import { CUSTOM_QUESTION, parseQuestionChoice } from '@/lib/security-questions';

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
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const studentId = await getStudentId(token);
  if (!studentId) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const fields = (await customQuestionSupported(directusUrl, adminToken))
    ? 'security_question,security_question_text'
    : 'security_question';
  const res = await fetch(`${directusUrl}/items/students/${studentId}?fields=${fields}`, { headers: h() });
  const { data } = await res.json() as { data: { security_question?: number; security_question_text?: string | null } };
  return NextResponse.json({
    security_question: data?.security_question ?? null,
    security_question_text: data?.security_question_text ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const studentId = await getStudentId(token);
  if (!studentId) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    security_question?: unknown; security_question_text?: unknown; security_answer?: unknown;
  };
  const choice = parseQuestionChoice(body.security_question, body.security_question_text);
  if (!choice.ok) return NextResponse.json({ message: choice.message }, { status: 400 });
  const answer = typeof body.security_answer === 'string' ? body.security_answer.trim() : '';
  if (!answer || answer.length > 200) {
    return NextResponse.json({ message: 'Vyplňte odpověď (nejvýše 200 znaků).' }, { status: 400 });
  }

  const customReady = await customQuestionSupported(directusUrl, adminToken);
  if (choice.security_question === CUSTOM_QUESTION && !customReady) {
    return NextResponse.json({ message: 'Vlastní otázku zatím nejde uložit — vyberte prosím jednu z nabízených.' }, { status: 503 });
  }

  const res = await fetch(`${directusUrl}/items/students/${studentId}`, {
    method: 'PATCH',
    headers: h(),
    body: JSON.stringify({
      security_question: choice.security_question,
      ...(customReady && { security_question_text: choice.security_question_text }),
      security_answer: await hashAnswer(answer),
    }),
  });
  if (!res.ok) return NextResponse.json({ message: 'Otázku se nepodařilo uložit.' }, { status: 502 });
  return NextResponse.json({ success: true });
}
