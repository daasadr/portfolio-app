'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Flame, Trophy } from 'lucide-react';
import { getStoredToken } from '@/lib/directus';
import { BADGES } from '@/lib/badges';

interface UserBadge {
  id: number;
  badge_slug: string;
  steps_done: number;
  last_step_date: string | null;
  status: 'active' | 'completed' | 'expired';
  completed_at: string | null;
  expires_at: string | null;
}

function renderArticle(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-bold text-gray-900 mt-4 mb-1">{line.slice(2, -2)}</p>;
    }
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <p key={i} className="text-gray-700 leading-relaxed">{line}</p>;
  });
}

export default function BadgeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const badge = BADGES.find(b => b.slug === slug);

  const [userBadge, setUserBadge] = useState<UserBadge | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState('');
  const [justCompleted, setJustCompleted] = useState(false);

  const loadMyBadge = useCallback(async () => {
    const res = await fetch('/api/user-badges', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    });
    if (res.ok) {
      const data = await res.json() as { user_badges: UserBadge[] };
      const found = data.user_badges.find(ub => ub.badge_slug === slug) ?? null;
      setUserBadge(found);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => { loadMyBadge(); }, [loadMyBadge]);

  if (!badge) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Bobřík nenalezen.</p>
        <Link href="/dashboard/world"><Button variant="outline" className="mt-4">Zpět</Button></Link>
      </div>
    );
  }

  async function handleStart() {
    setStarting(true);
    setMessage('');
    const res = await fetch('/api/user-badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ badge_slug: slug }),
    });
    const data = await res.json() as { message?: string };
    if (!res.ok) {
      setMessage(data.message ?? 'Chyba');
    } else {
      await loadMyBadge();
    }
    setStarting(false);
  }

  async function handleCheckin() {
    if (!userBadge) return;
    setCheckingIn(true);
    setMessage('');
    const res = await fetch(`/api/user-badges/${userBadge.id}/checkin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    });
    const data = await res.json() as { message?: string; completed?: boolean };
    if (!res.ok) {
      setMessage(data.message ?? 'Chyba');
    } else {
      if (data.completed) setJustCompleted(true);
      await loadMyBadge();
    }
    setCheckingIn(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const alreadyDoneToday = userBadge?.last_step_date === today;
  const isActive = userBadge?.status === 'active';
  const isCompleted = userBadge?.status === 'completed';

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <Link href="/dashboard/world" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm mb-4">
        <ArrowLeft className="h-4 w-4" /> Zpět na Světoběžník
      </Link>

      {/* Obrázek bobříka */}
      <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-6">
        <Image
          src={`/images/bobrici/${badge.icon}`}
          alt={badge.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-5 text-white">
          <h1 className="text-2xl font-bold">{badge.name}</h1>
          <p className="text-white/80 text-sm">{badge.tagline}</p>
        </div>
      </div>

      {/* Gratulace při dokončení */}
      {justCompleted && (
        <div className="mb-6 rounded-xl bg-amber-50 border-2 border-amber-300 p-5 text-center">
          <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-amber-800">Gratulujeme! Bobřík je tvůj! 🏅</p>
          <p className="text-amber-700 text-sm mt-1">Odznáček ti bude platit celý rok.</p>
        </div>
      )}

      {/* Progress + akce */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-gray-200 p-5 bg-white shadow-sm space-y-4">
          {isCompleted && !justCompleted && (
            <div className="flex items-center gap-2 text-amber-600 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Bobříka máš splněného! Platí do {userBadge?.expires_at ? new Date(userBadge.expires_at).toLocaleDateString('cs-CZ') : '—'}
            </div>
          )}

          {isActive && userBadge && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-400" />
                  Postup: {userBadge.steps_done} / {badge.total_steps} dní
                </p>
                <div className="flex gap-1.5">
                  {Array.from({ length: badge.total_steps }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-3 rounded-full transition-colors ${
                        i < userBadge.steps_done ? 'bg-teal-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCheckin}
                disabled={checkingIn || alreadyDoneToday}
                className="w-full"
                size="lg"
              >
                {checkingIn ? 'Ukládám...' : alreadyDoneToday ? '✓ Dnes splněno — zítra zase!' : '✓ Dnes splněno'}
              </Button>
            </>
          )}

          {!userBadge && (
            <Button onClick={handleStart} disabled={starting} className="w-full" size="lg">
              {starting ? 'Spouštím...' : '🦫 Začít lovit'}
            </Button>
          )}

          {message && (
            <p className="text-sm text-center text-red-500">{message}</p>
          )}
        </div>
      )}

      {/* Článek */}
      <div className="prose-sm text-sm space-y-1 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-3">O tomto bobříkovi</h2>
        {renderArticle(badge.article)}
      </div>
    </div>
  );
}
