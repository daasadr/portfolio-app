'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import { withShareToken } from '@/lib/content-images';

/**
 * Renders a saved portfolio page (sanitized HTML) and opens photos full-screen on click.
 * On a public share link the photos need the share token to load.
 */
export function PageContent({ html, shareToken, className = 'prose prose-sm max-w-none' }: {
  html: string;
  shareToken?: string;
  className?: string;
}) {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<{ src: string; alt: string }[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  const safe = useMemo(() => {
    const clean = DOMPurify.sanitize(html);
    return shareToken ? withShareToken(clean, shareToken) : clean;
  }, [html, shareToken]);

  const onClick = (e: React.MouseEvent) => {
    const img = (e.target as HTMLElement).closest('img');
    if (!img || !ref.current) return;
    const all = Array.from(ref.current.querySelectorAll('img'));
    setPhotos(all.map(i => ({ src: i.currentSrc || i.src, alt: i.alt })));
    setIndex(all.indexOf(img));
  };

  const step = useCallback((dir: 1 | -1) => {
    setIndex(i => (i === null ? i : (i + dir + photos.length) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, step]);

  const current = index !== null ? photos[index] : null;

  return (
    <>
      <div ref={ref} className={`${className} [&_img]:cursor-zoom-in`} onClick={onClick} dangerouslySetInnerHTML={{ __html: safe }} />
      {current && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIndex(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.src} alt={current.alt} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
          <button type="button" onClick={() => setIndex(null)} aria-label={t('Zavřít', 'Close')}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/30">
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={e => { e.stopPropagation(); step(-1); }} aria-label={t('Předchozí fotka', 'Previous photo')}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/30">
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button type="button" onClick={e => { e.stopPropagation(); step(1); }} aria-label={t('Další fotka', 'Next photo')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/30">
                <ChevronRight className="h-7 w-7" />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {index! + 1} / {photos.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
