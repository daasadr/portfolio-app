'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'pp_consent';

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
    setTimeout(() => setMounted(false), 500);
  }

  if (!mounted) return null;

  return (
    <div
      className="fixed left-0 bottom-20 z-50 w-72"
      style={{
        transform: !visible
          ? 'translateX(-110%)'
          : expanded
          ? 'translateX(0)'
          : 'translateX(calc(-100% + 2.75rem))',
        transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-r-2xl shadow-lg border-r border-t border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <span className="text-xl flex-shrink-0" aria-hidden>🍪</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-800 mb-0.5">Cookies & soukromí</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Pouze technické cookies pro přihlášení. Bez sledování.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button size="sm" onClick={dismiss} className="h-6 text-xs px-2">
              Rozumím
            </Button>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
              Více info
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
