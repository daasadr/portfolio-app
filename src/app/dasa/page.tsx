'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/LocaleProvider';

interface StudentRow {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_teacher: boolean;
}

export default function AdminPage() {
  const { t, plural } = useLocale();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [filtered, setFiltered] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/students')
      .then(async res => {
        if (res.status === 403) { setDenied(true); setLoading(false); return; }
        const { students: data } = await res.json() as { students: StudentRow[] };
        setStudents(data ?? []);
        setFiltered(data ?? []);
        setLoading(false);
      })
      .catch(() => { setDenied(true); setLoading(false); });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? students.filter(s =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      ) : students
    );
  }, [search, students]);

  async function toggleTeacher(student: StudentRow) {
    setToggling(student.id);
    const res = await fetch(`/api/admin/students/${student.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_teacher: !student.is_teacher }),
    });
    if (res.ok) {
      setStudents(prev => prev.map(s =>
        s.id === student.id ? { ...s, is_teacher: !s.is_teacher } : s
      ));
    }
    setToggling(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <p>{t('Přístup odepřen.', 'Access denied.')}</p>
      </div>
    );
  }

  const teachers = students.filter(s => s.is_teacher).length;
  const total = students.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('Správa uživatelů', 'User management')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('Celkem:', 'Total:')} <strong>{total}</strong> {plural(total, ['uživatel', 'uživatelé', 'uživatelů'], ['user', 'users'])}
            {' · '}<strong>{teachers}</strong> {plural(teachers, ['učitel', 'učitelé', 'učitelů'], ['teacher', 'teachers'])}
            {' · '}<strong>{total - teachers}</strong> {plural(total - teachers, ['žák', 'žáci', 'žáků'], ['pupil', 'pupils'])}
          </p>
        </div>

        <div className="mb-4">
          <Input
            placeholder={t('Hledat podle jména nebo e-mailu...', 'Search by name or email...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm bg-white"
          />
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">{t('Jméno', 'Name')}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{t('E-mail', 'Email')}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-right">{t('Akce', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    {search ? t('Žádný výsledek', 'No results') : t('Žádní uživatelé', 'No users')}
                  </td>
                </tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.first_name} {s.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.email || '—'}</td>
                  <td className="px-4 py-3">
                    {s.is_teacher
                      ? <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">{t('Učitel', 'Teacher')}</Badge>
                      : <Badge variant="secondary">{t('Žák', 'Pupil')}</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant={s.is_teacher ? 'outline' : 'default'}
                      onClick={() => toggleTeacher(s)}
                      disabled={toggling === s.id}
                      className="min-w-32"
                    >
                      {toggling === s.id
                        ? t('Ukládám...', 'Saving...')
                        : s.is_teacher ? t('Odebrat roli učitele', 'Remove teacher role') : t('Povýšit na učitele', 'Make a teacher')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
