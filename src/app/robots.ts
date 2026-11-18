import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portfolioparadise.eu';

// The app and API are off limits. Shared portfolios (/portfolio/…) are NOT blocked here on purpose:
// they carry a `noindex` header tag instead, which crawlers can only see if they may fetch the page,
// and link-preview bots need to read their tags.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/api', '/dasa'] },
    host: SITE_URL,
  };
}
