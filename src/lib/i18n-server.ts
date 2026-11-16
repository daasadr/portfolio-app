import 'server-only';
import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { localeFromHeaders, LOCALE_COOKIE, isLocale, localeFromAcceptLanguage, tr, type Locale, type L10n } from '@/lib/i18n';

/** Locale for server components and layouts. */
export async function getServerLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  return localeFromAcceptLanguage((await headers()).get('accept-language'));
}

/** Locale of an API request. */
export function getRequestLocale(request: NextRequest | Request): Locale {
  return localeFromHeaders(request.headers.get('cookie'), request.headers.get('accept-language'));
}

/**
 * Translator bound to an API request:
 *   const t = requestT(request);  return NextResponse.json({ message: t('Neautorizováno', 'Unauthorized') })
 */
export function requestT(request: NextRequest | Request) {
  const locale = getRequestLocale(request);
  return (cs: string | L10n, en?: string) => tr(locale, cs, en);
}
