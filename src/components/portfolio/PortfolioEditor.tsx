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
import { getCurrentStudent, directus, readItems, createItem, updateItem, uploadFile } from '@/lib/directus';
import { loadDraft, discardDraft, useDraftAutosave } from '@/lib/drafts';
import { DraftNotice, DraftHint } from '@/components/DraftNotice';
import type { Student, Category, PortfolioPage } from '@/types';
import RichEditor from './RichEditor';
import { useLocale } from '@/components/LocaleProvider';
import { tr, type Locale } from '@/lib/i18n';

interface PageDraft {
  title: string;
  content: string;
  categoryId: string;
  visibility: 'private' | 'shared';
}

const EMPTY_PAGE: PageDraft = { title: '', content: '', categoryId: 'none', visibility: 'private' };

/** TipTap leaves "<p></p>" in an empty editor — treat it as no content. */
function sameDraft(a: PageDraft, b: PageDraft) {
  const norm = (html: string) => html.replace(/<p><\/p>/g, '').trim();
  return a.title.trim() === b.title.trim() && norm(a.content) === norm(b.content)
    && a.categoryId === b.categoryId && a.visibility === b.visibility;
}

/** Turns a Directus error into a message a pupil understands. */
function saveErrorMessage(e: unknown, locale: Locale): string {
  const errs = e && typeof e === 'object' && 'errors' in e
    ? (e as { errors: Array<{ message: string; extensions?: { code?: string } }> }).errors
    : null;
  const code = errs?.[0]?.extensions?.code;
  const detail = errs?.length ? errs.map(x => x.message).join('\n') : String(e);
  const kept = tr(locale,
    '\n\nTvůj text zůstal uložený jako koncept v tomto prohlížeči, nic se neztratilo.',
    '\n\nYour text is still saved as a draft in this browser, so nothing is lost.');
  const details = tr(locale, 'Podrobnosti', 'Details');
  if (code === 'FORBIDDEN') {
    return tr(locale,
      `Stránku se nepodařilo uložit — tvůj účet k tomu nemá oprávnění. Dej prosím vědět správci aplikace.`,
      `The page could not be saved — your account is not allowed to do this. Please tell the app administrator.`,
    ) + `${kept}\n\n(${details}: ${detail})`;
  }
  if (code === 'TOKEN_EXPIRED' || code === 'INVALID_CREDENTIALS') {
    return tr(locale,
      `Přihlášení vypršelo. Přihlas se prosím znovu v nové záložce a pak zkus uložit znovu.`,
      `You have been logged out. Please log in again in a new tab and then try saving again.`,
    ) + kept;
  }
  return tr(locale,
    `Stránku se nepodařilo uložit. Zkus to prosím za chvíli znovu.`,
    `The page could not be saved. Please try again in a moment.`,
  ) + `${kept}\n\n(${details}: ${detail})`;
}

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

