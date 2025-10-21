// TypeScript typy pro Directus kolekce

export interface Student {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalGoal {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  goal_type: 'short_term' | 'long_term' | 'lifelong';
  completed: boolean;
  target_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Dream {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  student_id: string;
  name: string;
  parent_category_id?: string;
  is_predefined: boolean;
  sort_order: number;
  created_at: string;
}

export interface PageTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: 'free_form' | 'work_sheet' | 'project' | 'reflection';
  structure_schema?: any;
  is_active: boolean;
}

export interface PortfolioPage {
  id: string;
  student_id: string;
  title: string;
  template_id?: string;
  category_id?: string;
  content?: string;
  structured_data?: any;
  visibility: 'private' | 'shared';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEntry {
  id: string;
  student_id: string;
  date: string;
  title?: string;
  description?: string;
  entry_type: 'plan' | 'event' | 'goal_deadline' | 'reflection';
  related_goal_id?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedLink {
  id: string;
  student_id: string;
  share_token: string;
  share_type: 'full_portfolio' | 'category' | 'single_page';
  category_id?: string;
  page_id?: string;
  password_hash?: string;
  expires_at?: string;
  view_count: number;
  is_active: boolean;
  created_at: string;
}

export interface PortfolioPageFile {
  id: number;
  portfolio_pages_id: string;
  directus_files_id: string;
}

// Directus Schema interface
export interface Schema {
  students: Student[];
  personal_goals: PersonalGoal[];
  dreams: Dream[];
  categories: Category[];
  page_templates: PageTemplate[];
  portfolio_pages: PortfolioPage[];
  calendar_entries: CalendarEntry[];
  shared_links: SharedLink[];
  portfolio_pages_files: PortfolioPageFile[];
}

// Utility typy
export type GoalType = 'short_term' | 'long_term' | 'lifelong';
export type TemplateType = 'free_form' | 'work_sheet' | 'project' | 'reflection';
export type EntryType = 'plan' | 'event' | 'goal_deadline' | 'reflection';
export type ShareType = 'full_portfolio' | 'category' | 'single_page';
export type Visibility = 'private' | 'shared';

// Form typy
export interface CreateGoalForm {
  title: string;
  description?: string;
  goal_type: GoalType;
  target_date?: string;
}

export interface CreateDreamForm {
  title: string;
  description?: string;
}

export interface CreateCategoryForm {
  name: string;
  parent_category_id?: string;
}

export interface CreatePageForm {
  title: string;
  template_id?: string;
  category_id?: string;
  content?: string;
  structured_data?: any;
}

export interface CreateCalendarEntryForm {
  date: string;
  title?: string;
  description?: string;
  entry_type: EntryType;
  related_goal_id?: string;
}

export interface CreateSharedLinkForm {
  share_type: ShareType;
  category_id?: string;
  page_id?: string;
  password?: string;
  expires_at?: string;
}

// API Response typy
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total_count?: number;
    filter_count?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total_count: number;
    filter_count: number;
  };
}

// Předdefinované kategorie
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