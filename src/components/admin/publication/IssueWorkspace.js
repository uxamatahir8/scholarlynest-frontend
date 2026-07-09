'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, CheckCircle2, ChevronRight, FileText, Loader2, Newspaper, Plus, RefreshCw, Upload } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../ui/Button';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import EmptyState from '../../ui/EmptyState';
import ErrorState from '../../ui/ErrorState';
import LoadingState from '../../ui/LoadingState';
import Pagination from '../../ui/Pagination';
import PublicationStatusBadge from './PublicationStatusBadge';
import { authorsLine, compactText, issueDate, issueLabel, issueStatusOptions, MONTHS } from './publicationUtils';
import { uploadAndAwaitClean } from '../../../lib/mediaUploads/DirectUploadClient';

const emptyIssueForm = {
  id: null,
  magazine_id: '',
  volume_number: '',
  issue_number: '',
  issue_month: '',
  issue_year: new Date().getFullYear(),
  special_title: '',
  description: '',
  status: 'draft',
  cover_image: null,
};

function publicationFormDefaults(article, selectedIssue) {
  return {
    doi: article?.doi || '',
    page_start: article?.page_start || '',
    page_end: article?.page_end || '',
    publication_pdf: null,
    published_year: article?.published_year || selectedIssue?.issue_year || new Date().getFullYear(),
    published_month: article?.published_month || selectedIssue?.issue_month || MONTHS[new Date().getMonth()],
  };
}

