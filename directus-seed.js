/**
 * Directus Seed Data Script
 * 
 * Tento script přidá výchozí šablony stránek a předdefinované kategorie.
 * Spusť ho po dokončení directus-setup.js
 * 
 * Použití: node directus-seed.js
 */

import { createDirectus, rest, createItems } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!DIRECTUS_ADMIN_TOKEN) {
  console.error('❌ Chyba: DIRECTUS_ADMIN_TOKEN není nastavený!');
  process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with({
    onRequest: (options) => ({
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
      },
    }),
  });

// Výchozí šablony stránek
const defaultTemplates = [
  {
    name: 'Volná forma',
    description: 'Prázdná stránka pro libovolný obsah - text, obrázky, videa.',
    template_type: 'free_form',
    structure_schema: null,
    is_active: true,
  },
  {
    name: 'Pracovní list',
    description: 'Šablona pro dokončené pracovní listy s místem na zadání a řešení.',
    template_type: 'work_sheet',
    structure_schema: {
      fields: [
        {
          name: 'subject',
          label: 'Předmět',
          type: 'text',
          required: true,
        },
        {
          name: 'topic',
          label: 'Téma',
          type: 'text',
          required: true,
        },
        {
          name: 'assignment',
          label: 'Zadání',
          type: 'textarea',
          required: false,
        },
        {
          name: 'solution',
          label: 'Moje řešení',
          type: 'textarea',
          required: false,
        },
        {
          name: 'reflection',
          label: 'Co jsem se naučil/a',
          type: 'textarea',
          required: false,
        },
      ],
    },
    is_active: true,
  },
  {
    name: 'Projekt',
    description: 'Šablona pro komplexní projekty s popisem, postupem a výsledky.',
    template_type: 'project',
    structure_schema: {
      fields: [
        {
          name: 'project_name',
          label: 'Název projektu',
          type: 'text',
          required: true,
        },
        {
          name: 'goal',
          label: 'Cíl projektu',
          type: 'textarea',
          required: true,
        },
        {
          name: 'duration',
          label: 'Doba realizace',
          type: 'text',
          required: false,
        },
        {
          name: 'process',
          label: 'Jak jsem postupoval/a',
          type: 'textarea',
          required: false,
        },
        {
          name: 'results',
          label: 'Výsledky',
          type: 'textarea',
          required: false,
        },
        {
          name: 'challenges',
          label: 'Výzvy a problémy',
          type: 'textarea',
          required: false,
        },
        {
          name: 'learned',
          label: 'Co jsem se naučil/a',
          type: 'textarea',
          required: false,
        },
      ],
    },
    is_active: true,
  },
  {
    name: 'Reflexe',
    description: 'Šablona pro zamyšlení nad prací, pokrokem nebo zkušeností.',
    template_type: 'reflection',
    structure_schema: {
      fields: [
        {
          name: 'activity',
          label: 'Aktivita/téma',
          type: 'text',
          required: true,
        },
        {
          name: 'what_happened',
          label: 'Co se stalo',
          type: 'textarea',
          required: false,
        },
        {
          name: 'feelings',
          label: 'Jak jsem se cítil/a',
          type: 'textarea',
          required: false,
        },
        {
          name: 'learned',
          label: 'Co jsem zjistil/a',
          type: 'textarea',
          required: false,
        },
        {
          name: 'next_steps',
          label: 'Co budu dělat příště',
          type: 'textarea',
          required: false,
        },
      ],
    },
    is_active: true,
  },
];

// Předdefinované kategorie (bez student_id - ty se vytvoří až při registraci žáka)
// Tyto kategorie slouží jako vzor pro vytvoření kategorií u každého nového žáka
const predefinedCategories = [
  { name: 'Matematika', is_predefined: true, sort_order: 1 },
  { name: 'Čeština', is_predefined: true, sort_order: 2 },
  { name: 'Angličtina', is_predefined: true, sort_order: 3 },
  { name: 'Přírodověda', is_predefined: true, sort_order: 4 },
  { name: 'Dějepis', is_predefined: true, sort_order: 5 },
  { name: 'Zeměpis', is_predefined: true, sort_order: 6 },
  { name: 'Umění', is_predefined: true, sort_order: 7 },
  { name: 'Hudba', is_predefined: true, sort_order: 8 },
  { name: 'Tělesná výchova', is_predefined: true, sort_order: 9 },
  { name: 'Projekty', is_predefined: true, sort_order: 10 },
  { name: 'Výlety a události', is_predefined: true, sort_order: 11 },
  { name: 'Ostatní', is_predefined: true, sort_order: 12 },
];

async function seedData() {
  console.log('🌱 Začínám přidávat výchozí data...\n');

  // Přidání šablon
  try {
    console.log('📝 Přidávám šablony stránek...');
    await directus.request(createItems('page_templates', defaultTemplates));
    console.log(`  ✅ Přidáno ${defaultTemplates.length} šablon\n`);
  } catch (error) {
    console.error('  ❌ Chyba při přidávání šablon:', error.message);
  }

  // Poznámka o kategoriích
  console.log('📋 Informace o kategoriích:');
  console.log('  ℹ️  Předdefinované kategorie se automaticky vytvoří pro každého žáka');
  console.log('  ℹ️  při registraci pomocí onboarding logiky ve frontend aplikaci.');
  console.log('  ℹ️  Seznam kategorií k vytvoření:');
  predefinedCategories.forEach((cat) => {
    console.log(`      - ${cat.name}`);
  });
  console.log('');

  console.log('✅ Seed data připravena!\n');
  console.log('📋 Další kroky:');
  console.log('   1. V Next.js aplikaci vytvoř onboarding flow');
  console.log('   2. Při první registraci žáka automaticky vytvoř jeho kategorie');
  console.log('   3. Použij tento seznam kategorií:');
  console.log('');
  console.log('export const PREDEFINED_CATEGORIES = [');
  predefinedCategories.forEach((cat) => {
    console.log(`  { name: '${cat.name}', sort_order: ${cat.sort_order} },`);
  });
  console.log('];\n');
}

// Export pro použití v Next.js aplikaci
export const PREDEFINED_CATEGORIES = predefinedCategories.map(cat => ({
  name: cat.name,
  sort_order: cat.sort_order,
}));

// Spuštění seedu
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => {
      console.log('🎉 Hotovo!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Chyba během seedu:', error);
      process.exit(1);
    });
}