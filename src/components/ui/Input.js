import React, { forwardRef, useId } from 'react';
import { Textarea } from './Textarea';

export const baseControlStyles = 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-sm transition-all duration-200 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-[var(--surface-muted)] dark:placeholder:text-zinc-650';

export const Input = forwardRef(({ className = '', error, helperText, id, 'aria-describedby': describedBy, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const description = [describedBy, helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      <input
        id={inputId}
        className={`${baseControlStyles} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''} ${className}`}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={description}
        {...props}
      />
      {helperText && <span id={helperId} className="mt-1.5 block text-xs text-[var(--muted)]">{helperText}</span>}
      {error && <span id={errorId} className="mt-1.5 block text-xs font-semibold text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';

export { Textarea };

export const Select = forwardRef(({ className = '', error, helperText, children, id, 'aria-describedby': describedBy, ...props }, ref) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText ? `${selectId}-helper` : undefined;
  const description = [describedBy, helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full relative">
      <select
        id={selectId}
        className={`${baseControlStyles} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''} pr-8 cursor-pointer ${className}`}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={description}
        {...props}
      >
        {children}
      </select>
      {helperText && <span id={helperId} className="mt-1.5 block text-xs text-[var(--muted)]">{helperText}</span>}
      {error && <span id={errorId} className="mt-1.5 block text-xs font-semibold text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
});
Select.displayName = 'Select';

export function Label({ children, className = '', required = false, ...props }) {
  return (
    <label className={`mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300 ${className}`} {...props}>
      {children}{required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
    </label>
  );
}
