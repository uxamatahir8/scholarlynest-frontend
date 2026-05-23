import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const baseStyles = "inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-colors shadow-sm backdrop-blur-sm";
  
  const variants = {
    default: "bg-white/10 text-[var(--foreground)] border-[var(--muted-border)]",
    primary: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
    gold: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
    danger: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400 dark:border-red-500/30",
    info: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30",
    outline: "bg-transparent text-[var(--muted)] border-[var(--muted-border)]",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
