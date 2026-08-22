import {
  createDirectus,
  rest,
  readItems,
  createItem,
  updateItem,
  deleteItem,
  readMe,
  uploadFiles,
} from '@directus/sdk';
import type { Schema, Student } from '@/types';

// During SSR/prerender, Node.js rejects relative URLs — use the real Directus URL as a fallback.
// Client-side requests always go through /api/directus (proxy adds HttpOnly cookie auth).
// Server-side module evaluation never actually triggers SDK requests (those happen in useEffect/handlers only).
const SDK_BASE = typeof window !== 'undefined'
  ? '/api/directus'
  : (process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:3000');

export const directus = createDirectus<Schema>(SDK_BASE).with(rest());

export { readItems, createItem, updateItem, deleteItem };

export async function login(email: string, password: string, remember = false) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember }),
  });
  if (!res.ok) {
    const err = await res.json() as { message?: string };
    throw new Error(err.message ?? 'Chyba přihlášení');
  }
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  securityQuestion?: number,
  securityAnswer?: string
) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName, securityQuestion, securityAnswer }),
  });

  if (!res.ok) {
    const err = await res.json() as { code?: string; message?: string };
    if (err.code === 'RECORD_NOT_UNIQUE') {
      throw new Error('Účet s tímto emailem již existuje. Přihlaste se nebo použijte jiný email.');
    }
    throw new Error(err.message || 'Chyba při registraci');
  }

  // Login after registration — sets the HttpOnly cookie
  await login(email, password);
}

export async function getCurrentUser() {
  try {
    return await directus.request(readMe());
  } catch {
    return null;
  }
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getCurrentStudent(): Promise<Student | null> {
  try {
    // Cookie is sent automatically for same-origin fetch
    let res = await fetch('/api/student');

    if (res.status === 401) {
      // Token expired — try refresh
      const refreshed = await tryRefresh();
      if (!refreshed) return null;
      res = await fetch('/api/student');
    }

    if (!res.ok) return null;
    const { student } = await res.json() as { student: Student | null };
    return student ?? null;
  } catch {
    return null;
  }
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return await directus.request(uploadFiles(formData));
}

/** @deprecated Tokens are now in HttpOnly cookies. Returns empty string. */
export function getStoredToken(): string {
  return '';
}

/** @deprecated Use getStoredToken — kept for build compat only. */
export function getDisplayToken(): string {
  return '';
}

export function generateShareToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
