/**
 * Directus Setup Script pro Online Portfolio - Kompletní verze
 * Spusť: node directus-setup-full.js
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL?.trim();
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN?.trim();

if (!DIRECTUS_ADMIN_TOKEN) {
  console.error('❌ Chyba: DIRECTUS_ADMIN_TOKEN není nastavený!');
  process.exit(1);
}

console.log('🚀 Začínám setup Directus...\n');

// Helper pro API requesty
async function apiRequest(endpoint, method = 'GET', body = null) {
  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || `HTTP ${response.status}`);
  }
  
  return data;
}

// Vytvoření kolekce
async function createCollection(name, icon = 'box', note = '') {
  console.log(`📦 Vytvářím kolekci: ${name}...`);
  
  try {
    await apiRequest('/collections', 'POST', {
      collection: name,
      meta: {
        collection: name,
        icon,
        note,
      },
      schema: {
        name,
      },
    });
    console.log(`✅ Kolekce ${name} vytvořena`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Kolekce ${name} už existuje`);
      return false;
    }
    console.error(`❌ Chyba: ${error.message}`);
    return false;
  }
}

// Vytvoření pole v kolekci
async function createField(collection, field, type, options = {}) {
  try {
    await apiRequest(`/fields/${collection}`, 'POST', {
      field,
      type,
      meta: options.meta || {},
      schema: options.schema || {},
    });
    return true;
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error(`  ❌ Pole ${field}: ${error.message}`);
    }
    return false;
  }
}

// Setup
async function setup() {
  console.log('1️⃣ Vytvářím základní kolekce...\n');
  
  // 1. Students
  if (await createCollection('students', 'person', 'Profily žáků')) {
    await createField('students', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('students', 'user_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('students', 'first_name', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('students', 'last_name', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('students', 'avatar', 'uuid', {
      meta: { interface: 'file-image' },
    });
    await createField('students', 'date_of_birth', 'date', {
      meta: { interface: 'datetime' },
    });
    await createField('students', 'created_at', 'timestamp', {
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    });
    await createField('students', 'updated_at', 'timestamp', {
      meta: { special: ['date-updated'], interface: 'datetime', readonly: true },
    });
  }
  console.log();

  // 2. Teachers
  if (await createCollection('teachers', 'school', 'Profily učitelů')) {
    await createField('teachers', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('teachers', 'user_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('teachers', 'first_name', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('teachers', 'last_name', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('teachers', 'avatar', 'uuid', {
      meta: { interface: 'file-image' },
    });
    await createField('teachers', 'bio', 'text', {
      meta: { interface: 'input-multiline' },
    });
    await createField('teachers', 'created_at', 'timestamp', {
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    });
    await createField('teachers', 'updated_at', 'timestamp', {
      meta: { special: ['date-updated'], interface: 'datetime', readonly: true },
    });
  }
  console.log();

  // 3. Personal Goals
  if (await createCollection('personal_goals', 'target', 'Osobní cíle')) {
    await createField('personal_goals', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('personal_goals', 'user_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('personal_goals', 'user_type', 'string', {
      meta: { interface: 'select-dropdown', required: true, options: { choices: [
        { text: 'Student', value: 'student' },
        { text: 'Teacher', value: 'teacher' }
      ]}},
    });
    await createField('personal_goals', 'title', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('personal_goals', 'description', 'text', {
      meta: { interface: 'input-multiline' },
    });
    await createField('personal_goals', 'target_date', 'date', {
      meta: { interface: 'datetime' },
    });
    await createField('personal_goals', 'is_completed', 'boolean', {
      meta: { interface: 'boolean', default_value: false },
    });
    await createField('personal_goals', 'created_at', 'timestamp', {
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    });
  }
  console.log();

  // 4. Dreams
  if (await createCollection('dreams', 'star', 'Sny a přání')) {
    await createField('dreams', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('dreams', 'user_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('dreams', 'user_type', 'string', {
      meta: { interface: 'select-dropdown', required: true, options: { choices: [
        { text: 'Student', value: 'student' },
        { text: 'Teacher', value: 'teacher' }
      ]}},
    });
    await createField('dreams', 'title', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('dreams', 'description', 'text', {
      meta: { interface: 'input-multiline' },
    });
    await createField('dreams', 'is_achieved', 'boolean', {
      meta: { interface: 'boolean', default_value: false },
    });
    await createField('dreams', 'created_at', 'timestamp', {
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    });
  }
  console.log();

  // 5. Categories
  if (await createCollection('categories', 'folder', 'Kategorie portfolia')) {
    await createField('categories', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('categories', 'name', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('categories', 'icon', 'string', {
      meta: { interface: 'input' },
    });
    await createField('categories', 'color', 'string', {
      meta: { interface: 'select-color' },
    });
    await createField('categories', 'description', 'text', {
      meta: { interface: 'input-multiline' },
    });
  }
  console.log();

  // 6. Page Templates
  if (await createCollection('page_templates', 'article', 'Šablony stránek')) {
    await createField('page_templates', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('page_templates', 'name', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('page_templates', 'description', 'text', {
      meta: { interface: 'input-multiline' },
    });
    await createField('page_templates', 'thumbnail', 'uuid', {
      meta: { interface: 'file-image' },
    });
    await createField('page_templates', 'html_template', 'text', {
      meta: { interface: 'input-code' },
    });
  }
  console.log();

  // 7. Portfolio Pages
  if (await createCollection('portfolio_pages', 'description', 'Stránky portfolia')) {
    await createField('portfolio_pages', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('portfolio_pages', 'student_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('portfolio_pages', 'category_id', 'uuid', {
      meta: { interface: 'select-dropdown-m2o' },
    });
    await createField('portfolio_pages', 'template_id', 'uuid', {
      meta: { interface: 'select-dropdown-m2o' },
    });
    await createField('portfolio_pages', 'title', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('portfolio_pages', 'content', 'text', {
      meta: { interface: 'input-rich-text-html' },
    });
    await createField('portfolio_pages', 'is_published', 'boolean', {
      meta: { interface: 'boolean', default_value: false },
    });
    await createField('portfolio_pages', 'created_at', 'timestamp', {
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    });
    await createField('portfolio_pages', 'updated_at', 'timestamp', {
      meta: { special: ['date-updated'], interface: 'datetime', readonly: true },
    });
  }
  console.log();

  // 8. Calendar Entries
  if (await createCollection('calendar_entries', 'calendar', 'Kalendář')) {
    await createField('calendar_entries', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('calendar_entries', 'student_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('calendar_entries', 'title', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('calendar_entries', 'description', 'text', {
      meta: { interface: 'input-multiline' },
    });
    await createField('calendar_entries', 'event_date', 'date', {
      meta: { interface: 'datetime', required: true },
    });
    await createField('calendar_entries', 'event_type', 'string', {
      meta: { interface: 'select-dropdown', options: { choices: [
        { text: 'Event', value: 'event' },
        { text: 'Task', value: 'task' },
        { text: 'Reminder', value: 'reminder' }
      ]}},
    });
    await createField('calendar_entries', 'created_at', 'timestamp', {
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    });
  }
  console.log();

  // 9. Shared Links
  if (await createCollection('shared_links', 'share', 'Sdílené odkazy')) {
    await createField('shared_links', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('shared_links', 'student_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('shared_links', 'share_token', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('shared_links', 'expires_at', 'timestamp', {
      meta: { interface: 'datetime' },
    });
    await createField('shared_links', 'is_active', 'boolean', {
      meta: { interface: 'boolean', default_value: true },
    });
    await createField('shared_links', 'created_at', 'timestamp', {
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    });
  }
  console.log();

  // 10. Messages
  if (await createCollection('messages', 'mail', 'Zprávy')) {
    await createField('messages', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('messages', 'from_user_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('messages', 'to_user_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('messages', 'subject', 'string', {
      meta: { interface: 'input', required: true },
    });
    await createField('messages', 'content', 'text', {
      meta: { interface: 'input-multiline', required: true },
    });
    await createField('messages', 'is_read', 'boolean', {
      meta: { interface: 'boolean', default_value: false },
    });
    await createField('messages', 'created_at', 'timestamp', {
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    });
  }
  console.log();

  // 11. Share Requests
  if (await createCollection('share_requests', 'send', 'Žádosti o sdílení')) {
    await createField('share_requests', 'id', 'uuid', {
      schema: { is_primary_key: true, is_nullable: false },
      meta: { hidden: true, readonly: true },
    });
    await createField('share_requests', 'student_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('share_requests', 'teacher_id', 'uuid', {
      meta: { interface: 'input', required: true },
    });
    await createField('share_requests', 'portfolio_page_id', 'uuid', {
      meta: { interface: 'select-dropdown-m2o' },
    });
    await createField('share_requests', 'message', 'text', {
      meta: { interface: 'input-multiline' },
    });
    await createField('share_requests', 'status', 'string', {
      meta: { interface: 'select-dropdown', default_value: 'pending', options: { choices: [
        { text: 'Pending', value: 'pending' },
        { text: 'Accepted', value: 'accepted' },
        { text: 'Declined', value: 'declined' }
      ]}},
    });
    await createField('share_requests', 'created_at', 'timestamp', {
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    });
  }
  console.log();

  console.log('\n✅ Setup dokončen!');
  console.log('📋 Zkontroluj kolekce v Directus admin rozhraní');
  console.log('\n💡 Další kroky:');
  console.log('   1. Nastav oprávnění pro role');
  console.log('   2. Vytvoř relace mezi kolekcemi');
  console.log('   3. Přidej testovací data\n');
}

setup().catch(console.error);






