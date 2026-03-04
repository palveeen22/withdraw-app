'use client';

import { memo, useEffect } from 'react';
import { CheckCircle2, Shield, Zap, Clock } from 'lucide-react';

import { WithdrawForm } from '@/features/withdraw-form';
import { useWithdrawStore } from '@/features/withdraw-form';
import { WithdrawalCard } from '@/entities/withdrawal';
import { Button } from '@/shared/ui/components/button';
import { Separator } from '@/shared/ui/components/separator';
import { getCache } from '@/shared/lib/cache';
import { WITHDRAWAL_CACHE_KEY } from '@/shared/config';
import type { Withdrawal } from '@/entities/withdrawal';

export const WithdrawPage = memo(function WithdrawPage() {
  const { status, withdrawal, pollStatus, reset, setSuccess, startPolling } =
    useWithdrawStore();

  // Restore last withdrawal from sessionStorage on mount (5-min TTL)
  useEffect(() => {
    if (status === 'idle') {
      const cached = getCache<Withdrawal>(WITHDRAWAL_CACHE_KEY);
      if (cached) {
        setSuccess(cached);
        // Don't re-poll a cached entry — it's already in a known state
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] relative" style={{ fontFamily: 'var(--font-mono)' }}>
      {/* Amber top accent line */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent z-50" />

      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 70%)',
        }}
      />

      <main className="relative z-10 mx-auto max-w-[480px] px-4 py-16 md:py-24">
        {/* Top nav */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 border border-amber-400/60 flex items-center justify-center">
              <div className="h-2 w-2 bg-amber-400" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-400 uppercase"
              style={{ fontFamily: 'var(--font-syne)' }}>
              Vault
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 tracking-wider">
            <Shield className="h-3 w-3 text-emerald-500" />
            <span>Secured</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80 mb-3"
            style={{ fontFamily: 'var(--font-syne)' }}>
            Withdrawal
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 leading-none tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-syne)' }}>
            Send Funds
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Transfer USDT to any external wallet. Requests are processed within 1–3 business hours.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-px bg-zinc-800 border border-zinc-800 mb-10">
          {[
            { icon: Zap, label: 'Min Amount', value: '1.00 USDT' },
            { icon: Clock, label: 'Processing', value: '1–3 hrs' },
            { icon: Shield, label: 'Security', value: 'Idempotent' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-zinc-950 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-2.5 w-2.5 text-zinc-600" />
                <span className="text-[9px] uppercase tracking-widest text-zinc-600"
                  style={{ fontFamily: 'var(--font-syne)' }}>
                  {label}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-zinc-300"
                style={{ fontFamily: 'var(--font-syne)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="border border-zinc-800 bg-zinc-950">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600"
              style={{ fontFamily: 'var(--font-syne)' }}>
              {status === 'success' ? 'Confirmation' : 'Transaction Details'}
            </span>
            <div className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              status === 'loading' ? 'bg-amber-400 animate-pulse' :
              status === 'success' && pollStatus === 'polling' ? 'bg-blue-400 animate-pulse' :
              status === 'success' && pollStatus === 'done' ? 'bg-emerald-400' :
              status === 'error' ? 'bg-red-400' :
              'bg-zinc-700'
            }`} />
          </div>

          <div className="p-6">
            {status === 'success' && withdrawal ? (
              <SuccessView
                withdrawal={withdrawal}
                pollStatus={pollStatus}
                onNew={reset}
              />
            ) : (
              <WithdrawForm />
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 text-[10px] text-zinc-700 tracking-wide">
          <div className="h-px flex-1 bg-zinc-900" />
          <span>End-to-end protected · No double charges</span>
          <div className="h-px flex-1 bg-zinc-900" />
        </div>
      </main>
    </div>
  );
});

const SuccessView = memo(function SuccessView({
  withdrawal,
  pollStatus,
  onNew,
}: {
  withdrawal: Withdrawal;
  pollStatus: import('@/features/withdraw-form/model/withdrawStore').PollStatus;
  onNew: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100 mb-1"
            style={{ fontFamily: 'var(--font-syne)' }}>
            Withdrawal Queued
          </p>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Your request has been accepted and is pending blockchain confirmation.
          </p>
        </div>
      </div>

      <Separator />

      <WithdrawalCard withdrawal={withdrawal} pollStatus={pollStatus} />

      <Button type="button" variant="outline" className="w-full" onClick={onNew}>
        New Withdrawal
      </Button>
    </div>
  );
});
