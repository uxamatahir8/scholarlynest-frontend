import React from 'react';

export function Table({ children, className = '', ...props }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`} {...props}>
      <table className="w-full border-collapse text-left font-sans">{children}</table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={`border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`divide-y divide-zinc-100/60 dark:divide-zinc-800/40 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr className={`transition-all duration-200 hover:bg-amber-500/[0.015] dark:hover:bg-amber-500/[0.025] ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-400 ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`px-6 py-4 align-middle text-xs text-zinc-700 dark:text-zinc-300 font-medium ${className}`} {...props}>
      {children}
    </td>
  );
}
