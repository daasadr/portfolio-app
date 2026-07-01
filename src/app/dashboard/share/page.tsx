'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { getCurrentStudent, directus, readItems, createItem, updateItem, deleteItem, generateShareToken } from '@/lib/directus';
import type { Student, SharedLink, PortfolioPage, Category, ShareType } from '@/types';

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    share_type: 'full_portfolio' as ShareType,
    category_id: '',
    page_id: '',
    password: '',
    expires_at: '',
  });
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sdílení portfolia</h1>
          <p className="text-gray-500 text-sm mt-1">Sdílejte své portfolio s učiteli nebo rodinou pomocí odkazů</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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
                  <Select
                    value={form.category_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
                  >
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
                  <Select
                    value={form.page_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, page_id: v }))}
                  >
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
        <div className="text-center py-16 text-gray-500">
          <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Zatím nemáte žádné sdílecí odkazy</p>
          <p className="text-sm mt-1">Vytvořte odkaz a sdílejte své portfolio.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            const url = getShareUrl(link);
            const expired = link.expires_at ? new Date(link.expires_at) < new Date() : false;
            const page = link.page_id ? pages.find((p) => p.id === link.page_id) : null;
            const category = link.category_id
              ? categories.find((c) => String(c.id) === String(link.category_id))
              : null;

            return (
              <Card key={link.id} className={!link.is_active || expired ? 'opacity-60' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary">{SHARE_TYPE_LABELS[link.share_type]}</Badge>
                        {category && <Badge variant="outline">{category.name}</Badge>}
                        {page && <Badge variant="outline">{page.title}</Badge>}
                        {!link.is_active && <Badge variant="destructive">Neaktivní</Badge>}
                        {expired && <Badge variant="destructive">Vypršelo</Badge>}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {link.view_count} zobrazení
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate flex-1 max-w-xs">
                          {url}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(link)}
                          className="flex-shrink-0"
                        >
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(link)}
                        title={link.is_active ? 'Deaktivovat' : 'Aktivovat'}
                      >
                        {link.is_active ? <Globe className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4 text-gray-400" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteLink(link.id)}
                      >
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
  );
}
