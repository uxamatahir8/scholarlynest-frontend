import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '../../ui/StatusBadge';
import DeskRecordMetadata from '../desk-observer/DeskRecordMetadata';

export default function DashboardQueueRow({ item, compact = false }) {
  if (!item) return null;

  const cardContent = (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between h-full">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold leading-6 text-[var(--foreground)]">{item.title || 'Untitled article'}</h3>
          {item.status && <StatusBadge status={item.status} />}
        </div>
        {item.context && <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{item.context}</p>}
        <DeskRecordMetadata trackingCode={item.trackingCode} assigneeName={item.assigneeName} dueDate={item.dueDate} />
      </div>
      {!compact && (
        <span className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-bold text-[var(--foreground)] transition-colors group-hover:bg-[var(--surface-muted)]">
          {item.actionLabel || 'Open'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </div>
  );

  if (item.href) {
    return (
      <li className="group relative rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-md transition-all duration-200 cursor-pointer">
        <Link
          href={item.href}
          className={`block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-lg ${compact ? 'p-3' : 'p-4'}`}
        >
          {cardContent}
        </Link>
      </li>
    );
  }

  return (
    <li className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] ${compact ? 'p-3' : 'p-4'}`}>
      {cardContent}
    </li>
  );
}
