'use client';

import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, FileCheck2, Loader2, Newspaper, RefreshCw } from 'lucide-react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { STATUS_META, STATUS_TONE_CLASSES } from '../../../components/admin/articleWorkflow';

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function issueLabel(issue) {
  if (!issue) return 'No issue assigned';
  const volume = issue.volume_number ? `Vol. ${issue.volume_number}` : 'Volume not set';
  const number = issue.issue_number ? `Issue ${issue.issue_number}` : 'Issue not set';
  return issue.special_title ? `${volume}, ${number}: ${issue.special_title}` : `${volume}, ${number}`;
}

function statusLabel(status) {
  return STATUS_META[status]?.[0] || String(status || 'unknown').replaceAll('_', ' ');
}

function StatusBadge({ status }) {
  const [, tone] = STATUS_META[status] || ['Unknown', 'zinc'];
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUS_TONE_CLASSES[tone] || STATUS_TONE_CLASSES.zinc}`}>
      {statusLabel(status)}
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

function SummaryTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">{label}</span>
        <Icon className="h-4 w-4 text-amber-600" />
      </div>
      <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{value ?? 0}</p>
    </div>
  );
}

function ArticleRow({ article }) {
  return (
    <div className="rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-zinc-950 dark:text-white">{article.title || 'Untitled article'}</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
            {article.magazine?.title || 'Magazine not assigned'} · {issueLabel(article.issue)}
          </p>
        </div>
        <StatusBadge status={article.status} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] font-medium text-zinc-500 sm:grid-cols-3">
        <span>DOI: {article.doi || 'Not assigned'}</span>
        <span>Published: {article.published_month || 'Month'} {article.published_year || 'Year'}</span>
        <span>Pages: {article.page_start && article.page_end ? `${article.page_start}-${article.page_end}` : 'Not assigned'}</span>
      </div>
      {article.citation?.text && (
        <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-350">{article.citation.text}</p>
      )}
    </div>
  );
}

export default function PublisherDashboardPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const roleAllowed = hasRole('publisher') || hasRole('super_admin') || hasRole('admin');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState({ magazines: [], ready_articles: [], published_articles: [], issues: [], counts: {} });
  const currentYear = new Date().getFullYear();
  const [publishForm, setPublishForm] = useState({
    article_id: '',
    magazine_issue_id: '',
    doi: '',
    published_month: '',
    published_year: String(currentYear),
    page_start: '',
    page_end: '',
  });

  const fetchDashboard = useCallback(async () => {
    if (!roleAllowed) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.get('/admin/publisher-dashboard');
      const nextDashboard = {
        magazines: res.data?.magazines || [],
        ready_articles: res.data?.ready_articles || [],
        published_articles: res.data?.published_articles || [],
        issues: res.data?.issues || [],
        counts: res.data?.counts || {},
      };
      setDashboard(nextDashboard);
      setPublishForm((current) => ({
        ...current,
        article_id: current.article_id || String(nextDashboard.ready_articles[0]?.id || ''),
      }));
    } catch (err) {
      logError(err);
      setError(safeApiMessage(err, 'Unable to load publisher dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [roleAllowed]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const selectedArticle = useMemo(
    () => dashboard.ready_articles.find((article) => String(article.id) === String(publishForm.article_id)),
    [dashboard.ready_articles, publishForm.article_id]
  );

  const issueOptions = useMemo(() => {
    if (!selectedArticle?.magazine_id) return dashboard.issues;
    return dashboard.issues.filter((issue) => Number(issue.magazine_id) === Number(selectedArticle.magazine_id));
  }, [dashboard.issues, selectedArticle]);

  const canSubmitPublish = publishForm.article_id && publishForm.published_month.trim() && publishForm.published_year;

  const submitPublish = async () => {
    if (!canSubmitPublish) return;
    setPublishing(true);
    try {
      await api.post(`/admin/articles/${publishForm.article_id}/publish`, {
        magazine_issue_id: publishForm.magazine_issue_id ? Number(publishForm.magazine_issue_id) : null,
        doi: publishForm.doi || null,
        published_month: publishForm.published_month,
        published_year: Number(publishForm.published_year),
        page_start: publishForm.page_start ? Number(publishForm.page_start) : null,
        page_end: publishForm.page_end ? Number(publishForm.page_end) : null,
      });
      toast('Article published.', 'success');
      setPublishForm({
        article_id: '',
        magazine_issue_id: '',
        doi: '',
        published_month: '',
        published_year: String(currentYear),
        page_start: '',
        page_end: '',
      });
      await fetchDashboard();
    } catch (err) {
      logError(err);
      toast(safeApiMessage(err, 'Unable to publish article.'), 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (!roleAllowed) {
    return <EmptyState>This dashboard is available only to Publishers and Super Admin.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-850 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Academic Workflow</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">Publisher Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">Track assigned magazines, ready manuscripts, active issues, and recently published records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/issues" className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
            <Newspaper className="h-3.5 w-3.5" />
            Issue Manager
          </Link>
          <button type="button" onClick={fetchDashboard} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-850">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
      ) : error ? (
        <EmptyState>{error}</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SummaryTile label="Magazines" value={dashboard.counts.magazines} icon={BookOpen} />
            <SummaryTile label="Ready Articles" value={dashboard.counts.ready_articles} icon={FileCheck2} />
            <SummaryTile label="Published" value={dashboard.counts.published_articles} icon={CheckCircle2} />
            <SummaryTile label="Issues" value={dashboard.counts.issues} icon={Newspaper} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Assigned Magazines</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{dashboard.magazines.length} total</span>
                </div>
                {dashboard.magazines.length === 0 ? <EmptyState>No publisher magazine assignments found.</EmptyState> : (
                  <div className="space-y-2">
                    {dashboard.magazines.map((magazine) => (
                      <div key={magazine.id} className="rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900">
                        <p className="text-sm font-black text-zinc-950 dark:text-white">{magazine.title}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">/{magazine.slug}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Issues</h2>
                  <Link href="/admin/issues" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:underline">Manage <ArrowRight className="h-3 w-3" /></Link>
                </div>
                {dashboard.issues.length === 0 ? <EmptyState>No issues have been created yet.</EmptyState> : (
                  <div className="space-y-2">
                    {dashboard.issues.map((issue) => (
                      <div key={issue.id} className="rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900">
                        <p className="text-sm font-black text-zinc-950 dark:text-white">{issueLabel(issue)}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">{issue.magazine?.title || 'Magazine'} · {issue.status || 'draft'} · {issue.articles_count || 0} article(s)</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Publish Article</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{dashboard.ready_articles.length} eligible</span>
                </div>
                {dashboard.ready_articles.length === 0 ? <div className="mt-4"><EmptyState>No eligible articles are waiting for publication.</EmptyState></div> : (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <select value={publishForm.article_id} onChange={(event) => setPublishForm({ ...publishForm, article_id: event.target.value, magazine_issue_id: '' })} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                      {dashboard.ready_articles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}
                    </select>
                    <select value={publishForm.magazine_issue_id} onChange={(event) => setPublishForm({ ...publishForm, magazine_issue_id: event.target.value })} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                      <option value="">No issue</option>
                      {issueOptions.map((issue) => <option key={issue.id} value={issue.id}>{issueLabel(issue)}</option>)}
                    </select>
                    <input value={publishForm.doi} onChange={(event) => setPublishForm({ ...publishForm, doi: event.target.value })} placeholder="DOI" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
                    <input value={publishForm.published_month} onChange={(event) => setPublishForm({ ...publishForm, published_month: event.target.value })} placeholder="Publication month" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
                    <input type="number" min="2000" max={currentYear} value={publishForm.published_year} onChange={(event) => setPublishForm({ ...publishForm, published_year: event.target.value })} placeholder="Year" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" min="1" value={publishForm.page_start} onChange={(event) => setPublishForm({ ...publishForm, page_start: event.target.value })} placeholder="Page start" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
                      <input type="number" min="1" value={publishForm.page_end} onChange={(event) => setPublishForm({ ...publishForm, page_end: event.target.value })} placeholder="Page end" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
                    </div>
                    <button type="button" disabled={!canSubmitPublish || publishing} onClick={submitPublish} className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 md:col-span-2">
                      {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCheck2 className="h-3.5 w-3.5" />}
                      Publish Article
                    </button>
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Ready For Publication</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{dashboard.ready_articles.length} waiting</span>
                </div>
                {dashboard.ready_articles.length === 0 ? <EmptyState>No ready articles.</EmptyState> : dashboard.ready_articles.map((article) => <ArticleRow key={article.id} article={article} />)}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Recently Published</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{dashboard.published_articles.length} records</span>
                </div>
                {dashboard.published_articles.length === 0 ? <EmptyState>No published records yet.</EmptyState> : dashboard.published_articles.map((article) => <ArticleRow key={article.id} article={article} />)}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
