import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  icon: Icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-sans font-medium tracking-wide transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const variants = {
    primary: 'bg-zinc-950 text-white border border-zinc-950 shadow-sm hover:bg-zinc-900 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 dark:hover:bg-zinc-200',
    gold: 'bg-amber-600 text-white border border-amber-650 shadow-sm hover:bg-amber-500 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] dark:bg-amber-500 dark:text-zinc-950 dark:border-amber-500 dark:hover:bg-amber-400',
    secondary: 'bg-transparent text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 hover:border-amber-500/30 hover:text-amber-700 dark:hover:text-amber-450 hover:bg-amber-500/[0.02] hover:-translate-y-0.5 active:scale-[0.99]',
    danger: 'bg-red-500/5 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/10 active:scale-[0.99]',
    ghost: 'bg-transparent border border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40',
    link: 'bg-transparent border border-transparent text-amber-600 dark:text-amber-400 px-0 hover:text-amber-700 dark:hover:text-amber-300 hover:underline underline-offset-4',
  };

  const sizes = {
    sm: 'text-[11px] px-3.5 py-1.5',
    md: 'text-xs px-5 py-2.5',
    lg: 'text-sm px-6 py-3',
    icon: 'p-2.5 aspect-square',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={`h-3.5 w-3.5 animate-spin ${children ? 'mr-2' : ''}`} />
      ) : Icon ? (
        <Icon className={`h-3.5 w-3.5 ${children ? 'mr-2' : ''}`} />
      ) : null}
      {children}
    </button>
  );
}
