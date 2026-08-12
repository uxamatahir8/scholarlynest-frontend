import React from 'react';
import { Loader2 } from 'lucide-react';

const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg border font-sans font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none';

const variants = {
  primary: 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:brightness-105 active:scale-[0.99]',
  default: 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:brightness-105 active:scale-[0.99]',
  gold: 'border-amber-600 bg-amber-600 text-white shadow-sm hover:bg-amber-500 active:scale-[0.99] dark:border-amber-500 dark:bg-amber-500 dark:text-zinc-950',
  secondary: 'border-[var(--border)] bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--surface-muted)] active:scale-[0.99]',
  outline: 'border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-muted)] active:scale-[0.99]',
  danger: 'border-red-500/20 bg-red-500/5 text-red-650 hover:bg-red-500/10 active:scale-[0.99] dark:text-red-400',
  ghost: 'border-transparent bg-transparent text-zinc-600 hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] dark:text-zinc-350',
  link: 'border-transparent bg-transparent px-0 text-amber-700 underline-offset-4 hover:underline dark:text-amber-400',
};

const sizes = {
  sm: 'min-h-8 px-3 py-1.5 text-xs',
  md: 'min-h-10 px-4 py-2 text-sm',
  lg: 'min-h-11 px-5 py-2.5 text-sm',
  icon: 'h-10 w-10 p-0',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading,
  className = '',
  disabled,
  icon: Icon,
  'aria-label': ariaLabel,
  ...props
}) {
  const busy = isLoading || loading;
  const iconOnly = size === 'icon' && !children;

  if (iconOnly && !ariaLabel) {
    // Keep runtime behavior safe while nudging callers toward accessible labels.
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={ariaLabel}
      {...props}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
