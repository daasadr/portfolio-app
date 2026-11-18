import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CookieBanner from '@/components/CookieBanner';
import { LocaleProvider } from '@/components/LocaleProvider';
import { getServerLocale } from '@/lib/i18n-server';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portfolioparadise.eu';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const title = "Portfolio Paradise - Online Portfolio";
  const description = locale === 'en'
    ? "An online portfolio for home-educated children: portfolio, reading diary, goals, dreams and weekly challenges. Free, in Czech and English."
    : "Online portfolio pro děti na domácím vzdělávání: portfolio, čtenářský deník, cíle, sny a týdenní výzvy. Zdarma, česky i anglicky.";
  // Link previews (WhatsApp, Facebook, Messenger, Signal, X…) read these tags
  const image = {
    url: `/og-image-${locale}.jpg`,
    width: 1200,
    height: 630,
    alt: locale === 'en' ? 'Portfolio Paradise — an online portfolio for home-educated children' : 'Portfolio Paradise — online portfolio pro děti na domácím vzdělávání',
  };
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'Portfolio Paradise',
      title,
      description,
      url: '/',
      locale: locale === 'en' ? 'en_GB' : 'cs_CZ',
      alternateLocale: locale === 'en' ? 'cs_CZ' : 'en_GB',
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LocaleProvider initialLocale={locale}>
          {children}
          <CookieBanner />
        </LocaleProvider>
      </body>
    </html>
  );
}
