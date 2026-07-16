'use client';

import { Select } from '../../ui/Input';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Check, Code, Edit3, Loader2, X } from 'lucide-react';

const RichEditor = dynamic(() => import('../../ui/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-8">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      <span className="ml-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">Loading Editor Workspace...</span>
    </div>
  ),
});

const inputClass = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold transition-colors focus:border-zinc-400 focus:outline-none';

function FieldError({ message }) {
  return message ? <p className="mt-1 text-[11px] font-semibold text-red-600">{message}</p> : null;
}

export default function PublicPageFormModal({
  isOpen,
  mode = 'create',
  values,
  onChange,
  onClose,
  onSubmit,
  saving = false,
  shared = false,
  errors = {},
  children,
}) {
  const [editorMode, setEditorMode] = useState('visual');

  useEffect(() => {
    if (isOpen) setEditorMode('visual');
  }, [isOpen]);

  if (!isOpen) return null;

  const errorFor = (field) => Array.isArray(errors[field]) ? errors[field][0] : errors[field];
  const modalTitle = shared
    ? `${mode === 'create' ? 'Create' : 'Edit'} Shared Page`
    : mode === 'create' ? 'Create Custom Subpage' : 'Edit Subpage Content';
  const submitLabel = shared ? (mode === 'create' ? 'Save Shared Page' : 'Update Shared Page') : 'Publish Subpage';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-250 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-150 bg-zinc-50 px-6 py-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">{modalTitle}</h3>
            {shared && <p className="mt-1 text-[11px] font-medium text-zinc-500">This page will be displayed as public page on all magazine/journals.</p>}
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700" aria-label="Close form">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-[400px] flex-grow flex-col space-y-4 overflow-y-auto px-6 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-1 sm:col-span-3">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Page Title *</label>
              <input type="text" value={values.title} onChange={(event) => onChange('title', event.target.value)} placeholder="e.g. Editorial Board & Advisory Committee" className={inputClass} />
              <FieldError message={errorFor('title')} />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sort Order *</label>
              <input type="number" min="0" value={values.sort_order} onChange={(event) => onChange('sort_order', Number.parseInt(event.target.value, 10) || 0)} className={`${inputClass} font-mono`} />
              <FieldError message={errorFor('sort_order')} />
            </div>
          </div>

          {shared && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">URL Slug</label>
                  <input type="text" value={values.slug} onChange={(event) => onChange('slug', event.target.value)} placeholder="Auto-generated from title" className={`${inputClass} font-mono`} />
                  <FieldError message={errorFor('slug')} />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status *</label>
                  <Select value={values.status} onChange={(event) => onChange('status', event.target.value)} className={inputClass}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                    <option value="private">Private</option>
                  </Select>
                  <FieldError message={errorFor('status')} />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <input type="checkbox" checked={values.show_in_navigation} onChange={(event) => onChange('show_in_navigation', event.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-[var(--accent)]" />
                <span>
                  <span className="block text-xs font-bold text-zinc-800">Show in public navigation/menu</span>
                  <span className="text-[11px] text-zinc-500">Include this page in the targeted publication menus.</span>
                </span>
              </label>

              {children}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">SEO Title</label>
                  <input type="text" maxLength={255} value={values.seo_title} onChange={(event) => onChange('seo_title', event.target.value)} className={inputClass} />
                  <FieldError message={errorFor('seo_title')} />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">SEO Description</label>
                  <textarea rows={2} maxLength={500} value={values.seo_description} onChange={(event) => onChange('seo_description', event.target.value)} className={inputClass} />
                  <FieldError message={errorFor('seo_description')} />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Page Markup Content *</label>
            <div className="inline-flex rounded-xl border border-zinc-200/50 bg-zinc-100 p-1">
              {[
                ['visual', 'Visual Editor', Edit3],
                ['html', 'Raw HTML Markup', Code],
              ].map(([value, label, Icon]) => (
                <button key={value} type="button" onClick={() => setEditorMode(value)} className={`flex cursor-pointer items-center space-x-2 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${editorMode === value ? 'bg-white text-[var(--accent)] shadow' : 'text-zinc-500 hover:text-zinc-800'}`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[300px] flex-grow flex-col">
            {editorMode === 'visual' ? (
              <RichEditor value={values.content} onChange={(content) => onChange('content', content)} placeholder="Start writing guidelines, resources, or policies..." />
            ) : (
              <textarea value={values.content} onChange={(event) => onChange('content', event.target.value)} rows={12} style={{ color: '#ffffff' }} className="w-full flex-grow rounded-xl border border-zinc-850 bg-zinc-900 p-4 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" placeholder="<!-- Custom HTML content goes here -->" />
            )}
            <FieldError message={errorFor('content')} />
          </div>

          <div className="sticky bottom-0 z-20 -mx-6 mt-4 flex shrink-0 items-center justify-end space-x-3 border-t border-zinc-150 bg-white/95 px-6 py-4 shadow-[0_-8px_20px_rgba(0,0,0,0.04)] backdrop-blur">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-xl bg-zinc-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:bg-zinc-200">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex cursor-pointer items-center justify-center space-x-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[var(--accent)]/95 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>{submitLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
