import { NextRequest, NextResponse } from 'next/server';
import { directusUrl, adminHeaders, ENTRY_FIELDS, getStudentId, parseEntry } from '@/lib/reading-diary-server';
import { requestT, getRequestLocale } from '@/lib/i18n-server';

// GET /api/reading-diary — my books, newest first
export async function GET(request: NextRequest) {
  const t = requestT(request);
  const studentId = await getStudentId(request);
  if (!studentId) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });

  const res = await fetch(
    `${directusUrl}/items/reading_diary?filter[student_id][_eq]=${studentId}&fields=${ENTRY_FIELDS}&sort[]=-date_created&limit=-1`,
    { headers: adminHeaders() }
  );
  if (!res.ok) return NextResponse.json({ message: t('Chyba při načítání deníku', 'Error while loading the diary') }, { status: 500 });
  const { data } = await res.json() as { data: unknown[] };
  return NextResponse.json({ entries: data ?? [] });
}

// POST /api/reading-diary — new book { title, author, summary, opinion, notes }
export async function POST(request: NextRequest) {
  const t = requestT(request);
  const studentId = await getStudentId(request);
  if (!studentId) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });

  const parsed = parseEntry(await request.json().catch(() => null), getRequestLocale(request));
  if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

  const res = await fetch(`${directusUrl}/items/reading_diary?fields=${ENTRY_FIELDS}`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ ...parsed.entry, student_id: studentId }),
  });
  if (!res.ok) return NextResponse.json({ message: t('Chyba při ukládání', 'Error while saving') }, { status: 500 });
  const { data } = await res.json() as { data: unknown };
  return NextResponse.json({ entry: data }, { status: 201 });
}
