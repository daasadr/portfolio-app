'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, intlLocale, plural, tr, type L10n, type Locale } from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** `t('Uložit', 'Save')` or `t({ cs, en })` */
  t: (cs: string | L10n, en?: string) => string;
  /** Tag for Intl APIs, e.g. `date.toLocaleDateString(intl)` */
  intl: string;
  plural: (n: number, cs: [string, string, string], en: [string, string]) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback((l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.documentElement.lang = l;
    setLocaleState(l);
    router.refresh(); // re-render server components (landing page, privacy, metadata)
  }, [router]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (cs, en) => tr(locale, cs, en),
    intl: intlLocale(locale),
    plural: (n, cs, en) => plural(locale, n, cs, en),
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}
