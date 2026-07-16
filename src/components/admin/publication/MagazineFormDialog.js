'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ImagePlus, Loader2, Pencil, Save, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import MagazineFormFields from '../MagazineFormFields';
import { magazineSchema, validateWithZod } from '../../../lib/validation';

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
  banner_image_file: null,
  remove_cover_image: false,
  remove_banner_image: false,
};

function ImageUploadField({ label, helper, file, existingUrl, removed, readOnly, aspectClass, onFile, onRemove }) {
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : (!removed ? existingUrl : ''), [file, existingUrl, removed]);
  useEffect(() => () => { if (file && previewUrl) URL.revokeObjectURL(previewUrl); }, [file, previewUrl]);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-[var(--foreground)]">{label}</h4>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{helper}</p>
        </div>
        {!readOnly && previewUrl && <button type="button" onClick={onRemove} className="text-xs font-bold text-red-600 hover:underline">Remove</button>}
      </div>
      <label className={`group relative mt-3 flex ${aspectClass} cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] text-center ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
        {previewUrl ? <img src={previewUrl} alt={`${label} preview`} className="h-full w-full object-cover" /> : (
          <div className="flex flex-col items-center p-4">
            <ImagePlus className="h-6 w-6 text-[var(--muted)]" aria-hidden="true" />
            <span className="mt-2 text-sm font-semibold text-[var(--foreground)]">Choose image</span>
            <span className="mt-1 text-xs text-[var(--muted)]">JPEG, PNG, or WebP · max 5 MB</span>
          </div>
        )}
        {!readOnly && <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow"><Pencil className="h-4 w-4" aria-hidden="true" /></span>}
        {file && <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-3 py-2 text-xs font-semibold text-white">{file.name}</span>}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={readOnly} className="sr-only" onChange={(event) => onFile(event.target.files?.[0] || null)} />
      </label>
    </div>
  );
}

export default function MagazineFormDialog({
  open,
  mode = 'create',
  magazine = null,
  canEditSeo = false,
  readOnly = false,
  saving = false,
  onClose,
  onSubmit,
  publicationType = 'magazine',
}) {
  const label = publicationType === 'journal' ? 'Journal' : 'Magazine';
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

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
      banner_image_file: null,
      remove_cover_image: false,
      remove_banner_image: false,
    });
  }, [open, magazine]);

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    const validation = validateWithZod(magazineSchema, form);
    if (!validation.success) { setErrors(validation.errors); return; }
    setErrors({});
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
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">{label} Setup</p>
            <h2 id="magazine-form-title" className="mt-1 text-xl font-bold text-[var(--foreground)]">
              {mode === 'create' ? `Create ${label}` : readOnly ? `${label} Settings` : `Edit ${label}`}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close magazine form" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </header>

        <form onSubmit={submit} className="overflow-y-auto px-6 pb-0 pt-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">{label} Identity</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">Name the {label.toLowerCase()} and assign its editorial owner where supported.</p>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{label} title</span>
                  <input
                    aria-invalid={!!errors.title}
                    value={form.title}
                    disabled={readOnly}
                    onChange={(event) => update('title', event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-semibold text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60"
                  />
                  {errors.title && <p className="mt-1 text-xs font-semibold text-red-600">{errors.title}</p>}
                </label>
                <MagazineFormFields value={form.editor_id} onChange={(value) => update('editor_id', value)} disabled={readOnly} />
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Public Description and Scope</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">This content appears in public {label.toLowerCase()} discovery and overview areas.</p>
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
                <div className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">About and overview</span>
                  <div className={`mt-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] ${readOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <RichEditor
                      value={form.about_text}
                      onChange={(value) => update('about_text', value)}
                      placeholder={`Describe ${label.toLowerCase()} scope, editorial context, and publication focus.`}
                      minHeight="180px"
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <h3 className="text-sm font-bold text-[var(--foreground)]">Publication Appearance</h3>
                <div className="mt-4 space-y-6">
                  <ImageUploadField label="Main Image / Cover Image" helper="Recommended A2 ratio image. Example: 4961 × 3508 px or similar A2-ratio image." file={form.cover_image_file} existingUrl={magazine?.main_image_url || magazine?.cover_image_url} removed={form.remove_cover_image} readOnly={readOnly} aspectClass="aspect-[1/1.414]" onFile={(file) => setForm((current) => ({ ...current, cover_image_file: file, remove_cover_image: false }))} onRemove={() => setForm((current) => ({ ...current, cover_image_file: null, remove_cover_image: true }))} />
                  <ImageUploadField label="Banner Image / Hero Banner Image" helper="Recommended web banner: 1920 × 600 px or 1600 × 500 px. Use a wide landscape image for the public hero section." file={form.banner_image_file} existingUrl={magazine?.banner_image_url} removed={form.remove_banner_image} readOnly={readOnly} aspectClass="aspect-[16/5]" onFile={(file) => setForm((current) => ({ ...current, banner_image_file: file, remove_banner_image: false }))} onRemove={() => setForm((current) => ({ ...current, banner_image_file: null, remove_banner_image: true }))} />
                </div>
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

          <footer className="sticky bottom-0 z-10 -mx-6 mt-6 flex flex-col-reverse gap-3 border-t border-[var(--border)] bg-[var(--surface)]/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            {!readOnly && (
              <Button type="submit" disabled={saving} icon={saving ? Loader2 : Save}>
                {saving ? 'Saving...' : mode === 'create' ? `Create ${label}` : 'Save Changes'}
              </Button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
