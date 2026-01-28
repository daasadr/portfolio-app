/**
 * Test vytvoření kolekce - detailní diagnostika
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL?.trim();
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN?.trim();

console.log('🧪 Test vytvoření kolekce\n');
console.log(`📡 URL: ${DIRECTUS_URL}`);
console.log(`🔑 Token: ${DIRECTUS_ADMIN_TOKEN}\n`);

// Test vytvoření jednoduché kolekce
console.log('📝 Pokouším se vytvořit testovací kolekci "test_collection"...\n');

try {
  const response = await fetch(`${DIRECTUS_URL}/collections`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collection: 'test_collection',
      meta: {
        collection: 'test_collection',
        icon: 'box',
        note: 'Test kolekce',
      },
      schema: {
        name: 'test_collection',
      },
    }),
  });

  console.log(`📊 Status: ${response.status} ${response.statusText}`);
  console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
  
  const data = await response.json();
  console.log(`\n📦 Response:`);
  console.log(JSON.stringify(data, null, 2));
  
  if (response.ok) {
    console.log('\n✅ Kolekce úspěšně vytvořena!');
    
    // Pokus o smazání
    console.log('\n🗑️  Mažu testovací kolekci...');
    const deleteResponse = await fetch(`${DIRECTUS_URL}/collections/test_collection`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
      },
    });
    console.log(`Status: ${deleteResponse.status}`);
  } else {
    console.log('\n❌ Chyba při vytváření kolekce');
  }
} catch (error) {
  console.error('❌ Exception:', error.message);
}






