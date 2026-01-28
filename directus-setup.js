/**
 * Directus Setup Script pro Online Portfolio Žáků
 * 
 * Tento script vytvoří všechny potřebné kolekce a pole v Directus.
 * 
 * Jak použít:
 * 1. Nainstaluj @directus/sdk: npm install @directus/sdk
 * 2. Nastav proměnné prostředí (DIRECTUS_URL a DIRECTUS_ADMIN_TOKEN)
 * 3. Spusť: node directus-setup.js
 */

import { config } from 'dotenv';
import { createDirectus, rest, createCollection, createField, createRelation } from '@directus/sdk';

// Načti environment proměnné
config();

// Konfigurace
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!DIRECTUS_ADMIN_TOKEN) {
  console.error('❌ Chyba: DIRECTUS_ADMIN_TOKEN není nastavený!');
  process.exit(1);
}

// Inicializace Directus klienta
const directus = createDirectus(DIRECTUS_URL)
  .with(rest());

// Helper funkce pro requesty s auth
async function authenticatedRequest(endpoint, options = {}) {
  return fetch(`${DIRECTUS_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
  }).then(res => res.json());
}

// Pomocné funkce
async function createCollectionWithFields(collectionName, fields, options = {}) {
  try {
    console.log(`\n📦 Vytvářím kolekci: ${collectionName}...`);
    
    // Vytvoření kolekce
    await directus.request(
      createCollection({
        collection: collectionName,
        meta: {
          icon: options.icon || 'box',
          note: options.note || '',
          display_template: options.display_template,
          hidden: false,
          singleton: false,
          translations: null,
        },
        schema: {
          name: collectionName,
        },
        ...options.schema,
      })
    );

    console.log(`  ✅ Kolekce ${collectionName} vytvořena`);

    // Vytvoření polí
    for (const field of fields) {
      try {
        await directus.request(
          createField(collectionName, {
            field: field.field,
            type: field.type,
            meta: field.meta || {},
            schema: field.schema || {},
          })
        );
        console.log(`    ✓ Pole ${field.field} přidáno`);
      } catch (error) {
        console.error(`    ✗ Chyba při vytváření pole ${field.field}:`, error.message);
      }
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Chyba při vytváření kolekce ${collectionName}:`, error.message);
    return false;
  }
}

async function createRelationship(collection, field, related_collection, options = {}) {
  try {
    await directus.request(
      createRelation({
        collection,
        field,
        related_collection,
        meta: {
          many_collection: collection,
          many_field: field,
          one_collection: related_collection,
          one_field: options.one_field || null,
          junction_field: options.junction_field || null,
        },
        schema: {
          on_delete: options.on_delete || 'SET NULL',
        },
      })
    );
    console.log(`  🔗 Relace ${collection}.${field} -> ${related_collection} vytvořena`);
    return true;
  } catch (error) {
    console.error(`  ❌ Chyba při vytváření relace:`, error.message);
    return false;
  }
}

