import { NextRequest, NextResponse } from 'next/server';
import { PREDEFINED_CATEGORIES } from '@/types';

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
  try {
    const { email, password, firstName, lastName, securityQuestion, securityAnswer, isTeacher } = await request.json() as {
      email: string; password: string; firstName: string; lastName: string;
      securityQuestion?: number; securityAnswer?: string; isTeacher?: boolean;
    };

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

    const studentRes = await fetch(`${directusUrl}/items/students`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        is_teacher: isTeacher ?? false,
        ...(securityQuestion != null && { security_question: securityQuestion }),
        ...(securityAnswer && { security_answer: securityAnswer.trim().toLowerCase() }),
      }),
    });

    if (!studentRes.ok) {
      const studentErr = await studentRes.json();
      console.error('Student creation failed:', JSON.stringify(studentErr));
      // Clean up the Directus user so the email can be re-used
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
        body: JSON.stringify({ ...cat, student_id: student.id, is_predefined: true }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Registration error:', e);
    return NextResponse.json({ message: 'Chyba serveru' }, { status: 500 });
  }
}
