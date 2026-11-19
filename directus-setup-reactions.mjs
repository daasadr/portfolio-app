/**
 * Vytvoří v Directusu kolekci `page_reactions` (reakce 👍 ❤️ ⭐ 🏅 na stránky portfolia).
 * Bezpečné spustit opakovaně — co už existuje, přeskočí.
 *
 * Spuštění na serveru ve složce projektu (vedle .env):
 *   docker run --rm --network host -v "$PWD":/app -w /app node:22-alpine node directus-setup-reactions.mjs
 *
 * Aplikace k reakcím přistupuje jen přes vlastní API s admin tokenem, takže roli Student
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

const COLLECTION = 'page_reactions';

async function api(path, method = 'GET', body) {
  const res = await fetch(`${URL_}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json.data, error: json.errors?.[0]?.message };
}

console.log(`👍 Reakce na stránky — Directus ${URL_}\n`);

// Foreign keys must have the same type as the ids they point to (integer or uuid)
async function idType(collection) {
  const r = await api(`/fields/${collection}/id`);
  if (!r.ok) { console.error(`❌ Nepodařilo se načíst ${collection}.id: ${r.error ?? r.status}`); process.exit(1); }
  console.log(`ℹ️  ${collection}.id je typu ${r.data.type}`);
  return r.data.type;
}
const pageIdType = await idType('portfolio_pages');
const studentIdType = await idType('students');

const FIELDS = [
  {
    field: 'page_id', type: pageIdType,
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true, note: 'Stránka, na kterou se reaguje' },
    schema: { is_nullable: false },
  },
  {
    field: 'student_id', type: studentIdType,
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true, note: 'Kdo reagoval (učitel nebo propojený kontakt)' },
    schema: { is_nullable: false },
  },
  {
    field: 'type', type: 'string',
    meta: {
      interface: 'select-dropdown', required: true, note: 'Druh reakce',
      options: { choices: [
        { text: '👍 Palec nahoru', value: 'like' },
        { text: '❤️ Srdíčko', value: 'heart' },
        { text: '⭐ Hvězda', value: 'star' },
        { text: '🏅 Medaile', value: 'medal' },
      ] },
    },
    schema: { max_length: 16, is_nullable: false },
  },
  {
    field: 'date_created', type: 'timestamp',
    meta: { interface: 'datetime', special: ['date-created'], readonly: true, note: 'Kdy reagoval' },
  },
];

// 1) Kolekce
const existing = await api(`/collections/${COLLECTION}`);
if (existing.ok) {
  console.log(`✓ Kolekce ${COLLECTION} už existuje`);
} else {
  const created = await api('/collections', 'POST', {
    collection: COLLECTION,
    meta: { icon: 'favorite', note: 'Reakce na stránky portfolia', sort_field: null },
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

// 3) Vazby — smazáním stránky nebo účtu zmizí i reakce
for (const [field, related] of [['page_id', 'portfolio_pages'], ['student_id', 'students']]) {
  const rel = await api(`/relations/${COLLECTION}/${field}`);
  if (rel.ok && rel.data) { console.log(`✓ Vazba ${field} → ${related} už existuje`); continue; }
  const r = await api('/relations', 'POST', {
    collection: COLLECTION,
    field,
    related_collection: related,
    schema: { on_delete: 'CASCADE' },
  });
  if (!r.ok) { console.error(`❌ Vazbu ${field} se nepodařilo vytvořit: ${r.error ?? r.status}`); process.exit(1); }
  console.log(`✅ Vazba ${field} → ${related} vytvořena`);
}

console.log('\n🎉 Hotovo — reakce na stránky jsou připravené.');
