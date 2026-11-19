/**
 * Odznaky za aktivitu — počítají se z toho, co žák v aplikaci opravdu udělal
 * (stránky portfolia, knihy v deníku, splněné cíle…). Nic se neukládá zvlášť:
 * odznak má každý, kdo dosáhl prahu, takže nejde o něj přijít ani ho „ošálit“.
 */

import { plural, type L10n, type Locale } from '@/lib/i18n';

export type AchievementTrack = 'portfolio' | 'reading' | 'goals' | 'beavers' | 'calendar' | 'dreams' | 'appreciated';

export interface Achievement {
  id: string;
  track: AchievementTrack;
  threshold: number;
  name: L10n;
  emoji: string;
  /** Pochvala, která se ukáže při získání */
  praise: L10n;
  /** Barva medailonku (Tailwind třídy) */
  tone: string;
}

export const TRACKS: Record<AchievementTrack, { label: L10n; unit: (n: number, locale: Locale) => string }> = {
  portfolio: {
    label: { cs: 'Portfolio', en: 'Portfolio' },
    unit: (n, l) => plural(l, n, ['stránka v portfoliu', 'stránky v portfoliu', 'stránek v portfoliu'], ['portfolio page', 'portfolio pages']),
  },
  reading: {
    label: { cs: 'Čtenářský deník', en: 'Reading diary' },
    unit: (n, l) => plural(l, n, ['kniha v deníku', 'knihy v deníku', 'knih v deníku'], ['book in the diary', 'books in the diary']),
  },
  goals: {
    label: { cs: 'Osobní cíle', en: 'Personal goals' },
    unit: (n, l) => plural(l, n, ['splněný cíl', 'splněné cíle', 'splněných cílů'], ['goal achieved', 'goals achieved']),
  },
  beavers: {
    label: { cs: 'Bobříci', en: 'Beavers' },
    unit: (n, l) => plural(l, n, ['ulovený bobřík', 'ulovení bobříci', 'ulovených bobříků'], ['beaver earned', 'beavers earned']),
  },
  calendar: {
    label: { cs: 'Kalendář', en: 'Calendar' },
    unit: (n, l) => plural(l, n, ['záznam v kalendáři', 'záznamy v kalendáři', 'záznamů v kalendáři'], ['calendar entry', 'calendar entries']),
  },
  dreams: {
    label: { cs: 'Nástěnka snů', en: 'Dream board' },
    unit: (n, l) => plural(l, n, ['sen na nástěnce', 'sny na nástěnce', 'snů na nástěnce'], ['dream on the board', 'dreams on the board']),
  },
  appreciated: {
    label: { cs: 'Ocenění stránek', en: 'Page appreciation' },
    unit: (n, l) => plural(l, n, ['ocenění od ostatních', 'ocenění od ostatních', 'ocenění od ostatních'], ['appreciation from others', 'appreciations from others']),
  },
};

