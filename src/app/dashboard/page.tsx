'use client';

import { useState, useEffect } from 'react';
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
  Star,
} from 'lucide-react';
import { getCurrentStudent, directus, readItems } from '@/lib/directus';
import type { Student, PersonalGoal, Dream, PortfolioPage, CalendarEntry } from '@/types';

export default function DashboardPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [recentPages, setRecentPages] = useState<PortfolioPage[]>([]);
  const [todayEntries, setTodayEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const studentData = await getCurrentStudent();
        if (!studentData) return;
        setStudent(studentData);

        const [goalsData, dreamsData, pagesData, entriesData] = await Promise.all([
          directus.request(
            readItems('personal_goals', {
              filter: { student_id: { _eq: studentData.id } },
              sort: ['-created_at'],
              limit: 5,
            })
          ) as Promise<PersonalGoal[]>,

          directus.request(
            readItems('dreams', {
              filter: { student_id: { _eq: studentData.id } },
              sort: ['-created_at'],
              limit: 3,
            })
          ) as Promise<Dream[]>,

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
                date: { _eq: new Date().toISOString().split('T')[0] },
              },
              sort: ['created_at'],
            })
          ) as Promise<CalendarEntry[]>,
        ]);

        setGoals(goalsData ?? []);
        setDreams(dreamsData ?? []);
        setRecentPages(pagesData ?? []);
        setTodayEntries(entriesData ?? []);
      } catch (error) {
        console.error('Chyba při načítání dashboard dat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Načítám dashboard...</p>
        </div>
      </div>
    );
  }

  const completedGoals = goals.filter((g) => g.completed).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Vítejte, {student?.first_name}! 👋</h1>
        <p className="text-blue-100">Jaký je váš dnešní plán? Podívejte se na své cíle a portfolio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Osobní cíle</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals}/{goals.length}</div>
            <p className="text-xs text-muted-foreground">dokončených cílů</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPages.length}</div>
            <p className="text-xs text-muted-foreground">nedávných stránek</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dnešní plány</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEntries.length}</div>
            <p className="text-xs text-muted-foreground">záznamů na dnes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nedávné cíle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nedávné cíle</CardTitle>
              <Link href="/dashboard/goals">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nový cíl
                </Button>
              </Link>
            </div>
            <CardDescription>Vaše aktuální osobní cíle</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Zatím nemáte žádné cíle</p>
                <Link href="/dashboard/goals">
                  <Button variant="outline" size="sm" className="mt-2">Vytvořit první cíl</Button>
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
                          {goal.goal_type === 'short_term' && 'Krátkodobý'}
                          {goal.goal_type === 'long_term' && 'Dlouhodobý'}
                          {goal.goal_type === 'lifelong' && 'Celoživotní'}
                        </Badge>
                        {goal.target_date && (
                          <span className="text-xs text-gray-500">
                            do {new Date(goal.target_date).toLocaleDateString('cs-CZ')}
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

        {/* Sny */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mé sny</CardTitle>
              <Link href="/dashboard/goals">
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4 mr-1" />
                  Spravovat
                </Button>
              </Link>
            </div>
            <CardDescription>Vaše dlouhodobé aspirace</CardDescription>
          </CardHeader>
          <CardContent>
            {dreams.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Star className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Zatím nemáte žádné sny</p>
                <Link href="/dashboard/goals">
                  <Button variant="outline" size="sm" className="mt-2">Přidat první sen</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {dreams.map((dream) => (
                  <div key={dream.id} className="flex items-start space-x-3">
                    <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{dream.title}</p>
                      {dream.description && (
                        <p className="text-xs text-gray-600 mt-1">{dream.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nedávné stránky portfolia */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nedávné stránky</CardTitle>
              <Link href="/dashboard/portfolio/new">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nová stránka
                </Button>
              </Link>
            </div>
            <CardDescription>Vaše nejnovější práce v portfoliu</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPages.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Zatím nemáte žádné stránky</p>
                <Link href="/dashboard/portfolio/new">
                  <Button variant="outline" size="sm" className="mt-2">Vytvořit první stránku</Button>
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
                          {new Date(page.updated_at).toLocaleDateString('cs-CZ')}
                        </p>
                      </div>
                      <Badge variant={page.visibility === 'shared' ? 'default' : 'secondary'}>
                        {page.visibility === 'shared' ? 'Sdílené' : 'Soukromé'}
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
              <CardTitle>Dnešní plány</CardTitle>
              <Link href="/dashboard/calendar">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  Kalendář
                </Button>
              </Link>
            </div>
            <CardDescription>Co máte naplánováno na dnes</CardDescription>
          </CardHeader>
          <CardContent>
            {todayEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Dnes nemáte žádné plány</p>
                <Link href="/dashboard/calendar">
                  <Button variant="outline" size="sm" className="mt-2">Přidat plán</Button>
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
                      <p className="text-sm font-medium">{entry.title || 'Bez názvu'}</p>
                      <Badge variant="outline" className="text-xs">
                        {entry.entry_type === 'plan' && 'Plán'}
                        {entry.entry_type === 'event' && 'Událost'}
                        {entry.entry_type === 'goal_deadline' && 'Deadline'}
                        {entry.entry_type === 'reflection' && 'Reflexe'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
