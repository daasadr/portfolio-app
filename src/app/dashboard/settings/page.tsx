'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Save, Plus, Trash2, User, Tag, Pencil, Palette, Check, Lock, ShieldQuestion, Eye, EyeOff } from 'lucide-react';
import { getCurrentStudent, getCurrentUser, directus, readItems, updateItem, createItem, deleteItem, getStoredToken } from '@/lib/directus';
import { BgPicker, bgStyle } from '@/components/portfolio/CategoryEditor';
import { SECURITY_QUESTIONS } from '@/lib/security-questions';
import type { Student, Category } from '@/types';

const DEFAULT_BG = '/images/paradise-bg.webp';

export default function SettingsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [email, setEmail] = useState('');

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
  });

  // Kategorie
  const [appBg, setAppBg] = useState(DEFAULT_BG);

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  // Změna hesla
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Bezpečnostní otázka
  const [sqCurrent, setSqCurrent] = useState<number | null>(null);
  const [sqForm, setSqForm] = useState({ question: -1, answer: '' });
  const [sqSaving, setSqSaving] = useState(false);
  const [sqError, setSqError] = useState('');
  const [sqSuccess, setSqSuccess] = useState(false);

  function saveAppBg(bg: string) {
    if (!student) return;
    setAppBg(bg);
    localStorage.setItem(`pp_bg_${student.id}`, bg);
    window.dispatchEvent(new Event('pp-bg-changed'));
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [s, me] = await Promise.all([getCurrentStudent(), getCurrentUser()]);
        if (!s) return;
        setStudent(s);
        if (me && 'email' in me) setEmail((me as { email?: string }).email ?? '');
        const saved = localStorage.getItem(`pp_bg_${s.id}`);
        if (saved) setAppBg(saved);
        setProfileForm({
          first_name: s.first_name,
          last_name: s.last_name,
          date_of_birth: s.date_of_birth ?? '',
        });

        const cats = await directus.request(
          readItems('categories', {
            filter: { student_id: { _eq: s.id } },
            sort: ['sort_order', 'name'],
          })
        ) as Category[];
        setCategories(cats ?? []);

        // Load current security question index
        const sqRes = await fetch('/api/security-question', {
          headers: { Authorization: `Bearer ${getStoredToken()}` },
        });
        if (sqRes.ok) {
          const sqData = await sqRes.json() as { security_question: number | null };
          setSqCurrent(sqData.security_question);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  async function saveProfile() {
    if (!student) return;
    setSaveStatus('saving');
    try {
      const updated = await directus.request(
        updateItem('students', student.id, {
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          date_of_birth: profileForm.date_of_birth || undefined,
        })
      ) as Student;
      setStudent(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  }

  function openNewCat() {
    setEditingCat(null);
    setCatName('');
    setCatDialogOpen(true);
  }

  function openEditCat(cat: Category) {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDialogOpen(true);
  }

  async function saveCat() {
    if (!student || !catName.trim()) return;
    setCatSaving(true);
    try {
      if (editingCat) {
        const updated = await directus.request(
          updateItem('categories', editingCat.id, { name: catName.trim() })
        ) as Category;
        setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? updated : c)));
      } else {
        const maxSort = categories.reduce((m, c) => Math.max(m, c.sort_order), 0);
        const created = await directus.request(
          createItem('categories', {
            student_id: student.id,
            name: catName.trim(),
            sort_order: maxSort + 1,
            is_predefined: false,
          })
        ) as Category;
        setCategories((prev) => [...prev, created]);
      }
      setCatDialogOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setCatSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (pwForm.next.length < 8) { setPwError('Nové heslo musí mít alespoň 8 znaků.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Nová hesla se neshodují.'); return; }
    setPwSaving(true);
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    });
    const data = await res.json() as { message?: string };
    if (!res.ok) { setPwError(data.message ?? 'Chyba'); } else {
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
    }
    setPwSaving(false);
  }

  async function saveSecurityQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSqError('');
    setSqSuccess(false);
    if (sqForm.question < 0) { setSqError('Vyberte otázku.'); return; }
    if (!sqForm.answer.trim()) { setSqError('Vyplňte odpověď.'); return; }
    setSqSaving(true);
    const res = await fetch('/api/security-question', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ security_question: sqForm.question, security_answer: sqForm.answer }),
    });
    const data = await res.json() as { message?: string };
    if (!res.ok) { setSqError(data.message ?? 'Chyba'); } else {
      setSqSuccess(true);
      setSqCurrent(sqForm.question);
      setSqForm({ question: -1, answer: '' });
    }
    setSqSaving(false);
  }

  async function deleteCat(id: number) {
    if (!confirm('Smazat tuto kategorii? Stránky v ní zůstanou, jen bez kategorie.')) return;
    await directus.request(deleteItem('categories', id));
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
          <CardDescription>Vaše osobní informace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="space-y-1">
              <Label>E-mail (přihlašovací)</Label>
              <Input value={email} readOnly className="bg-gray-50 text-gray-500 cursor-default" />
              <p className="text-xs text-gray-400">E-mail nelze změnit přes tuto stránku.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Jméno</Label>
              <Input
                value={profileForm.first_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Příjmení</Label>
              <Input
                value={profileForm.last_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Datum narození</Label>
            <Input
              type="date"
              value={profileForm.date_of_birth}
              onChange={(e) => setProfileForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={saveStatus === 'saving'}>
              <Save className="h-4 w-4 mr-2" />
              {saveStatus === 'saving' ? 'Ukládám...' : saveStatus === 'saved' ? 'Uloženo ✓' : 'Uložit profil'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pozadí aplikace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Pozadí aplikace
          </CardTitle>
          <CardDescription>Vyberte pozadí, které se zobrazí na všech stránkách</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Výchozí</p>
            <button
              type="button"
              onClick={() => saveAppBg(DEFAULT_BG)}
              className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex items-center justify-center transition-all ${appBg === DEFAULT_BG ? 'border-blue-500 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
              style={{ backgroundImage: `url(${DEFAULT_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {appBg === DEFAULT_BG && <Check className="h-3 w-3 text-white drop-shadow" />}
            </button>
          </div>
          <BgPicker value={appBg} onChange={saveAppBg} />
          <div
            className="h-20 rounded-lg border overflow-hidden"
            style={bgStyle(appBg)}
          />
        </CardContent>
      </Card>

      {/* Kategorie */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Kategorie portfolia
              </CardTitle>
              <CardDescription className="mt-1">
                Organizujte stránky do kategorií
              </CardDescription>
            </div>
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={openNewCat}>
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCat ? 'Upravit kategorii' : 'Nová kategorie'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label>Název *</Label>
                    <Input
                      placeholder="Např. Fyzika"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Zrušit</Button>
                    <Button onClick={saveCat} disabled={catSaving || !catName.trim()}>
                      {catSaving ? 'Ukládám...' : 'Uložit'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between group px-3 py-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{cat.name}</span>
                  {cat.is_predefined && (
                    <Badge variant="secondary" className="text-xs">Výchozí</Badge>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => openEditCat(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!cat.is_predefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteCat(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Žádné kategorie</p>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Změna hesla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Změna hesla
          </CardTitle>
          <CardDescription>Změňte své přihlašovací heslo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-1">
              <Label>Stávající heslo</Label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nové heslo</Label>
              <Input
                type="password"
                value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                placeholder="Alespoň 8 znaků"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Potvrdit nové heslo</Label>
              <Input
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            {pwError && <p className="text-sm text-red-500">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-600">Heslo bylo úspěšně změněno.</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={pwSaving}>
                <Save className="h-4 w-4 mr-2" />
                {pwSaving ? 'Ukládám...' : 'Změnit heslo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bezpečnostní otázka */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldQuestion className="h-5 w-5" />
            Bezpečnostní otázka
          </CardTitle>
          <CardDescription>
            {sqCurrent != null
              ? `Aktuální otázka: ${SECURITY_QUESTIONS[sqCurrent]}`
              : 'Bezpečnostní otázka není nastavena — slouží pro obnovu zapomenutého hesla.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSecurityQuestion} className="space-y-3">
            <div className="space-y-1">
              <Label>Nová otázka</Label>
              <select
                value={sqForm.question}
                onChange={e => setSqForm(f => ({ ...f, question: Number(e.target.value) }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={-1} disabled>— Vyberte otázku —</option>
                {SECURITY_QUESTIONS.map((q, i) => (
                  <option key={i} value={i}>{q}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Odpověď</Label>
              <Input
                value={sqForm.answer}
                onChange={e => setSqForm(f => ({ ...f, answer: e.target.value }))}
                placeholder="Vaše odpověď..."
                disabled={sqForm.question < 0}
              />
              <p className="text-xs text-gray-400">Odpověď není citlivá na velká/malá písmena.</p>
            </div>
            {sqError && <p className="text-sm text-red-500">{sqError}</p>}
            {sqSuccess && <p className="text-sm text-green-600">Bezpečnostní otázka byla aktualizována.</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={sqSaving || sqForm.question < 0}>
                <Save className="h-4 w-4 mr-2" />
                {sqSaving ? 'Ukládám...' : 'Uložit otázku'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
