/**
 * Formátování datumu
 * 
 * Pomocné funkce pro práci s datumy v českém formátu
 */

import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';

/**
 * Naformátuje datum do českého formátu
 */
export function formatDate(date: string | Date, formatStr: string = 'dd. MM. yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: cs });
}

/**
 * Naformátuje datum jako relativní čas (např. "před 2 dny")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Dnes';
  if (diffInDays === 1) return 'Včera';
  if (diffInDays < 7) return `Před ${diffInDays} dny`;
  if (diffInDays < 30) return `Před ${Math.floor(diffInDays / 7)} týdny`;
  if (diffInDays < 365) return `Před ${Math.floor(diffInDays / 30)} měsíci`;
  return `Před ${Math.floor(diffInDays / 365)} roky`;
}

/**
 * Zkontroluje, zda je datum v minulosti
 */
export function isPastDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
}

/**
 * Zkontroluje, zda je datum dnes
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}
