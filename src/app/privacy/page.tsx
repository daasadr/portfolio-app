import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Zásady ochrany osobních údajů – Portfolio Paradise',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na hlavní stránku
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Zásady ochrany osobních údajů</h1>
              <p className="text-xs text-gray-400 mt-0.5">Naposledy aktualizováno: červenec 2025</p>
            </div>
          </div>

          <Section title="1. Správce osobních údajů">
            <p>
              Správcem osobních údajů je provozovatel aplikace Portfolio Paradise. Konkrétní identifikační
              údaje školy nebo organizace jsou dostupné u vašeho pedagoga nebo správce aplikace.
            </p>
          </Section>

          <Section title="2. Jaké údaje zpracováváme">
            <ul className="space-y-1.5">
              <Li><strong>Registrační údaje:</strong> jméno, příjmení, e-mailová adresa</Li>
              <Li><strong>Datum narození</strong> (volitelně, pro personalizaci)</Li>
              <Li><strong>Obsah portfolia:</strong> texty, obrázky, videa, soubory, které sami vložíte</Li>
              <Li><strong>Technické záznamy:</strong> čas přihlášení (pro bezpečnost)</Li>
            </ul>
            <p className="mt-3 text-gray-500">
              Nezpracováváme žádné citlivé osobní údaje, nesledujeme chování mimo aplikaci a neprodáváme
              žádné údaje třetím stranám.
            </p>
          </Section>

          <Section title="3. Účel zpracování">
            <ul className="space-y-1.5">
              <Li>Provoz a zabezpečení uživatelského účtu</Li>
              <Li>Ukládání a zobrazení obsahu portfolia</Li>
              <Li>Sdílení portfolia s osobami, které uživatel zvolí (učitel, rodič, kamarád)</Li>
            </ul>
          </Section>

          <Section title="4. Právní základ">
            <p>
              Zpracování probíhá na základě souhlasu uživatele (nebo zákonného zástupce u nezletilých)
              uděleného při registraci do aplikace, a na základě oprávněného zájmu provozovatele
              za účelem zajištění bezpečnosti a funkčnosti služby.
            </p>
            <p className="mt-2 text-gray-500">
              V souladu s GDPR a zákonem č. 110/2019 Sb. o zpracování osobních údajů.
            </p>
          </Section>

          <Section title="5. Doba uchovávání">
            <ul className="space-y-1.5">
              <Li>Po dobu aktivního využívání aplikace uživatelem</Li>
              <Li>Po ukončení studia nebo zrušení účtu jsou data smazána do 90 dnů</Li>
              <Li>Na žádost uživatele nebo zákonného zástupce lze data smazat kdykoli</Li>
            </ul>
          </Section>

          <Section title="6. Cookies a technické prostředky">
            <p>
              Aplikace ukládá do vašeho prohlížeče výhradně technicky nezbytné údaje
              (přihlašovací token v <code className="bg-gray-100 px-1 rounded text-xs">localStorage</code>).
              Tyto údaje slouží pouze k udržení přihlášení a nejsou sdíleny s třetími stranami.
            </p>
            <p className="mt-2 text-gray-500">
              Nepoužíváme žádné analytické, marketingové ani sledovací cookies.
            </p>
          </Section>

          <Section title="7. Vaše práva">
            <ul className="space-y-1.5">
              <Li><strong>Přístup</strong> – právo vědět, jaké údaje o vás máme</Li>
              <Li><strong>Oprava</strong> – právo opravit nepřesné údaje (přímo v nastavení aplikace)</Li>
              <Li><strong>Výmaz</strong> – právo na smazání účtu a všech dat</Li>
              <Li><strong>Přenositelnost</strong> – právo získat kopii svých dat</Li>
              <Li><strong>Odvolání souhlasu</strong> – kdykoli bez negativních důsledků</Li>
            </ul>
            <p className="mt-3 text-gray-500">
              Pro uplatnění práv se obraťte na správce aplikace (vašeho pedagoga nebo školu).
              Máte také právo podat stížnost u{' '}
              <a
                href="https://www.uoou.cz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Úřadu pro ochranu osobních údajů (ÚOOÚ)
              </a>.
            </p>
          </Section>

          <Section title="8. Nezletilí uživatelé">
            <p>
              Aplikace je určena primárně žákům základních škol. Souhlas se zpracováním osobních
              údajů dětí mladších 15 let uděluje zákonný zástupce. Škola jako zprostředkovatel
              zajišťuje potřebná souhlasná prohlášení v rámci zápisu nebo školní dokumentace.
            </p>
          </Section>

          <div className="pt-4 border-t text-center">
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Zpět na Portfolio Paradise
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
