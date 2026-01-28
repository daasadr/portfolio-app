/**
 * Test tokenu - zkontroluje, jestli token funguje
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL?.trim();
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN?.trim();

console.log('🧪 Test připojení k Directus\n');
console.log(`📡 URL: ${DIRECTUS_URL}`);
console.log(`🔑 Token: ${DIRECTUS_ADMIN_TOKEN}\n`);

// Test 1: Server info (veřejný endpoint)
console.log('1️⃣ Test: /server/info (veřejný)');
try {
  const response1 = await fetch(`${DIRECTUS_URL}/server/info`);
  const data1 = await response1.json();
  console.log('✅ Server info:', data1.data?.project?.project_name || 'OK');
} catch (error) {
  console.log('❌ Chyba:', error.message);
}

// Test 2: Users s tokenem
console.log('\n2️⃣ Test: /users (s tokenem)');
try {
  const response2 = await fetch(`${DIRECTUS_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
    },
  });
  const data2 = await response2.json();
  
  if (response2.ok) {
    console.log('✅ Přihlášen jako:', data2.data?.email || data2.data?.first_name);
    console.log('   Role:', data2.data?.role || 'neznámá');
  } else {
    console.log('❌ Chyba:', data2.errors?.[0]?.message || response2.status);
    console.log('   Detail:', JSON.stringify(data2, null, 2));
  }
} catch (error) {
  console.log('❌ Chyba:', error.message);
}

// Test 3: Collections
console.log('\n3️⃣ Test: /collections (s tokenem)');
try {
  const response3 = await fetch(`${DIRECTUS_URL}/collections`, {
    headers: {
      'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
    },
  });
  const data3 = await response3.json();
  
  if (response3.ok) {
    console.log('✅ Kolekce:', data3.data?.length || 0);
  } else {
    console.log('❌ Chyba:', data3.errors?.[0]?.message || response3.status);
  }
} catch (error) {
  console.log('❌ Chyba:', error.message);
}






