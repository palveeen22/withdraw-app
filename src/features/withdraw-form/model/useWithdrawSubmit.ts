import { useCallback, useEffect, useRef } from 'react';
import { createWithdrawal, getWithdrawal } from '@/entities/withdrawal';
import { ApiError, NetworkError } from '@/shared/api/fetch';
import { generateIdempotencyKey } from '@/shared/lib';
import { setCache } from '@/shared/lib/cache';
import {
  CURRENCY,
  WITHDRAWAL_CACHE_KEY,
  WITHDRAWAL_CACHE_TTL_MS,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  POLL_TERMINAL_STATUSES,
} from '@/shared/config';
import { useWithdrawStore } from './withdrawStore';
import type { WithdrawFormValues } from './schema';

export function useWithdrawSubmit() {
  const {
    status,
    withdrawal,
    pollStatus,
    pollAttempts,
    idempotencyKey,
    setLoading,
    setSuccess,
    setError,
    setIdempotencyKey,
    startPolling,
    tickPoll,
    stopPolling,
  } = useWithdrawStore();

  // Ref guard: prevents double-submit before React re-render
  const isSubmittingRef = useRef(false);
  // Ref to hold active polling timer — cleaned up on unmount
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Polling effect ---
  // Activates after a successful POST. Polls GET /v1/withdrawals/:id
  // until terminal status reached or max attempts exceeded.
  useEffect(() => {
    if (pollStatus !== 'polling' || !withdrawal) return;

    const isTerminal = POLL_TERMINAL_STATUSES.includes(
      withdrawal.status as (typeof POLL_TERMINAL_STATUSES)[number]
    );

    if (isTerminal) {
      stopPolling('done');
      setCache(WITHDRAWAL_CACHE_KEY, withdrawal, WITHDRAWAL_CACHE_TTL_MS);
      return;
    }

    if (pollAttempts >= POLL_MAX_ATTEMPTS) {
      stopPolling('timeout');
      return;
    }

    pollTimerRef.current = setTimeout(async () => {
      try {
        const updated = await getWithdrawal(withdrawal.id);
        tickPoll(updated);
      } catch {
        // Non-fatal: network blip during polling should not error the whole form.
        // Just increment the attempt counter and try again next tick.
        tickPoll(withdrawal);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [pollStatus, pollAttempts, withdrawal, tickPoll, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const submit = useCallback(
    async (values: WithdrawFormValues) => {
      if (isSubmittingRef.current || status === 'loading') return;

      isSubmittingRef.current = true;

      // Reuse key on retry to guarantee idempotency
      const key = idempotencyKey ?? generateIdempotencyKey();
      setIdempotencyKey(key);
      setLoading();

      try {
        const withdrawal = await createWithdrawal(
          {
            amount: parseFloat(values.amount),
            destination: values.destination,
            currency: CURRENCY,
          },
          key
        );

        setSuccess(withdrawal);

        // Begin polling GET /v1/withdrawals/:id to track status
        startPolling();
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setError(`A duplicate withdrawal request was detected. ${err.message}`);
        } else if (err instanceof NetworkError) {
          setError(`Network error: ${err.message} — your form data is preserved, you can retry.`);
        } else if (err instanceof ApiError) {
          setError(`Request failed: ${err.message}`);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [status, idempotencyKey, setIdempotencyKey, setLoading, setSuccess, setError, startPolling]
  );

  return { submit, isLoading: status === 'loading' };
}
