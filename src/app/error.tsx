'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/ui';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for the App Router.
 * Catches unhandled errors in the React tree and provides a recovery action.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // In production: send to error tracking (Sentry, Datadog, etc.)
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div
      className="min-h-screen bg-[#09090b] flex items-center justify-center px-4"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <div className="max-w-sm w-full border border-zinc-800 bg-zinc-950 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-12 w-12 border border-red-500/30 bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1
            className="text-lg font-bold text-zinc-100"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Something went wrong
          </h1>
          <p className="text-xs text-zinc-600 leading-relaxed">
            An unexpected error occurred. Your funds have not been affected.
          </p>
          {error.digest && (
            <p className="text-[10px] text-zinc-700 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <Button onClick={reset} variant="outline" className="w-full" size="sm">
          <RotateCcw className="h-3 w-3" />
          Try again
        </Button>
      </div>
    </div>
  );
}
