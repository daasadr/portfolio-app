'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe2, Flame, CheckCircle2, Lock } from 'lucide-react';
import { getStoredToken } from '@/lib/directus';
import { BADGES } from '@/lib/badges';

interface UserBadge {
  id: number;
  badge_slug: string;
  steps_done: number;
  status: 'active' | 'completed' | 'expired';
  completed_at: string | null;
  expires_at: string | null;
}

export default function WorldPage() {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/user-badges', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    });
    if (res.ok) {
      const data = await res.json() as { user_badges: UserBadge[] };
      setUserBadges(data.user_badges ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function getUserBadge(slug: string) {
    return userBadges.find(ub => ub.badge_slug === slug);
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Hlavička */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Globe2 className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Světoběžník</h1>
        </div>
        <p className="text-emerald-100 text-lg">
          Objevuj svět, rozvíjej se a sbírej bobříky za výzvy, které tě posunou dál.
        </p>
      </div>

      {/* Sekce bobříci */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🦫</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bobříci</h2>
            <p className="text-gray-500 text-sm">Týdenní výzvy, které tě naučí skvělé návyky</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BADGES.map(badge => {
              const ub = getUserBadge(badge.slug);
              const isActive = ub?.status === 'active';
              const isCompleted = ub?.status === 'completed';

              return (
                <Card key={badge.slug} className={`overflow-hidden transition-shadow hover:shadow-lg ${isCompleted ? 'ring-2 ring-amber-400' : ''}`}>
                  <div className="relative h-44 w-full bg-gray-100">
                    <Image
                      src={`/images/bobrici/${badge.icon}`}
                      alt={badge.name}
                      fill
                      className="object-cover"
                    />
                    {isCompleted && (
                      <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                        <span className="bg-amber-400 text-white text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Splněno!
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 leading-tight">{badge.name}</h3>
                        {isActive && (
                          <Badge variant="secondary" className="flex-shrink-0 bg-teal-100 text-teal-700 text-xs">
                            <Flame className="h-3 w-3 mr-1" />
                            Lovím
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="flex-shrink-0 bg-amber-100 text-amber-700 text-xs border-0">
                            🏅 Mám!
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{badge.tagline}</p>
                    </div>

                    {isActive && ub && (
                      <div>
                        <div className="flex gap-1 mb-1">
                          {Array.from({ length: badge.total_steps }).map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 h-2 rounded-full transition-colors ${
                                i < ub.steps_done ? 'bg-teal-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">{ub.steps_done} / {badge.total_steps} dní</p>
                      </div>
                    )}

                    {isCompleted && ub?.expires_at && (
                      <p className="text-xs text-amber-600">
                        Platí do {new Date(ub.expires_at).toLocaleDateString('cs-CZ')}
                      </p>
                    )}

                    <Link href={`/dashboard/world/badges/${badge.slug}`}>
                      <Button
                        size="sm"
                        className="w-full"
                        variant={isCompleted ? 'outline' : 'default'}
                      >
                        {isActive ? 'Zobrazit postup' : isCompleted ? 'Zobrazit' : 'Zjistit více'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Placeholder pro budoucí sekce */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌍</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Brzy přibyde</h2>
            <p className="text-gray-500 text-sm">Připravujeme pro tebe další dobrodružství</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Ankety a hlasování', 'Sdílení zálib'].map(name => (
            <Card key={name} className="opacity-60">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">{name}</p>
                  <p className="text-xs text-gray-400">Již brzy...</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
