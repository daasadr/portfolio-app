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
import { Save, Plus, Trash2, User, Tag, Pencil } from 'lucide-react';
import { getCurrentStudent, directus, readItems, updateItem, createItem, deleteItem } from '@/lib/directus';
import type { Student, Category } from '@/types';

export default function SettingsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
  });

  // Kategorie
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getCurrentStudent();
        if (!s) return;
        setStudent(s);
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

  async function deleteCat(id: string) {
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
    </div>
  );
}
