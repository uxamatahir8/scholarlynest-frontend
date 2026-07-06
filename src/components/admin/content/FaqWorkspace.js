'use client';

import React, { useEffect, useState } from 'react';
import { HelpCircle, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
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
import ContentStatusBadge from './ContentStatusBadge';
import { formatDate, stripHtml } from './contentUtils';

const emptyForm = {
  id: null,
  question: '',
  answer: '',
  sort_order: 0,
  is_active: true,
};

export default function FaqWorkspace() {
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [visibilityTarget, setVisibilityTarget] = useState(null);
  const [errors, setErrors] = useState({});

  const canManage = hasRole('super_admin') || hasRole('admin') || hasPermission('settings.manage');
  const canDelete = hasRole('super_admin');

  const loadFaqs = async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/faqs');
      setFaqs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      logError('Failed to load FAQs:', err);
      setError(safeApiMessage(err, 'Unable to load FAQ management data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) loadFaqs();
  }, [authLoading, user, canManage]);

  const openCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (faq) => {
    setForm({
      id: faq.id,
      question: faq.question || '',
      answer: faq.answer || '',
      sort_order: faq.sort_order || 0,
      is_active: faq.is_active !== false,
    });
    setErrors({});
    setFormOpen(true);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.question.trim()) nextErrors.question = 'Question is required.';
    if (form.question.length > 500) nextErrors.question = 'Question must be under 500 characters.';
    if (!form.answer.trim()) nextErrors.answer = 'Answer is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveFaq = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_active: Boolean(form.is_active),
      };
      if (form.id) {
        await api.put(`/admin/faqs/${form.id}`, payload);
        toast('FAQ updated.', 'success');
      } else {
        await api.post('/admin/faqs', payload);
        toast('FAQ created.', 'success');
      }
      setFormOpen(false);
      await loadFaqs();
    } catch (err) {
      logError('Failed to save FAQ:', err);
      toast(safeApiMessage(err, 'Unable to save FAQ.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const applyVisibility = async () => {
    if (!visibilityTarget) return;
    try {
      await api.put(`/admin/faqs/${visibilityTarget.id}`, { is_active: !visibilityTarget.is_active });
      toast(!visibilityTarget.is_active ? 'FAQ activated for public display.' : 'FAQ deactivated from public display.', 'success');
      setVisibilityTarget(null);
      await loadFaqs();
    } catch (err) {
      logError('Failed to update FAQ visibility:', err);
      toast(safeApiMessage(err, 'Unable to update FAQ visibility.'), 'error');
    }
  };

  const deleteFaq = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/faqs/${deleteTarget.id}`);
      toast('FAQ deleted.', 'success');
      setDeleteTarget(null);
      await loadFaqs();
    } catch (err) {
      logError('Failed to delete FAQ:', err);
      toast(safeApiMessage(err, 'Unable to delete FAQ.'), 'error');
    }
  };

  if (authLoading || loading) return <LoadingState label="Loading FAQ workspace..." className="min-h-[420px]" />;
  if (!user || !canManage) return <ErrorState title="Access restricted">FAQ management requires settings-management access.</ErrorState>;

  return (
    <main className="space-y-6">
      <title>FAQ Management - ScholarlyNest</title>
      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Public Content</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">FAQ Management</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Manage public questions, active visibility, and display order. Only active FAQs are returned by the public FAQ API.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" icon={RefreshCw} onClick={loadFaqs}>Refresh</Button>
            <Button type="button" icon={Plus} onClick={openCreate}>Create FAQ</Button>
          </div>
        </div>
      </header>

      {error ? (
        <ErrorState title="FAQ workspace could not be loaded">{error}</ErrorState>
      ) : faqs.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No FAQs have been created.">Create public questions and mark them active when they should appear on the website.</EmptyState>
      ) : (
        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_130px_160px] gap-4 border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)] max-lg:hidden">
            <span>Question</span>
            <span>Status</span>
            <span>Display Order</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {faqs.map((faq) => (
              <article key={faq.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_120px_130px_160px] lg:items-center">
                <div className="min-w-0">
                  <h2 className="font-bold text-[var(--foreground)]">{faq.question}</h2>
                  <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">{stripHtml(faq.answer)}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Updated {formatDate(faq.updated_at)}</p>
                </div>
                <ContentStatusBadge status={faq.is_active ? 'published' : 'inactive'}>{faq.is_active ? 'Active' : 'Inactive'}</ContentStatusBadge>
                <span className="text-sm font-semibold text-[var(--foreground)]">{faq.sort_order ?? 0}</span>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(faq)}>Edit</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setVisibilityTarget(faq)}>{faq.is_active ? 'Deactivate' : 'Activate'}</Button>
                  {canDelete && <Button type="button" variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteTarget(faq)}>Delete</Button>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="faq-form-title" className="w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">FAQ Editor</p>
                <h2 id="faq-form-title" className="mt-1 text-xl font-bold text-[var(--foreground)]">{form.id ? 'Edit FAQ' : 'Create FAQ'}</h2>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close FAQ form" onClick={() => setFormOpen(false)}><X className="h-4 w-4" /></Button>
            </header>
            <form onSubmit={saveFaq} className="space-y-5 px-6 py-6">
              <label className="block">
                <span className="text-sm font-semibold text-[var(--foreground)]">Question</span>
                <input value={form.question} aria-invalid={Boolean(errors.question)} onChange={(event) => setForm({ ...form, question: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                {errors.question && <p className="mt-1 text-sm font-semibold text-red-600">{errors.question}</p>}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[var(--foreground)]">Answer</span>
                <textarea rows={6} value={form.answer} aria-invalid={Boolean(errors.answer)} onChange={(event) => setForm({ ...form, answer: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                {errors.answer && <p className="mt-1 text-sm font-semibold text-red-600">{errors.answer}</p>}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Display order</span>
                  <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                  <span className="mt-1 block text-xs text-[var(--muted)]">Lower numbers appear first.</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="h-4 w-4 rounded border-[var(--border)]" />
                  <span>
                    <span className="block text-sm font-semibold text-[var(--foreground)]">Active on public website</span>
                    <span className="block text-xs text-[var(--muted)]">Inactive FAQs are not returned by the public FAQ API.</span>
                  </span>
                </label>
              </div>
              <footer className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                <Button type="submit" icon={Save} disabled={saving}>{saving ? 'Saving...' : 'Save FAQ'}</Button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(visibilityTarget)}
        title={visibilityTarget?.is_active ? 'Deactivate FAQ?' : 'Activate FAQ?'}
        message={visibilityTarget?.is_active ? 'This FAQ will stop appearing on the public website.' : 'This FAQ will become available through the public FAQ API.'}
        confirmText={visibilityTarget?.is_active ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        variant={visibilityTarget?.is_active ? 'danger' : 'primary'}
        onConfirm={applyVisibility}
        onCancel={() => setVisibilityTarget(null)}
      />
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Delete FAQ?"
        message="This permanently removes the FAQ record from management and public display."
        confirmText="Delete FAQ"
        cancelText="Cancel"
        variant="danger"
        onConfirm={deleteFaq}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
