# Directus Setup Guide

Tento průvodce ti pomůže nastavit Directus backend pro Portfolio aplikaci.

## Předpoklady

- Běžící Directus instance (lokální nebo cloud)
- Node.js 18+ nainstalovaný
- Admin přístup do Directus

## Krok 1: Příprava environment proměnných

Vytvoř soubor `.env.local` v root složce projektu:

```env
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_ADMIN_TOKEN=your-admin-token
NEXT_PUBLIC_DIRECTUS_URL=https://your-directus-instance.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Jak získat Admin Token

1. Přihlaš se do Directus Admin rozhraní
2. Jdi na **Settings → Access Tokens**
3. Klikni na **Create Token**
4. Nastav:
   - Name: `Portfolio Setup Token`
   - Role: `Administrator`
   - No Expiration: `checked`
5. Zkopíruj vygenerovaný token do `.env.local`

## Krok 2: Vytvoření kolekcí

Spusť setup script pro vytvoření všech potřebných kolekcí:

```bash
node directus-setup.js
```

Tento script vytvoří:
- ✅ 8 hlavních kolekcí
- ✅ 1 junction tabulku
- ✅ Všechny relace mezi kolekcemi
- ✅ Validace a defaultní hodnoty

## Krok 3: Seed data

Přidej výchozí šablony a kategorie:

```bash
node directus-seed.js
```

Tento script přidá:
- ✅ 4 šablony stránek (Volná forma, Pracovní list, Projekt, Reflexe)
- ✅ Informace o předdefinovaných kategoriích

## Krok 4: Nastavení oprávnění

V Directus admin rozhraní nastav oprávnění pro roli "Student":

### Vytvoření role Student

1. Jdi na **Settings → Roles & Permissions**
2. Klikni **Create Role**
3. Nastav:
   - Name: `Student`
   - Icon: `school`
   - App Access: `enabled`

### Nastavení oprávnění

Pro každou kolekci nastav:

| Kolekce | Vytvoření | Čtení | Aktualizace | Mazání |
|---------|-----------|-------|-------------|---------|
| students | ❌ | Pouze vlastní¹ | Pouze vlastní¹ | ❌ |
| personal_goals | ✅ | Pouze vlastní² | Pouze vlastní² | Pouze vlastní² |
| dreams | ✅ | Pouze vlastní² | Pouze vlastní² | Pouze vlastní² |
| categories | ✅ | Pouze vlastní² | Pouze vlastní² | Pouze vlastní² |
| portfolio_pages | ✅ | Pouze vlastní² | Pouze vlastní² | Pouze vlastní² |
| calendar_entries | ✅ | Pouze vlastní² | Pouze vlastní² | Pouze vlastní² |
| shared_links | ✅ | Pouze vlastní² | Pouze vlastní² | Pouze vlastní² |
| page_templates | ❌ | ✅ Všechny | ❌ | ❌ |
| directus_files | ✅ | Pouze vlastní³ | Pouze vlastní³ | Pouze vlastní³ |

**Poznámky:**
1. Pouze vlastní = `user_id = $CURRENT_USER`
2. Pouze vlastní = `student_id.user_id = $CURRENT_USER`
3. Pouze vlastní = `uploaded_by = $CURRENT_USER`

### Jak nastavit filtry

Pro každou kolekci:
1. Klikni na ikonu filtru u oprávnění
2. Přidej filtr podle poznámek výše

**Příklad pro personal_goals:**
```
student_id.user_id._eq: $CURRENT_USER
```

## Krok 5: Testování

1. Spusť Next.js aplikaci: `npm run dev`
2. Otevři http://localhost:3000
3. Zaregistruj testovacího uživatele
4. Zkontroluj, že se vytvoří profil žáka a kategorie

## Řešení problémů

### Chyba: Connection refused
- Zkontroluj, že Directus instance běží
- Ověř, že URL v `.env.local` je správná

### Chyba: Unauthorized
- Zkontroluj Admin Token
- Ověř, že token má správná oprávnění

### Kolekce se nevytvořily
- Zkontroluj konzoli pro error zprávy
- Ověř, že admin token je platný
- Zkus spustit script znovu

## Další kroky

Po úspěšném setup můžeš:
- ✅ Začít používat aplikaci
- ✅ Přidat vlastní šablony stránek
- ✅ Upravit předdefinované kategorie
- ✅ Nastavit notifikace a workflow

---

**Potřebuješ pomoc?** Otevři issue na GitHubu!
