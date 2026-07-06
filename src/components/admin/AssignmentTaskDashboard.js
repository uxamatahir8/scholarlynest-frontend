'use client';

import { safeApiMessage } from '../../utils/safeErrors';
import { logError } from '../../utils/safeLogger';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Calendar, CheckCircle2, ClipboardCheck, FileText,
  Loader2, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import WorkflowActionPanel from './WorkflowActionPanel';
import { STATUS_META, STATUS_TONE_CLASSES } from './articleWorkflow';

const completedStatuses = new Set(['completed']);
const activeStatuses = new Set(['accepted', 'in_progress', 'reopened']);

function formatDate(value) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function labelize(value) {
  return String(value || 'pending').replaceAll('_', ' ');
}

function StatusBadge({ status }) {
  const [label, tone] = STATUS_META[status] || [labelize(status), 'zinc'];
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUS_TONE_CLASSES[tone] || STATUS_TONE_CLASSES.zinc}`}>
      {label}
    </span>
  );
}

function AssignmentBadge({ status }) {
  const tone = status === 'completed' ? 'emerald' : status === 'pending' ? 'amber' : activeStatuses.has(status) ? 'cyan' : 'zinc';
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUS_TONE_CLASSES[tone] || STATUS_TONE_CLASSES.zinc}`}>
      {labelize(status)}
    </span>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}

