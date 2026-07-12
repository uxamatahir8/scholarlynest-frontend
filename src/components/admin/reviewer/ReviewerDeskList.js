'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Clock, ExternalLink, FileText, RefreshCw, RotateCw, Search } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import { formatDate } from '../../../utils/date';
import ConsolePageHeader from '../console/ConsolePageHeader';
import LoadingState from '../../ui/LoadingState';
import ErrorState from '../../ui/ErrorState';
import EmptyState from '../../ui/EmptyState';
import Pagination from '../../ui/Pagination';
import Alert from '../../ui/Alert';
import { Button } from '../../ui/Button';

const VALID_STATUS_FILTERS = new Set(['active', 'completed', 'pending', 'accepted']);

const statusLabel = (value) => {
  if (!value) return 'Not recorded';
  if (value === 'accepted') return 'Awaiting Review';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const isOverdue = (dueDate, completedAt) => {
  if (!dueDate || completedAt) return false;
  return new Date(dueDate).getTime() < Date.now();
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
        <form onSubmit={handleSearchSubmit} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search my review assignments..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            />
          </div>
          <button
            type="submit"
            className="min-h-10 cursor-pointer rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 px-4 py-2 text-sm font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="mr-2 text-xs font-bold text-[var(--foreground)]">Status:</label>
            <select
              value={status}
              onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}
              className="inline-block min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <option value="active">Active Reviews</option>
              <option value="pending">Pending Invitations</option>
              <option value="accepted">Accepted Reviews</option>
              <option value="completed">Submitted Reviews</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[var(--muted)]">
              Showing {start}-{end} of {meta.total} review assignments.
            </span>
            <button
              type="button"
              onClick={loadAssignments}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <Alert tone="danger" title="Review assignments could not be loaded">
          {error}
        </Alert>
      )}

      {loading && assignments.length === 0 ? (
        <LoadingState label="Loading review assignments..." className="min-h-[280px]" />
      ) : assignments.length === 0 ? (
        <EmptyState title="No review assignments found" className="py-12">
          There are no review assignments matching the selected filter or search.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const article = assignment.article || {};
            const magazine = article.magazine || {};
            const workflowHref = article.id
              ? `/admin/articles/${article.id}/workflow${observerMode ? '?observer_readonly=1' : ''}`
              : '/admin/reviewer';

            return (
              <div
                key={assignment.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--muted-border)] hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        assignment.status === 'completed' || assignment.completed_at
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      }`}>
                        Review: {statusLabel(assignment.status)}
                      </span>

                      {isOverdue(assignment.due_date, assignment.completed_at) && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          Overdue
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[var(--foreground)] leading-snug">
                      <Link href={workflowHref} className="hover:text-[var(--accent)] hover:underline">
                        {article.title || 'Untitled Article'}
                      </Link>
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                      {magazine.title && (
                        <span className="font-medium text-[var(--foreground)]">{magazine.title}</span>
                      )}
                      <span>Assigned {formatDate(assignment.created_at)}</span>
                      {assignment.due_date && <span>Due {formatDate(assignment.due_date)}</span>}
                      {assignment.completed_at && <span>Submitted {formatDate(assignment.completed_at)}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    <Link
                      href={workflowHref}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      {primaryActionLabel(assignment)}
                    </Link>

                    <Link
                      href={workflowHref}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <ExternalLink className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
                      Open Workspace
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
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
