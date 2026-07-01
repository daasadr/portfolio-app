'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Check } from 'lucide-react';
import { getCurrentStudent, directus, readItems, createItem, updateItem, deleteItem } from '@/lib/directus';
import type { Category } from '@/types';

// ── Předdefinované školní předměty ──────────────────────────────────────────
const PREDEFINED_NAMES = [
  'Matematika', 'Čeština', 'Angličtina', 'Němčina', 'Španělština',
  'Přírodověda', 'Prvouka', 'Dějepis', 'Zeměpis',
  'Fyzika', 'Chemie', 'Biologie', 'Informatika',
  'Výtvarná výchova', 'Hudební výchova', 'Tělesná výchova',
  'Pracovní výchova', 'Já a svět', 'Pokusy',
  'Výlety a exkurze', 'Vlastní tvorba', 'Projekty',
  'Sport a pohyb', 'Příroda a zahrada',
  'Vaření a pečení', 'Umění a řemesla',
  'Jazyky', 'Technologie', 'Ostatní',
];

// ── Pozadí – barvy ───────────────────────────────────────────────────────────
const BG_COLORS = [
  '#ffffff', '#FFF9C4', '#E8F5E9', '#E3F2FD',
  '#F3E5F5', '#FFE0E0', '#FFF3E0', '#E0F7FA',
  '#263238', '#212121',
];

// ── Pozadí – přechody ────────────────────────────────────────────────────────
const BG_GRADIENTS = [
  'linear-gradient(135deg,#F6D365,#FDA085)',
  'linear-gradient(135deg,#A1C4FD,#C2E9FB)',
  'linear-gradient(135deg,#96FBC4,#F9F586)',
  'linear-gradient(135deg,#D9AFD9,#97D9E1)',
  'linear-gradient(135deg,#667EEA,#764BA2)',
  'linear-gradient(135deg,#FF9A9E,#FECFEF)',
  'linear-gradient(135deg,#43E97B,#38F9D7)',
  'linear-gradient(135deg,#2C3E50,#4CA1AF)',
  'linear-gradient(135deg,#F7971E,#FFD200)',
  'linear-gradient(135deg,#FF416C,#FF4B2B)',
];

// ── Pozadí – fotopozadí (soubory v /public/images/backgrounds/) ─────────────
// Zvyšte BG_COUNT při přidání dalších souborů bg25.webp, bg26.webp, ...
const BG_COUNT = 24;
const BG_PHOTOS = Array.from({ length: BG_COUNT }, (_, i) =>
  `/images/backgrounds/bg${i + 1}.webp`
);

