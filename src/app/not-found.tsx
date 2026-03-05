import Link from 'next/link';
import { Button } from '@/shared/ui';

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-zinc-950 flex items-center justify-center px-4"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <div className="text-center space-y-6">
        <p
          className="text-8xl font-black text-zinc-800"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          404
        </p>
        <p className="text-sm text-zinc-600">This page does not exist.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/withdraw">Go to Withdraw</Link>
        </Button>
      </div>
    </div>
  );
}
