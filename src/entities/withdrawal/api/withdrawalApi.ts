import { apiFetch } from '@/shared/api/fetch';
import type { Withdrawal, CreateWithdrawalDto } from '../model/types';

export async function createWithdrawal(
  dto: CreateWithdrawalDto,
  idempotencyKey: string
): Promise<Withdrawal> {
  return apiFetch<Withdrawal>('/v1/withdrawals', {
    method: 'POST',
    body: JSON.stringify(dto),
    idempotencyKey,
  });
}

export async function getWithdrawal(id: string): Promise<Withdrawal> {
  return apiFetch<Withdrawal>(`/v1/withdrawals/${id}`);
}
