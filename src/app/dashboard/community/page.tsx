'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building2, Users, Plus, Search, LogOut, Trash2, Crown,
} from 'lucide-react';
import type { Organisation, Group } from '@/types';
import { useLocale } from '@/components/LocaleProvider';

function asGroup(item: Organisation | Group): Group { return item as Group; }

type Tab = 'organisations' | 'groups';

export default function CommunityPage() {
  const { t, plural } = useLocale();
  const [tab, setTab] = useState<Tab>('organisations');
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search + join
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Organisation | Group)[]>([]);
  const [searching, setSearching] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createOrgId, setCreateOrgId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadMine = useCallback(async () => {
    const [orgRes, grpRes] = await Promise.all([
      fetch('/api/organisations'),
      fetch('/api/groups'),
    ]);
    const orgData = await orgRes.json() as { organisations: Organisation[] };
    const grpData = await grpRes.json() as { groups: Group[] };
    setOrganisations(orgData.organisations ?? []);
    setGroups(grpData.groups ?? []);
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadMine(); }, [loadMine]);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const endpoint = tab === 'organisations' ? '/api/organisations' : '/api/groups';
    const res = await fetch(`${endpoint}?all=1&search=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json() as { organisations?: Organisation[]; groups?: Group[] };
      setSearchResults((tab === 'organisations' ? data.organisations : data.groups) ?? []);
    }
    setSearching(false);
  }

  async function handleJoin(id: number) {
    setJoiningId(id);
    const endpoint = tab === 'organisations' ? `/api/organisations/${id}` : `/api/groups/${id}`;
    const res = await fetch(endpoint, { method: 'POST' });
    if (res.ok) {
      await loadMine();
      setSearchResults([]);
      setSearchQuery('');
    }
    setJoiningId(null);
  }

  async function handleLeave(id: number) {
    if (!confirm(t('Opravdu chcete odejít?', 'Do you really want to leave?'))) return;
    const endpoint = tab === 'organisations' ? `/api/organisations/${id}` : `/api/groups/${id}`;
    await fetch(endpoint, { method: 'DELETE' });
    await loadMine();
  }

  async function handleDelete(id: number) {
    if (!confirm(t('Smazat tuto organizaci/skupinu a všechny její členy?', 'Delete this organisation/group and all its members?'))) return;
    const endpoint = tab === 'organisations' ? `/api/organisations/${id}?action=delete` : `/api/groups/${id}?action=delete`;
    await fetch(endpoint, { method: 'DELETE' });
    await loadMine();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    const endpoint = tab === 'organisations' ? '/api/organisations' : '/api/groups';
    const body: Record<string, unknown> = { name: createName, description: createDesc };
    if (tab === 'groups' && createOrgId) body.organisation_id = Number(createOrgId);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { message?: string };
    if (!res.ok) { setCreateError(data.message ?? t('Chyba', 'Error')); setCreating(false); return; }
    setCreateName(''); setCreateDesc(''); setCreateOrgId('');
    setCreateOpen(false);
    await loadMine();
    setCreating(false);
  }

  const items = tab === 'organisations' ? organisations : groups;
  const joinedIds = new Set(items.map(i => i.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Komunita', 'Community')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('Organizace a skupiny, jejichž jste členem', 'Organisations and groups you are a member of')}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{t('Vytvořit', 'Create')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {tab === 'organisations' ? t('Nová organizace', 'New organisation') : t('Nová skupina', 'New group')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>{t('Název', 'Name')} *</Label>
                <Input value={createName} onChange={e => setCreateName(e.target.value)} required placeholder={t('Název...', 'Name...')} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('Popis (volitelné)', 'Description (optional)')}</Label>
                <Textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder={t('Krátký popis...', 'Short description...')} rows={2} />
              </div>
              {tab === 'groups' && organisations.length > 0 && (
                <div className="space-y-1.5">
                  <Label>{t('Patří do organizace (volitelné)', 'Belongs to organisation (optional)')}</Label>
                  <select
                    value={createOrgId}
                    onChange={e => setCreateOrgId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">{t('— bez organizace —', '— no organisation —')}</option>
                    {organisations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {createError && <p className="text-red-500 text-sm">{createError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>{t('Zrušit', 'Cancel')}</Button>
                <Button type="submit" disabled={creating}>{creating ? t('Vytvářím...', 'Creating...') : t('Vytvořit', 'Create')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => { setTab('organisations'); setSearchQuery(''); setSearchResults([]); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'organisations' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Building2 className="h-4 w-4" /> {t('Organizace', 'Organisations')}
          {organisations.length > 0 && <Badge variant="secondary" className="text-xs">{organisations.length}</Badge>}
        </button>
        <button
          onClick={() => { setTab('groups'); setSearchQuery(''); setSearchResults([]); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'groups' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="h-4 w-4" /> {t('Skupiny', 'Groups')}
          {groups.length > 0 && <Badge variant="secondary" className="text-xs">{groups.length}</Badge>}
        </button>
      </div>

      {/* Hledat a připojit se */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder={tab === 'organisations' ? t('Hledat organizaci podle názvu...', 'Search organisations by name...') : t('Hledat skupinu podle názvu...', 'Search groups by name...')}
              className="pl-9"
            />
          </div>

          {searching && <p className="text-xs text-gray-400 mt-2">{t('Hledám...', 'Searching...')}</p>}

          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map(item => {
                const isMember = joinedIds.has(item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                    </div>
                    {isMember ? (
                      <Badge variant="secondary" className="text-xs">{t('Člen', 'Member')}</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleJoin(item.id)} disabled={joiningId === item.id}>
                        {joiningId === item.id ? t('Přidávám...', 'Joining...') : t('Připojit se', 'Join')}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">{t('Nic nenalezeno.', 'Nothing found.')}</p>
          )}
        </CardContent>
      </Card>

      {/* Moje organizace / skupiny */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          {tab === 'organisations'
            ? <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            : <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />}
          <p className="text-sm">
            {tab === 'organisations'
              ? t('Nejste členem žádné organizace. Vytvořte novou nebo hledejte výše.', 'You are not a member of any organisation. Create a new one or search above.')
              : t('Nejste členem žádné skupiny. Vytvořte novou nebo hledejte výše.', 'You are not a member of any group. Create a new one or search above.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.my_role === 'admin' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        <Crown className="h-3 w-3" /> Admin
                      </span>
                    )}
                  </div>
                  {item.description && <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {item.member_count != null && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="h-3 w-3" /> {item.member_count} {plural(item.member_count, ['člen', 'členové', 'členů'], ['member', 'members'])}
                      </span>
                    )}
                    {asGroup(item).organisation_name && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {asGroup(item).organisation_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.my_role === 'admin' ? (
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600" onClick={() => handleLeave(item.id)}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
