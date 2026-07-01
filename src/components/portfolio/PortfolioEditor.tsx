'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  ArrowLeft,
  Upload,
  Globe,
  Lock,
  Paperclip,
  X,
  FileText,
  Music,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { getCurrentStudent, directus, readItems, createItem, updateItem, uploadFile, getDisplayToken } from '@/lib/directus';
import type { Student, Category, PortfolioPage } from '@/types';
import RichEditor from './RichEditor';

interface Attachment {
  id?: string;
  name: string;
  url: string;
  type: string;
  isNew?: boolean;
  file?: File;
}

interface PortfolioEditorProps {
  pageId?: string;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (type.startsWith('video/')) return <Video className="h-4 w-4 text-purple-500" />;
  if (type.startsWith('audio/')) return <Music className="h-4 w-4 text-green-500" />;
  return <FileText className="h-4 w-4 text-gray-500" />;
}

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL!;

export default function PortfolioEditor({ pageId }: PortfolioEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('none');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getCurrentStudent();
        if (!s) return;
        setStudent(s);

        const cats = await directus.request(
          readItems('categories', {
            filter: { student_id: { _eq: s.id } },
            sort: ['sort_order'],
          })
        ) as Category[];
        setCategories(cats ?? []);

        if (pageId) {
          const pages = await directus.request(
            readItems('portfolio_pages', {
              filter: { id: { _eq: pageId }, student_id: { _eq: s.id } },
              limit: 1,
            })
          ) as PortfolioPage[];
          const page = pages[0];
          if (page) {
            setTitle(page.title);
            setContent(page.content ?? '');
            setCategoryId(page.category_id != null ? String(page.category_id) : 'none');
            setVisibility(page.visibility);
            if (page.attachments) {
              const token = getDisplayToken();
              // Directus returns json field as array; guard against legacy string values
              const rawAtts = page.attachments;
              const saved: Array<{ id: string; name: string; type: string }> =
                Array.isArray(rawAtts) ? rawAtts : JSON.parse(rawAtts as unknown as string);
              setAttachments(saved.map(a => ({
                id: a.id,
                name: a.name,
                url: `${directusUrl}/assets/${a.id}?access_token=${token}`,
                type: a.type,
              })));
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [pageId]);

  async function handleImageUpload(file: File): Promise<string> {
    const uploaded = await uploadFile(file) as { id: string };
    return `${directusUrl}/assets/${uploaded.id}`;
  }

  async function handleAttachmentAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newAttachments: Attachment[] = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type,
      isNew: true,
      file: f,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => {
      const a = prev[index];
      if (a.isNew && a.url.startsWith('blob:')) URL.revokeObjectURL(a.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSave() {
    if (!student || !title.trim()) return;
    setIsSaving(true);
    try {
      // Nahrát nové přílohy
      const newUploads: { id: string; name: string; type: string }[] = [];
      for (const a of attachments.filter(a => a.isNew && a.file)) {
        const uploaded = await uploadFile(a.file!) as { id: string };
        newUploads.push({ id: uploaded.id, name: a.name, type: a.type });
      }

      // Sloučit existující + nové přílohy — posíláme přímo jako pole (json field)
      const existingAtts = attachments.filter(a => !a.isNew && a.id)
        .map(a => ({ id: a.id!, name: a.name, type: a.type }));
      const allAtts = [...existingAtts, ...newUploads];

      const pageData = {
        title: title.trim(),
        content,
        category_id: categoryId === 'none' ? undefined : Number(categoryId),
        visibility,
        attachments: allAtts.length > 0 ? allAtts : undefined,
      };

      if (pageId) {
        await directus.request(updateItem('portfolio_pages', pageId, pageData));
      } else {
        await directus.request(
          createItem('portfolio_pages', { ...pageData, student_id: student.id, sort_order: 0 })
        );
      }

      router.push('/dashboard/portfolio');
    } catch (e: unknown) {
      console.error('Save error full:', JSON.stringify(e, null, 2));
      let msg = 'Chyba při ukládání:';
      if (e && typeof e === 'object' && 'errors' in e) {
        const errs = (e as { errors: Array<{ message: string; extensions?: Record<string, unknown> }> }).errors;
        if (errs?.length) {
          msg += '\n' + errs.map((x) => `${x.message} | ${JSON.stringify(x.extensions ?? {})}`).join('\n');
        }
      } else {
        msg += '\n' + String(e);
      }
      alert(msg);
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hlavička */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zpět
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          {pageId ? 'Upravit stránku' : 'Nová stránka portfolia'}
        </h1>
        <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Ukládám...' : 'Uložit'}
        </Button>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-1 md:col-span-1">
          <Label>Název *</Label>
          <Input
            placeholder="Název stránky"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Kategorie</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Bez kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Bez kategorie</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Viditelnost</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-sm font-medium transition-colors ${
                visibility === 'private'
                  ? 'bg-white border-gray-400 text-gray-900 shadow-sm'
                  : 'border-transparent text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Lock className="h-4 w-4" />
              Soukromé
            </button>
            <button
              type="button"
              onClick={() => setVisibility('shared')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-sm font-medium transition-colors ${
                visibility === 'shared'
                  ? 'bg-white border-blue-400 text-blue-700 shadow-sm'
                  : 'border-transparent text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Globe className="h-4 w-4" />
              Sdílené
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-1">
        <Label>Obsah</Label>
        <RichEditor
          content={content}
          onChange={setContent}
          onFileUpload={handleImageUpload}
        />
      </div>

      {/* Přílohy */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Přílohy</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Přidat soubor
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            onChange={handleAttachmentAdd}
          />
        </div>

        {attachments.length === 0 ? (
          <div
            className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 cursor-pointer hover:border-gray-300 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Přetáhněte soubory nebo klikněte pro výběr</p>
            <p className="text-xs mt-1">Obrázky, videa, zvuk, dokumenty (PDF, Word…)</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                {getFileIcon(att.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.name}</p>
                  <p className="text-xs text-gray-500">{att.type}</p>
                </div>
                {att.type.startsWith('audio/') && (
                  <audio controls src={att.url} className="h-8 max-w-48" />
                )}
                {att.type.startsWith('video/') && att.isNew && (
                  <Badge variant="secondary" className="text-xs">Video</Badge>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-500"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              Přidat další
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
