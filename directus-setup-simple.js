/**
 * Directus Setup Script pro Online Portfolio
 * Spusť: node directus-setup-simple.js
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Získej aktuální adresář a explicitně načti .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL?.trim();
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN?.trim();

if (!DIRECTUS_ADMIN_TOKEN) {
  console.error('❌ Chyba: DIRECTUS_ADMIN_TOKEN není nastavený!');
  console.error('💡 Zkontroluj .env soubor v portfolio-app složce');
  process.exit(1);
}

console.log('🚀 Začínám setup Directus...\n');
console.log(`📡 URL: ${DIRECTUS_URL}`);
console.log(`🔑 Token délka: ${DIRECTUS_ADMIN_TOKEN.length} znaků`);
console.log(`🔑 Token: ${DIRECTUS_ADMIN_TOKEN.substring(0, 10)}...\n`);

// Helper pro API requesty s tokenem
async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const headers = {
      'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${DIRECTUS_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.errors?.[0]?.message || `HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Chyba: ${error.message}`);
    throw error;
  }
}

// Vytvoření kolekce
async function createCollection(name, fields, icon = 'box', note = '') {
  console.log(`📦 Vytvářím kolekci: ${name}...`);
  
  try {
    await apiRequest('/collections', 'POST', {
      collection: name,
      meta: { icon, note },
      schema: { name },
    });

    // Vytvoř pole
    for (const field of fields) {
      await apiRequest(`/fields/${name}`, 'POST', field);
    }
    
    console.log(`✅ Kolekce ${name} vytvořena\n`);
  } catch (error) {
    console.log(`⚠️  Kolekce ${name} možná už existuje\n`);
  }
}

// Start setup
async function setup() {
  // Testujeme připojení
  try {
    console.log('🔍 Testuji připojení...');
    await apiRequest('/collections');
    console.log('✅ Připojení funguje!\n');
  } catch (error) {
    console.error('❌ Nelze se připojit k Directus!');
    process.exit(1);
  }

  // 1. Students
  await createCollection('students', [
    { field: 'id', type: 'uuid', schema: { is_primary_key: true } },
    { field: 'user_id', type: 'uuid' },
    { field: 'first_name', type: 'string' },
    { field: 'last_name', type: 'string' },
    { field: 'avatar', type: 'uuid' },
    { field: 'date_of_birth', type: 'date' },
  ], 'person', 'Profily žáků');

  // 2. Teachers
  await createCollection('teachers', [
    { field: 'id', type: 'uuid', schema: { is_primary_key: true } },
    { field: 'user_id', type: 'uuid' },
    { field: 'first_name', type: 'string' },
    { field: 'last_name', type: 'string' },
    { field: 'avatar', type: 'uuid' },
    { field: 'bio', type: 'text' },
  ], 'school', 'Profily učitelů');

  console.log('\n✅ Setup dokončen!');
  console.log('📋 Zkontroluj kolekce v Directus admin rozhraní');
}

setup().catch(console.error);
