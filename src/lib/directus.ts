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
const STORAGE_KEY = 'pp_auth';
const REMEMBER_KEY = 'pp_remember';

const tokenStorage = {
  get: () => {
    if (typeof window === 'undefined') return null;
    try {
      // sessionStorage first (non-remember sessions)
      const session = sessionStorage.getItem(STORAGE_KEY);
      if (session) return JSON.parse(session);
      // fall back to localStorage (remember-me sessions)
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) return JSON.parse(local);
      return null;
    } catch { return null; }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: (value: any) => {
    if (typeof window === 'undefined') return;
    const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
    if (value) {
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },
};

export const directus = createDirectus<Schema>(directusUrl)
  .with(rest())
  .with(authentication('json', { storage: tokenStorage }));

export { readItems, createItem, updateItem, deleteItem };

export async function login(email: string, password: string, remember = false) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }
  return await directus.login({ email, password });
}

export async function logout() {
  try { await directus.logout(); } catch { /* ignore */ }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem('pp_img_token');
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

  // remember = false for new registrations (user can enable on next login)
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
    const stored = tokenStorage.get();
    if (!stored) return null;

    const fetchStudent = async (token: string) => {
      const res = await fetch('/api/student', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const { student } = await res.json() as { student: Student | null };
      return student ?? null;
    };

    // Try with current token
    let result = await fetchStudent(stored.access_token);
    if (result) return result;

    // Token expired — try refresh
    if (stored.refresh_token) {
      try {
        await directus.refresh();
        const refreshed = tokenStorage.get();
        if (refreshed?.access_token) {
          result = await fetchStudent(refreshed.access_token);
          return result;
        }
      } catch {
        // Refresh token also expired → clear storage
        tokenStorage.set(null);
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return await directus.request(uploadFiles(formData));
}

export function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const s = sessionStorage.getItem('pp_auth');
    if (s) return JSON.parse(s)?.access_token ?? '';
    const l = localStorage.getItem('pp_auth');
    if (l) return JSON.parse(l)?.access_token ?? '';
    return '';
  } catch { return ''; }
}

// Stable token for image URLs — doesn't change on access_token refresh,
// so browser can cache images across navigations within a session.
export function getDisplayToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = sessionStorage.getItem('pp_img_token');
    if (existing) return existing;
    const current = getStoredToken();
    if (current) sessionStorage.setItem('pp_img_token', current);
    return current;
  } catch { return ''; }
}

export function generateShareToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
