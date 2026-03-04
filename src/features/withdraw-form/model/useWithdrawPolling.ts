import { useEffect, useRef } from 'react';
import { getWithdrawal } from '@/entities/withdrawal';
import {
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  POLL_TERMINAL_STATUSES,
} from '@/shared/config';
import { useWithdrawStore } from './withdrawStore';

export function useWithdrawPolling() {
  const { pollStatus, withdrawal, tickPoll, stopPolling } = useWithdrawStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pollStatus !== 'polling' || !withdrawal) return;

    timerRef.current = setInterval(async () => {
      const { pollAttempts } = useWithdrawStore.getState();

      if (pollAttempts >= POLL_MAX_ATTEMPTS) {
        clearInterval(timerRef.current!);
        stopPolling('timeout');
        return;
      }

      try {
        const updated = await getWithdrawal(withdrawal.id);
        tickPoll(updated);

        if (POLL_TERMINAL_STATUSES.includes(updated.status as typeof POLL_TERMINAL_STATUSES[number])) {
          clearInterval(timerRef.current!);
          stopPolling('done');
        }
      } catch {
        // silently retry until max attempts
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollStatus, withdrawal?.id]);
}
