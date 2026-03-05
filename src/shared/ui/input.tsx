import * as React from 'react';
import { cn } from '../lib';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full bg-zinc-900 border px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600',
          'transition-colors duration-150 outline-none',
          'focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError
            ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
            : 'border-zinc-700 hover:border-zinc-600',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
