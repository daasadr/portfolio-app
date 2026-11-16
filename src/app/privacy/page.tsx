import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Shield } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getServerLocale } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: tr(locale, 'Zásady ochrany osobních údajů – Portfolio Paradise', 'Privacy Policy – Portfolio Paradise'),
  };
}

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const t = (cs: string, en: string) => tr(locale, cs, en);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Zpět na hlavní stránku', 'Back to the home page')}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('Zásady ochrany osobních údajů', 'Privacy Policy')}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{t('Naposledy aktualizováno: červenec 2025', 'Last updated: July 2025')}</p>
            </div>
          </div>

          <Section title={t('1. Správce osobních údajů', '1. Data controller')}>
            <p>
              {t(
                'Správcem osobních údajů je provozovatel aplikace Portfolio Paradise:',
                'The controller of personal data is the operator of the Portfolio Paradise application:',
              )}
            </p>
            <p className="mt-2 font-medium text-gray-800">
              Dasa D.<br />
              <a href="mailto:daasa.d@seznam.cz" className="text-blue-600 hover:underline font-normal">
                daasa.d@seznam.cz
              </a>
            </p>
            <p className="mt-2 text-gray-500">
              {t(
                'Aplikace je provozována jako bezplatná služba pro školy a vzdělávací organizace. Školy a pedagogové jsou uživateli aplikace, nikoli samostatnými správci dat.',
                'The application is operated as a free service for schools and educational organisations. Schools and teachers are users of the application, not independent data controllers.',
              )}
            </p>
          </Section>

          <Section title={t('2. Jaké údaje zpracováváme', '2. What data we process')}>
            <ul className="space-y-1.5">
              <Li><strong>{t('Registrační údaje:', 'Registration details:')}</strong> {t('jméno, příjmení, e-mailová adresa', 'first name, last name, email address')}</Li>
              <Li><strong>{t('Datum narození', 'Date of birth')}</strong> {t('(volitelně, pro personalizaci)', '(optional, for personalisation)')}</Li>
              <Li><strong>{t('Obsah portfolia:', 'Portfolio content:')}</strong> {t('texty, obrázky, videa, soubory, které sami vložíte', 'texts, images, videos and files that you add yourself')}</Li>
              <Li><strong>{t('Technické záznamy:', 'Technical records:')}</strong> {t('čas přihlášení (pro bezpečnost)', 'login times (for security)')}</Li>
            </ul>
            <p className="mt-3 text-gray-500">
              {t(
                'Nezpracováváme žádné citlivé osobní údaje, nesledujeme chování mimo aplikaci a neprodáváme žádné údaje třetím stranám.',
                'We do not process any sensitive personal data, we do not track behaviour outside the application, and we do not sell any data to third parties.',
              )}
            </p>
          </Section>

          <Section title={t('3. Účel zpracování', '3. Purpose of processing')}>
            <ul className="space-y-1.5">
              <Li>{t('Provoz a zabezpečení uživatelského účtu', 'Operating and securing the user account')}</Li>
              <Li>{t('Ukládání a zobrazení obsahu portfolia', 'Storing and displaying portfolio content')}</Li>
              <Li>{t('Sdílení portfolia s osobami, které uživatel zvolí (učitel, rodič, kamarád)', 'Sharing the portfolio with people chosen by the user (teacher, parent, friend)')}</Li>
            </ul>
          </Section>

          <Section title={t('4. Právní základ', '4. Legal basis')}>
            <p>
              {t(
                'Zpracování probíhá na základě souhlasu uživatele (nebo zákonného zástupce u nezletilých) uděleného při registraci do aplikace, a na základě oprávněného zájmu provozovatele za účelem zajištění bezpečnosti a funkčnosti služby.',
                'Processing is based on the consent of the user (or of the legal guardian in the case of minors) given when registering for the application, and on the legitimate interest of the operator in ensuring the security and functionality of the service.',
              )}
            </p>
            <p className="mt-2 text-gray-500">
              {t(
                'V souladu s GDPR a zákonem č. 110/2019 Sb. o zpracování osobních údajů.',
                'In accordance with the GDPR and Czech Act No. 110/2019 Coll., on the Processing of Personal Data.',
              )}
            </p>
          </Section>

          <Section title={t('5. Doba uchovávání', '5. Retention period')}>
            <ul className="space-y-1.5">
              <Li>{t('Po dobu aktivního využívání aplikace uživatelem', 'For as long as the user actively uses the application')}</Li>
              <Li>{t('Po ukončení studia nebo zrušení účtu jsou data smazána do 90 dnů', 'After the end of studies or cancellation of the account, the data are deleted within 90 days')}</Li>
              <Li>{t('Na žádost uživatele nebo zákonného zástupce lze data smazat kdykoli', 'The data can be deleted at any time at the request of the user or their legal guardian')}</Li>
            </ul>
          </Section>

          <Section title={t('6. Cookies a technické prostředky', '6. Cookies and technical means')}>
            <p>
              {t(
                'Aplikace ukládá do vašeho prohlížeče výhradně technicky nezbytné údaje',
                'The application stores only technically necessary data in your browser',
              )}
              {' '}({t('přihlašovací token v', 'a login token in')} <code className="bg-gray-100 px-1 rounded text-xs">localStorage</code>).{' '}
              {t(
                'Tyto údaje slouží pouze k udržení přihlášení a nejsou sdíleny s třetími stranami.',
                'These data are used only to keep you logged in and are not shared with third parties.',
              )}
            </p>
            <p className="mt-2 text-gray-500">
              {t(
                'Nepoužíváme žádné analytické, marketingové ani sledovací cookies.',
                'We do not use any analytics, marketing or tracking cookies.',
              )}
            </p>
          </Section>

          <Section title={t('7. Vaše práva', '7. Your rights')}>
            <ul className="space-y-1.5">
              <Li><strong>{t('Přístup', 'Access')}</strong> – {t('právo vědět, jaké údaje o vás máme', 'the right to know what data we hold about you')}</Li>
              <Li><strong>{t('Oprava', 'Rectification')}</strong> – {t('právo opravit nepřesné údaje (přímo v nastavení aplikace)', 'the right to correct inaccurate data (directly in the app settings)')}</Li>
              <Li><strong>{t('Výmaz', 'Erasure')}</strong> – {t('právo na smazání účtu a všech dat', 'the right to have your account and all data deleted')}</Li>
              <Li><strong>{t('Přenositelnost', 'Portability')}</strong> – {t('právo získat kopii svých dat', 'the right to obtain a copy of your data')}</Li>
              <Li><strong>{t('Odvolání souhlasu', 'Withdrawal of consent')}</strong> – {t('kdykoli bez negativních důsledků', 'at any time, without negative consequences')}</Li>
            </ul>
            <p className="mt-3 text-gray-500">
              {t('Pro uplatnění práv napište na', 'To exercise your rights, write to')}{' '}
              <a href="mailto:daasa.d@seznam.cz" className="text-blue-600 hover:underline">
                daasa.d@seznam.cz
              </a>.{' '}
              {t('Máte také právo podat stížnost u', 'You also have the right to lodge a complaint with the')}{' '}
              <a
                href="https://www.uoou.cz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {t('Úřadu pro ochranu osobních údajů (ÚOOÚ)', 'Office for Personal Data Protection (ÚOOÚ)')}
              </a>.
            </p>
          </Section>

          <Section title={t('8. Nezletilí uživatelé', '8. Minors')}>
            <p>
              {t(
                'Aplikace je určena primárně žákům základních škol. Souhlas se zpracováním osobních údajů dětí mladších 15 let uděluje zákonný zástupce. Škola jako zprostředkovatel zajišťuje potřebná souhlasná prohlášení v rámci zápisu nebo školní dokumentace.',
                'The application is intended primarily for primary school pupils. Consent to the processing of personal data of children under 15 is given by their legal guardian. The school, as processor, obtains the necessary declarations of consent as part of enrolment or school documentation.',
              )}
            </p>
          </Section>

          <div className="pt-4 border-t text-center">
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← {t('Zpět na Portfolio Paradise', 'Back to Portfolio Paradise')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}
