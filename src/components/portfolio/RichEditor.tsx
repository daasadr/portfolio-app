'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { FontFamily } from '@tiptap/extension-font-family';
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  Highlighter,
  Type,
} from 'lucide-react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useLocale } from '@/components/LocaleProvider';
import type { L10n } from '@/lib/i18n';
import { Gallery, countImages, type GalleryImage } from './GalleryNode';
import { optimizeImage } from '@/lib/image-optimize';

/** Photos per page (single pictures + gallery photos) — keeps pages fast to load. */
export const MAX_PAGE_IMAGES = 10;

const COLORS = [
  '#000000', '#374151', '#6B7280', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
];

const HEADING_FONTS: { label: L10n; value: string }[] = [
  { label: { cs: 'Výchozí', en: 'Default' }, value: '' },
  { label: { cs: 'Serif', en: 'Serif' }, value: 'Georgia, serif' },
  { label: { cs: 'Monospace', en: 'Monospace' }, value: 'Courier New, monospace' },
  { label: { cs: 'Kulatý', en: 'Rounded' }, value: '"Trebuchet MS", sans-serif' },
];

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  onFileUpload?: (file: File) => Promise<string>;
}

export default function RichEditor({ content, onChange, onFileUpload }: RichEditorProps) {
  const { t, plural } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, forceUpdate] = useState(0);
  const [uploading, setUploading] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  // editorProps are fixed when the editor is created — paste/drop handlers call the latest insertImages through this ref
  const insertImagesRef = useRef<(files: File[]) => void>(() => {});

  const editor = useEditor({
    extensions: [
      // StarterKit 3.x already bundles Link and Underline — exclude to avoid duplicates
      StarterKit.configure({ link: false, underline: false } as Parameters<typeof StarterKit.configure>[0]),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Gallery,
      Link.configure({ openOnClick: false }),
      Highlight.configure({ multicolor: true }),
      FontFamily,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        // Explicitní velikosti nadpisů — prose-sm je příliš jemné
        class: [
          'prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none',
          '[&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:leading-tight [&_h1]:mt-4 [&_h1]:mb-2',
          '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:mt-3 [&_h2]:mb-1',
          '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:mt-2 [&_h3]:mb-1',
        ].join(' '),
        'data-gramm': 'false',
        'data-gramm_editor': 'false',
        'data-enable-grammarly': 'false',
      },
      // Photos pasted or dropped straight into the text
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'));
        if (files.length === 0) return false;
        insertImagesRef.current(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
        if (files.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (pos) view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(pos.pos))));
        insertImagesRef.current(files);
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const update = () => forceUpdate(n => n + 1);
    editor.on('update', update);
    editor.on('selectionUpdate', update);
    return () => { editor.off('update', update); editor.off('selectionUpdate', update); };
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const url = prompt(t('URL odkazu:', 'Link URL:'));
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor, t]);

  /**
   * Optimizes and uploads photos, then inserts them where the cursor is: one photo as a picture,
   * several as a gallery (smart grid). At most MAX_PAGE_IMAGES photos per page.
   */
  const insertImages = useCallback(async (picked: File[]) => {
    if (!editor) return;
    setImageError(null);
    let files = picked.filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const room = MAX_PAGE_IMAGES - countImages(editor.state.doc);
    if (room <= 0) {
      setImageError(t(`Stránka už má ${MAX_PAGE_IMAGES} fotek, víc se na ni nevejde.`, `This page already has ${MAX_PAGE_IMAGES} photos — no more can be added.`));
      return;
    }
    if (files.length > room) {
      const photos = plural(room, ['fotka', 'fotky', 'fotek'], ['photo', 'photos']);
      setImageError(t(`Na stránku se vejde už jen ${room} ${photos}, vložili jsme prvních ${room}.`, `Only ${room} more ${photos} fit on this page, so the first ${room} were added.`));
      files = files.slice(0, room);
    }

    setUploading(files.length);
    const images: GalleryImage[] = [];
    try {
      for (const original of files) {
        const file = await optimizeImage(original);
        const src = onFileUpload
          ? await onFileUpload(file)
          : await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = e => resolve(e.target?.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
        images.push({ src, alt: original.name.replace(/\.[^.]+$/, '') });
        setUploading(n => n - 1);
      }
    } catch (e) {
      console.error('image upload failed', e);
      setImageError(t('Některou fotku se nepodařilo nahrát. Zkus to prosím znovu.', 'A photo could not be uploaded. Please try again.'));
    } finally {
      setUploading(0);
    }
    if (images.length === 1) {
      editor.chain().focus().setImage({ src: images[0].src, alt: images[0].alt }).run();
    } else if (images.length > 1) {
      editor.chain().focus().insertContent({ type: 'gallery', attrs: { images, layout: 'grid' } }).run();
    }
  }, [editor, onFileUpload, t, plural]);
  insertImagesRef.current = insertImages;

  if (!editor) return null;

  const ToolBtn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${active ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">

        {/* Typ bloku — onMouseDown+preventDefault zachová focus v editoru */}
        <div className="flex items-center mr-1 border rounded overflow-hidden text-xs font-medium">
          {([
            { label: '¶', title: t('Odstavec', 'Paragraph'), onMD: () => editor.chain().focus().setParagraph().run(), active: !editor.isActive('heading') },
            { label: 'H1', title: t('Nadpis 1', 'Heading 1'), onMD: () => editor.chain().focus().setHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
            { label: 'H2', title: t('Nadpis 2', 'Heading 2'), onMD: () => editor.chain().focus().setHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
            { label: 'H3', title: t('Nadpis 3', 'Heading 3'), onMD: () => editor.chain().focus().setHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
          ] as const).map(({ label, title, onMD, active }) => (
            <button
              key={label}
              type="button"
              title={title}
              onMouseDown={(e) => { e.preventDefault(); onMD(); }}
              className={`px-2 py-1 border-r last:border-r-0 transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Font */}
        <select
          className="text-sm border rounded px-1.5 py-1 mr-2 bg-white"
          title={t('Písmo', 'Font')}
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontFamily(e.target.value).run();
            } else {
              editor.chain().focus().unsetFontFamily().run();
            }
          }}
          defaultValue=""
          onMouseDown={() => {
            // preserves TipTap selection when select opens
          }}
        >
          {HEADING_FONTS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value || undefined }}>
              {t(f.label)}
            </option>
          ))}
        </select>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Formátování textu */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title={t('Tučně', 'Bold')}>
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title={t('Kurzíva', 'Italic')}>
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title={t('Podtržení', 'Underline')}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title={t('Přeškrtnutí', 'Strikethrough')}>
          <Strikethrough className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title={t('Zvýraznit', 'Highlight')}>
          <Highlighter className="h-4 w-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Barva textu */}
        <div className="relative flex items-center gap-0.5" title={t('Barva textu', 'Text colour')}>
          <Type className="h-4 w-4 text-gray-600" />
          <div className="flex gap-0.5">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => editor.chain().focus().setColor(color).run()}
                className="w-4 h-4 rounded-sm border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            type="button"
            title={t('Výchozí barva', 'Default colour')}
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="text-xs text-gray-500 hover:text-gray-700 px-1"
          >
            ✕
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Zarovnání */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title={t('Vlevo', 'Align left')}>
          <AlignLeft className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title={t('Na střed', 'Centre')}>
          <AlignCenter className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title={t('Vpravo', 'Align right')}>
          <AlignRight className="h-4 w-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Seznamy */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title={t('Odrážkový seznam', 'Bullet list')}>
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title={t('Číslovaný seznam', 'Numbered list')}>
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Odkaz */}
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title={t('Vložit odkaz', 'Insert link')}>
          <Link2 className="h-4 w-4" />
        </ToolBtn>

        {/* Fotky — víc najednou = galerie */}
        <ToolBtn
          onClick={() => fileInputRef.current?.click()}
          title={t(`Vložit fotky (můžeš vybrat víc najednou, max ${MAX_PAGE_IMAGES} na stránku)`, `Insert photos (pick several at once, max ${MAX_PAGE_IMAGES} per page)`)}
        >
          <ImageIcon className="h-4 w-4" />
        </ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            insertImages(files);
          }}
        />
        {uploading > 0 && (
          <span className="ml-2 flex items-center gap-1.5 text-xs text-blue-700">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            {t(`Upravuji a nahrávám fotky… (${uploading})`, `Optimising and uploading photos… (${uploading})`)}
          </span>
        )}
      </div>
      {imageError && (
        <div className="flex items-center justify-between gap-2 border-b bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
          <span>{imageError}</span>
          <button type="button" onClick={() => setImageError(null)} className="text-amber-700 hover:text-amber-900">✕</button>
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
