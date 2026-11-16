'use client';

import { useState, useEffect } from 'react';
import { safeFormatDate } from '@/lib/date';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  BookOpen,
  Calendar,
  Plus,
  CheckCircle,
  Circle,
  LayoutDashboard,
  Flame,
  Bell,
} from 'lucide-react';
import { getCurrentStudent, directus, readItems } from '@/lib/directus';
import { BADGES, type Badge as BadgeDef } from '@/lib/badges';
import { pragueToday, toPragueDate } from '@/lib/prague-date';
import { useLocale } from '@/components/LocaleProvider';
import type { Student, PersonalGoal, DreamBoardItem, PortfolioPage, CalendarEntry } from '@/types';

// Deterministic confetti — same positions every time, no Math.random() in render
const CONFETTI = Array.from({ length: 52 }, (_, i) => ({
  left: `${((i * 19) % 100).toFixed(1)}%`,
  color: ['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#f97316','#ec4899'][i % 7],
  size: 6 + (i % 5) * 2,
  delay: `${((i * 0.07) % 1.8).toFixed(2)}s`,
  dur: `${(2.2 + (i % 6) * 0.35).toFixed(2)}s`,
  round: i % 3 === 0,
}));

interface UserBadge {
  id: number;
  badge_slug: string;
  steps_done: number;
  last_step_date: string | null;
  status: 'active' | 'completed' | 'expired';
}

