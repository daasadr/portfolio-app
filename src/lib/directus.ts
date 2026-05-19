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
  const response = await fetch(`${directusUrl}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      role: 'fb459774-5562-4b35-aa90-cc51397aca23',
    }),
  });

  if (!response.ok) {
    const err = await response.json() as { errors?: { message: string }[] };
    throw new Error(err?.errors?.[0]?.message || 'Chyba při registraci');
  }

  const { data: user } = await response.json() as { data: { id: string } };

  await directus.login({ email, password });

  const student = await directus.request(
    createItem('students', {
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
    })
  ) as Student;

  const { PREDEFINED_CATEGORIES } = await import('@/types');
  const categories = PREDEFINED_CATEGORIES.map((cat) => ({
    ...cat,
    student_id: student.id,
    is_predefined: true,
  }));

  for (const cat of categories) {
    await directus.request(createItem('categories', cat));
  }

  return { user, student };
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
