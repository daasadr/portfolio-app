'use client';

import { useState } from 'react';
import {
  Rocket,
  Target,
  Star,
  LayoutDashboard,
  BookOpen,
  Calendar,
  Share2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';

interface Guide {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  steps: { heading?: string; text: string }[];
  tips?: string[];
}

const guides: Guide[] = [
  {
    id: 'start',
    icon: <Rocket className="h-6 w-6" />,
    title: 'Začínáme',
    subtitle: 'Registrace a přihlášení do Portfolio Paradise',
    color: 'from-blue-500 to-blue-600',
    steps: [
      { heading: 'Registrace (první přihlášení)', text: 'Otevřete stránku portfolioparadise.eu a klikněte na tlačítko „Registrace".' },
      { text: 'Vyplňte své jméno, příjmení, e-mailovou adresu a heslo (heslo musí mít alespoň 6 znaků). Heslo si dobře zapamatujte nebo zapište!' },
      { text: 'Klikněte na „Zaregistrovat se". Pokud je vše v pořádku, automaticky se dostanete na svůj přehled (dashboard).' },
      { heading: 'Přihlášení (příště)', text: 'Otevřete portfolioparadise.eu, klikněte na „Přihlášení" a zadejte svůj e-mail a heslo.' },
      { text: 'Klikněte na „Přihlásit se". Nyní jste uvnitř svého portfolia.' },
      { heading: 'Odhlášení', text: 'V levém menu úplně dole klikněte na „Odhlásit se". Vždy se odhlaste, pokud používáte sdílený počítač.' },
    ],
    tips: [
      'Pokud zapomenete heslo, požádejte učitele o pomoc — obnoví vám přístup.',
      'Každý žák má vlastní účet s vlastními daty. Nikdo jiný vaše portfolio neuvidí, dokud mu to sami neumožníte.',
    ],
  },
  {
    id: 'goals',
    icon: <Target className="h-6 w-6" />,
    title: 'Osobní cíle',
    subtitle: 'Jak si stanovit a sledovat cíle',
    color: 'from-green-500 to-green-600',
    steps: [
      { heading: 'Přidat nový cíl', text: 'V levém menu klikněte na „Osobní cíle" a pak na záložku „Cíle".' },
      { text: 'Klikněte na tlačítko „+ Nový cíl" v pravém horním rohu.' },
      { text: 'Vyplňte název cíle (např. „Naučit se násobilku do 10"), přidejte popis, vyberete typ cíle a případně termín do kdy ho chcete splnit.' },
      { text: 'Klikněte na „Uložit". Cíl se zobrazí v seznamu „Aktivní cíle".' },
      { heading: 'Označit cíl jako splněný', text: 'U každého cíle je kroužek ○ vlevo. Klikněte na něj a cíl se přesune do sekce „Splněné cíle" a zobrazí se zelená fajfka ✓.' },
      { text: 'Splněný cíl lze kdykoli znovu aktivovat dalším kliknutím na fajfku.' },
      { heading: 'Upravit nebo smazat cíl', text: 'Najeďte myší na cíl — zobrazí se ikona tužky (upravit) a koše (smazat).' },
      { heading: 'Typy cílů', text: 'Krátkodobý = chcete splnit brzy (dny, týdny). Dlouhodobý = věc na měsíce nebo rok. Celoživotní = velký sen, ke kterému míříte celý život.' },
    ],
    tips: [
      'Cíle jsou soukromé — vidíte je jen vy (a váš učitel, pokud mu portfolio nasdílíte).',
      'Zkuste každý týden přidat alespoň jeden nový cíl a označit splněné. Pomáhá to vidět vlastní pokrok!',
    ],
  },
  {
    id: 'dreams',
    icon: <Star className="h-6 w-6" />,
    title: 'Sny a obrázky',
    subtitle: 'Jak zapisovat sny a přidávat k nim obrázky',
    color: 'from-yellow-500 to-orange-500',
    steps: [
      { heading: 'Přidat nový sen', text: 'V sekci „Osobní cíle" klikněte na záložku „Sny" a pak na „+ Nový sen".' },
      { text: 'Napište název snu (např. „Cestovat do Japonska") a popis — proč to chcete, jak si to představujete.' },
      { heading: 'Přidat obrázky ke snu', text: 'V dialogu pro nový nebo upravovaný sen klikněte na „Přidat obrázky" nebo na rámeček s ikonou fotografie.' },
      { text: 'Vyberte obrázky z počítače nebo telefonu (max. 10 obrázků na jeden sen). Vybrané obrázky uvidíte jako náhledy před uložením.' },
      { text: 'Klikněte na „Uložit" — obrázky se nahrají a přiřadí k danému snu.' },
      { heading: 'Umístit obrázek na Nástěnku snů', text: 'Při úpravě snu najeďte myší na obrázek — zobrazí se tlačítko „Na nástěnku". Klikněte na něj. Modrá tečka znamená, že obrázek je na nástěnce.' },
      { text: 'Druhým kliknutím na stejné tlačítko obrázek z nástěnky odeberete (ale nezmizí ze snu).' },
      { heading: 'Zobrazit obrázky u snu', text: 'Na stránce Sny klikněte na kartu snu — rozbalí se a zobrazí všechny obrázky.' },
      { text: 'Kliknutím na kartu znovu ji zavřete.' },
    ],
    tips: [
      'Hledejte obrázky na bezplatných stránkách jako Unsplash (unsplash.com) nebo si vyfoťte vlastní.',
      'Modrá tečka na obrázku znamená, že je vidět na vaší Nástěnce snů.',
    ],
  },
  {
    id: 'dreamboard',
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: 'Nástěnka snů',
    subtitle: 'Jak rozmístit a upravit obrázky na nástěnce',
    color: 'from-purple-500 to-purple-700',
    steps: [
      { heading: 'Otevřít nástěnku', text: 'V levém menu klikněte na „Nástěnka snů", nebo na přehledu klikněte na náhled nástěnky nebo tlačítko „Otevřít".' },
      { text: 'Nástěnka je tmavé plátno, na kterém jsou rozmístěny vaše vybrané obrázky.' },
      { heading: 'Přejít do režimu úprav', text: 'Klikněte na tlačítko „Upravit nástěnku" vpravo nahoře. Zobrazí se modrý pruh s návodem.' },
      { heading: 'Přesunout obrázek', text: 'V režimu úprav klikněte na obrázek a držte levé tlačítko myši. Přetáhněte obrázek na nové místo a pusťte.' },
      { heading: 'Změnit velikost obrázku', text: 'Najeďte myší na obrázek — v rozích se zobrazí malé bílé tečky. Klikněte na tečku a táhněte pro zvětšení nebo zmenšení.' },
      { heading: 'Vrstvení obrázků přes sebe', text: 'Obrázky se mohou překrývat. Kliknutím na obrázek ho přesunete do popředí (nad ostatní).' },
      { heading: 'Odebrat obrázek z nástěnky', text: 'V režimu úprav najeďte na obrázek — zobrazí se ikona koše. Klikněte na ni. Obrázek zmizí z nástěnky, ale zůstane přiřazený ke snu.' },
      { heading: 'Dokončit úpravy', text: 'Klikněte na zelené tlačítko „Hotovo". Všechny změny jsou automaticky uloženy.' },
      { heading: 'Přidat obrázky na nástěnku', text: 'Obrázky se přidávají přes sekci Sny — viz návod výše. Na nástěnku se zobrazí pouze obrázky označené „Na nástěnku".' },
    ],
    tips: [
      'Nástěnka je dlouhá jako 3 obrazovky — rolujte dolů pro více místa.',
      'Pozice a velikost obrázků se ukládají automaticky po každém přesunutí.',
      'Nástěnka snů je jako digitální koláž — dejte jí svou osobitost!',
    ],
  },
  {
    id: 'portfolio',
    icon: <BookOpen className="h-6 w-6" />,
    title: 'Portfolio',
    subtitle: 'Jak tvořit a spravovat stránky portfolia',
    color: 'from-blue-600 to-indigo-600',
    steps: [
      { heading: 'Co je portfolio?', text: 'Portfolio je sbírka vaší práce — může obsahovat projekty, zápisky, fotografie, texty nebo cokoliv, na co jste hrdí.' },
      { heading: 'Vytvořit novou stránku', text: 'V menu klikněte na „Portfolio Paradise" a pak na „+ Nová stránka".' },
      { text: 'Zadejte název stránky, vyberte kategorii (Matematika, Umění, Projekty...) a napište nebo vložte obsah.' },
      { text: 'Klikněte na „Uložit". Stránka se zobrazí v přehledu portfolia.' },
      { heading: 'Upravit nebo smazat stránku', text: 'Klikněte na stránku v seznamu — otevře se pro čtení. Tlačítkem „Upravit" vstoupíte do editace.' },
      { heading: 'Viditelnost stránky', text: 'Každá stránka může být „Soukromá" (vidíte jen vy) nebo „Sdílená" (mohou vidět ostatní přes sdílený odkaz).' },
    ],
    tips: [
      'Stránky portfolia skvěle poslouží jako záznam projektů nebo jako příprava na prezentaci.',
      'Zkuste přidávat fotografie svých výkresů, modelů nebo domácích úkolů.',
    ],
  },
  {
    id: 'calendar',
    icon: <Calendar className="h-6 w-6" />,
    title: 'Kalendář',
    subtitle: 'Jak plánovat a sledovat své aktivity',
    color: 'from-teal-500 to-teal-600',
    steps: [
      { heading: 'Otevřít kalendář', text: 'V levém menu klikněte na „Kalendář".' },
      { heading: 'Přidat záznam', text: 'Klikněte na tlačítko „+ Přidat" nebo na konkrétní den v kalendáři.' },
      { text: 'Vyplňte název, datum a typ záznamu: Plán (co chcete udělat), Událost (co se stane), Deadline (termín splnění cíle), nebo Reflexe (zamyšlení nad tím, co proběhlo).' },
      { heading: 'Označit jako splněné', text: 'U každého záznamu je možnost označit ho jako hotový kliknutím na kroužek vlevo.' },
      { heading: 'Přehled na dashboardu', text: 'Na hlavním přehledu (Přehled) vidíte vždy dnešní plány a záznamy.' },
    ],
    tips: [
      'Používejte kalendář pro plánování učení, kroužků nebo termínů odevzdání úkolů.',
      'Reflexe v kalendáři vám pomůže zapamatovat si, co jste se naučili nebo zažili.',
    ],
  },
  {
    id: 'share',
    icon: <Share2 className="h-6 w-6" />,
    title: 'Sdílení portfolia',
    subtitle: 'Jak ukázat portfolio rodičům nebo učiteli',
    color: 'from-rose-500 to-pink-600',
    steps: [
      { heading: 'Sdílení celého portfolia', text: 'V menu klikněte na „Sdílení". Zvolte „Celé portfolio" a klikněte na „Vytvořit odkaz".' },
      { text: 'Zkopírujte vygenerovaný odkaz a pošlete ho rodičům nebo učiteli (e-mailem, přes zprávy, nebo ho vypište na papír).' },
      { heading: 'Sdílení konkrétní stránky', text: 'Místo celého portfolia lze sdílet i jednu konkrétní stránku — vyberte „Jedna stránka" a zvolte, kterou.' },
      { heading: 'Ochrana heslem', text: 'Chcete-li, aby odkaz byl chráněn, nastavte heslo. Příjemce ho bude muset zadat pro zobrazení.' },
      { heading: 'Zrušit sdílení', text: 'V přehledu sdílených odkazů klikněte na „Deaktivovat". Odkaz přestane fungovat.' },
    ],
    tips: [
      'Sdílený odkaz zobrazí portfolio jen pro čtení — nikdo nemůže vaše portfolio měnit.',
      'Odkaz můžete kdykoli zrušit nebo vytvořit nový.',
      'Rodiče nepotřebují účet — odkaz otevřou v jakémkoli prohlížeči.',
    ],
  },
];

function GuideCard({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <button
        className="w-full text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`flex items-center gap-4 px-5 py-4 bg-gradient-to-r ${guide.color} text-white`}>
          <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
            {guide.icon}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-lg leading-tight">{guide.title}</div>
            <div className="text-white/80 text-sm">{guide.subtitle}</div>
          </div>
          <div className="flex-shrink-0">
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="bg-white px-5 py-5 space-y-5">
          <ol className="space-y-3">
            {guide.steps.map((step, i) => (
              <li key={i}>
                {step.heading && (
                  <p className="font-semibold text-gray-800 mb-0.5">{step.heading}</p>
                )}
                <div className="flex gap-3">
                  {!step.heading && (
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                  )}
                  <p className={`text-gray-700 text-sm leading-relaxed ${step.heading ? 'ml-0' : ''}`}>
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {guide.tips && guide.tips.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-semibold text-amber-800 text-sm mb-2">💡 Tipy</p>
              <ul className="space-y-1.5">
                {guide.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-900">
                    <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState('');

  const filtered = guides.filter(g =>
    search.trim() === '' ||
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.subtitle.toLowerCase().includes(search.toLowerCase()) ||
    g.steps.some(s => s.text.toLowerCase().includes(search.toLowerCase()) || (s.heading ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nápověda</h1>
        <p className="text-gray-500 mt-1">Klikněte na téma, které vás zajímá, a zobrazí se podrobný návod.</p>
      </div>

      <div className="relative">
        <input
          type="search"
          placeholder="Hledat v nápovědě…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
        />
        <span className="absolute right-3 top-2.5 text-gray-400 text-lg">🔍</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Nic nenalezeno</p>
          <p className="text-sm mt-1">Zkuste jiný výraz nebo projděte témata níže.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(guide => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
        <p className="text-gray-700 font-medium">Nenašli jste odpověď?</p>
        <p className="text-gray-500 text-sm mt-1">
          Obraťte se na svého učitele nebo napište na{' '}
          <a href="mailto:podpora@portfolioparadise.eu" className="text-blue-600 hover:underline">
            podpora@portfolioparadise.eu
          </a>
        </p>
      </div>
    </div>
  );
}
