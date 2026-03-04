import { NextRequest, NextResponse } from 'next/server';
import type { Withdrawal } from '@/entities/withdrawal';
import { withdrawalById, withdrawalByIdempotencyKey } from './_store';

export async function POST(request: NextRequest) {
  await delay(600);

  const idempotencyKey = request.headers.get('idempotency-key');
  if (!idempotencyKey) {
    return NextResponse.json(
      { message: 'Idempotency-Key header is required' },
      { status: 422 }
    );
  }

  // 409 — exact same key already used
  if (withdrawalByIdempotencyKey.has(idempotencyKey)) {
    const existing = withdrawalByIdempotencyKey.get(idempotencyKey)!;
    return NextResponse.json(
      { message: `Withdrawal already exists with ID ${existing.id}` },
      { status: 409 }
    );
  }

  let body: { amount: number; destination: string; currency: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ message: 'Amount must be greater than 0' }, { status: 422 });
  }
  if (!body.destination || body.destination.length < 10) {
    return NextResponse.json({ message: 'Invalid destination address' }, { status: 422 });
  }

  const withdrawal: Withdrawal = {
    id: crypto.randomUUID(),
    amount: body.amount,
    currency: body.currency ?? 'USDT',
    destination: body.destination,
    status: 'pending',
    createdAt: new Date().toISOString(),
    idempotencyKey,
  };

  // Store in BOTH maps so GET /[id] can find it
  withdrawalByIdempotencyKey.set(idempotencyKey, withdrawal);
  withdrawalById.set(withdrawal.id, withdrawal);

  return NextResponse.json(withdrawal, { status: 201 });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
