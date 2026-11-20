'use client';

import { Node, mergeAttributes, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';
import { LayoutGrid, Rows3, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';

/**
 * Galerie fotek uvnitř textu stránky. V HTML je to
 *   <div data-type="gallery" class="pp-gallery" data-layout="grid|stack" data-count="3"><img …><img …></div>
 * a rozložení (chytrá mřížka podle počtu fotek) řeší CSS v globals.css, takže vypadá stejně
 * v editoru, při prohlížení, u učitele, ve sdíleném odkazu i v exportu.
 */

export interface GalleryImage { src: string; alt: string }
export type GalleryLayout = 'grid' | 'stack';

export const Gallery = Node.create({
  name: 'gallery',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      images: {
        default: [] as GalleryImage[],
        parseHTML: (el: HTMLElement) =>
          Array.from(el.querySelectorAll('img'))
            .map(img => ({ src: img.getAttribute('src') ?? '', alt: img.getAttribute('alt') ?? '' }))
            .filter(img => img.src),
        renderHTML: () => ({}), // rendered as <img> children below
      },
      layout: {
        default: 'grid' as GalleryLayout,
        parseHTML: (el: HTMLElement) => (el.getAttribute('data-layout') === 'stack' ? 'stack' : 'grid'),
        renderHTML: (attrs: { layout: GalleryLayout }) => ({ 'data-layout': attrs.layout }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const images = (node.attrs.images ?? []) as GalleryImage[];
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'gallery', class: 'pp-gallery', 'data-count': String(images.length) }),
      ...images.map(img => ['img', { src: img.src, alt: img.alt ?? '', loading: 'lazy' }]),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryView);
  },
});

/** Number of photos in an editor document (single images + photos inside galleries). */
export function countImages(doc: { descendants: (f: (node: { type: { name: string }; attrs: Record<string, unknown> }) => void) => void }) {
  let n = 0;
  doc.descendants(node => {
    if (node.type.name === 'image') n += 1;
    if (node.type.name === 'gallery') n += ((node.attrs.images as GalleryImage[] | undefined) ?? []).length;
  });
  return n;
}

function GalleryView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const { t, plural } = useLocale();
  const images = (node.attrs.images ?? []) as GalleryImage[];
  const layout = (node.attrs.layout ?? 'grid') as GalleryLayout;

  const setImages = (next: GalleryImage[]) => {
    if (next.length === 0) deleteNode();
    else updateAttributes({ images: next });
  };
  const remove = (i: number) => setImages(images.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    setImages(next);
  };

  const btn = 'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors';
  return (
    <NodeViewWrapper className={`relative my-3 rounded-xl ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`} data-drag-handle>
      <div className="mb-1.5 flex flex-wrap items-center gap-1" contentEditable={false}>
        <span className="mr-1 text-xs text-gray-500">
          {t('Galerie', 'Gallery')} · {images.length} {plural(images.length, ['fotka', 'fotky', 'fotek'], ['photo', 'photos'])}
        </span>
        <button type="button" onClick={() => updateAttributes({ layout: 'grid' })}
          className={`${btn} ${layout === 'grid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <LayoutGrid className="h-3.5 w-3.5" /> {t('Mřížka', 'Grid')}
        </button>
        <button type="button" onClick={() => updateAttributes({ layout: 'stack' })}
          className={`${btn} ${layout === 'stack' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Rows3 className="h-3.5 w-3.5" /> {t('Pod sebou', 'Stacked')}
        </button>
      </div>
      <div className="pp-gallery" data-layout={layout} data-count={images.length} contentEditable={false}>
        {images.map((img, i) => (
          <div key={`${img.src}-${i}`} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} draggable={false} />
            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {i > 0 && (
                <button type="button" onClick={() => move(i, -1)} title={t('Posunout dopředu', 'Move earlier')}
                  className="rounded-full bg-white/90 p-1 text-gray-700 shadow hover:bg-white">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
              {i < images.length - 1 && (
                <button type="button" onClick={() => move(i, 1)} title={t('Posunout dozadu', 'Move later')}
                  className="rounded-full bg-white/90 p-1 text-gray-700 shadow hover:bg-white">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
              <button type="button" onClick={() => remove(i)} title={t('Odebrat fotku', 'Remove photo')}
                className="rounded-full bg-white/90 p-1 text-red-600 shadow hover:bg-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
}
