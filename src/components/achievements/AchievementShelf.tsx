'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ACHIEVEMENTS, TRACKS, earnedAchievements, nextAchievement,
  type Achievement, type AchievementCounts,
} from '@/lib/achievements';
import { useLocale } from '@/components/LocaleProvider';

/** Pages fire this after saving something that can earn an achievement. */
export const ACHIEVEMENTS_CHANGED = 'pp-achievements-changed';
export function notifyAchievementsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ACHIEVEMENTS_CHANGED));
}

const seenKey = (studentId: string | number) => `pp_ach_seen_${studentId}`;

function readSeen(studentId: string | number): Set<string> | null {
  try {
    const raw = localStorage.getItem(seenKey(studentId));
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch { return null; }
}
function writeSeen(studentId: string | number, ids: string[]) {
  try { localStorage.setItem(seenKey(studentId), JSON.stringify(ids)); } catch { /* best effort */ }
}

/** Loads activity counts and reports achievements earned since the last visit. */
export function useAchievements(studentId: string | number | null) {
  const [counts, setCounts] = useState<AchievementCounts | null>(null);
  const [fresh, setFresh] = useState<Achievement[]>([]);
  const pathname = usePathname();
  const lastLoad = useRef(0);

  const load = useCallback(async (force = false) => {
    if (studentId == null) return;
    if (!force && Date.now() - lastLoad.current < 3000) return;
    lastLoad.current = Date.now();
    try {
      const res = await fetch('/api/achievements', { cache: 'no-store' });
      if (!res.ok) return;
      const { counts: c } = await res.json() as { counts: AchievementCounts };
      setCounts(c);
      const earned = earnedAchievements(c);
      const seen = readSeen(studentId) ?? new Set<string>();
      const newOnes = earned.filter(a => !seen.has(a.id));
      if (newOnes.length > 0) {
        setFresh(prev => [...prev, ...newOnes.filter(a => !prev.some(p => p.id === a.id))]);
        writeSeen(studentId, [...seen, ...newOnes.map(a => a.id)]);
      }
    } catch { /* offline — try again next time */ }
  }, [studentId]);

  // Refresh when moving between pages (most saves end with a navigation)…
  useEffect(() => { load(); }, [load, pathname]);

  // …and when a page reports a save that stays on the same screen
  useEffect(() => {
    const onChange = () => { setTimeout(() => load(true), 300); };
    window.addEventListener(ACHIEVEMENTS_CHANGED, onChange);
    window.addEventListener('pp-badges-changed', onChange);
    return () => {
      window.removeEventListener(ACHIEVEMENTS_CHANGED, onChange);
      window.removeEventListener('pp-badges-changed', onChange);
    };
  }, [load]);

  const dismissFresh = () => setFresh([]);
  return { counts, fresh, dismissFresh };
}

function Medal({ a, size = 'sm', onClick }: { a: Achievement; size?: 'sm' | 'lg'; onClick?: () => void }) {
  const { t } = useLocale();
  const dims = size === 'lg' ? 'h-24 w-24 text-5xl border-4' : 'h-10 w-10 text-xl border-2';
  return (
    <button
      type="button"
      onClick={onClick}
      title={t(a.name)}
      aria-label={t(a.name)}
      className={`pp-medal relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-sm ${a.tone} ${dims} ${onClick ? 'hover:scale-110 transition-transform' : 'cursor-default'}`}
    >
      <span className="select-none leading-none">{a.emoji}</span>
    </button>
  );
}

/** Grid of earned achievements under the side menu, with a hint toward the next one. */
export function AchievementShelf({ counts, onOpen }: { counts: AchievementCounts | null; onOpen: (a: Achievement) => void }) {
  const { t, locale } = useLocale();
  if (!counts) return null;
  const earned = earnedAchievements(counts);
  const next = nextAchievement(counts);

  return (
    <div className="px-4 pb-3">
      <div className="rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-3">
        <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-amber-800">
          <span>{t('Moje odznaky', 'My badges')}</span>
          <span className="font-medium normal-case tracking-normal text-amber-700">{earned.length}/{ACHIEVEMENTS.length}</span>
        </p>
        {earned.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {earned.map(a => <Medal key={a.id} a={a} onClick={() => onOpen(a)} />)}
          </div>
        ) : (
          <p className="text-xs text-gray-600">{t('Tady se budou sbírat tvoje odznaky za to, jak pilně pracuješ.', 'Your badges for all your hard work will be collected here.')}</p>
        )}
        {next && (
          <div className="mt-3">
            <p className="text-[11px] leading-snug text-gray-600">
              {t('Další', 'Next')}: <span className="font-medium text-gray-800">{next.achievement.emoji} {t(next.achievement.name)}</span>
              <br />
              {t(
                `chybí ${next.missing} ${TRACKS[next.achievement.track].unit(next.missing, locale)}`,
                `${next.missing} more ${TRACKS[next.achievement.track].unit(next.missing, locale)} to go`,
              )}
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${Math.max(4, Math.round(((next.achievement.threshold - next.missing) / next.achievement.threshold) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Deterministic confetti — same positions every time, no Math.random() in render
const CONFETTI = Array.from({ length: 44 }, (_, i) => ({
  left: `${((i * 23) % 100).toFixed(1)}%`,
  color: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316', '#ec4899'][i % 7],
  size: 6 + (i % 5) * 2,
  delay: `${((i * 0.07) % 1.8).toFixed(2)}s`,
  dur: `${(2.2 + (i % 6) * 0.35).toFixed(2)}s`,
  round: i % 3 === 0,
}));

/**
 * Modal for one or more achievements. With `celebrate` it rains confetti and says "Nový odznak!",
 * otherwise it just shows the achievement (when clicked on the shelf).
 */
export function AchievementModal({ items, celebrate, onClose }: { items: Achievement[]; celebrate: boolean; onClose: () => void }) {
  const { t, locale } = useLocale();
  const [index, setIndex] = useState(0);
  if (items.length === 0) return null;
  const a = items[Math.min(index, items.length - 1)];
  const last = index >= items.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <style>{`
        @keyframes ppAchFall {
          0%   { transform: translateY(-20px) rotate(0deg) scale(1); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(740deg) scale(0.6); opacity: 0; }
        }
        @keyframes ppAchPop { 0% { transform: scale(.3) rotate(-20deg); opacity: 0; } 70% { transform: scale(1.12) rotate(4deg); opacity: 1; } 100% { transform: scale(1) rotate(0); } }
        .pp-ach-confetti { animation: ppAchFall linear forwards; position: absolute; top: -10px; }
        .pp-ach-pop { animation: ppAchPop .6s cubic-bezier(.2,.9,.3,1.3) backwards; }
      `}</style>

      {celebrate && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {CONFETTI.map((c, i) => (
            <div
              key={`${a.id}-${i}`}
              className="pp-ach-confetti"
              style={{
                left: c.left, width: c.size, height: c.size, background: c.color,
                borderRadius: c.round ? '50%' : '2px', animationDelay: c.delay, animationDuration: c.dur,
              }}
            />
          ))}
        </div>
      )}

      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      <div className="relative mx-4 w-full max-w-xs rounded-3xl bg-white px-8 py-9 text-center shadow-2xl" role="dialog" aria-modal="true">
        <div key={a.id} className="pp-ach-pop mb-4 flex justify-center">
          <Medal a={a} size="lg" />
        </div>
        {celebrate && <h2 className="mb-1 text-2xl font-extrabold text-gray-900">{t('Nový odznak!', 'New badge!')}</h2>}
        <p className={`mb-4 font-semibold text-amber-700 ${celebrate ? 'text-base' : 'text-xl'}`}>{t(a.name)}</p>
        <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-gray-700">{t(a.praise)}</p>
        <p className="mb-6 text-xs text-gray-500">
          {t(TRACKS[a.track].label)} · {a.threshold} {TRACKS[a.track].unit(a.threshold, locale)}
        </p>
        {items.length > 1 && (
          <p className="mb-3 text-xs text-gray-500">{index + 1} {t('z', 'of')} {items.length}</p>
        )}
        <button
          onClick={() => (last ? onClose() : setIndex(i => i + 1))}
          className="w-full rounded-2xl bg-amber-500 py-3 text-base font-bold text-white transition-colors hover:bg-amber-600 active:bg-amber-700"
        >
          {last ? (celebrate ? t('Hurá! 🎉', 'Hooray! 🎉') : t('Zavřít', 'Close')) : t('Další odznak →', 'Next badge →')}
        </button>
      </div>
    </div>
  );
}
