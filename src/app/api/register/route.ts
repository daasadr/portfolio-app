import { NextRequest, NextResponse } from 'next/server';
import { PREDEFINED_CATEGORIES } from '@/types';
import { hashAnswer, isRateLimited, getClientIp, customQuestionSupported } from '@/lib/security';
import { CUSTOM_QUESTION, parseQuestionChoice } from '@/lib/security-questions';
import { getRequestLocale } from '@/lib/i18n-server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
const studentRoleId = process.env.DIRECTUS_STUDENT_ROLE_ID ?? 'fb459774-5562-4b35-aa90-cc51397aca23';

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };
}

export async function POST(request: NextRequest) {
  const locale = getRequestLocale(request);
  if (isRateLimited(`register-ip:${getClientIp(request)}`, 60, 3600)) {
    return NextResponse.json({ message: 'Příliš mnoho registrací. Zkuste to později.' }, { status: 429 });
  }
  try {
    // isTeacher is intentionally excluded — teacher accounts are created by admins only (C1)
    const { email, password, firstName, lastName, securityQuestion, securityQuestionText, securityAnswer } = await request.json() as {
      email: string; password: string; firstName: string; lastName: string;
      securityQuestion?: number; securityQuestionText?: string; securityAnswer?: string;
    };

    // Validate the question before creating the account, so a bad choice does not leave a half-made user
    const choice = securityQuestion != null ? parseQuestionChoice(securityQuestion, securityQuestionText, locale) : null;
    if (choice && !choice.ok) return NextResponse.json({ message: choice.message }, { status: 400 });
    const customReady = await customQuestionSupported(directusUrl, adminToken);
    if (choice?.ok && choice.security_question === CUSTOM_QUESTION && !customReady) {
      return NextResponse.json({ message: 'Vlastní otázku zatím nejde uložit — vyberte prosím jednu z nabízených.' }, { status: 503 });
    }

    const userRes = await fetch(`${directusUrl}/users`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: studentRoleId,
      }),
    });

    if (!userRes.ok) {
      const err = await userRes.json() as { errors?: { message: string; extensions?: { code: string } }[] };
      const code = err?.errors?.[0]?.extensions?.code;
      const message = err?.errors?.[0]?.message ?? 'Chyba při registraci';
      return NextResponse.json({ code, message }, { status: userRes.status });
    }

    const { data: user } = await userRes.json() as { data: { id: string } };

    // Hash security answer before storing (M3)
    const hashedAnswer = securityAnswer
      ? await hashAnswer(securityAnswer)
      : undefined;

    const studentRes = await fetch(`${directusUrl}/items/students`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        user_id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        is_teacher: false,
        ...(choice?.ok && { security_question: choice.security_question }),
        ...(choice?.ok && customReady && { security_question_text: choice.security_question_text }),
        ...(hashedAnswer && { security_answer: hashedAnswer }),
      }),
    });

    if (!studentRes.ok) {
      const studentErr = await studentRes.json();
      console.error('Student creation failed:', JSON.stringify(studentErr));
      await fetch(`${directusUrl}/users/${user.id}`, { method: 'DELETE', headers: adminHeaders() });
      return NextResponse.json({ message: 'Chyba při vytváření profilu studenta. Zkuste to znovu.' }, { status: 500 });
    }

    const { data: student } = await studentRes.json() as { data: { id: string } };
    if (!student?.id) {
      console.error('Student creation returned no id');
      await fetch(`${directusUrl}/users/${user.id}`, { method: 'DELETE', headers: adminHeaders() });
      return NextResponse.json({ message: 'Chyba při vytváření profilu.' }, { status: 500 });
    }

    for (const cat of PREDEFINED_CATEGORIES) {
      await fetch(`${directusUrl}/items/categories`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ name: cat.name[locale], sort_order: cat.sort_order, student_id: student.id, is_predefined: true }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Registration error:', e);
    return NextResponse.json({ message: 'Chyba serveru' }, { status: 500 });
  }
}
