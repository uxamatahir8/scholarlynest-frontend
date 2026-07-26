'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, CloudUpload, FileCheck2, Newspaper, RefreshCw } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import { Button } from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import ErrorState from '../../ui/ErrorState';
import LoadingState from '../../ui/LoadingState';
import PublicationStatusBadge from './PublicationStatusBadge';
import { authorsLine, issueDate, issueLabel } from './publicationUtils';

const EMPTY_PARAMS = {};

function ArticleQueueRow({ article, label }) {
  return (
    <article className="grid gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-[var(--foreground)]">{article.title}</h3>
          <PublicationStatusBadge status={article.status} />
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">{authorsLine(article)}</p>
        <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
          {article.magazine?.title || 'Magazine not listed'}{article.issue ? ` · ${issueLabel(article.issue)}` : ' · Issue not assigned'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <Link
          href={`/admin/articles/${article.id}/workflow`}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          Open Workflow
        </Link>
        <Link
          href={`/admin/issues?magazine_id=${article.magazine_id}${article.magazine_issue_id ? `&issue_id=${article.magazine_issue_id}` : ''}`}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          {label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default function PublisherOperationsWorkspace({
  observerMode = false,
  observerUser = null,
  observerParams = EMPTY_PARAMS,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState({ magazines: [], ready_articles: [], published_articles: [], issues: [], counts: {} });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/publisher-dashboard', { params: observerParams });
      setDashboard({
        magazines: response.data?.magazines || [],
        ready_articles: response.data?.ready_articles || [],
        published_articles: response.data?.published_articles || [],
        issues: response.data?.issues || [],
        counts: response.data?.counts || {},
      });
    } catch (err) {
      logError('Failed to load publisher operations:', err);
      setError(safeApiMessage(err, 'Unable to load publisher workspace.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/admin/publisher-dashboard', { params: observerParams });
        if (!active) return;
        setDashboard({
          magazines: response.data?.magazines || [],
          ready_articles: response.data?.ready_articles || [],
          published_articles: response.data?.published_articles || [],
          issues: response.data?.issues || [],
          counts: response.data?.counts || {},
        });
      } catch (err) {
        logError('Failed to load publisher operations:', err);
        if (active) setError(safeApiMessage(err, 'Unable to load publisher workspace.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [observerParams]);

  const unplacedReady = useMemo(
    () => dashboard.ready_articles.filter((article) => !article.magazine_issue_id),
    [dashboard.ready_articles],
  );
  const issueReady = useMemo(
    () => dashboard.ready_articles.filter((article) => article.magazine_issue_id),
    [dashboard.ready_articles],
  );

  if (loading) {
    return <LoadingState label="Loading publisher desk..." className="min-h-[420px]" />;
  }

  if (error) {
    return <ErrorState title="Publisher desk could not be loaded">{error}</ErrorState>;
  }

  return (
    <main className="space-y-6">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Publisher Workspace</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {observerMode && observerUser ? `${observerUser.name} Publication Desk` : 'Publication Operations Desk'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Review publication-ready manuscripts, issue placement needs, and recent publication records within the current magazine scope.
            </p>
          </div>
          {!observerMode && <div className="flex flex-wrap gap-2"><Link href="/admin/direct-publications" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"><CloudUpload className="h-4 w-4"/> Direct Publications</Link><Button type="button" variant="outline" icon={RefreshCw} onClick={loadDashboard}>Refresh</Button></div>}
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Assigned Magazines', value: dashboard.counts.magazines, icon: BookOpen },
            { label: 'Ready Manuscripts', value: dashboard.counts.ready_articles, icon: FileCheck2 },
            { label: 'Published Articles', value: dashboard.counts.published_articles, icon: CheckCircle2 },
            { label: 'Issues', value: dashboard.counts.issues, icon: Newspaper },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <item.icon className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <dt className="mt-3 text-xs font-semibold text-[var(--muted)]">{item.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-[var(--foreground)]">{item.value ?? 0}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Primary Publication Priority</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Accepted or publication-ready manuscripts that need issue placement or publication metadata.</p>
            </div>
            {dashboard.ready_articles.length === 0 ? (
              <EmptyState icon={FileCheck2} title="No manuscripts are ready for publication." className="m-5">
                Accepted manuscripts will appear here when they can move to publication handling.
              </EmptyState>
            ) : (
              <div>
                {dashboard.ready_articles.map((article) => (
                  <ArticleQueueRow key={article.id} article={article} label={article.magazine_issue_id ? 'Review Issue' : 'Assign to Issue'} />
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Recent Publication Activity</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Recently published articles visible to this publisher scope.</p>
            </div>
            {dashboard.published_articles.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No recent publication records." className="m-5">
                Publication records will appear here after articles are published.
              </EmptyState>
            ) : (
              <div>
                {dashboard.published_articles.slice(0, 8).map((article) => (
                  <ArticleQueueRow key={article.id} article={article} label="Open Issue" />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-bold text-[var(--foreground)]">Issues Requiring Attention</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Recent issues in the visible magazine scope.</p>
            {dashboard.issues.length === 0 ? (
              <EmptyState icon={Newspaper} title="No issues visible." className="mt-4">
                Create an issue before publishing into a table of contents.
              </EmptyState>
            ) : (
              <div className="mt-4 space-y-3">
                {dashboard.issues.slice(0, 6).map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/admin/issues?magazine_id=${issue.magazine_id}&issue_id=${issue.id}`}
                    className="block rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--foreground)]">{issueLabel(issue)}</h3>
                        <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{issue.magazine?.title}</p>
                      </div>
                      <PublicationStatusBadge status={issue.status} />
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">{issueDate(issue)} · {issue.articles_count || 0} article(s)</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-bold text-[var(--foreground)]">Placement Summary</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs font-semibold text-[var(--muted)]">Needs issue placement</p>
                <p className="mt-1 text-xl font-bold text-[var(--foreground)]">{unplacedReady.length}</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs font-semibold text-[var(--muted)]">Already assigned to issue</p>
                <p className="mt-1 text-xl font-bold text-[var(--foreground)]">{issueReady.length}</p>
              </div>
            </div>
            {!observerMode && (
              <Link
                href="/admin/issues"
                className="mt-4 inline-flex w-full min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                Open Issue Manager <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
