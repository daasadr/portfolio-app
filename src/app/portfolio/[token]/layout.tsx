import type { Metadata } from 'next';
import { getServerLocale } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n';

/**
 * Shared portfolios belong to children: the link preview stays generic (no name, no content)
 * and search engines are told not to index or follow the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const title = tr(locale, 'Sdílené portfolio – Portfolio Paradise', 'Shared portfolio – Portfolio Paradise');
  const description = tr(
    locale,
    'Někdo s vámi sdílí své portfolio z Portfolio Paradise. Otevřete odkaz a podívejte se.',
    'Someone is sharing their Portfolio Paradise portfolio with you. Open the link to take a look.',
  );
  // Nested metadata replaces (not merges) openGraph/twitter, so the image is repeated here
  const image = { url: `/og-image-${locale}.jpg`, width: 1200, height: 630, alt: 'Portfolio Paradise' };
  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    openGraph: { type: 'website', siteName: 'Portfolio Paradise', title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

export default function SharedPortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
