import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CalendarDays, PencilLine } from 'lucide-react';
import StatusBadge from '../../ui/StatusBadge';
import { Button } from '../../ui/Button';
import { formatDate, isAuthorViewer, labelize, nextStepText, roleContext } from './workflowDisplay';

const revisionStatuses = new Set(['revision_required', 'minor_revision_required', 'major_revision_required']);

export default function ManuscriptHeader({ article, user, hasRole, onPublish, canPublish }) {
  const canResubmit = isAuthorViewer(user, article) && revisionStatuses.has(article.status);

  return (
    <header className="border-b border-[var(--border)] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-4">
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-2 rounded-md text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to manuscripts
          </Link>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={article.status} />
              <span className="inline-flex items-center rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">
                {roleContext(user)} workspace
              </span>
            </div>
            <h1 className="max-w-5xl text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              {article.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {article.magazine?.title || 'Magazine not assigned'}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Submitted {formatDate(article.created_at)}
              </span>
              {article.article_type && <span>{labelize(article.article_type)}</span>}
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
              {nextStepText(article, user, hasRole)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canResubmit && (
            <Link
              href={`/admin/articles/${article.id}/edit`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold tracking-wide text-[var(--primary-foreground)] shadow-sm transition-all duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
            >
              <PencilLine className="h-4 w-4" aria-hidden="true" />
              Resubmit Manuscript
            </Link>
          )}
          {canPublish && (
            <Button type="button" variant="primary" onClick={onPublish}>
              Publish Manuscript
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
