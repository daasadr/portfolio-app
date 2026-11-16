import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Target, Calendar, Users, GraduationCap } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getServerLocale } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n';

export default async function Home() {
  const locale = await getServerLocale();
  const t = (cs: string, en: string) => tr(locale, cs, en);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <Image src="/images/paradise-bg.webp" alt={t('Pozadí Paradise', 'Paradise background')} fill className="object-cover" priority quality={85} />
        <div className="absolute inset-0 bg-white/10" />
      </div>

      <header className="bg-white/95 backdrop-blur-sm shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-3 py-6">
            <div className="flex items-center min-w-0">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3 shrink-0" />
              <h1 className="text-2xl font-bold text-gray-900">Portfolio Paradise</h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <LanguageSwitcher />
              <Link href="/login"><Button variant="outline">{t('Přihlášení', 'Log in')}</Button></Link>
              <Link href="/register"><Button>{t('Registrace', 'Sign up')}</Button></Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16 bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-2xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">{t('Online Portfolio pro Žáky ZŠ', 'Online Portfolio for Primary School Pupils')}</h2>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              {t(
                'Moderní platforma pro žáky základních škol s individuálním studiem. Sledujte své cíle, vytvářejte portfolio a sdílejte své úspěchy s učiteli.',
                'A modern platform for primary school pupils in individual (home) education. Track your goals, build your portfolio and share your achievements with your teachers.',
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">{t('Začít zdarma', 'Start for free')}</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">{t('Přihlásit se', 'Log in')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>{t('Osobní cíle', 'Personal goals')}</CardTitle>
                <CardDescription>{t('Stanovte si krátkodobé, dlouhodobé a celoživotní cíle', 'Set short-term, long-term and lifelong goals')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('Sledování pokroku', 'Progress tracking')}</li>
                  <li>• {t('Různé typy cílů', 'Different kinds of goals')}</li>
                  <li>• {t('Termíny a splnění', 'Deadlines and completion')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Portfolio</CardTitle>
                <CardDescription>{t('Vytvářejte a organizujte své práce a projekty', 'Create and organise your work and projects')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('Různé šablony stránek', 'Various page templates')}</li>
                  <li>• {t('Kategorie a organizace', 'Categories and organisation')}</li>
                  <li>• {t('Nahrávání souborů', 'File uploads')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>{t('Kalendář', 'Calendar')}</CardTitle>
                <CardDescription>{t('Plánujte si denní aktivity a sledujte pokrok', 'Plan your daily activities and track your progress')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('Denní plány', 'Daily plans')}</li>
                  <li>• {t('Události a termíny', 'Events and deadlines')}</li>
                  <li>• {t('Reflexe a hodnocení', 'Reflection and evaluation')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>{t('Sdílení', 'Sharing')}</CardTitle>
                <CardDescription>{t('Sdílejte portfolio s učiteli a rodinou', 'Share your portfolio with teachers and family')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('Bezpečné sdílení odkazem', 'Secure sharing via a link')}</li>
                  <li>• {t('Celé portfolio nebo část', 'The whole portfolio or just part of it')}</li>
                  <li>• {t('Propojení s učitelem', 'Connection with a teacher')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <GraduationCap className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>{t('Učitelský účet', 'Teacher account')}</CardTitle>
                <CardDescription>{t('Přehled nad žáky a jejich portfolii', 'An overview of pupils and their portfolios')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('Propojení se žáky', 'Connections with pupils')}</li>
                  <li>• {t('Prohlížení portfolií', 'Viewing portfolios')}</li>
                  <li>• {t('Sledování pokroku', 'Progress tracking')}</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('Připraveni začít?', 'Ready to start?')}</h3>
            <p className="text-gray-600 mb-6">{t('Vytvořte si účet a začněte budovat své portfolio ještě dnes.', 'Create an account and start building your portfolio today.')}</p>
            <Link href="/register">
              <Button size="lg">{t('Vytvořit účet zdarma', 'Create a free account')}</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900/95 backdrop-blur-sm text-white py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">{t('© 2026 Portfolio Paradise. Vytvořeno pro individuální studium.', '© 2026 Portfolio Paradise. Made for individual (home) education.')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
