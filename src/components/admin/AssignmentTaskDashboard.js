'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, ClipboardCheck, FileText, Loader2, RefreshCw } from 'lucide-react';
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

export default function AssignmentTaskDashboard({ kind, title, description, endpoint }) {
  const { user, hasRole, hasPermission } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAssignmentId, setBusyAssignmentId] = useState(null);
  const [error, setError] = useState('');

  const isReviewerDashboard = kind === 'reviewer';
  const roleAllowed = hasRole('super_admin') || hasRole('admin') || hasRole(kind);

  const fetchAssignments = useCallback(async () => {
    if (!roleAllowed) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.get(endpoint);
      const data = res.data?.data || [];
      setAssignments(data);
      setSelectedId((current) => {
        if (current && data.some((item) => item.id === current)) return current;
        return data[0]?.id || null;
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Unable to load assignments.');
    } finally {
      setLoading(false);
    }
  }, [endpoint, roleAllowed]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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
      await fetchAssignments();
      setSelectedId(assignment.id);
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.message || 'Unable to accept review invitation.', 'error');
    } finally {
      setBusyAssignmentId(null);
    }
  };

  const renderAssignmentCard = (assignment, history = false) => {
    const article = assignment.article || {};
    const reviewerCount = article.reviewer_assignments?.length || 0;
    const completedReviews = article.reviewer_assignments?.filter((item) => item.status === 'completed').length || 0;
    const isSelected = selectedAssignment?.id === assignment.id;

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
            {isReviewerDashboard ? `${assignment.files?.length || 0} file(s)` : `${completedReviews}/${reviewerCount} reviews complete`}
          </span>
        </div>

        {history && assignment.recommendation && (
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Recommendation: {labelize(assignment.recommendation)}
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
        <EmptyState>This dashboard is available only to assigned {isReviewerDashboard ? 'Reviewers' : 'Sub Editors'} and Super Admin.</EmptyState>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-850 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Academic Workflow</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={fetchAssignments}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-850"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </header>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    {isReviewerDashboard ? 'Invitations and Pending Reviews' : 'Assigned Articles'}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{activeAssignments.length} active</span>
                </div>
                {activeAssignments.length === 0 ? (
                  <EmptyState>No active assignments are waiting in this queue.</EmptyState>
                ) : (
                  <div className="space-y-3">{activeAssignments.map((assignment) => renderAssignmentCard(assignment))}</div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Completed History</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{completedAssignments.length} completed</span>
                </div>
                {completedAssignments.length === 0 ? (
                  <EmptyState>No completed assignments yet.</EmptyState>
                ) : (
                  <div className="space-y-3">{completedAssignments.map((assignment) => renderAssignmentCard(assignment, true))}</div>
                )}
              </section>
            </div>

            <section className="min-w-0 rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900">
              {selectedAssignment?.article ? (
                <div className="space-y-4">
                  <div className="border-b border-zinc-100 pb-4 dark:border-zinc-850">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Selected Task</p>
                    <h2 className="mt-1 text-lg font-black text-zinc-950 dark:text-white">{selectedAssignment.article.title}</h2>
                  </div>
                  <WorkflowActionPanel
                    article={selectedAssignment.article}
                    workflowContext={selectedAssignment.article}
                    user={user}
                    hasRole={hasRole}
                    hasPermission={hasPermission}
                    onWorkflowChanged={fetchAssignments}
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
