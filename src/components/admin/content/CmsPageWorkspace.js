'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ExternalLink, FileText, Save } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../ui/Button';
import ErrorState from '../../ui/ErrorState';
import LoadingState from '../../ui/LoadingState';
import ContentStatusBadge from './ContentStatusBadge';
import PageTitle from '../../PageTitle';
import { cmsPageDetails, formatDate } from './contentUtils';

const RichEditor = dynamic(() => import('../../ui/RichEditor'), {
  ssr: false,
  loading: () => <LoadingState label="Loading editor..." className="min-h-40" />,
});

export default function CmsPageWorkspace({ slug }) {
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const pageInfo = cmsPageDetails[slug] || { name: 'CMS Page', description: 'Public page content.', publicHref: `/${slug}` };
  const canEditContent = hasRole('super_admin') || hasRole('admin') || hasPermission('settings.manage');
  const canEditSeo = hasPermission('seo.cms-pages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('visual');
  const [form, setForm] = useState({
    title: pageInfo.name,
    content_html: '',
    is_active: true,
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    updated_at: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!slug) return;
    const loadPage = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/admin/cms/${slug}`);
        const page = response.data?.page || {};
        setForm({
          title: page.title || pageInfo.name,
          content_html: page.content_html || '',
          is_active: page.is_active ?? false,
          seo_title: page.seo_title || '',
          seo_description: page.seo_description || '',
          seo_keywords: page.seo_keywords || '',
          updated_at: page.updated_at || null,
        });
      } catch (err) {
        logError('Failed to load CMS page:', err);
        setForm((prev) => ({ ...prev, title: pageInfo.name, is_active: false }));
        setError('This CMS page has not been created yet, or your role cannot access it.');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) loadPage();
  }, [authLoading, slug]);

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Page title is required.';
    if (!form.content_html.trim() || form.content_html === '<p><br></p>') nextErrors.content_html = 'Public content is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePage = async (event) => {
    event.preventDefault();
    if (!canEditContent && !canEditSeo) return;
    if (canEditContent && !validate()) return;

    try {
      setSaving(true);
      const endpoint = canEditContent ? `/admin/cms/${slug}` : `/admin/cms/${slug}/seo`;
      const request = canEditContent ? api.put : api.patch;
      const payload = canEditContent
        ? {
          title: form.title,
          content_html: form.content_html,
          is_active: form.is_active,
          ...(canEditSeo ? {
            seo_title: form.seo_title,
            seo_description: form.seo_description,
            seo_keywords: form.seo_keywords,
          } : {}),
        }
        : {
          seo_title: form.seo_title,
          seo_description: form.seo_description,
          seo_keywords: form.seo_keywords,
        };
      const response = await request(endpoint, payload);
      const page = response.data?.page || {};
      setForm((prev) => ({
        ...prev,
        updated_at: page.updated_at || prev.updated_at,
        is_active: page.is_active ?? prev.is_active,
      }));
      setError('');
      toast(canEditContent ? 'Public page saved.' : 'SEO metadata saved.', 'success');
    } catch (err) {
      logError('Failed to save CMS page:', err);
      toast(safeApiMessage(err, 'Unable to save public page.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <LoadingState label="Loading public content workspace..." className="min-h-[420px]" />;
  if (!user || (!canEditContent && !canEditSeo)) return <ErrorState title="Access restricted">Public content editing requires settings or CMS SEO access.</ErrorState>;

  return (
    <main className="space-y-6">
      <PageTitle title={`${pageInfo.name} CMS`} />
      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Static Public Page</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">{pageInfo.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{pageInfo.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ContentStatusBadge status={form.is_active ? 'published' : 'inactive'}>{form.is_active ? 'Publicly active' : 'Inactive'}</ContentStatusBadge>
              <span className="text-sm text-[var(--muted)]">Updated {formatDate(form.updated_at)}</span>
            </div>
          </div>
          {form.is_active && (
            <Link href={pageInfo.publicHref} target="_blank" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
              View Public Page <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>
      </header>

      {error && <ErrorState title="Public page is not currently active">{error}</ErrorState>}

      <form onSubmit={savePage} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Page Identity</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">This title and content are public when the page is active.</p>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-[var(--foreground)]">Page title</span>
            <input value={form.title} disabled={!canEditContent} aria-invalid={Boolean(errors.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60" />
            {errors.title && <p className="mt-1 text-sm font-semibold text-red-600">{errors.title}</p>}
          </label>
          {canEditContent && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--foreground)]">Public Content</span>
                <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-1">
                  <button type="button" onClick={() => setMode('visual')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === 'visual' ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted)]'}`}>Visual</button>
                  <button type="button" onClick={() => setMode('html')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === 'html' ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted)]'}`}>HTML</button>
                </div>
              </div>
              {mode === 'visual' ? (
                <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)]">
                  <RichEditor value={form.content_html} onChange={(value) => setForm({ ...form, content_html: value })} placeholder={`Draft ${pageInfo.name} content...`} />
                </div>
              ) : (
                <textarea value={form.content_html} rows={18} onChange={(event) => setForm({ ...form, content_html: event.target.value })} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
              )}
              {errors.content_html && <p className="text-sm font-semibold text-red-600">{errors.content_html}</p>}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          {canEditContent && (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Visibility and Publishing</h2>
              <label className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="mt-0.5 h-4 w-4 rounded border-[var(--border)]" />
                <span>
                  <span className="block text-sm font-semibold text-[var(--foreground)]">Publicly active</span>
                  <span className="block text-xs leading-5 text-[var(--muted)]">Inactive pages are not returned by the public CMS endpoint.</span>
                </span>
              </label>
            </section>
          )}

          {canEditSeo && (
            <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div>
                <h2 className="text-sm font-bold text-[var(--foreground)]">Search/SEO Context</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Optional metadata used by the public page response.</p>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-[var(--foreground)]">SEO title</span>
                <input value={form.seo_title} maxLength={255} onChange={(event) => setForm({ ...form, seo_title: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[var(--foreground)]">Meta description</span>
                <textarea value={form.seo_description} maxLength={500} rows={4} onChange={(event) => setForm({ ...form, seo_description: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[var(--foreground)]">Meta keywords</span>
                <input value={form.seo_keywords} maxLength={500} onChange={(event) => setForm({ ...form, seo_keywords: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
              </label>
            </section>
          )}

          <Button type="submit" icon={Save} disabled={saving} className="w-full">{saving ? 'Saving...' : canEditContent ? 'Save Public Page' : 'Save SEO Metadata'}</Button>
        </aside>
      </form>
    </main>
  );
}
