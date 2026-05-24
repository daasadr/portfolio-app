import {
  createDirectus,
  rest,
  authentication,
  readItems,
  createItem,
  updateItem,
  deleteItem,
  readMe,
  uploadFiles,
} from '@directus/sdk';
import type { Schema, Student } from '@/types';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL!;

export const directus = createDirectus<Schema>(directusUrl)
  .with(rest())
  .with(authentication('cookie'));

export { readItems, createItem, updateItem, deleteItem };

export async function login(email: string, password: string) {
  return await directus.login({ email, password });
}

export async function logout() {
  await directus.logout();
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName }),
  });

  if (!response.ok) {
    const err = await response.json() as { code?: string; message?: string };
    if (err.code === 'RECORD_NOT_UNIQUE') {
      throw new Error('Účet s tímto emailem již existuje. Přihlaste se nebo použijte jiný email.');
    }
    throw new Error(err.message || 'Chyba při registraci');
  }

  await directus.login({ email, password });
}

export async function getCurrentUser() {
  try {
    return await directus.request(readMe());
  } catch {
    return null;
  }
}

export async function getCurrentStudent(): Promise<Student | null> {
  try {
    const user = await directus.request(readMe());
    if (!user) return null;

    const students = await directus.request(
      readItems('students', {
        filter: { user_id: { _eq: user.id } },
        limit: 1,
      })
    ) as Student[];

    return students[0] ?? null;
  } catch {
    return null;
  }
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return await directus.request(uploadFiles(formData));
}

export function generateShareToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
