import React from 'react';
import { BookOpen, CalendarDays } from 'lucide-react';
import StatusBadge from '../../ui/StatusBadge';
import { formatDate } from './workflowDisplay';

export default function ManuscriptHeader({ article }) {
  return (
    <header className="space-y-3 border-b border-[var(--border)] pb-5">
      <StatusBadge status={article.status} />
      <h1 className="max-w-5xl text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {article.title}
      </h1>
      <div className="flex flex-col gap-2 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {article.magazine?.title || 'Publication not assigned'}
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Submitted {formatDate(article.created_at)}
        </span>
      </div>
    </header>
  );
}
