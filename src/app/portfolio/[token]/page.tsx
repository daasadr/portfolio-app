'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FolderOpen, BookOpen, AlertCircle } from 'lucide-react';
import type { PortfolioPage, Category } from '@/types';

interface Student { id: string; first_name: string; last_name: string; avatar?: string }

export default function PublicPortfolioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [pages, setPages] = useState<PortfolioPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shareType, setShareType] = useState<string>('full_portfolio');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPage, setSelectedPage] = useState<PortfolioPage | null>(null);

  useEffect(() => {
    fetch(`/api/portfolio/${token}`)
      .then(async res => {
        const data = await res.json() as {
          message?: string;
          student?: Student;
          pages?: PortfolioPage[];
          categories?: Category[];
          share_type?: string;
        };
        if (!res.ok) { setError(data.message ?? 'Odkaz není platný'); setIsLoading(false); return; }
        setStudent(data.student ?? null);
        setPages(data.pages ?? []);
        setCategories(data.categories ?? []);
        setShareType(data.share_type ?? 'full_portfolio');
        if (data.share_type === 'single_page' && data.pages?.length === 1) {
          setSelectedPage(data.pages[0]);
        }
        setIsLoading(false);
      })
      .catch(() => { setError('Chyba při načítání'); setIsLoading(false); });
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-600 font-medium">{error}</p>
          <Link href="/" className="text-xs text-blue-500 hover:underline">Portfolio Paradise</Link>
        </div>
      </div>
    );
  }

  // Zobrazení jedné stránky (single_page share nebo po kliknutí)
  if (selectedPage) {
    const rawAtts = selectedPage.attachments;
    const attachments: { id: string; name: string; type: string }[] = rawAtts
      ? (Array.isArray(rawAtts) ? rawAtts : JSON.parse(rawAtts as unknown as string))
      : [];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {shareType !== 'single_page' && (
            <button
              onClick={() => setSelectedPage(null)}
              className="text-sm text-blue-500 hover:underline mb-6 flex items-center gap-1"
            >
              ← Zpět na seznam
            </button>
          )}
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#667EEA,#764BA2)' }}>
              <h1 className="text-2xl font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                {selectedPage.title}
              </h1>
              <p className="text-white/70 text-xs mt-1">
                {student?.first_name} {student?.last_name} · {new Date(selectedPage.updated_at).toLocaleDateString('cs-CZ')}
              </p>
            </div>
            <div className="bg-white px-6 py-6">
              {selectedPage.content ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedPage.content }} />
              ) : (
                <p className="text-gray-400 italic text-center py-8">Tato stránka nemá žádný obsah.</p>
              )}
              {attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t space-y-3">
                  <h3 className="text-sm font-semibold text-gray-600">Přílohy ({attachments.length})</h3>
                  {attachments.map(att => {
                    const src = `/api/asset/${att.id}`;
                    return (
                      <div key={att.id} className="rounded-lg border overflow-hidden">
                        {att.type.startsWith('image/') && <img src={src} alt={att.name} className="w-full max-h-96 object-contain bg-gray-50" />}
                        {att.type.startsWith('video/') && <video controls src={src} className="w-full max-h-96 bg-black" />}
                        {att.type.startsWith('audio/') && <div className="p-3 bg-gray-50"><audio controls src={src} className="w-full" /></div>}
                        <a href={src} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700 truncate">{att.name}</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Sdíleno přes <Link href="/" className="text-blue-400 hover:underline">Portfolio Paradise</Link>
          </p>
        </div>
      </div>
    );
  }

  // Seznam stránek (full_portfolio nebo category)
  const pagesByCategory = categories.map(cat => ({
    cat,
    pages: pages.filter(p => p.category_id === cat.id),
  })).filter(g => g.pages.length > 0);
  const uncategorized = pages.filter(p => !p.category_id || !categories.find(c => c.id === p.category_id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Hlavička */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
            {student?.first_name?.[0]}{student?.last_name?.[0]}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{student?.first_name} {student?.last_name}</h1>
          <p className="text-gray-500 text-sm mt-1">Portfolio</p>
        </div>

        {pages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Toto portfolio zatím neobsahuje žádné stránky.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pagesByCategory.map(({ cat, pages: catPages }) => (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{cat.name}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catPages.map(page => (
                    <Card
                      key={page.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedPage(page)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{page.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(page.updated_at).toLocaleDateString('cs-CZ')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            {uncategorized.length > 0 && (
              <div>
                {pagesByCategory.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="h-4 w-4 text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Ostatní</h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uncategorized.map(page => (
                    <Card
                      key={page.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedPage(page)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{page.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(page.updated_at).toLocaleDateString('cs-CZ')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          Sdíleno přes <Link href="/" className="text-blue-400 hover:underline">Portfolio Paradise</Link>
        </p>
      </div>
    </div>
  );
}
