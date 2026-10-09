'use client';

import type { ReactNode } from 'react';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ReadingDiaryEntry } from '@/types';

// Shared look of the reading diary — used by the pupil's own diary and the teacher view.

// ── Book looks — derived from the entry id, so each book keeps its look forever ──
const COVERS = [
  { bg: '#8b2c2c', text: '#f7ecd4' }, // cihlová
  { bg: '#1f3a5f', text: '#f2e6c9' }, // námořnická
  { bg: '#2f5d3a', text: '#f2e8cc' }, // lesní
  { bg: '#c9962f', text: '#2b1d0a' }, // hořčicová
  { bg: '#5b3a62', text: '#f3e7d0' }, // švestková
  { bg: '#1f6f6b', text: '#f0e9d2' }, // petrolejová
  { bg: '#6b4226', text: '#f5e9cf' }, // oříšková
  { bg: '#3f4a59', text: '#efe5cc' }, // břidlicová
  { bg: '#7a1f3d', text: '#f6e8d3' }, // vínová
  { bg: '#d9c7a3', text: '#3a2a14' }, // plátěná
];

function seeded(id: number, salt: number) {
  const x = Math.sin(id * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
}

function bookLook(id: number) {
  return {
    cover: COVERS[id % COVERS.length],
    width: 74 + Math.round(seeded(id, 1) * 22),          // % šířky hromádky
    height: 44 + Math.round(seeded(id, 2) * 18),         // px
    shift: Math.round((seeded(id, 3) - 0.5) * 36),       // px do stran
    tilt: ((seeded(id, 4) - 0.5) * 2.4).toFixed(2),      // stupně
    bands: Math.floor(seeded(id, 5) * 3),                // 0 = pásky, 1 = štítek, 2 = rámeček
  };
}

export function booksLabel(n: number) {
  if (n === 1) return '1 kniha';
  if (n >= 2 && n <= 4) return `${n} knihy`;
  return `${n} knih`;
}

export function formatDiaryDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function BookshelfStyles() {
  return (
    <style>{`
      .rd-book {
        transform: translateX(var(--shift)) rotate(var(--tilt));
        box-shadow: 0 2px 0 rgba(0,0,0,.18), 0 4px 8px -2px rgba(0,0,0,.35);
        transition: transform .25s ease, box-shadow .25s ease;
      }
      .rd-book:hover, .rd-book:focus-visible {
        transform: translateX(calc(var(--shift) + 14px)) rotate(0deg);
        box-shadow: 0 2px 0 rgba(0,0,0,.18), 0 10px 18px -4px rgba(0,0,0,.45);
        z-index: 10;
      }
      @keyframes rdDrop {
        0%   { opacity: 0; transform: translate(var(--shift), -60px) rotate(-6deg); }
        70%  { opacity: 1; transform: translate(var(--shift), 4px) rotate(var(--tilt)); }
        100% { transform: translateX(var(--shift)) rotate(var(--tilt)); }
      }
      .rd-drop { animation: rdDrop .6s cubic-bezier(.2,.8,.3,1.2) backwards; }
      .rd-page {
        background:
          radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.6), rgba(255,255,255,0) 60%),
          #fbf5e6;
      }
      .rd-page-left  { box-shadow: inset -22px 0 24px -18px rgba(90,60,20,.45); }
      .rd-page-right { box-shadow: inset 22px 0 24px -18px rgba(90,60,20,.45); }
      @media (max-width: 767px) {
        .rd-page-left, .rd-page-right { box-shadow: none; }
        .rd-page-right { border-top: 1px dashed rgba(120,90,40,.25); }
      }
      @keyframes rdTurn {
        from { transform: perspective(1400px) rotateY(-75deg); opacity: .4; }
        to   { transform: perspective(1400px) rotateY(0); opacity: 1; }
      }
      @media (min-width: 768px) {
        .rd-page-right { transform-origin: left center; animation: rdTurn .55s cubic-bezier(.2,.7,.3,1) both; }
      }
      @media (prefers-reduced-motion: reduce) {
        .rd-drop, .rd-page-right { animation: none; }
        .rd-book { transition: none; }
      }
    `}</style>
  );
}

// ── Spine of one book in the pile ──
// `ribbon` marks books the pupil shares with their teacher (shown only in the pupil's own diary).
export function BookSpine({ entry, isNew = false, ribbon = false, onOpen }: {
  entry: ReadingDiaryEntry;
  isNew?: boolean;
  ribbon?: boolean;
  onOpen: () => void;
}) {
  const look = bookLook(entry.id);
  const { bg, text } = look.cover;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Otevřít záznam: ${entry.title}${ribbon ? ' (sdíleno s učitelem)' : ''}`}
      className={`rd-book group relative block mx-auto rounded-[4px] focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${isNew ? 'rd-drop' : ''}`}
      style={{
        width: `${look.width}%`,
        height: look.height,
        ['--shift' as string]: `${look.shift}px`,
        ['--tilt' as string]: `${look.tilt}deg`,
        background: `linear-gradient(180deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,.22) 100%), ${bg}`,
        color: text,
      }}
    >
      {/* hřbetní zakulacení na koncích */}
      <span className="absolute inset-y-0 left-0 w-3 rounded-l-[4px]" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.28), rgba(0,0,0,0))' }} />
      <span className="absolute inset-y-0 right-0 w-3 rounded-r-[4px]" style={{ background: 'linear-gradient(270deg, rgba(0,0,0,.28), rgba(0,0,0,0))' }} />

      {look.bands === 0 && (
        <>
          <span className="absolute inset-y-1.5 left-[9%] w-[3px] rounded-full opacity-70" style={{ background: text }} />
          <span className="absolute inset-y-1.5 left-[11%] w-[1px] opacity-60" style={{ background: text }} />
          <span className="absolute inset-y-1.5 right-[11%] w-[1px] opacity-60" style={{ background: text }} />
          <span className="absolute inset-y-1.5 right-[9%] w-[3px] rounded-full opacity-70" style={{ background: text }} />
        </>
      )}
      {look.bands === 2 && (
        <span className="absolute inset-[5px] rounded-[2px] opacity-50" style={{ border: `1px solid ${text}` }} />
      )}

      {/* záložka = sdíleno s učitelem */}
      {ribbon && (
        <span
          aria-hidden
          className="absolute right-[6%] top-full z-20 h-4 w-2.5"
          style={{ background: '#e4b43c', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)' }}
        />
      )}

      <span className="relative z-10 flex h-full items-center justify-center gap-3 px-[14%]">
        <span
          className={`truncate font-serif font-semibold tracking-wide ${look.height > 52 ? 'text-base' : 'text-sm'} ${look.bands === 1 ? 'rounded-sm px-3 py-0.5' : ''}`}
          style={look.bands === 1 ? { background: 'rgba(255,250,235,.92)', color: '#2b1d0a' } : undefined}
        >
          {entry.title}
        </span>
        <span className="hidden sm:inline truncate max-w-[30%] font-serif text-xs italic opacity-75">{entry.author}</span>
      </span>
    </button>
  );
}

/** The wooden table the pile rests on. */
export function BookTable() {
  return (
    <div
      className="mt-1 h-4 rounded-md"
      style={{ background: 'linear-gradient(180deg, #a5753f 0%, #8a5d2c 60%, #6e4720 100%)', boxShadow: '0 6px 12px -4px rgba(60,35,10,.45)' }}
    />
  );
}

// ── The opened book (render inside a DialogContent) ──
export function OpenBook({ entry, note, actions }: { entry: ReadingDiaryEntry; note?: ReactNode; actions?: ReactNode }) {
  const { bg } = bookLook(entry.id).cover;
  return (
    <div className="rounded-2xl p-2.5 sm:p-3 shadow-2xl" style={{ background: bg }}>
      <div className="grid md:grid-cols-2 rounded-lg overflow-hidden max-h-[80vh] overflow-y-auto md:overflow-visible">
        {/* Levá stránka */}
        <div className="rd-page rd-page-left relative px-6 py-7 sm:px-8 md:max-h-[76vh] md:overflow-y-auto">
          <p className="text-[11px] uppercase tracking-[0.25em] text-amber-900/50 mb-4">Čtenářský deník</p>
          <DialogTitle className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-stone-900">
            {entry.title}
          </DialogTitle>
          <DialogDescription className="font-serif italic text-lg text-stone-700 mt-1">
            {entry.author}
          </DialogDescription>
          <p className="text-xs text-stone-500 mt-3">Zapsáno {formatDiaryDate(entry.date_created)}</p>
          <p className="text-center text-amber-800/40 my-5 select-none" aria-hidden>❦</p>
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-amber-900/70 mb-2">O čem kniha je</h3>
          <p className="font-serif text-[15px] leading-relaxed text-stone-800 whitespace-pre-wrap">
            {entry.summary || <span className="italic text-stone-400">Bez obsahu</span>}
          </p>
        </div>

        {/* Pravá stránka */}
        <div className="rd-page rd-page-right relative px-6 py-7 sm:px-8 flex flex-col md:max-h-[76vh] md:overflow-y-auto">
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-amber-900/70 mb-2">Můj názor</h3>
          <p className="font-serif text-[15px] leading-relaxed text-stone-800 whitespace-pre-wrap">
            {entry.opinion || <span className="italic text-stone-400">Zatím bez názoru</span>}
          </p>

          {entry.notes && (
            <>
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-amber-900/70 mt-6 mb-2">Poznámky</h3>
              <p className="font-serif text-[15px] leading-relaxed text-stone-800 whitespace-pre-wrap">{entry.notes}</p>
            </>
          )}

          {(note || actions) && (
            <div className="mt-auto pt-8 flex flex-wrap items-center justify-end gap-2">
              {note && <span className="mr-auto text-xs text-stone-500">{note}</span>}
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Classes for a DialogContent that hosts an OpenBook (transparent frame, light close button). */
export const OPEN_BOOK_DIALOG_CLASS =
  'max-w-4xl p-0 border-0 bg-transparent shadow-none sm:rounded-2xl [&>button:last-child]:text-white [&>button:last-child]:opacity-90 [&>button:last-child]:right-5 [&>button:last-child]:top-5 [&>button:last-child]:z-20';
