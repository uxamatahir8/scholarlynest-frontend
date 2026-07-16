'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { AlertCircle, Edit3, Eye, FileStack, Loader2, Plus, Power, Search, Trash2, X } from 'lucide-react';
import PublicPageFormModal from '../../../components/admin/publication/PublicPageFormModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../utils/api';
import { logError } from '../../../utils/safeLogger';

const scopes = [
  ['all_magazines', 'All Magazines'],
  ['selected_magazines', 'Selected Magazines'],
  ['all_journals', 'All Journals'],
  ['selected_journals', 'Selected Journals'],
  ['all_publications', 'All Magazines and Journals'],
  ['custom_selection', 'Custom Selection'],
];

const emptyForm = {
  title: '', slug: '', content: '', status: 'draft', target_scope: 'all_publications',
  show_in_navigation: true, sort_order: 0, seo_title: '', seo_description: '',
  selected_magazine_ids: [], selected_journal_ids: [],
};

function PublicationSelector({ type, options, selected, onChange, error }) {
  const [query, setQuery] = useState('');
  const singular = type === 'magazine' ? 'Magazine' : 'Journal';
  const plural = `${singular}s`;
  const visible = useMemo(() => options.filter((option) => option.title.toLowerCase().includes(query.toLowerCase())), [options, query]);
  const selectedOptions = options.filter((option) => selected.includes(option.id));
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  const selectVisible = () => onChange([...new Set([...selected, ...visible.map((option) => option.id)])]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-zinc-800">{plural}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{selected.length} selected</p>
        </div>
        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
          <button type="button" onClick={selectVisible} disabled={!visible.length} className="text-[var(--accent)] disabled:text-zinc-300">Select all visible</button>
          <button type="button" onClick={() => onChange([])} disabled={!selected.length} className="text-zinc-500 disabled:text-zinc-300">Clear</button>
        </div>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${plural.toLowerCase()}...`} className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-xs font-medium focus:border-zinc-400 focus:outline-none" />
      </div>
      {selectedOptions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <button key={option.id} type="button" onClick={() => toggle(option.id)} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700">
              {singular} · {option.title}<X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {visible.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
            <input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} className="h-4 w-4 rounded border-zinc-300" />
            <span>{singular} · {option.title}</span>
          </label>
        ))}
        {!visible.length && <p className="py-5 text-center text-xs font-medium text-zinc-400">{options.length ? `No ${plural.toLowerCase()} match your search.` : `No ${plural.toLowerCase()} available.`}</p>}
      </div>
      {error && <p className="mt-2 text-[11px] font-semibold text-red-600">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

function TargetingSection({ form, setField, magazines, journals, errors }) {
  const showMagazines = ['selected_magazines', 'custom_selection'].includes(form.target_scope);
  const showJournals = ['selected_journals', 'custom_selection'].includes(form.target_scope);

  const changeScope = (scope) => {
    setField('target_scope', scope);
    setField('selected_magazine_ids', []);
    setField('selected_journal_ids', []);
  };

  return (
    <section className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-800">Shared Page Targeting</h4>
        <p className="mt-1 text-[11px] font-medium leading-relaxed text-zinc-500">This shared page can be displayed publicly across all Magazines, all Journals, or selected Magazine/Journal publications.</p>
      </div>
      <fieldset>
        <legend className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Where should this shared page appear?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {scopes.map(([value, label]) => (
            <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold ${form.target_scope === value ? 'border-[var(--accent)] bg-white text-[var(--accent)]' : 'border-zinc-200 bg-white text-zinc-700'}`}>
              <input type="radio" name="target_scope" value={value} checked={form.target_scope === value} onChange={() => changeScope(value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {errors.target_scope && <p className="text-[11px] font-semibold text-red-600">{errors.target_scope[0] || errors.target_scope}</p>}
      <div className={`grid grid-cols-1 gap-3 ${showMagazines && showJournals ? 'lg:grid-cols-2' : ''}`}>
        {showMagazines && <PublicationSelector type="magazine" options={magazines} selected={form.selected_magazine_ids} onChange={(value) => setField('selected_magazine_ids', value)} error={errors.selected_magazine_ids} />}
        {showJournals && <PublicationSelector type="journal" options={journals} selected={form.selected_journal_ids} onChange={(value) => setField('selected_journal_ids', value)} error={errors.selected_journal_ids} />}
      </div>
    </section>
  );
}

function targetSummary(page) {
  const labels = Object.fromEntries(scopes);
  if (!['selected_magazines', 'selected_journals', 'custom_selection'].includes(page.target_scope)) return labels[page.target_scope];
  const magazines = page.targets.filter((target) => target.publication_type === 'magazine').length;
  const journals = page.targets.filter((target) => target.publication_type === 'journal').length;
  if (page.target_scope === 'selected_magazines') return `${magazines} selected Magazine${magazines === 1 ? '' : 's'}`;
  if (page.target_scope === 'selected_journals') return `${journals} selected Journal${journals === 1 ? '' : 's'}`;
  return `${magazines} Magazine${magazines === 1 ? '' : 's'} + ${journals} Journal${journals === 1 ? '' : 's'}`;
}

export default function SharedPagesAdmin() {
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const allowed = (hasRole('super_admin') || hasRole('admin')) && hasPermission('shared_pages.manage');
  const [pages, setPages] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchData = useCallback(async () => {
    if (!allowed) return;
    try {
      setLoading(true);
      const [pageResponse, magazineResponse, journalResponse] = await Promise.all([
        api.get('/admin/shared-pages'),
        api.get('/admin/shared-pages/publications', { params: { publication_type: 'magazine' } }),
        api.get('/admin/shared-pages/publications', { params: { publication_type: 'journal' } }),
      ]);
      setPages(pageResponse.data.data || []);
      setMagazines(magazineResponse.data || []);
      setJournals(journalResponse.data || []);
    } catch (error) {
      logError(error);
      toast('Failed to load shared pages.', 'error');
    } finally {
      setLoading(false);
    }
  }, [allowed, toast]);

  useEffect(() => {
    if (!authLoading && user && allowed) fetchData();
    if (!authLoading && (!user || !allowed)) setLoading(false);
  }, [authLoading, user, allowed, fetchData]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const openCreate = () => {
    setForm({ ...emptyForm, sort_order: pages.length + 1 });
    setEditingId(null);
    setErrors({});
    setFormMode('create');
    setFormOpen(true);
  };
  const openEdit = (page) => {
    setForm({
      ...emptyForm, ...page,
      selected_magazine_ids: page.targets.filter((target) => target.publication_type === 'magazine').map((target) => target.id),
      selected_journal_ids: page.targets.filter((target) => target.publication_type === 'journal').map((target) => target.id),
      seo_title: page.seo_title || '', seo_description: page.seo_description || '',
    });
    setEditingId(page.id);
    setErrors({});
    setFormMode('edit');
    setFormOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    if (!form.title.trim() || !form.content.trim() || form.content === '<p><br></p>') {
      setErrors({ ...(!form.title.trim() && { title: ['Page title is required.'] }), ...((!form.content.trim() || form.content === '<p><br></p>') && { content: ['Page content cannot be empty.'] }) });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        selected_magazine_ids: ['selected_magazines', 'custom_selection'].includes(form.target_scope) ? form.selected_magazine_ids : [],
        selected_journal_ids: ['selected_journals', 'custom_selection'].includes(form.target_scope) ? form.selected_journal_ids : [],
      };
      if (formMode === 'create') await api.post('/admin/shared-pages', payload);
      else await api.put(`/admin/shared-pages/${editingId}`, payload);
      toast(`Shared page ${formMode === 'create' ? 'created' : 'updated'} successfully.`, 'success');
      setFormOpen(false);
      fetchData();
    } catch (error) {
      logError(error);
      setErrors(error.response?.data?.errors || {});
      toast(error.response?.data?.message || 'Failed to save shared page.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (page) => {
    try {
      await api.patch(`/admin/shared-pages/${page.id}/status`, { status: page.status === 'active' ? 'inactive' : 'active' });
      toast('Shared page status updated.', 'success');
      fetchData();
    } catch (error) {
      logError(error);
      toast('Failed to update shared page status.', 'error');
    }
  };

  const deletePage = async () => {
    try {
      setSaving(true);
      await api.delete(`/admin/shared-pages/${deleting.id}`);
      toast('Shared page deleted successfully.', 'success');
      setDeleting(null);
      fetchData();
    } catch (error) {
      logError(error);
      toast('Failed to delete shared page.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;
  if (!user || !allowed) return <div className="flex flex-col items-center justify-center py-24 text-center"><AlertCircle className="mb-3 h-10 w-10 text-red-500" /><h1 className="font-bold text-zinc-900">Administrator access required</h1><p className="mt-1 text-sm text-zinc-500">Shared Pages are available only to Admin and Super Admin users.</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)]">Publications</span>
          <h1 className="mt-1 text-2xl font-bold text-zinc-950">Shared Pages</h1>
          <p className="mt-1 text-sm text-zinc-500">This page will be displayed as public page on all magazine/journals.</p>
        </div>
        <button onClick={openCreate} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm"><Plus className="h-4 w-4" />Add Shared Page</button>
      </div>

      {!pages.length ? (
        <div className="rounded-2xl border border-zinc-200 bg-white py-16 text-center shadow-sm"><FileStack className="mx-auto mb-3 h-10 w-10 text-zinc-300" /><p className="text-sm font-semibold text-zinc-500">No shared pages have been configured.</p><button onClick={openCreate} className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Add Shared Page</button></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead><tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-500"><th className="px-4 py-4">Title / Slug</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Target Scope</th><th className="px-4 py-4">Target Summary</th><th className="px-4 py-4">Navigation</th><th className="px-4 py-4">Order</th><th className="px-4 py-4">Created By</th><th className="px-4 py-4">Updated</th><th className="px-4 py-4 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-4"><p className="font-bold text-zinc-950">{page.title}</p><p className="mt-1 font-mono text-[10px] text-zinc-400">/{page.slug}</p></td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${page.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{page.status}</span></td>
                    <td className="px-4 py-4 font-semibold">{Object.fromEntries(scopes)[page.target_scope]}</td>
                    <td className="px-4 py-4">{targetSummary(page)}</td>
                    <td className="px-4 py-4">{page.show_in_navigation ? 'Yes' : 'No'}</td><td className="px-4 py-4 font-mono">{page.sort_order}</td>
                    <td className="px-4 py-4">{page.created_by?.name || '—'}</td><td className="px-4 py-4">{page.updated_at ? new Date(page.updated_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-3"><button onClick={() => setViewing(page)} title="View" className="text-zinc-500 hover:text-zinc-900"><Eye className="h-4 w-4" /></button><button onClick={() => openEdit(page)} title="Edit" className="text-blue-600 hover:text-blue-800"><Edit3 className="h-4 w-4" /></button><button onClick={() => toggleStatus(page)} title={page.status === 'active' ? 'Deactivate' : 'Activate'} className="text-amber-600 hover:text-amber-800"><Power className="h-4 w-4" /></button><button onClick={() => setDeleting(page)} title="Delete" className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PublicPageFormModal isOpen={formOpen} mode={formMode} values={form} onChange={setField} onClose={() => setFormOpen(false)} onSubmit={submit} saving={saving} shared errors={errors}>
        <TargetingSection form={form} setField={setField} magazines={magazines} journals={journals} errors={errors} />
      </PublicPageFormModal>

      {viewing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4"><div><h2 className="font-bold text-zinc-950">{viewing.title}</h2><p className="font-mono text-[10px] text-zinc-400">/{viewing.slug} · {targetSummary(viewing)}</p></div><button onClick={() => setViewing(null)}><X className="h-5 w-5" /></button></div><div className="prose prose-zinc max-w-none p-6" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewing.content) }} /></div></div>}

      <ConfirmationModal isOpen={Boolean(deleting)} title="Delete Shared Page?" message="This shared page will be removed from every targeted publication. This action cannot be undone." confirmText="Delete Shared Page" onConfirm={deletePage} onCancel={() => setDeleting(null)} isLoading={saving} />
    </div>
  );
}
