'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  ImagePlus,
  LayoutDashboard,
} from 'lucide-react';
import { getCurrentStudent, directus, readItems, createItem, updateItem, deleteItem } from '@/lib/directus';
import type { Student, PersonalGoal, Dream, GoalType, DreamBoardItem } from '@/types';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL!;

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

function getToken() {
  try {
    const s = sessionStorage.getItem('pp_auth');
    if (s) return JSON.parse(s)?.access_token ?? '';
    const l = localStorage.getItem('pp_auth');
    if (l) return JSON.parse(l)?.access_token ?? '';
    return '';
  } catch { return ''; }
}

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

  // Dream images (in dialog)
  const [dreamImages, setDreamImages] = useState<DreamBoardItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dream detail view (expanded card)
  const [expandedDreamId, setExpandedDreamId] = useState<string | null>(null);
  const [expandedImages, setExpandedImages] = useState<Record<string, DreamBoardItem[]>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'dreams') setActiveTab('dreams');
  }, []);

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
    try {
      const updated = await directus.request(
        updateItem('personal_goals', goal.id, { completed: !goal.completed })
      ) as PersonalGoal;
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));
    } catch (e) {
      console.error('toggleGoal error:', e);
    }
  }

  async function deleteGoal(id: string) {
    await directus.request(deleteItem('personal_goals', id));
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  // ── Dreams ─────────────────────────────────────────────
  async function openNewDream() {
    setEditingDream(null);
    setDreamForm({ title: '', description: '' });
    setDreamImages([]);
    setPendingFiles([]);
    setDreamDialogOpen(true);
  }

  async function openEditDream(dream: Dream) {
    setEditingDream(dream);
    setDreamForm({ title: dream.title, description: dream.description ?? '' });
    setPendingFiles([]);
    // Load existing images
    try {
      const token = getToken();
      const res = await fetch(
        `${directusUrl}/items/dream_board_items?filter[dream_id][_eq]=${dream.id}&sort[]=z_index`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      setDreamImages(json.data ?? []);
    } catch {
      setDreamImages([]);
    }
    setDreamDialogOpen(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const total = dreamImages.length + pendingFiles.length + files.length;
    const allowed = Math.max(0, 10 - dreamImages.length - pendingFiles.length);
    setPendingFiles(prev => [...prev, ...files.slice(0, allowed)]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (total > 10) alert(`Maximálně 10 obrázků na sen. Přidáno pouze prvních ${allowed}.`);
  }

  function removePendingFile(idx: number) {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function deleteImage(id: string) {
    const token = getToken();
    await fetch(`${directusUrl}/items/dream_board_items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setDreamImages(prev => prev.filter(i => i.id !== id));
  }

  async function toggleOnBoard(item: DreamBoardItem) {
    const token = getToken();
    const newVal = !item.on_board;
    const body: Record<string, unknown> = { on_board: newVal };
    if (newVal && item.x === 0 && item.y === 0) {
      body.x = 5 + (dreamImages.indexOf(item) * 5) % 60;
      body.y = 5 + (dreamImages.indexOf(item) * 8) % 80;
      body.width = 20;
      body.height = 15;
    }
    await fetch(`${directusUrl}/items/dream_board_items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setDreamImages(prev => prev.map(i => i.id === item.id ? { ...i, ...body } as DreamBoardItem : i));
  }

  async function saveDream() {
    if (!student || !dreamForm.title.trim()) return;
    setDreamSaving(true);
    try {
      let dream: Dream;
      if (editingDream) {
        dream = await directus.request(
          updateItem('dreams', editingDream.id, {
            title: dreamForm.title,
            description: dreamForm.description || undefined,
          })
        ) as Dream;
        setDreams((prev) => prev.map((d) => (d.id === editingDream.id ? dream : d)));
      } else {
        dream = await directus.request(
          createItem('dreams', {
            student_id: student.id,
            title: dreamForm.title,
            description: dreamForm.description || undefined,
          })
        ) as Dream;
        setDreams((prev) => [dream, ...prev]);
      }

      // Upload pending images
      const newItems: DreamBoardItem[] = [];
      if (pendingFiles.length > 0) {
        setUploadingImages(true);
        const token = getToken();
        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i];
          const formData = new FormData();
          formData.append('file', file, file.name);
          const uploadRes = await fetch(`${directusUrl}/files`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const uploadJson = await uploadRes.json();
          const file_id = uploadJson.data?.id;
          if (!file_id) continue;

          const itemRes = await fetch(`${directusUrl}/items/dream_board_items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              file_id,
              dream_id: dream.id,
              student_id: student.id,
              x: 5 + (i * 5) % 60,
              y: 5 + (i * 8) % 80,
              width: 20,
              height: 15,
              z_index: i + 1,
              on_board: false,
            }),
          });
          const itemJson = await itemRes.json();
          if (itemJson.data) newItems.push(itemJson.data);
        }
        setPendingFiles([]);
        setUploadingImages(false);
      }

      // Sync expanded card view immediately (current dreamImages + new uploads)
      setExpandedImages(prev => ({
        ...prev,
        [dream.id]: [...(prev[dream.id] ?? dreamImages), ...newItems],
      }));

      setDreamDialogOpen(false);
    } catch (e) {
      console.error(e);
      setUploadingImages(false);
    } finally {
      setDreamSaving(false);
    }
  }

  async function deleteDream(id: string) {
    await directus.request(deleteItem('dreams', id));
    setDreams((prev) => prev.filter((d) => d.id !== id));
  }

  async function toggleOnBoardFromCard(dreamId: string, item: DreamBoardItem) {
    const token = getToken();
    const newVal = !item.on_board;
    const body: Record<string, unknown> = { on_board: newVal };
    if (newVal && item.x === 0 && item.y === 0) {
      body.x = 5; body.y = 5; body.width = 20; body.height = 15;
    }
    await fetch(`${directusUrl}/items/dream_board_items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setExpandedImages(prev => ({
      ...prev,
      [dreamId]: (prev[dreamId] ?? []).map(i =>
        i.id === item.id ? { ...i, ...body } as DreamBoardItem : i
      ),
    }));
  }

  async function toggleExpandDream(dreamId: string) {
    if (expandedDreamId === dreamId) {
      setExpandedDreamId(null);
      return;
    }
    setExpandedDreamId(dreamId);
    if (!expandedImages[dreamId]) {
      const token = getToken();
      const res = await fetch(
        `${directusUrl}/items/dream_board_items?filter[dream_id][_eq]=${dreamId}&sort[]=z_index`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      setExpandedImages(prev => ({ ...prev, [dreamId]: json.data ?? [] }));
    }
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
  const totalImages = dreamImages.length + pendingFiles.length;

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
                  <DialogDescription>Vyplňte informace o cíli</DialogDescription>
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

          {pendingGoals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktivní cíle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingGoals.map((goal) => (
                  <GoalRow key={goal.id} goal={goal} onToggle={toggleGoal} onEdit={openEditGoal} onDelete={deleteGoal} />
                ))}
              </CardContent>
            </Card>
          )}

          {doneGoals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-gray-500">Splněné cíle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doneGoals.map((goal) => (
                  <GoalRow key={goal.id} goal={goal} onToggle={toggleGoal} onEdit={openEditGoal} onDelete={deleteGoal} />
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
            <Dialog open={dreamDialogOpen} onOpenChange={(open) => { if (!open) setDreamDialogOpen(false); }}>
              <DialogTrigger asChild>
                <Button onClick={openNewDream}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nový sen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingDream ? 'Upravit sen' : 'Nový sen'}</DialogTitle>
                  <DialogDescription>Vyplňte název, popis a přidejte obrázky</DialogDescription>
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
                      rows={3}
                    />
                  </div>

                  {/* Obrázky */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Obrázky ({totalImages}/10)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={totalImages >= 10}
                      >
                        <ImagePlus className="h-4 w-4 mr-1" />
                        Přidat obrázky
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>

                    {/* Existing images */}
                    {dreamImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {dreamImages.map((img) => (
                          <div key={img.id} className="relative group rounded overflow-hidden border border-gray-200">
                            <img
                              src={`/api/asset/${img.file_id}?width=200&height=150&fit=cover&format=webp`}
                              alt=""
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => toggleOnBoard(img)}
                                className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${
                                  img.on_board
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/90 text-gray-700'
                                }`}
                                title={img.on_board ? 'Odebrat z nástěnky' : 'Umístit na nástěnku'}
                              >
                                <LayoutDashboard className="h-3 w-3" />
                                {img.on_board ? 'Na nástěnce' : 'Na nástěnku'}
                              </button>
                              <button
                                onClick={() => deleteImage(img.id)}
                                className="p-1 bg-red-500/90 text-white rounded"
                                title="Smazat obrázek"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            {img.on_board && (
                              <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-400" title="Na nástěnce" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pending files (not yet uploaded) */}
                    {pendingFiles.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Čeká na nahrání:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {pendingFiles.map((file, idx) => (
                            <div key={idx} className="relative group rounded overflow-hidden border border-dashed border-blue-300 bg-blue-50">
                              <img
                                src={URL.createObjectURL(file)}
                                alt=""
                                className="w-full h-24 object-cover opacity-70"
                              />
                              <button
                                onClick={() => removePendingFile(idx)}
                                className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-white text-xs text-center py-0.5 truncate px-1">
                                {file.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {totalImages === 0 && (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 cursor-pointer hover:border-blue-400 hover:text-blue-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Klikněte pro přidání obrázků</p>
                        <p className="text-xs mt-1">Max. 10 obrázků</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDreamDialogOpen(false)}>Zrušit</Button>
                    <Button onClick={saveDream} disabled={dreamSaving || uploadingImages || !dreamForm.title.trim()}>
                      {uploadingImages ? 'Nahrávám obrázky...' : dreamSaving ? 'Ukládám...' : 'Uložit'}
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
            <div className="space-y-3">
              {dreams.map((dream) => {
                const isExpanded = expandedDreamId === dream.id;
                const images = expandedImages[dream.id] ?? [];
                return (
                  <Card key={dream.id} className="relative group overflow-hidden">
                    <CardContent className="pt-4 pb-3">
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => toggleExpandDream(dream.id)}
                      >
                        <Star className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isExpanded ? 'text-yellow-400' : 'text-yellow-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{dream.title}</p>
                          {dream.description && (
                            <p className="text-sm text-gray-600 mt-0.5">{dream.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 flex-shrink-0">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 border-t pt-3">
                          {images.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-2">Žádné obrázky — přidejte je přes tlačítko Upravit</p>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                              {images.map(img => (
                                <div key={img.id} className="flex flex-col rounded overflow-hidden border border-gray-200">
                                  <img
                                    src={`/api/asset/${img.file_id}?width=200&height=200&fit=cover&format=webp`}
                                    alt=""
                                    className="w-full aspect-square object-cover"
                                  />
                                  <button
                                    onClick={() => toggleOnBoardFromCard(dream.id, img)}
                                    className={`w-full text-xs py-1 font-medium transition-colors
                                      ${img.on_board
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                    title={img.on_board ? 'Odebrat z nástěnky' : 'Umístit na nástěnku'}
                                  >
                                    {img.on_board ? '✓ Na nástěnce' : '+ Nástěnka'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => openEditDream(dream)}>
                              <Pencil className="h-3 w-3 mr-1" />
                              Upravit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => deleteDream(dream.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Smazat
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
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