export const ACHIEVEMENTS: Achievement[] = [
  // Portfolio
  { id: 'portfolio-1', track: 'portfolio', threshold: 1, emoji: '📝', tone: 'from-sky-100 to-sky-200 border-sky-300',
    name: { cs: 'První stránka', en: 'First Page' },
    praise: { cs: 'Tvoje portfolio se právě narodilo! Každá velká kniha začíná první stránkou.',
              en: 'Your portfolio has just been born! Every great book starts with its first page.' } },
  { id: 'portfolio-5', track: 'portfolio', threshold: 5, emoji: '🌱', tone: 'from-lime-100 to-green-200 border-green-300',
    name: { cs: 'Začínající poctivý student', en: 'Diligent Beginner' },
    praise: { cs: 'Pět stránek! Z malého semínka už vyrůstá pořádná rostlinka. Jen tak dál.',
              en: 'Five pages! Your little seed is growing into a proper plant. Keep it up.' } },
  { id: 'portfolio-15', track: 'portfolio', threshold: 15, emoji: '📚', tone: 'from-amber-100 to-amber-200 border-amber-300',
    name: { cs: 'Pilný student', en: 'Hard-working Student' },
    praise: { cs: 'Patnáct stránek plných tvé práce — to je úctyhodná sbírka. Můžeš být na sebe hrdý/á!',
              en: 'Fifteen pages full of your work — that\'s an impressive collection. You can be proud of yourself!' } },
  { id: 'portfolio-30', track: 'portfolio', threshold: 30, emoji: '🏅', tone: 'from-orange-100 to-orange-200 border-orange-300',
    name: { cs: 'Sběratel zkušeností', en: 'Experience Collector' },
    praise: { cs: 'Třicet stránek! Tvoje portfolio vypráví příběh o tom, kolik toho umíš.',
              en: 'Thirty pages! Your portfolio tells the story of everything you can do.' } },
  { id: 'portfolio-60', track: 'portfolio', threshold: 60, emoji: '🏆', tone: 'from-yellow-100 to-yellow-300 border-yellow-400',
    name: { cs: 'Mistr portfolia', en: 'Portfolio Master' },
    praise: { cs: 'Šedesát stránek — jsi skutečný mistr! Takovou vytrvalost má málokdo.',
              en: 'Sixty pages — you are a true master! Very few people have that kind of perseverance.' } },

  // Čtenářský deník
  { id: 'reading-1', track: 'reading', threshold: 1, emoji: '📖', tone: 'from-rose-100 to-rose-200 border-rose-300',
    name: { cs: 'První přečtená kniha', en: 'First Book Read' },
    praise: { cs: 'První kniha v deníku! Právě jsi otevřel/a dveře do světa příběhů.',
              en: 'The first book in your diary! You\'ve just opened the door to a world of stories.' } },
  { id: 'reading-5', track: 'reading', threshold: 5, emoji: '🐛', tone: 'from-emerald-100 to-emerald-200 border-emerald-300',
    name: { cs: 'Knihomol', en: 'Bookworm' },
    praise: { cs: 'Pět knih! Knihomol by ti záviděl, kolik stránek už máš za sebou.',
              en: 'Five books! Even a real bookworm would envy how many pages you\'ve read.' } },
  { id: 'reading-12', track: 'reading', threshold: 12, emoji: '⭐', tone: 'from-yellow-100 to-amber-200 border-amber-300',
    name: { cs: 'Čtenářská hvězda', en: 'Reading Star' },
    praise: { cs: 'Dvanáct knih — skoro jedna za každý měsíc v roce! Září ti to jako hvězda.',
              en: 'Twelve books — almost one for every month of the year! You shine like a star.' } },
  { id: 'reading-25', track: 'reading', threshold: 25, emoji: '🦉', tone: 'from-violet-100 to-violet-200 border-violet-300',
    name: { cs: 'Moudrá sova', en: 'Wise Owl' },
    praise: { cs: 'Pětadvacet knih! Moudrá sova kývá hlavou — tvoje hlava je plná příběhů.',
              en: 'Twenty-five books! The wise owl nods approvingly — your head is full of stories.' } },

  // Osobní cíle
  { id: 'goals-1', track: 'goals', threshold: 1, emoji: '🎯', tone: 'from-red-100 to-red-200 border-red-300',
    name: { cs: 'Splněný cíl', en: 'Goal Achieved' },
    praise: { cs: 'Trefa do černého! Splnil/a jsi svůj první cíl. Tohle je skvělý pocit, viď?',
              en: 'Bullseye! You\'ve achieved your first goal. That feels great, doesn\'t it?' } },
  { id: 'goals-5', track: 'goals', threshold: 5, emoji: '🚀', tone: 'from-indigo-100 to-indigo-200 border-indigo-300',
    name: { cs: 'Cílevědomý', en: 'Go-getter' },
    praise: { cs: 'Pět splněných cílů! Letíš vpřed jako raketa.',
              en: 'Five goals achieved! You\'re zooming ahead like a rocket.' } },
  { id: 'goals-15', track: 'goals', threshold: 15, emoji: '🌟', tone: 'from-fuchsia-100 to-fuchsia-200 border-fuchsia-300',
    name: { cs: 'Dosahovač hvězd', en: 'Star Reacher' },
    praise: { cs: 'Patnáct splněných cílů — sahat po hvězdách ti jde náramně!',
              en: 'Fifteen goals achieved — you\'re brilliant at reaching for the stars!' } },

  // Bobříci
  { id: 'beavers-1', track: 'beavers', threshold: 1, emoji: '🦫', tone: 'from-teal-100 to-teal-200 border-teal-300',
    name: { cs: 'Statečný bobřík', en: 'Brave Beaver' },
    praise: { cs: 'Ulovil/a jsi prvního bobříka! Vytrvat celý týden chce odvahu.',
              en: 'You\'ve earned your first beaver! Keeping going for a whole week takes courage.' } },
  { id: 'beavers-3', track: 'beavers', threshold: 3, emoji: '🌲', tone: 'from-green-100 to-teal-200 border-teal-300',
    name: { cs: 'Bobří parta', en: 'Beaver Gang' },
    praise: { cs: 'Tři bobříci! V lese už o tobě vědí — jsi pravý lovec bobříků.',
              en: 'Three beavers! The whole forest knows about you now — you\'re a true beaver hunter.' } },

  // Kalendář
  { id: 'calendar-5', track: 'calendar', threshold: 5, emoji: '🗓️', tone: 'from-cyan-100 to-cyan-200 border-cyan-300',
    name: { cs: 'Plánovač', en: 'Planner' },
    praise: { cs: 'Pět záznamů v kalendáři — máš svůj čas pěkně pod kontrolou.',
              en: 'Five calendar entries — you\'ve got your time nicely under control.' } },
  { id: 'calendar-25', track: 'calendar', threshold: 25, emoji: '⏰', tone: 'from-blue-100 to-blue-200 border-blue-300',
    name: { cs: 'Pán času', en: 'Master of Time' },
    praise: { cs: 'Pětadvacet záznamů! Čas ti zobe z ruky.',
              en: 'Twenty-five entries! Time is eating out of your hand.' } },

  // Nástěnka snů
  { id: 'dreams-3', track: 'dreams', threshold: 3, emoji: '☁️', tone: 'from-slate-100 to-sky-200 border-sky-300',
    name: { cs: 'Snílek', en: 'Dreamer' },
    praise: { cs: 'Tři sny na nástěnce. Kdo sní, ten ví, kam chce dojít.',
              en: 'Three dreams on your board. Dreamers know where they want to go.' } },
  { id: 'dreams-10', track: 'dreams', threshold: 10, emoji: '🌈', tone: 'from-pink-100 to-purple-200 border-purple-300',
    name: { cs: 'Velký snílek', en: 'Big Dreamer' },
    praise: { cs: 'Deset snů! Tvoje nástěnka hraje všemi barvami duhy.',
              en: 'Ten dreams! Your board shines in all the colours of the rainbow.' } },

  // Ocenění od učitele a kamarádů (reakce na stránky)
  { id: 'appreciated-1', track: 'appreciated', threshold: 1, emoji: '💌', tone: 'from-pink-100 to-rose-200 border-rose-300',
    name: { cs: 'První ocenění', en: 'First Appreciation' },
    praise: { cs: 'Někdo si tvou stránku přečetl a udělala mu radost. To je krásný pocit, viď?',
              en: 'Someone read your page and it made them happy. That\'s a lovely feeling, isn\'t it?' } },
  { id: 'appreciated-10', track: 'appreciated', threshold: 10, emoji: '🎖️', tone: 'from-amber-100 to-yellow-200 border-yellow-300',
    name: { cs: 'Oceňovaný autor', en: 'Appreciated Author' },
    praise: { cs: 'Deset ocenění! Tvoje práce ostatní baví a inspiruje.',
              en: 'Ten appreciations! Your work delights and inspires others.' } },
  { id: 'appreciated-30', track: 'appreciated', threshold: 30, emoji: '👑', tone: 'from-yellow-100 to-amber-300 border-amber-400',
    name: { cs: 'Inspirace pro ostatní', en: 'Inspiration to Others' },
    praise: { cs: 'Třicet ocenění — tvoje stránky jsou pro ostatní opravdovou inspirací!',
              en: 'Thirty appreciations — your pages are a real inspiration to others!' } },
];

export type AchievementCounts = Record<AchievementTrack, number>;

export function earnedAchievements(counts: AchievementCounts): Achievement[] {
  return ACHIEVEMENTS.filter(a => (counts[a.track] ?? 0) >= a.threshold);
}

/** The closest not-yet-earned achievement — shown as a gentle "what's next" hint. */
export function nextAchievement(counts: AchievementCounts): { achievement: Achievement; missing: number } | null {
  let best: { achievement: Achievement; missing: number } | null = null;
  for (const a of ACHIEVEMENTS) {
    const missing = a.threshold - (counts[a.track] ?? 0);
    if (missing <= 0) continue;
    // prefer the smallest gap relative to the threshold
    if (!best || missing / a.threshold < best.missing / best.achievement.threshold) best = { achievement: a, missing };
  }
  return best;
}
