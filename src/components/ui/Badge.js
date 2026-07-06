import React from 'react';

export const badgeToneClasses = {
  default: 'border-zinc-200 bg-zinc-100/60 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300',
  neutral: 'border-zinc-200 bg-zinc-100/60 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300',
  primary: 'border-blue-500/20 bg-blue-500/[0.06] text-blue-700 dark:text-blue-300 dark:border-blue-500/25',
  info: 'border-blue-500/20 bg-blue-500/[0.06] text-blue-700 dark:text-blue-300 dark:border-blue-500/25',
  gold: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-750 dark:text-amber-300 dark:border-amber-500/25',
  warning: 'border-amber-500/25 bg-amber-500/[0.08] text-amber-750 dark:text-amber-300 dark:border-amber-500/25',
  success: 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-750 dark:text-emerald-300 dark:border-emerald-500/25',
  danger: 'border-red-500/20 bg-red-500/[0.07] text-red-700 dark:text-red-300 dark:border-red-500/25',
  outline: 'border-[var(--border)] bg-transparent text-[var(--foreground)]',
};

export function Badge({ children, variant = 'default', tone, className = '', ...props }) {
  const resolvedTone = tone || variant;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold leading-5 ${badgeToneClasses[resolvedTone] || badgeToneClasses.default} ${className}`} {...props}>
      {children}
    </span>
  );
}
