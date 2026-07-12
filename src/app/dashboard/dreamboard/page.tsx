'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentStudent } from '@/lib/directus';
import type { DreamBoardItem } from '@/types';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL!;

type DragType = 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw';

interface DragState {
  itemId: string;
  type: DragType;
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
}

function getToken() {
  try {
    const s = sessionStorage.getItem('pp_auth');
    if (s) return JSON.parse(s)?.access_token ?? '';
    const l = localStorage.getItem('pp_auth');
    if (l) return JSON.parse(l)?.access_token ?? '';
    return '';
  } catch { return ''; }
}

export default function DreamBoardPage() {
  const [items, setItems] = useState<DreamBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const student = await getCurrentStudent();
      if (!student) { router.push('/login'); return; }
      const t = getToken();
      const res = await fetch(
        `${directusUrl}/items/dream_board_items?filter[student_id][_eq]=${student.id}&filter[on_board][_eq]=true&sort[]=z_index`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      const json = await res.json();
      setItems(json.data ?? []);
      setIsLoading(false);
    };
    load();
  }, [router]);

  const saveItem = useCallback(async (item: DreamBoardItem) => {
    const token = getToken();
    await fetch(`${directusUrl}/items/dream_board_items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ x: item.x, y: item.y, width: item.width, height: item.height, z_index: item.z_index }),
    });
  }, []);

  const startDrag = (e: React.MouseEvent, itemId: string, type: DragType) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    const item = items.find(i => i.id === itemId)!;
    const maxZ = Math.max(0, ...items.map(i => i.z_index));
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, z_index: maxZ + 1 } : i));
    drag.current = {
      itemId, type,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startX: item.x, startY: item.y, startW: item.width, startH: item.height,
    };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!drag.current || !boardRef.current) return;
    const bw = boardRef.current.offsetWidth;
    const bh = boardRef.current.offsetHeight;
    const dx = ((e.clientX - drag.current.startMouseX) / bw) * 100;
    const dy = ((e.clientY - drag.current.startMouseY) / bh) * 100;
    const { itemId, type, startX, startY, startW, startH } = drag.current;

    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      switch (type) {
        case 'move':
          return { ...item, x: Math.max(0, Math.min(100 - item.width, startX + dx)), y: Math.max(0, startY + dy) };
        case 'resize-se':
          return { ...item, width: Math.max(5, startW + dx), height: Math.max(5, startH + dy) };
        case 'resize-sw':
          return { ...item, x: Math.max(0, startX + dx), width: Math.max(5, startW - dx), height: Math.max(5, startH + dy) };
        case 'resize-ne':
          return { ...item, y: startY + dy, width: Math.max(5, startW + dx), height: Math.max(5, startH - dy) };
        case 'resize-nw':
          return { ...item, x: Math.max(0, startX + dx), y: startY + dy, width: Math.max(5, startW - dx), height: Math.max(5, startH - dy) };
        default: return item;
      }
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    if (!drag.current) return;
    const item = items.find(i => i.id === drag.current!.itemId);
    if (item) saveItem(item);
    drag.current = null;
  }, [items, saveItem]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const removeFromBoard = async (id: string) => {
    const token = getToken();
    await fetch(`${directusUrl}/items/dream_board_items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ on_board: false }),
    });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  return (
    <div className="bg-gray-950 min-h-screen">
      <div className="sticky top-0 z-[1000] flex items-center gap-3 px-4 py-3 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zpět
        </Button>
        <h1 className="text-white font-semibold">Nástěnka snů</h1>
        <span className="text-gray-400 text-sm">{items.length} obrázků</span>
        <div className="ml-auto">
          {isEditing ? (
            <Button
              size="sm"
              onClick={() => setIsEditing(false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Hotovo
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Upravit nástěnku
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="bg-blue-900/40 border-b border-blue-700/50 px-4 py-2 text-blue-300 text-sm text-center">
          Režim úprav — přetahujte obrázky, měňte jejich velikost tažením za rohy nebo je odeberte pomocí koše
        </div>
      )}

      <div
        ref={boardRef}
        className={`relative w-full select-none overflow-hidden ${isEditing ? '' : 'overflow-y-auto'}`}
        style={{ height: '300vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}
      >
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-xl font-light">Nástěnka je prázdná</p>
              <p className="text-sm mt-2">Přidejte obrázky ze svých snů na stránce Sny</p>
            </div>
          </div>
        )}

        {items.map(item => (
          <div
            key={item.id}
            className={`absolute ${isEditing ? 'group cursor-move' : ''}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.width}%`,
              height: `${item.height}%`,
              zIndex: item.z_index,
            }}
            onMouseDown={isEditing ? (e) => startDrag(e, item.id, 'move') : undefined}
          >
            <img
              src={`/api/asset/${item.file_id}?width=1200&quality=80&format=webp`}
              alt=""
              className="w-full h-full object-cover shadow-2xl"
              draggable={false}
              loading={item.y < 35 ? 'eager' : 'lazy'}
              decoding="async"
              style={{ display: 'block' }}
            />

            {isEditing && (
              <>
                <button
                  className="absolute top-1 right-1 p-1.5 bg-black/70 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => removeFromBoard(item.id)}
                  title="Odebrat z nástěnky"
                >
                  <Trash2 className="h-3 w-3" />
                </button>

                {(['se', 'sw', 'ne', 'nw'] as const).map(corner => (
                  <div
                    key={corner}
                    className={`absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                      ${corner === 'se' ? 'bottom-0 right-0 cursor-se-resize' : ''}
                      ${corner === 'sw' ? 'bottom-0 left-0 cursor-sw-resize' : ''}
                      ${corner === 'ne' ? 'top-0 right-0 cursor-ne-resize' : ''}
                      ${corner === 'nw' ? 'top-0 left-0 cursor-nw-resize' : ''}
                    `}
                    onMouseDown={e => { e.stopPropagation(); startDrag(e, item.id, `resize-${corner}`); }}
                  />
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
