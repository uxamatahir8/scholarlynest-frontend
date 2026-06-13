import React, { forwardRef } from 'react';
import { Textarea } from './Textarea';

const baseInputStyles = 'w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 shadow-sm transition-all duration-300 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-650';

export const Input = forwardRef(({ className = '', error, ...props }, ref) => {
  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40 dark:border-red-500' : '';
  return (
    <div className="w-full">
      <input className={`${baseInputStyles} ${errorStyles} ${className}`} ref={ref} {...props} />
      {error && <span className="mt-1.5 block text-[11px] font-semibold text-red-650 dark:text-red-400">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';

export { Textarea };

export const Select = forwardRef(({ className = '', error, children, ...props }, ref) => {
  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40 dark:border-red-500' : '';
  return (
    <div className="w-full relative">
      <select className={`${baseInputStyles} ${errorStyles} pr-8 appearance-none cursor-pointer ${className}`} ref={ref} {...props}>
        {children}
      </select>
      {error && <span className="mt-1.5 block text-[11px] font-semibold text-red-655 dark:text-red-400">{error}</span>}
    </div>
  );
});
Select.displayName = 'Select';

export function Label({ children, className = '', ...props }) {
  return (
    <label className={`mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-450 ${className}`} {...props}>
      {children}
    </label>
  );
}
