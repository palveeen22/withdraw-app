/**
 * Unit tests for useWithdrawSubmit hook
 *
 * Covers:
 * - happy path: POST success → polling starts → status updates
 * - 409 conflict error
 * - network error with idempotency key preservation
 * - double-submit protection
 * - polling: terminal status stops polling
 * - polling: timeout after max attempts
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWithdrawSubmit } from '@/features/withdraw-form/model/useWithdrawSubmit';
import { useWithdrawStore } from '@/features/withdraw-form/model/withdrawStore';
import * as withdrawalApi from '@/entities/withdrawal/api/withdrawalApi';
import { ApiError, NetworkError } from '@/shared/api/fetch';

jest.mock('@/entities/withdrawal/api/withdrawalApi');
jest.mock('@/shared/lib/cache');

// Use fake timers for polling tests
beforeEach(() => {
  jest.useFakeTimers();
  useWithdrawStore.setState({
    status: 'idle',
    error: null,
    withdrawal: null,
    idempotencyKey: null,
    pollStatus: 'idle',
    pollAttempts: 0,
  });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

const mockWithdrawal = {
  id: 'test-id-123',
  amount: 100,
  currency: 'USDT',
  destination: '0xAbCdEf1234567890abcdef1234567890AbCdEf12',
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
};

const validFormValues = {
  amount: '100',
  destination: '0xAbCdEf1234567890abcdef1234567890AbCdEf12',
  confirm: true as const,
};

// ─── 1. Happy Path ─────────────────────────────────────────────────────────

describe('happy path', () => {
  it('sets success state and starts polling after successful POST', async () => {
    (withdrawalApi.createWithdrawal as jest.Mock).mockResolvedValue(mockWithdrawal);

    const { result } = renderHook(() => useWithdrawSubmit());

    await act(async () => {
      await result.current.submit(validFormValues);
    });

    const state = useWithdrawStore.getState();
    expect(state.status).toBe('success');
    expect(state.withdrawal).toMatchObject({ id: 'test-id-123', status: 'pending' });
    expect(state.pollStatus).toBe('polling');
    expect(state.error).toBeNull();
  });

  it('sends correct payload and idempotency key to POST', async () => {
    (withdrawalApi.createWithdrawal as jest.Mock).mockResolvedValue(mockWithdrawal);

    const { result } = renderHook(() => useWithdrawSubmit());

    await act(async () => {
      await result.current.submit(validFormValues);
    });

    expect(withdrawalApi.createWithdrawal).toHaveBeenCalledWith(
      { amount: 100, destination: mockWithdrawal.destination, currency: 'USDT' },
      expect.stringMatching(/^[0-9a-f-]{36}$/) // UUID format
    );
  });
});

// ─── 2. Polling ────────────────────────────────────────────────────────────

describe('polling', () => {
  it('polls GET and updates withdrawal status on each tick', async () => {
    (withdrawalApi.createWithdrawal as jest.Mock).mockResolvedValue(mockWithdrawal);
    (withdrawalApi.getWithdrawal as jest.Mock).mockResolvedValue({
      ...mockWithdrawal,
      status: 'processing',
    });

    renderHook(() => useWithdrawSubmit());

    await act(async () => {
      await useWithdrawStore.getState().setSuccess(mockWithdrawal);
      useWithdrawStore.getState().startPolling();
    });

    // Advance timer to trigger first poll
    await act(async () => {
      jest.advanceTimersByTime(3_000);
      await Promise.resolve(); // flush microtasks
    });

    await waitFor(() => {
      expect(withdrawalApi.getWithdrawal).toHaveBeenCalledWith('test-id-123');
    });
  });

  it('stops polling when terminal status "completed" is reached', async () => {
    (withdrawalApi.getWithdrawal as jest.Mock).mockResolvedValue({
      ...mockWithdrawal,
      status: 'completed',
    });

    renderHook(() => useWithdrawSubmit());

    await act(async () => {
      useWithdrawStore.getState().setSuccess({ ...mockWithdrawal, status: 'completed' });
      useWithdrawStore.getState().startPolling();
    });

    await waitFor(() => {
      expect(useWithdrawStore.getState().pollStatus).toBe('done');
    });

    // Should NOT have called GET since status was already terminal
    expect(withdrawalApi.getWithdrawal).not.toHaveBeenCalled();
  });

  it('stops polling after POLL_MAX_ATTEMPTS with timeout', async () => {
    (withdrawalApi.getWithdrawal as jest.Mock).mockResolvedValue({
      ...mockWithdrawal,
      status: 'pending', // never terminal
    });

    renderHook(() => useWithdrawSubmit());

    await act(async () => {
      useWithdrawStore.getState().setSuccess(mockWithdrawal);
      useWithdrawStore.getState().startPolling();
      // Set attempts to max directly to avoid 10 real timer advances
      useWithdrawStore.setState({ pollAttempts: 10 });
    });

    await waitFor(() => {
      expect(useWithdrawStore.getState().pollStatus).toBe('timeout');
    });
  });
});

// ─── 3. Error Handling ─────────────────────────────────────────────────────

describe('error handling', () => {
  it('shows friendly message on 409 conflict', async () => {
    (withdrawalApi.createWithdrawal as jest.Mock).mockRejectedValue(
      new ApiError(409, 'CONFLICT', 'Duplicate request detected')
    );

    const { result } = renderHook(() => useWithdrawSubmit());

    await act(async () => {
      await result.current.submit(validFormValues);
    });

    const state = useWithdrawStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toMatch(/duplicate/i);
    expect(state.pollStatus).toBe('idle'); // polling must NOT start on error
  });

  it('shows retry message on network error', async () => {
    (withdrawalApi.createWithdrawal as jest.Mock).mockRejectedValue(
      new NetworkError('Failed to fetch')
    );

    const { result } = renderHook(() => useWithdrawSubmit());

    await act(async () => {
      await result.current.submit(validFormValues);
    });

    expect(useWithdrawStore.getState().status).toBe('error');
    expect(useWithdrawStore.getState().error).toMatch(/network error/i);
  });

  it('preserves same idempotency key across retry after network error', async () => {
    (withdrawalApi.createWithdrawal as jest.Mock)
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValueOnce(mockWithdrawal);

    const { result } = renderHook(() => useWithdrawSubmit());

    await act(async () => { await result.current.submit(validFormValues); });
    const keyAfterFirst = useWithdrawStore.getState().idempotencyKey;
    expect(keyAfterFirst).toBeTruthy();

    await act(async () => { await result.current.submit(validFormValues); });

    const calls = (withdrawalApi.createWithdrawal as jest.Mock).mock.calls;
    expect(calls[0][1]).toBe(calls[1][1]); // same idempotency key
  });
});

// ─── 4. Double-Submit Protection ──────────────────────────────────────────

describe('double-submit protection', () => {
  it('ignores concurrent submit calls — API called exactly once', async () => {
    let resolveFn!: (v: typeof mockWithdrawal) => void;
    const pendingPromise = new Promise<typeof mockWithdrawal>(
      (res) => (resolveFn = res)
    );
    (withdrawalApi.createWithdrawal as jest.Mock).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useWithdrawSubmit());

    act(() => {
      result.current.submit(validFormValues); // first
      result.current.submit(validFormValues); // should be swallowed
    });

    resolveFn(mockWithdrawal);

    await act(async () => { await pendingPromise; });

    expect(withdrawalApi.createWithdrawal).toHaveBeenCalledTimes(1);
  });

  it('does not submit when status is already loading', async () => {
    useWithdrawStore.getState().setLoading();
    (withdrawalApi.createWithdrawal as jest.Mock).mockResolvedValue(mockWithdrawal);

    const { result } = renderHook(() => useWithdrawSubmit());

    await act(async () => {
      await result.current.submit(validFormValues);
    });

    expect(withdrawalApi.createWithdrawal).not.toHaveBeenCalled();
  });
});
