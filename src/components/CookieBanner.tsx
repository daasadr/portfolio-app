'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const CONSENT_KEY = 'pp_consent';

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
    setTimeout(() => setMounted(false), 400);
  }

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-5 left-5 z-50 max-w-xs transition-all duration-400 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden>🍪</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 mb-1">Soukromí & cookies</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Používáme pouze technické cookies nutné pro přihlášení. Žádné sledování ani reklamy.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Button size="sm" onClick={dismiss} className="h-7 text-xs px-3">
                Rozumím
              </Button>
              <Link
                href="/privacy"
                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
              >
                Více info
              </Link>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Zavřít"
            className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 -mt-0.5 -mr-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
