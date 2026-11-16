'use client';

import { useEffect, useRef } from 'react';
import { intlLocale, type Locale } from '@/lib/i18n';

/**
 * Rozepsané koncepty — průběžně ukládané v prohlížeči (localStorage), aby se text
 * neztratil obnovením stránky, zavřením okna ani chybou při ukládání na server.
 *
 * Koncepty jsou vázané na přihlášeného žáka (sourozenci na jednom počítači si je
 * nevidí), mažou se po úspěšném uložení, při odhlášení a po 30 dnech.
 */

const PREFIX = 'pp_draft:';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SAVE_DELAY_MS = 500;

let owner: string | null = null;

/** Called by the dashboard layout once the student is known. */
export function setDraftOwner(studentId: string | number | null) {
  owner = studentId == null ? null : String(studentId);
  if (owner) pruneOldDrafts();
}

interface StoredDraft<T> { savedAt: number; data: T }

function storageKey(key: string) {
  return owner ? `${PREFIX}${owner}:${key}` : null;
}

function safeStorage(): Storage | null {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

export function loadDraft<T>(key: string): StoredDraft<T> | null {
  const sk = storageKey(key);
  const ls = safeStorage();
  if (!sk || !ls) return null;
  try {
    const raw = ls.getItem(sk);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft<T>;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      ls.removeItem(sk);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, data: T) {
  const sk = storageKey(key);
  const ls = safeStorage();
  if (!sk || !ls) return;
  try {
    ls.setItem(sk, JSON.stringify({ savedAt: Date.now(), data } satisfies StoredDraft<T>));
  } catch { /* storage full or blocked — autosave is best effort */ }
}

export function discardDraft(key: string) {
  const sk = storageKey(key);
  const ls = safeStorage();
  if (!sk || !ls) return;
  try { ls.removeItem(sk); } catch { /* ignore */ }
}

/** Removes every draft of the current student — used on logout (shared school computers). */
export function clearOwnDrafts() {
  const ls = safeStorage();
  if (!ls || !owner) return;
  try {
    const mine = `${PREFIX}${owner}:`;
    for (let i = ls.length - 1; i >= 0; i--) {
      const k = ls.key(i);
      if (k?.startsWith(mine)) ls.removeItem(k);
    }
  } catch { /* ignore */ }
}

function pruneOldDrafts() {
  const ls = safeStorage();
  if (!ls) return;
  try {
    for (let i = ls.length - 1; i >= 0; i--) {
      const k = ls.key(i);
      if (!k?.startsWith(PREFIX)) continue;
      const parsed = JSON.parse(ls.getItem(k) ?? 'null') as StoredDraft<unknown> | null;
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) ls.removeItem(k);
    }
  } catch { /* ignore */ }
}

/** "dnes v 14:32" / "12. 11. v 14:32" — or "today at 14:32" / "12 Nov at 14:32" */
export function draftTimeLabel(savedAt: number, locale: Locale = 'cs') {
  const d = new Date(savedAt);
  const intl = intlLocale(locale);
  const time = d.toLocaleTimeString(intl, { hour: '2-digit', minute: '2-digit' });
  const sameDay = d.toDateString() === new Date().toDateString();
  if (locale === 'en') return sameDay ? `today at ${time}` : `${d.toLocaleDateString(intl, { day: 'numeric', month: 'short' })} at ${time}`;
  return sameDay ? `dnes v ${time}` : `${d.toLocaleDateString(intl, { day: 'numeric', month: 'numeric' })} v ${time}`;
}

/**
 * Autosaves `data` under `key` while `key` is non-null (e.g. while a form is open).
 * Empty forms (per `isEmpty`) remove the draft instead of storing it.
 */
export function useDraftAutosave<T>(key: string | null, data: T, isEmpty: (data: T) => boolean) {
  const latest = useRef({ key, data, isEmpty });
  latest.current = { key, data, isEmpty };

  // Debounced save on every change
  useEffect(() => {
    if (!key) return;
    const t = setTimeout(() => {
      if (isEmpty(data)) discardDraft(key);
      else writeDraft(key, data);
    }, SAVE_DELAY_MS);
    return () => clearTimeout(t);
    // isEmpty is expected to be a stable function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, data]);

  // Flush immediately when the tab is hidden or closed — the debounce may not get to run
  useEffect(() => {
    const flush = () => {
      const { key: k, data: d, isEmpty: empty } = latest.current;
      if (!k) return;
      if (empty(d)) discardDraft(k);
      else writeDraft(k, d);
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
