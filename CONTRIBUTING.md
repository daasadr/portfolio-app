# Jak přispět do projektu

Děkujeme za zájem o Portfolio Paradise! 🎉 Aplikaci používají děti, proto má přednost bezpečnost
a srozumitelnost před novými funkcemi.

## Jak začít

1. Forkněte repozitář a vytvořte novou větev (`git checkout -b feature/nazev-zmeny`)
2. Spusťte aplikaci podle [README](README.md)
3. Proveďte změny a ověřte je (`npx tsc --noEmit` a `npm run build` musí projít)
4. Otevřete Pull Request s popisem, co a proč se mění

## Pravidla

- **TypeScript** všude, kód ať odpovídá okolnímu stylu.
- **Každý text pro uživatele ve dvou jazycích**: `t('česky', 'English')`. Podrobnosti v [docs/I18N.md](docs/I18N.md).
- **Bezpečnost dat žáků:**
  - nová data se čtou a zapisují přes serverové API routy (`src/app/api/...`) s admin tokenem;
  - `student_id` se vždy bere z přihlášení, nikdy z požadavku;
  - ID z URL ověřujte (`isValidId`);
  - soukromé věci nesmí být vidět přes sdílení ani u učitele.
- **Nová pole v Directusu** přidávejte skriptem (vzor: `directus-setup-reading-diary.mjs`) a popište
  je v [docs/DIRECTUS_SETUP.md](docs/DIRECTUS_SETUP.md). Chybějící pole se projeví jen u žákovských účtů.
- Když se mění, jaké údaje aplikace zpracovává, aktualizujte i zásady ochrany osobních údajů
  (`src/app/privacy/page.tsx`).

## Commit zprávy

Jasně a popisně, co se změnilo:
- ✅ `Fix calendar navigation bug`
- ✅ `feat(reading-diary): share chosen books with teacher`
- ❌ `Update stuff`

## Hlášení chyb a nápady

Vytvořte issue nebo napište na daasa.d@seznam.cz:
- popis problému a kroky, jak ho vyvolat,
- co jste čekali, že se stane,
- snímek obrazovky, pokud pomůže,
- jazyk aplikace a zda jde o účet žáka, nebo učitele.

Plány projektu jsou v [docs/ROADMAP.md](docs/ROADMAP.md). Děkujeme! 💙
