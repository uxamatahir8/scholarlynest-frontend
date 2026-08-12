import React, { forwardRef, useId } from 'react';

const baseStyles = 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-sm transition-all duration-200 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-[var(--surface-muted)] dark:placeholder:text-zinc-650';

export const Textarea = forwardRef(({ className = '', error, helperText, id, 'aria-describedby': describedBy, ...props }, ref) => {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;
  const helperId = helperText ? `${textareaId}-helper` : undefined;
  const description = [describedBy, helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      <textarea
        id={textareaId}
        className={`${baseStyles} min-h-32 resize-y ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''} ${className}`}
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

Textarea.displayName = 'Textarea';
export default Textarea;
