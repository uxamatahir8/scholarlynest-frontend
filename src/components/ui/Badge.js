import React from 'react';

export function Badge({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'border-zinc-200 bg-zinc-100/40 text-zinc-650 dark:border-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-300',
    primary: 'border-blue-500/15 bg-blue-500/[0.03] text-blue-600 dark:text-blue-400 dark:border-blue-500/20',
    gold: 'border-amber-500/20 bg-amber-500/[0.03] text-amber-700 dark:text-amber-405 dark:border-amber-500/20',
    success: 'border-emerald-500/15 bg-emerald-500/[0.03] text-emerald-700 dark:text-emerald-400 dark:border-emerald-500/20',
    danger: 'border-red-500/15 bg-red-500/[0.03] text-red-650 dark:text-red-400 dark:border-red-500/20',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </span>
  );
}
