import { create } from 'zustand';
import type { Withdrawal } from '@/entities/withdrawal';

export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Polling state is separate from form submission state.
 * After a successful POST, we poll GET /v1/withdrawals/:id
 * until status reaches a terminal state (completed | failed).
 */
export type PollStatus = 'idle' | 'polling' | 'done' | 'timeout';

interface WithdrawState {
  // Form / submission
  status: FormStatus;
  error: string | null;
  withdrawal: Withdrawal | null;
  idempotencyKey: string | null;

  // Polling
  pollStatus: PollStatus;
  pollAttempts: number;

  // Actions
  setLoading: () => void;
  setSuccess: (withdrawal: Withdrawal) => void;
  setError: (message: string) => void;
  reset: () => void;
  setIdempotencyKey: (key: string) => void;

  // Polling actions
  startPolling: () => void;
  tickPoll: (withdrawal: Withdrawal) => void;
  stopPolling: (reason: 'done' | 'timeout') => void;
}

const INITIAL_STATE = {
  status: 'idle' as FormStatus,
  error: null,
  withdrawal: null,
  idempotencyKey: null,
  pollStatus: 'idle' as PollStatus,
  pollAttempts: 0,
};

export const useWithdrawStore = create<WithdrawState>((set) => ({
  ...INITIAL_STATE,

  setLoading: () =>
    set({ status: 'loading', error: null }),

  setSuccess: (withdrawal) =>
    set({ status: 'success', withdrawal, error: null, idempotencyKey: null }),

  setError: (message) =>
    set({ status: 'error', error: message }),

  reset: () => set(INITIAL_STATE),

  setIdempotencyKey: (key) =>
    set({ idempotencyKey: key }),

  startPolling: () =>
    set({ pollStatus: 'polling', pollAttempts: 0 }),

  tickPoll: (withdrawal) =>
    set((s) => ({
      withdrawal,
      pollAttempts: s.pollAttempts + 1,
    })),

  stopPolling: (reason) =>
    set({ pollStatus: reason }),
}));
