export const API_BASE_URL = '/api';

export const WITHDRAWAL_CACHE_KEY = 'last_withdrawal';
export const WITHDRAWAL_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const CURRENCY = 'USDT';

// Polling config
export const POLL_INTERVAL_MS = 3_000;   // every 3 seconds
export const POLL_MAX_ATTEMPTS = 10;     // stop after 30s total
export const POLL_TERMINAL_STATUSES = ['completed', 'failed'] as const;
