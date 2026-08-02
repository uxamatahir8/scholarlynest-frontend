'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, ExternalLink, FileText, Image as ImageIcon, Plus, RefreshCw, Settings, Trash2 } from 'lucide-react';
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
import MagazineFormDialog from './MagazineFormDialog';
import { compactText } from './publicationUtils';
import { uploadAndAwaitClean } from '../../../lib/mediaUploads/DirectUploadClient';

export default function MagazineWorkspace({ publicationType = 'magazine' }) {
  const isJournal = publicationType === 'journal';
  const label = isJournal ? 'Journal' : 'Magazine';
  const plural = `${label}s`;
  const endpoint = isJournal ? '/admin/journals' : '/admin/magazines';
  const publicPrefix = isJournal ? 'journals' : 'magazines';
  const { user, loading: authLoading, hasPermission, hasRole } = useAuth();
  const { toast } = useToast();
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogState, setDialogState] = useState({ open: false, mode: 'create', magazine: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = hasRole('super_admin');
  const canView = hasPermission('magazines.view-any') || hasPermission('magazines.view-own');
  const canCreate = isSuperAdmin && hasPermission('magazines.create');
  const canEdit = isSuperAdmin && hasPermission('magazines.edit');
  const canDelete = isSuperAdmin && hasPermission('magazines.delete');
  const canEditSeo = isSuperAdmin && hasPermission('seo.magazines');
  const canUseIssueManager = hasRole('super_admin') || hasRole('publisher');

  const pageSummary = useMemo(() => {
    const publishedArticles = magazines.reduce((sum, magazine) => sum + Number(magazine.articles_count || 0), 0);
    return [
      { label: `Visible ${plural}`, value: magazines.length },
      { label: 'Published Articles', value: publishedArticles },
      { label: 'Current Page', value: totalPages > 1 ? `${page} of ${totalPages}` : '1' },
    ];
  }, [magazines, page, totalPages]);

  const loadMagazines = async () => {
    if (!canView) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.get(endpoint, { params: { page, per_page: 10, publication_type: publicationType } });
      setMagazines(response.data?.data || []);
      setTotalPages(response.data?.last_page || 1);
    } catch (err) {
      logError('Failed to load magazine workspace:', err);
      setError(safeApiMessage(err, 'Unable to load magazine workspace.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) loadMagazines();
  }, [authLoading, user, page, canView]);

  const openCreate = () => setDialogState({ open: true, mode: 'create', magazine: null });
  const openEdit = (magazine) => setDialogState({ open: true, mode: 'edit', magazine });
  const closeDialog = () => setDialogState((prev) => ({ ...prev, open: false }));

  const saveMagazine = async (form) => {
    if (!form.title.trim()) {
      toast(`${label} title is required.`, 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('publication_type', publicationType);
      payload.append('description', form.description || '');
      payload.append('about_text', form.about_text || '');
      payload.append('editor_id', form.editor_id || '');
      if (form.cover_image_file) {
        const coverUpload = await uploadAndAwaitClean({ file: form.cover_image_file, purpose: 'magazine_cover' });
        payload.append('main_image_upload_id', coverUpload.id);
      }
      if (form.banner_image_file) {
        const bannerUpload = await uploadAndAwaitClean({ file: form.banner_image_file, purpose: 'publication_banner_image' });
        payload.append('banner_image_upload_id', bannerUpload.id);
      }
      if (form.remove_cover_image) payload.append('cover_image', '');
      if (form.remove_banner_image) payload.append('banner_image', '');
      if (canEditSeo) {
        payload.append('seo_title', form.seo_title || '');
        payload.append('seo_description', form.seo_description || '');
        payload.append('seo_keywords', form.seo_keywords || '');
      }

      if (dialogState.mode === 'create') {
        await api.post(endpoint, payload);
        toast(`${label} created.`, 'success');
      } else {
        payload.append('_method', 'PUT');
        await api.post(`${endpoint}/${dialogState.magazine.id}`, payload);
        toast(`${label} updated.`, 'success');
      }

      closeDialog();
      await loadMagazines();
    } catch (err) {
      logError('Failed to save magazine:', err);
      toast(safeApiMessage(err, 'Unable to save magazine.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteMagazine = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`${endpoint}/${deleteTarget.id}`);
      toast(`${label} deleted.`, 'success');
      setDeleteTarget(null);
      await loadMagazines();
    } catch (err) {
      logError('Failed to delete magazine:', err);
      toast(safeApiMessage(err, 'Unable to delete magazine.'), 'error');
    }
  };

  if (authLoading || loading) {
    return <LoadingState label="Loading magazine workspace..." className="min-h-[420px]" />;
  }

  if (!user || !canView) {
    return <ErrorState title="Access restricted">You do not have access to the magazine management workspace.</ErrorState>;
  }

  return (
    <main className="space-y-6">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Publication Operations</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">{label} Management</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Manage {label.toLowerCase()} identity, public scope, issue setup entry points, and publication configuration for {plural.toLowerCase()} available to your role.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" icon={RefreshCw} onClick={loadMagazines}>Refresh</Button>
            {canCreate && <Button type="button" icon={Plus} onClick={openCreate}>Create {label}</Button>}
          </div>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {pageSummary.map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
              <dt className="text-xs font-semibold text-[var(--muted)]">{item.label}</dt>
              <dd className="mt-1 text-lg font-bold text-[var(--foreground)]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {error ? (
        <ErrorState title={`${label} workspace could not be loaded`}>{error}</ErrorState>
      ) : magazines.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={`No ${plural.toLowerCase()} are available in this workspace.`}
          action={canCreate ? <Button type="button" icon={Plus} onClick={openCreate}>Create {label}</Button> : null}
        >
          Create a magazine to begin setting up issues and publication workflows.
        </EmptyState>
      ) : (
        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-sm font-bold text-[var(--foreground)]">Available {plural}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Compact operational view with public preview, issue work, and management actions.</p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {magazines.map((magazine) => (
              <article key={magazine.id} className="grid gap-4 p-5 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center">
                <div className="flex aspect-[1/1.414] w-24 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                  {magazine.main_image_url || magazine.cover_image_url ? (
                    <img src={magazine.main_image_url || magazine.cover_image_url} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-[var(--muted)]" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-bold text-[var(--foreground)]">{magazine.title}</h3>
                    <span className="rounded-full border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                      {Number(magazine.articles_count || 0)} published article{Number(magazine.articles_count || 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{compactText(magazine.description, 'No public description has been added yet.')}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/${publicPrefix}/${magazine.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] dark:text-amber-400">
                      Public {label.toLowerCase()} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    {canView && (
                      <Link href={`/admin/magazines/${magazine.slug}/pages${isJournal ? '?publication_type=journal' : ''}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--foreground)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                        Public pages <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}
                    {canUseIssueManager && (
                      <Link href={`/admin/issues?magazine_id=${magazine.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--foreground)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                        Issues <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {canView && (
                    <Button type="button" variant="outline" onClick={() => openEdit(magazine)}>
                      {canEdit || canEditSeo ? 'Edit' : 'View'}
                    </Button>
                  )}
                  {canView && (
                    <Link href={`/admin/magazines/${magazine.slug}/pages${isJournal ? '?publication_type=journal' : ''}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-all hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                      Public Pages <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                  {canUseIssueManager && (
                    <Link href={`/admin/issues?magazine_id=${magazine.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                      Manage Issues <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                  {canDelete && (
                    <Button type="button" variant="danger" icon={Trash2} onClick={() => setDeleteTarget(magazine)}>Delete</Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <MagazineFormDialog
        open={dialogState.open}
        mode={dialogState.mode}
        magazine={dialogState.magazine}
        canEditSeo={canEditSeo}
        readOnly={dialogState.mode === 'edit' && !canEdit && !canEditSeo}
        saving={saving}
        onClose={closeDialog}
        onSubmit={saveMagazine}
        publicationType={publicationType}
      />
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete ${label.toLowerCase()}?`}
        message={`This will permanently remove the ${label.toLowerCase()} and associated content. Continue only if this is an intended administrative action.`}
        confirmText={`Delete ${label}`}
        cancelText="Cancel"
        variant="danger"
        onConfirm={deleteMagazine}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
