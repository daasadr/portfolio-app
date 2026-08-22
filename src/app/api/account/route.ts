import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-server';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

async function getStudentForRequest(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const meRes = await fetch(`${directusUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return null;
  const { data: user } = await meRes.json() as { data: { id: string } };
  const sRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
    { headers: adminHeaders() }
  );
  if (!sRes.ok) return null;
  const { data } = await sRes.json() as { data: { id: number; user_id: string }[] };
  const student = data?.[0];
  if (!student) return null;
  return { student, userId: user.id };
}

// GET /api/account — export všech dat uživatele (GDPR čl. 20)
export async function GET(request: NextRequest) {
  const ctx = await getStudentForRequest(request);
  if (!ctx) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const { student, userId } = ctx;

  const [userRes, pagesRes, catsRes] = await Promise.all([
    fetch(`${directusUrl}/users/${userId}?fields=email,first_name,last_name`, { headers: adminHeaders() }),
    fetch(`${directusUrl}/items/portfolio_pages?filter[student_id][_eq]=${student.id}&limit=500`, { headers: adminHeaders() }),
    fetch(`${directusUrl}/items/categories?filter[student_id][_eq]=${student.id}&limit=200`, { headers: adminHeaders() }),
  ]);

  const { data: user } = await userRes.json() as { data: { email: string; first_name: string; last_name: string } };
  const { data: pages } = await pagesRes.json() as { data: unknown[] };
  const { data: categories } = await catsRes.json() as { data: unknown[] };

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      date_of_birth: (student as { date_of_birth?: string }).date_of_birth ?? null,
    },
    categories: categories ?? [],
    portfolio_pages: pages ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="portfolio-paradise-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

// DELETE /api/account — smaže celý účet a všechna data (GDPR čl. 17)
export async function DELETE(request: NextRequest) {
  const ctx = await getStudentForRequest(request);
  if (!ctx) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const { student, userId } = ctx;

  const sid = student.id;

  // Smazat data v pořadí (od závislých k nadřazeným)
  await Promise.allSettled([
    fetch(`${directusUrl}/items/portfolio_pages?filter[student_id][_eq]=${sid}`, { headers: adminHeaders() })
      .then(r => r.json() as Promise<{ data: { id: number }[] }>)
      .then(({ data }) => Promise.all(
        (data ?? []).map(p => fetch(`${directusUrl}/items/portfolio_pages/${p.id}`, { method: 'DELETE', headers: adminHeaders() }))
      )),
    fetch(`${directusUrl}/items/shared_links?filter[student_id][_eq]=${sid}`, { headers: adminHeaders() })
      .then(r => r.json() as Promise<{ data: { id: string }[] }>)
      .then(({ data }) => Promise.all(
        (data ?? []).map(l => fetch(`${directusUrl}/items/shared_links/${l.id}`, { method: 'DELETE', headers: adminHeaders() }))
      )),
    fetch(`${directusUrl}/items/student_connections?filter[teacher_id][_eq]=${sid}`, { headers: adminHeaders() })
      .then(r => r.json() as Promise<{ data: { id: number }[] }>)
      .then(({ data }) => Promise.all(
        (data ?? []).map(c => fetch(`${directusUrl}/items/student_connections/${c.id}`, { method: 'DELETE', headers: adminHeaders() }))
      )),
    fetch(`${directusUrl}/items/student_connections?filter[student_id][_eq]=${sid}`, { headers: adminHeaders() })
      .then(r => r.json() as Promise<{ data: { id: number }[] }>)
      .then(({ data }) => Promise.all(
        (data ?? []).map(c => fetch(`${directusUrl}/items/student_connections/${c.id}`, { method: 'DELETE', headers: adminHeaders() }))
      )),
    fetch(`${directusUrl}/items/page_shares?filter[from_id][_eq]=${sid}`, { headers: adminHeaders() })
      .then(r => r.json() as Promise<{ data: { id: number }[] }>)
      .then(({ data }) => Promise.all(
        (data ?? []).map(s => fetch(`${directusUrl}/items/page_shares/${s.id}`, { method: 'DELETE', headers: adminHeaders() }))
      )),
    fetch(`${directusUrl}/items/page_shares?filter[to_id][_eq]=${sid}`, { headers: adminHeaders() })
      .then(r => r.json() as Promise<{ data: { id: number }[] }>)
      .then(({ data }) => Promise.all(
        (data ?? []).map(s => fetch(`${directusUrl}/items/page_shares/${s.id}`, { method: 'DELETE', headers: adminHeaders() }))
      )),
    fetch(`${directusUrl}/items/user_badges?filter[student_id][_eq]=${sid}`, { headers: adminHeaders() })
      .then(r => r.json() as Promise<{ data: { id: number }[] }>)
      .then(({ data }) => Promise.all(
        (data ?? []).map(b => fetch(`${directusUrl}/items/user_badges/${b.id}`, { method: 'DELETE', headers: adminHeaders() }))
      )),
    fetch(`${directusUrl}/items/categories?filter[student_id][_eq]=${sid}&filter[is_predefined][_eq]=false`, { headers: adminHeaders() })
      .then(r => r.json() as Promise<{ data: { id: number }[] }>)
      .then(({ data }) => Promise.all(
        (data ?? []).map(c => fetch(`${directusUrl}/items/categories/${c.id}`, { method: 'DELETE', headers: adminHeaders() }))
      )),
  ]);

  // Smazat studenta a uživatele
  await fetch(`${directusUrl}/items/students/${sid}`, { method: 'DELETE', headers: adminHeaders() });
  await fetch(`${directusUrl}/users/${userId}`, { method: 'DELETE', headers: adminHeaders() });

  return NextResponse.json({ success: true });
}
