# Plány a vize

Portfolio Paradise vzniklo pro děti, které se vzdělávají doma (individuální vzdělávání), a jejich rodiny.
Tento dokument shrnuje, kam chceme projekt posouvat. Hotové věci jsou v [README](../README.md).

## Velká vize: spolužáci z celého světa 🌍

Děti na domácím vzdělávání často nemají spolužáky. Chceme, aby jimi mohly být navzájem: každé dítě,
které se zapojí, má za spolužáky všechny ostatní zapojené děti na domácím vzdělávání, ať žijí ve stejném
městě, nebo na druhém konci světa.

Základem je **jazyková a kulturní výměna** mezi dětmi na domácím vzdělávání. Děti si mohou psát, vyprávět
si o místě, kde žijí, o svém jazyce, zvycích, přírodě, jídle, o tom, co se zrovna učí, a tím se navzájem
vzdělávat. Klasická výměna dopisních přátel, jen hlavně mezi dětmi vzdělávanými doma.

Dvojjazyčná aplikace (česky / anglicky, od listopadu 2026) je prvním krokem: odstraňuje jazykovou bariéru
pro zahraniční rodiny.

### Plánované části

1. **Burza kontaktů.** Kdo by si rád psal s jiným dítětem na domácím vzdělávání, přihlásí se.
   - Krátký profil: křestní jméno nebo přezdívka, věk (rozmezí), země, jazyky, které umí nebo se učí, a zájmy.
   - Filtry: stejná země, nebo naopak jiná země, jazyk, který si chce procvičit, věková skupina, společné zájmy.
   - Účast je dobrovolná a jde kdykoli zrušit.
2. **Soukromé zprávy** mezi propojenými dětmi.
3. **Výměnné projekty.** Například „Moje město“, „Co jíme k snídani“, „Svátky u nás doma“: obě děti
   vytvoří stránku portfolia na stejné téma a vymění si je. Navazuje to na stávající sdílení stránek.
4. Další nápady k rozvážení: společné výzvy pro děti z různých zemí (jako bobříci), skupinové
   „třídy“ podle zájmů, pomoc s překladem zpráv.

### Zásady, bez kterých to nespustíme

Jde o komunikaci dětí s cizími lidmi. Bezpečnost má přednost před pohodlím:

- **Rodič dává souhlas.** Zapojení do burzy i každé nové propojení potvrzuje rodič nebo zákonný
  zástupce. Rodič má přehled, s kým dítě komunikuje.
- **Žádné osobní údaje navenek.** Profil v burze neukazuje příjmení, e-mail, adresu, školu ani fotku
  obličeje. Aplikace upozorní, když dítě do zprávy píše telefon, adresu nebo e-mail.
- **Věkové skupiny.** Děti si mohou psát jen s dětmi podobného věku, dospělí účty (učitelé) se do burzy
  pro děti nezapojují.
- **Nahlásit a zablokovat** jde jedním kliknutím u každé konverzace. Hlášení vyřizuje správce.
- **Moderace a ochrana.** Ověřování nových účtů v burze, limity na počet nových kontaktů, filtr
  nevhodného obsahu.
- **GDPR pro děti z více zemí.** Před spuštěním aktualizovat zásady ochrany osobních údajů (nová data:
  profil v burze, zprávy) a promyslet věkové hranice souhlasu v různých zemích EU i mimo ni.
- Technicky: zprávy a kontakty jen přes serverové API (jako čtenářský deník), nikdy přímým
  přístupem k databázi z prohlížeče.

Postup: nejdřív burza kontaktů a výměna stránek portfolia (bez volného psaní), potom zprávy pro
propojené děti se souhlasem rodičů, nakonec další funkce podle zpětné vazby.

## Menší plány a nápady

- **Tlačítko pro zpětnou vazbu** přímo v aplikaci. Aplikace se šíří mezi rodinami na domácím
  vzdělávání a jejich postřehy jsou nejcennější vodítko.
- **Zálohy** databáze a nahraných souborů (pravidelné, mimo server) a otestovaná obnova.
- **Limity nahrávání v Directusu:** `FILES_MAX_UPLOAD_SIZE`, `FILES_MIME_TYPE_ALLOW_LIST`, `RATE_LIMITER_ENABLED`.
- **Ukládání portfolia přes serverové API** (jako čtenářský deník), aby aplikace nezávisela na
  oprávněních role Student v Directusu.
- **Snapshot schématu Directusu** (`npx directus schema snapshot`) uložený v repozitáři, aby šla nová
  instalace postavit jedním příkazem. Staré instalační skripty už všechny kolekce nevytvoří.
- Další bobříci a další úrovně odznaků za aktivitu.
- Původně plánované: strukturované šablony stránek, podkategorie, řazení přetažením, vyhledávání.
