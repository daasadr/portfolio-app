import { scrypt, timingSafeEqual, randomBytes } from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * True when `id` is a plain positive integer. Route params are URL-decoded by Next.js,
 * so an unchecked param like "42#" or "../users" would rewrite admin-token Directus URLs.
 */
export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && /^[1-9]\d{0,15}$/.test(id);
}

/**
 * Client IP for rate limiting. nginx `proxy_add_x_forwarded_for` appends the real peer
 * address to whatever the client sent, so only the LAST entry is trustworthy.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const last = xff.split(',').pop()?.trim();
    if (last) return last;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

// In-memory rate limiter — works for single-instance (single VPS) deployments
const store = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

/**
 * Returns true if the key is rate-limited (should block), false if allowed.
 * limit: max requests per window; windowSecs: window size in seconds.
 */
export function isRateLimited(key: string, limit: number, windowSecs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowSecs * 1000 });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

/** Hash a security answer using scrypt. Returns a `scrypt:<salt>:<hash>` string. */
export async function hashAnswer(answer: string): Promise<string> {
  const normalized = answer.trim().toLowerCase();
  const salt = randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    scrypt(normalized, salt, 64, (err, hash) => {
      if (err) reject(err);
      else resolve(`scrypt:${salt}:${hash.toString('hex')}`);
    });
  });
}

/**
 * Verify a security answer against a stored value.
 * Handles both new hashed format (`scrypt:salt:hash`) and legacy plaintext.
 */
export async function verifyAnswer(answer: string, stored: string): Promise<boolean> {
  const normalized = answer.trim().toLowerCase();

  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    return new Promise((resolve) => {
      scrypt(normalized, salt, 64, (err, derivedKey) => {
        if (err) { resolve(false); return; }
        try {
          resolve(timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey));
        } catch {
          resolve(false);
        }
      });
    });
  }

  // Legacy plaintext — only used as migration fallback for existing accounts
  return normalized === stored.trim().toLowerCase();
}
