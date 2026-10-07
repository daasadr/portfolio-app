import { NextRequest, NextResponse } from 'next/server';
import { isValidId } from '@/lib/security';
import { directusUrl, adminHeaders, ENTRY_FIELDS, getStudentId, parseEntry } from '@/lib/reading-diary-server';

type Params = { params: Promise<{ id: string }> };

/** Resolves the caller and checks they own entry `id`; returns an error response otherwise. */
async function authorize(request: NextRequest, id: string): Promise<NextResponse | null> {
  if (!isValidId(id)) return NextResponse.json({ message: 'Neplatné ID' }, { status: 400 });
  const studentId = await getStudentId(request);
  if (!studentId) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const res = await fetch(`${directusUrl}/items/reading_diary/${id}?fields=student_id`, { headers: adminHeaders() });
  if (!res.ok) return NextResponse.json({ message: 'Záznam nenalezen' }, { status: 404 });
  const { data } = await res.json() as { data: { student_id: number | string } };
  if (String(data.student_id) !== String(studentId)) {
    return NextResponse.json({ message: 'Záznam nenalezen' }, { status: 404 });
  }
  return null;
}

// PATCH /api/reading-diary/[id] — edit my entry (date_created stays as it was)
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const denied = await authorize(request, id);
  if (denied) return denied;

  const parsed = parseEntry(await request.json().catch(() => null));
  if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

  const res = await fetch(`${directusUrl}/items/reading_diary/${id}?fields=${ENTRY_FIELDS}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(parsed.entry),
  });
  if (!res.ok) return NextResponse.json({ message: 'Chyba při ukládání' }, { status: 500 });
  const { data } = await res.json() as { data: unknown };
  return NextResponse.json({ entry: data });
}

// DELETE /api/reading-diary/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const denied = await authorize(request, id);
  if (denied) return denied;

  const res = await fetch(`${directusUrl}/items/reading_diary/${id}`, { method: 'DELETE', headers: adminHeaders() });
  if (!res.ok) return NextResponse.json({ message: 'Chyba při mazání' }, { status: 500 });
  return NextResponse.json({ success: true });
}
