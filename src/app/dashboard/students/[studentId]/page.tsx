'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, FileText, FolderOpen } from 'lucide-react';
import { getStoredToken } from '@/lib/directus';
import type { Student, Category, PortfolioPage } from '@/types';

export default function StudentPortfolioPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [pages, setPages] = useState<PortfolioPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = getStoredToken();
      const res = await fetch(`/api/teacher/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json() as { message?: string };
        setError(data.message ?? 'Chyba při načítání');
        setIsLoading(false);
        return;
      }
      const data = await res.json() as { student: Student; pages: PortfolioPage[]; categories: Category[] };
      setStudent(data.student);
      setPages(data.pages);
      setCategories(data.categories);
      setIsLoading(false);
    };
    load();
  }, [studentId]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (error) return (
    <div className="text-center py-16 text-gray-500">
      <p className="text-red-500 mb-4">{error}</p>
      <Link href="/dashboard/students"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Zpět</Button></Link>
    </div>
  );

  // Seskup stránky podle kategorií
  const pagesByCategory = categories.map(cat => ({
    cat,
    pages: pages.filter(p => p.category_id === cat.id),
  })).filter(g => g.pages.length > 0);

  const uncategorized = pages.filter(p => !p.category_id || !categories.find(c => c.id === p.category_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/students">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Zpět</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Portfolio — {student?.first_name} {student?.last_name}
          </h1>
          <p className="text-sm text-gray-500">Zobrazení portfolia žáka (jen pro čtení)</p>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Žák zatím nemá žádné stránky v portfoliu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pagesByCategory.map(({ cat, pages: catPages }) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{cat.name}</h2>
                <span className="text-xs text-gray-400">({catPages.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catPages.map(page => (
                  <Link key={page.id} href={`/dashboard/students/${studentId}/pages/${page.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{page.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(page.updated_at ?? page.created_at).toLocaleDateString('cs-CZ')}
                            </p>
                          </div>
                          <Badge variant={page.visibility === 'shared' ? 'secondary' : 'outline'} className="text-xs flex-shrink-0">
                            {page.visibility === 'shared' ? 'Sdílená' : 'Soukromá'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {uncategorized.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Bez kategorie</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {uncategorized.map(page => (
                  <Link key={page.id} href={`/dashboard/students/${studentId}/pages/${page.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{page.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(page.updated_at ?? page.created_at).toLocaleDateString('cs-CZ')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
