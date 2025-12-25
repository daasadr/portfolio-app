/**
 * Aplikační konstanty
 * 
 * Tento soubor obsahuje všechny konstanty používané v aplikaci.
 */

// Názvy aplikace
export const APP_NAME = 'Portfolio Paradise';
export const APP_DESCRIPTION = 'Online portfolio pro žáky základních škol s individuálním studiem';

// API endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || '';

// Předdefinované kategorie pro nové žáky
export const PREDEFINED_CATEGORIES = [
  { name: 'Matematika', sort_order: 1 },
  { name: 'Čeština', sort_order: 2 },
  { name: 'Angličtina', sort_order: 3 },
  { name: 'Přírodověda', sort_order: 4 },
  { name: 'Dějepis', sort_order: 5 },
  { name: 'Zeměpis', sort_order: 6 },
  { name: 'Umění', sort_order: 7 },
  { name: 'Hudba', sort_order: 8 },
  { name: 'Tělesná výchova', sort_order: 9 },
  { name: 'Projekty', sort_order: 10 },
  { name: 'Výlety a události', sort_order: 11 },
  { name: 'Ostatní', sort_order: 12 },
] as const;

// Typy cílů
export const GOAL_TYPES = {
  SHORT_TERM: 'short_term',
  LONG_TERM: 'long_term',
  LIFELONG: 'lifelong',
} as const;

// Typy kalendářových záznamů
export const ENTRY_TYPES = {
  PLAN: 'plan',
  EVENT: 'event',
  GOAL_DEADLINE: 'goal_deadline',
  REFLECTION: 'reflection',
} as const;

// Typy šablon
export const TEMPLATE_TYPES = {
  FREE_FORM: 'free_form',
  WORK_SHEET: 'work_sheet',
  PROJECT: 'project',
  REFLECTION: 'reflection',
} as const;

// Viditelnost stránek
export const VISIBILITY = {
  PRIVATE: 'private',
  SHARED: 'shared',
} as const;

// Typy sdílení
export const SHARE_TYPES = {
  FULL_PORTFOLIO: 'full_portfolio',
  CATEGORY: 'category',
  SINGLE_PAGE: 'single_page',
} as const;

// Limity
export const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_FILES_PER_PAGE: 10,
  ITEMS_PER_PAGE: 20,
} as const;

// Formáty datumu
export const DATE_FORMATS = {
  FULL: 'dd. MM. yyyy',
  SHORT: 'dd. MM.',
  MONTH_YEAR: 'MMMM yyyy',
} as const;
