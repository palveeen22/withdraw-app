'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memo, useEffect } from 'react';
import { Loader2, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';


import { withdrawSchema, type WithdrawFormValues } from '../model/schema';
import { useWithdrawStore } from '../model/withdrawStore';
import { useWithdrawSubmit } from '../model/useWithdrawSubmit';
import { CURRENCY } from '@/shared/config';
import { Button, Checkbox, Input, Label, Separator } from '@/shared/ui';

export const WithdrawForm = memo(function WithdrawForm() {
  const { status, error, reset } = useWithdrawStore();
  const { submit, isLoading } = useWithdrawSubmit();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset: resetForm,
    watch,
  } = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    mode: 'onChange',
    defaultValues: { amount: '', destination: '', confirm: false },
  });

  const amountValue = watch('amount');

  useEffect(() => {
    if (status === 'idle') resetForm();
  }, [status, resetForm]);

  const isDisabled = isLoading || !isValid;

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-8">

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            step="any"
            min="0.01"
            placeholder="0.00"
            hasError={!!errors.amount}
            aria-describedby={errors.amount ? 'amount-error' : undefined}
            aria-invalid={!!errors.amount}
            className="pr-20 text-lg font-semibold tabular-nums"
            style={{ fontFamily: 'var(--font-syne)' }}
            {...register('amount')}
          />
          <div className="absolute right-0 top-0 h-full flex items-center px-4 border-l border-zinc-700 pointer-events-none">
            <span className="text-[10px] font-bold tracking-widest text-amber-400" style={{ fontFamily: 'var(--font-syne)' }}>
              {CURRENCY}
            </span>
          </div>
        </div>
        {errors.amount ? (
          <p id="amount-error" role="alert" className="text-[11px] text-red-400 flex items-center gap-1.5 animate-slide-in">
            <AlertTriangle className="h-3 w-3" />
            {errors.amount.message}
          </p>
        ) : amountValue && parseFloat(amountValue) > 0 ? (
          <p className="text-[11px] text-zinc-600">
            ≈ {parseFloat(amountValue).toFixed(2)} {CURRENCY} will be transferred
          </p>
        ) : null}
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <Label htmlFor="destination">Destination Address</Label>
        <Input
          id="destination"
          type="text"
          placeholder="0x0000...0000"
          hasError={!!errors.destination}
          aria-describedby={errors.destination ? 'dest-error' : undefined}
          aria-invalid={!!errors.destination}
          className="font-mono text-sm"
          {...register('destination')}
        />
        {errors.destination && (
          <p id="dest-error" role="alert" className="text-[11px] text-red-400 flex items-center gap-1.5 animate-slide-in">
            <AlertTriangle className="h-3 w-3" />
            {errors.destination.message}
          </p>
        )}
      </div>

      <Separator />

      {/* Confirm */}
      <Controller
        name="confirm"
        control={control}
        render={({ field }) => (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm"
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-describedby={errors.confirm ? 'confirm-error' : undefined}
                aria-invalid={!!errors.confirm}
              />
              <label
                htmlFor="confirm"
                className="text-[11px] leading-relaxed text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                I confirm this withdrawal is intentional. I understand that{' '}
                <span className="text-zinc-300 font-medium">
                  blockchain transactions cannot be reversed
                </span>{' '}
                once broadcast to the network.
              </label>
            </div>
            {errors.confirm && (
              <p id="confirm-error" role="alert" className="text-[11px] text-red-400 flex items-center gap-1.5 pl-7">
                <AlertTriangle className="h-3 w-3" />
                {errors.confirm.message}
              </p>
            )}
          </div>
        )}
      />

      {/* API Error */}
      {status === 'error' && error && (
        <div
          role="alert"
          className="border border-red-500/30 bg-red-950/30 p-4 animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-[11px] text-red-300 font-medium" style={{ fontFamily: 'var(--font-syne)' }}>
                Transaction Failed
              </p>
              <p className="text-[11px] text-red-400/80 leading-relaxed">{error}</p>
              <p className="text-[11px] text-red-500/60 mt-1">Your form data has been preserved — retry safely.</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isDisabled}
          aria-busy={isLoading}
          className="flex-1"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing
            </>
          ) : status === 'error' ? (
            <>
              <RotateCcw className="h-4 w-4" />
              Retry
            </>
          ) : (
            <>
              Withdraw Funds
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {status === 'error' && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={reset}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
});
