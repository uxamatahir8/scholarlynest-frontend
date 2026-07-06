'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ExternalLink, FileText, RefreshCw, Search } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import { formatDate } from '../../../utils/date';
import ConsolePageHeader from '../console/ConsolePageHeader';
import LoadingState from '../../ui/LoadingState';
import ErrorState from '../../ui/ErrorState';
import EmptyState from '../../ui/EmptyState';
import Pagination from '../../ui/Pagination';
import { Button } from '../../ui/Button';

const VALID_STATUS_FILTERS = new Set(['active', 'completed', 'pending', 'accepted']);

const statusLabel = (value) => {
  if (!value) return 'Not recorded';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const primaryActionLabel = (assignment) => {
  if (assignment.status === 'pending') return 'Accept / Decline Review';
  if (assignment.status === 'accepted') return 'Start Review';
  if (assignment.status === 'in_progress' || assignment.status === 'reopened') return 'Continue Review';
  if (assignment.status === 'completed') return 'View Submitted Review';
  return 'Open Review Workspace';
};

export default function ReviewerDeskList({
  observerMode = false,
  observerUser = null,
  observerParams = {},
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get('page') || 1);
  const statusParam = searchParams.get('status') || 'active';
  const searchParam = searchParams.get('search') || '';

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const status = VALID_STATUS_FILTERS.has(statusParam) ? statusParam : 'active';

  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(searchParam);

  const queryParams = useMemo(() => ({
    status,
    search: searchParam,
    page,
    per_page: 20,
    ...observerParams,
  }), [status, searchParam, page, observerParams]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || (key === 'status' && value === 'active') || (key === 'page' && Number(value) === 1)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    if (Object.prototype.hasOwnProperty.call(updates, 'status') || Object.prototype.hasOwnProperty.call(updates, 'search')) {
      next.delete('page');
    }
    const queryString = next.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/my-reviewer-assignments', { params: queryParams });
      setAssignments(response.data?.data || []);
      setMeta({
        current_page: response.data?.current_page || 1,
        last_page: response.data?.last_page || 1,
        total: response.data?.total || 0,
        per_page: response.data?.per_page || 20,
      });
    } catch (err) {
      logError('Failed to load reviewer assignments:', err);
      setError(safeApiMessage(err, 'Unable to load review assignments.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [queryParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateQuery({ search: searchInput, page: 1 });
  };

  const start = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const end = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <div className="space-y-8">
      <ConsolePageHeader
        title={observerMode && observerUser ? `${observerUser.name}'s Review Assignments` : 'My Review Assignments'}
        description="Complete confidential peer reviews for manuscripts assigned to you."
      />

      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search my review assignments..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Status
            <select
              value={status}
              onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}
              className="mt-1 block min-h-10 min-w-44 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <option value="active">Active Reviews</option>
              <option value="pending">Pending Invitations</option>
              <option value="accepted">Accepted Reviews</option>
              <option value="completed">Submitted Reviews</option>
            </select>
          </label>
          <p className="text-sm text-[var(--muted)]">
            Showing {start}-{end} of {meta.total} review assignments.
          </p>
          <Button type="button" variant="secondary" size="sm" icon={RefreshCw} onClick={loadAssignments} isLoading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading review assignments..." className="min-h-[320px]" />
      ) : error ? (
        <ErrorState title="Review assignments could not be loaded">{error}</ErrorState>
      ) : assignments.length === 0 ? (
        <EmptyState title="No review assignments found">
          There are no review assignments matching the selected filter or search.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="divide-y divide-[var(--border)]">
            {assignments.map((assignment) => {
              const article = assignment.article || {};
              const workflowHref = article.id
                ? `/admin/articles/${article.id}/workflow${observerMode ? '?observer_readonly=1' : ''}`
                : '/admin/reviewer';
              return (
                <article key={assignment.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                        Review: {statusLabel(assignment.status)}
                      </span>
                      {assignment.is_overdue && (
                        <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-bold text-red-650">Overdue</span>
                      )}
                    </div>
                    <h2 className="truncate text-base font-bold text-[var(--foreground)]">{article.title || 'Untitled manuscript'}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                      <span>{article.magazine?.title || 'Magazine not recorded'}</span>
                      <span>Assigned {formatDate(assignment.created_at)}</span>
                      <span>Due {formatDate(assignment.due_date)}</span>
                      {assignment.completed_at && <span>Submitted {formatDate(assignment.completed_at)}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                    <Link
                      href={workflowHref}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      {primaryActionLabel(assignment)}
                    </Link>
                    <Link
                      href={workflowHref}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Open Workspace
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <Pagination
        currentPage={meta.current_page}
        totalPages={meta.last_page}
        onPageChange={(nextPage) => updateQuery({ page: nextPage })}
        label="Review assignment pages"
      />
    </div>
  );
}
