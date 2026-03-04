'use client';

import { Badge } from '@/shared/ui/components/badge';
import type { WithdrawalStatus } from '../model/types';

const STATUS_MAP: Record<WithdrawalStatus, { variant: 'pending' | 'processing' | 'completed' | 'failed'; dot: string }> = {
  pending:    { variant: 'pending',    dot: 'bg-amber-400' },
  processing: { variant: 'processing', dot: 'bg-blue-400 animate-pulse' },
  completed:  { variant: 'completed',  dot: 'bg-emerald-400' },
  failed:     { variant: 'failed',     dot: 'bg-red-400' },
};

export function StatusBadge({ status }: { status: WithdrawalStatus }) {
  const { variant, dot } = STATUS_MAP[status];
  return (
    <Badge variant={variant}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </Badge>
  );
}
