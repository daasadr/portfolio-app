# Portfolio Paradise

Online portfolio pro děti, které se vzdělávají doma (individuální vzdělávání), a pro jejich rodiče
a učitele. Žák si do portfolia zapisuje, co se naučil a co vytvořil, a sdílí to s tím, s kým chce.

Běží na **https://portfolioparadise.eu**. Aplikace je česky i anglicky (přepínač CZ/EN).

## Co aplikace umí

**Pro žáky**
- **Portfolio**: stránky s formátovaným textem, obrázky, videem, zvukem a přílohami, řazené do kategorií
  s vlastními barvami a pozadím. Každá stránka je soukromá, nebo sdílená.
- **Čtenářský deník**: přečtené knihy jako hromádka knížek. Každý zápis má obsah, názor a poznámky
  a žák si u každé knihy vybere, jestli ji uvidí učitel.
- **Osobní cíle a sny**: krátkodobé, dlouhodobé a celoživotní cíle, sny s obrázky a **nástěnka snů**.
- **Kalendář**: plány, události, termíny a reflexe po dnech.
- **Světoběžník a bobříci**: sedmidenní výzvy (pomáhání doma, dělání radosti, péče o přírodu)
  s oslavou a pochvalou při splnění.
- **Odznaky za aktivitu**: přibývají pod menu za stránky portfolia, knihy, splněné cíle, bobříky,
  záznamy v kalendáři, sny a ocenění od ostatních.
- **Průběžné ukládání**: rozepsaný text se ukládá v prohlížeči, takže nezmizí po obnovení stránky.
- **Export dat** (HTML nebo soubory v ZIPu) a smazání účtu se všemi daty.

**Sdílení a spolupráce**
- **Sdílecí odkazy**: celé portfolio, kategorie nebo jedna stránka. Soukromé stránky přes odkaz vidět nejsou.
- **Propojení s učitelem**: učitel vidí jen sdílené stránky a knihy, které mu žák ukáže.
- **Ocenění stránek**: učitel může stránce dát 👍 ❤️ ⭐ 🏅. Žák to uvidí na Přehledu a u stránky
  i s tím, kdo reakci dal.
- **Komunita**: organizace a skupiny (např. komunitní škola, kroužek).

**Pro správce**: stránka `/dasa` (přehled uživatelů, jen pro e-maily v `ADMIN_EMAILS`).

## Technologie

- **Next.js 15** (App Router), **React 19**, TypeScript, Tailwind CSS 4, shadcn/ui (Radix)
- **TipTap 3** pro editor stránek
- **Directus 11** jako backend (databáze, soubory, uživatelé), běží zvlášť na serveru
- **Docker** (síť `host`, port 3004) za nginx

### Jak to drží pohromadě

- **Přihlášení** přes Directus. Tokeny jsou v HttpOnly cookies (`pp_token`, `pp_refresh`) a middleware
  je včas obnovuje.
- **Prohlížeč s Directusem nemluví přímo.** Jde přes proxy `/api/directus/...`, která pustí jen vyjmenované
  kolekce a každého žáka omezí na jeho vlastní záznamy a soubory.
- **Citlivější části** (čtenářský deník, bobříci, propojení s učiteli, sdílení, export, odznaky) běží přes
  vlastní API routy s admin tokenem. `student_id` berou vždy z přihlášení, nikdy od klienta.
- **Dva jazyky**: každý text je v kódu jako dvojice `t('česky', 'English')`. Viz [docs/I18N.md](docs/I18N.md).

## Spuštění pro vývoj

```bash
cp env.example .env      # a doplň hodnoty
npm install
npm run dev              # http://localhost:3000
```

### Proměnné prostředí

| Proměnná | K čemu |
|---|---|
| `DIRECTUS_URL` | Adresa Directusu pro server (např. `http://localhost:8058`) |
| `DIRECTUS_ADMIN_TOKEN` | Statický token administrátora, používají ho serverové API routy |
| `NEXT_PUBLIC_DIRECTUS_URL` | Adresa Directusu známá při buildu |
| `NEXT_PUBLIC_APP_URL` | Veřejná adresa aplikace (sdílecí odkazy) |
| `DIRECTUS_STUDENT_ROLE_ID` | ID role Student v Directusu (nové účty) |
| `ADMIN_EMAILS` | E-maily s přístupem na `/dasa`, oddělené čárkou |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Kontakt na správce zobrazený u obnovy hesla |

## Nasazení

Na serveru ve složce projektu:

```bash
./deploy.sh              # stáhne změny, sestaví Docker image, spustí a ověří, že aplikace odpovídá
```

`deploy.sh` si před nasazením uloží předchozí image, takže jde vrátit (příkaz vypíše na konci).
Porty Directusu (8058) a aplikace (3004) nejsou zvenku dostupné, ven jde jen nginx. Pozor: nginx
publikuje Directus na `api.portfolioparadise.eu`, viz bezpečnost v [docs/DIRECTUS_SETUP.md](docs/DIRECTUS_SETUP.md).

**Jednorázové skripty pro Directus** (spouštějí se jednou, opakované spuštění nevadí):

```bash
docker run --rm --network host -v "$PWD":/app -w /app node:22-alpine node directus-setup-reading-diary.mjs
docker run --rm --network host -v "$PWD":/app -w /app node:22-alpine node directus-setup-custom-question.mjs
docker run --rm --network host -v "$PWD":/app -w /app node:22-alpine node directus-setup-reactions.mjs
```

Nastavení Directusu (kolekce, oprávnění) popisuje [docs/DIRECTUS_SETUP.md](docs/DIRECTUS_SETUP.md).

## Dokumentace

- [docs/ROADMAP.md](docs/ROADMAP.md): plány, mimo jiné celosvětová výměna mezi dětmi na domácím vzdělávání
- [docs/DIRECTUS_SETUP.md](docs/DIRECTUS_SETUP.md): kolekce, oprávnění a bezpečnostní nastavení Directusu
- [docs/I18N.md](docs/I18N.md): jak fungují dva jazyky a jak psát nové texty
- [CONTRIBUTING.md](CONTRIBUTING.md): jak přispět

## Licence a kontakt

MIT, viz [LICENSE](LICENSE). Kontakt: daasa.d@seznam.cz

Vytvořeno s ❤️ pro děti na domácím vzdělávání.
