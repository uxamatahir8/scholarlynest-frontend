'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Check, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import { formatDate } from '../../../utils/date';
import { useToast } from '../../../context/ToastContext';
import ConsolePageHeader from '../console/ConsolePageHeader';
import LoadingState from '../../ui/LoadingState';
import ErrorState from '../../ui/ErrorState';
import EmptyState from '../../ui/EmptyState';
import Pagination from '../../ui/Pagination';
import { Button } from '../../ui/Button';
import { ConfirmationModal } from '../../ui/ConfirmationModal';

const VALID_STATUS_FILTERS = new Set(['active', 'completed', 'pending']);

const statusLabel = (value) => {
  if (!value) return 'Not recorded';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function CopyEditorTaskList({
  observerMode = false,
  observerUser = null,
  observerParams = {},
}) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get('page') || 1);
  const statusParam = searchParams.get('status') || 'active';
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const status = VALID_STATUS_FILTERS.has(statusParam) ? statusParam : 'active';

  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmTask, setConfirmTask] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  const queryParams = useMemo(() => ({
    role: 'copy_editor',
    status,
    page,
    per_page: 15,
    ...observerParams,
  }), [status, page, observerParams]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'active' || (key === 'page' && Number(value) === 1)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
      next.delete('page');
    }
    const queryString = next.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/my-production-assignments', { params: queryParams });
      setTasks(response.data?.data || []);
      setMeta({
        current_page: response.data?.current_page || 1,
        last_page: response.data?.last_page || 1,
        total: response.data?.total || 0,
        per_page: response.data?.per_page || 15,
      });
    } catch (err) {
      logError('Failed to load copyediting tasks:', err);
      setError(safeApiMessage(err, 'Unable to load copyediting tasks.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (statusParam !== status) {
      updateQuery({ status: 'active', page: 1 });
      return;
    }
    loadTasks();
  }, [queryParams, statusParam, status]);

  const completeTask = async () => {
    if (!confirmTask) return;
    try {
      setCompletingId(confirmTask.id);
      await api.post(`/admin/production-assignments/${confirmTask.id}/complete`);
      toast('Copyediting task marked complete.', 'success');
      setConfirmTask(null);
      await loadTasks();
    } catch (err) {
      logError('Failed to complete copyediting task:', err);
      toast(safeApiMessage(err, 'Unable to complete this copyediting task.'), 'error');
    } finally {
      setCompletingId(null);
    }
  };

  const start = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const end = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <div className="space-y-8">
      <ConsolePageHeader
        title={observerMode && observerUser ? `${observerUser.name}'s Copyediting Tasks` : 'Copy Editor Desk'}
        description="Review assigned copyediting tasks, open manuscript context, and complete your own active production work."
      />

      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Task status
            <select
              value={status}
              onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}
              className="mt-1 block min-h-10 min-w-48 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <option value="active">Active Tasks</option>
              <option value="pending">Pending Only</option>
              <option value="completed">Recently Completed</option>
            </select>
          </label>
          <p className="text-sm text-[var(--muted)]">
            Showing {start}-{end} of {meta.total} copyediting tasks.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" icon={RefreshCw} onClick={loadTasks} isLoading={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <LoadingState label="Loading copyediting tasks..." className="min-h-[320px]" />
      ) : error ? (
        <ErrorState title="Copyediting tasks could not be loaded">{error}</ErrorState>
      ) : tasks.length === 0 ? (
        <EmptyState title="No copyediting tasks found">
          There are no copyediting assignments matching the selected filter.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="divide-y divide-[var(--border)]">
            {tasks.map((task) => {
              const article = task.article || {};
              const isCompleted = task.status === 'completed' || task.completed_at;
              const workflowHref = article.id
                ? `/admin/articles/${article.id}/workflow${observerMode ? '?observer_readonly=1' : ''}`
                : '/admin/copy-editor';
              return (
                <article key={task.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                        {statusLabel(task.status)}
                      </span>
                      <span className="text-xs font-medium text-[var(--muted)]">
                        Article status: {statusLabel(article.status)}
                      </span>
                      {task.is_overdue && (
                        <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-bold text-red-650">Overdue</span>
                      )}
                    </div>
                    <h2 className="truncate text-base font-bold text-[var(--foreground)]">{article.title || 'Untitled manuscript'}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                      <span>{article.magazine?.title || 'Magazine not recorded'}</span>
                      <span>Assigned {formatDate(task.created_at)}</span>
                      <span>Due {formatDate(task.due_date)}</span>
                      {task.completed_at && <span>Completed {formatDate(task.completed_at)}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                    <Link
                      href={workflowHref}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Open Copyediting Task
                    </Link>
                    <Link
                      href={workflowHref}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      Open Manuscript
                    </Link>
                    {!observerMode && !isCompleted && (
                      <Button
                        type="button"
                        size="sm"
                        icon={Check}
                        onClick={() => setConfirmTask(task)}
                        isLoading={completingId === task.id}
                      >
                        Mark Copyediting Complete
                      </Button>
                    )}
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
        label="Copyediting task pages"
      />

      <ConfirmationModal
        isOpen={Boolean(confirmTask)}
        title="Mark this copyediting task as complete?"
        confirmText="Mark Complete"
        variant="primary"
        isLoading={Boolean(completingId)}
        onConfirm={completeTask}
        onCancel={() => setConfirmTask(null)}
      >
        The manuscript will move to the next available production stage according to the current workflow.
      </ConfirmationModal>
    </div>
  );
}
