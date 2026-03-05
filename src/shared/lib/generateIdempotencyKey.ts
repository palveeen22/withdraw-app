/**
 * Generate a v4-like UUID using the Web Crypto API.
 * Available in Node 16+, all modern browsers, and Edge Runtime — no external dep needed.
 */
export function generateIdempotencyKey(): string {
  // crypto.randomUUID() is available in Node 16+, browsers, and Next.js Edge Runtime
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for very old envs (tests running on Node 14)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}