export default function DashboardPage() {
  const { t, locale, intl } = useLocale();
  const [student, setStudent] = useState<Student | null>(null);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [boardItems, setBoardItems] = useState<DreamBoardItem[]>([]);
  const [recentPages, setRecentPages] = useState<PortfolioPage[]>([]);
  const [todayEntries, setTodayEntries] = useState<CalendarEntry[]>([]);
  const [activeBadges, setActiveBadges] = useState<UserBadge[]>([]);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [celebratedBadge, setCelebratedBadge] = useState<BadgeDef | null>(null);
  const [badgeNotice, setBadgeNotice] = useState<Record<number, string>>({});
  const [pendingConnections, setPendingConnections] = useState<{ id: number; other_person: { first_name: string; last_name: string } | null }[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const studentData = await getCurrentStudent();
        if (!studentData) return;
        setStudent(studentData);

        const [goalsData, pagesData, entriesData, boardRes] = await Promise.all([
          directus.request(
            readItems('personal_goals', {
              filter: { student_id: { _eq: studentData.id } },
              sort: ['-created_at'],
              limit: 5,
            })
          ) as Promise<PersonalGoal[]>,

          directus.request(
            readItems('portfolio_pages', {
              filter: { student_id: { _eq: studentData.id } },
              sort: ['-updated_at'],
              limit: 3,
            })
          ) as Promise<PortfolioPage[]>,

          directus.request(
            readItems('calendar_entries', {
              filter: {
                student_id: { _eq: studentData.id },
                date: { _eq: new Date().toLocaleDateString('en-CA') }, // local YYYY-MM-DD
              },
              sort: ['created_at'],
            })
          ) as Promise<CalendarEntry[]>,

          fetch(
            `/api/directus/items/dream_board_items?filter[student_id][_eq]=${studentData.id}&filter[on_board][_eq]=true&sort[]=z_index&limit=9`
          ).then(r => r.json()),
        ]);

        setGoals(goalsData ?? []);
        setRecentPages(pagesData ?? []);
        setTodayEntries(entriesData ?? []);
        setBoardItems(boardRes.data ?? []);

        if (!studentData.is_teacher) {
          const connRes = await fetch('/api/connections');
          if (connRes.ok) {
            const connData = await connRes.json() as {
              connections?: { id: number; status: string; other_person: { first_name: string; last_name: string } | null }[]
            };
            setPendingConnections((connData.connections ?? []).filter(c => c.status === 'pending'));
          }
        }

        // Load active badges
        const badgeRes = await fetch('/api/user-badges');
        if (badgeRes.ok) {
          const badgeData = await badgeRes.json() as { user_badges: UserBadge[] };
          setActiveBadges((badgeData.user_badges ?? []).filter(ub => ub.status === 'active'));
        }
      } catch (error) {
        console.error('Chyba při načítání dashboard dat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  async function handleCheckin(ubId: number) {
    setCheckingIn(ubId);
    setBadgeNotice(prev => ({ ...prev, [ubId]: '' }));
    const res = await fetch(`/api/user-badges/${ubId}/checkin`, { method: 'POST' }).catch(() => null);
    if (!res?.ok) {
      const err = res ? await res.json().catch(() => ({})) as { message?: string } : {};
      setBadgeNotice(prev => ({ ...prev, [ubId]: err.message ?? t('Uložení se nepovedlo, zkus to prosím znovu.', 'Saving didn’t work, please try again.') }));
    } else {
      const data = await res.json() as {
        completed?: boolean;
        restarted?: boolean;
        user_badge?: { steps_done: number; last_step_date: string | null };
      };
      if (data.completed) {
        const ub = activeBadges.find(b => b.id === ubId);
        const badge = ub ? BADGES.find(b => b.slug === ub.badge_slug) : null;
        if (badge) setCelebratedBadge(badge);
        setActiveBadges(prev => prev.filter(b => b.id !== ubId));
        window.dispatchEvent(new Event('pp-badges-changed')); // top bar shows the new badge
      } else {
        if (data.restarted) {
          setBadgeNotice(prev => ({ ...prev, [ubId]: t('Jeden den se vynechal, tak začínáš znovu od 1. dne. Ty to zvládneš! 💪', 'You missed a day, so you’re starting again from day 1. You can do it! 💪') }));
        }
        setActiveBadges(prev => prev.map(ub =>
          ub.id === ubId
            // Server is the source of truth — a skipped day restarts the streak
            ? { ...ub, steps_done: data.user_badge?.steps_done ?? ub.steps_done + 1, last_step_date: data.user_badge?.last_step_date ?? pragueToday() }
            : ub
        ));
      }
    }
    setCheckingIn(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">{t('Načítám dashboard...', 'Loading dashboard...')}</p>
        </div>
      </div>
    );
  }

  const completedGoals = goals.filter((g) => g.completed).length;
  const onBoardCount = boardItems.length;

  return (
    <div className="space-y-6">
      {pendingConnections.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="flex-shrink-0 bg-amber-100 rounded-full p-2">
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">
              {pendingConnections.length === 1
                ? t('Máš novou žádost o propojení od učitele', 'You have a new connection request from a teacher')
                : t(`Máš ${pendingConnections.length} nové žádosti o propojení`, `You have ${pendingConnections.length} new connection requests`)}
            </p>
            <p className="text-xs text-amber-700 mt-0.5 truncate">
              {pendingConnections
                .map(c => c.other_person ? `${c.other_person.first_name} ${c.other_person.last_name}` : null)
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
          <Link href="/dashboard/share">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap flex-shrink-0">
              {t('Zobrazit žádosti →', 'View requests →')}
            </Button>
          </Link>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{t('Vítejte', 'Welcome')}, {student?.first_name}! 👋</h1>
        <p className="text-blue-100">{t('Jaký je váš dnešní plán? Podívejte se na své cíle a portfolio.', 'What’s your plan for today? Take a look at your goals and portfolio.')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Osobní cíle', 'Personal goals')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals}/{goals.length}</div>
            <p className="text-xs text-muted-foreground">{t('dokončených cílů', 'goals completed')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Nástěnka snů', 'Dream board')}</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onBoardCount}</div>
            <p className="text-xs text-muted-foreground">{t('obrázků na nástěnce', 'pictures on the board')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Dnešní plány', 'Today’s plans')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEntries.length}</div>
            <p className="text-xs text-muted-foreground">{t('záznamů na dnes', 'entries for today')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Aktivní bobříci */}
      {activeBadges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-xl">🦫</span> {t('Aktivní bobříci', 'Active beavers')}
              </CardTitle>
              <Link href="/dashboard/world">
                <Button variant="ghost" size="sm" className="text-xs text-gray-500">{t('Světoběžník →', 'Globetrotter →')}</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeBadges.map(ub => {
                const badge = BADGES.find(b => b.slug === ub.badge_slug);
                if (!badge) return null;
                const today = pragueToday();
                const doneTodayAlready = toPragueDate(ub.last_step_date) === today;
                return (
                  <div key={ub.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
                    <p className="font-medium text-sm text-gray-900 leading-tight">{t(badge.name)}</p>
                    <div className="flex gap-1">
                      {Array.from({ length: badge.total_steps }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2 rounded-full ${i < ub.steps_done ? 'bg-teal-500' : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{ub.steps_done}/{badge.total_steps} {t('dní', 'days')}</p>
                    <button
                      onClick={() => handleCheckin(ub.id)}
                      disabled={doneTodayAlready || checkingIn === ub.id}
                      className={`w-full text-xs py-1.5 px-2 rounded-md font-medium transition-colors ${
                        doneTodayAlready
                          ? 'bg-teal-50 text-teal-600 cursor-default'
                          : 'bg-teal-500 hover:bg-teal-600 text-white'
                      }`}
                    >
                      {checkingIn === ub.id ? t('Ukládám...', 'Saving...') : doneTodayAlready
                        ? <span className="flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3" /> {t('Dnes splněno', 'Done today')}</span>
                        : <span className="flex items-center justify-center gap-1"><Flame className="h-3 w-3" /> {t('Dnes splněno', 'Done today')}</span>}
                    </button>
                    {badgeNotice[ub.id] && <p className="text-xs text-amber-700">{badgeNotice[ub.id]}</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nedávné cíle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('Nedávné cíle', 'Recent goals')}</CardTitle>
              <Link href="/dashboard/goals">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('Nový cíl', 'New goal')}
                </Button>
              </Link>
            </div>
            <CardDescription>{t('Vaše aktuální osobní cíle', 'Your current personal goals')}</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>{t('Zatím nemáte žádné cíle', 'You don’t have any goals yet')}</p>
                <Link href="/dashboard/goals">
                  <Button variant="outline" size="sm" className="mt-2">{t('Vytvořit první cíl', 'Create your first goal')}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div key={goal.id} className="flex items-center space-x-3">
                    {goal.completed
                      ? <CheckCircle className="h-5 w-5 text-green-500" />
                      : <Circle className="h-5 w-5 text-gray-400" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{goal.title}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {goal.goal_type === 'short_term' && t('Krátkodobý', 'Short-term')}
                          {goal.goal_type === 'long_term' && t('Dlouhodobý', 'Long-term')}
                          {goal.goal_type === 'lifelong' && t('Celoživotní', 'Lifelong')}
                        </Badge>
                        {goal.target_date && (
                          <span className="text-xs text-gray-500">
                            {t('do', 'by')} {new Date(goal.target_date).toLocaleDateString(intl)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nástěnka snů */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('Nástěnka snů', 'Dream board')}</CardTitle>
              <Link href="/dashboard/dreamboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  {t('Otevřít', 'Open')}
                </Button>
              </Link>
            </div>
            <CardDescription>{t('Vaše vize a inspirace', 'Your visions and inspiration')}</CardDescription>
          </CardHeader>
          <CardContent>
            {boardItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <LayoutDashboard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>{t('Nástěnka je zatím prázdná', 'The board is empty so far')}</p>
                <Link href="/dashboard/goals?tab=dreams">
                  <Button variant="outline" size="sm" className="mt-2">{t('Přidat obrázky ke snům', 'Add pictures to your dreams')}</Button>
                </Link>
              </div>
            ) : (
              <Link href="/dashboard/dreamboard" className="block group">
                <div className="grid grid-cols-3 gap-1 rounded overflow-hidden">
                  {boardItems.slice(0, 9).map((item) => (
                    <img
                      key={item.id}
                      src={`/api/asset/${item.file_id}?width=150&height=100&fit=cover&format=webp`}
                      alt=""
                      className="w-full h-20 object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">{t('Klikněte pro otevření nástěnky', 'Click to open the board')}</p>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Nedávné stránky portfolia */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('Nedávné stránky', 'Recent pages')}</CardTitle>
              <Link href="/dashboard/portfolio/new">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('Nová stránka', 'New page')}
                </Button>
              </Link>
            </div>
            <CardDescription>{t('Vaše nejnovější práce v portfoliu', 'Your latest work in the portfolio')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPages.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>{t('Zatím nemáte žádné stránky', 'You don’t have any pages yet')}</p>
                <Link href="/dashboard/portfolio/new">
                  <Button variant="outline" size="sm" className="mt-2">{t('Vytvořit první stránku', 'Create your first page')}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPages.map((page) => (
                  <Link key={page.id} href={`/dashboard/portfolio/${page.id}`}>
                    <div className="flex items-center space-x-3 hover:bg-gray-50 rounded p-1">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{page.title}</p>
                        <p className="text-xs text-gray-500">
                          {safeFormatDate(page.updated_at, undefined, locale)}
                        </p>
                      </div>
                      <Badge variant={page.visibility === 'shared' ? 'default' : 'secondary'}>
                        {page.visibility === 'shared' ? t('Sdílené', 'Shared') : t('Soukromé', 'Private')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dnešní plány */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('Dnešní plány', 'Today’s plans')}</CardTitle>
              <Link href="/dashboard/calendar">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  {t('Kalendář', 'Calendar')}
                </Button>
              </Link>
            </div>
            <CardDescription>{t('Co máte naplánováno na dnes', 'What you have planned for today')}</CardDescription>
          </CardHeader>
          <CardContent>
            {todayEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>{t('Dnes nemáte žádné plány', 'No plans for today')}</p>
                <Link href="/dashboard/calendar">
                  <Button variant="outline" size="sm" className="mt-2">{t('Přidat plán', 'Add a plan')}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center space-x-3">
                    {entry.completed
                      ? <CheckCircle className="h-5 w-5 text-green-500" />
                      : <Circle className="h-5 w-5 text-gray-400" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{entry.title || t('Bez názvu', 'Untitled')}</p>
                      <Badge variant="outline" className="text-xs">
                        {entry.entry_type === 'plan' && t('Plán', 'Plan')}
                        {entry.entry_type === 'event' && t('Událost', 'Event')}
                        {entry.entry_type === 'goal_deadline' && 'Deadline'}
                        {entry.entry_type === 'reflection' && t('Reflexe', 'Reflection')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Celebration overlay ── */}
      {celebratedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <style>{`
            @keyframes confettiFall {
              0%   { transform: translateY(-20px) rotate(0deg) scale(1); opacity: 1; }
              85%  { opacity: 1; }
              100% { transform: translateY(110vh) rotate(740deg) scale(0.6); opacity: 0; }
            }
            .pp-confetti { animation: confettiFall linear forwards; position: absolute; top: -10px; }
          `}</style>

          {/* Confetti layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {CONFETTI.map((c, i) => (
              <div
                key={i}
                className="pp-confetti"
                style={{
                  left: c.left,
                  width: c.size,
                  height: c.size,
                  background: c.color,
                  borderRadius: c.round ? '50%' : '2px',
                  animationDelay: c.delay,
                  animationDuration: c.dur,
                }}
              />
            ))}
          </div>

          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCelebratedBadge(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-3xl px-8 py-10 text-center shadow-2xl max-w-xs w-full mx-4">
            <div className="text-7xl mb-4 select-none">🦫</div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{t('Máš bobříka!', 'You got a beaver!')}</h2>
            <p className="text-base font-semibold text-teal-600 mb-4">{t(celebratedBadge.name)}</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-amber-50 rounded-2xl px-4 py-3 mb-4">
              {t(celebratedBadge.praise)}
            </p>
            <p className="text-xs text-gray-400 mb-7">{t('Platnost 1 rok · zobrazí se v tvém profilu', 'Valid for 1 year · shown in your profile')}</p>
            <button
              onClick={() => setCelebratedBadge(null)}
              className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white rounded-2xl py-3 font-bold text-base transition-colors"
            >
              {t('Hurá! 🎉', 'Hooray! 🎉')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
