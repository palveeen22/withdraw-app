/**
 * Shared singleton store for mock API routes.
 * Both POST /withdrawals and GET /withdrawals/:id reference this module,
 * so they operate on the same in-memory map within a single server process.
 *
 * In production this would be a DB (Postgres, Redis, etc.)
 */
import type { Withdrawal } from '@/entities/withdrawal';

// Module-level singletons — survive across Next.js route handler invocations
// in the same process (dev hot-reload may reset them, which is fine for mocks)
export const withdrawalById = new Map<string, Withdrawal>();
export const withdrawalByIdempotencyKey = new Map<string, Withdrawal>();

/** Simulate async status progression for polling demonstration */
export function progressStatus(withdrawal: Withdrawal): Withdrawal {
  const ageMs = Date.now() - new Date(withdrawal.createdAt).getTime();
  let status = withdrawal.status;
  // pending → processing after 3s, processing → completed after 8s
  if (ageMs > 8_000) status = 'completed';
  else if (ageMs > 3_000) status = 'processing';
  return { ...withdrawal, status };
}
