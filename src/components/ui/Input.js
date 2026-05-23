import React, { forwardRef } from 'react';

const baseInputStyles = "w-full text-sm font-medium px-4 py-3 bg-white/5 dark:bg-black/20 border border-[var(--muted-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] dark:focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-premium placeholder-[var(--muted)] backdrop-blur-sm shadow-sm";

export const Input = forwardRef(({ className = '', error, ...props }, ref) => {
  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : '';
  return (
    <div className="w-full">
      <input
        className={`${baseInputStyles} ${errorStyles} ${className}`}
        ref={ref}
        {...props}
      />
      {error && <span className="text-red-500 text-[10px] font-bold mt-1.5 block">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className = '', error, ...props }, ref) => {
  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : '';
  return (
    <div className="w-full">
      <textarea
        className={`${baseInputStyles} resize-none ${errorStyles} ${className}`}
        ref={ref}
        {...props}
      />
      {error && <span className="text-red-500 text-[10px] font-bold mt-1.5 block">{error}</span>}
    </div>
  );
});
Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ className = '', error, children, ...props }, ref) => {
  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : '';
  return (
    <div className="w-full">
      <select
        className={`${baseInputStyles} font-semibold py-3 ${errorStyles} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-red-500 text-[10px] font-bold mt-1.5 block">{error}</span>}
    </div>
  );
});
Select.displayName = 'Select';

export function Label({ children, className = '', ...props }) {
  return (
    <label 
      className={`text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] block mb-1.5 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
