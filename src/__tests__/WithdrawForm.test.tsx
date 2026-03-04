/**
 * WithdrawForm UI Tests
 *
 * Covers:
 * 1. Happy path submit
 * 2. API error display + retry UX
 * 3. Double-submit protection
 * 4. Form validation
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Module-level mock — must be hoisted before component imports
const mockSubmitFn = jest.fn();
let mockIsLoading = false;

jest.mock('@/features/withdraw-form/model/useWithdrawSubmit', () => ({
  useWithdrawSubmit: () => ({
    submit: mockSubmitFn,
    isLoading: mockIsLoading,
  }),
}));

import { WithdrawForm } from '@/features/withdraw-form/ui/WithdrawForm';
import { useWithdrawStore } from '@/features/withdraw-form/model/withdrawStore';

beforeEach(() => {
  mockSubmitFn.mockReset();
  mockIsLoading = false;
  useWithdrawStore.setState({
    status: 'idle',
    error: null,
    withdrawal: null,
    idempotencyKey: null,
    pollStatus: 'idle',
    pollAttempts: 0,
  });
});

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/amount/i), '100');
  await user.type(
    screen.getByLabelText(/destination/i),
    '0xAbCdEf1234567890abcdef1234567890AbCdEf12'
  );
  await user.click(screen.getByRole('checkbox'));
}

// ─── 1. Happy Path ─────────────────────────────────────────────────────────

describe('WithdrawForm — happy path', () => {
  it('enables submit and calls handler when form is valid', async () => {
    mockSubmitFn.mockResolvedValue(undefined);
    render(<WithdrawForm />);

    await fillValidForm();

    const submitBtn = screen.getByRole('button', { name: /withdraw funds/i });
    expect(submitBtn).not.toBeDisabled();

    await userEvent.setup().click(submitBtn);

    await waitFor(() => {
      expect(mockSubmitFn).toHaveBeenCalledTimes(1);
      const [firstArg] = mockSubmitFn.mock.calls[0];
      expect(firstArg).toMatchObject({
        amount: '100',
        destination: expect.stringContaining('0x'),
        confirm: true,
      });
    });
  });
});

// ─── 2. API Error ──────────────────────────────────────────────────────────

describe('WithdrawForm — API error', () => {
  it('displays error message when store status is error', () => {
    act(() => {
      useWithdrawStore.getState().setError('Insufficient balance. Please try again.');
    });

    render(<WithdrawForm />);

    expect(screen.getByRole('alert')).toHaveTextContent('Insufficient balance');
  });

  it('shows preserved form data message on error', () => {
    act(() => {
      useWithdrawStore.getState().setError('Some error');
    });

    render(<WithdrawForm />);

    expect(screen.getByText(/your form data has been preserved/i)).toBeInTheDocument();
  });

  it('shows Retry button in error state', () => {
    act(() => {
      useWithdrawStore.getState().setError('Some API error');
    });

    render(<WithdrawForm />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows Cancel button in error state', () => {
    act(() => {
      useWithdrawStore.getState().setError('Some error');
    });

    render(<WithdrawForm />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});

// ─── 3. Double-Submit Protection ──────────────────────────────────────────

describe('WithdrawForm — double-submit protection', () => {
  it('disables submit button while loading', () => {
    mockIsLoading = true;

    act(() => {
      useWithdrawStore.getState().setLoading();
    });

    render(<WithdrawForm />);

    const submitBtn = screen.getByRole('button', { name: /processing/i });
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveAttribute('aria-busy', 'true');
  });

  it('submit button is disabled when form is empty (invalid)', () => {
    render(<WithdrawForm />);
    expect(screen.getByRole('button', { name: /withdraw funds/i })).toBeDisabled();
  });

  it('does not call submit handler when button is disabled', () => {
    mockIsLoading = true;
    act(() => { useWithdrawStore.getState().setLoading(); });

    render(<WithdrawForm />);

    fireEvent.click(screen.getByRole('button', { name: /processing/i }));
    expect(mockSubmitFn).not.toHaveBeenCalled();
  });
});

// ─── 4. Validation ─────────────────────────────────────────────────────────

describe('WithdrawForm — validation', () => {
  it('shows error when amount is 0', async () => {
    render(<WithdrawForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/amount/i), '0');
    await user.tab(); // trigger blur/validation

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/greater than 0/i);
    });
  });

  it('shows error when destination is too short', async () => {
    render(<WithdrawForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/destination/i), 'short');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/valid destination/i);
    });
  });
});
