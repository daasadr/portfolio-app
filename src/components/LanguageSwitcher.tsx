'use client';

import { useLocale } from '@/components/LocaleProvider';
import type { Locale } from '@/lib/i18n';

const OPTIONS: { value: Locale; label: string; title: string }[] = [
  { value: 'cs', label: 'CZ', title: 'Čeština' },
  { value: 'en', label: 'EN', title: 'English' },
];

/** Small CZ | EN toggle. */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div
      role="group"
      aria-label="Jazyk / Language"
      className={`inline-flex shrink-0 overflow-hidden rounded-full border border-gray-300 bg-white/90 text-xs font-semibold shadow-sm ${className}`}
    >
      {OPTIONS.map(o => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={locale === o.value}
          onClick={() => locale !== o.value && setLocale(o.value)}
          className={`px-2.5 py-1 transition-colors ${locale === o.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
