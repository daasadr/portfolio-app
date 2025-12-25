/**
 * Validační schémata
 * 
 * Zod schémata pro validaci formulářů
 */

import { z } from 'zod';

// Přihlášení
export const loginSchema = z.object({
  email: z.string().email('Neplatná emailová adresa'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
});

// Registrace
export const registerSchema = z.object({
  email: z.string().email('Neplatná emailová adresa'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
  lastName: z.string().min(2, 'Příjmení musí mít alespoň 2 znaky'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hesla se neshodují',
  path: ['confirmPassword'],
});

// Osobní cíl
export const goalSchema = z.object({
  title: z.string().min(3, 'Název musí mít alespoň 3 znaky'),
  description: z.string().optional(),
  goal_type: z.enum(['short_term', 'long_term', 'lifelong']),
  target_date: z.string().optional(),
});

// Sen
export const dreamSchema = z.object({
  title: z.string().min(3, 'Název musí mít alespoň 3 znaky'),
  description: z.string().optional(),
});

// Kategorie
export const categorySchema = z.object({
  name: z.string().min(2, 'Název musí mít alespoň 2 znaky'),
  parent_category_id: z.string().optional(),
});

// Stránka portfolia
export const portfolioPageSchema = z.object({
  title: z.string().min(3, 'Název musí mít alespoň 3 znaky'),
  template_id: z.string().optional(),
  category_id: z.string().optional(),
  content: z.string().optional(),
  structured_data: z.any().optional(),
  visibility: z.enum(['private', 'shared']).default('private'),
});

// Kalendářový záznam
export const calendarEntrySchema = z.object({
  date: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  entry_type: z.enum(['plan', 'event', 'goal_deadline', 'reflection']),
  related_goal_id: z.string().optional(),
});

// Sdílecí odkaz
export const sharedLinkSchema = z.object({
  share_type: z.enum(['full_portfolio', 'category', 'single_page']),
  category_id: z.string().optional(),
  page_id: z.string().optional(),
  password: z.string().optional(),
  expires_at: z.string().optional(),
});

// Export typů
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type DreamInput = z.infer<typeof dreamSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type PortfolioPageInput = z.infer<typeof portfolioPageSchema>;
export type CalendarEntryInput = z.infer<typeof calendarEntrySchema>;
export type SharedLinkInput = z.infer<typeof sharedLinkSchema>;
