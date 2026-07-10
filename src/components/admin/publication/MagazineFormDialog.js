'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ImagePlus, Loader2, Pencil, Save, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import MagazineFormFields from '../MagazineFormFields';

const RichEditor = dynamic(() => import('../../ui/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-sm font-semibold text-[var(--muted)]">
      Loading editor...
    </div>
  ),
});

const emptyForm = {
  title: '',
  description: '',
  about_text: '',
  editor_id: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  cover_image_file: null,
};

export default function MagazineFormDialog({
  open,
  mode = 'create',
  magazine = null,
  canEditSeo = false,
  readOnly = false,
  saving = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      title: magazine?.title || '',
      description: magazine?.description || '',
      about_text: magazine?.about_text || '',
      editor_id: magazine?.editors?.[0]?.id ? String(magazine.editors[0].id) : '',
      seo_title: magazine?.seo_title || '',
      seo_description: magazine?.seo_description || '',
      seo_keywords: magazine?.seo_keywords || '',
      cover_image_file: null,
    });
    setFileName('');
  }, [open, magazine]);

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit?.(form);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="presentation">
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="magazine-form-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Magazine Setup</p>
            <h2 id="magazine-form-title" className="mt-1 text-xl font-bold text-[var(--foreground)]">
              {mode === 'create' ? 'Create Magazine' : readOnly ? 'Magazine Settings' : 'Edit Magazine'}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close magazine form" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </header>

        <form onSubmit={submit} className="overflow-y-auto px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Magazine Identity</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">Name the magazine and assign its editorial owner where supported.</p>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Magazine title</span>
                  <input
                    required
                    value={form.title}
                    disabled={readOnly}
                    onChange={(event) => update('title', event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-semibold text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60"
                  />
                </label>
                <MagazineFormFields value={form.editor_id} onChange={(value) => update('editor_id', value)} disabled={readOnly} />
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Public Description and Scope</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">This content appears in public magazine discovery and overview areas.</p>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Short description</span>
                  <textarea
                    value={form.description}
                    disabled={readOnly}
                    rows={3}
                    onChange={(event) => update('description', event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">About and overview</span>
                  <div className={`mt-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] ${readOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <RichEditor
                      value={form.about_text}
                      onChange={(value) => update('about_text', value)}
                      placeholder="Describe magazine scope, editorial context, and publication focus."
                      minHeight="180px"
                    />
                  </div>
                </label>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <h3 className="text-sm font-bold text-[var(--foreground)]">Publication Appearance</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">Upload a cover image. Existing storage values are kept private.</p>
                <label className={`group relative mt-4 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] text-center ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
                  {fileName || magazine?.cover_image_url || magazine?.cover_image ? (
                    <img
                      src={fileName && form.cover_image_file ? URL.createObjectURL(form.cover_image_file) : (magazine?.cover_image_url || magazine?.cover_image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center p-4">
                      <ImagePlus className="h-6 w-6 text-[var(--muted)]" aria-hidden="true" />
                      <span className="mt-2 text-sm font-semibold text-[var(--foreground)]">Choose cover image</span>
                      <span className="mt-1 text-xs text-[var(--muted)]">JPEG, PNG, GIF, SVG, or WebP</span>
                    </div>
                  )}
                  {!readOnly && (
                    <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                  {fileName && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/65 px-3 py-2 text-xs font-semibold text-white">{fileName}</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={readOnly}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      update('cover_image_file', file);
                      setFileName(file?.name || '');
                    }}
                  />
                </label>
              </section>

              {canEditSeo && (
                <section className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Editorial and Publication Context</h3>
                  <label className="block">
                    <span className="text-xs font-semibold text-[var(--muted)]">SEO title</span>
                    <input value={form.seo_title} disabled={readOnly} onChange={(event) => update('seo_title', event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-[var(--muted)]">SEO description</span>
                    <textarea value={form.seo_description} disabled={readOnly} rows={3} onChange={(event) => update('seo_description', event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-[var(--muted)]">SEO keywords</span>
                    <input value={form.seo_keywords} disabled={readOnly} onChange={(event) => update('seo_keywords', event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60" />
                  </label>
                </section>
              )}
            </aside>
          </div>

          <footer className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            {!readOnly && (
              <Button type="submit" disabled={saving} icon={saving ? Loader2 : Save}>
                {saving ? 'Saving...' : mode === 'create' ? 'Create Magazine' : 'Save Changes'}
              </Button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
