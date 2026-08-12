'use client';

import { Select } from '../../ui/Input';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, FileText, RotateCw, Search } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import { formatDate } from '../../../utils/date';
import ConsolePageHeader from '../console/ConsolePageHeader';
import LoadingState from '../../ui/LoadingState';
import EmptyState from '../../ui/EmptyState';
import Pagination from '../../ui/Pagination';
import Alert from '../../ui/Alert';
import DeskRecordMetadata from '../desk-observer/DeskRecordMetadata';

const STATUS_OPTIONS = [
  ['all', 'All Editorial Work'],
  ['submitted', 'New Submissions'],
  ['screening', 'Screening'],
  ['under_review', 'Editorial Review'],
  ['assigned_to_sub_editor', 'Sub Editor Review'],
  ['reviewer_assigned', 'Reviewer Assigned'],
  ['review_in_progress', 'Peer Review'],
  ['resubmitted', 'Resubmitted'],
  ['accepted', 'Accepted'],
];
const VALID_STATUSES = new Set(STATUS_OPTIONS.map(([value]) => value));

const labelize = (value) => String(value || 'Not recorded')
  .replaceAll('_', ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const actionLabel = (status) => {
  if (status === 'submitted' || status === 'screening') return 'Start Screening';
  if (['under_review', 'assigned_to_sub_editor', 'reviewer_assigned', 'review_in_progress', 'resubmitted'].includes(status)) return 'Continue Review';
  if (status === 'accepted') return 'View Accepted Manuscript';
  return 'Open Workflow';
};

export default function EditorDeskList({ observerMode = false, observerUser = null, observerParams = {} }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const requestedStatus = searchParams.get('status') || 'all';
  const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : 'all';
  const search = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(search);
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => ({
    page,
    per_page: 20,
    ...(status !== 'all' ? { status } : {}),
    ...(search ? { search } : {}),
    ...observerParams,
  }), [page, status, search, observerParams]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || (key === 'status' && value === 'all') || (key === 'page' && Number(value) === 1)) next.delete(key);
      else next.set(key, String(value));
    });
    if ('status' in updates || 'search' in updates) next.delete('page');
    router.push(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/articles', { params });
      setArticles(response.data?.data || []);
      setMeta({
        current_page: response.data?.current_page || 1,
        last_page: response.data?.last_page || 1,
        total: response.data?.total || 0,
        per_page: response.data?.per_page || 20,
      });
    } catch (err) {
      logError('Failed to load Editor Desk:', err);
      setError(safeApiMessage(err, 'Unable to load editorial manuscripts.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArticles(); }, [params]);

  const start = meta.total ? ((meta.current_page - 1) * meta.per_page) + 1 : 0;
  const end = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <div className="space-y-8">
      <ConsolePageHeader
        title={observerMode && observerUser ? `${observerUser.name}'s Editor Desk` : 'Editor Desk'}
        description="Screen submissions, coordinate peer review, and record editorial decisions."
      />

      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={(event) => { event.preventDefault(); updateQuery({ search: searchInput, page: 1 }); }} className="flex flex-1 gap-2">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search editorial manuscripts..." className="min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
          </div>
          <button type="submit" className="min-h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">Search</button>
        </form>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onChange={(event) => updateQuery({ status: event.target.value, page: 1 })} className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-medium">
            {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <span className="text-xs font-medium text-[var(--muted)]">Showing {start}-{end} of {meta.total}</span>
          <button type="button" onClick={loadArticles} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold">
            <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && <Alert tone="danger" title="Editor Desk could not be loaded">{error}</Alert>}
      {loading && articles.length === 0 ? (
        <LoadingState label="Loading editorial manuscripts..." className="min-h-[280px]" />
      ) : articles.length === 0 ? (
        <EmptyState title="No editorial manuscripts found" className="py-12">No manuscripts match the selected status or search.</EmptyState>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => {
            const workflowHref = `/admin/articles/${article.id}/workflow${observerMode ? '?observer_readonly=1' : ''}`;
            return (
              <article key={article.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">{labelize(article.status)}</span>
                      {(article.latest_tracking_code || article.tracking_code) && <span className="text-xs font-semibold text-[var(--muted)]">{article.latest_tracking_code || article.tracking_code}</span>}
                    </div>
                    <h2 className="text-base font-bold text-[var(--foreground)]"><Link href={workflowHref} className="hover:text-[var(--accent)] hover:underline">{article.title}</Link></h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                      <span className="font-medium text-[var(--foreground)]">{article.magazine?.title || 'Magazine not assigned'}</span>
                      <span>Submitted {formatDate(article.latest_submission_at || article.created_at)}</span>
                      {article.user?.name && <span>Author: {article.user.name}</span>}
                    </div>
                    {observerMode && (
                      <DeskRecordMetadata
                        trackingCode={article.latest_tracking_code || article.tracking_code}
                        assigneeName={observerUser?.name}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={workflowHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"><FileText className="h-4 w-4" />{actionLabel(article.status)}</Link>
                    <Link href={workflowHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold"><ExternalLink className="h-4 w-4" />Open Workspace</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Pagination currentPage={meta.current_page} totalPages={meta.last_page} onPageChange={(nextPage) => updateQuery({ page: nextPage })} label="Editor Desk pages" />
    </div>
  );
}
