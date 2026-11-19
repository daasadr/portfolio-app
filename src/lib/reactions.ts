import type { L10n } from '@/lib/i18n';

/**
 * Reakce na stránky portfolia — propojený učitel (a později kamarádi) dává najevo, že stránku
 * viděl a líbí se mu. Každý může dát každé stránce každou reakci nejvýš jednou (zapnout/vypnout).
 */
export const REACTION_TYPES = ['like', 'heart', 'star', 'medal'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const REACTIONS: Record<ReactionType, { emoji: string; label: L10n; tone: string }> = {
  like: { emoji: '👍', label: { cs: 'Palec nahoru', en: 'Thumbs up' }, tone: 'bg-sky-50 border-sky-200 text-sky-800' },
  heart: { emoji: '❤️', label: { cs: 'Srdíčko', en: 'Heart' }, tone: 'bg-rose-50 border-rose-200 text-rose-800' },
  star: { emoji: '⭐', label: { cs: 'Hvězda', en: 'Star' }, tone: 'bg-amber-50 border-amber-200 text-amber-800' },
  medal: { emoji: '🏅', label: { cs: 'Medaile', en: 'Medal' }, tone: 'bg-orange-50 border-orange-200 text-orange-800' },
};

export function isReactionType(v: unknown): v is ReactionType {
  return typeof v === 'string' && (REACTION_TYPES as readonly string[]).includes(v);
}

export type ReactionCounts = Record<ReactionType, number>;

export interface PageReactionSummary {
  counts: ReactionCounts;
  /** Reactions the viewer gave */
  mine: ReactionType[];
  /** Who reacted — only sent to the page owner */
  people?: { name: string; type: ReactionType; is_teacher: boolean }[];
}

export interface ReceivedReaction {
  id: number;
  type: ReactionType;
  date_created: string;
  page: { id: string; title: string };
  from: { name: string; is_teacher: boolean };
}

export const emptyCounts = (): ReactionCounts => ({ like: 0, heart: 0, star: 0, medal: 0 });
