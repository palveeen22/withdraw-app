import { useCallback, useRef } from 'react';
import { createWithdrawal } from '@/entities/withdrawal';
import { ApiError, NetworkError } from '@/shared/api/fetch';
import { generateIdempotencyKey } from '@/shared/lib';
import { CURRENCY } from '@/shared/config';
import { useWithdrawStore } from './withdrawStore';
import type { WithdrawFormValues } from './schema';

export function useWithdrawSubmit() {
  const {
    status,
    idempotencyKey,
    setLoading,
    setSuccess,
    setError,
    setIdempotencyKey,
    startPolling,
  } = useWithdrawStore();

  const isSubmittingRef = useRef(false);

  const submit = useCallback(
    async (values: WithdrawFormValues) => {
      if (isSubmittingRef.current || status === 'loading') return;

      isSubmittingRef.current = true;

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