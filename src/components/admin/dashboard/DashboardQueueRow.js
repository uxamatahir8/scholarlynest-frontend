import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import StatusBadge from '../../ui/StatusBadge';
import { formatDate } from '../../../utils/date';

export default function DashboardQueueRow({ item, compact = false }) {
  if (!item) return null;

  return (
    <li className={compact ? 'rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3' : 'p-4'}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold leading-6 text-[var(--foreground)]">{item.title || 'Untitled article'}</h3>
            {item.status && <StatusBadge status={item.status} />}
          </div>
          {item.context && <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{item.context}</p>}
          {item.dueDate && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Due {formatDate(item.dueDate)}
            </p>
          )}
        </div>
        {!compact && item.href && (
          <Link href={item.href} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
            {item.actionLabel || 'Open'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </li>
  );
}
