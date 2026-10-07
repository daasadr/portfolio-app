/**
 * Vytvoří v Directusu kolekci `reading_diary` (Čtenářský deník).
 * Bezpečné spustit opakovaně — co už existuje, přeskočí.
 *
 * Spuštění na serveru ve složce projektu (vedle .env):
 *   node directus-setup-reading-diary.mjs
 * nebo bez Node na serveru:
 *   docker run --rm --network host -v "$PWD":/app -w /app node:22-alpine node directus-setup-reading-diary.mjs
 *
 * Aplikace k deníku přistupuje jen přes vlastní API s admin tokenem, takže roli Student
 * NENÍ potřeba dávat na tuto kolekci žádná oprávnění.
 */

import { readFileSync } from 'node:fs';

// Minimal .env reader — no dependencies needed
function loadEnv(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch { /* .env is optional when variables are already set */ }
}
loadEnv(new URL('./.env', import.meta.url));

const URL_ = (process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN?.trim();
if (!URL_ || !TOKEN) {
  console.error('❌ Chybí DIRECTUS_URL nebo DIRECTUS_ADMIN_TOKEN (v .env nebo v prostředí).');
  process.exit(1);
}

const COLLECTION = 'reading_diary';

async function api(path, method = 'GET', body) {
  const res = await fetch(`${URL_}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json.data, error: json.errors?.[0]?.message };
}

console.log(`📚 Čtenářský deník — Directus ${URL_}\n`);

// students.id může být integer i uuid — student_id musí mít stejný typ
const sid = await api('/fields/students/id');
if (!sid.ok) {
  console.error(`❌ Nepodařilo se načíst students.id: ${sid.error ?? sid.status}`);
  process.exit(1);
}
const studentIdType = sid.data.type;
console.log(`ℹ️  students.id je typu ${studentIdType}`);

const FIELDS = [
  {
    field: 'student_id', type: studentIdType,
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true, note: 'Žák, kterému záznam patří' },
    schema: { is_nullable: false },
  },
  { field: 'title', type: 'string', meta: { interface: 'input', required: true, note: 'Název knihy' }, schema: { max_length: 200, is_nullable: false } },
  { field: 'author', type: 'string', meta: { interface: 'input', note: 'Autor' }, schema: { max_length: 200 } },
  { field: 'summary', type: 'text', meta: { interface: 'input-multiline', note: 'Stručný obsah' } },
  { field: 'opinion', type: 'text', meta: { interface: 'input-multiline', note: 'Můj názor' } },
  { field: 'notes', type: 'text', meta: { interface: 'input-multiline', note: 'Poznámky' } },
  {
    field: 'date_created', type: 'timestamp',
    meta: { interface: 'datetime', special: ['date-created'], readonly: true, note: 'Datum zápisu' },
  },
];

// 1) Kolekce
const existing = await api(`/collections/${COLLECTION}`);
if (existing.ok) {
  console.log(`✓ Kolekce ${COLLECTION} už existuje`);
} else {
  const created = await api('/collections', 'POST', {
    collection: COLLECTION,
    meta: { icon: 'menu_book', note: 'Čtenářský deník žáků', sort_field: null },
    schema: {},
    fields: [
      {
        field: 'id', type: 'integer',
        meta: { hidden: true, readonly: true, interface: 'input' },
        schema: { is_primary_key: true, has_auto_increment: true },
      },
    ],
  });
  if (!created.ok) {
    console.error(`❌ Kolekci se nepodařilo vytvořit: ${created.error ?? created.status}`);
    process.exit(1);
  }
  console.log(`✅ Kolekce ${COLLECTION} vytvořena`);
}

// 2) Pole (jen chybějící)
const current = await api(`/fields/${COLLECTION}`);
const have = new Set((current.data ?? []).map(f => f.field));
for (const f of FIELDS) {
  if (have.has(f.field)) { console.log(`✓ Pole ${f.field} už existuje`); continue; }
  const r = await api(`/fields/${COLLECTION}`, 'POST', f);
  if (!r.ok) { console.error(`❌ Pole ${f.field}: ${r.error ?? r.status}`); process.exit(1); }
  console.log(`✅ Pole ${f.field} přidáno`);
}

// 3) Vazba na žáka — při smazání žáka zmizí i jeho deník
const rel = await api(`/relations/${COLLECTION}/student_id`);
if (rel.ok && rel.data) {
  console.log('✓ Vazba student_id → students už existuje');
} else {
  const r = await api('/relations', 'POST', {
    collection: COLLECTION,
    field: 'student_id',
    related_collection: 'students',
    schema: { on_delete: 'CASCADE' },
  });
  if (!r.ok) { console.error(`❌ Vazbu se nepodařilo vytvořit: ${r.error ?? r.status}`); process.exit(1); }
  console.log('✅ Vazba student_id → students vytvořena');
}

console.log('\n🎉 Hotovo — Čtenářský deník je připravený.');
