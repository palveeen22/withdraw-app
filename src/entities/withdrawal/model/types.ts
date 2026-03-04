export type WithdrawalStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  destination: string;
  status: WithdrawalStatus;
  createdAt: string;
  idempotencyKey?: string;
}

export interface CreateWithdrawalDto {
  amount: number;
  destination: string;
  currency: string;
}