// Definice kolekcí
async function setup() {
  console.log('🚀 Začínám setup Directus pro Online Portfolio Žáků...\n');

  // 1. Kolekce STUDENTS (Žáci)
  await createCollectionWithFields(
    'students',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'user_id',
        type: 'uuid',
        meta: {
          interface: 'select-dropdown-m2o',
          display: 'related-values',
          required: true,
        },
      },
      {
        field: 'first_name',
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'last_name',
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'avatar',
        type: 'uuid',
        meta: { interface: 'file-image', display: 'image' },
      },
      {
        field: 'date_of_birth',
        type: 'date',
        meta: { interface: 'datetime', display: 'datetime' },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
      {
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-updated'] },
      },
    ],
    {
      icon: 'person',
      note: 'Profily žáků',
      display_template: '{{first_name}} {{last_name}}',
    }
  );

  // 2. Kolekce TEACHERS (Učitelé)
  await createCollectionWithFields(
    'teachers',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'user_id',
        type: 'uuid',
        meta: {
          interface: 'select-dropdown-m2o',
          display: 'related-values',
          required: true,
        },
      },
      {
        field: 'first_name',
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'last_name',
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'avatar',
        type: 'uuid',
        meta: { interface: 'file-image', display: 'image' },
      },
      {
        field: 'bio',
        type: 'text',
        meta: { interface: 'input-multiline' },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
      {
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-updated'] },
      },
    ],
    {
      icon: 'school',
      note: 'Profily učitelů',
      display_template: '{{first_name}} {{last_name}}',
    }
  );

  // 3. Kolekce PERSONAL_GOALS (Osobní cíle - pro žáky i učitele)
  await createCollectionWithFields(
    'personal_goals',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'user_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'user_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Žák', value: 'student' },
              { text: 'Učitel', value: 'teacher' },
            ],
          },
          required: true,
        },
      },
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'description',
        type: 'text',
        meta: { interface: 'input-multiline' },
      },
      {
        field: 'goal_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Krátkodobý', value: 'short_term' },
              { text: 'Dlouhodobý', value: 'long_term' },
              { text: 'Celoživotní', value: 'lifelong' },
            ],
          },
          required: true,
        },
      },
      {
        field: 'completed',
        type: 'boolean',
        meta: { interface: 'boolean', display: 'boolean' },
        schema: { default_value: false },
      },
      {
        field: 'target_date',
        type: 'date',
        meta: { interface: 'datetime', display: 'datetime' },
      },
      {
        field: 'completed_date',
        type: 'date',
        meta: { interface: 'datetime', display: 'datetime' },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
      {
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-updated'] },
      },
    ],
    {
      icon: 'flag',
      note: 'Osobní cíle žáků a učitelů',
      display_template: '{{title}} ({{goal_type}})',
    }
  );

  // 4. Kolekce DREAMS (Seznam snů - pro žáky i učitele)
  await createCollectionWithFields(
    'dreams',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'user_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'user_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Žák', value: 'student' },
              { text: 'Učitel', value: 'teacher' },
            ],
          },
          required: true },
      },
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'description',
        type: 'text',
        meta: { interface: 'input-multiline' },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
      {
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-updated'] },
      },
    ],
    {
      icon: 'auto_awesome',
      note: 'Seznam snů žáků',
      display_template: '{{title}}',
    }
  );

  // 4. Kolekce CATEGORIES (Kategorie)
  await createCollectionWithFields(
    'categories',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'student_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'name',
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'parent_category_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o' },
      },
      {
        field: 'is_predefined',
        type: 'boolean',
        meta: { interface: 'boolean' },
        schema: { default_value: false },
      },
      {
        field: 'sort_order',
        type: 'integer',
        meta: { interface: 'input' },
        schema: { default_value: 0 },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
    ],
    {
      icon: 'category',
      note: 'Kategorie pro portfolio',
      display_template: '{{name}}',
    }
  );

  // 5. Kolekce PAGE_TEMPLATES (Šablony stránek)
  await createCollectionWithFields(
    'page_templates',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'name',
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'description',
        type: 'text',
        meta: { interface: 'input-multiline' },
      },
      {
        field: 'template_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Volná forma', value: 'free_form' },
              { text: 'Pracovní list', value: 'work_sheet' },
              { text: 'Projekt', value: 'project' },
              { text: 'Reflexe', value: 'reflection' },
            ],
          },
          required: true,
        },
      },
      {
        field: 'structure_schema',
        type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' } },
      },
      {
        field: 'is_active',
        type: 'boolean',
        meta: { interface: 'boolean' },
        schema: { default_value: true },
      },
    ],
    {
      icon: 'description',
      note: 'Šablony pro stránky portfolia',
      display_template: '{{name}}',
    }
  );

  // 6. Kolekce PORTFOLIO_PAGES (Stránky portfolia)
  await createCollectionWithFields(
    'portfolio_pages',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'student_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'template_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o' },
      },
      {
        field: 'category_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o' },
      },
      {
        field: 'content',
        type: 'text',
        meta: { interface: 'input-rich-text-html' },
      },
      {
        field: 'structured_data',
        type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' } },
      },
      {
        field: 'visibility',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Soukromé', value: 'private' },
              { text: 'Sdílené', value: 'shared' },
            ],
          },
        },
        schema: { default_value: 'private' },
      },
      {
        field: 'sort_order',
        type: 'integer',
        meta: { interface: 'input' },
        schema: { default_value: 0 },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
      {
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-updated'] },
      },
    ],
    {
      icon: 'article',
      note: 'Stránky portfolia žáků',
      display_template: '{{title}}',
    }
  );

  // 7. Kolekce CALENDAR_ENTRIES (Kalendářové záznamy)
  await createCollectionWithFields(
    'calendar_entries',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'student_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'date',
        type: 'date',
        meta: { interface: 'datetime', display: 'datetime', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input' },
      },
      {
        field: 'description',
        type: 'text',
        meta: { interface: 'input-multiline' },
      },
      {
        field: 'entry_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Plán', value: 'plan' },
              { text: 'Událost', value: 'event' },
              { text: 'Deadline cíle', value: 'goal_deadline' },
              { text: 'Reflexe', value: 'reflection' },
            ],
          },
          required: true,
        },
      },
      {
        field: 'related_goal_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o' },
      },
      {
        field: 'completed',
        type: 'boolean',
        meta: { interface: 'boolean', display: 'boolean' },
        schema: { default_value: false },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
      {
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-updated'] },
      },
    ],
    {
      icon: 'event',
      note: 'Kalendářové záznamy žáků',
      display_template: '{{date}} - {{title}}',
    }
  );

  // 8. Kolekce SHARED_LINKS (Sdílecí odkazy)
  await createCollectionWithFields(
    'shared_links',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'student_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'share_token',
        type: 'string',
        meta: { interface: 'input', readonly: true },
        schema: { is_nullable: false, is_unique: true },
      },
      {
        field: 'share_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Celé portfolio', value: 'full_portfolio' },
              { text: 'Kategorie', value: 'category' },
              { text: 'Jednotlivá stránka', value: 'single_page' },
            ],
          },
          required: true,
        },
      },
      {
        field: 'category_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o' },
      },
      {
        field: 'page_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o' },
      },
      {
        field: 'password_hash',
        type: 'string',
        meta: { interface: 'input-hash' },
      },
      {
        field: 'expires_at',
        type: 'timestamp',
        meta: { interface: 'datetime', display: 'datetime' },
      },
      {
        field: 'view_count',
        type: 'integer',
        meta: { interface: 'input', readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: 'is_active',
        type: 'boolean',
        meta: { interface: 'boolean' },
        schema: { default_value: true },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
    ],
    {
      icon: 'share',
      note: 'Sdílecí odkazy pro portfolia',
      display_template: '{{share_token}}',
    }
  );

  // 9. Kolekce MESSAGES (Zprávy mezi uživateli)
  await createCollectionWithFields(
    'messages',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'from_user_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'to_user_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'message_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Textová zpráva', value: 'text' },
              { text: 'Žádost o sdílení', value: 'share_request' },
              { text: 'Systémová', value: 'system' },
            ],
          },
          required: true,
        },
      },
      {
        field: 'subject',
        type: 'string',
        meta: { interface: 'input' },
      },
      {
        field: 'content',
        type: 'text',
        meta: { interface: 'input-multiline', required: true },
        schema: { is_nullable: false },
      },
      {
        field: 'share_request_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o' },
      },
      {
        field: 'is_read',
        type: 'boolean',
        meta: { interface: 'boolean' },
        schema: { default_value: false },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
    ],
    {
      icon: 'mail',
      note: 'Zprávy mezi uživateli',
      display_template: '{{subject}}',
    }
  );

  // 10. Kolekce SHARE_REQUESTS (Žádosti o sdílení portfolia s učitelem)
  await createCollectionWithFields(
    'share_requests',
    [
      {
        field: 'id',
        type: 'uuid',
        schema: { is_primary_key: true },
        meta: { hidden: true, readonly: true },
      },
      {
        field: 'student_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'teacher_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', required: true },
      },
      {
        field: 'share_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Celé portfolio', value: 'full_portfolio' },
              { text: 'Kategorie', value: 'category' },
              { text: 'Jednotlivá stránka', value: 'single_page' },
            ],
          },
          required: true,
        },
      },
      {
        field: 'category_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o' },
      },
      {
        field: 'page_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o' },
      },
      {
        field: 'message',
        type: 'text',
        meta: { interface: 'input-multiline' },
      },
      {
        field: 'status',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Čeká', value: 'pending' },
              { text: 'Schváleno', value: 'approved' },
              { text: 'Zamítnuto', value: 'rejected' },
            ],
          },
        },
        schema: { default_value: 'pending' },
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
      },
      {
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-updated'] },
      },
    ],
    {
      icon: 'folder_shared',
      note: 'Žádosti o sdílení portfolia',
      display_template: 'Žádost od žáka #{{student_id}}',
    }
  );

  // Junction tabulka pro many-to-many vztahy: portfolio_pages <-> files (images)
  await createCollectionWithFields(
    'portfolio_pages_files',
    [
      {
        field: 'id',
        type: 'integer',
        schema: { is_primary_key: true, has_auto_increment: true },
        meta: { hidden: true },
      },
      {
        field: 'portfolio_pages_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', hidden: true },
      },
      {
        field: 'directus_files_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', hidden: true },
      },
    ],
    {
      icon: 'image',
      note: 'Junction tabulka pro obrázky v portfoliu',
    }
  );

  console.log('\n🔗 Vytvářím relace mezi kolekcemi...\n');

  // Relace: students -> directus_users
  await createRelationship('students', 'user_id', 'directus_users', {
    on_delete: 'CASCADE',
  });

  // Relace: students -> directus_files (avatar)
  await createRelationship('students', 'avatar', 'directus_files', {
    on_delete: 'SET NULL',
  });

  // Relace: teachers -> directus_users
  await createRelationship('teachers', 'user_id', 'directus_users', {
    on_delete: 'CASCADE',
  });

  // Relace: teachers -> directus_files (avatar)
  await createRelationship('teachers', 'avatar', 'directus_files', {
    on_delete: 'SET NULL',
  });

  // Relace: personal_goals -> directus_users (můžou být pro žáky i učitele)
  await createRelationship('personal_goals', 'user_id', 'directus_users', {
    on_delete: 'CASCADE',
  });

  // Relace: dreams -> directus_users (můžou být pro žáky i učitele)
  await createRelationship('dreams', 'user_id', 'directus_users', {
    on_delete: 'CASCADE',
  });

  // Relace: categories -> students
  await createRelationship('categories', 'student_id', 'students', {
    on_delete: 'CASCADE',
  });

  // Relace: categories -> categories (self-relation pro podkategorie)
  await createRelationship('categories', 'parent_category_id', 'categories', {
    on_delete: 'SET NULL',
  });

  // Relace: portfolio_pages -> students
  await createRelationship('portfolio_pages', 'student_id', 'students', {
    on_delete: 'CASCADE',
  });

  // Relace: portfolio_pages -> page_templates
  await createRelationship('portfolio_pages', 'template_id', 'page_templates', {
    on_delete: 'SET NULL',
  });

  // Relace: portfolio_pages -> categories
  await createRelationship('portfolio_pages', 'category_id', 'categories', {
    on_delete: 'SET NULL',
  });

  // Many-to-many relace: portfolio_pages <-> directus_files
  await createRelationship('portfolio_pages_files', 'portfolio_pages_id', 'portfolio_pages', {
    on_delete: 'CASCADE',
  });

  await createRelationship('portfolio_pages_files', 'directus_files_id', 'directus_files', {
    on_delete: 'CASCADE',
  });

  // Relace: calendar_entries -> students
  await createRelationship('calendar_entries', 'student_id', 'students', {
    on_delete: 'CASCADE',
  });

  // Relace: calendar_entries -> personal_goals
  await createRelationship('calendar_entries', 'related_goal_id', 'personal_goals', {
    on_delete: 'SET NULL',
  });

  // Relace: shared_links -> students
  await createRelationship('shared_links', 'student_id', 'students', {
    on_delete: 'CASCADE',
  });

  // Relace: shared_links -> categories
  await createRelationship('shared_links', 'category_id', 'categories', {
    on_delete: 'SET NULL',
  });

  // Relace: shared_links -> portfolio_pages
  await createRelationship('shared_links', 'page_id', 'portfolio_pages', {
    on_delete: 'SET NULL',
  });

  // Relace: messages -> directus_users (from_user)
  await createRelationship('messages', 'from_user_id', 'directus_users', {
    on_delete: 'CASCADE',
  });

  // Relace: messages -> directus_users (to_user)
  await createRelationship('messages', 'to_user_id', 'directus_users', {
    on_delete: 'CASCADE',
  });

  // Relace: messages -> share_requests
  await createRelationship('messages', 'share_request_id', 'share_requests', {
    on_delete: 'SET NULL',
  });

  // Relace: share_requests -> students
  await createRelationship('share_requests', 'student_id', 'students', {
    on_delete: 'CASCADE',
  });

  // Relace: share_requests -> teachers
  await createRelationship('share_requests', 'teacher_id', 'teachers', {
    on_delete: 'CASCADE',
  });

  // Relace: share_requests -> categories
  await createRelationship('share_requests', 'category_id', 'categories', {
    on_delete: 'SET NULL',
  });

  // Relace: share_requests -> portfolio_pages
  await createRelationship('share_requests', 'page_id', 'portfolio_pages', {
    on_delete: 'SET NULL',
  });

  console.log('\n✅ Setup dokončen! Všechny kolekce a relace byly vytvořeny.\n');
  console.log('📋 Další kroky:');
  console.log('   1. Přejdi do Directus admin rozhraní');
  console.log('   2. Zkontroluj vytvořené kolekce');
  console.log('   3. Nastav oprávnění pro role "student" a "teacher"');
  console.log('   4. (Volitelně) Přidej výchozí šablony stránek');
  console.log('   5. (Volitelně) Přidej předdefinované kategorie\n');
}

// Spuštění setupu
setup()
  .then(() => {
    console.log('🎉 Hotovo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Chyba během setupu:', error);
    process.exit(1);
  });