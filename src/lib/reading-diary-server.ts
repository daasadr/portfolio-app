import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-server';

// Server-only helpers for /api/reading-diary — entries are read and written with the
// admin token, and student_id always comes from the session, never from the request body.

export const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;
export const adminHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

export const ENTRY_FIELDS = 'id,student_id,title,author,summary,opinion,notes,share_with_teacher,date_created';

export async function getStudentId(request: NextRequest): Promise<number | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const meRes = await fetch(`${directusUrl}/users/me?fields=id`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return null;
  const { data: user } = await meRes.json() as { data: { id: string } };
  const sr = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&fields=id&limit=1`,
    { headers: adminHeaders() }
  );
  if (!sr.ok) return null;
  const { data } = await sr.json() as { data: { id: number }[] };
  return data?.[0]?.id ?? null;
}

const LIMITS = { title: 200, author: 200, summary: 5000, opinion: 5000, notes: 5000 } as const;
type Field = keyof typeof LIMITS;

export interface EntryInput {
  title: string;
  author: string;
  summary: string | null;
  opinion: string | null;
  notes: string | null;
  share_with_teacher: boolean;
}

/** Validates the form body; returns the cleaned entry or a Czech error message. */
export function parseEntry(body: unknown): { entry: EntryInput } | { error: string } {
  const src = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, string | null> = {};
  for (const field of Object.keys(LIMITS) as Field[]) {
    const raw = src[field];
    if (raw != null && typeof raw !== 'string') return { error: 'Neplatná data' };
    const value = (raw ?? '').trim();
    if (value.length > LIMITS[field]) return { error: `Text je moc dlouhý (max ${LIMITS[field]} znaků)` };
    out[field] = value || null;
  }
  if (!out.title) return { error: 'Vyplň název knihy' };
  if (!out.author) return { error: 'Vyplň autora knihy' };
  // Private unless the pupil explicitly ticks "Ukázat učiteli"
  return { entry: { ...(out as unknown as Omit<EntryInput, 'share_with_teacher'>), share_with_teacher: src.share_with_teacher === true } };
}
