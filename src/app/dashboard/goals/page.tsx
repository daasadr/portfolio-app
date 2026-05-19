'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Star,
  Plus,
  CheckCircle,
  Circle,
  Trash2,
  Pencil,
} from 'lucide-react';
import { getCurrentStudent, directus, readItems, createItem, updateItem, deleteItem } from '@/lib/directus';
import type { Student, PersonalGoal, Dream, GoalType } from '@/types';

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  short_term: 'Krátkodobý',
  long_term: 'Dlouhodobý',
  lifelong: 'Celoživotní',
};

const GOAL_TYPE_COLORS: Record<GoalType, string> = {
  short_term: 'bg-green-100 text-green-800',
  long_term: 'bg-blue-100 text-blue-800',
  lifelong: 'bg-purple-100 text-purple-800',
};

export default function GoalsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'dreams'>('goals');

  // Goal form state
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PersonalGoal | null>(null);
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    goal_type: 'short_term' as GoalType,
    target_date: '',
  });
  const [goalSaving, setGoalSaving] = useState(false);

  // Dream form state
  const [dreamDialogOpen, setDreamDialogOpen] = useState(false);
  const [editingDream, setEditingDream] = useState<Dream | null>(null);
  const [dreamForm, setDreamForm] = useState({ title: '', description: '' });
  const [dreamSaving, setDreamSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getCurrentStudent();
        if (!s) return;
        setStudent(s);

        const [g, d] = await Promise.all([
          directus.request(
            readItems('personal_goals', {
              filter: { student_id: { _eq: s.id } },
              sort: ['-created_at'],
            })
          ) as Promise<PersonalGoal[]>,
          directus.request(
            readItems('dreams', {
              filter: { student_id: { _eq: s.id } },
              sort: ['-created_at'],
            })
          ) as Promise<Dream[]>,
        ]);

        setGoals(g ?? []);
        setDreams(d ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Goals ──────────────────────────────────────────────
  function openNewGoal() {
    setEditingGoal(null);
    setGoalForm({ title: '', description: '', goal_type: 'short_term', target_date: '' });
    setGoalDialogOpen(true);
  }

  function openEditGoal(goal: PersonalGoal) {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      description: goal.description ?? '',
      goal_type: goal.goal_type,
      target_date: goal.target_date ?? '',
    });
    setGoalDialogOpen(true);
  }

  async function saveGoal() {
    if (!student || !goalForm.title.trim()) return;
    setGoalSaving(true);
    try {
      if (editingGoal) {
        const updated = await directus.request(
          updateItem('personal_goals', editingGoal.id, {
            title: goalForm.title,
            description: goalForm.description || undefined,
            goal_type: goalForm.goal_type,
            target_date: goalForm.target_date || undefined,
          })
        ) as PersonalGoal;
        setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? updated : g)));
      } else {
        const created = await directus.request(
          createItem('personal_goals', {
            student_id: student.id,
            title: goalForm.title,
            description: goalForm.description || undefined,
            goal_type: goalForm.goal_type,
            target_date: goalForm.target_date || undefined,
            completed: false,
          })
        ) as PersonalGoal;
        setGoals((prev) => [created, ...prev]);
      }
      setGoalDialogOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setGoalSaving(false);
    }
  }

  async function toggleGoal(goal: PersonalGoal) {
    const updated = await directus.request(
      updateItem('personal_goals', goal.id, {
        completed: !goal.completed,
        completed_date: !goal.completed ? new Date().toISOString() : undefined,
      })
    ) as PersonalGoal;
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));
  }

  async function deleteGoal(id: string) {
    await directus.request(deleteItem('personal_goals', id));
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  // ── Dreams ─────────────────────────────────────────────
  function openNewDream() {
    setEditingDream(null);
    setDreamForm({ title: '', description: '' });
    setDreamDialogOpen(true);
  }

  function openEditDream(dream: Dream) {
    setEditingDream(dream);
    setDreamForm({ title: dream.title, description: dream.description ?? '' });
    setDreamDialogOpen(true);
  }

  async function saveDream() {
    if (!student || !dreamForm.title.trim()) return;
    setDreamSaving(true);
    try {
      if (editingDream) {
        const updated = await directus.request(
          updateItem('dreams', editingDream.id, {
            title: dreamForm.title,
            description: dreamForm.description || undefined,
          })
        ) as Dream;
        setDreams((prev) => prev.map((d) => (d.id === editingDream.id ? updated : d)));
      } else {
        const created = await directus.request(
          createItem('dreams', {
            student_id: student.id,
            title: dreamForm.title,
            description: dreamForm.description || undefined,
          })
        ) as Dream;
        setDreams((prev) => [created, ...prev]);
      }
      setDreamDialogOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setDreamSaving(false);
    }
  }

  async function deleteDream(id: string) {
    await directus.request(deleteItem('dreams', id));
    setDreams((prev) => prev.filter((d) => d.id !== id));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const pendingGoals = goals.filter((g) => !g.completed);
  const doneGoals = goals.filter((g) => g.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cíle a sny</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'goals' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Target className="h-4 w-4 inline mr-1" />
          Cíle ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('dreams')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'dreams' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Star className="h-4 w-4 inline mr-1" />
          Sny ({dreams.length})
        </button>
      </div>

      {/* ── CÍLE ── */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewGoal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nový cíl
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingGoal ? 'Upravit cíl' : 'Nový cíl'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label>Název cíle *</Label>
                    <Input
                      placeholder="Např. Naučit se násobilku do 10"
                      value={goalForm.title}
                      onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Popis</Label>
                    <Textarea
                      placeholder="Proč chcete tohoto cíle dosáhnout?"
                      value={goalForm.description}
                      onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Typ cíle</Label>
                    <Select
                      value={goalForm.goal_type}
                      onValueChange={(v) => setGoalForm((f) => ({ ...f, goal_type: v as GoalType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short_term">Krátkodobý (dny / týdny)</SelectItem>
                        <SelectItem value="long_term">Dlouhodobý (měsíce / roky)</SelectItem>
                        <SelectItem value="lifelong">Celoživotní</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Termín splnění</Label>
                    <Input
                      type="date"
                      value={goalForm.target_date}
                      onChange={(e) => setGoalForm((f) => ({ ...f, target_date: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Zrušit</Button>
                    <Button onClick={saveGoal} disabled={goalSaving || !goalForm.title.trim()}>
                      {goalSaving ? 'Ukládám...' : 'Uložit'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Aktivní cíle */}
          {pendingGoals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktivní cíle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingGoals.map((goal) => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    onToggle={toggleGoal}
                    onEdit={openEditGoal}
                    onDelete={deleteGoal}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Splněné cíle */}
          {doneGoals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-gray-500">Splněné cíle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doneGoals.map((goal) => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    onToggle={toggleGoal}
                    onEdit={openEditGoal}
                    onDelete={deleteGoal}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {goals.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Zatím nemáte žádné cíle</p>
              <p className="text-sm mt-1">Klikněte na &quot;Nový cíl&quot; a začněte svou cestu.</p>
            </div>
          )}
        </div>
      )}

      {/* ── SNY ── */}
      {activeTab === 'dreams' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dreamDialogOpen} onOpenChange={setDreamDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDream}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nový sen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDream ? 'Upravit sen' : 'Nový sen'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label>Název *</Label>
                    <Input
                      placeholder="Např. Cestovat do Japonska"
                      value={dreamForm.title}
                      onChange={(e) => setDreamForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Popis / proč to chci</Label>
                    <Textarea
                      placeholder="Napište více o svém snu..."
                      value={dreamForm.description}
                      onChange={(e) => setDreamForm((f) => ({ ...f, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDreamDialogOpen(false)}>Zrušit</Button>
                    <Button onClick={saveDream} disabled={dreamSaving || !dreamForm.title.trim()}>
                      {dreamSaving ? 'Ukládám...' : 'Uložit'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {dreams.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Zatím nemáte žádné sny</p>
              <p className="text-sm mt-1">Zapište si, čeho byste jednou chtěli dosáhnout nebo co mít.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dreams.map((dream) => (
                <Card key={dream.id} className="relative group">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Star className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{dream.title}</p>
                        {dream.description && (
                          <p className="text-sm text-gray-600 mt-1">{dream.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => openEditDream(dream)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteDream(dream.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GoalRow({
  goal,
  onToggle,
  onEdit,
  onDelete,
}: {
  goal: PersonalGoal;
  onToggle: (g: PersonalGoal) => void;
  onEdit: (g: PersonalGoal) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-start gap-3 group ${goal.completed ? 'opacity-60' : ''}`}>
      <button onClick={() => onToggle(goal)} className="mt-0.5 flex-shrink-0">
        {goal.completed
          ? <CheckCircle className="h-5 w-5 text-green-500" />
          : <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${goal.completed ? 'line-through text-gray-400' : ''}`}>
          {goal.title}
        </p>
        {goal.description && (
          <p className="text-sm text-gray-500 mt-0.5">{goal.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GOAL_TYPE_COLORS[goal.goal_type]}`}>
            {GOAL_TYPE_LABELS[goal.goal_type]}
          </span>
          {goal.target_date && (
            <span className="text-xs text-gray-500">
              do {new Date(goal.target_date).toLocaleDateString('cs-CZ')}
            </span>
          )}
          {goal.completed && goal.completed_date && (
            <span className="text-xs text-green-600">
              Splněno {new Date(goal.completed_date).toLocaleDateString('cs-CZ')}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700"
          onClick={() => onDelete(goal.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
