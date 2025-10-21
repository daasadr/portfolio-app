# Online Portfolio pro Žáky ZŠ

Moderní webová aplikace pro online portfolio žáků základních škol, kteří studují formou individuálního studia z domova s portfoliovým přístupem.

## 🚀 Rychlý start

### 1. Nastavení Directus

Nejdříve nastav environment proměnné v `.env.local`:

```env
# Directus Configuration
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_ADMIN_TOKEN=your-admin-token

# Next.js Configuration  
NEXT_PUBLIC_DIRECTUS_URL=https://your-directus-instance.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Spuštění Directus setup scriptů

```bash
# Spusť setup script pro vytvoření kolekcí
node directus-setup.js

# Spusť seed script pro výchozí data
node directus-seed.js
```

### 3. Spuštění Next.js aplikace

```bash
# Instalace závislostí
npm install

# Spuštění development serveru
npm run dev
```

Aplikace bude dostupná na `http://localhost:3000`

## 📋 Funkce

### ✅ Implementované (MVP)
- **Autentizace** - Registrace a přihlášení žáků
- **Dashboard** - Přehled s rychlým přístupem ke všem funkcím
- **Osobní cíle** - Správa krátkodobých, dlouhodobých a celoživotních cílů
- **Seznam snů** - Modal okno pro dlouhodobé aspirace
- **Portfolio** - Základní seznam stránek portfolia
- **Kategorie** - Předdefinované a vlastní kategorie
- **Kalendář** - Měsíční pohled s denními záznamy
- **Sdílení** - Generování sdílecích odkazů s heslem
- **Veřejné zobrazení** - Zobrazení sdíleného portfolia

### 🔄 Plánované (Fáze 2)
- Strukturované šablony stránek
- Podkategorie
- Drag & drop řazení
- Flexibilní sdílení
- Vyhledávání

## 🛠 Technický stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI**: Shadcn/ui komponenty
- **Backend**: Directus (headless CMS)
- **Databáze**: PostgreSQL
- **Autentizace**: Directus Authentication

## 📁 Struktura projektu

```
portfolio-app/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Autentizační stránky
│   │   ├── dashboard/       # Hlavní aplikace
│   │   ├── shared/          # Veřejné zobrazení
│   │   └── api/            # API routes
│   ├── components/
│   │   ├── ui/             # Shadcn/ui komponenty
│   │   ├── layout/         # Layout komponenty
│   │   ├── portfolio/      # Portfolio komponenty
│   │   ├── calendar/       # Kalendář komponenty
│   │   └── goals/          # Cíle komponenty
│   ├── lib/
│   │   ├── directus.ts     # Directus klient
│   │   └── utils.ts        # Utility funkce
│   └── types/
│       └── index.ts        # TypeScript typy
├── directus-setup.js       # Setup script pro Directus
├── directus-seed.js        # Seed script pro výchozí data
└── env.example             # Příklad environment proměnných
```

## 🔧 Vývoj

### Přidání nové komponenty

```bash
# Přidání Shadcn/ui komponenty
npx shadcn@latest add [component-name]
```

### Spuštění testů

```bash
npm run test
```

### Build pro produkci

```bash
npm run build
npm start
```

## 📚 Dokumentace

- [Next.js dokumentace](https://nextjs.org/docs)
- [Directus dokumentace](https://docs.directus.io/)
- [Shadcn/ui dokumentace](https://ui.shadcn.com/)
- [Tailwind CSS dokumentace](https://tailwindcss.com/docs)

## 🤝 Přispívání

1. Forkujte projekt
2. Vytvořte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commitněte změny (`git commit -m 'Add some AmazingFeature'`)
4. Pushněte do branch (`git push origin feature/AmazingFeature`)
5. Otevřete Pull Request

## 📄 Licence

Tento projekt je licencován pod MIT licencí - viz soubor [LICENSE](LICENSE) pro detaily.

## 🆘 Podpora

Pokud máte problémy nebo otázky:

1. Zkontrolujte [Issues](https://github.com/your-repo/issues)
2. Vytvořte nový issue s popisem problému
3. Kontaktujte nás na email@example.com

---

**Vytvořeno s ❤️ pro žáky základních škol v roce 2025**