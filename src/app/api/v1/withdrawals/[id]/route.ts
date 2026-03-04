import { NextRequest, NextResponse } from 'next/server';
import { withdrawalById, progressStatus } from '../_store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const withdrawal = withdrawalById.get(id);
  if (!withdrawal) {
    return NextResponse.json(
      { message: `Withdrawal ${id} not found` },
      { status: 404 }
    );
  }

  // Simulate status progression over time (pending → processing → completed)
  const updated = progressStatus(withdrawal);

  // Persist the updated status so subsequent polls see it
  withdrawalById.set(id, updated);

  return NextResponse.json(updated);
}
