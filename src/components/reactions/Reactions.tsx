'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import { REACTIONS, REACTION_TYPES, type PageReactionSummary, type ReactionType, type ReceivedReaction } from '@/lib/reactions';
import { notifyAchievementsChanged } from '@/components/achievements/AchievementShelf';

interface ReactionsResponse { reactions: Record<string, PageReactionSummary>; canReact?: string[]; available?: boolean }

/** Loads reaction summaries for several pages at once (lists). */
export function usePageReactions(pageIds: (string | number)[]) {
  const key = [...new Set(pageIds.map(String))].sort().join(',');
  const [data, setData] = useState<Record<string, PageReactionSummary>>({});
  const [canReact, setCanReact] = useState<Set<string>>(new Set());
  const [available, setAvailable] = useState(true);

  const reload = useCallback(async () => {
    if (!key) { setData({}); return; }
    try {
      const res = await fetch(`/api/reactions?pages=${encodeURIComponent(key)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json() as ReactionsResponse;
      setData(json.reactions ?? {});
      setCanReact(new Set(json.canReact ?? []));
      setAvailable(json.available !== false);
    } catch { /* offline — reactions are a nice-to-have */ }
  }, [key]);

  useEffect(() => { reload(); }, [reload]);
  return { reactions: data, setReactions: setData, canReact, available, reload };
}

const total = (s?: PageReactionSummary) => (s ? REACTION_TYPES.reduce((n, t) => n + s.counts[t], 0) : 0);

/** Small emoji counters for page lists. Renders nothing when the page has no reactions. */
export function ReactionChips({ summary, className = '' }: { summary?: PageReactionSummary; className?: string }) {
  const { t } = useLocale();
  if (!summary || total(summary) === 0) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {REACTION_TYPES.filter(type => summary.counts[type] > 0).map(type => (
        <span
          key={type}
          title={t(REACTIONS[type].label)}
          className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] font-medium leading-none ${REACTIONS[type].tone} ${summary.mine.includes(type) ? 'ring-1 ring-offset-1 ring-current' : ''}`}
        >
          <span aria-hidden>{REACTIONS[type].emoji}</span>
          {summary.counts[type]}
        </span>
      ))}
    </span>
  );
}

/**
 * Toggle buttons for someone who can see the page (a connected teacher or contact).
 * The page owner uses <ReactionSummary> instead.
 */
