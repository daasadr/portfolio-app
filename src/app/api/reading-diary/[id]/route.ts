import { NextRequest, NextResponse } from 'next/server';
import { isValidId } from '@/lib/security';
import { directusUrl, adminHeaders, ENTRY_FIELDS, getStudentId, parseEntry } from '@/lib/reading-diary-server';
import { requestT, getRequestLocale } from '@/lib/i18n-server';

type Params = { params: Promise<{ id: string }> };

/** Resolves the caller and checks they own entry `id`; returns an error response otherwise. */
async function authorize(request: NextRequest, id: string): Promise<NextResponse | null> {
  const t = requestT(request);
  if (!isValidId(id)) return NextResponse.json({ message: t('Neplatné ID', 'Invalid ID') }, { status: 400 });
  const studentId = await getStudentId(request);
  if (!studentId) return NextResponse.json({ message: t('Neautorizováno', 'Unauthorised') }, { status: 401 });

  const res = await fetch(`${directusUrl}/items/reading_diary/${id}?fields=student_id`, { headers: adminHeaders() });
  if (!res.ok) return NextResponse.json({ message: t('Záznam nenalezen', 'Entry not found') }, { status: 404 });
  const { data } = await res.json() as { data: { student_id: number | string } };
  if (String(data.student_id) !== String(studentId)) {
    return NextResponse.json({ message: t('Záznam nenalezen', 'Entry not found') }, { status: 404 });
  }
  return null;
}

// PATCH /api/reading-diary/[id] — edit my entry (date_created stays as it was)
export async function PATCH(request: NextRequest, { params }: Params) {
  const t = requestT(request);
  const { id } = await params;
  const denied = await authorize(request, id);
  if (denied) return denied;

  const parsed = parseEntry(await request.json().catch(() => null), getRequestLocale(request));
  if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

  const res = await fetch(`${directusUrl}/items/reading_diary/${id}?fields=${ENTRY_FIELDS}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(parsed.entry),
  });
  if (!res.ok) return NextResponse.json({ message: t('Chyba při ukládání', 'Error while saving') }, { status: 500 });
  const { data } = await res.json() as { data: unknown };
  return NextResponse.json({ entry: data });
}

// DELETE /api/reading-diary/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const t = requestT(request);
  const { id } = await params;
  const denied = await authorize(request, id);
  if (denied) return denied;

  const res = await fetch(`${directusUrl}/items/reading_diary/${id}`, { method: 'DELETE', headers: adminHeaders() });
  if (!res.ok) return NextResponse.json({ message: t('Chyba při mazání', 'Error while deleting') }, { status: 500 });
  return NextResponse.json({ success: true });
}
