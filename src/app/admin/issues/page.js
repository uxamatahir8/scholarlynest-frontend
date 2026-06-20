'use client';

import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { BookOpen, Calendar, CheckCircle2, FileText, Loader2, RefreshCw, Upload } from 'lucide-react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { STATUS_META, STATUS_TONE_CLASSES } from '../../../components/admin/articleWorkflow';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

function statusBadge(status) {
  const [label, tone = 'zinc'] = STATUS_META[status] || [String(status || 'draft').replaceAll('_', ' '), status === 'published' ? 'emerald' : 'zinc'];
  return <span className={`inline-flex rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUS_TONE_CLASSES[tone] || STATUS_TONE_CLASSES.zinc}`}>{label}</span>;
}

export default function PublisherIssuesPage() {
  const { user, loading: authLoading, hasRole } = useAuth();
  const { toast } = useToast();
  const formRef = useRef(null);
  const [issues, setIssues] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [eligibleArticles, setEligibleArticles] = useState([]);
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [articleForms, setArticleForms] = useState({});
  const [latestCitation, setLatestCitation] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingIssue, setSavingIssue] = useState(false);
  const [publishingArticleId, setPublishingArticleId] = useState(null);

  const canUsePage = hasRole('publisher') || hasRole('super_admin') || hasRole('admin');
  const selectedIssue = useMemo(() => issues.find((issue) => Number(issue.id) === Number(selectedIssueId)), [issues, selectedIssueId]);

  const loadAll = async () => {
    if (!canUsePage) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [magazinesRes, issuesRes] = await Promise.all([
        api.get('/admin/issues/magazines'),
        api.get('/admin/issues', { params: { per_page: 100 } }),
      ]);
      const nextMagazines = magazinesRes.data?.data || [];
      const nextIssues = issuesRes.data?.data || [];
      setMagazines(nextMagazines);
      setIssues(nextIssues);
      if (!issueForm.magazine_id && nextMagazines[0]) {
        setIssueForm((prev) => ({ ...prev, magazine_id: String(nextMagazines[0].id) }));
      }
    } catch (err) {
      logError(err);
      toast(safeApiMessage(err, 'Failed to load issue workspace.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadAll();
    }
  }, [authLoading, user, canUsePage]);

  useEffect(() => {
    const loadEligible = async () => {
      if (!canUsePage) return;
      try {
        const params = selectedIssueId ? { issue_id: selectedIssueId } : (issueForm.magazine_id ? { magazine_id: issueForm.magazine_id } : {});
        const res = await api.get('/admin/issues/eligible-articles', { params });
        setEligibleArticles(res.data?.data || []);
      } catch (err) {
        logError(err);
        setEligibleArticles([]);
      }
    };
    loadEligible();
  }, [selectedIssueId, issueForm.magazine_id, canUsePage]);

  const resetForm = () => {
    setIssueForm({ ...emptyIssueForm, magazine_id: magazines[0]?.id ? String(magazines[0].id) : '' });
    setSelectedIssueId('');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const editIssue = (issue) => {
    setSelectedIssueId(String(issue.id));
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
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const saveIssue = async (e) => {
    e.preventDefault();
    setSavingIssue(true);
    try {
      const payload = new FormData();
      Object.entries(issueForm).forEach(([key, value]) => {
        if (key === 'id' || value === null || value === '') return;
        payload.append(key, value);
      });

      const endpoint = issueForm.id ? `/admin/issues/${issueForm.id}` : '/admin/issues';
      const res = await api.post(endpoint, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast(issueForm.id ? 'Issue updated.' : 'Issue created.', 'success');
      setLatestCitation('');
      await loadAll();
      editIssue(res.data.issue);
    } catch (err) {
      logError(err);
      toast(safeApiMessage(err, 'Failed to save issue.'), 'error');
    } finally {
      setSavingIssue(false);
    }
  };

  const toggleIssuePublished = async (issue) => {
    try {
      const action = issue.is_published ? 'unpublish' : 'publish';
      await api.post(`/admin/issues/${issue.id}/${action}`);
      toast(issue.is_published ? 'Issue unpublished.' : 'Issue published.', 'success');
      await loadAll();
    } catch (err) {
      logError(err);
      toast(safeApiMessage(err, 'Issue status update failed.'), 'error');
    }
  };

  const updateArticleForm = (articleId, patch) => {
    setArticleForms((prev) => ({ ...prev, [articleId]: { ...(prev[articleId] || {}), ...patch } }));
  };

  const publishArticle = async (article) => {
    const form = articleForms[article.id] || {};
    setPublishingArticleId(article.id);
    try {
      const payload = new FormData();
      if (selectedIssueId) payload.append('magazine_issue_id', selectedIssueId);
      if (form.doi) payload.append('doi', form.doi);
      payload.append('published_year', form.published_year || selectedIssue?.issue_year || new Date().getFullYear());
      payload.append('published_month', form.published_month || selectedIssue?.issue_month || months[new Date().getMonth()]);
      if (form.page_start) payload.append('page_start', form.page_start);
      if (form.page_end) payload.append('page_end', form.page_end);
      if (form.publication_pdf) payload.append('publication_pdf', form.publication_pdf);

      const res = await api.post(`/admin/articles/${article.id}/publish`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLatestCitation(res.data?.citation?.text || '');
      toast('Article published.', 'success');
      await loadAll();
    } catch (err) {
      logError(err);
      toast(safeApiMessage(err, 'Failed to publish article.'), 'error');
    } finally {
      setPublishingArticleId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!canUsePage) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        Publisher issue management is available only to Publishers and Admin users.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-850 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Publication Workflow</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">Issue Management</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">Prepare issues, assign ready manuscripts, publish final PDFs, and copy generated citations.</p>
        </div>
        <button onClick={loadAll} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Issues</h2>
            <button onClick={resetForm} className="text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:underline">New Issue</button>
          </div>
          {issues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">No issues created yet.</div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <article key={issue.id} className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-900 ${selectedIssueId === String(issue.id) ? 'border-amber-400/50 ring-1 ring-amber-400/30' : 'border-zinc-150 dark:border-zinc-850'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-zinc-950 dark:text-white">Vol. {issue.volume_number}, Issue {issue.issue_number}</h3>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">{issue.magazine?.title}</p>
                    </div>
                    {statusBadge(issue.status || (issue.is_published ? 'published' : 'draft'))}
                  </div>
                  {issue.special_title && <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{issue.special_title}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                    <span>{issue.issue_month || 'Month TBD'} {issue.issue_year || ''}</span>
                    <span>{issue.articles_count || 0} article(s)</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => editIssue(issue)} className="rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-zinc-100 dark:text-zinc-950">Edit</button>
                    <button onClick={() => toggleIssuePublished(issue)} className="rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                      {issue.is_published ? 'Unpublish' : 'Publish Issue'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <form ref={formRef} onSubmit={saveIssue} className="rounded-xl border border-zinc-150 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">{issueForm.id ? 'Edit Issue' : 'Create Issue'}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select value={issueForm.magazine_id} onChange={(e) => setIssueForm({ ...issueForm, magazine_id: e.target.value })} required className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                <option value="">Select magazine</option>
                {magazines.map((magazine) => <option key={magazine.id} value={magazine.id}>{magazine.title}</option>)}
              </select>
              <select value={issueForm.status} onChange={(e) => setIssueForm({ ...issueForm, status: e.target.value })} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
              <input value={issueForm.volume_number} onChange={(e) => setIssueForm({ ...issueForm, volume_number: e.target.value })} required type="number" min="1" placeholder="Volume number" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
              <input value={issueForm.issue_number} onChange={(e) => setIssueForm({ ...issueForm, issue_number: e.target.value })} required type="number" min="1" placeholder="Issue number" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
              <select value={issueForm.issue_month} onChange={(e) => setIssueForm({ ...issueForm, issue_month: e.target.value })} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                <option value="">Month</option>
                {months.map((month) => <option key={month} value={month}>{month}</option>)}
              </select>
              <input value={issueForm.issue_year} onChange={(e) => setIssueForm({ ...issueForm, issue_year: e.target.value })} type="number" min="1900" placeholder="Year" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
            </div>
            <input value={issueForm.special_title} onChange={(e) => setIssueForm({ ...issueForm, special_title: e.target.value })} placeholder="Special issue title" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
            <textarea value={issueForm.description} onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })} rows={3} placeholder="Issue description" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950" />
            <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              <Upload className="h-3.5 w-3.5" />
              <span>{issueForm.cover_image?.name || 'Cover image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setIssueForm({ ...issueForm, cover_image: e.target.files?.[0] || null })} />
            </label>
            <button disabled={savingIssue} className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950">
              {savingIssue ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              Save Issue
            </button>
          </form>

          <section className="rounded-xl border border-zinc-150 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Publish Eligible Articles</h2>
            </div>
            {!selectedIssueId && <p className="text-xs font-medium text-zinc-500">Select an issue to assign articles while publishing.</p>}
            {latestCitation && (
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-3 text-xs text-emerald-800">
                <p className="font-bold uppercase tracking-wider text-[10px]">Generated APA Citation</p>
                <p className="mt-1">{latestCitation}</p>
              </div>
            )}
            {eligibleArticles.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 p-5 text-center text-xs text-zinc-500 dark:border-zinc-800">No accepted or ready articles are available for this scope.</p>
            ) : (
              <div className="space-y-3">
                {eligibleArticles.map((article) => {
                  const form = articleForms[article.id] || {};
                  return (
                    <article key={article.id} className="rounded-xl border border-zinc-150 bg-zinc-50 p-4 dark:border-zinc-850 dark:bg-zinc-950/50 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{article.title}</h3>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">{article.magazine?.title}</p>
                        </div>
                        {statusBadge(article.status)}
                      </div>
                      {article.citation?.text && article.status === 'published' && <p className="text-[11px] text-zinc-500">{article.citation.text}</p>}
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <input value={form.doi || article.doi || ''} onChange={(e) => updateArticleForm(article.id, { doi: e.target.value })} placeholder="DOI" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900" />
                        <input value={form.page_start || article.page_start || ''} onChange={(e) => updateArticleForm(article.id, { page_start: e.target.value })} type="number" min="1" placeholder="Page start" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900" />
                        <input value={form.page_end || article.page_end || ''} onChange={(e) => updateArticleForm(article.id, { page_end: e.target.value })} type="number" min="1" placeholder="Page end" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{form.publication_pdf?.name || 'Final PDF'}</span>
                          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => updateArticleForm(article.id, { publication_pdf: e.target.files?.[0] || null })} />
                        </label>
                        <button disabled={publishingArticleId === article.id || article.status === 'published'} onClick={() => publishArticle(article)} className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950">
                          {publishingArticleId === article.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                          {article.status === 'published' ? 'Published' : 'Publish'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
}
