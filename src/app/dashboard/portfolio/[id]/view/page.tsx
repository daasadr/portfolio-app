'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Globe, Lock, Paperclip, FileText, Music, Video, Image as ImageIcon } from 'lucide-react';
import { getCurrentStudent, directus, readItems, getDisplayToken } from '@/lib/directus';
import { bgStyle } from '@/components/portfolio/CategoryEditor';
import type { PortfolioPage, Category } from '@/types';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL!;

interface Attachment { id: string; name: string; type: string; }

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (type.startsWith('video/')) return <Video className="h-4 w-4 text-purple-500" />;
  if (type.startsWith('audio/')) return <Music className="h-4 w-4 text-green-500" />;
  return <FileText className="h-4 w-4 text-gray-500" />;
}

interface Props { params: Promise<{ id: string }>; }

export default function ViewPortfolioPage({ params }: Props) {
  const router = useRouter();
  const [page, setPage] = useState<PortfolioPage | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageId, setPageId] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    params.then(p => setPageId(p.id));
  }, [params]);

  useEffect(() => {
    if (!pageId) return;
    const load = async () => {
      try {
        const s = await getCurrentStudent();
        if (!s) { router.push('/login'); return; }
        setToken(getDisplayToken());

        const pages = await directus.request(
          readItems('portfolio_pages', {
            filter: { id: { _eq: pageId }, student_id: { _eq: s.id } },
            limit: 1,
          })
        ) as PortfolioPage[];
        const pg = pages[0];
        if (!pg) { router.push('/dashboard/portfolio'); return; }
        setPage(pg);

        if (pg.category_id) {
          const cats = await directus.request(
            readItems('categories', { filter: { id: { _eq: pg.category_id } }, limit: 1 })
          ) as Category[];
          setCategory(cats[0] ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [pageId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!page) return null;

  const rawAtts = page.attachments;
  const attachments: Attachment[] = rawAtts
    ? (Array.isArray(rawAtts) ? rawAtts : JSON.parse(rawAtts as unknown as string))
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-0">
      {/* Hlavička s pozadím kategorie */}
      <div
        className="rounded-t-2xl px-6 py-5"
        style={category?.background ? bgStyle(category.background) : { background: 'linear-gradient(135deg,#667EEA,#764BA2)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpět
          </Button>
          <div className="flex-1" />
          <Link href={`/dashboard/portfolio/${page.id}`}>
            <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Pencil className="h-4 w-4 mr-1" />
              Upravit
            </Button>
          </Link>
        </div>

        <div className="flex items-start gap-2">
          {page.visibility === 'shared'
            ? <Globe className="h-5 w-5 text-white/80 mt-1 flex-shrink-0" />
            : <Lock className="h-5 w-5 text-white/80 mt-1 flex-shrink-0" />}
          <div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              {page.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {category && (
                <Badge className="bg-white/25 text-white border-0 text-xs">
                  {category.name}
                </Badge>
              )}
              <span className="text-white/70 text-xs">
                Upraveno {new Date(page.updated_at).toLocaleDateString('cs-CZ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Obsah */}
      <div className="bg-white rounded-b-2xl border border-t-0 shadow-sm px-6 py-6">
        {page.content ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        ) : (
          <p className="text-gray-400 italic text-center py-8">Tato stránka nemá žádný obsah.</p>
        )}

        {/* Přílohy */}
        {attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Přílohy ({attachments.length})
            </h3>
            <div className="space-y-2">
              {attachments.map(att => (
                <a
                  key={att.id}
                  href={`${directusUrl}/assets/${att.id}?access_token=${token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <FileIcon type={att.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.name}</p>
                    <p className="text-xs text-gray-400">{att.type}</p>
                  </div>
                  {att.type.startsWith('audio/') && (
                    <audio
                      controls
                      src={`${directusUrl}/assets/${att.id}?access_token=${token}`}
                      className="h-8 max-w-48"
                      onClick={e => e.preventDefault()}
                    />
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
