'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Music, Video, Image as ImageIcon, Paperclip } from 'lucide-react';
import { getStoredToken } from '@/lib/directus';
import type { PortfolioPage } from '@/types';

interface Attachment { id: string; name: string; type: string; }

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (type.startsWith('video/')) return <Video className="h-4 w-4 text-purple-500" />;
  if (type.startsWith('audio/')) return <Music className="h-4 w-4 text-green-500" />;
  return <FileText className="h-4 w-4 text-gray-500" />;
}

export default function TeacherPageView({
  params,
}: {
  params: Promise<{ studentId: string; pageId: string }>;
}) {
  const { studentId, pageId } = use(params);
  const [page, setPage] = useState<PortfolioPage | null>(null);
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = getStoredToken();
      const res = await fetch(`/api/teacher/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError('Stránka nenalezena nebo nemáte přístup.');
        setIsLoading(false);
        return;
      }
      const data = await res.json() as {
        student: { first_name: string; last_name: string };
        pages: PortfolioPage[];
      };
      setStudentName(`${data.student.first_name} ${data.student.last_name}`);
      const found = data.pages.find(p => p.id === pageId) ?? null;
      if (!found) setError('Stránka nenalezena.');
      setPage(found);
      setIsLoading(false);
    };
    load();
  }, [studentId, pageId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-red-500 mb-4">{error || 'Stránka nenalezena.'}</p>
        <Link href={`/dashboard/students/${studentId}`}>
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Zpět na portfolio</Button>
        </Link>
      </div>
    );
  }

  const rawAtts = page.attachments;
  const attachments: Attachment[] = rawAtts
    ? (Array.isArray(rawAtts) ? rawAtts : JSON.parse(rawAtts as unknown as string))
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-0">
      <div className="rounded-t-2xl px-6 py-5" style={{ background: 'linear-gradient(135deg,#667EEA,#764BA2)' }}>
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/dashboard/students/${studentId}`}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zpět
            </Button>
          </Link>
          <div className="flex-1" />
          <Badge className="bg-white/20 text-white border-0 text-xs">Jen pro čtení</Badge>
        </div>
        <h1 className="text-2xl font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          {page.title}
        </h1>
        <p className="text-white/70 text-xs mt-1">
          {studentName} · Upraveno {new Date(page.updated_at).toLocaleDateString('cs-CZ')}
        </p>
      </div>

      <div className="bg-white rounded-b-2xl border border-t-0 shadow-sm px-6 py-6">
        {page.content ? (
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <p className="text-gray-400 italic text-center py-8">Tato stránka nemá žádný obsah.</p>
        )}

        {attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Přílohy ({attachments.length})
            </h3>
            <div className="space-y-3">
              {attachments.map(att => {
                const src = `/api/asset/${att.id}`;
                return (
                  <div key={att.id} className="rounded-lg border overflow-hidden">
                    {att.type.startsWith('image/') && (
                      <img src={src} alt={att.name} className="w-full max-h-96 object-contain bg-gray-50" />
                    )}
                    {att.type.startsWith('video/') && (
                      <video controls src={src} className="w-full max-h-96 bg-black" />
                    )}
                    {att.type.startsWith('audio/') && (
                      <div className="p-3 bg-gray-50"><audio controls src={src} className="w-full" /></div>
                    )}
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <FileIcon type={att.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.name}</p>
                        <p className="text-xs text-gray-400">{att.type}</p>
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
