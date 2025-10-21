import { createDirectus, rest, authentication } from '@directus/sdk';
import type { Schema } from '@/types';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL!;

if (!directusUrl) {
  throw new Error('NEXT_PUBLIC_DIRECTUS_URL není nastavený v environment proměnných');
}

export const directus = createDirectus<Schema>(directusUrl)
  .with(rest())
  .with(authentication('cookie'));

// Helper funkce pro autentizaci
export async function login(email: string, password: string) {
  try {
    const result = await directus.login(email, password);
    return result;
  } catch (error) {
    console.error('Chyba při přihlášení:', error);
    throw error;
  }
}

export async function logout() {
  try {
    await directus.logout();
  } catch (error) {
    console.error('Chyba při odhlášení:', error);
    throw error;
  }
}

export async function register(email: string, password: string, firstName: string, lastName: string) {
  try {
    // Registrace uživatele
    const user = await directus.request({
      method: 'POST',
      path: '/users',
      body: {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: 'student', // Předpokládáme, že role 'student' existuje
      },
    });

    // Přihlášení po registraci
    await directus.login(email, password);

    // Vytvoření profilu žáka
    const student = await directus.request({
      method: 'POST',
      path: '/students',
      body: {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
      },
    });

    // Vytvoření předdefinovaných kategorií pro nového žáka
    const { PREDEFINED_CATEGORIES } = await import('@/types');
    const categories = PREDEFINED_CATEGORIES.map(cat => ({
      ...cat,
      student_id: student.id,
      is_predefined: true,
    }));

    await directus.request({
      method: 'POST',
      path: '/categories',
      body: categories,
    });

    return { user, student };
  } catch (error) {
    console.error('Chyba při registraci:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const user = await directus.getCurrentUser();
    return user;
  } catch (error) {
    console.error('Chyba při načítání uživatele:', error);
    return null;
  }
}

export async function getCurrentStudent() {
  try {
    const user = await directus.getCurrentUser();
    if (!user) return null;

    const students = await directus.request({
      method: 'GET',
      path: '/students',
      params: {
        filter: {
          user_id: { _eq: user.id },
        },
      },
    });

    return students.data?.[0] || null;
  } catch (error) {
    console.error('Chyba při načítání profilu žáka:', error);
    return null;
  }
}

// Helper pro upload souborů
export async function uploadFile(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const result = await directus.request({
      method: 'POST',
      path: '/files',
      body: formData,
    });

    return result;
  } catch (error) {
    console.error('Chyba při uploadu souboru:', error);
    throw error;
  }
}

// Helper pro generování sdílecího tokenu
export function generateShareToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}