'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Check, X, Trash2, ExternalLink } from 'lucide-react';
import { getCurrentStudent, getStoredToken } from '@/lib/directus';

interface Connection {
  id: number;
  teacher_id: number;
  student_id: number;
  status: 'pending' | 'accepted';
  created_at: string;
  other_person: { id: number; first_name: string; last_name: string } | null;
}

export default function StudentsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const token = typeof window !== 'undefined' ? getStoredToken() : '';

  useEffect(() => {
    const load = async () => {
      const s = await getCurrentStudent();
      if (!s?.is_teacher) { setIsLoading(false); return; }
      setIsTeacher(true);
      await fetchConnections();
      setIsLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchConnections() {
    const t = getStoredToken();
    const res = await fetch('/api/connections', { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return;
    const data = await res.json() as { connections: Connection[] };
    setConnections(data.connections ?? []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    const t = getStoredToken();
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ targetEmail: email }),
    });
    const data = await res.json() as { message?: string };
    if (!res.ok) { setAddError(data.message ?? 'Chyba'); setAdding(false); return; }
    setEmail('');
    await fetchConnections();
    setAdding(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Odebrat toto propojení?')) return;
    const t = getStoredToken();
    await fetch(`/api/connections/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
    setConnections(prev => prev.filter(c => c.id !== id));
  }

  const accepted = connections.filter(c => c.status === 'accepted');
  const pending = connections.filter(c => c.status === 'pending');

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (!isTeacher) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Tato stránka je dostupná pouze pro učitelské účty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Moji žáci</h1>
        <p className="text-gray-500 text-sm mt-1">Spravujte propojení se žáky a prohlížejte jejich portfolia</p>
      </div>

      {/* Přidat žáka */}
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Přidat žáka podle e-mailu</label>
              <Input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setAddError(''); }}
                placeholder="zak@email.cz"
                required
              />
              {addError && <p className="text-xs text-red-500">{addError}</p>}
            </div>
            <Button type="submit" disabled={adding} className="flex-shrink-0">
              <UserPlus className="h-4 w-4 mr-2" />
              {adding ? 'Přidávám...' : 'Přidat žáka'}
            </Button>
          </form>
          <p className="text-xs text-gray-400 mt-2">Žák dostane žádost o propojení a musí ji přijmout na stránce Sdílení.</p>
        </CardContent>
      </Card>

      {/* Čekající žádosti */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Čekající žádosti</h2>
          <div className="space-y-2">
            {pending.map(c => (
              <Card key={c.id} className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {c.other_person ? `${c.other_person.first_name} ${c.other_person.last_name}` : '—'}
                    </p>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300 text-xs mt-1">Čeká na přijetí žákem</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(c.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Propojení žáci */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Propojení žáci {accepted.length > 0 && <span className="text-gray-400 normal-case font-normal">({accepted.length})</span>}
        </h2>
        {accepted.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Zatím nemáte žádné propojené žáky.</p>
            <p className="text-xs mt-1">Přidejte žáka pomocí jeho e-mailu výše.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accepted.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {c.other_person ? `${c.other_person.first_name} ${c.other_person.last_name}` : '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.created_at ? `Propojeno ${new Date(c.created_at).toLocaleDateString('cs-CZ')}` : 'Propojeno'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/students/${c.student_id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Portfolio
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
