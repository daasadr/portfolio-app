'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
import { Save, Plus, Trash2, User, Tag, Pencil, Palette, Check, Lock, ShieldQuestion, Download, AlertTriangle } from 'lucide-react';
import { getCurrentStudent, getCurrentUser, directus, readItems, updateItem, createItem, deleteItem, logout } from '@/lib/directus';
import { BgPicker, bgStyle } from '@/components/portfolio/CategoryEditor';
import { CUSTOM_QUESTION, questionLabel } from '@/lib/security-questions';
import { SecurityQuestionPicker } from '@/components/SecurityQuestionPicker';
import type { Student, Category } from '@/types';
import { useLocale } from '@/components/LocaleProvider';

const DEFAULT_BG = '/images/paradise-bg.webp';

export default function SettingsPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  // Potvrzovací slovo pro smazání účtu (kontroluje se jen na klientovi)
  const deleteWord = t('SMAZAT', 'DELETE');
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

  // Export
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'raw'>('html');
  const [exportSections, setExportSections] = useState({ portfolio: true, goals: true, dreamboard: true, reading_diary: true });
  const [exportPrivacy, setExportPrivacy] = useState<'all' | 'shared'>('all');
  const [exporting, setExporting] = useState(false);

  // Smazání účtu
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Bezpečnostní otázka
  const [sqCurrentRaw, setSqCurrentRaw] = useState<{ question: number | null; text: string | null } | null>(null);
  const sqCurrent = sqCurrentRaw ? questionLabel(sqCurrentRaw.question, sqCurrentRaw.text, locale) : null;
  const [sqForm, setSqForm] = useState({ question: -1, customText: '', answer: '' });
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
        const sqRes = await fetch('/api/security-question');
        if (sqRes.ok) {
          const sqData = await sqRes.json() as { security_question: number | null; security_question_text: string | null };
          setSqCurrentRaw({ question: sqData.security_question, text: sqData.security_question_text });
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
    if (pwForm.next.length < 8) { setPwError(t('Nové heslo musí mít alespoň 8 znaků.', 'Your new password must be at least 8 characters long.')); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError(t('Nová hesla se neshodují.', 'The new passwords don\'t match.')); return; }
    setPwSaving(true);
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    });
    const data = await res.json() as { message?: string };
    if (!res.ok) { setPwError(data.message ?? t('Chyba', 'Error')); } else {
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
    }
    setPwSaving(false);
  }

  async function saveSecurityQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSqError('');
    setSqSuccess(false);
    if (sqForm.question < 0) { setSqError(t('Vyberte otázku.', 'Choose a question.')); return; }
    if (sqForm.question === CUSTOM_QUESTION && sqForm.customText.trim().length < 5) { setSqError(t('Napište svou otázku (alespoň 5 znaků).', 'Write your own question (at least 5 characters).')); return; }
    if (!sqForm.answer.trim()) { setSqError(t('Vyplňte odpověď.', 'Fill in the answer.')); return; }
    setSqSaving(true);
    const res = await fetch('/api/security-question', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ security_question: sqForm.question, security_question_text: sqForm.customText, security_answer: sqForm.answer }),
    });
    const data = await res.json() as { message?: string };
    if (!res.ok) { setSqError(data.message ?? t('Chyba', 'Error')); } else {
      setSqSuccess(true);
      setSqCurrentRaw({ question: sqForm.question, text: sqForm.customText });
      setSqForm({ question: -1, customText: '', answer: '' });
    }
    setSqSaving(false);
  }

  async function handleExport() {
    const activeSections = (Object.keys(exportSections) as (keyof typeof exportSections)[])
      .filter(k => exportSections[k]);
    if (!activeSections.length) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: exportFormat, sections: activeSections, privacy: exportPrivacy }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1]
        ?? `portfolio_export_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDialogOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== deleteWord) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json() as { message?: string };
        setDeleteError(d.message ?? t('Chyba při mazání účtu', 'Error deleting your account'));
        return;
      }
      logout();
      router.push('/');
    } catch {
      setDeleteError(t('Chyba připojení', 'Connection error'));
    } finally {
      setDeleting(false);
    }
  }

  async function deleteCat(id: number) {
    if (!confirm(t('Smazat tuto kategorii? Stránky v ní zůstanou, jen bez kategorie.', 'Delete this category? Its pages will stay, just without a category.'))) return;
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
      <h1 className="text-2xl font-bold text-gray-900">{t('Nastavení', 'Settings')}</h1>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('Profil', 'Profile')}
          </CardTitle>
          <CardDescription>{t('Vaše osobní informace', 'Your personal details')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="space-y-1">
              <Label>{t('E-mail (přihlašovací)', 'Email (for logging in)')}</Label>
              <Input value={email} readOnly className="bg-gray-50 text-gray-500 cursor-default" />
              <p className="text-xs text-gray-400">{t('E-mail nelze změnit přes tuto stránku.', 'Your email can\'t be changed on this page.')}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('Jméno', 'First name')}</Label>
              <Input
                value={profileForm.first_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Příjmení', 'Surname')}</Label>
              <Input
                value={profileForm.last_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Datum narození', 'Date of birth')}</Label>
            <Input
              type="date"
              value={profileForm.date_of_birth}
              onChange={(e) => setProfileForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={saveStatus === 'saving'}>
              <Save className="h-4 w-4 mr-2" />
              {saveStatus === 'saving' ? t('Ukládám...', 'Saving...') : saveStatus === 'saved' ? t('Uloženo ✓', 'Saved ✓') : t('Uložit profil', 'Save profile')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pozadí aplikace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('Pozadí aplikace', 'App background')}
          </CardTitle>
          <CardDescription>{t('Vyberte pozadí, které se zobrazí na všech stránkách', 'Choose a background to show on every page')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('Výchozí', 'Default')}</p>
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
                {t('Kategorie portfolia', 'Portfolio categories')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('Organizujte stránky do kategorií', 'Sort your pages into categories')}
              </CardDescription>
            </div>
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={openNewCat}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('Přidat', 'Add')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCat ? t('Upravit kategorii', 'Edit category') : t('Nová kategorie', 'New category')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label>{t('Název *', 'Name *')}</Label>
                    <Input
                      placeholder={t('Např. Fyzika', 'E.g. Physics')}
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCatDialogOpen(false)}>{t('Zrušit', 'Cancel')}</Button>
                    <Button onClick={saveCat} disabled={catSaving || !catName.trim()}>
                      {catSaving ? t('Ukládám...', 'Saving...') : t('Uložit', 'Save')}
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
                    <Badge variant="secondary" className="text-xs">{t('Výchozí', 'Default')}</Badge>
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
              <p className="text-sm text-gray-400 text-center py-4">{t('Žádné kategorie', 'No categories')}</p>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Změna hesla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('Změna hesla', 'Change password')}
          </CardTitle>
          <CardDescription>{t('Změňte své přihlašovací heslo', 'Change the password you log in with')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-1">
              <Label>{t('Stávající heslo', 'Current password')}</Label>
              <PasswordInput
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Nové heslo', 'New password')}</Label>
              <PasswordInput

                value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                placeholder={t('Alespoň 8 znaků', 'At least 8 characters')}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Potvrdit nové heslo', 'Confirm new password')}</Label>
              <PasswordInput

                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            {pwError && <p className="text-sm text-red-500">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-600">{t('Heslo bylo úspěšně změněno.', 'Your password has been changed.')}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={pwSaving}>
                <Save className="h-4 w-4 mr-2" />
                {pwSaving ? t('Ukládám...', 'Saving...') : t('Změnit heslo', 'Change password')}
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
            {t('Bezpečnostní otázka', 'Security question')}
          </CardTitle>
          <CardDescription>
            {sqCurrent != null
              ? `${t('Aktuální otázka:', 'Current question:')} ${sqCurrent}`
              : t('Bezpečnostní otázka není nastavena — slouží pro obnovu zapomenutého hesla.', 'No security question set — it helps you reset a forgotten password.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSecurityQuestion} className="space-y-3">
            <div className="space-y-1">
              <Label>{t('Nová otázka a odpověď', 'New question and answer')}</Label>
              <SecurityQuestionPicker
                question={sqForm.question}
                onQuestion={question => setSqForm(f => ({ ...f, question }))}
                customText={sqForm.customText}
                onCustomText={customText => setSqForm(f => ({ ...f, customText }))}
                answer={sqForm.answer}
                onAnswer={answer => setSqForm(f => ({ ...f, answer }))}
              />
            </div>
            {sqError && <p className="text-sm text-red-500">{sqError}</p>}
            {sqSuccess && <p className="text-sm text-green-600">{t('Bezpečnostní otázka byla aktualizována.', 'Your security question has been updated.')}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={sqSaving || sqForm.question < 0}>
                <Save className="h-4 w-4 mr-2" />
                {sqSaving ? t('Ukládám...', 'Saving...') : t('Uložit otázku', 'Save question')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Export dat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('Export mých dat', 'Export my data')}
          </CardTitle>
          <CardDescription>
            {t('Stáhněte si kopii svých dat jako ZIP soubor (GDPR čl. 20 — právo na přenositelnost).', 'Download a copy of your data as a ZIP file (GDPR Art. 20 — right to data portability).')}{' '}
            <Link href="/privacy" className="underline underline-offset-2 text-blue-500 hover:text-blue-700">{t('Zásady ochrany osobních údajů', 'Privacy policy')}</Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('Exportovat data...', 'Export data...')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('Exportovat portfolio', 'Export portfolio')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-1">

                {/* Formát */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">{t('Formát', 'Format')}</p>
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <input type="radio" name="format" value="html" checked={exportFormat === 'html'}
                      onChange={() => setExportFormat('html')} className="mt-0.5" />
                    <span>
                      <span className="block font-medium text-sm">{t('Prohlížitelný HTML archiv', 'Viewable HTML archive')}</span>
                      <span className="block text-xs text-gray-500">{t('Rozbal ZIP, otevři index.html v prohlížeči. Lze tisknout nebo uložit jako PDF.', 'Unzip it and open index.html in your browser. You can print it or save it as a PDF.')}</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <input type="radio" name="format" value="raw" checked={exportFormat === 'raw'}
                      onChange={() => setExportFormat('raw')} className="mt-0.5" />
                    <span>
                      <span className="block font-medium text-sm">{t('Záloha souborů', 'File backup')}</span>
                      <span className="block text-xs text-gray-500">{t('Složky s texty (.txt) + originální fotky a videa. Vhodné pro přenos na jiný systém.', 'Folders with texts (.txt) plus the original photos and videos. Handy for moving to another system.')}</span>
                    </span>
                  </label>
                </div>

                {/* Co exportovat */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">{t('Co exportovat', 'What to export')}</p>
                  <div className="space-y-2">
                    {([
                      ['portfolio', t('Portfolio stránky', 'Portfolio pages')] as const,
                      ['goals', t('Cíle a přání', 'Goals and wishes')] as const,
                      ['dreamboard', t('Dream board', 'Dream board')] as const,
                      ['reading_diary', t('Čtenářský deník', 'Reading diary')] as const,
                    ]).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer py-1">
                        <input type="checkbox" checked={exportSections[key]}
                          onChange={e => setExportSections(s => ({ ...s, [key]: e.target.checked }))}
                          className="rounded" />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Viditelnost (jen pro portfolio) */}
                {exportSections.portfolio && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">{t('Portfolio stránky', 'Portfolio pages')}</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name="privacy" value="all" checked={exportPrivacy === 'all'}
                          onChange={() => setExportPrivacy('all')} />
                        {t('Vše (i soukromé)', 'All (including private)')}
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name="privacy" value="shared" checked={exportPrivacy === 'shared'}
                          onChange={() => setExportPrivacy('shared')} />
                        {t('Jen sdílené', 'Shared only')}
                      </label>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400">{t('Export může trvat chvíli, pokud máš hodně příloh.', 'The export may take a moment if you have lots of attachments.')}</p>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>{t('Zrušit', 'Cancel')}</Button>
                  <Button
                    onClick={handleExport}
                    disabled={exporting || !Object.values(exportSections).some(Boolean)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? t('Připravuji...', 'Preparing...') : t('Stáhnout ZIP', 'Download ZIP')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Smazání účtu */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            {t('Smazání účtu', 'Delete account')}
          </CardTitle>
          <CardDescription>
            {t('Nevratně smaže váš účet a všechna data — portfolio, stránky, kategorie, propojení (GDPR čl. 17 — právo na výmaz).', 'Permanently deletes your account and all your data — portfolio, pages, categories, connections (GDPR Art. 17 — right to erasure).')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            {t('Pro potvrzení napište do pole', 'To confirm, type')} <span className="font-mono font-semibold">{deleteWord}</span>{t(':', ' in the box:')}
          </p>
          <Input
            value={deleteConfirm}
            onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
            placeholder={deleteWord}
            className="max-w-xs font-mono"
          />
          {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== deleteWord || deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? t('Mažu účet...', 'Deleting account...') : t('Trvale smazat účet', 'Delete account permanently')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
