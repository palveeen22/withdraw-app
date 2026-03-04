/**
 * Secure cache using sessionStorage (not localStorage).
 * Tokens should live in httpOnly cookies in production.
 * This module is only for non-sensitive short-lived UI state (e.g. last withdrawal).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  if (typeof window === 'undefined') return;
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage may be full or unavailable
  }
}

export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function clearCache(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
