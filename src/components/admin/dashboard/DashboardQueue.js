import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import DashboardQueueRow from './DashboardQueueRow';
import DashboardEmptyState from './DashboardEmptyState';

export default function DashboardQueue({ title, description, items = [], emptyTitle, emptyDescription, actionHref, actionLabel, priority = false }) {
  return (
    <section className="space-y-3" aria-labelledby={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-queue`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-queue`} className="text-base font-bold text-[var(--foreground)]">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>}
        </div>
        {actionHref && actionLabel && items.length > 0 && (
          <Link href={actionHref} className="inline-flex min-h-9 items-center gap-1.5 rounded-md text-sm font-bold text-[var(--accent)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
            {actionLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <DashboardEmptyState title={emptyTitle || 'No work in this queue'}>{emptyDescription || 'There is nothing waiting here right now.'}</DashboardEmptyState>
      ) : (
        <ul className={priority ? 'divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--surface)]' : 'space-y-2'}>
          {items.map((item) => <DashboardQueueRow key={item.id} item={item} compact={!priority} />)}
        </ul>
      )}
    </section>
  );
}
