'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen, Plus, Search, Pencil, Trash2, Globe, Lock, FolderOpen, Eye,
} from 'lucide-react';
import { getCurrentStudent, directus, readItems, deleteItem } from '@/lib/directus';
import { bgStyle, catTextStyle } from '@/components/portfolio/CategoryEditor';
import CategoryEditor from '@/components/portfolio/CategoryEditor';
import type { Student, PortfolioPage, Category } from '@/types';

export default function PortfolioPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [pages, setPages] = useState<PortfolioPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catEditorOpen, setCatEditorOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getCurrentStudent();
        if (!s) return;
        setStudent(s);
        const [p, c] = await Promise.all([
          directus.request(
            readItems('portfolio_pages', { filter: { student_id: { _eq: s.id } }, sort: ['-updated_at'] })
          ) as Promise<PortfolioPage[]>,
          directus.request(
            readItems('categories', { filter: { student_id: { _eq: s.id } }, sort: ['sort_order'] })
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
    if (!confirm('Opravdu smazat tuto stránku?')) return;
    await directus.request(deleteItem('portfolio_pages', id));
    setPages(prev => prev.filter(p => p.id !== id));
  }

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Skupiny: každá kategorie + necatgorized
  const categorized = categories.map(cat => ({
    cat,
    // eslint-disable-next-line eqeqeq
    pages: filtered.filter(p => p.category_id == cat.id),
  })).filter(g => g.pages.length > 0 || search === '');

  // eslint-disable-next-line eqeqeq
  const uncategorized = filtered.filter(p => !p.category_id || !categories.find(c => c.id == p.category_id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatEditorOpen(true)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Kategorie
          </Button>
          <Link href="/dashboard/portfolio/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nová stránka
            </Button>
          </Link>
        </div>
      </div>

      {/* Hledání */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Hledat stránky..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="text-sm text-gray-500">
        {pages.length} stránek celkem · {pages.filter(p => p.visibility === 'shared').length} sdílených
      </div>

      {/* Prázdný stav */}
      {pages.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Zatím žádné stránky portfolia</p>
          <p className="text-sm mt-1">Vytvořte první stránku a začněte dokumentovat své studium.</p>
          <Link href="/dashboard/portfolio/new">
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Vytvořit první stránku
            </Button>
          </Link>
        </div>
      )}

      {/* Sekce po kategoriích */}
      {categories.length > 0 && filtered.length > 0 && (
        <div className="space-y-8">
          {categorized.map(({ cat, pages: catPages }) => (
            <CategorySection
              key={cat.id}
              category={cat}
              pages={catPages}
              onDelete={handleDelete}
            />
          ))}

          {uncategorized.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-500 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Bez kategorie
              </h2>
              <PageGrid pages={uncategorized} categories={categories} onDelete={handleDelete} />
            </div>
          )}
        </div>
      )}

      {/* Bez kategorií — flat grid */}
      {categories.length === 0 && filtered.length > 0 && (
        <PageGrid pages={filtered} categories={[]} onDelete={handleDelete} />
      )}

      {/* CategoryEditor dialog */}
      <CategoryEditor
        open={catEditorOpen}
        onClose={() => setCatEditorOpen(false)}
        onCategoriesChange={setCategories}
      />
    </div>
  );
}

// ── Sekce jedné kategorie ────────────────────────────────────────────────────
function CategorySection({
  category,
  pages,
  onDelete,
}: {
  category: Category;
  pages: PortfolioPage[];
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 4;
  const shown = expanded ? pages : pages.slice(0, PREVIEW);

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-white/30">
      {/* Hlavička kategorie */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={bgStyle(category.background)}
      >
        <h2 className="text-lg font-bold" style={catTextStyle(category.background)}>
          {category.name}
        </h2>
        <span className="text-sm font-medium" style={{ ...catTextStyle(category.background), opacity: 0.8 }}>
          {pages.length} {pages.length === 1 ? 'stránka' : pages.length < 5 ? 'stránky' : 'stránek'}
        </span>
      </div>

      {/* Stránky */}
      <div className="bg-white p-4 space-y-3">
        {shown.map(page => (
          <PageRow key={page.id} page={page} onDelete={onDelete} />
        ))}

        {pages.length > PREVIEW && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {expanded ? 'Zobrazit méně' : `Zobrazit všechny (${pages.length - PREVIEW} dalších)`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Flat grid stránek ─────────────────────────────────────────────────────────
function PageGrid({
  pages,
  categories,
  onDelete,
}: {
  pages: PortfolioPage[];
  categories: Category[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pages.map(page => {
        // eslint-disable-next-line eqeqeq
        const cat = categories.find(c => c.id == page.category_id);
        return (
          <div
            key={page.id}
            className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow p-4 space-y-3"
          >
            <div className="flex items-start gap-2">
              {page.visibility === 'shared'
                ? <Globe className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                : <Lock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{page.title}</p>
                {cat && <p className="text-xs text-gray-400 mt-0.5">{cat.name}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(page.updated_at).toLocaleDateString('cs-CZ')}
                </p>
              </div>
            </div>
            <PageActions page={page} onDelete={onDelete} />
          </div>
        );
      })}
    </div>
  );
}

// ── Řádek stránky (v sekci kategorie) ───────────────────────────────────────
function PageRow({ page, onDelete }: { page: PortfolioPage; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      {page.visibility === 'shared'
        ? <Globe className="h-4 w-4 text-blue-500 flex-shrink-0" />
        : <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{page.title}</p>
        <p className="text-xs text-gray-400">{new Date(page.updated_at).toLocaleDateString('cs-CZ')}</p>
      </div>
      <PageActions page={page} onDelete={onDelete} compact />
    </div>
  );
}

// ── Akční tlačítka stránky ───────────────────────────────────────────────────
function PageActions({
  page,
  onDelete,
  compact = false,
}: {
  page: PortfolioPage;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex gap-1.5 ${compact ? '' : 'mt-1'}`}>
      <Link href={`/dashboard/portfolio/${page.id}/view`} className="flex-1">
        <Button variant="outline" size="sm" className="w-full">
          <Eye className="h-3.5 w-3.5 mr-1" />
          {!compact && 'Otevřít'}
        </Button>
      </Link>
      <Link href={`/dashboard/portfolio/${page.id}`}>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-400 hover:text-red-600 hover:bg-red-50"
        onClick={() => onDelete(page.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
