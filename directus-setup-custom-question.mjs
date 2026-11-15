/**
 * Přidá do kolekce `students` pole `security_question_text` pro vlastní bezpečnostní otázku.
 * Bezpečné spustit opakovaně — když pole už existuje, nic nedělá.
 *
 * Spuštění na serveru ve složce projektu (vedle .env):
 *   docker run --rm --network host -v "$PWD":/app -w /app node:22-alpine node directus-setup-custom-question.mjs
 *
 * Aplikace pole čte a zapisuje jen přes vlastní API s admin tokenem, roli Student
 * NENÍ potřeba nic povolovat.
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

async function api(path, method = 'GET', body) {
  const res = await fetch(`${URL_}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json.data, error: json.errors?.[0]?.message };
}

console.log(`🔐 Vlastní bezpečnostní otázka — Directus ${URL_}\n`);

const existing = await api('/fields/students/security_question_text');
if (existing.ok) {
  console.log('✓ Pole students.security_question_text už existuje');
} else {
  const r = await api('/fields/students', 'POST', {
    field: 'security_question_text',
    type: 'string',
    meta: { interface: 'input', note: 'Vlastní bezpečnostní otázka (když security_question = 100)' },
    schema: { max_length: 200, is_nullable: true },
  });
  if (!r.ok) { console.error(`❌ Pole se nepodařilo přidat: ${r.error ?? r.status}`); process.exit(1); }
  console.log('✅ Pole students.security_question_text přidáno');
}

console.log('\n🎉 Hotovo — aplikace si pole najde sama, nic dalšího není potřeba.');
