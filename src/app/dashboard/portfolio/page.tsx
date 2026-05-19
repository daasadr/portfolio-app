'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  Globe,
  Lock,
} from 'lucide-react';
import { getCurrentStudent, directus, readItems, deleteItem } from '@/lib/directus';
import type { Student, PortfolioPage, Category } from '@/types';

export default function PortfolioPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [pages, setPages] = useState<PortfolioPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getCurrentStudent();
        if (!s) return;
        setStudent(s);

        const [p, c] = await Promise.all([
          directus.request(
            readItems('portfolio_pages', {
              filter: { student_id: { _eq: s.id } },
              sort: ['-updated_at'],
            })
          ) as Promise<PortfolioPage[]>,
          directus.request(
            readItems('categories', {
              filter: { student_id: { _eq: s.id } },
              sort: ['sort_order'],
            })
          ) as Promise<Category[]>,
        ]);

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

  async function handleDelete(id: string) {
    if (!confirm('Opravdu chcete smazat tuto stránku?')) return;
    await directus.request(deleteItem('portfolio_pages', id));
    setPages((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = pages.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || p.category_id === filterCategory;
    return matchSearch && matchCat;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <Link href="/dashboard/portfolio/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nová stránka
          </Button>
        </Link>
      </div>

      {/* Filtry */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hledat stránky..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Všechny kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny kategorie</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-gray-600">
        <span>{pages.length} stránek celkem</span>
        <span>·</span>
        <span>{pages.filter((p) => p.visibility === 'shared').length} sdílených</span>
      </div>

      {/* Seznam stránek */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          {pages.length === 0 ? (
            <>
              <p className="text-lg font-medium">Zatím nemáte žádné stránky portfolia</p>
              <p className="text-sm mt-1">Vytvořte první stránku a začněte dokumentovat své studium.</p>
              <Link href="/dashboard/portfolio/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Vytvořit první stránku
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-lg font-medium">Žádné stránky neodpovídají filtru</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((page) => {
            const category = categories.find((c) => c.id === page.category_id);
            return (
              <Card key={page.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {page.visibility === 'shared'
                          ? <Globe className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          : <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                        <h3 className="font-medium truncate">{page.title}</h3>
                      </div>
                      {category && (
                        <Badge variant="secondary" className="text-xs mb-2">{category.name}</Badge>
                      )}
                      <p className="text-xs text-gray-500">
                        Upraveno {new Date(page.updated_at).toLocaleDateString('cs-CZ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/dashboard/portfolio/${page.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="h-4 w-4 mr-1" />
                        Upravit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(page.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
