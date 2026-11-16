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
import { Checkbox } from '@/components/ui/checkbox';
import { BookMarked, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  BookshelfStyles, BookSpine, BookTable, OpenBook, OPEN_BOOK_DIALOG_CLASS, booksLabel, formatDiaryDate,
} from '@/components/reading-diary/Bookshelf';
import { loadDraft, discardDraft, useDraftAutosave } from '@/lib/drafts';
import { notifyAchievementsChanged } from '@/components/achievements/AchievementShelf';
import { DraftNotice, DraftHint } from '@/components/DraftNotice';
import type { ReadingDiaryEntry } from '@/types';
import { useLocale } from '@/components/LocaleProvider';

const EMPTY_FORM = { title: '', author: '', summary: '', opinion: '', notes: '', share_with_teacher: false };
type DiaryForm = typeof EMPTY_FORM;

const sameForm = (a: DiaryForm, b: DiaryForm) =>
  (Object.keys(EMPTY_FORM) as (keyof DiaryForm)[]).every(k =>
    typeof a[k] === 'string' ? String(a[k]).trim() === String(b[k]).trim() : a[k] === b[k]);

export default function ReadingDiaryPage() {
  const { t, locale } = useLocale();
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

  // Autosaved draft of the open form
  const draftKey = formOpen ? `reading-diary:${editing?.id ?? 'new'}` : null;
  const [formBaseline, setFormBaseline] = useState<DiaryForm>(EMPTY_FORM);
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  useDraftAutosave(draftKey, form, f => sameForm(f, formBaseline));

  /** Opens the form with `base`, refilled from an unsaved draft when there is one. */
  function startForm(key: string, base: DiaryForm) {
    setFormBaseline(base);
    const draft = loadDraft<DiaryForm>(key);
    if (draft && !sameForm({ ...base, ...draft.data }, base)) {
      setForm({ ...base, ...draft.data });
      setRestoredAt(draft.savedAt);
    } else {
      setForm(base);
      setRestoredAt(null);
    }
    setFormError('');
    setFormOpen(true);
  }

  useEffect(() => {
    fetch('/api/reading-diary')
      .then(async r => {
        if (!r.ok) throw new Error();
        const data = await r.json() as { entries: ReadingDiaryEntry[] };
        setEntries(data.entries ?? []);
      })
      .catch(() => setLoadError(t('Čtenářský deník se nepodařilo načíst. Zkus to prosím za chvíli.', 'Your reading diary could not be loaded. Please try again in a moment.')))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNewForm() {
    setEditing(null);
    startForm('reading-diary:new', EMPTY_FORM);
  }

  function openEditForm(entry: ReadingDiaryEntry) {
    setEditing(entry);
    setOpenEntry(null);
    startForm(`reading-diary:${entry.id}`, {
      title: entry.title,
      author: entry.author,
      summary: entry.summary ?? '',
      opinion: entry.opinion ?? '',
      notes: entry.notes ?? '',
      share_with_teacher: !!entry.share_with_teacher,
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setFormError(t('Vyplň název knihy', 'Fill in the book title'));
    if (!form.author.trim()) return setFormError(t('Vyplň autora knihy', 'Fill in the author'));
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
      setFormError(`${err.message ?? t('Uložení se nepovedlo. Zkus to znovu.', 'Saving did not work. Please try again.')} ${t('Rozepsaný text máš uložený jako koncept.', 'Your unfinished text is saved as a draft.')}`);
      return;
    }
    const { entry } = await res.json() as { entry: ReadingDiaryEntry };
    discardDraft(`reading-diary:${editing?.id ?? 'new'}`);
    setRestoredAt(null);
    notifyAchievementsChanged();
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
    if (!confirm(t(`Opravdu smazat „${entry.title}“ z čtenářského deníku?`, `Really delete “${entry.title}” from your reading diary?`))) return;
    const res = await fetch(`/api/reading-diary/${entry.id}`, { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) {
      alert(t('Smazání se nepovedlo. Zkus to znovu.', 'Deleting did not work. Please try again.'));
      return;
    }
    setEntries(prev => prev.filter(x => x.id !== entry.id));
    setOpenEntry(null);
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <BookshelfStyles />

      {/* Hlavička */}
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 px-5 py-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-amber-700" /> {t('Čtenářský deník', 'Reading diary')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {entries.length
              ? `${t('Přečteno', 'Books read')}: ${booksLabel(entries.length, locale)}`
              : t('Sem si zapisuj knížky, které přečteš.', 'Write down the books you read here.')}
          </p>
        </div>
        <Button onClick={openNewForm} className="bg-amber-700 hover:bg-amber-800">
          <Plus className="h-4 w-4 mr-1.5" /> {t('Přidat knihu', 'Add a book')}
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
              {t('Tady bude tvoje první kniha', 'Your first book will go here')}
            </div>
            <Button variant="outline" onClick={openNewForm} className="mt-6">
              <Plus className="h-4 w-4 mr-1.5" /> {t('Zapsat první přečtenou knihu', 'Write down your first book')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-[3px]">
            {entries.map(entry => (
              <BookSpine
                key={entry.id}
                entry={entry}
                isNew={entry.id === newestId}
                ribbon={!!entry.share_with_teacher}
                onOpen={() => setOpenEntry(entry)}
              />
            ))}
          </div>
        )}

        <BookTable />
        {entries.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            {t('Klikni na knížku a otevři si svůj zápis.', 'Click a book to open what you wrote.')}
            {entries.some(e => e.share_with_teacher) && (
              <span className="inline-flex items-center gap-1 ml-1">
                {t('Knížky se', 'Your teacher can see books with a')}{' '}
                <span aria-hidden className="inline-block h-3 w-2 align-middle" style={{ background: '#e4b43c', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)' }} />
                {' '}{t('záložkou vidí tvůj učitel.', 'bookmark.')}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Otevřená kniha */}
      <Dialog open={!!openEntry} onOpenChange={open => { if (!open) setOpenEntry(null); }}>
        <DialogContent className={OPEN_BOOK_DIALOG_CLASS}>
          {openEntry && (
            <OpenBook
              entry={openEntry}
              note={openEntry.share_with_teacher ? t('🔖 Vidí tvůj učitel', '🔖 Your teacher can see this') : t('🔒 Jen pro tebe', '🔒 Just for you')}
              actions={
                <>
                  <Button variant="outline" size="sm" onClick={() => openEditForm(openEntry)} className="bg-white/60">
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> {t('Upravit', 'Edit')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(openEntry)} className="bg-white/60 text-red-700 hover:text-red-800">
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> {t('Smazat', 'Delete')}
                  </Button>
                </>
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Formulář */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t('Upravit záznam', 'Edit entry') : t('Nová přečtená kniha', 'A new book I have read')}</DialogTitle>
            <DialogDescription>
              {editing
                ? `${t('Zapsáno', 'Written on')} ${formatDiaryDate(editing.date_created, locale)}`
                : t('Datum zápisu se uloží samo.', 'The date is saved automatically.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {restoredAt && (
              <DraftNotice
                savedAt={restoredAt}
                onDiscard={() => {
                  discardDraft(`reading-diary:${editing?.id ?? 'new'}`);
                  setForm(formBaseline);
                  setRestoredAt(null);
                }}
              />
            )}
            <div className="space-y-1.5">
              <Label htmlFor="rd-title">{t('Název knihy *', 'Book title *')}</Label>
              <Input id="rd-title" value={form.title} maxLength={200} required
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t('např. Malý princ', 'e.g. The Little Prince')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-author">{t('Autor *', 'Author *')}</Label>
              <Input id="rd-author" value={form.author} maxLength={200} required
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder={t('např. Antoine de Saint-Exupéry', 'e.g. Antoine de Saint-Exupéry')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-summary">{t('Stručný obsah', 'Short summary')}</Label>
              <Textarea id="rd-summary" value={form.summary} maxLength={5000} rows={4}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder={t('O čem kniha je? Kdo v ní vystupuje a co se stane?', 'What is the book about? Who is in it and what happens?')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-opinion">{t('Můj názor na knihu', 'What I think of the book')}</Label>
              <Textarea id="rd-opinion" value={form.opinion} maxLength={5000} rows={3}
                onChange={e => setForm(f => ({ ...f, opinion: e.target.value }))} placeholder={t('Líbila se ti? Co tě nejvíc zaujalo?', 'Did you like it? What caught your interest most?')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-notes">{t('Poznámky', 'Notes')}</Label>
              <Textarea id="rd-notes" value={form.notes} maxLength={5000} rows={2}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('Cokoliv dalšího — oblíbený citát, komu bys ji doporučil/a…', 'Anything else — a favourite quote, who you would recommend it to…')} />
            </div>
            <label htmlFor="rd-share" className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5 cursor-pointer">
              <Checkbox id="rd-share" className="mt-0.5" checked={form.share_with_teacher}
                onCheckedChange={v => setForm(f => ({ ...f, share_with_teacher: v === true }))} />
              <span className="text-sm">
                <span className="font-medium text-gray-900">{t('Ukázat učiteli', 'Show my teacher')}</span>
                <span className="block text-xs text-gray-500">{t('Když to nezaškrtneš, zápis uvidíš jen ty.', 'If you leave this unticked, only you will see the entry.')}</span>
              </span>
            </label>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <DraftHint />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>{t('Zrušit', 'Cancel')}</Button>
              <Button type="submit" disabled={saving} className="bg-amber-700 hover:bg-amber-800">
                {saving ? t('Ukládám…', 'Saving…') : editing ? t('Uložit změny', 'Save changes') : t('Uložit do deníku', 'Save to diary')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
