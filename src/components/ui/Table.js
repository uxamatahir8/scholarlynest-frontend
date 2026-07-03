import React from 'react';

export function Table({ children, className = '', label, ...props }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`} {...props}>
      <table className="w-full border-collapse text-left font-sans" aria-label={label}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return <thead className={`border-b border-[var(--border)] bg-[var(--surface-muted)] ${className}`} {...props}>{children}</thead>;
}

export function TableBody({ children, className = '', ...props }) {
  return <tbody className={`divide-y divide-[var(--border)] ${className}`} {...props}>{children}</tbody>;
}

export function TableRow({ children, className = '', ...props }) {
  return <tr className={`transition-colors duration-200 hover:bg-[var(--surface-muted)] ${className}`} {...props}>{children}</tr>;
}

export function TableHead({ children, className = '', scope = 'col', ...props }) {
  return <th scope={scope} className={`px-6 py-4 text-xs font-bold text-[var(--muted)] ${className}`} {...props}>{children}</th>;
}

export function TableCell({ children, className = '', ...props }) {
  return <td className={`px-6 py-4 align-middle text-sm text-[var(--foreground)] ${className}`} {...props}>{children}</td>;
}
