'use client';

import { useState } from 'react';
import {
  Rocket,
  Target,
  Star,
  LayoutDashboard,
  BookOpen,
  BookMarked,
  Calendar,
  Share2,
  Building2,
  Globe2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import type { L10n } from '@/lib/i18n';

interface Guide {
  id: string;
  icon: React.ReactNode;
  title: L10n;
  subtitle: L10n;
  color: string;
  steps: { heading?: L10n; text: L10n }[];
  tips?: L10n[];
}

const guides: Guide[] = [
  {
    id: 'start',
    icon: <Rocket className="h-6 w-6" />,
    title: { cs: 'Začínáme', en: 'Getting started' },
    subtitle: { cs: 'Registrace a přihlášení do Portfolio Paradise', en: 'Signing up and logging in to Portfolio Paradise' },
    color: 'from-blue-500 to-blue-600',
    steps: [
      {
        heading: { cs: 'Registrace (první přihlášení)', en: 'Signing up (your first visit)' },
        text: { cs: 'Otevřete stránku portfolioparadise.eu a klikněte na tlačítko „Registrace".', en: 'Go to portfolioparadise.eu and click the "Sign up" button.' },
      },
      {
        text: { cs: 'Vyplňte své jméno, příjmení, e-mailovou adresu a heslo (heslo musí mít alespoň 8 znaků). Heslo si dobře zapamatujte nebo zapište!', en: 'Fill in your first name, surname, email address and a password (it must be at least 8 characters long). Remember your password well or write it down!' },
      },
      {
        text: { cs: 'Klikněte na „Zaregistrovat se". Pokud je vše v pořádku, automaticky se dostanete na svůj přehled (dashboard).', en: 'Click "Sign up". If everything is fine, you\'ll be taken straight to your Overview (dashboard).' },
      },
      {
        heading: { cs: 'Přihlášení (příště)', en: 'Logging in (next time)' },
        text: { cs: 'Otevřete portfolioparadise.eu, klikněte na „Přihlášení" a zadejte svůj e-mail a heslo.', en: 'Go to portfolioparadise.eu, click "Log in" and enter your email and password.' },
      },
      {
        text: { cs: 'Klikněte na „Přihlásit se". Nyní jste uvnitř svého portfolia.', en: 'Click "Log in". Now you\'re inside your portfolio.' },
      },
      {
        heading: { cs: 'Odhlášení', en: 'Logging out' },
        text: { cs: 'V levém menu úplně dole klikněte na „Odhlásit se". Vždy se odhlaste, pokud používáte sdílený počítač.', en: 'At the very bottom of the left-hand menu, click "Log out". Always log out if you\'re using a shared computer.' },
      },
    ],
    tips: [
      { cs: 'Pokud zapomenete heslo, klikněte na přihlašovací stránce na „Zapomněli jste heslo?" a postupujte podle pokynů — budete potřebovat svou bezpečnostní otázku.', en: 'If you forget your password, click "Forgotten your password?" on the login page and follow the steps — you\'ll need your security question.' },
      { cs: 'Každý žák má vlastní účet s vlastními daty. Nikdo jiný vaše portfolio neuvidí, dokud mu to sami neumožníte.', en: 'Every pupil has their own account with their own data. Nobody else can see your portfolio unless you let them.' },
    ],
  },
  {
    id: 'goals',
    icon: <Target className="h-6 w-6" />,
    title: { cs: 'Osobní cíle', en: 'Personal goals' },
    subtitle: { cs: 'Jak si stanovit a sledovat cíle', en: 'How to set goals and keep track of them' },
    color: 'from-green-500 to-green-600',
    steps: [
      {
        heading: { cs: 'Přidat nový cíl', en: 'Add a new goal' },
        text: { cs: 'V levém menu klikněte na „Osobní cíle" a pak na záložku „Cíle".', en: 'In the left-hand menu, click "Personal goals" and then the "Goals" tab.' },
      },
      {
        text: { cs: 'Klikněte na tlačítko „+ Nový cíl" v pravém horním rohu.', en: 'Click the "+ New goal" button in the top right-hand corner.' },
      },
      {
        text: { cs: 'Vyplňte název cíle (např. „Naučit se násobilku do 10"), přidejte popis, vyberete typ cíle a případně termín do kdy ho chcete splnit.', en: 'Type the name of your goal (e.g. "Learn my times tables up to 10"), add a description, choose the type of goal and, if you like, the date you want to reach it by.' },
      },
      {
        text: { cs: 'Klikněte na „Uložit". Cíl se zobrazí v seznamu „Aktivní cíle".', en: 'Click "Save". The goal will appear in the "Active goals" list.' },
      },
      {
        heading: { cs: 'Označit cíl jako splněný', en: 'Mark a goal as achieved' },
        text: { cs: 'U každého cíle je kroužek ○ vlevo. Klikněte na něj a cíl se přesune do sekce „Splněné cíle" a zobrazí se zelená fajfka ✓.', en: 'Each goal has a little circle ○ on the left. Click it and the goal moves to the "Completed goals" section with a green tick ✓.' },
      },
      {
        text: { cs: 'Splněný cíl lze kdykoli znovu aktivovat dalším kliknutím na fajfku.', en: 'You can make an achieved goal active again at any time by clicking the tick once more.' },
      },
      {
        heading: { cs: 'Upravit nebo smazat cíl', en: 'Edit or delete a goal' },
        text: { cs: 'Najeďte myší na cíl — zobrazí se ikona tužky (upravit) a koše (smazat).', en: 'Hover your mouse over a goal — a pencil icon (edit) and a bin icon (delete) will appear.' },
      },
      {
        heading: { cs: 'Typy cílů', en: 'Types of goals' },
        text: { cs: 'Krátkodobý = chcete splnit brzy (dny, týdny). Dlouhodobý = věc na měsíce nebo rok. Celoživotní = velký sen, ke kterému míříte celý život.', en: 'Short-term = something you want to do soon (days or weeks). Long-term = something for months or a year. Lifelong = a big dream you work towards all your life.' },
      },
    ],
    tips: [
      { cs: 'Cíle jsou soukromé — vidíte je jen vy (a váš učitel, pokud mu portfolio nasdílíte).', en: 'Your goals are private — only you can see them (and your teacher, if you share your portfolio with them).' },
      { cs: 'Zkuste každý týden přidat alespoň jeden nový cíl a označit splněné. Pomáhá to vidět vlastní pokrok!', en: 'Try adding at least one new goal every week and ticking off the ones you\'ve achieved. It helps you see how far you\'ve come!' },
    ],
  },
  {
    id: 'dreams',
    icon: <Star className="h-6 w-6" />,
    title: { cs: 'Sny a obrázky', en: 'Dreams and pictures' },
    subtitle: { cs: 'Jak zapisovat sny a přidávat k nim obrázky', en: 'How to write down your dreams and add pictures to them' },
    color: 'from-yellow-500 to-orange-500',
    steps: [
      {
        heading: { cs: 'Přidat nový sen', en: 'Add a new dream' },
        text: { cs: 'V sekci „Osobní cíle" klikněte na záložku „Sny" a pak na „+ Nový sen".', en: 'In the "Personal goals" section, click the "Dreams" tab and then "+ New dream".' },
      },
      {
        text: { cs: 'Napište název snu (např. „Cestovat do Japonska") a popis — proč to chcete, jak si to představujete.', en: 'Write the name of your dream (e.g. "Travel to Japan") and a description — why you want it and how you imagine it.' },
      },
      {
        heading: { cs: 'Přidat obrázky ke snu', en: 'Add pictures to a dream' },
        text: { cs: 'V dialogu pro nový nebo upravovaný sen klikněte na „Přidat obrázky" nebo na rámeček s ikonou fotografie.', en: 'In the window for a new or edited dream, click "Add pictures" or the box with the photo icon.' },
      },
      {
        text: { cs: 'Vyberte obrázky z počítače nebo telefonu (max. 10 obrázků na jeden sen). Vybrané obrázky uvidíte jako náhledy před uložením.', en: 'Choose pictures from your computer or phone (up to 10 pictures per dream). You\'ll see small previews of them before you save.' },
      },
      {
        text: { cs: 'Klikněte na „Uložit" — obrázky se nahrají a přiřadí k danému snu.', en: 'Click "Save" — the pictures will be uploaded and added to that dream.' },
      },
      {
        heading: { cs: 'Umístit obrázek na Nástěnku snů', en: 'Put a picture on your Dream board' },
        text: { cs: 'Při úpravě snu najeďte myší na obrázek — zobrazí se tlačítko „Na nástěnku". Klikněte na něj. Modrá tečka znamená, že obrázek je na nástěnce.', en: 'While editing a dream, hover your mouse over a picture — an "To the board" button will appear. Click it. A blue dot means the picture is on your board.' },
      },
      {
        text: { cs: 'Druhým kliknutím na stejné tlačítko obrázek z nástěnky odeberete (ale nezmizí ze snu).', en: 'Click the same button again to take the picture off the board (it stays with your dream, though).' },
      },
      {
        heading: { cs: 'Zobrazit obrázky u snu', en: 'See a dream\'s pictures' },
        text: { cs: 'Na stránce Sny klikněte na kartu snu — rozbalí se a zobrazí všechny obrázky.', en: 'On the Dreams page, click a dream\'s card — it opens up and shows all its pictures.' },
      },
      {
        text: { cs: 'Kliknutím na kartu znovu ji zavřete.', en: 'Click the card again to close it.' },
      },
    ],
    tips: [
      { cs: 'Hledejte obrázky na bezplatných stránkách jako Unsplash (unsplash.com) nebo si vyfoťte vlastní.', en: 'Look for pictures on free websites such as Unsplash (unsplash.com), or take your own photos.' },
      { cs: 'Modrá tečka na obrázku znamená, že je vidět na vaší Nástěnce snů.', en: 'A blue dot on a picture means it can be seen on your Dream board.' },
    ],
  },
  {
    id: 'dreamboard',
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: { cs: 'Nástěnka snů', en: 'Dream board' },
    subtitle: { cs: 'Jak rozmístit a upravit obrázky na nástěnce', en: 'How to arrange and adjust the pictures on your board' },
    color: 'from-purple-500 to-purple-700',
    steps: [
      {
        heading: { cs: 'Otevřít nástěnku', en: 'Open the board' },
        text: { cs: 'V levém menu klikněte na „Nástěnka snů", nebo na přehledu klikněte na náhled nástěnky nebo tlačítko „Otevřít".', en: 'In the left-hand menu, click "Dream board", or on the Overview click the board preview or the "Open" button.' },
      },
      {
        text: { cs: 'Nástěnka je tmavé plátno, na kterém jsou rozmístěny vaše vybrané obrázky.', en: 'The board is a dark canvas with your chosen pictures spread across it.' },
      },
      {
        heading: { cs: 'Přejít do režimu úprav', en: 'Switch to editing mode' },
        text: { cs: 'Klikněte na tlačítko „Upravit nástěnku" vpravo nahoře. Zobrazí se modrý pruh s návodem.', en: 'Click the "Edit board" button in the top right. A blue bar with instructions will appear.' },
      },
      {
        heading: { cs: 'Přesunout obrázek', en: 'Move a picture' },
        text: { cs: 'V režimu úprav klikněte na obrázek a držte levé tlačítko myši. Přetáhněte obrázek na nové místo a pusťte.', en: 'In editing mode, click a picture and hold down the left mouse button. Drag the picture to a new spot and let go.' },
      },
      {
        heading: { cs: 'Změnit velikost obrázku', en: 'Resize a picture' },
        text: { cs: 'Najeďte myší na obrázek — v rozích se zobrazí malé bílé tečky. Klikněte na tečku a táhněte pro zvětšení nebo zmenšení.', en: 'Hover your mouse over a picture — small white dots will appear in the corners. Click a dot and drag to make the picture bigger or smaller.' },
      },
      {
        heading: { cs: 'Vrstvení obrázků přes sebe', en: 'Layering pictures' },
        text: { cs: 'Obrázky se mohou překrývat. Kliknutím na obrázek ho přesunete do popředí (nad ostatní).', en: 'Pictures can overlap. Click a picture to bring it to the front (on top of the others).' },
      },
      {
        heading: { cs: 'Odebrat obrázek z nástěnky', en: 'Remove a picture from the board' },
        text: { cs: 'V režimu úprav najeďte na obrázek — zobrazí se ikona koše. Klikněte na ni. Obrázek zmizí z nástěnky, ale zůstane přiřazený ke snu.', en: 'In editing mode, hover over a picture — a bin icon will appear. Click it. The picture disappears from the board but stays with its dream.' },
      },
      {
        heading: { cs: 'Dokončit úpravy', en: 'Finish editing' },
        text: { cs: 'Klikněte na zelené tlačítko „Hotovo". Všechny změny jsou automaticky uloženy.', en: 'Click the green "Done" button. All your changes are saved automatically.' },
      },
      {
        heading: { cs: 'Přidat obrázky na nástěnku', en: 'Add pictures to the board' },
        text: { cs: 'Obrázky se přidávají přes sekci Sny — viz návod výše. Na nástěnku se zobrazí pouze obrázky označené „Na nástěnku".', en: 'You add pictures through the Dreams section — see the guide above. Only pictures marked "To the board" appear on the board.' },
      },
    ],
    tips: [
      { cs: 'Nástěnka je dlouhá jako 3 obrazovky — rolujte dolů pro více místa.', en: 'The board is as long as 3 screens — scroll down for more space.' },
      { cs: 'Pozice a velikost obrázků se ukládají automaticky po každém přesunutí.', en: 'The position and size of your pictures are saved automatically every time you move them.' },
      { cs: 'Nástěnka snů je jako digitální koláž — dejte jí svou osobitost!', en: 'Your Dream board is like a digital collage — make it truly yours!' },
    ],
  },
  {
    id: 'portfolio',
    icon: <BookOpen className="h-6 w-6" />,
    title: { cs: 'Portfolio', en: 'Portfolio' },
    subtitle: { cs: 'Jak tvořit a spravovat stránky portfolia', en: 'How to create and manage your portfolio pages' },
    color: 'from-blue-600 to-indigo-600',
    steps: [
      {
        heading: { cs: 'Co je portfolio?', en: 'What is a portfolio?' },
        text: { cs: 'Portfolio je sbírka vaší práce — může obsahovat projekty, zápisky, fotografie, texty nebo cokoliv, na co jste hrdí.', en: 'A portfolio is a collection of your work — it can hold projects, notes, photos, writing or anything else you\'re proud of.' },
      },
      {
        heading: { cs: 'Vytvořit novou stránku', en: 'Create a new page' },
        text: { cs: 'V menu klikněte na „Portfolio Paradise" a pak na „+ Nová stránka".', en: 'In the menu, click "Portfolio Paradise" and then "+ New page".' },
      },
      {
        text: { cs: 'Zadejte název stránky, vyberte kategorii (Matematika, Umění, Projekty...) a napište nebo vložte obsah.', en: 'Enter a name for the page, choose a category (Maths, Art, Projects...) and write or paste in your content.' },
      },
      {
        text: { cs: 'Klikněte na „Uložit". Stránka se zobrazí v přehledu portfolia.', en: 'Click "Save". The page will appear in your portfolio.' },
      },
      {
        heading: { cs: 'Upravit nebo smazat stránku', en: 'Edit or delete a page' },
        text: { cs: 'Klikněte na stránku v seznamu — otevře se pro čtení. Tlačítkem „Upravit" vstoupíte do editace.', en: 'Click a page in the list — it opens for reading. Click the "Edit" button to start editing.' },
      },
      {
        heading: { cs: 'Viditelnost stránky', en: 'Who can see a page' },
        text: { cs: 'Každá stránka může být „Soukromá" (vidíte jen vy) nebo „Sdílená" (mohou vidět ostatní přes sdílený odkaz).', en: 'Each page can be "Private" (only you can see it) or "Shared" (others can see it through a share link).' },
      },
    ],
    tips: [
      { cs: 'Stránky portfolia skvěle poslouží jako záznam projektů nebo jako příprava na prezentaci.', en: 'Portfolio pages are great for keeping a record of your projects or for preparing a presentation.' },
      { cs: 'Zkuste přidávat fotografie svých výkresů, modelů nebo domácích úkolů.', en: 'Try adding photos of your drawings, models or homework.' },
    ],
  },
  {
    id: 'reading-diary',
    icon: <BookMarked className="h-6 w-6" />,
    title: { cs: 'Čtenářský deník', en: 'Reading diary' },
    subtitle: { cs: 'Jak si zapisovat přečtené knížky', en: 'How to keep a record of the books you\'ve read' },
    color: 'from-amber-600 to-orange-700',
    steps: [
      {
        heading: { cs: 'Otevřít deník', en: 'Open the diary' },
        text: { cs: 'V levém menu klikněte na „Čtenářský deník". Uvidíte hromádku knih, které už máte přečtené.', en: 'In the left-hand menu, click "Reading diary". You\'ll see a pile of the books you\'ve already read.' },
      },
      {
        heading: { cs: 'Přidat knihu', en: 'Add a book' },
        text: { cs: 'Klikněte na „Přidat knihu" a vyplňte název, autora, stručný obsah, svůj názor a případně poznámky. Datum zápisu se uloží samo.', en: 'Click "Add a book" and fill in the title, author, a short summary, what you thought of it and any notes. The date is saved automatically.' },
      },
      {
        heading: { cs: 'Otevřít zápis', en: 'Open an entry' },
        text: { cs: 'Klikněte na hřbet knížky v hromádce — kniha se otevře a uvidíte celý svůj zápis.', en: 'Click the spine of a book in the pile — the book opens and you\'ll see your whole entry.' },
      },
      {
        heading: { cs: 'Upravit nebo smazat', en: 'Edit or delete' },
        text: { cs: 'V otevřené knize jsou dole tlačítka „Upravit" a „Smazat".', en: 'At the bottom of an open book you\'ll find the "Edit" and "Delete" buttons.' },
      },
      {
        heading: { cs: 'Ukázat učiteli', en: 'Show your teacher' },
        text: { cs: 'Ve formuláři zaškrtněte „Ukázat učiteli". Knížka dostane zlatou záložku a uvidí ji učitel, se kterým jste propojeni. Bez zaškrtnutí zůstává zápis jen váš.', en: 'Tick "Show my teacher" in the form. The book gets a golden bookmark and the teacher you\'re connected with can see it. If you leave it unticked, the entry stays just yours.' },
      },
    ],
    tips: [
      { cs: 'Nejnovější kniha leží vždy navrchu hromádky.', en: 'The newest book is always on top of the pile.' },
      { cs: 'Do poznámek si můžete zapsat oblíbený citát nebo komu byste knihu doporučili.', en: 'In the notes you can write down a favourite quote or who you\'d recommend the book to.' },
      { cs: 'Čtenářský deník můžete stáhnout v Nastavení → „Export mých dat" spolu s portfoliem.', en: 'You can download your Reading diary together with your portfolio in Settings → "Export my data".' },
    ],
  },
  {
    id: 'calendar',
    icon: <Calendar className="h-6 w-6" />,
    title: { cs: 'Kalendář', en: 'Calendar' },
    subtitle: { cs: 'Jak plánovat a sledovat své aktivity', en: 'How to plan and keep track of your activities' },
    color: 'from-teal-500 to-teal-600',
    steps: [
      {
        heading: { cs: 'Otevřít kalendář', en: 'Open the calendar' },
        text: { cs: 'V levém menu klikněte na „Kalendář".', en: 'In the left-hand menu, click "Calendar".' },
      },
      {
        heading: { cs: 'Přidat záznam', en: 'Add an entry' },
        text: { cs: 'Klikněte na tlačítko „+ Přidat" nebo na konkrétní den v kalendáři.', en: 'Click the "+ Add" button or a particular day in the calendar.' },
      },
      {
        text: { cs: 'Vyplňte název, datum a typ záznamu: Plán (co chcete udělat), Událost (co se stane), Deadline (termín splnění cíle), nebo Reflexe (zamyšlení nad tím, co proběhlo).', en: 'Fill in the name, the date and the type of entry: Plan (something you want to do), Event (something that will happen), Deadline (the date to reach a goal by) or Reflection (thinking back on what happened).' },
      },
      {
        heading: { cs: 'Označit jako splněné', en: 'Mark as done' },
        text: { cs: 'U každého záznamu je možnost označit ho jako hotový kliknutím na kroužek vlevo.', en: 'You can mark any entry as done by clicking the little circle on its left.' },
      },
      {
        heading: { cs: 'Přehled na dashboardu', en: 'At a glance on your dashboard' },
        text: { cs: 'Na hlavním přehledu (Přehled) vidíte vždy dnešní plány a záznamy.', en: 'Your main page (Overview) always shows today\'s plans and entries.' },
      },
    ],
    tips: [
      { cs: 'Používejte kalendář pro plánování učení, kroužků nebo termínů odevzdání úkolů.', en: 'Use the calendar to plan your learning, after-school clubs or homework deadlines.' },
      { cs: 'Reflexe v kalendáři vám pomůže zapamatovat si, co jste se naučili nebo zažili.', en: 'Reflections in the calendar help you remember what you\'ve learnt or experienced.' },
    ],
  },
  {
    id: 'share',
    icon: <Share2 className="h-6 w-6" />,
    title: { cs: 'Sdílení portfolia', en: 'Sharing your portfolio' },
    subtitle: { cs: 'Jak ukázat portfolio rodičům nebo se propojit s učitelem', en: 'How to show your portfolio to your parents or connect with your teacher' },
    color: 'from-rose-500 to-pink-600',
    steps: [
      {
        heading: { cs: 'Sdílení celého portfolia', en: 'Sharing your whole portfolio' },
        text: { cs: 'V menu klikněte na „Sdílení". Zvolte „Celé portfolio" a klikněte na „Vytvořit odkaz". Zobrazí se jen stránky označené jako sdílené — soukromé stránky uvidíte jen vy.', en: 'In the menu, click "Sharing". Choose "Whole portfolio" and click "Create link". Only pages marked as shared will be shown — private pages stay visible only to you.' },
      },
      {
        text: { cs: 'Zkopírujte vygenerovaný odkaz a pošlete ho rodičům (e-mailem, přes zprávy, nebo ho vypište na papír).', en: 'Copy the link that\'s created and send it to your parents (by email, in a message, or write it down on paper).' },
      },
      {
        heading: { cs: 'Sdílení konkrétní stránky', en: 'Sharing a single page' },
        text: { cs: 'Místo celého portfolia lze sdílet i jednu konkrétní stránku — vyberte „Jedna stránka" a zvolte, kterou.', en: 'Instead of the whole portfolio you can also share just one page — choose "A single page" and pick which one.' },
      },
      {
        heading: { cs: 'Ochrana heslem', en: 'Password protection' },
        text: { cs: 'Chcete-li, aby odkaz byl chráněn, nastavte heslo. Příjemce ho bude muset zadat pro zobrazení.', en: 'If you want the link to be protected, set a password. Whoever opens it will need to enter the password to see it.' },
      },
      {
        heading: { cs: 'Zrušit sdílení', en: 'Stop sharing' },
        text: { cs: 'V přehledu sdílených odkazů klikněte na „Deaktivovat". Odkaz přestane fungovat.', en: 'In your list of share links, click "Deactivate". The link will stop working.' },
      },
      {
        heading: { cs: 'Propojení s učitelem', en: 'Connecting with your teacher' },
        text: { cs: 'Pokud vás učitel pozval do své třídy, zobrazí se v sekci „Žádosti o propojení" jeho jméno, tlačítko „Přijmout" a křížek ✕ pro odmítnutí.', en: 'If your teacher has invited you to their class, you\'ll see their name in the "Connection requests" section, with an "Accept" button and a cross ✕ to decline.' },
      },
      {
        text: { cs: 'Po přijetí vidí učitel vaše sdílené stránky portfolia (jen pro čtení). Soukromé stránky neuvidí. Propojení můžete kdykoli zrušit tlačítkem „Odebrat".', en: 'Once you accept, your teacher can see your shared portfolio pages (read-only). They can\'t see your private pages. You can end the connection at any time with the "Remove" button.' },
      },
    ],
    tips: [
      { cs: 'Sdílený odkaz zobrazí portfolio jen pro čtení — nikdo nemůže vaše portfolio měnit.', en: 'A share link shows your portfolio read-only — nobody can change it.' },
      { cs: 'Odkaz můžete kdykoli zrušit nebo vytvořit nový.', en: 'You can turn off a link or create a new one at any time.' },
      { cs: 'Rodiče nepotřebují účet — odkaz otevřou v jakémkoli prohlížeči.', en: 'Your parents don\'t need an account — they can open the link in any browser.' },
    ],
  },
  {
    id: 'world',
    icon: <Globe2 className="h-6 w-6" />,
    title: { cs: 'Světoběžník a bobříci', en: 'Globetrotter and beavers' },
    subtitle: { cs: 'Jak sbírat bobříky a plnit týdenní výzvy', en: 'How to collect beavers and complete week-long challenges' },
    color: 'from-emerald-500 to-teal-600',
    steps: [
      {
        heading: { cs: 'Co je Světoběžník?', en: 'What is Globetrotter?' },
        text: { cs: 'Světoběžník je sekce plná výzev, aktivit a zábavy. Najdeš ji v levém menu pod ikonou globusu. Jako první jsou tu Bobříci — týdenní výzvy, za které získáš odznáček.', en: 'Globetrotter is a section full of challenges, activities and fun. You\'ll find it in the left-hand menu under the globe icon. First up are the Beavers — week-long challenges that earn you a badge.' },
      },
      {
        heading: { cs: 'Co je bobřík?', en: 'What is a beaver?' },
        text: { cs: 'Bobřík je výzva, kterou plníš každý den po dobu 7 dní. Každý den uděláš to, co bobřík vyžaduje (např. pomůžeš doma, uděláš někomu radost nebo uklídíš odpadek v přírodě), a klikneš na „Dnes splněno".', en: 'A beaver is a challenge you do every day for 7 days. Each day you do what the beaver asks (for example, help at home, make someone happy or pick up some litter outdoors) and click "Done today".' },
      },
      {
        heading: { cs: 'Jak začít lovit bobříka?', en: 'How do I start hunting a beaver?' },
        text: { cs: 'V menu klikněte na „Světoběžník". Zobrazí se přehled dostupných bobříků. Klikněte na bobříka, který vás zaujal — otevře se stránka s článkem o tom, proč je bobřík důležitý a jak ho plnit.', en: 'In the menu, click "Globetrotter". You\'ll see all the beavers you can take on. Click one that catches your eye — a page opens with an article about why that beaver matters and how to complete it.' },
      },
      {
        text: { cs: 'Na stránce bobříka klikněte na „Začít lovit". Bobřík se aktivuje a objeví se vám widget na hlavním přehledu (dashboardu).', en: 'On the beaver\'s page, click "Start the challenge". The beaver becomes active and a widget appears on your Overview (dashboard).' },
      },
      {
        heading: { cs: 'Denní potvrzení', en: 'Ticking off each day' },
        text: { cs: 'Každý den, kdy jste splnili podmínku bobříka, klikněte na tlačítko „Dnes splněno" — buď přímo na dashboardu ve widgetu, nebo na stránce bobříka. Jde kliknout jednou za den (od půlnoci). Sledujte, jak se pruh postupu plní.', en: 'Every day you\'ve done what the beaver asks, click the "Done today" button — either in the widget on your dashboard or on the beaver\'s page. You can click it once a day (from midnight). Watch the progress bar fill up!' },
      },
      {
        heading: { cs: 'Splnění bobříka', en: 'Completing a beaver' },
        text: { cs: 'Po 7 úspěšných dnech bobřík splníte — gratulujeme! Na stránce se objeví slavnostní hlášení a odznáček vám platí celý rok. Po roce dostanete připomenutí, že je čas bobříka obnovit.', en: 'After 7 successful days you\'ve completed the beaver — congratulations! A celebration message appears and your badge is valid for a whole year. After a year you\'ll get a reminder that it\'s time to earn the beaver again.' },
      },
      {
        heading: { cs: 'Více bobříků najednou', en: 'Several beavers at once' },
        text: { cs: 'Můžete mít aktivních více bobříků zároveň — každý se zobrazí jako samostatná kartička ve widgetu na dashboardu.', en: 'You can have several beavers on the go at the same time — each one shows up as its own card in the widget on your dashboard.' },
      },
    ],
    tips: [
      { cs: 'Buďte k sobě poctiví — bobřík má smysl jen tehdy, když podmínku skutečně splníte. Nikdo jiný to nekontroluje, jen vy sami.', en: 'Be honest with yourself — a beaver only means something if you really do the challenge. Nobody else checks, only you.' },
      { cs: 'Nevynechejte den — bobřík se loví 7 dní po sobě. Když den vynecháte, začíná se znovu od prvního dne.', en: 'Don\'t skip a day — a beaver is hunted for 7 days in a row. If you miss a day, you start again from day one.' },
      { cs: 'Zlatý bobřík: kdo získá všechny dostupné bobříky v daném roce, získá zlatého bobříka!', en: 'Golden beaver: anyone who earns every available beaver in a year gets the golden beaver!' },
    ],
  },
  {
    id: 'achievements',
    icon: <Star className="h-6 w-6" />,
    title: { cs: 'Odznaky za aktivitu', en: 'Badges' },
    subtitle: { cs: 'Jak se sbírají odznaky pod menu', en: 'How you collect the badges under the menu' },
    color: 'from-amber-400 to-orange-500',
    steps: [
      {
        heading: { cs: 'Co jsou odznaky?', en: 'What are badges?' },
        text: { cs: 'Za pilnou práci v aplikaci dostáváš odznaky — třeba „Začínající poctivý student" za 5 stránek portfolia nebo „Knihomol" za 5 knih ve čtenářském deníku. Sbírají se v levém menu pod položkami.', en: 'You earn badges for working hard in the app — for example, "Diligent Beginner" for 5 portfolio pages or "Bookworm" for 5 books in your Reading diary. They collect in the left-hand menu, below the menu items.' },
      },
      {
        heading: { cs: 'Za co se dávají?', en: 'What do I get them for?' },
        text: { cs: 'Za stránky portfolia, knihy ve čtenářském deníku, splněné osobní cíle, ulovené bobříky, záznamy v kalendáři a sny na nástěnce. Každá oblast má několik úrovní.', en: 'For portfolio pages, books in your Reading diary, achieved personal goals, beavers you\'ve hunted, calendar entries and dreams on your board. Each area has several levels.' },
      },
      {
        heading: { cs: 'Nový odznak', en: 'A new badge' },
        text: { cs: 'Jakmile dosáhneš další úrovně, objeví se oslava s pochvalou. Na odznak v menu můžeš kdykoli kliknout a pochvalu si připomenout.', en: 'As soon as you reach the next level, a celebration with some praise pops up. You can click a badge in the menu at any time to see the praise again.' },
      },
      {
        heading: { cs: 'Co dál?', en: 'What\'s next?' },
        text: { cs: 'Pod odznaky vidíš, který odznak je nejblíž a kolik ti k němu chybí.', en: 'Below your badges you can see which badge is closest and how much you still need to get it.' },
      },
    ],
    tips: [
      { cs: 'Odznaky se počítají z toho, co v aplikaci opravdu máš — když stránku smažeš, může se odznak zase schovat.', en: 'Badges are worked out from what you really have in the app — if you delete a page, a badge might hide away again.' },
    ],
  },
  {
    id: 'community',
    icon: <Building2 className="h-6 w-6" />,
    title: { cs: 'Komunita', en: 'Community' },
    subtitle: { cs: 'Organizace a skupiny — setkávejte se s ostatními', en: 'Organisations and groups — meet up with others' },
    color: 'from-violet-500 to-violet-700',
    steps: [
      {
        heading: { cs: 'Co je komunita?', en: 'What is Community?' },
        text: { cs: 'Komunita umožňuje vytvářet organizace (např. školu nebo kroužek) a skupiny uvnitř nich (např. třídy nebo zájmové skupiny).', en: 'Community lets you create organisations (e.g. a school or a club) and groups inside them (e.g. classes or interest groups).' },
      },
      {
        heading: { cs: 'Připojit se k organizaci nebo skupině', en: 'Join an organisation or group' },
        text: { cs: 'V menu klikněte na „Komunita". Do vyhledávacího pole napište název organizace nebo skupiny (min. 2 znaky) a klikněte na „Připojit se".', en: 'In the menu, click "Community". Type the name of an organisation or group into the search box (at least 2 characters) and click "Join".' },
      },
      {
        heading: { cs: 'Vytvořit novou organizaci nebo skupinu', en: 'Create a new organisation or group' },
        text: { cs: 'Klikněte na tlačítko „Vytvořit" vpravo nahoře. Vyplňte název a popis. Pro skupinu lze zvolit, do které organizace patří.', en: 'Click the "Create" button in the top right. Fill in a name and description. For a group, you can choose which organisation it belongs to.' },
      },
      {
        heading: { cs: 'Odejít ze skupiny nebo organizace', en: 'Leave a group or organisation' },
        text: { cs: 'V přehledu vašich členství klikněte na ikonu „odejít" (šipka vpravo). Budete odebráni jako člen.', en: 'In the list of your memberships, click the "leave" icon (the arrow on the right). You\'ll be removed as a member.' },
      },
      {
        heading: { cs: 'Správce (admin)', en: 'Admin' },
        text: { cs: 'Zakladatel organizace nebo skupiny se stává automaticky správcem (admin). Správce může skupinu nebo organizaci smazat kliknutím na ikonu koše.', en: 'Whoever creates an organisation or group automatically becomes its admin. The admin can delete the group or organisation by clicking the bin icon.' },
      },
    ],
    tips: [
      { cs: 'Vyhledávání funguje již od 2 znaků — stačí napsat začátek názvu.', en: 'Search works from just 2 characters — simply type the start of the name.' },
      { cs: 'Každý může být členem více organizací a skupin zároveň.', en: 'Anyone can be a member of several organisations and groups at the same time.' },
    ],
  },
];

function GuideCard({ guide }: { guide: Guide }) {
  const { t } = useLocale();
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
            <div className="font-semibold text-lg leading-tight">{t(guide.title)}</div>
            <div className="text-white/80 text-sm">{t(guide.subtitle)}</div>
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
                  <p className="font-semibold text-gray-800 mb-0.5">{t(step.heading)}</p>
                )}
                <div className="flex gap-3">
                  {!step.heading && (
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                  )}
                  <p className={`text-gray-700 text-sm leading-relaxed ${step.heading ? 'ml-0' : ''}`}>
                    {t(step.text)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {guide.tips && guide.tips.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-semibold text-amber-800 text-sm mb-2">💡 {t('Tipy', 'Tips')}</p>
              <ul className="space-y-1.5">
                {guide.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-900">
                    <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    {t(tip)}
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
  const { t } = useLocale();
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const matches = (text: L10n | undefined) => !!text && t(text).toLowerCase().includes(q);
  const filtered = guides.filter(g =>
    q === '' ||
    matches(g.title) ||
    matches(g.subtitle) ||
    g.steps.some(s => matches(s.text) || matches(s.heading))
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('Nápověda', 'Help')}</h1>
        <p className="text-gray-500 mt-1">{t('Klikněte na téma, které vás zajímá, a zobrazí se podrobný návod.', 'Click a topic you\'re interested in to see a step-by-step guide.')}</p>
      </div>

      <div className="relative">
        <input
          type="search"
          placeholder={t('Hledat v nápovědě…', 'Search help…')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
        />
        <span className="absolute right-3 top-2.5 text-gray-400 text-lg">🔍</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">{t('Nic nenalezeno', 'Nothing found')}</p>
          <p className="text-sm mt-1">{t('Zkuste jiný výraz nebo projděte témata níže.', 'Try a different word or browse the topics below.')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(guide => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
        <p className="text-gray-700 font-medium">{t('Nenašli jste odpověď?', 'Couldn\'t find an answer?')}</p>
        <p className="text-gray-500 text-sm mt-1">
          {t('Obraťte se na svého učitele nebo napište správci na', 'Ask your teacher or email the administrator at')}{' '}
          <span className="font-mono text-blue-700 select-all">daasa.d@seznam.cz</span>
        </p>
      </div>
    </div>
  );
}