// ── Pomocné funkce pro styl a kontrast ───────────────────────────────────────
export function bgStyle(background?: string): React.CSSProperties {
  if (!background) return { backgroundColor: '#f9fafb' };
  if (background.startsWith('linear-gradient')) return { backgroundImage: background };
  if (background.startsWith('/')) return { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { backgroundColor: background };
}

// Vrátí barvu textu (černá/bílá) + stín podle jasu pozadí
export function catTextStyle(background?: string): React.CSSProperties {
  if (!background) return { color: '#1f2937' };
  // Gradient nebo foto — vždy bílá se stínem
  if (background.startsWith('linear-gradient') || background.startsWith('/')) {
    return { color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.6)' };
  }
  // Hex barva — spočítej luminance
  if (background.startsWith('#')) {
    const hex = background.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (lum > 0.55) return { color: '#1f2937' }; // světlé pozadí → tmavý text
    return { color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' };
  }
  return { color: '#1f2937' };
}

// ── Background picker ─────────────────────────────────────────────────────────
function BgPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [photoErrors, setPhotoErrors] = useState<Set<string>>(new Set());

  const Swatch = ({ bg, size = 'md' }: { bg: string; size?: 'sm' | 'md' }) => {
    const active = value === bg;
    const s = size === 'sm' ? 'w-10 h-10' : 'w-9 h-9';
    return (
      <button
        type="button"
        title={bg}
        onClick={() => onChange(bg)}
        className={`${s} rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${active ? 'border-blue-500 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
        style={bgStyle(bg)}
      >
        {active && <Check className="h-3 w-3 text-white drop-shadow" />}
      </button>
    );
  };

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Barvy</p>
        <div className="flex flex-wrap gap-2">
          {BG_COLORS.map(c => <Swatch key={c} bg={c} />)}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Přechody</p>
        <div className="flex flex-wrap gap-2">
          {BG_GRADIENTS.map(g => <Swatch key={g} bg={g} />)}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Fotopozadí ({BG_PHOTOS.length - photoErrors.size} dostupných)
        </p>
        <div className="grid grid-cols-8 gap-1.5">
          {BG_PHOTOS.map(p => photoErrors.has(p) ? null : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`w-10 h-10 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${value === p ? 'border-blue-500 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
            >
              <img
                src={p}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setPhotoErrors(prev => new Set(prev).add(p))}
              />
              {value === p && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white drop-shadow" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Formulář kategorie ────────────────────────────────────────────────────────
interface FormState { name: string; background: string; usePredefined: boolean; predefined: string; }

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<FormState>;
  onSave: (name: string, background: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [usePredefined, setUsePredefined] = useState(initial?.usePredefined ?? true);
  const [predefined, setPredefined] = useState(initial?.predefined ?? PREDEFINED_NAMES[0]);
  const [customName, setCustomName] = useState(initial?.name ?? '');
  const [background, setBackground] = useState(initial?.background ?? BG_GRADIENTS[0]);
  const [saving, setSaving] = useState(false);

  const name = usePredefined ? predefined : customName;
  const valid = name.trim().length > 0;

  async function submit() {
    if (!valid) return;
    setSaving(true);
    try { await onSave(name.trim(), background); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {/* Náhled */}
      <div
        className="w-full h-20 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner transition-all"
        style={{ ...bgStyle(background), ...catTextStyle(background) }}
      >
        {name || 'Nová kategorie'}
      </div>

      {/* Název */}
      <div className="space-y-2">
        <Label>Název kategorie</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUsePredefined(true)}
            className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${usePredefined ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            Ze seznamu
          </button>
          <button
            type="button"
            onClick={() => setUsePredefined(false)}
            className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${!usePredefined ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            Vlastní název
          </button>
        </div>
        {usePredefined ? (
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-white"
            value={predefined}
            onChange={e => setPredefined(e.target.value)}
          >
            {PREDEFINED_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        ) : (
          <Input
            placeholder="Název kategorie..."
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            autoFocus
          />
        )}
      </div>

      {/* Pozadí */}
      <div className="space-y-2">
        <Label>Pozadí karty</Label>
        <BgPicker value={background} onChange={setBackground} />
      </div>

      {/* Akce */}
      <div className="flex gap-2 pt-2">
        <Button onClick={submit} disabled={!valid || saving} className="flex-1">
          {saving ? 'Ukládám...' : 'Uložit kategorii'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Zrušit</Button>
      </div>
    </div>
  );
}

// ── Hlavní CategoryEditor ─────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  onCategoriesChange: (cats: Category[]) => void;
}

export default function CategoryEditor({ open, onClose, onCategoriesChange }: Props) {
  const [student, setStudent] = useState<{ id: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setView('list');
    const load = async () => {
      setLoading(true);
      try {
        const s = await getCurrentStudent();
        if (!s) return;
        setStudent(s);
        const cats = await directus.request(
          readItems('categories', { filter: { student_id: { _eq: s.id } }, sort: ['sort_order'] })
        ) as Category[];
        setCategories(cats ?? []);
        onCategoriesChange(cats ?? []);
      } finally { setLoading(false); }
    };
    load();
  }, [open]);

  async function handleCreate(name: string, background: string) {
    if (!student) return;
    const newCat = await directus.request(
      createItem('categories', {
        student_id: student.id,
        name,
        background,
        is_predefined: false,
        sort_order: categories.length,
      })
    ) as Category;
    const updated = [...categories, newCat];
    setCategories(updated);
    onCategoriesChange(updated);
    setView('list');
  }

  async function handleEdit(name: string, background: string) {
    if (!editing) return;
    await directus.request(
      updateItem('categories', editing.id, { name, background })
    );
    const list = categories.map(c => c.id === editing.id ? { ...c, name, background } : c);
    setCategories(list);
    onCategoriesChange(list);
    setView('list');
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Smazat kategorii "${cat.name}"? Stránky v ní zůstanou bez kategorie.`)) return;
    await directus.request(deleteItem('categories', cat.id));
    const list = categories.filter(c => c.id !== cat.id);
    setCategories(list);
    onCategoriesChange(list);
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {view === 'list' && 'Správa kategorií'}
            {view === 'create' && 'Nová kategorie'}
            {view === 'edit' && `Upravit: ${editing?.name}`}
          </DialogTitle>
        </DialogHeader>

        {view === 'list' && (
          <div className="space-y-3">
            <Button onClick={() => setView('create')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Přidat kategorii
            </Button>
            {loading ? (
              <div className="text-center py-6 text-gray-400">Načítám...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Zatím žádné kategorie.</p>
                <p className="text-sm mt-1">Přidejte první kategorii tlačítkem výše.</p>
              </div>
            ) : (
              categories.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={bgStyle(cat.background)}
                >
                  <div className="flex-1 font-semibold text-sm" style={catTextStyle(cat.background)}>
                    {cat.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEditing(cat); setView('edit'); }}
                    className="p-1.5 rounded bg-white/20 hover:bg-white/40 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-white drop-shadow" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded bg-white/20 hover:bg-red-500/60 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white drop-shadow" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'create' && (
          <CategoryForm onSave={handleCreate} onCancel={() => setView('list')} />
        )}

        {view === 'edit' && editing && (
          <CategoryForm
            initial={{ name: editing.name, background: editing.background ?? BG_GRADIENTS[0], usePredefined: false, predefined: editing.name }}
            onSave={handleEdit}
            onCancel={() => setView('list')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
