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
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  Circle,
  Trash2,
  Calendar,
} from 'lucide-react';
import { getCurrentStudent, directus, readItems, createItem, updateItem, deleteItem } from '@/lib/directus';
import type { Student, CalendarEntry, EntryType } from '@/types';

const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  plan: 'Plán',
  event: 'Událost',
  goal_deadline: 'Deadline cíle',
  reflection: 'Reflexe',
};

const ENTRY_TYPE_COLORS: Record<EntryType, string> = {
  plan: 'bg-blue-100 text-blue-800',
  event: 'bg-green-100 text-green-800',
  goal_deadline: 'bg-red-100 text-red-800',
  reflection: 'bg-purple-100 text-purple-800',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Pondělí = 0
  return day === 0 ? 6 : day - 1;
}

const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
];

const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

export default function CalendarPage() {
  const today = new Date();
  const [student, setStudent] = useState<Student | null>(null);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    entry_type: 'plan' as EntryType,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getCurrentStudent();
        if (!s) return;
        setStudent(s);

        const data = await directus.request(
          readItems('calendar_entries', {
            filter: { student_id: { _eq: s.id } },
            sort: ['date', 'created_at'],
          })
        ) as CalendarEntry[];
        setEntries(data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  }

  function entriesForDate(dateStr: string) {
    return entries.filter((e) => e.date === dateStr);
  }

  async function handleSave() {
    if (!student) return;
    setSaving(true);
    try {
      const created = await directus.request(
        createItem('calendar_entries', {
          student_id: student.id,
          date: selectedDate,
          title: form.title || undefined,
          description: form.description || undefined,
          entry_type: form.entry_type,
          completed: false,
        })
      ) as CalendarEntry;
      setEntries((prev) => [...prev, created]);
      setForm({ title: '', description: '', entry_type: 'plan' });
      setDialogOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEntry(entry: CalendarEntry) {
    const updated = await directus.request(
      updateItem('calendar_entries', entry.id, { completed: !entry.completed })
    ) as CalendarEntry;
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
  }

  async function deleteEntry(id: string) {
    await directus.request(deleteItem('calendar_entries', id));
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = today.toISOString().split('T')[0];
  const selectedEntries = entriesForDate(selectedDate);

  // Dny pro grid (prázdné buňky + dny měsíce)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kalendář</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kalendář */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentMonth(today.getMonth());
                    setCurrentYear(today.getFullYear());
                    setSelectedDate(todayStr);
                  }}
                  className="text-xs px-2"
                >
                  Dnes
                </Button>
                <Button variant="ghost" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Hlavička dnů */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEntries = entriesForDate(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative flex flex-col items-center py-1.5 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : isToday
                        ? 'bg-blue-100 text-blue-800 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day}
                    {dayEntries.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEntries.slice(0, 3).map((e, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detail vybraného dne */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('cs-CZ', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nový záznam</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <Label>Typ záznamu</Label>
                      <Select
                        value={form.entry_type}
                        onValueChange={(v) => setForm((f) => ({ ...f, entry_type: v as EntryType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ENTRY_TYPE_LABELS) as EntryType[]).map((t) => (
                            <SelectItem key={t} value={t}>{ENTRY_TYPE_LABELS[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Název</Label>
                      <Input
                        placeholder="Co plánujete?"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Poznámka / reflexe</Label>
                      <Textarea
                        placeholder="Podrobnosti, poznámky..."
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>Zrušit</Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Ukládám...' : 'Přidat'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {selectedEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Žádné záznamy</p>
                <p className="text-xs mt-1">Klikněte na + pro přidání</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedEntries.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2 group">
                    <button onClick={() => toggleEntry(entry)} className="mt-0.5 flex-shrink-0">
                      {entry.completed
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : <Circle className="h-4 w-4 text-gray-400 hover:text-blue-500" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${entry.completed ? 'line-through text-gray-400' : ''}`}>
                        {entry.title || '(bez názvu)'}
                      </p>
                      {entry.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${ENTRY_TYPE_COLORS[entry.entry_type]}`}>
                        {ENTRY_TYPE_LABELS[entry.entry_type]}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
