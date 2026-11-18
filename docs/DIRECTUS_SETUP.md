# Nastavení Directusu

Portfolio Paradise používá **Directus 11** jako backend. Directus běží zvlášť (na serveru na portu 8058,
zvenku nedostupný) a aplikace s ním mluví dvěma způsoby:

1. **Přes proxy `/api/directus/...`**: prohlížeč žáka posílá požadavky s jeho přihlášením. Proxy pustí
   jen kolekce ze seznamu níže a odmítne zápis pod cizí `student_id`. Tady platí **oprávnění role Student**.
2. **Přes vlastní API routy s admin tokenem** (`DIRECTUS_ADMIN_TOKEN`): server sám ověří, kdo je
   přihlášený, a `student_id` doplní z přihlášení. Tady se oprávnění role Student neuplatní.

## Admin token

Directus → **Settings → Users** → uživatel s rolí Administrator → pole **Token** → vygenerovat a uložit.
Token patří do `.env` jako `DIRECTUS_ADMIN_TOKEN`. Nikdy ho nedávej do proměnné začínající `NEXT_PUBLIC_`.

## Kolekce

| Kolekce | Co obsahuje | Přístup |
|---|---|---|
| `students` | Profil žáka/učitele (jméno, e-mail, role, bezpečnostní otázka) | server |
| `portfolio_pages` | Stránky portfolia | proxy |
| `categories` | Kategorie portfolia | proxy |
| `personal_goals` | Osobní cíle | proxy |
| `dreams`, `dreams_directus_files` | Sny a jejich obrázky | proxy |
| `dream_board_items` | Rozmístění obrázků na nástěnce snů | proxy |
| `calendar_entries` | Kalendář | proxy |
| `shared_links` | Sdílecí odkazy | proxy |
| `directus_files` | Nahrané obrázky a přílohy | proxy (nahrání), čtení přes `/api/asset/[id]` |
| `page_templates` | Šablony stránek (zatím se nepoužívají) | — |
| `reading_diary` | Čtenářský deník | server |
| `user_badges` | Průběh bobříků | server |
| `student_connections` | Propojení žák–učitel | server |
| `page_shares` | Sdílení stránky jinému uživateli | server |
| `organisations`, `organisation_members`, `groups`, `group_members` | Komunita | server |

Odznaky za aktivitu žádnou kolekci nemají, počítají se z ostatních dat.

### Nová instalace

Starší skripty `directus-setup.js`, `directus-setup-full.js` a `directus-seed.js` **nevytvoří všechny
kolekce**, které aplikace dnes používá (chybí např. bobříci, propojení, komunita, nástěnka snů). Produkční
schéma je proto jediný úplný zdroj. Pro novou instalaci doporučujeme z produkce udělat snapshot schématu
(`npx directus schema snapshot ./schema.yaml`) a na novém serveru ho použít (`npx directus schema apply`).

Doplňující skripty pro novější části (opakované spuštění nevadí, co existuje, přeskočí):

```bash
# Čtenářský deník (kolekce reading_diary)
docker run --rm --network host -v "$PWD":/app -w /app node:22-alpine node directus-setup-reading-diary.mjs
# Vlastní bezpečnostní otázka (pole students.security_question_text)
docker run --rm --network host -v "$PWD":/app -w /app node:22-alpine node directus-setup-custom-question.mjs
```

> **Pozor na chybějící pole.** Když aplikace pošle pole, které v kolekci neexistuje, Directus ho
> **u administrátora tiše ignoruje**, ale **žákovi vrátí chybu** „kolekce neexistuje nebo k ní nemáte
> přístup“. Učitelský účet s administrátorskou rolí pak funguje a žákovský ne. Při podobné chybě nejdřív
> porovnej pole, která aplikace posílá, se seznamem polí kolekce:
> `curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" "$DIRECTUS_URL/fields/<kolekce>" | grep -o '"field":"[^"]*"'`

## Role Student a její oprávnění

Directus 11 přiděluje oprávnění přes **Access Policies**. Nastavení: **Settings → Access Policies → Student**
a v **Settings → User Roles → Student** musí být tato policy připojená. ID role patří do
`DIRECTUS_STUDENT_ROLE_ID`, nové registrace ji dostanou automaticky. **App Access** (přístup do
administrace Directusu) má být u role Student **vypnutý**.

Policy potřebuje jen kolekce, ke kterým se jde přes proxy, a vždy jen vlastní záznamy:

| Kolekce | Create | Read | Update | Delete | Filtr „vlastní“ |
|---|---|---|---|---|---|
| `portfolio_pages` | ✅ | vlastní | vlastní | vlastní | `student_id.user_id = $CURRENT_USER` |
| `categories` | ✅ | vlastní | vlastní | vlastní | `student_id.user_id = $CURRENT_USER` |
| `personal_goals` | ✅ | vlastní | vlastní | vlastní | `student_id.user_id = $CURRENT_USER` |
| `dreams` | ✅ | vlastní | vlastní | vlastní | `student_id.user_id = $CURRENT_USER` |
| `dreams_directus_files` | ✅ | ✅ | ✅ | ✅ | vazební tabulka, zapisuje se spolu se snem |
| `dream_board_items` | ✅ | vlastní | vlastní | vlastní | `student_id.user_id = $CURRENT_USER` |
| `calendar_entries` | ✅ | vlastní | vlastní | vlastní | `student_id.user_id = $CURRENT_USER` |
| `shared_links` | ✅ | vlastní | vlastní | vlastní | `student_id.user_id = $CURRENT_USER` |
| `directus_files` | ✅ | vlastní | ❌ | ❌ | `uploaded_by = $CURRENT_USER` |

**Kolekce spravované serverem** (`students`, `reading_diary`, `user_badges`, `student_connections`,
`page_shares`, komunita) **roli Student nepotřebují vůbec**. Proxy je do prohlížeče nepustí, takže
oprávnění na ně nic nepřidávají. Doporučujeme je z policy odebrat, aby žák neměl přístup navíc, kdyby
se Directus někdy omylem dostal ven.

## Bezpečnost serveru

- Port Directusu (8058) a aplikace (3004) jsou dostupné jen z `localhost`, ven vede jen nginx.
  Ověření zvenku: `nc -zv portfolioparadise.eu 8058` musí selhat.
- Doporučené proměnné Directusu: `FILES_MAX_UPLOAD_SIZE` (např. `30mb`, aplikace víc nedovolí),
  `FILES_MIME_TYPE_ALLOW_LIST` (obrázky, video, zvuk, PDF a kancelářské dokumenty) a `RATE_LIMITER_ENABLED=true`.
- Pravidelné zálohy databáze i složky s nahranými soubory, uložené mimo server.

## Řešení problémů

| Příznak | Příčina |
|---|---|
| Žákovi nejde uložit, učiteli ano | Chybí pole v kolekci (viz výše), nebo chybí oprávnění v policy Student |
| Všechno selhává jen u jednoho účtu | Uživatel nemá roli Student (Settings → Users → Role) |
| Server API vrací 401/500 | Neplatný nebo chybějící `DIRECTUS_ADMIN_TOKEN` |
| Nahrání souboru selže | `directus_files` bez Create v policy, nebo limit `FILES_MAX_UPLOAD_SIZE` |
