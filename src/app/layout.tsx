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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: "Portfolio Paradise - Online Portfolio",
    description: locale === 'en'
      ? "An online portfolio for primary school pupils learning at home"
      : "Online portfolio pro žáky základních škol s individuálním studiem",
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
