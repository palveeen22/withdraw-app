'use client';

import { memo } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Separator } from '@/shared/ui/components/separator';
import { StatusBadge } from './StatusBadge';
import { CURRENCY } from '@/shared/config';
import type { Withdrawal } from '../model/types';
import type { PollStatus } from '@/features/withdraw-form/model/withdrawStore';

interface WithdrawalCardProps {
  withdrawal: Withdrawal;
  pollStatus?: PollStatus;
}

export const WithdrawalCard = memo(function WithdrawalCard({
  withdrawal,
  pollStatus = 'idle',
}: WithdrawalCardProps) {
  const date = new Date(withdrawal.createdAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="border border-zinc-800 bg-zinc-900/80 p-6 animate-fade-up">
      {/* Amount hero */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600 mb-2"
          style={{ fontFamily: 'var(--font-syne)' }}>
          Amount Withdrawn
        </p>
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-bold text-amber-400 tabular-nums"
            style={{ fontFamily: 'var(--font-syne)' }}>
            {withdrawal.amount.toFixed(2)}
          </span>
          <span className="text-sm font-semibold text-zinc-600 tracking-widest">
            {CURRENCY}
          </span>
        </div>
      </div>

      <Separator className="mb-6" />

      <div className="space-y-3">
        <Row label="Status">
          <div className="flex items-center gap-2">
            <StatusBadge status={withdrawal.status} />
            {pollStatus === 'polling' && (
              <RefreshCw className="h-3 w-3 text-zinc-600 animate-spin" aria-label="Checking status..." />
            )}
            {pollStatus === 'done' && withdrawal.status === 'completed' && (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-label="Confirmed" />
            )}
            {pollStatus === 'done' && withdrawal.status === 'failed' && (
              <XCircle className="h-3 w-3 text-red-500" aria-label="Failed" />
            )}
            {pollStatus === 'timeout' && (
              <Clock className="h-3 w-3 text-zinc-600" aria-label="Status check timed out" />
            )}
          </div>
        </Row>
        <Row label="Transaction ID">
          <span className="text-xs text-zinc-400 font-mono">{withdrawal.id}</span>
        </Row>
        <Row label="Destination">
          <span className="text-xs text-zinc-400 font-mono break-all text-right max-w-[200px]">
            {withdrawal.destination}
          </span>
        </Row>
        <Row label="Created">
          <span className="text-xs text-zinc-400">{date}</span>
        </Row>
      </div>

      {/* Polling messages */}
      {pollStatus === 'polling' && (
        <p className="mt-4 text-[10px] text-zinc-600 tracking-wide" style={{ fontFamily: 'var(--font-syne)' }}>
          Confirming on-chain status...
        </p>
      )}
      {pollStatus === 'timeout' && (
        <p className="mt-4 text-[10px] text-amber-600 tracking-wide" style={{ fontFamily: 'var(--font-syne)' }}>
          Status check timed out. Check your wallet for confirmation.
        </p>
      )}
    </div>
  );
});

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[10px] uppercase tracking-widest text-zinc-600 shrink-0 pt-0.5"
        style={{ fontFamily: 'var(--font-syne)' }}>
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