export default function IssueWorkspace() {
  const { user, loading: authLoading, hasRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef(null);
  const [issues, setIssues] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [eligibleArticles, setEligibleArticles] = useState([]);
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [articleForms, setArticleForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingIssue, setSavingIssue] = useState(false);
  const [publishingArticleId, setPublishingArticleId] = useState(null);
  const [issueAction, setIssueAction] = useState(null);
  const [articleAction, setArticleAction] = useState(null);
  const [latestCitation, setLatestCitation] = useState('');

  const canUsePage = hasRole('publisher') || hasRole('editor') || hasRole('magazine_editor') || hasRole('magazine-editor') || hasRole('super_admin') || hasRole('admin');
  const canPublishIssues = hasRole('publisher') || hasRole('super_admin') || hasRole('admin');
  const magazineFilter = searchParams.get('magazine_id') || '';
  const selectedIssueId = searchParams.get('issue_id') || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const totalPages = Math.max(1, Number(searchParams.get('pages') || 1));

  const currentMagazine = useMemo(
    () => magazines.find((magazine) => String(magazine.id) === String(magazineFilter || issueForm.magazine_id)),
    [magazines, magazineFilter, issueForm.magazine_id],
  );

  const issueArticles = selectedIssue?.articles || [];
  const unplacedEligibleArticles = eligibleArticles.filter((article) => !article.magazine_issue_id);
  const selectedIssueEligibleArticles = eligibleArticles.filter((article) => Number(article.magazine_issue_id) === Number(selectedIssue?.id));
  const otherIssueArticles = eligibleArticles.filter((article) => article.magazine_issue_id && Number(article.magazine_issue_id) !== Number(selectedIssue?.id));

  const updateQuery = (patch) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') params.delete(key);
      else params.set(key, String(value));
    });
    router.push(`/admin/issues?${params.toString()}`);
  };

  const loadWorkspace = async () => {
    if (!canUsePage) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const [magazinesRes, issuesRes] = await Promise.all([
        api.get('/admin/issues/magazines'),
        api.get('/admin/issues', { params: { page, per_page: 12, magazine_id: magazineFilter || undefined } }),
      ]);
      const nextMagazines = magazinesRes.data?.data || [];
      const issuePage = issuesRes.data || {};
      setMagazines(nextMagazines);
      setIssues(issuePage.data || []);
      if (issuePage.last_page && issuePage.last_page !== totalPages) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('pages', String(issuePage.last_page));
        router.replace(`/admin/issues?${params.toString()}`);
      }
      if (!issueForm.magazine_id && nextMagazines[0]) {
        setIssueForm((prev) => ({ ...prev, magazine_id: String(magazineFilter || nextMagazines[0].id) }));
      }
    } catch (err) {
      logError('Failed to load issue workspace:', err);
      setError(safeApiMessage(err, 'Unable to load issue workspace.'));
    } finally {
      setLoading(false);
    }
  };

  const loadIssueDetail = async () => {
    if (!selectedIssueId || !canUsePage) {
      setSelectedIssue(null);
      return;
    }

    try {
      const response = await api.get(`/admin/issues/${selectedIssueId}`);
      setSelectedIssue(response.data?.issue || null);
    } catch (err) {
      logError('Failed to load issue detail:', err);
      setSelectedIssue(null);
      toast(safeApiMessage(err, 'Unable to load issue detail.'), 'error');
    }
  };

  const loadEligibleArticles = async () => {
    if (!canUsePage) return;
    try {
      const response = await api.get('/admin/issues/eligible-articles', {
        params: selectedIssueId ? { issue_id: selectedIssueId } : { magazine_id: magazineFilter || issueForm.magazine_id || undefined },
      });
      setEligibleArticles(response.data?.data || []);
    } catch (err) {
      logError('Failed to load eligible articles:', err);
      setEligibleArticles([]);
    }
  };

  useEffect(() => {
    if (!authLoading && user) loadWorkspace();
  }, [authLoading, user, canUsePage, page, magazineFilter]);

  useEffect(() => {
    if (!authLoading && user) loadIssueDetail();
  }, [authLoading, user, selectedIssueId, canUsePage]);

  useEffect(() => {
    if (!authLoading && user) loadEligibleArticles();
  }, [authLoading, user, selectedIssueId, magazineFilter, issueForm.magazine_id, canUsePage]);

  const selectIssue = (issue) => {
    updateQuery({ issue_id: issue.id, magazine_id: issue.magazine_id, page: 1 });
  };

  const editIssue = (issue) => {
    setIssueForm({
      id: issue.id,
      magazine_id: String(issue.magazine_id),
      volume_number: issue.volume_number || '',
      issue_number: issue.issue_number || '',
      issue_month: issue.issue_month || '',
      issue_year: issue.issue_year || new Date().getFullYear(),
      special_title: issue.special_title || '',
      description: issue.description || '',
      status: issue.status || (issue.is_published ? 'published' : 'draft'),
      cover_image: null,
    });
    selectIssue(issue);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const resetForm = () => {
    setIssueForm({ ...emptyIssueForm, magazine_id: magazineFilter || magazines[0]?.id || '' });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const saveIssue = async (event) => {
    event.preventDefault();
    setSavingIssue(true);
    try {
      const payload = new FormData();
      Object.entries(issueForm).forEach(([key, value]) => {
        if (key === 'cover_image') return;
        if (key === 'id' || value === null || value === '') return;
        if (!canPublishIssues && ['status', 'is_published', 'published_at'].includes(key)) return;
        payload.append(key, value);
      });
      if (issueForm.cover_image) {
        const coverUpload = await uploadAndAwaitClean({ file: issueForm.cover_image, purpose: 'issue_cover' });
        payload.append('cover_image_upload_id', coverUpload.id);
      }
      const endpoint = issueForm.id ? `/admin/issues/${issueForm.id}` : '/admin/issues';
      const response = await api.post(endpoint, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast(issueForm.id ? 'Issue updated.' : 'Issue created.', 'success');
      const savedIssue = response.data?.issue;
      if (savedIssue) {
        setIssueForm((prev) => ({ ...prev, id: savedIssue.id }));
        updateQuery({ issue_id: savedIssue.id, magazine_id: savedIssue.magazine_id, page: 1 });
      }
      await loadWorkspace();
      await loadIssueDetail();
    } catch (err) {
      logError('Failed to save issue:', err);
      toast(safeApiMessage(err, 'Unable to save issue.'), 'error');
    } finally {
      setSavingIssue(false);
    }
  };

  const executeIssueAction = async () => {
    if (!issueAction) return;
    try {
      await api.post(`/admin/issues/${issueAction.issue.id}/${issueAction.action}`);
      toast(issueAction.action === 'publish' ? 'Issue published.' : 'Issue unpublished.', 'success');
      setIssueAction(null);
      await loadWorkspace();
      await loadIssueDetail();
    } catch (err) {
      logError('Failed to update issue status:', err);
      toast(safeApiMessage(err, 'Unable to update issue status.'), 'error');
    }
  };

  const updateArticleForm = (article, patch) => {
    setArticleForms((prev) => ({
      ...prev,
      [article.id]: {
        ...publicationFormDefaults(article, selectedIssue),
        ...(prev[article.id] || {}),
        ...patch,
      },
    }));
  };

  const publishArticle = async () => {
    if (!articleAction) return;
    const article = articleAction.article;
    const form = {
      ...publicationFormDefaults(article, selectedIssue),
      ...(articleForms[article.id] || {}),
    };
    setPublishingArticleId(article.id);
    try {
      const payload = new FormData();
      if (selectedIssue?.id) payload.append('magazine_issue_id', selectedIssue.id);
      payload.append('published_year', form.published_year);
      payload.append('published_month', form.published_month);
      if (form.doi) payload.append('doi', form.doi);
      if (form.page_start) payload.append('page_start', form.page_start);
      if (form.page_end) payload.append('page_end', form.page_end);
      if (form.publication_pdf) {
        const pdfUpload = await uploadAndAwaitClean({
          file: form.publication_pdf,
          purpose: 'article_published_pdf',
          attachableId: article.id,
        });
        payload.append('publication_pdf_upload_id', pdfUpload.id);
      }

      const response = await api.post(`/admin/articles/${article.id}/publish`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLatestCitation(response.data?.citation?.text || '');
      toast(article.status === 'published' ? 'Publication metadata updated.' : 'Article published.', 'success');
      setArticleAction(null);
      await loadWorkspace();
      await loadIssueDetail();
      await loadEligibleArticles();
    } catch (err) {
      logError('Failed to publish article:', err);
      toast(safeApiMessage(err, 'Unable to publish article.'), 'error');
    } finally {
      setPublishingArticleId(null);
    }
  };

  if (authLoading || loading) {
    return <LoadingState label="Loading issue workspace..." className="min-h-[420px]" />;
  }

  if (!canUsePage) {
    return <ErrorState title="Access restricted">Issue management is available only to authorized magazine editors, publishers, and administrators.</ErrorState>;
  }

  return (
    <main className="space-y-6">
      <title>Issue Management - ScholarlyNest</title>
      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Issue Operations</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">Issues and Table of Contents</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Build magazine issues, review table-of-contents readiness, and publish eligible manuscripts into their assigned magazine issue.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" icon={RefreshCw} onClick={() => { loadWorkspace(); loadIssueDetail(); loadEligibleArticles(); }}>Refresh</Button>
            <Button type="button" icon={Plus} onClick={resetForm}>New Issue</Button>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(220px,320px)_1fr] lg:items-end">
          <label className="block">
            <span className="text-sm font-semibold text-[var(--foreground)]">Magazine scope</span>
            <select
              value={magazineFilter}
              onChange={(event) => updateQuery({ magazine_id: event.target.value, issue_id: '', page: 1 })}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-semibold text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <option value="">All assigned magazines</option>
              {magazines.map((magazine) => <option key={magazine.id} value={magazine.id}>{magazine.title}</option>)}
            </select>
          </label>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
            <p className="text-xs font-semibold text-[var(--muted)]">Current context</p>
            <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{currentMagazine?.title || 'All assigned magazines'}</p>
          </div>
        </div>
      </header>

      {error ? (
        <ErrorState title="Issue workspace could not be loaded">{error}</ErrorState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
          <section className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="text-sm font-bold text-[var(--foreground)]">Issue List</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Filter state is URL-driven and preserved on refresh.</p>
              </div>
              {issues.length === 0 ? (
                <EmptyState icon={Newspaper} title="No issues found for this scope." className="m-5">
                  Create an issue before placing or publishing articles into a table of contents.
                </EmptyState>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {issues.map((issue) => (
                    <article key={issue.id} className={`p-5 ${Number(selectedIssueId) === Number(issue.id) ? 'bg-amber-50/60 dark:bg-amber-500/5' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[var(--foreground)]">{issueLabel(issue)}</h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">{issue.magazine?.title || 'Magazine not listed'}</p>
                        </div>
                        <PublicationStatusBadge status={issue.status || (issue.is_published ? 'published' : 'draft')} />
                      </div>
                      {issue.special_title && <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{issue.special_title}</p>}
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[var(--muted)]">
                        <span>{issueDate(issue)}</span>
                        <span>{Number(issue.articles_count || 0)} article{Number(issue.articles_count || 0) === 1 ? '' : 's'}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => selectIssue(issue)}>Open</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => editIssue(issue)}>Edit</Button>
                        {canPublishIssues && (
                          <Button
                            type="button"
                            variant={issue.is_published ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => setIssueAction({ issue, action: issue.is_published ? 'unpublish' : 'publish' })}
                          >
                            {issue.is_published ? 'Unpublish' : 'Publish Issue'}
                          </Button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={(nextPage) => updateQuery({ page: nextPage })} />}
          </section>

          <section className="space-y-6">
            <form ref={formRef} onSubmit={saveIssue} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                <h2 className="text-sm font-bold text-[var(--foreground)]">{issueForm.id ? 'Edit Issue' : 'Create Issue'}</h2>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Magazine</span>
                  <select value={issueForm.magazine_id} required onChange={(event) => setIssueForm({ ...issueForm, magazine_id: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                    <option value="">Select magazine</option>
                    {magazines.map((magazine) => <option key={magazine.id} value={magazine.id}>{magazine.title}</option>)}
                  </select>
                </label>
                {canPublishIssues ? (
                  <label className="block">
                    <span className="text-sm font-semibold text-[var(--foreground)]">Issue status</span>
                    <select value={issueForm.status} onChange={(event) => setIssueForm({ ...issueForm, status: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                      {issueStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                ) : (
                  <div className="block">
                    <span className="text-sm font-semibold text-[var(--foreground)]">Issue status</span>
                    <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm font-semibold text-[var(--muted)]">
                      Status changes are handled by publishers.
                    </div>
                  </div>
                )}
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Volume</span>
                  <input type="number" min="1" required value={issueForm.volume_number} onChange={(event) => setIssueForm({ ...issueForm, volume_number: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Issue number</span>
                  <input type="number" min="1" required value={issueForm.issue_number} onChange={(event) => setIssueForm({ ...issueForm, issue_number: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Publication month</span>
                  <select value={issueForm.issue_month} onChange={(event) => setIssueForm({ ...issueForm, issue_month: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                    <option value="">Not set</option>
                    {MONTHS.map((month) => <option key={month} value={month}>{month}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Publication year</span>
                  <input type="number" min="1900" max={new Date().getFullYear() + 5} value={issueForm.issue_year} onChange={(event) => setIssueForm({ ...issueForm, issue_year: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                </label>
              </div>
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-[var(--foreground)]">Issue title</span>
                <input value={issueForm.special_title} onChange={(event) => setIssueForm({ ...issueForm, special_title: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
              </label>
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-[var(--foreground)]">Issue description</span>
                <textarea rows={3} value={issueForm.description} onChange={(event) => setIssueForm({ ...issueForm, description: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
              </label>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  <span>{issueForm.cover_image?.name || 'Cover image'}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => setIssueForm({ ...issueForm, cover_image: event.target.files?.[0] || null })} />
                </label>
                <Button type="submit" disabled={savingIssue} icon={savingIssue ? Loader2 : CheckCircle2}>{savingIssue ? 'Saving...' : 'Save Issue'}</Button>
              </div>
            </form>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Issue Detail</p>
                  <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">{selectedIssue ? issueLabel(selectedIssue) : 'Select an issue'}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{selectedIssue?.magazine?.title || 'Open an issue to review its table of contents and placement queue.'}</p>
                </div>
                {selectedIssue && <PublicationStatusBadge status={selectedIssue.status} />}
              </div>

              {selectedIssue ? (
                <div className="mt-5 space-y-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                      <p className="text-xs font-semibold text-[var(--muted)]">Publication timing</p>
                      <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{issueDate(selectedIssue)}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                      <p className="text-xs font-semibold text-[var(--muted)]">Table of contents</p>
                      <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{issueArticles.length} article{issueArticles.length === 1 ? '' : 's'}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                      <p className="text-xs font-semibold text-[var(--muted)]">Placement queue</p>
                      <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{unplacedEligibleArticles.length} ready</p>
                    </div>
                  </div>

                  <section>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">Table of Contents</h3>
                    {issueArticles.length === 0 ? (
                      <EmptyState icon={FileText} title="No articles are placed in this issue." className="mt-3">
                        Publish eligible articles into this issue to build the table of contents.
                      </EmptyState>
                    ) : (
                      <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)]">
                        {issueArticles.map((article, index) => (
                          <article key={article.id} className="grid gap-3 border-b border-[var(--border)] p-4 last:border-b-0 md:grid-cols-[40px_minmax(0,1fr)_auto] md:items-center">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-muted)] text-sm font-bold text-[var(--muted)]">{index + 1}</span>
                            <div className="min-w-0">
                              <h4 className="font-bold text-[var(--foreground)]">{article.title}</h4>
                              <p className="mt-1 text-sm text-[var(--muted)]">{authorsLine(article)}</p>
                            </div>
                            <PublicationStatusBadge status={article.status} />
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">Available Articles for Placement</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{canPublishIssues ? 'The current backend places an article into an issue as part of publication.' : 'Eligible articles are visible for planning. Publishing into an issue is handled by publishers.'}</p>
                    {latestCitation && (
                      <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <strong>Generated citation:</strong> {latestCitation}
                      </div>
                    )}
                    {unplacedEligibleArticles.length === 0 ? (
                      <EmptyState icon={FileText} title="No unplaced eligible articles." className="mt-3">
                        Articles appear here after they are accepted or marked ready for publication within this magazine.
                      </EmptyState>
                    ) : canPublishIssues ? (
                      <div className="mt-3 space-y-3">
                        {unplacedEligibleArticles.map((article) => {
                          const form = { ...publicationFormDefaults(article, selectedIssue), ...(articleForms[article.id] || {}) };
                          return (
                            <article key={article.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-[var(--foreground)]">{article.title}</h4>
                                  <p className="mt-1 text-sm text-[var(--muted)]">{authorsLine(article)}</p>
                                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{compactText(article.abstract, 'No abstract excerpt available.')}</p>
                                </div>
                                <PublicationStatusBadge status={article.status} />
                              </div>
                              <div className="mt-4 grid gap-3 md:grid-cols-4">
                                <input aria-label={`DOI for ${article.title}`} value={form.doi} onChange={(event) => updateArticleForm(article, { doi: event.target.value })} placeholder="DOI" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                                <input aria-label={`Start page for ${article.title}`} type="number" min="1" value={form.page_start} onChange={(event) => updateArticleForm(article, { page_start: event.target.value })} placeholder="Page start" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                                <input aria-label={`End page for ${article.title}`} type="number" min="1" value={form.page_end} onChange={(event) => updateArticleForm(article, { page_end: event.target.value })} placeholder="Page end" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
                                  <Upload className="h-4 w-4" aria-hidden="true" />
                                  <span>{form.publication_pdf?.name || 'Final PDF'}</span>
                                  <input type="file" accept="application/pdf" className="sr-only" onChange={(event) => updateArticleForm(article, { publication_pdf: event.target.files?.[0] || null })} />
                                </label>
                              </div>
                              <div className="mt-4 flex justify-end">
                                <Button type="button" icon={Calendar} disabled={publishingArticleId === article.id} onClick={() => setArticleAction({ article })}>
                                  Publish into Issue
                                </Button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {unplacedEligibleArticles.map((article) => (
                          <article key={article.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <h4 className="font-bold text-[var(--foreground)]">{article.title}</h4>
                                <p className="mt-1 text-sm text-[var(--muted)]">{authorsLine(article)}</p>
                                <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{compactText(article.abstract, 'No abstract excerpt available.')}</p>
                              </div>
                              <PublicationStatusBadge status={article.status} />
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  {(selectedIssueEligibleArticles.length > 0 || otherIssueArticles.length > 0) && (
                    <section>
                      <h3 className="text-sm font-bold text-[var(--foreground)]">Already Placed or Published</h3>
                      <div className="mt-3 space-y-2">
                        {[...selectedIssueEligibleArticles, ...otherIssueArticles].map((article) => (
                          <div key={article.id} className="flex flex-col gap-2 rounded-lg border border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-bold text-[var(--foreground)]">{article.title}</p>
                              <p className="mt-1 text-xs text-[var(--muted)]">{article.issue ? `${issueLabel(article.issue)}` : 'Issue not set'}</p>
                            </div>
                            <PublicationStatusBadge status={article.status} />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <EmptyState icon={ChevronRight} title="Open an issue to manage its contents." className="mt-5">
                  Select an issue from the list or create a new issue for the selected magazine scope.
                </EmptyState>
              )}
            </section>
          </section>
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(issueAction)}
        title={issueAction?.action === 'publish' ? 'Publish issue?' : 'Unpublish issue?'}
        message={issueAction?.action === 'publish'
          ? 'Publishing this issue will mark the issue as publicly published according to the existing backend publication controls.'
          : 'Unpublishing this issue will remove the issue published state while preserving its records.'}
        confirmText={issueAction?.action === 'publish' ? 'Publish Issue' : 'Unpublish Issue'}
        cancelText="Cancel"
        variant={issueAction?.action === 'publish' ? 'primary' : 'danger'}
        onConfirm={executeIssueAction}
        onCancel={() => setIssueAction(null)}
      />
      <ConfirmationModal
        isOpen={Boolean(articleAction)}
        title="Publish article into issue?"
        message="Publishing this article will make it publicly available with the selected issue and publication metadata."
        confirmText="Publish Article"
        cancelText="Cancel"
        variant="primary"
        isLoading={Boolean(publishingArticleId)}
        onConfirm={publishArticle}
        onCancel={() => setArticleAction(null)}
      />
    </main>
  );
}
