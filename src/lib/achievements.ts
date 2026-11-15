/**
 * Odznaky za aktivitu — počítají se z toho, co žák v aplikaci opravdu udělal
 * (stránky portfolia, knihy v deníku, splněné cíle…). Nic se neukládá zvlášť:
 * odznak má každý, kdo dosáhl prahu, takže nejde o něj přijít ani ho „ošálit“.
 */

export type AchievementTrack = 'portfolio' | 'reading' | 'goals' | 'beavers' | 'calendar' | 'dreams';

export interface Achievement {
  id: string;
  track: AchievementTrack;
  threshold: number;
  name: string;
  emoji: string;
  /** Pochvala, která se ukáže při získání */
  praise: string;
  /** Barva medailonku (Tailwind třídy) */
  tone: string;
}

export const TRACKS: Record<AchievementTrack, { label: string; unit: (n: number) => string }> = {
  portfolio: { label: 'Portfolio', unit: n => czPlural(n, 'stránka v portfoliu', 'stránky v portfoliu', 'stránek v portfoliu') },
  reading: { label: 'Čtenářský deník', unit: n => czPlural(n, 'kniha v deníku', 'knihy v deníku', 'knih v deníku') },
  goals: { label: 'Osobní cíle', unit: n => czPlural(n, 'splněný cíl', 'splněné cíle', 'splněných cílů') },
  beavers: { label: 'Bobříci', unit: n => czPlural(n, 'ulovený bobřík', 'ulovení bobříci', 'ulovených bobříků') },
  calendar: { label: 'Kalendář', unit: n => czPlural(n, 'záznam v kalendáři', 'záznamy v kalendáři', 'záznamů v kalendáři') },
  dreams: { label: 'Nástěnka snů', unit: n => czPlural(n, 'sen na nástěnce', 'sny na nástěnce', 'snů na nástěnce') },
};

export function czPlural(n: number, one: string, few: string, many: string) {
  return n === 1 ? one : n >= 2 && n <= 4 ? few : many;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Portfolio
  { id: 'portfolio-1', track: 'portfolio', threshold: 1, name: 'První stránka', emoji: '📝', tone: 'from-sky-100 to-sky-200 border-sky-300',
    praise: 'Tvoje portfolio se právě narodilo! Každá velká kniha začíná první stránkou.' },
  { id: 'portfolio-5', track: 'portfolio', threshold: 5, name: 'Začínající poctivý student', emoji: '🌱', tone: 'from-lime-100 to-green-200 border-green-300',
    praise: 'Pět stránek! Z malého semínka už vyrůstá pořádná rostlinka. Jen tak dál.' },
  { id: 'portfolio-15', track: 'portfolio', threshold: 15, name: 'Pilný student', emoji: '📚', tone: 'from-amber-100 to-amber-200 border-amber-300',
    praise: 'Patnáct stránek plných tvé práce — to je úctyhodná sbírka. Můžeš být na sebe hrdý/á!' },
  { id: 'portfolio-30', track: 'portfolio', threshold: 30, name: 'Sběratel zkušeností', emoji: '🏅', tone: 'from-orange-100 to-orange-200 border-orange-300',
    praise: 'Třicet stránek! Tvoje portfolio vypráví příběh o tom, kolik toho umíš.' },
  { id: 'portfolio-60', track: 'portfolio', threshold: 60, name: 'Mistr portfolia', emoji: '🏆', tone: 'from-yellow-100 to-yellow-300 border-yellow-400',
    praise: 'Šedesát stránek — jsi skutečný mistr! Takovou vytrvalost má málokdo.' },

  // Čtenářský deník
  { id: 'reading-1', track: 'reading', threshold: 1, name: 'První přečtená kniha', emoji: '📖', tone: 'from-rose-100 to-rose-200 border-rose-300',
    praise: 'První kniha v deníku! Právě jsi otevřel/a dveře do světa příběhů.' },
  { id: 'reading-5', track: 'reading', threshold: 5, name: 'Knihomol', emoji: '🐛', tone: 'from-emerald-100 to-emerald-200 border-emerald-300',
    praise: 'Pět knih! Knihomol by ti záviděl, kolik stránek už máš za sebou.' },
  { id: 'reading-12', track: 'reading', threshold: 12, name: 'Čtenářská hvězda', emoji: '⭐', tone: 'from-yellow-100 to-amber-200 border-amber-300',
    praise: 'Dvanáct knih — skoro jedna za každý měsíc v roce! Září ti to jako hvězda.' },
  { id: 'reading-25', track: 'reading', threshold: 25, name: 'Moudrá sova', emoji: '🦉', tone: 'from-violet-100 to-violet-200 border-violet-300',
    praise: 'Pětadvacet knih! Moudrá sova kývá hlavou — tvoje hlava je plná příběhů.' },

  // Osobní cíle
  { id: 'goals-1', track: 'goals', threshold: 1, name: 'Splněný cíl', emoji: '🎯', tone: 'from-red-100 to-red-200 border-red-300',
    praise: 'Trefa do černého! Splnil/a jsi svůj první cíl. Tohle je skvělý pocit, viď?' },
  { id: 'goals-5', track: 'goals', threshold: 5, name: 'Cílevědomý', emoji: '🚀', tone: 'from-indigo-100 to-indigo-200 border-indigo-300',
    praise: 'Pět splněných cílů! Letíš vpřed jako raketa.' },
  { id: 'goals-15', track: 'goals', threshold: 15, name: 'Dosahovač hvězd', emoji: '🌟', tone: 'from-fuchsia-100 to-fuchsia-200 border-fuchsia-300',
    praise: 'Patnáct splněných cílů — sahat po hvězdách ti jde náramně!' },

  // Bobříci
  { id: 'beavers-1', track: 'beavers', threshold: 1, name: 'Statečný bobřík', emoji: '🦫', tone: 'from-teal-100 to-teal-200 border-teal-300',
    praise: 'Ulovil/a jsi prvního bobříka! Vytrvat celý týden chce odvahu.' },
  { id: 'beavers-3', track: 'beavers', threshold: 3, name: 'Bobří parta', emoji: '🌲', tone: 'from-green-100 to-teal-200 border-teal-300',
    praise: 'Tři bobříci! V lese už o tobě vědí — jsi pravý lovec bobříků.' },

  // Kalendář
  { id: 'calendar-5', track: 'calendar', threshold: 5, name: 'Plánovač', emoji: '🗓️', tone: 'from-cyan-100 to-cyan-200 border-cyan-300',
    praise: 'Pět záznamů v kalendáři — máš svůj čas pěkně pod kontrolou.' },
  { id: 'calendar-25', track: 'calendar', threshold: 25, name: 'Pán času', emoji: '⏰', tone: 'from-blue-100 to-blue-200 border-blue-300',
    praise: 'Pětadvacet záznamů! Čas ti zobe z ruky.' },

  // Nástěnka snů
  { id: 'dreams-3', track: 'dreams', threshold: 3, name: 'Snílek', emoji: '☁️', tone: 'from-slate-100 to-sky-200 border-sky-300',
    praise: 'Tři sny na nástěnce. Kdo sní, ten ví, kam chce dojít.' },
  { id: 'dreams-10', track: 'dreams', threshold: 10, name: 'Velký snílek', emoji: '🌈', tone: 'from-pink-100 to-purple-200 border-purple-300',
    praise: 'Deset snů! Tvoje nástěnka hraje všemi barvami duhy.' },
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
