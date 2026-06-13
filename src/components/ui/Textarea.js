import React, { forwardRef } from 'react';

const baseInputStyles = 'w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-950 shadow-sm transition-all duration-300 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-650';

export const Textarea = forwardRef(({ className = '', error, ...props }, ref) => {
  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40 dark:border-red-500' : '';
  return (
    <div className="w-full">
      <textarea
        className={`${baseInputStyles} min-h-32 resize-y ${errorStyles} ${className}`}
        ref={ref}
        {...props}
      />
      {error && <span className="mt-1.5 block text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