/** Pagination bar – matches the style used on other admin list pages */
function PaginationBar({ currentPage, lastPage, total, perPage, onPageChange, loading }) {
  if (lastPage <= 1) return null;

  const from = (currentPage - 1) * perPage + 1;
  const to   = Math.min(currentPage * perPage, total);

  // Build compact page window: prev, current±2, next
  const pages = [];
  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || Math.abs(i - currentPage) <= 2) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
      <p className="text-[10px] font-semibold text-zinc-400 font-mono">
        Showing {from}–{to} of {total} assignments
      </p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === '…' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-zinc-400 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={loading}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-40 ${
                p === currentPage
                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage || loading}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AssignmentTaskDashboard({ kind, title, description, endpoint }) {
  const { user, hasRole, hasPermission } = useAuth();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAssignmentId, setBusyAssignmentId] = useState(null);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [perPage, setPerPage]         = useState(15);

  const isReviewerDashboard   = kind === 'reviewer';
  const isProductionDashboard = ['copy_editor', 'proofreader'].includes(kind);
  const dashboardRoleLabel    = kind === 'reviewer' ? 'Reviewers' : kind === 'copy_editor' ? 'Copy Editors' : kind === 'proofreader' ? 'Proofreaders' : 'Sub Editors';
  const roleAllowed           = hasRole('super_admin') || hasRole('admin') || hasRole(kind);

  const fetchAssignments = useCallback(async (page = 1) => {
    if (!roleAllowed) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Build URL – preserve any existing query params on endpoint (e.g. role=copy_editor)
      const sep = endpoint.includes('?') ? '&' : '?';
      const res = await api.get(`${endpoint}${sep}page=${page}&per_page=15`);

      const newData     = res.data?.data      || [];
      const newLastPage = res.data?.last_page  ?? 1;
      const newTotal    = res.data?.total      ?? newData.length;
      const newPerPage  = res.data?.per_page   ?? newData.length;

      setAssignments(newData);
      setCurrentPage(res.data?.current_page ?? page);
      setLastPage(newLastPage);
      setTotal(newTotal);
      setPerPage(newPerPage);

      setSelectedId((current) => {
        if (current && newData.some((item) => item.id === current)) return current;
        return newData[0]?.id || null;
      });
    } catch (err) {
      logError(err);
      setError(safeApiMessage(err, 'Unable to load assignments.'));
    } finally {
      setLoading(false);
    }
  }, [endpoint, roleAllowed]);

  useEffect(() => {
    setCurrentPage(1);
    fetchAssignments(1);
  }, [endpoint]);

  const handlePageChange = (page) => {
    if (page < 1 || page > lastPage || page === currentPage) return;
    setCurrentPage(page);
    fetchAssignments(page);
    // Scroll the left panel back to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedAssignment = useMemo(
    () => assignments.find((item) => item.id === selectedId) || null,
    [assignments, selectedId]
  );

  const activeAssignments = useMemo(
    () => assignments.filter((item) => !completedStatuses.has(item.status)),
    [assignments]
  );

  const completedAssignments = useMemo(
    () => assignments.filter((item) => completedStatuses.has(item.status)),
    [assignments]
  );

  const acceptReview = async (assignment) => {
    setBusyAssignmentId(assignment.id);
    try {
      await api.post(`/admin/reviewer-assignments/${assignment.id}/accept`);
      toast('Review invitation accepted.', 'success');
      await fetchAssignments(currentPage);
      setSelectedId(assignment.id);
    } catch (err) {
      logError(err);
      toast(safeApiMessage(err, 'Unable to accept review invitation.'), 'error');
    } finally {
      setBusyAssignmentId(null);
    }
  };

  const renderAssignmentCard = (assignment, history = false) => {
    const article        = assignment.article || {};
    const reviewerCount  = article.reviewer_assignments?.length || 0;
    const completedReviews = article.reviewer_assignments?.filter((item) => item.status === 'completed').length || 0;
    const isSelected     = selectedAssignment?.id === assignment.id;

    return (
      <article
        key={assignment.id}
        className={`rounded-xl border bg-white p-4 shadow-sm transition-colors dark:bg-zinc-900 ${isSelected ? 'border-amber-400/50 ring-1 ring-amber-400/30' : 'border-zinc-150 dark:border-zinc-850'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-zinc-950 dark:text-white">{article.title || 'Untitled article'}</h3>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
              {article.magazine?.title || 'Magazine not assigned'}
            </p>
          </div>
          {assignment.is_overdue && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-500/10 bg-red-500/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-red-500">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={article.status} />
          <AssignmentBadge status={assignment.status} />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] font-medium text-zinc-500 sm:grid-cols-2">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(assignment.due_date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {isReviewerDashboard || isProductionDashboard ? `${assignment.files?.length || 0} file(s)` : `${completedReviews}/${reviewerCount} reviews complete`}
          </span>
        </div>

        {history && assignment.recommendation && (
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Recommendation: {labelize(assignment.recommendation)}
          </p>
        )}

        {history && isProductionDashboard && assignment.completed_at && (
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Completed: {formatDate(assignment.completed_at)}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedId(assignment.id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            {history ? 'View Task' : 'Open Task'}
          </button>
          {article.id && (
            <Link
              href={`/admin/articles/${article.id}/workflow`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 transition-colors hover:bg-amber-500/[0.1]"
            >
              <FileText className="h-3.5 w-3.5" />
              Open Workflow
            </Link>
          )}
          {isReviewerDashboard && assignment.status === 'pending' && (
            <button
              type="button"
              disabled={busyAssignmentId === assignment.id}
              onClick={() => acceptReview(assignment)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-500/[0.1] disabled:opacity-50"
            >
              {busyAssignmentId === assignment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Accept
            </button>
          )}
        </div>
      </article>
    );
  };

  if (!roleAllowed) {
    return (
      <div className="h-full overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-950">
        <EmptyState>This dashboard is available only to assigned {dashboardRoleLabel} and Super Admin.</EmptyState>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50/10 p-4 dark:bg-zinc-950/10 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-850 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-605">Academic Workflow</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-555">{description}</p>
          </div>
          <div className="flex items-center gap-3">
            {total > 0 && (
              <span className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider">
                {total} total
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchAssignments(currentPage)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-250 dark:hover:bg-zinc-850 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
            {/* Left panel – assignment list */}
            <div className="space-y-6">
              {/* Active / in-progress assignments */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    {isReviewerDashboard ? 'Invitations and Pending Reviews' : isProductionDashboard ? 'Assigned Production Tasks' : 'Assigned Articles'}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{activeAssignments.length} active</span>
                </div>
                {activeAssignments.length === 0 ? (
                  <EmptyState>No active assignments are waiting in this queue.</EmptyState>
                ) : (
                  <div className="space-y-3">{activeAssignments.map((assignment) => renderAssignmentCard(assignment))}</div>
                )}
              </section>

              {/* Completed history */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-805 dark:text-zinc-205">Completed History</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{completedAssignments.length} completed</span>
                </div>
                {completedAssignments.length === 0 ? (
                  <EmptyState>No completed assignments yet.</EmptyState>
                ) : (
                  <div className="space-y-3">{completedAssignments.map((assignment) => renderAssignmentCard(assignment, true))}</div>
                )}
              </section>

              {/* Pagination controls */}
              <PaginationBar
                currentPage={currentPage}
                lastPage={lastPage}
                total={total}
                perPage={perPage}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </div>

            {/* Right panel – selected assignment details */}
            <section className="min-w-0 rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 xl:sticky xl:top-6 self-start">
              {selectedAssignment?.article ? (
                <div className="space-y-4">
                  <div className="border-b border-zinc-100 pb-4 dark:border-zinc-850">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Selected Task</p>
                    <h2 className="mt-1 text-lg font-black text-zinc-950 dark:text-white">{selectedAssignment.article.title}</h2>
                  </div>
                  <WorkflowActionPanel
                    article={selectedAssignment.article}
                    workflowContext={{ ...selectedAssignment.article, current_assignment: selectedAssignment }}
                    user={user}
                    hasRole={hasRole}
                    hasPermission={hasPermission}
                    onWorkflowChanged={() => fetchAssignments(currentPage)}
                    onOpenPublish={() => {}}
                    toast={toast}
                  />
                </div>
              ) : (
                <EmptyState>Select an assignment to view files and workflow actions.</EmptyState>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
