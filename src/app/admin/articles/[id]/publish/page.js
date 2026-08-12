'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, CheckCircle2, FileCheck2, FileText, Image as ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import api from '../../../../../utils/api';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import { safeApiMessage } from '../../../../../utils/safeErrors';
import { logError } from '../../../../../utils/safeLogger';
import LoadingState from '../../../../../components/ui/LoadingState';
import ErrorState from '../../../../../components/ui/ErrorState';
import RichEditor from '../../../../../components/ui/RichEditor';
import FlatpickrInput from '../../../../../components/ui/FlatpickrInput';
import { Input, Label, Select, Textarea } from '../../../../../components/ui/Input';
import { uploadAndAwaitClean } from '../../../../../lib/mediaUploads/DirectUploadClient';

const STEPS = ['Publication Information', 'Publication Sections', 'Publication Files', 'Publication Metadata', 'Finalize Publication'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PUBLISHABLE = new Set(['accepted', 'ready_for_publication', 'published']);
const newId = () => `section-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const sectionKey = (value, fallback = 'section') => String(value || fallback).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100);
const defaultSections = (article) => [
  { client_id: newId(), section_key: 'abstract', title: 'Abstract', content_html: article.abstract || '', sort_order: 1, media_upload_session_id: null, image_url: null },
  { client_id: newId(), section_key: 'introduction', title: 'Introduction', content_html: '', sort_order: 2, media_upload_session_id: null, image_url: null },
  { client_id: newId(), section_key: 'materials_and_methods', title: 'Materials and Methods', content_html: '', sort_order: 3, media_upload_session_id: null, image_url: null },
  { client_id: newId(), section_key: 'discussion', title: 'Discussion', content_html: '', sort_order: 4, media_upload_session_id: null, image_url: null },
];

function Field({ label, required, children }) {
  return <div><Label required={required}>{label}</Label>{children}</div>;
}

function Card({ title, description, children, actions }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-base font-bold text-[var(--foreground)]">{title}</h2>{description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}</div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function FileGroup({ title, files, finalSourceId, onSelectFinal, settings, onSetting }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{title}</h3>
      {files.length === 0 ? <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">No files in this category.</p> : files.map((file) => {
        const isPdf = file.mime_type === 'application/pdf';
        const visibility = settings[file.id] || {};
        return (
          <div key={file.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="truncate text-sm font-bold text-[var(--foreground)]">{file.file_title || file.original_name}</p><p className="mt-1 text-xs text-[var(--muted)]">{file.original_name} · {file.mime_type || 'Document'}</p></div>
              <label className={`inline-flex items-center gap-2 text-xs font-bold ${isPdf ? 'cursor-pointer text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                <input type="radio" name="final-source" checked={Number(finalSourceId) === Number(file.id)} disabled={!isPdf} onChange={() => onSelectFinal(file.id)} />
                {isPdf ? 'Use as final PDF' : 'Not a PDF'}
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 border-t border-[var(--border)] pt-3 text-xs font-semibold text-[var(--muted)]">
              {[['show_on_article', 'Public article'], ['show_in_downloads', 'Downloads'], ['include_in_package', 'Publication package']].map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(visibility[key])} onChange={(event) => onSetting(file.id, key, event.target.checked)} />{label}</label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PublishArticlePage() {
  const { id } = useParams();
  const router = useRouter();
  const { hasRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [article, setArticle] = useState(null);
  const [issues, setIssues] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingSection, setUploadingSection] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState([]);
  const [form, setForm] = useState(null);
  const storageKey = `publication-wizard:${id}`;
  const canFinalize = hasRole('super_admin') || hasRole('publisher');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get(`/admin/articles/${id}/workflow`);
      const current = response.data.article;
      if (!PUBLISHABLE.has(current.status)) throw new Error('Only accepted or ready-for-publication articles can enter publication.');
      const issueResponse = await api.get('/admin/issues', { params: { magazine_id: current.magazine_id, per_page: 100 } });
      setArticle(current); setIssues(issueResponse.data?.data || []);
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      const restored = saved ? JSON.parse(saved) : null;
      const existingSections = (current.publication_sections || []).map((section, index) => ({ ...section, client_id: newId(), sort_order: index + 1 }));
      const base = {
        title: current.title || '', magazine_issue_id: current.issue?.id ? String(current.issue.id) : '',
        published_year: String(current.published_year || new Date().getFullYear()), published_month: current.published_month || MONTHS[new Date().getMonth()],
        article_type: current.article_type || '', article_category: current.article_category || '', open_access_label: current.open_access_label || 'Open Access',
        is_peer_reviewed: current.is_peer_reviewed !== false, academic_editor: current.academic_editor || '', received_at: current.received_at?.slice?.(0, 10) || '', accepted_at: current.accepted_at?.slice?.(0, 10) || '',
        license_statement: current.license_statement || '', data_availability_statement: current.data_availability_statement || '', funding_statement: current.funding_statement || '', competing_interests_statement: current.competing_interests_statement || '', abbreviations: current.abbreviations || '', citation_text: current.citation_text || '',
        doi: current.doi || '', page_start: current.page_start || '', page_end: current.page_end || '', sections: existingSections.length ? existingSections : defaultSections(current),
        final_source_file_id: '', final_upload_id: '', final_upload_name: '', file_settings: {},
      };
      const merged = restored ? { ...base, ...restored, sections: restored.sections?.length ? restored.sections.map((s) => ({ ...s, client_id: s.client_id || newId() })) : base.sections } : base;
      const allFiles = [...(current.files || []), ...((current.accepted_file_set?.items || []).map((item) => item.file))].filter(Boolean);
      const uniqueFiles = [...new Map(allFiles.map((file) => [file.id, file])).values()];
      merged.file_settings = Object.fromEntries(uniqueFiles.map((file) => [file.id, restored?.file_settings?.[file.id] || file.publication_visibility || {}]));
      setForm(merged);
    } catch (err) { logError(err); setError(safeApiMessage(err, err.message || 'Unable to load publication workspace.')); }
    finally { setLoading(false); }
  }, [id, storageKey]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);
  useEffect(() => {
    if (!form || typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      const safe = { ...form, sections: form.sections.map(({ preview_url, ...section }) => section) };
      window.localStorage.setItem(storageKey, JSON.stringify(safe));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [form, storageKey]);
  useEffect(() => {
    if (!form) return;
    const missing = form.sections.find((section) => section.media_upload_session_id && !section.preview_url && !section.image_url);
    if (!missing) return;
    let active = true;
    api.get(`/media/uploads/${missing.media_upload_session_id}/preview?stream=1`, { responseType: 'blob' })
      .then((response) => {
        if (!active) return;
        const previewUrl = URL.createObjectURL(response.data);
        setForm((current) => ({ ...current, sections: current.sections.map((section) => section.client_id === missing.client_id ? { ...section, preview_url: previewUrl } : section) }));
      })
      .catch((err) => logError('Unable to restore section image preview', err));
    return () => { active = false; };
  }, [form]);

  const acceptedItems = article?.accepted_file_set?.items || [];
  const accepted = acceptedItems.filter((item) => item.accepted_role === 'manuscript').map((item) => item.file);
  const additional = acceptedItems.filter((item) => item.accepted_role === 'additional').map((item) => item.file);
  const supplementary = acceptedItems.filter((item) => item.accepted_role === 'supplementary').map((item) => item.file);
  const copyedited = (article?.files || []).filter((file) => file.file_type === 'copy_edited_file');
  const production = (article?.files || []).filter((file) => ['proof_file', 'publication_pdf'].includes(file.file_type));
  const allFiles = useMemo(() => [...accepted, ...additional, ...supplementary, ...copyedited, ...production].filter(Boolean), [accepted, additional, supplementary, copyedited, production]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateSection = (clientId, patch) => update('sections', form.sections.map((section) => section.client_id === clientId ? { ...section, ...patch } : section));
  const moveSection = (index, delta) => { const next = [...form.sections]; const target = index + delta; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; update('sections', next.map((s, i) => ({ ...s, sort_order: i + 1 }))); };
  const removeSection = (index) => update('sections', form.sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, sort_order: i + 1 })));
  const addSection = () => update('sections', [...form.sections, { client_id: newId(), section_key: `custom_section_${form.sections.length + 1}`, title: 'Custom Section', content_html: '', sort_order: form.sections.length + 1, media_upload_session_id: null, image_url: null }]);
  const setFileSetting = (fileId, key, value) => update('file_settings', { ...form.file_settings, [fileId]: { ...(form.file_settings[fileId] || {}), [key]: value } });

  const uploadSectionImage = async (section, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file); updateSection(section.client_id, { preview_url: preview }); setUploadingSection(section.client_id);
    try {
      const upload = await uploadAndAwaitClean({ file, purpose: 'publication_section_image', attachableId: Number(id) });
      updateSection(section.client_id, { media_upload_session_id: upload.id, preview_url: preview }); toast('Section image uploaded and passed security scanning.', 'success');
    } catch (err) { updateSection(section.client_id, { preview_url: null }); toast(err.userMessage || safeApiMessage(err, 'Section image upload failed.'), 'error'); }
    finally { setUploadingSection(null); }
  };
  const uploadFinalPdf = async (file) => {
    if (!file) return; setBusy(true);
    try { const upload = await uploadAndAwaitClean({ file, purpose: 'article_published_pdf', attachableId: Number(id) }); update('final_upload_id', upload.id); setForm((current) => ({ ...current, final_upload_id: upload.id, final_upload_name: file.name, final_source_file_id: '' })); toast('Final PDF uploaded and scanned.', 'success'); }
    catch (err) { toast(err.userMessage || safeApiMessage(err, 'Final PDF upload failed.'), 'error'); }
    finally { setBusy(false); }
  };

  const validateStep = (target = step) => {
    const nextErrors = [];
    if (target === 0 && !form.title.trim()) nextErrors.push('Publication title is required.');
    if (target === 1) { if (!form.sections.length) nextErrors.push('At least one publication section is required.'); form.sections.forEach((s, i) => { if (!s.title.trim()) nextErrors.push(`Section ${i + 1} needs a title.`); }); }
    if (target === 2 && !form.final_source_file_id && !form.final_upload_id) nextErrors.push('Select a clean PDF from the accepted/production files or upload a final PDF.');
    if (target === 3) {
      if (!form.magazine_issue_id) nextErrors.push('Issue is required.');
      if (!form.published_year) nextErrors.push('Publication year is required.');
      if (form.doi && !/^10\.\d{4,9}\/[\-._;()/:A-Z0-9]+$/i.test(form.doi.trim())) nextErrors.push('Enter a valid DOI such as 10.1234/example.');
      if (form.page_start && form.page_end && Number(form.page_end) < Number(form.page_start)) nextErrors.push('Ending page must be greater than or equal to starting page.');
    }
    setErrors(nextErrors); return nextErrors.length === 0;
  };
  const next = () => { if (validateStep()) { setErrors([]); setStep((value) => Math.min(4, value + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const finalize = async () => {
    const invalid = [0, 1, 2, 3].some((index) => !validateStep(index));
    if (invalid || !confirmed || !canFinalize) { if (!confirmed) setErrors(['Confirm that all publication information is correct.']); return; }
    setBusy(true);
    try {
      const payload = { ...form,
        magazine_issue_id: Number(form.magazine_issue_id), published_year: Number(form.published_year), page_start: form.page_start ? Number(form.page_start) : null, page_end: form.page_end ? Number(form.page_end) : null,
        publication_pdf_upload_id: form.final_upload_id || null, final_source_file_id: form.final_source_file_id ? Number(form.final_source_file_id) : null,
        publication_sections: form.sections.map((section, index) => ({ section_key: sectionKey(section.section_key || section.title, `section_${index + 1}`), title: section.title, content_html: section.content_html, sort_order: index + 1, media_upload_session_id: section.media_upload_session_id || null })),
        publication_file_settings: allFiles.map((file) => ({ file_id: file.id, ...(form.file_settings[file.id] || {}) })),
      };
      delete payload.sections; delete payload.file_settings; delete payload.final_upload_id; delete payload.final_upload_name;
      await api.post(`/admin/articles/${id}/publish`, payload);
      window.localStorage.removeItem(storageKey); toast('Article published successfully.', 'success'); router.push(`/admin/articles/${id}/workflow`);
    } catch (err) { logError(err); setErrors([safeApiMessage(err, 'Publication could not be finalized.')]); }
    finally { setBusy(false); }
  };

  if (loading || authLoading) return <LoadingState label="Preparing publication workspace..." className="min-h-[60vh]" />;
  if (error || !form) return <ErrorState title="Publication workspace unavailable" message={error} onRetry={load} />;

  const chosenFile = allFiles.find((file) => Number(file.id) === Number(form.final_source_file_id));
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">
      <header className="mb-6">
        <Link href={`/admin/articles/${id}/workflow`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)]"><ArrowLeft className="h-4 w-4" />Back to workflow</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Publication workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Publish Article</h1><p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">{article.title}</p></div><span className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]">Draft auto-saved in this browser</span></div>
      </header>

      <ol className="mb-7 grid gap-2 md:grid-cols-5" aria-label="Publication progress">
        {STEPS.map((label, index) => <li key={label}><button type="button" onClick={() => index <= step && setStep(index)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${index === step ? 'border-[var(--accent)] bg-amber-500/10' : index < step ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[var(--border)] bg-[var(--surface)]'}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index < step ? 'bg-emerald-600 text-white' : index === step ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-muted)] text-[var(--muted)]'}`}>{index < step ? <Check className="h-4 w-4" /> : index + 1}</span><span className="text-xs font-bold text-[var(--foreground)]">{label}</span></button></li>)}
      </ol>

      {errors.length > 0 && <div className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"><ul className="list-disc space-y-1 pl-5">{errors.map((item) => <li key={item}>{item}</li>)}</ul></div>}

      <div className="space-y-5">
        {step === 0 && <>
          <Card title="Core publication information" description="Issue placement, timing, and editorial attribution."><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Publication title" required><Input value={form.title} onChange={(e) => update('title', e.target.value)} /></Field>
            <Field label="Issue" required><Select value={form.magazine_issue_id} onChange={(e) => update('magazine_issue_id', e.target.value)}><option value="">Select issue</option>{issues.map((issue) => <option key={issue.id} value={issue.id}>Volume {issue.volume_number}, Issue {issue.issue_number}{issue.special_title ? ` — ${issue.special_title}` : ''}</option>)}</Select></Field>
            <Field label="Academic editor"><Input value={form.academic_editor} onChange={(e) => update('academic_editor', e.target.value)} /></Field>
            <Field label="Year" required><Select value={form.published_year} onChange={(e) => update('published_year', e.target.value)}>{Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i)).map((year) => <option key={year}>{year}</option>)}</Select></Field>
            <Field label="Month"><Select value={form.published_month} onChange={(e) => update('published_month', e.target.value)}>{MONTHS.map((month) => <option key={month}>{month}</option>)}</Select></Field>
            <Field label="Open access label"><Input value={form.open_access_label} onChange={(e) => update('open_access_label', e.target.value)} /></Field>
            <Field label="Received date"><FlatpickrInput value={form.received_at} onChange={(value) => update('received_at', value)} /></Field>
            <Field label="Accepted date"><FlatpickrInput value={form.accepted_at} onChange={(value) => update('accepted_at', value)} /></Field>
            <label className="flex items-center gap-3 self-end rounded-lg border border-[var(--border)] p-3 text-sm font-semibold"><input type="checkbox" checked={form.is_peer_reviewed} onChange={(e) => update('is_peer_reviewed', e.target.checked)} />Peer reviewed</label>
          </div></Card>
          <Card title="Statements and citation"><div className="grid gap-4 md:grid-cols-2">{[['license_statement', 'Copyright / license'], ['funding_statement', 'Funding'], ['data_availability_statement', 'Data availability'], ['competing_interests_statement', 'Competing interests'], ['citation_text', 'Citation text'], ['abbreviations', 'Abbreviations']].map(([key, label]) => <Field key={key} label={label}><Textarea rows={3} value={form[key]} onChange={(e) => update(key, e.target.value)} /></Field>)}</div></Card>
        </>}

        {step === 1 && <Card title="Publication sections" description="Rename, reorder, preview, and enrich each section. The abstract title is fully editable." actions={<button type="button" onClick={addSection} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-bold"><Plus className="h-4 w-4" />Add section</button>}>
          <div className="space-y-5">{form.sections.map((section, index) => <article key={section.client_id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
              <Field label={`Section ${index + 1} title`} required><Input value={section.title} onChange={(e) => updateSection(section.client_id, { title: e.target.value, section_key: sectionKey(e.target.value, section.section_key) })} /></Field>
              <div><Label>Section image</Label><label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold"><Upload className="h-4 w-4" />{uploadingSection === section.client_id ? 'Scanning image...' : 'Upload image'}<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingSection === section.client_id} onChange={(e) => uploadSectionImage(section, e.target.files?.[0])} /></label></div>
              <div className="flex items-end gap-1"><button type="button" aria-label="Move up" disabled={index === 0} onClick={() => moveSection(index, -1)} className="rounded-lg border border-[var(--border)] p-2 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" aria-label="Move down" disabled={index === form.sections.length - 1} onClick={() => moveSection(index, 1)} className="rounded-lg border border-[var(--border)] p-2 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" aria-label="Delete section" disabled={section.section_key === 'abstract'} onClick={() => removeSection(index)} className="rounded-lg border border-red-200 p-2 text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>
            </div>
            {(section.preview_url || section.image_url) && <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-white"><img src={section.preview_url || section.image_url} alt={`${section.title} preview`} className="mx-auto max-h-72 w-full object-contain" /></div>}
            <div className="mt-4"><RichEditor value={section.content_html} onChange={(value) => updateSection(section.client_id, { content_html: value })} minHeight="190px" /></div>
            <details className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><summary className="cursor-pointer text-xs font-bold uppercase tracking-wider">Preview section</summary><div className="prose prose-sm mt-4 max-w-none dark:prose-invert"><h2>{section.title}</h2>{(section.preview_url || section.image_url) && <img src={section.preview_url || section.image_url} alt="" className="max-h-72 object-contain" />}<div dangerouslySetInnerHTML={{ __html: section.content_html }} /></div></details>
          </article>)}</div>
        </Card>}

        {step === 2 && <>
          <Card title="Accepted file set" description={`Files are locked to ${article.accepted_file_set?.version?.label || 'the accepted version'}. Earlier revisions are not mixed into this workspace.`}><div className="grid gap-7 lg:grid-cols-2"><FileGroup title="Accepted manuscript" files={accepted} finalSourceId={form.final_source_file_id} onSelectFinal={(value) => setForm({ ...form, final_source_file_id: value, final_upload_id: '', final_upload_name: '' })} settings={form.file_settings} onSetting={setFileSetting} /><FileGroup title="Additional manuscript files" files={additional} finalSourceId={form.final_source_file_id} onSelectFinal={(value) => setForm({ ...form, final_source_file_id: value, final_upload_id: '', final_upload_name: '' })} settings={form.file_settings} onSetting={setFileSetting} /><FileGroup title="Supplementary files" files={supplementary} finalSourceId={form.final_source_file_id} onSelectFinal={(value) => setForm({ ...form, final_source_file_id: value, final_upload_id: '', final_upload_name: '' })} settings={form.file_settings} onSetting={setFileSetting} /></div></Card>
          <Card title="Production outputs" description="Copyediting and proof files remain distinct from the accepted author file set."><div className="grid gap-7 lg:grid-cols-2"><FileGroup title="Copy editing files" files={copyedited} finalSourceId={form.final_source_file_id} onSelectFinal={(value) => setForm({ ...form, final_source_file_id: value, final_upload_id: '', final_upload_name: '' })} settings={form.file_settings} onSetting={setFileSetting} /><FileGroup title="Production files" files={production} finalSourceId={form.final_source_file_id} onSelectFinal={(value) => setForm({ ...form, final_source_file_id: value, final_upload_id: '', final_upload_name: '' })} settings={form.file_settings} onSetting={setFileSetting} /></div></Card>
          <Card title="Upload final publication PDF" description="Uploading a new final PDF replaces the selected existing source. Only the active final source will be published."><label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-8 text-sm font-bold"><Upload className="h-5 w-5" />{form.final_upload_name || 'Choose a PDF (maximum 25 MB)'}<input type="file" accept="application/pdf" className="sr-only" onChange={(e) => uploadFinalPdf(e.target.files?.[0])} /></label></Card>
        </>}

        {step === 3 && <Card title="Publication metadata" description="Validate identifiers and pagination before final review."><div className="grid gap-5 md:grid-cols-2">
          <Field label="DOI"><Input value={form.doi} placeholder="10.1234/article" onChange={(e) => update('doi', e.target.value)} /><p className="mt-2 text-xs text-[var(--muted)]">Preview: {form.doi ? `https://doi.org/${form.doi}` : 'DOI not supplied'}</p></Field>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Issue placement</p><p className="mt-2 text-sm font-bold">{issues.find((issue) => String(issue.id) === String(form.magazine_issue_id)) ? `Volume ${issues.find((issue) => String(issue.id) === String(form.magazine_issue_id)).volume_number}, Issue ${issues.find((issue) => String(issue.id) === String(form.magazine_issue_id)).issue_number}` : 'No issue selected'}</p></div>
          <Field label="Starting page"><Input type="number" min="1" value={form.page_start} onChange={(e) => update('page_start', e.target.value)} /></Field><Field label="Ending page"><Input type="number" min="1" value={form.page_end} onChange={(e) => update('page_end', e.target.value)} /></Field>
        </div></Card>}

        {step === 4 && <>
          <Card title="Publication summary" description="Review the complete release package before making it public."><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[
            ['Issue', issues.find((i) => String(i.id) === String(form.magazine_issue_id)) ? `Volume ${issues.find((i) => String(i.id) === String(form.magazine_issue_id)).volume_number}, Issue ${issues.find((i) => String(i.id) === String(form.magazine_issue_id)).issue_number}` : 'Missing'], ['Year / month', `${form.published_month} ${form.published_year}`], ['DOI', form.doi || 'Not supplied'], ['Final PDF', form.final_upload_name || chosenFile?.original_name || 'Missing'], ['Accepted version', article.accepted_file_set?.version?.label || 'Unavailable'], ['Publication sections', String(form.sections.length)], ['Section images', String(form.sections.filter((s) => s.media_upload_session_id).length)], ['Visible files', String(Object.values(form.file_settings).filter((s) => s.show_on_article || s.show_in_downloads).length)], ['Hidden files', String(allFiles.length - Object.values(form.file_settings).filter((s) => s.show_on_article || s.show_in_downloads).length)],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"><dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</dt><dd className="mt-2 text-sm font-bold text-[var(--foreground)]">{value}</dd></div>)}</dl></Card>
          <Card title="Final confirmation"><label className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm font-semibold"><input className="mt-0.5" type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />I confirm all publication information, files, visibility choices, and metadata are correct.</label>{!canFinalize && <p className="mt-4 text-sm font-semibold text-[var(--muted)]">This workspace is read-only for your role. Only a Super Admin or assigned Publisher can finalize publication.</p>}</Card>
        </>}
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><button type="button" disabled={step === 0 || busy} onClick={() => setStep((value) => value - 1)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-bold disabled:opacity-40"><ArrowLeft className="h-4 w-4" />Back</button><p className="hidden text-xs font-semibold text-[var(--muted)] sm:block">Step {step + 1} of {STEPS.length}</p>{step < 4 ? <button type="button" disabled={busy || Boolean(uploadingSection)} onClick={next} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-bold text-[var(--primary-foreground)] disabled:opacity-50">Next<ArrowRight className="h-4 w-4" /></button> : <button type="button" disabled={busy || !confirmed || !canFinalize} onClick={finalize} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Finalize Publication</button>}</div></footer>
    </main>
  );
}
