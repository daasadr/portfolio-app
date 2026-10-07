'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookMarked, Plus, Pencil, Trash2 } from 'lucide-react';
import type { ReadingDiaryEntry } from '@/types';

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

function booksLabel(n: number) {
  if (n === 1) return '1 kniha';
  if (n >= 2 && n <= 4) return `${n} knihy`;
  return `${n} knih`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

const EMPTY_FORM = { title: '', author: '', summary: '', opinion: '', notes: '' };

// ── Spine of one book in the pile ──
function BookSpine({ entry, isNew, onOpen }: { entry: ReadingDiaryEntry; isNew: boolean; onOpen: () => void }) {
  const look = bookLook(entry.id);
  const { bg, text } = look.cover;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Otevřít záznam: ${entry.title}`}
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

// ── The opened book ──
function OpenBook({ entry, onEdit, onDelete }: { entry: ReadingDiaryEntry; onEdit: () => void; onDelete: () => void }) {
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
          <p className="text-xs text-stone-500 mt-3">Zapsáno {formatDate(entry.date_created)}</p>
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

          <div className="mt-auto pt-8 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="bg-white/60">
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Upravit
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="bg-white/60 text-red-700 hover:text-red-800">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Smazat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReadingDiaryPage() {
  const [entries, setEntries] = useState<ReadingDiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [openEntry, setOpenEntry] = useState<ReadingDiaryEntry | null>(null);
  const [newestId, setNewestId] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReadingDiaryEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/reading-diary')
      .then(async r => {
        if (!r.ok) throw new Error();
        const data = await r.json() as { entries: ReadingDiaryEntry[] };
        setEntries(data.entries ?? []);
      })
      .catch(() => setLoadError('Čtenářský deník se nepodařilo načíst. Zkus to prosím za chvíli.'))
      .finally(() => setIsLoading(false));
  }, []);

  function openNewForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  }

  function openEditForm(entry: ReadingDiaryEntry) {
    setEditing(entry);
    setForm({
      title: entry.title,
      author: entry.author,
      summary: entry.summary ?? '',
      opinion: entry.opinion ?? '',
      notes: entry.notes ?? '',
    });
    setFormError('');
    setOpenEntry(null);
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setFormError('Vyplň název knihy');
    if (!form.author.trim()) return setFormError('Vyplň autora knihy');
    setSaving(true);
    setFormError('');
    const res = await fetch(editing ? `/api/reading-diary/${editing.id}` : '/api/reading-diary', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const err = res ? await res.json().catch(() => ({})) as { message?: string } : {};
      setFormError(err.message ?? 'Uložení se nepovedlo. Zkus to znovu.');
      return;
    }
    const { entry } = await res.json() as { entry: ReadingDiaryEntry };
    if (editing) {
      setEntries(prev => prev.map(x => x.id === entry.id ? entry : x));
      setOpenEntry(entry);
    } else {
      setEntries(prev => [entry, ...prev]);
      setNewestId(entry.id);
    }
    setFormOpen(false);
  }

  async function handleDelete(entry: ReadingDiaryEntry) {
    if (!confirm(`Opravdu smazat „${entry.title}“ z čtenářského deníku?`)) return;
    const res = await fetch(`/api/reading-diary/${entry.id}`, { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) {
      alert('Smazání se nepovedlo. Zkus to znovu.');
      return;
    }
    setEntries(prev => prev.filter(x => x.id !== entry.id));
    setOpenEntry(null);
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
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

      {/* Hlavička */}
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 px-5 py-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-amber-700" /> Čtenářský deník
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {entries.length ? `Přečteno: ${booksLabel(entries.length)}` : 'Sem si zapisuj knížky, které přečteš.'}
          </p>
        </div>
        <Button onClick={openNewForm} className="bg-amber-700 hover:bg-amber-800">
          <Plus className="h-4 w-4 mr-1.5" /> Přidat knihu
        </Button>
      </div>

      {/* Hromádka knih */}
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-100 px-4 sm:px-10 pt-10 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700" />
          </div>
        ) : loadError ? (
          <p className="text-center text-sm text-red-600 py-12">{loadError}</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-10">
            <div className="mx-auto w-3/4 h-12 rounded border-2 border-dashed border-amber-300/80 flex items-center justify-center text-amber-700/70 text-sm font-serif italic">
              Tady bude tvoje první kniha
            </div>
            <Button variant="outline" onClick={openNewForm} className="mt-6">
              <Plus className="h-4 w-4 mr-1.5" /> Zapsat první přečtenou knihu
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-[3px]">
            {entries.map(entry => (
              <BookSpine
                key={entry.id}
                entry={entry}
                isNew={entry.id === newestId}
                onOpen={() => setOpenEntry(entry)}
              />
            ))}
          </div>
        )}

        {/* Stůl, na kterém hromádka leží */}
        <div
          className="mt-1 h-4 rounded-md"
          style={{ background: 'linear-gradient(180deg, #a5753f 0%, #8a5d2c 60%, #6e4720 100%)', boxShadow: '0 6px 12px -4px rgba(60,35,10,.45)' }}
        />
        {entries.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">Klikni na knížku a otevři si svůj zápis.</p>
        )}
      </div>

      {/* Otevřená kniha */}
      <Dialog open={!!openEntry} onOpenChange={open => { if (!open) setOpenEntry(null); }}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none sm:rounded-2xl [&>button:last-child]:text-white [&>button:last-child]:opacity-90 [&>button:last-child]:right-5 [&>button:last-child]:top-5 [&>button:last-child]:z-20">
          {openEntry && (
            <OpenBook
              entry={openEntry}
              onEdit={() => openEditForm(openEntry)}
              onDelete={() => handleDelete(openEntry)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Formulář */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Upravit záznam' : 'Nová přečtená kniha'}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Zapsáno ${formatDate(editing.date_created)}`
                : 'Datum zápisu se uloží samo.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rd-title">Název knihy *</Label>
              <Input id="rd-title" value={form.title} maxLength={200} required
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="např. Malý princ" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-author">Autor *</Label>
              <Input id="rd-author" value={form.author} maxLength={200} required
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="např. Antoine de Saint-Exupéry" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-summary">Stručný obsah</Label>
              <Textarea id="rd-summary" value={form.summary} maxLength={5000} rows={4}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="O čem kniha je? Kdo v ní vystupuje a co se stane?" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-opinion">Můj názor na knihu</Label>
              <Textarea id="rd-opinion" value={form.opinion} maxLength={5000} rows={3}
                onChange={e => setForm(f => ({ ...f, opinion: e.target.value }))} placeholder="Líbila se ti? Co tě nejvíc zaujalo?" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-notes">Poznámky</Label>
              <Textarea id="rd-notes" value={form.notes} maxLength={5000} rows={2}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Cokoliv dalšího — oblíbený citát, komu bys ji doporučil/a…" />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Zrušit</Button>
              <Button type="submit" disabled={saving} className="bg-amber-700 hover:bg-amber-800">
                {saving ? 'Ukládám…' : editing ? 'Uložit změny' : 'Uložit do deníku'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
