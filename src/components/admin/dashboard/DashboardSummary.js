import React from 'react';

export default function DashboardSummary({ items = [] }) {
  if (!items.length) return null;

  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <dt className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--muted)]">
              <span>{item.label}</span>
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            </dt>
            <dd className="mt-3 text-2xl font-bold text-[var(--foreground)]">{item.value ?? 0}</dd>
          </div>
        );
      })}
    </dl>
  );
}