export default function PortfolioEditor({ pageId }: PortfolioEditorProps) {
  const { t, locale } = useLocale();
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

  // Autosaved draft — survives reloads, closed tabs and failed saves
  const draftKey = `portfolio:${pageId ?? 'new'}`;
  const [baseline, setBaseline] = useState<PageDraft>(EMPTY_PAGE);
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const current: PageDraft = { title, content, categoryId, visibility };
  useDraftAutosave(isLoading ? null : draftKey, current, d => sameDraft(d, baseline));

  function applyDraft(d: PageDraft) {
    setTitle(d.title);
    setContent(d.content);
    setCategoryId(d.categoryId);
    setVisibility(d.visibility);
  }

  function discardRestoredDraft() {
    discardDraft(draftKey);
    applyDraft(baseline);
    setEditorKey(k => k + 1); // RichEditor only reads `content` on mount
    setRestoredAt(null);
  }

  // Files picked but not uploaded yet cannot be kept in a draft — warn before leaving
  useEffect(() => {
    if (!attachments.some(a => a.isNew)) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [attachments]);

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

        let loaded: PageDraft = EMPTY_PAGE;
        if (pageId) {
          const pages = await directus.request(
            readItems('portfolio_pages', {
              filter: { id: { _eq: pageId }, student_id: { _eq: s.id } },
              limit: 1,
            })
          ) as PortfolioPage[];
          const page = pages[0];
          if (page) {
            loaded = {
              title: page.title,
              content: page.content ?? '',
              categoryId: page.category_id != null ? String(page.category_id) : 'none',
              visibility: page.visibility,
            };
            applyDraft(loaded);
            if (page.attachments) {
              const rawAtts = page.attachments;
              const saved: Array<{ id: string; name: string; type: string }> =
                Array.isArray(rawAtts) ? rawAtts : JSON.parse(rawAtts as unknown as string);
              setAttachments(saved.map(a => ({
                id: a.id,
                name: a.name,
                url: `/api/asset/${a.id}`,
                type: a.type,
              })));
            }
          }
        }
        setBaseline(loaded);

        // Unsaved text from last time? Bring it back.
        const draft = loadDraft<PageDraft>(`portfolio:${pageId ?? 'new'}`);
        if (draft && !sameDraft(draft.data, loaded)) {
          applyDraft({ ...loaded, ...draft.data });
          setRestoredAt(draft.savedAt);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  async function handleImageUpload(file: File): Promise<string> {
    const uploaded = await uploadFile(file) as { id: string };
    return `/api/asset/${uploaded.id}`;
  }

  const MAX_FILE_MB = 30;

  function addFiles(files: File[]) {
    if (files.length === 0) return;
    const oversized = files.filter(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      alert(`${t(`Tyto soubory jsou příliš velké (max ${MAX_FILE_MB} MB):`, `These files are too big (max ${MAX_FILE_MB} MB):`)}\n${oversized.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join('\n')}`);
      return;
    }
    const newAttachments: Attachment[] = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type,
      isNew: true,
      file: f,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  }

  function handleAttachmentAdd(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('Files')) return;
      e.preventDefault(); // otherwise the browser opens the dropped file instead
      setIsDraggingFiles(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDraggingFiles(false);
    },
    onDrop: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('Files')) return;
      e.preventDefault();
      setIsDraggingFiles(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
  };

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
          createItem('portfolio_pages', { ...pageData, student_id: student.id })
        );
      }

      discardDraft(draftKey);
      router.push('/dashboard/portfolio');
    } catch (e: unknown) {
      console.error('Save error full:', JSON.stringify(e, null, 2));
      alert(saveErrorMessage(e, locale));
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
          {t('Zpět', 'Back')}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          {pageId ? t('Upravit stránku', 'Edit page') : t('Nová stránka portfolia', 'New portfolio page')}
        </h1>
        <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? t('Ukládám...', 'Saving...') : t('Uložit', 'Save')}
        </Button>
      </div>

      {restoredAt && (
        <DraftNotice
          savedAt={restoredAt}
          onDiscard={discardRestoredDraft}
          discardLabel={pageId ? t('Vrátit uloženou verzi', 'Go back to the saved version') : t('Zahodit koncept', 'Discard draft')}
        />
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-1 md:col-span-1">
          <Label>{t('Název *', 'Title *')}</Label>
          <Input
            placeholder={t('Název stránky', 'Page title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>{t('Kategorie', 'Category')}</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder={t('Bez kategorie', 'No category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('Bez kategorie', 'No category')}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>{t('Viditelnost', 'Visibility')}</Label>
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
              {t('Soukromé', 'Private')}
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
              {t('Sdílené', 'Shared')}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {visibility === 'shared'
              ? t('Stránka se zahrne do sdílecích odkazů a uvidí ji propojení učitelé.', 'The page is included in sharing links and your connected teachers can see it.')
              : t('Stránka je viditelná jen tobě. Propojení učitelé ji neuvidí.', 'Only you can see this page. Your connected teachers will not see it.')}
          </p>
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-1">
        <Label>{t('Obsah', 'Content')}</Label>
        <RichEditor
          key={editorKey}
          content={content}
          onChange={setContent}
          onFileUpload={handleImageUpload}
        />
        <DraftHint />
      </div>

      {/* Přílohy */}
      <div
        className={`space-y-3 rounded-lg transition-shadow ${isDraggingFiles ? 'ring-2 ring-blue-400 ring-offset-4' : ''}`}
        {...dropHandlers}
      >
        <div className="flex items-center justify-between">
          <Label>{t('Přílohy', 'Attachments')}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('Přidat soubor', 'Add file')}
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
            className={`border-2 border-dashed rounded-lg p-8 text-center text-gray-700 cursor-pointer transition-colors ${isDraggingFiles ? 'border-blue-400 bg-blue-50/95' : 'border-gray-300 bg-white/85 hover:border-gray-400 hover:bg-white/95'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-8 w-8 mx-auto mb-2 text-gray-500" />
            <p className="text-sm">{t('Přetáhněte soubory nebo klikněte pro výběr', 'Drag files here or click to choose')}</p>
            <p className="text-xs mt-1 text-gray-600">{t('Obrázky, videa, zvuk, dokumenty (PDF, Word…)', 'Pictures, videos, audio, documents (PDF, Word…)')}</p>
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
                  aria-label={t('Odebrat přílohu', 'Remove attachment')}
                  title={t('Odebrat přílohu', 'Remove attachment')}
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
              {t('Přidat další', 'Add more')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
