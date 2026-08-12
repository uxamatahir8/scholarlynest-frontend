import React from 'react';

const toneClasses = {
  published: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  inactive: 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  sent: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
};

export default function ContentStatusBadge({ status, children }) {
  const normalized = String(status || 'inactive').toLowerCase();
  const label = children || (normalized === 'published' ? 'Published' : normalized === 'sent' ? 'Sent' : 'Inactive');

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[normalized] || toneClasses.inactive}`}>
      {label}
    </span>
  );
}
