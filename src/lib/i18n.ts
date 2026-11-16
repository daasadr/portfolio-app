/**
 * Dvojjazyčnost (čeština / angličtina).
 *
 * Texty se píšou přímo v kódu jako dvojice — `t('Uložit', 'Save')` — nebo jako objekt
 * `{ cs, en }` u dat (bobříci, odznaky…). Jazyk je v cookie `pp_locale`, takže ho zná
 * i server (API hlášky, první vykreslení stránky).
 *
 * This module is shared by server and client code — keep it free of React and Next imports.
 */

export type Locale = 'cs' | 'en';
export const LOCALES: Locale[] = ['cs', 'en'];
export const DEFAULT_LOCALE: Locale = 'cs';
export const LOCALE_COOKIE = 'pp_locale';

/** A text in both languages — used in data files. */
export interface L10n { cs: string; en: string }

export function isLocale(v: unknown): v is Locale {
  return v === 'cs' || v === 'en';
}

/** Picks the text for `locale`: `tr(locale, 'Ahoj', 'Hello')` or `tr(locale, { cs, en })`. */
export function tr(locale: Locale, cs: string | L10n, en?: string): string {
  if (typeof cs === 'object') return cs[locale] ?? cs.cs;
  return locale === 'en' ? (en ?? cs) : cs;
}

/** BCP 47 tag for Intl / toLocaleDateString. */
export function intlLocale(locale: Locale): string {
  return locale === 'en' ? 'en-GB' : 'cs-CZ';
}

/**
 * Plural forms. Czech has three (1 / 2–4 / 5+), English two.
 * `plural(locale, n, ['kniha', 'knihy', 'knih'], ['book', 'books'])`
 */
export function plural(locale: Locale, n: number, cs: [string, string, string], en: [string, string]): string {
  if (locale === 'en') return n === 1 ? en[0] : en[1];
  return n === 1 ? cs[0] : n >= 2 && n <= 4 ? cs[1] : cs[2];
}

/** Locale from an Accept-Language header — Czech/Slovak speakers get Czech, everyone else English. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const first = header.split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('cs') || first.startsWith('sk') ? 'cs' : 'en';
}

/** Locale from a raw Cookie header, falling back to Accept-Language. */
export function localeFromHeaders(cookieHeader: string | null | undefined, acceptLanguage?: string | null): Locale {
  const m = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(cs|en)(?:;|$)`));
  if (m && isLocale(m[1])) return m[1];
  return localeFromAcceptLanguage(acceptLanguage);
}

/** Current locale in plain client code outside React (reads the cookie; Czech on the server). */
export function clientLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  return localeFromHeaders(document.cookie, navigator.language);
}
