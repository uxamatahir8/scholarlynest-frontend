import React, { useId } from 'react';

export default function Field({
  id,
  label,
  helperText,
  error,
  required = false,
  children,
  className = '',
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const helperId = helperText ? `${fieldId}-helper` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id || fieldId,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': [helperId, errorId].filter(Boolean).join(' ') || undefined,
        required: children.props.required ?? required,
      })
    : children;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
          {label}{required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
        </label>
      )}
      {child}
      {helperText && <p id={helperId} className="text-xs leading-relaxed text-[var(--muted)]">{helperText}</p>}
      {error && <p id={errorId} className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
