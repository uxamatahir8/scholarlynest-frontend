'use client';

import { Select } from '../../ui/Input';

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
import DeskRecordMetadata from '../desk-observer/DeskRecordMetadata';
import { Button } from '../../ui/Button';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import Field from '../../ui/Field';
import { Textarea } from '../../ui/Textarea';

const VALID_STATUS_FILTERS = new Set(['all', 'active', 'completed', 'pending', 'accepted', 'closed']);

const statusLabel = (value) => {
  if (!value) return 'Not recorded';
  if (value === 'accepted') return 'Accepted';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const isOverdue = (dueDate, completedAt) => {
  if (!dueDate || completedAt) return false;
  return new Date(dueDate).getTime() < Date.now();
};

const primaryActionLabel = (assignment) => {
  if (['pending', 'invited'].includes(assignment.status)) return 'Accept / Decline Invitation';
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
  const statusParam = searchParams.get('status') || 'all';
  const searchParam = searchParams.get('search') || '';

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const status = VALID_STATUS_FILTERS.has(statusParam) ? statusParam : 'active';

  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(searchParam);
  const [busyAssignmentId, setBusyAssignmentId] = useState(null);
  const [declineAssignment, setDeclineAssignment] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

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
      if (!value || (key === 'status' && value === 'all') || (key === 'page' && Number(value) === 1)) {
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
      if (status === 'all') {
        const sections = [
          ['Pending Invitations', response.data?.pending_invitations || []],
          ['Pending and Active Reviews', response.data?.active_reviews || []],
          ['Completed Reviews', response.data?.completed_reviews || []],
          ['Closed, Declined, or Expired History', response.data?.closed_history || []],
        ];
        setAssignments(sections.flatMap(([section, items]) => items.map((item, index) => ({ ...item, section, firstInSection: index === 0 }))));
      } else {
        setAssignments(response.data?.data || []);
      }
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

  const respondToInvitation = async (assignment, decision, reason = '') => {
    setBusyAssignmentId(assignment.id);
    setError('');
    try {
      await api.post(`/admin/lifecycle/reviewer-assignments/${assignment.id}/response`, {
        decision,
        reason: reason.trim() || undefined,
      }, { headers: { 'Idempotency-Key': `review-response-${assignment.id}-${decision}` } });
      setDeclineAssignment(null);
      setDeclineReason('');
      await loadAssignments();
    } catch (err) {
      logError(`Failed to ${decision} reviewer invitation`, err);
      setError(safeApiMessage(err, `Unable to ${decision} this invitation.`));
    } finally {
      setBusyAssignmentId(null);
    }
  };

  const startReview = async (assignment, workflowHref) => {
    setBusyAssignmentId(assignment.id);
    setError('');
    try {
      await api.post(`/admin/lifecycle/reviewer-assignments/${assignment.id}/start`, {}, {
        headers: { 'Idempotency-Key': `review-start-${assignment.id}` },
      });
      router.push(workflowHref);
    } catch (err) {
      logError('Failed to start reviewer assignment', err);
      setError(safeApiMessage(err, 'Unable to start this review.'));
      setBusyAssignmentId(null);
    }
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
            <Select
              value={status}
              onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}
              className="inline-block min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <option value="all">All Assignments</option>
              <option value="active">Active Reviews</option>
              <option value="pending">Pending Invitations</option>
              <option value="accepted">Accepted Reviews</option>
              <option value="completed">Submitted Reviews</option>
              <option value="closed">Closed History</option>
            </Select>
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
              ? `/admin/articles/${article.id}/workflow?version=${assignment.article_version_id}&assignment=${assignment.id}${observerMode ? '&observer_readonly=1' : ''}`
              : '/admin/reviewer';

            return (
              <React.Fragment key={assignment.id}>
              {assignment.firstInSection && <h2 className="pt-4 text-lg font-bold text-[var(--foreground)]">{assignment.section}</h2>}
              <div
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
                      <span>{article.tracking_code} — {assignment.version_label}</span>
                      <span>Round {assignment.review_round || 1}</span>
                      <span>Invited {formatDate(assignment.invited_at || assignment.created_at)}</span>
                      {assignment.completed_at && <span>Submitted {formatDate(assignment.completed_at)}</span>}
                    </div>
                    {assignment.decision_exists && ['accepted', 'in_progress', 'review_in_progress', 'reopened'].includes(assignment.status) && (
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">An editorial decision has already been recorded for this version. You may still submit this review for the editorial record.</p>
                    )}
                    <DeskRecordMetadata
                      trackingCode={[article.tracking_code, assignment.version_label].filter(Boolean).join(' – ')}
                      assigneeName={assignment.assignee?.name || observerUser?.name}
                      dueDate={assignment.due_date}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    {assignment.capabilities?.accept_invitation && !observerMode && <Button
                      type="button"
                      size="sm"
                      isLoading={busyAssignmentId === assignment.id}
                      disabled={busyAssignmentId !== null}
                      onClick={() => respondToInvitation(assignment, 'accept')}
                    >Accept Invitation</Button>}
                    {assignment.capabilities?.decline_invitation && !observerMode && <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busyAssignmentId !== null}
                      onClick={() => { setDeclineAssignment(assignment); setDeclineReason(''); }}
                    >Decline Invitation</Button>}
                    {assignment.capabilities?.start_review && !observerMode && <Button
                      type="button"
                      size="sm"
                      isLoading={busyAssignmentId === assignment.id}
                      disabled={busyAssignmentId !== null}
                      onClick={() => startReview(assignment, workflowHref)}
                    >Start Review</Button>}
                    {(assignment.capabilities?.continue_review || assignment.capabilities?.view_completed) && <Link
                      href={workflowHref}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      {primaryActionLabel(assignment)}
                    </Link>}

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
              </React.Fragment>
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
      <ConfirmationModal
        isOpen={Boolean(declineAssignment)}
        title="Decline Invitation"
        message="Confirm that you do not wish to review this version. Your response will remain in the assignment history."
        confirmText="Decline Invitation"
        variant="danger"
        isLoading={busyAssignmentId === declineAssignment?.id}
        onCancel={() => { setDeclineAssignment(null); setDeclineReason(''); }}
        onConfirm={() => respondToInvitation(declineAssignment, 'decline', declineReason)}
      >
        <Field label="Reason (optional)">
          <Textarea value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} rows={3} />
        </Field>
      </ConfirmationModal>
    </div>
  );
}
