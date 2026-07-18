'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Share2,
  Plus,
  Copy,
  Trash2,
  Globe,
  Eye,
  Lock,
  CheckCheck,
  GraduationCap,
  Check,
  X,
  Inbox,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { getCurrentStudent, directus, readItems, createItem, updateItem, deleteItem, generateShareToken, getStoredToken } from '@/lib/directus';
import type { Student, SharedLink, PortfolioPage, Category, ShareType, PageShare } from '@/types';

interface TeacherConnection {
  id: number;
  status: 'pending' | 'accepted';
  created_at: string;
  other_person: { id: number; first_name: string; last_name: string } | null;
}

const SHARE_TYPE_LABELS: Record<ShareType, string> = {
  full_portfolio: 'Celé portfolio',
  category: 'Kategorie',
  single_page: 'Jedna stránka',
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function SharePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [pages, setPages] = useState<PortfolioPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [teacherConnections, setTeacherConnections] = useState<TeacherConnection[]>([]);
  const [tcLoading, setTcLoading] = useState(false);

  const [incomingShares, setIncomingShares] = useState<PageShare[]>([]);
  const [outgoingShares, setOutgoingShares] = useState<PageShare[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    share_type: 'full_portfolio' as ShareType,
    category_id: '',
    page_id: '',
    password: '',
    expires_at: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchConnections = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const tcRes = await fetch('/api/connections', { headers: { Authorization: `Bearer ${token}` } });
      if (tcRes.ok) {
        const tcData = await tcRes.json() as { connections: TeacherConnection[] };
        setTeacherConnections(tcData.connections ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchPageShares = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setSharesLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        fetch('/api/page-shares?type=incoming', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/page-shares?type=outgoing', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (inRes.ok) {
        const d = await inRes.json() as { shares: PageShare[] };
        setIncomingShares(d.shares ?? []);
      }
      if (outRes.ok) {
        const d = await outRes.json() as { shares: PageShare[] };
        setOutgoingShares(d.shares ?? []);
      }
    } catch { /* ignore */ }
    setSharesLoading(false);
  }, []);

  useEffect(() => {
    fetchConnections();
    fetchPageShares();
  }, [fetchConnections, fetchPageShares]);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getCurrentStudent();
        if (!s) return;
        setStudent(s);

        const [l, p, c] = await Promise.all([
          directus.request(
            readItems('shared_links', {
              filter: { student_id: { _eq: s.id } },
              sort: ['-created_at'],
            })
          ) as Promise<SharedLink[]>,
          directus.request(
            readItems('portfolio_pages', {
              filter: { student_id: { _eq: s.id } },
              sort: ['title'],
            })
          ) as Promise<PortfolioPage[]>,
          directus.request(
            readItems('categories', {
              filter: { student_id: { _eq: s.id } },
              sort: ['sort_order'],
            })
          ) as Promise<Category[]>,
        ]);

        setLinks(l ?? []);
        setPages(p ?? []);
        setCategories(c ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  async function handleTcAction(id: number, action: 'accepted' | 'rejected') {
    setTcLoading(true);
    await fetch(`/api/connections/${id}`, {
      method: action === 'rejected' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: action === 'accepted' ? JSON.stringify({ status: 'accepted' }) : undefined,
    });
    await fetchConnections();
    setTcLoading(false);
  }

  async function removePageShare(id: number) {
    const token = getStoredToken();
    await fetch(`/api/page-shares/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setIncomingShares(prev => prev.filter(s => s.id !== id));
    setOutgoingShares(prev => prev.filter(s => s.id !== id));
  }

  function getShareUrl(link: SharedLink) {
    return `${appUrl}/portfolio/${link.share_token}`;
  }

  async function copyLink(link: SharedLink) {
    await navigator.clipboard.writeText(getShareUrl(link));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function toggleActive(link: SharedLink) {
    const updated = await directus.request(
      updateItem('shared_links', link.id, { is_active: !link.is_active })
    ) as SharedLink;
    setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
  }

  async function deleteLink(id: string) {
    if (!confirm('Opravdu chcete smazat tento odkaz?')) return;
    await directus.request(deleteItem('shared_links', id));
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleSave() {
    if (!student) return;
    setSaving(true);
    try {
      const token = generateShareToken();
      const created = await directus.request(
        createItem('shared_links', {
          student_id: student.id,
          share_token: token,
          share_type: form.share_type,
          category_id: form.share_type === 'category' && form.category_id ? form.category_id : undefined,
          page_id: form.share_type === 'single_page' && form.page_id ? form.page_id : undefined,
          expires_at: form.expires_at || undefined,
          is_active: true,
          view_count: 0,
        })
      ) as SharedLink;
      setLinks((prev) => [created, ...prev]);
      setForm({ share_type: 'full_portfolio', category_id: '', page_id: '', password: '', expires_at: '' });
      setDialogOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const pendingConnections = teacherConnections.filter(tc => tc.status === 'pending');
  const acceptedConnections = teacherConnections.filter(tc => tc.status === 'accepted');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sdílení</h1>
        <p className="text-gray-500 text-sm mt-1">Stránky sdílené s vámi a vaše sdílení s ostatními</p>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList className="mb-4">
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Sdílí se mnou
            {incomingShares.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5">{incomingShares.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Sdílím
          </TabsTrigger>
        </TabsList>

        {/* === ZÁLOŽKA: Sdílí se mnou === */}
        <TabsContent value="incoming" className="space-y-6">

          {/* Žádosti o propojení čekající na přijetí */}
          {pendingConnections.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Žádosti o propojení
              </h2>
              <div className="space-y-2">
                {pendingConnections.map(tc => (
                  <Card key={tc.id} className="border-yellow-200 bg-yellow-50/40">
                    <CardContent className="pt-3 pb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {tc.other_person ? `${tc.other_person.first_name} ${tc.other_person.last_name}` : 'Uživatel'}
                        </p>
                        <Badge variant="outline" className="text-yellow-700 border-yellow-300 text-xs mt-0.5">
                          Čeká na vaše přijetí
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleTcAction(tc.id, 'accepted')} disabled={tcLoading}>
                          <Check className="h-4 w-4 mr-1" /> Přijmout
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600"
                          onClick={() => handleTcAction(tc.id, 'rejected')} disabled={tcLoading}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Stránky sdílené s tímto uživatelem */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Stránky sdílené se mnou
            </h2>
            {sharesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : incomingShares.length === 0 ? (
              <Card className="bg-gray-50/50">
                <CardContent className="pt-4 text-sm text-gray-400 text-center py-10">
                  Nikdo s vámi zatím nesdílel žádnou stránku.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {incomingShares.map(share => (
                  <Card key={share.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="pt-3 pb-3 flex items-center gap-4">
                      <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {share.page?.title ?? 'Neznámá stránka'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Od: {share.from?.first_name} {share.from?.last_name}
                          {share.date_created && ` · ${new Date(share.date_created).toLocaleDateString('cs-CZ')}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-600"
                        onClick={() => removePageShare(share.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* === ZÁLOŽKA: Sdílím === */}
        <TabsContent value="outgoing" className="space-y-6">

          {/* Přijatá propojení */}
          {acceptedConnections.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Propojení
              </h2>
              <div className="space-y-2">
                {acceptedConnections.map(tc => (
                  <Card key={tc.id}>
                    <CardContent className="pt-3 pb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {tc.other_person ? `${tc.other_person.first_name} ${tc.other_person.last_name}` : 'Uživatel'}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-0.5">Propojeno</Badge>
                      </div>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600"
                        onClick={() => handleTcAction(tc.id, 'rejected')} disabled={tcLoading}>
                        <X className="h-4 w-4" /> Odebrat
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Stránky, které sdílím */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Sdílené stránky
            </h2>
            {sharesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : outgoingShares.length === 0 ? (
              <Card className="bg-gray-50/50">
                <CardContent className="pt-4 text-sm text-gray-400 text-center py-8">
                  Zatím jste nesdíleli žádnou stránku. Otevřete stránku v portfoliu a klikněte na „Sdílet s...".
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {outgoingShares.map(share => (
                  <Card key={share.id}>
                    <CardContent className="pt-3 pb-3 flex items-center gap-4">
                      <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {share.page?.title ?? 'Neznámá stránka'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Pro: {share.to?.first_name} {share.to?.last_name}
                          {share.date_created && ` · ${new Date(share.date_created).toLocaleDateString('cs-CZ')}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-600"
                        onClick={() => removePageShare(share.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Veřejné sdílecí odkazy */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> Veřejné sdílecí odkazy
              </h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Nový odkaz
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Vytvořit sdílecí odkaz</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <Label>Co sdílet</Label>
                      <Select
                        value={form.share_type}
                        onValueChange={(v) => setForm((f) => ({ ...f, share_type: v as ShareType, category_id: '', page_id: '' }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_portfolio">Celé portfolio</SelectItem>
                          <SelectItem value="category">Jen kategorii</SelectItem>
                          <SelectItem value="single_page">Jednu stránku</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {form.share_type === 'category' && (
                      <div className="space-y-1">
                        <Label>Vyberte kategorii</Label>
                        <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Vyberte kategorii" /></SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {form.share_type === 'single_page' && (
                      <div className="space-y-1">
                        <Label>Vyberte stránku</Label>
                        <Select value={form.page_id} onValueChange={(v) => setForm((f) => ({ ...f, page_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Vyberte stránku" /></SelectTrigger>
                          <SelectContent>
                            {pages.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label>Platnost odkazu (volitelné)</Label>
                      <Input
                        type="datetime-local"
                        value={form.expires_at}
                        onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500">Pokud nevyplníte, odkaz nevyprší</p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>Zrušit</Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Vytvářím...' : 'Vytvořit odkaz'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {links.length === 0 ? (
              <Card className="bg-gray-50/50">
                <CardContent className="pt-4 text-sm text-gray-400 text-center py-8">
                  Zatím nemáte žádné veřejné sdílecí odkazy.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {links.map((link) => {
                  const url = getShareUrl(link);
                  const expired = link.expires_at ? new Date(link.expires_at) < new Date() : false;
                  const pg = link.page_id ? pages.find((p) => p.id === link.page_id) : null;
                  const cat = link.category_id ? categories.find((c) => String(c.id) === String(link.category_id)) : null;

                  return (
                    <Card key={link.id} className={!link.is_active || expired ? 'opacity-60' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="secondary">{SHARE_TYPE_LABELS[link.share_type]}</Badge>
                              {cat && <Badge variant="outline">{cat.name}</Badge>}
                              {pg && <Badge variant="outline">{pg.title}</Badge>}
                              {!link.is_active && <Badge variant="destructive">Neaktivní</Badge>}
                              {expired && <Badge variant="destructive">Vypršelo</Badge>}
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {link.view_count} zobrazení
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate flex-1 max-w-xs">{url}</code>
                              <Button variant="ghost" size="sm" onClick={() => copyLink(link)} className="flex-shrink-0">
                                {copiedId === link.id
                                  ? <CheckCheck className="h-4 w-4 text-green-500" />
                                  : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                            {link.expires_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                Platí do: {new Date(link.expires_at).toLocaleString('cs-CZ')}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={() => toggleActive(link)} title={link.is_active ? 'Deaktivovat' : 'Aktivovat'}>
                              {link.is_active ? <Globe className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4 text-gray-400" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteLink(link.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
