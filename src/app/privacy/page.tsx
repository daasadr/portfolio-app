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
              <p className="text-xs text-gray-400 mt-0.5">{t('Naposledy aktualizováno: listopad 2026', 'Last updated: November 2026')}</p>
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
                'Aplikace je bezplatná služba pro žáky vzdělávané doma (individuální vzdělávání), jejich rodiče a učitele a také pro školy a vzdělávací organizace. Rodiče, učitelé a školy jsou uživateli aplikace, nikoli samostatnými správci dat.',
                'The application is a free service for pupils in home education, their parents and teachers, as well as for schools and educational organisations. Parents, teachers and schools are users of the application, not independent data controllers.',
              )}
            </p>
          </Section>

          <Section title={t('2. Jaké údaje zpracováváme', '2. What data we process')}>
            <ul className="space-y-1.5">
              <Li>
                <strong>{t('Účet:', 'Account:')}</strong>{' '}
                {t(
                  'jméno, příjmení, e-mailová adresa a heslo. Heslo ani odpověď na bezpečnostní otázku neukládáme v čitelné podobě — jen jako jednosměrný otisk (hash).',
                  'first name, last name, email address and password. We never store the password or the answer to the security question in readable form — only as a one-way fingerprint (hash).',
                )}
              </Li>
              <Li>
                <strong>{t('Bezpečnostní otázka:', 'Security question:')}</strong>{' '}
                {t(
                  'vybraná otázka, nebo text vlastní otázky, pokud si ji napíšete sami.',
                  'the chosen question, or the text of your own question if you write one.',
                )}
              </Li>
              <Li>
                <strong>{t('Profil:', 'Profile:')}</strong>{' '}
                {t('datum narození (nepovinné) a to, zda jde o účet žáka, nebo učitele.', 'date of birth (optional) and whether the account belongs to a pupil or a teacher.')}
              </Li>
              <Li>
                <strong>{t('Obsah, který sami vytvoříte:', 'Content you create yourself:')}</strong>{' '}
                {t(
                  'stránky portfolia a jejich přílohy (texty, obrázky, videa, zvuk, dokumenty), kategorie, osobní cíle, sny a nástěnka snů, záznamy v kalendáři, čtenářský deník, průběh bobříků a reakce (👍 ❤️ ⭐ 🏅), které dáte na stránky ostatních.',
                  'portfolio pages and their attachments (text, images, video, audio, documents), categories, personal goals, dreams and the dream board, calendar entries, the reading diary, beaver progress and the reactions (👍 ❤️ ⭐ 🏅) you give to other people\'s pages.',
                )}
              </Li>
              <Li>
                <strong>{t('Propojení a sdílení:', 'Connections and sharing:')}</strong>{' '}
                {t(
                  'propojení s učiteli, členství v organizacích a skupinách v sekci Komunita a sdílecí odkazy, které vytvoříte.',
                  'connections with teachers, membership of organisations and groups in the Community section, and the share links you create.',
                )}
              </Li>
              <Li>
                <strong>{t('Technické záznamy:', 'Technical records:')}</strong>{' '}
                {t(
                  'IP adresa, čas přihlášení a typ prohlížeče v záznamech serveru — slouží jen k zabezpečení (např. ochraně proti hádání hesel).',
                  'IP address, login time and browser type in the server logs — used only for security (for example to stop password guessing).',
                )}
              </Li>
            </ul>
            <p className="mt-3 text-gray-500">
              {t(
                'Odznaky za aktivitu neukládáme zvlášť — počítají se průběžně z vašeho obsahu. Nezpracováváme žádné citlivé osobní údaje, nesledujeme chování mimo aplikaci a neprodáváme žádné údaje třetím stranám.',
                'Activity badges are not stored separately — they are worked out from your content as you go. We do not process any sensitive personal data, we do not track behaviour outside the application, and we never sell any data to third parties.',
              )}
            </p>
          </Section>

          <Section title={t('3. Účel zpracování', '3. Purpose of processing')}>
            <ul className="space-y-1.5">
              <Li>{t('Provoz a zabezpečení uživatelského účtu', 'Operating and securing the user account')}</Li>
              <Li>{t('Ukládání a zobrazení obsahu, který si vytvoříte', 'Storing and displaying the content you create')}</Li>
              <Li>{t('Sdílení obsahu s lidmi, které si sami zvolíte (učitel, rodič, kamarád)', 'Sharing content with people you choose yourself (teacher, parent, friend)')}</Li>
              <Li>{t('Obnova zapomenutého hesla', 'Recovering a forgotten password')}</Li>
            </ul>
          </Section>

          <Section title={t('4. Kdo vaše údaje uvidí', '4. Who can see your data')}>
            <ul className="space-y-1.5">
              <Li>
                <strong>{t('Soukromé stránky', 'Private pages')}</strong>{' '}
                {t('vidíte jen vy.', 'are visible only to you.')}
              </Li>
              <Li>
                <strong>{t('Propojený učitel', 'A connected teacher')}</strong>{' '}
                {t(
                  'vidí vaše jméno, stránky portfolia označené jako sdílené a knihy ve čtenářském deníku, u kterých zaškrtnete „Ukázat učiteli“. Propojení vzniká jen s vaším souhlasem.',
                  'sees your name, the portfolio pages marked as shared and the reading-diary books for which you tick "Show my teacher". A connection only exists if you accept it.',
                )}
              </Li>
              <Li>
                <strong>{t('Reakce na stránky', 'Reactions to pages')}</strong>{' '}
                {t(
                  'může dát jen ten, kdo stránku smí vidět (propojený učitel u sdílené stránky). Autor stránky vidí, kdo mu reakci dal, ostatní vidí jen počty.',
                  'can only be given by someone who may see the page (a connected teacher, on a shared page). The page\'s author sees who reacted; everyone else sees only the counts.',
                )}
              </Li>
              <Li>
                <strong>{t('Sdílecí odkaz', 'A share link')}</strong>{' '}
                {t(
                  'zobrazí sdílené stránky (celé portfolio, kategorii nebo jednu stránku) každému, kdo odkaz zná. Soukromé stránky přes odkaz vidět nejsou. Odkaz můžete kdykoli deaktivovat.',
                  'shows your shared pages (the whole portfolio, a category or a single page) to anyone who has the link. Private pages are never visible through a link. You can deactivate a link at any time.',
                )}
              </Li>
              <Li>
                <strong>{t('Vlastní bezpečnostní otázku', 'Your own security question')}</strong>{' '}
                {t(
                  'uvidí při obnově hesla každý, kdo zadá váš e-mail. Odpověď nevidí nikdo.',
                  'is shown during password recovery to anyone who enters your email address. Nobody can see the answer.',
                )}
              </Li>
              <Li>
                <strong>{t('Provozovatel', 'The operator')}</strong>{' '}
                {t(
                  'má přístup k datům jen v rozsahu nutném pro provoz, zálohy a řešení problémů, o které požádáte. Aplikace běží na serveru provozovatele; poskytovatel serveru je zpracovatelem a k obsahu nepřistupuje.',
                  'can access the data only as far as is necessary for running the service, backups, and solving problems you ask for help with. The application runs on the operator\'s server; the server provider acts as a processor and does not access the content.',
                )}
              </Li>
            </ul>
          </Section>

          <Section title={t('5. Právní základ', '5. Legal basis')}>
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

          <Section title={t('6. Doba uchovávání', '6. Retention period')}>
            <ul className="space-y-1.5">
              <Li>{t('Údaje uchováváme po dobu, kdy aplikaci používáte.', 'We keep the data for as long as you use the application.')}</Li>
              <Li>
                {t(
                  'Smazáním účtu v Nastavení se okamžitě smažou všechny vaše údaje včetně nahraných souborů. Kopie v zálohách serveru zaniknou nejpozději do 90 dnů.',
                  'Deleting your account in Settings immediately deletes all your data, including uploaded files. Copies in server backups disappear within 90 days at the latest.',
                )}
              </Li>
              <Li>{t('Na žádost uživatele nebo zákonného zástupce smažeme data kdykoli.', 'We will delete the data at any time at the request of the user or their legal guardian.')}</Li>
            </ul>
          </Section>

          <Section title={t('7. Cookies a úložiště prohlížeče', '7. Cookies and browser storage')}>
            <p>
              {t(
                'Aplikace používá jen technicky nezbytné cookies a údaje v prohlížeči. Nikdy je nesdílíme s třetími stranami.',
                'The application uses only technically necessary cookies and browser data. We never share them with third parties.',
              )}
            </p>
            <ul className="space-y-1.5 mt-2">
              <Li>
                <strong>{t('Přihlášení', 'Login')}</strong>{' '}
                (<Code>pp_token</Code>, <Code>pp_refresh</Code>, <Code>pp_token_exp</Code>) —{' '}
                {t(
                  'udrží vás přihlášené. Jsou chráněné před čtením skripty (HttpOnly) a při odhlášení se smažou.',
                  'keep you logged in. They are protected from being read by scripts (HttpOnly) and are removed when you log out.',
                )}
              </Li>
              <Li>
                <strong>{t('Jazyk', 'Language')}</strong> (<Code>pp_locale</Code>) —{' '}
                {t('pamatuje si, zda chcete aplikaci česky, nebo anglicky (1 rok).', 'remembers whether you want the app in Czech or English (1 year).')}
              </Li>
              <Li>
                <strong>{t('Rozepsané texty', 'Unsaved drafts')}</strong> (<Code>localStorage</Code>) —{' '}
                {t(
                  'aby se text neztratil při obnovení stránky. Smažou se po uložení, při odhlášení a nejpozději po 30 dnech. Zůstávají jen ve vašem prohlížeči.',
                  'so that text is not lost when the page is reloaded. They are removed after saving, when you log out, and after 30 days at the latest. They stay only in your browser.',
                )}
              </Li>
              <Li>
                <strong>{t('Drobná nastavení', 'Small preferences')}</strong> (<Code>localStorage</Code>) —{' '}
                {t(
                  'zvolené pozadí, potvrzení informační lišty o cookies a které odznaky a reakce jste už viděli.',
                  'your chosen background, that you have dismissed the cookie notice, and which badges and reactions you have already seen.',
                )}
              </Li>
            </ul>
            <p className="mt-2 text-gray-500">
              {t(
                'Nepoužíváme žádné analytické, reklamní ani sledovací cookies a nenačítáme obsah ze sledovacích služeb třetích stran.',
                'We do not use any analytics, advertising or tracking cookies, and we do not load content from third-party tracking services.',
              )}
            </p>
          </Section>

          <Section title={t('8. Vaše práva', '8. Your rights')}>
            <ul className="space-y-1.5">
              <Li><strong>{t('Přístup', 'Access')}</strong> – {t('právo vědět, jaké údaje o vás máme', 'the right to know what data we hold about you')}</Li>
              <Li><strong>{t('Oprava', 'Rectification')}</strong> – {t('právo opravit nepřesné údaje (přímo v nastavení aplikace)', 'the right to correct inaccurate data (directly in the app settings)')}</Li>
              <Li><strong>{t('Výmaz', 'Erasure')}</strong> – {t('právo na smazání účtu a všech dat (Nastavení → Smazání účtu)', 'the right to have your account and all data deleted (Settings → Delete account)')}</Li>
              <Li><strong>{t('Přenositelnost', 'Portability')}</strong> – {t('právo získat kopii svých dat (Nastavení → Export mých dat)', 'the right to obtain a copy of your data (Settings → Export my data)')}</Li>
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
              </a>
              {t('.', ', or with the data protection authority in your own country.')}
            </p>
          </Section>

          <Section title={t('9. Nezletilí uživatelé', '9. Minors')}>
            <p>
              {t(
                'Aplikace je určena především žákům základních škol. Souhlas se zpracováním osobních údajů dětí mladších 15 let uděluje zákonný zástupce — u rodin s domácím vzděláváním rodič při registraci dítěte, u škol škola v rámci své dokumentace.',
                'The application is intended mainly for primary school pupils. Consent to the processing of personal data of children under 15 is given by their legal guardian — in home-educating families by the parent when registering the child, and in schools by the school as part of its documentation.',
              )}
            </p>
          </Section>

          <Section title={t('10. Změny zásad', '10. Changes to this policy')}>
            <p>
              {t(
                'Když aplikaci rozšíříme o funkce, které mění zpracování údajů, zásady aktualizujeme a datum změny uvedeme nahoře.',
                'When we add features that change how data is processed, we will update this policy and show the date of the change at the top.',
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

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>;
}
