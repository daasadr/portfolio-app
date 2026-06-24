'use client';

import { useEditor, EditorContent } from '@tiptap/react';
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
import { useCallback, useRef } from 'react';

const COLORS = [
  '#000000', '#374151', '#6B7280', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
];

const HEADING_FONTS = [
  { label: 'Výchozí', value: '' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Monospace', value: 'Courier New, monospace' },
  { label: 'Kulatý', value: '"Trebuchet MS", sans-serif' },
];

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  onFileUpload?: (file: File) => Promise<string>;
}

export default function RichEditor({ content, onChange, onFileUpload }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Highlight.configure({ multicolor: true }),
      FontFamily,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none',
        'data-gramm': 'false',
        'data-gramm_editor': 'false',
        'data-enable-grammarly': 'false',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const url = prompt('URL odkazu:');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback(async (file: File) => {
    if (!editor) return;
    if (onFileUpload) {
      const url = await onFileUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } else {
      // fallback: base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    }
  }, [editor, onFileUpload]);

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
            { label: '¶', title: 'Odstavec', onMD: () => editor.chain().focus().setParagraph().run(), active: !editor.isActive('heading') },
            { label: 'H1', title: 'Nadpis 1', onMD: () => editor.chain().focus().setHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
            { label: 'H2', title: 'Nadpis 2', onMD: () => editor.chain().focus().setHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
            { label: 'H3', title: 'Nadpis 3', onMD: () => editor.chain().focus().setHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
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
          title="Písmo"
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
              {f.label}
            </option>
          ))}
        </select>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Formátování textu */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Tučně">
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Kurzíva">
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Podtržení">
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Přeškrtnutí">
          <Strikethrough className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Zvýraznit">
          <Highlighter className="h-4 w-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Barva textu */}
        <div className="relative flex items-center gap-0.5" title="Barva textu">
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
            title="Výchozí barva"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="text-xs text-gray-500 hover:text-gray-700 px-1"
          >
            ✕
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Zarovnání */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Vlevo">
          <AlignLeft className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Na střed">
          <AlignCenter className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Vpravo">
          <AlignRight className="h-4 w-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Seznamy */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Odrážkový seznam">
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Číslovaný seznam">
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Odkaz */}
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Vložit odkaz">
          <Link2 className="h-4 w-4" />
        </ToolBtn>

        {/* Obrázek */}
        <ToolBtn
          onClick={() => fileInputRef.current?.click()}
          title="Vložit obrázek"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) insertImage(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