export function ReactionPicker({ pageId }: { pageId: string | number }) {
  const { t } = useLocale();
  const id = String(pageId);
  const { reactions, setReactions, canReact, available } = usePageReactions([id]);
  const [busy, setBusy] = useState<ReactionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [popped, setPopped] = useState<ReactionType | null>(null);

  if (!available || !canReact.has(id)) return null;
  const summary = reactions[id];

  async function toggle(type: ReactionType) {
    if (busy) return;
    setBusy(type);
    setError(null);
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: id, type }),
      });
      const json = await res.json().catch(() => ({})) as { reaction?: PageReactionSummary; active?: boolean; message?: string };
      if (!res.ok || !json.reaction) throw new Error(json.message ?? t('Reakci se nepodařilo uložit.', 'Could not save the reaction.'));
      setReactions(prev => ({ ...prev, [id]: json.reaction! }));
      if (json.active) { setPopped(type); setTimeout(() => setPopped(null), 700); }
      notifyAchievementsChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white px-5 py-4">
      <style>{`@keyframes ppReactPop { 0% { transform: scale(1) } 40% { transform: scale(1.45) rotate(-8deg) } 100% { transform: scale(1) } } .pp-react-pop { animation: ppReactPop .6s ease-out }`}</style>
      <p className="mb-3 text-sm font-medium text-gray-800">
        {t('Dej najevo, že jsi stránku viděl/a a líbí se ti:', "Show that you've seen this page and like it:")}
      </p>
      <div className="flex flex-wrap gap-2">
        {REACTION_TYPES.map(type => {
          const active = summary?.mine.includes(type) ?? false;
          const r = REACTIONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              disabled={busy !== null}
              aria-pressed={active}
              title={active ? t(`${r.label.cs} — kliknutím odebereš`, `${r.label.en} — click to remove`) : t(r.label)}
              className={`flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-all disabled:opacity-60 ${
                active ? `${r.tone} border-current shadow-sm` : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={`text-lg leading-none ${popped === type ? 'pp-react-pop' : ''}`} aria-hidden>{r.emoji}</span>
              <span>{t(r.label)}</span>
              {(summary?.counts[type] ?? 0) > 0 && <span className="text-xs opacity-70">{summary!.counts[type]}</span>}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

const seenKey = (studentId: string | number) => `pp_reactions_seen_${studentId}`;

/**
 * Dashboard card: reactions others gave to my pages since I last said thanks.
 * "Seen" is remembered per pupil in this browser.
 */
export function NewReactionsCard({ studentId }: { studentId: string | number }) {
  const { t, intl } = useLocale();
  const [items, setItems] = useState<ReceivedReaction[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/reactions/received', { cache: 'no-store' });
        if (!res.ok) return;
        const { reactions } = await res.json() as { reactions: ReceivedReaction[] };
        let seen = 0;
        try { seen = Number(localStorage.getItem(seenKey(studentId))) || 0; } catch { /* storage blocked */ }
        if (!cancelled) setItems((reactions ?? []).filter(r => new Date(r.date_created).getTime() > seen));
      } catch { /* offline */ }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  if (items.length === 0) return null;

  function dismiss() {
    const newest = Math.max(...items.map(r => new Date(r.date_created).getTime()));
    try { localStorage.setItem(seenKey(studentId), String(newest)); } catch { /* storage blocked */ }
    setItems([]);
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-rose-50 p-4 shadow-sm">
      <p className="mb-2 font-semibold text-amber-900">
        {t('🎉 Někdo ocenil tvé stránky!', '🎉 Someone appreciated your pages!')}
      </p>
      <ul className="space-y-1.5">
        {items.slice(0, 6).map(r => (
          <li key={r.id} className="flex flex-wrap items-center gap-x-2 text-sm text-gray-700">
            <span className="text-lg leading-none" title={t(REACTIONS[r.type].label)}>{REACTIONS[r.type].emoji}</span>
            <span className="font-medium">{r.from.name}</span>
            <span className="text-gray-500">→</span>
            <Link href={`/dashboard/portfolio/${r.page.id}/view`} className="text-blue-700 underline-offset-2 hover:underline">
              {r.page.title}
            </Link>
            <span className="text-xs text-gray-400">
              {new Date(r.date_created).toLocaleDateString(intl, { day: 'numeric', month: 'numeric' })}
            </span>
          </li>
        ))}
      </ul>
      {items.length > 6 && (
        <p className="mt-1 text-xs text-gray-500">{t(`…a dalších ${items.length - 6}`, `…and ${items.length - 6} more`)}</p>
      )}
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 rounded-full bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
      >
        {t('Děkuju! 💛', 'Thank you! 💛')}
      </button>
    </div>
  );
}

/** What the page owner sees: who reacted and how. */
export function ReactionSummary({ pageId }: { pageId: string | number }) {
  const { t } = useLocale();
  const id = String(pageId);
  const { reactions, available } = usePageReactions([id]);
  const summary = reactions[id];
  if (!available || !summary || total(summary) === 0) return null;

  // Group by person: "Dasa Nováková ⭐ ❤️"
  const byPerson = new Map<string, { is_teacher: boolean; types: ReactionType[] }>();
  for (const p of summary.people ?? []) {
    const entry = byPerson.get(p.name) ?? { is_teacher: p.is_teacher, types: [] };
    entry.types.push(p.type);
    byPerson.set(p.name, entry);
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white px-5 py-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-amber-900">{t('Ocenění tvé stránky', 'Your page was appreciated')}</p>
        <ReactionChips summary={{ ...summary, mine: [] }} />
      </div>
      <ul className="space-y-1">
        {[...byPerson].map(([name, info]) => (
          <li key={name} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-base leading-none">{info.types.map(type => REACTIONS[type].emoji).join(' ')}</span>
            <span className="font-medium">{name}</span>
            {info.is_teacher && <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">{t('učitel', 'teacher')}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
