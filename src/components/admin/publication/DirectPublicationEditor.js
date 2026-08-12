'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, CheckCircle2, FileUp, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { safeApiMessage, safeApiValidationErrors } from '../../../utils/safeErrors';
import { uploadAndAwaitClean } from '../../../lib/mediaUploads/DirectUploadClient';
import RichEditor from '../../ui/RichEditor';
import FlatpickrInput from '../../ui/FlatpickrInput';
import { Input, Label, Select, Textarea } from '../../ui/Input';
import ArticleThreadWorkspace from '../threads/ArticleThreadWorkspace';
import { canStartDirectPublicationUpload, directPublicationIssueLabel, getOrCreateDraftOperation, isMultiFileDirectPublicationPurpose, restoredDirectPublicationStep, selectedDirectPublicationFiles } from './directPublicationUtils.mjs';

const STEPS = ['Publication Information', 'Authors & Declarations', 'Publication Sections', 'Publication Files', 'Publication Metadata', 'Finalize Publication', 'Communication'];
const newId = () => `section-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const requestKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const headers = () => ({ 'Idempotency-Key': requestKey() });
const sectionKey = (value, fallback = 'section') => String(value || fallback).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100);
const blankAuthor = () => ({ name: '', email: '', affiliation: '', department: '', country: '', orcid: '', is_corresponding: false });
const defaultSections = (abstract = '') => [
  { client_id: newId(), section_key: 'abstract', title: 'Abstract', content_html: abstract, sort_order: 1, media_upload_session_id: null, image_url: null },
  { client_id: newId(), section_key: 'introduction', title: 'Introduction', content_html: '', sort_order: 2, media_upload_session_id: null, image_url: null },
  { client_id: newId(), section_key: 'materials_and_methods', title: 'Materials and Methods', content_html: '', sort_order: 3, media_upload_session_id: null, image_url: null },
  { client_id: newId(), section_key: 'results', title: 'Results', content_html: '', sort_order: 4, media_upload_session_id: null, image_url: null },
  { client_id: newId(), section_key: 'discussion', title: 'Discussion', content_html: '', sort_order: 5, media_upload_session_id: null, image_url: null },
  { client_id: newId(), section_key: 'references', title: 'References', content_html: '', sort_order: 6, media_upload_session_id: null, image_url: null },
];
const blankForm = () => ({
  magazine_id: '', magazine_issue_id: '', title: '', subtitle: '', abstract: '', keywords_text: '', article_type: '', article_category: '', subject_area: '', language: 'English',
  open_access_label: 'Open Access', academic_editor: '', received_at: '', authors: [blankAuthor()],
  ethical_approval_statement: '', conflict_of_interest_statement: '', funding_statement: '', data_availability_statement: '', author_contribution_statement: '', license_statement: '',
  doi: '', page_start: '', page_end: '', online_publication_date: '', print_publication_date: '', citation_text: '', abbreviations: '', sections: defaultSections(), file_settings: {},
});

function Card({ title, description, children, actions }) {
  return <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold text-[var(--foreground)]">{title}</h2>{description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}</div>{actions}</div>{children}</section>;
}
function Field({ label, required, children }) { return <div><Label required={required}>{label}</Label>{children}</div>; }

function FileGroup({ title, files, primaryId, onPrimary, onRemove, settings, onSetting, published }) {
  return <div className="space-y-3"><h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{title}</h3>{files.length === 0 ? <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">No files in this category.</p> : files.map((file) => {
    const isFinalPdf = file.file_type === 'direct_publication_manuscript' && file.mime_type === 'application/pdf';
    const visibility = settings[file.id] || {};
    const publicEligible = ['direct_publication_figure', 'direct_publication_supplementary', 'direct_publication_cover'].includes(file.file_type);
    return <div key={file.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-[var(--foreground)]">{file.file_title || file.original_name}</p><p className="mt-1 text-xs text-[var(--muted)]">{file.original_name} · {file.mime_type || 'Document'} · {file.scan_status || 'clean'}</p></div><div className="flex items-center gap-3">{file.download_url && <a href={file.download_url} className="text-xs font-bold text-[var(--primary)]">View / download</a>}{isFinalPdf && <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-[var(--primary)]"><input type="radio" name="direct-final-pdf" checked={Number(primaryId) === Number(file.id)} onChange={() => onPrimary(file.id)} />{Number(primaryId) === Number(file.id) ? 'Final public PDF' : published ? 'Replace public PDF' : 'Use as final PDF'}</label>}{!published && <button type="button" onClick={() => onRemove(file)} className="text-xs font-bold text-red-600"><Trash2 className="mr-1 inline h-4 w-4"/>Remove</button>}</div></div><div className="mt-3 flex flex-wrap gap-4 border-t border-[var(--border)] pt-3 text-xs font-semibold text-[var(--muted)]">{publicEligible && [['show_on_article', 'Public article'], ['show_in_downloads', 'Downloads']].map(([key, label]) => <label key={key} className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(visibility[key])} onChange={(event) => onSetting(file.id, key, event.target.checked)} />{label}</label>)}<label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(visibility.include_in_package)} onChange={(event) => onSetting(file.id, 'include_in_package', event.target.checked)} />Publication package</label></div></div>;
  })}</div>;
}

function UploadQueue({ items, onRetry, onDismiss }) {
  if (items.length === 0) return null;
  const labels = { queued: 'Queued', initiating: 'Preparing…', uploading: 'Uploading…', awaiting_scan: 'Scanning…', scanning: 'Scanning…', attaching: 'Processing…', ready: 'Ready', failed: 'Failed' };
  return <div className="mt-5 grid gap-3 md:grid-cols-2">{items.map((item) => <div key={item.id} className={`rounded-xl border p-4 ${item.status === 'failed' ? 'border-red-300 bg-red-50' : item.status === 'ready' ? 'border-emerald-300 bg-emerald-50' : 'border-[var(--border)] bg-[var(--surface-muted)]'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{item.file.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{labels[item.status] || item.status}{item.status === 'uploading' ? ` ${item.progress || 0}%` : ''}</p>{item.error && <p className="mt-1 text-xs font-semibold text-red-700">{item.error}</p>}</div><div className="flex gap-2">{item.status === 'failed' && <button type="button" onClick={() => onRetry(item)} className="text-xs font-bold text-red-700">Retry</button>}{['failed', 'ready'].includes(item.status) && <button type="button" onClick={() => onDismiss(item.id)} className="text-xs font-bold text-[var(--muted)]">Dismiss</button>}</div></div>{item.status === 'uploading' && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-indigo-600 transition-all" style={{ width: `${item.progress || 0}%` }}/></div>}</div>)}</div>;
}

export default function DirectPublicationEditor({ articleId = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const allowed = hasRole('super_admin') || hasRole('publisher');
  const [draftId, setDraftId] = useState(articleId);
  const draftIdRef = useRef(articleId);
  const creationInProgressRef = useRef(null);
  const nextInProgressRef = useRef(false);
  const refreshQueueRef = useRef(Promise.resolve());
  const [article, setArticle] = useState(null);
  const [options, setOptions] = useState({ magazines: [], issues: [], article_types: [], categories: [], subject_areas: [], languages: [] });
  const [form, setForm] = useState(blankForm);
  const requestedStep = useRef(searchParams.get('step')).current;
  const [step, setStep] = useState(() => restoredDirectPublicationStep({ requestedStep, savedStep: 0, status: null, stepCount: STEPS.length }));
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadItems, setUploadItems] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingSection, setUploadingSection] = useState(null);
  const [errors, setErrors] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const activeDraftId = draftId || articleId;
  const storageKey = `direct-publication-wizard:${articleId || 'new'}`;
  const stepStorageKey = `${storageKey}:step`;
  const creationStorageKey = 'direct-publication-wizard:new:create-operation';
  const status = article?.status || 'direct_publication_draft';

  const hydrate = useCallback((data, blockers) => {
    const publication = data.latest_publication_record || {};
    const sections = (data.publication_sections || []).map((section, index) => ({ ...section, client_id: newId(), sort_order: index + 1 }));
    const fileSettings = Object.fromEntries((data.files || []).map((file) => [file.id, file.publication_visibility || file.metadata?.publication_visibility || {}]));
    setArticle(data); setReadiness(blockers);
    setForm({ ...blankForm(), ...data, ...publication,
      magazine_id: String(data.magazine_id || ''), magazine_issue_id: String(publication.magazine_issue_id || ''),
      keywords_text: Array.isArray(data.keywords) ? data.keywords.join(', ') : '',
      online_publication_date: publication.online_publication_date?.slice?.(0, 10) || '', print_publication_date: publication.print_publication_date?.slice?.(0, 10) || '',
      authors: (data.article_authors || []).length ? data.article_authors.map((author) => ({ name: author.co_author_name, email: author.co_author_email, affiliation: author.affiliation || '', department: author.department || '', country: author.country || '', orcid: author.orcid || '', is_corresponding: Boolean(author.is_corresponding) })) : [blankAuthor()],
      sections: sections.length ? sections : defaultSections(data.abstract || ''), file_settings: fileSettings,
    });
  }, []);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const requests = [api.get('/admin/direct-publications/options')];
      if (articleId) requests.push(api.get(`/admin/direct-publications/${articleId}`));
      const [optionResponse, detailResponse] = await Promise.all(requests);
      setOptions(optionResponse.data.data);
      if (detailResponse) {
        hydrate(detailResponse.data.data, detailResponse.data.readiness);
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
        if (saved) setForm((current) => ({ ...current, ...JSON.parse(saved) }));
        const savedStep = typeof window !== 'undefined' ? window.localStorage.getItem(stepStorageKey) : null;
        setStep(restoredDirectPublicationStep({ requestedStep, savedStep, status: detailResponse.data.data?.status, stepCount: STEPS.length }));
      }
      else {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
        if (saved) setForm({ ...blankForm(), ...JSON.parse(saved) });
        const savedStep = typeof window !== 'undefined' ? window.localStorage.getItem(stepStorageKey) : null;
        setStep(restoredDirectPublicationStep({ requestedStep, savedStep, status: null, stepCount: STEPS.length }));
      }
    } catch (error) { setErrors([safeApiMessage(error, 'The direct-publication workspace could not be loaded.')]); }
    finally { setLoading(false); }
  }, [allowed, articleId, hydrate, requestedStep, stepStorageKey, storageKey]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);
  useEffect(() => { if (loading || typeof window === 'undefined') return; const timer = window.setTimeout(() => window.localStorage.setItem(storageKey, JSON.stringify({ ...form, sections: form.sections.map(({ preview_url, ...section }) => section) })), 350); return () => window.clearTimeout(timer); }, [form, loading, storageKey]);
  useEffect(() => { if (loading || typeof window === 'undefined' || status !== 'direct_publication_draft') return; window.localStorage.setItem(stepStorageKey, String(step)); }, [loading, status, step, stepStorageKey]);
  useEffect(() => {
    if (loading || searchParams.get('step') === String(step)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', String(step));
    const editorPath = draftIdRef.current ? `/admin/direct-publications/${draftIdRef.current}` : pathname;
    router.replace(`${editorPath}?${params.toString()}`, { scroll: false });
  }, [loading, pathname, router, searchParams, step]);
  useEffect(() => {
    const missing = form.sections.find((section) => section.media_upload_session_id && !section.preview_url && status !== 'published');
    if (!missing) return;
    let active = true;
    api.get(`/media/uploads/${missing.media_upload_session_id}/preview?stream=1`, { responseType: 'blob' }).then((response) => {
      if (active) updateSection(missing.client_id, { preview_url: URL.createObjectURL(response.data) });
    }).catch(() => {});
    return () => { active = false; };
  }, [form.sections, status]);

  const issues = options.issues.filter((issue) => String(issue.magazine_id) === String(form.magazine_id));
  const files = (article?.files || []).filter((file) => file.is_active !== false);
  const groups = useMemo(() => ({
    manuscripts: files.filter((file) => file.file_type === 'direct_publication_manuscript'),
    covers: files.filter((file) => file.file_type === 'direct_publication_cover'),
    figures: files.filter((file) => file.file_type === 'direct_publication_figure'),
    supplementary: files.filter((file) => file.file_type === 'direct_publication_supplementary'),
    sources: files.filter((file) => file.file_type === 'direct_publication_source'),
  }), [files]);
  const queuedUploads = Object.values(uploadItems);
  const hasActiveUploads = queuedUploads.some((item) => !['ready', 'failed'].includes(item.status));
  const primaryId = article?.latest_publication_record?.primary_publication_file_id;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const payload = ({ includeAuthors = true } = {}) => {
    const result = { ...form, magazine_id: Number(form.magazine_id), magazine_issue_id: form.magazine_issue_id ? Number(form.magazine_issue_id) : null,
      keywords: form.keywords_text.split(',').map((value) => value.trim()).filter(Boolean), page_start: form.page_start ? Number(form.page_start) : null, page_end: form.page_end ? Number(form.page_end) : null,
      publication_sections: form.sections.map((section, index) => ({ section_key: sectionKey(section.section_key || section.title, `section_${index + 1}`), title: section.title, content_html: section.content_html, sort_order: index + 1, media_upload_session_id: section.media_upload_session_id || null })),
    };
    delete result.keywords_text; delete result.sections; delete result.file_settings;
    if (!includeAuthors) delete result.authors;
    return result;
  };

  const refresh = (id = draftIdRef.current) => {
    if (!id) return Promise.resolve();
    const queuedRefresh = refreshQueueRef.current.catch(() => {}).then(async () => {
      const response = await api.get(`/admin/direct-publications/${id}`);
      hydrate(response.data.data, response.data.readiness);
    });
    refreshQueueRef.current = queuedRefresh;
    return queuedRefresh;
  };
  const run = async (callback, success, shouldRefresh = true) => { setBusy(true); setErrors([]); try { const response = await callback(); if (shouldRefresh && draftIdRef.current) await refresh(); if (success) toast(success, 'success'); return response.data?.data; } catch (error) { const validation = safeApiValidationErrors(error, ['magazine_id', 'magazine_issue_id', 'title', 'abstract', 'keywords', 'article_type', 'article_category', 'subject_area', 'language', 'authors', 'publication_sections', 'publication_file_settings', 'doi', 'page_start', 'page_end', 'page_range', 'online_publication_date', 'primary_publication_file']); const messages = Object.values(validation).flat(); setErrors(messages.length ? messages : [safeApiMessage(error, 'The action could not be completed.', { strict: true })]); return null; } finally { setBusy(false); } };

  const ensureDraft = async () => {
    if (draftIdRef.current) return draftIdRef.current;
    if (creationInProgressRef.current) return creationInProgressRef.current;
    const createPayload = { ...payload({ includeAuthors: false }), authors: [] };
    const operation = getOrCreateDraftOperation(window.localStorage, creationStorageKey, createPayload, requestKey);
    creationInProgressRef.current = (async () => {
      const response = await api.post('/admin/direct-publications', operation.payload, { headers: { 'Idempotency-Key': operation.key } });
      const created = response.data.data;
      draftIdRef.current = created.id; setDraftId(created.id); setArticle(created);
      window.localStorage.removeItem(creationStorageKey);
      window.localStorage.removeItem('direct-publication-wizard:new');
      window.localStorage.removeItem('direct-publication-wizard:new:step');
      router.replace(`/admin/direct-publications/${created.id}?step=${step}`, { scroll: false });
      toast('Direct-publication draft created.', 'success');
      return created.id;
    })().finally(() => { creationInProgressRef.current = null; });
    return creationInProgressRef.current;
  };

  const save = async () => {
    const existed = Boolean(draftIdRef.current);
    let id;
    try { setBusy(true); setErrors([]); id = await ensureDraft(); }
    catch (error) { setErrors([safeApiMessage(error, 'The draft could not be created.', { strict: true })]); return false; }
    finally { setBusy(false); }
    if (!id) return false;
    const endpoint = status === 'published' ? `/admin/direct-publications/${id}/correct-metadata` : `/admin/direct-publications/${id}`;
    const includeAuthors = step > 0 || form.authors.every((author) => author.name && author.email && author.affiliation);
    return Boolean(await run(() => status === 'published'
      ? api.post(endpoint, payload({ includeAuthors }), { headers: headers() })
      : api.put(endpoint, payload({ includeAuthors }), { headers: headers() }), status === 'published' ? 'Published content and metadata corrected with an audit record.' : existed ? 'Publication draft saved.' : null));
  };
  const action = async (path, data, success) => {
    const id = draftIdRef.current || await ensureDraft();
    return run(() => api.post(`/admin/direct-publications/${id}/${path}`, data, { headers: headers() }), success);
  };

  const validateStep = (target = step) => {
    const nextErrors = [];
    if (target === 0) { if (!form.magazine_id) nextErrors.push('Select a magazine or journal.'); if (!form.title.trim()) nextErrors.push('Publication title is required.'); }
    if (target === 1) { if (!form.abstract.trim()) nextErrors.push('Abstract is required.'); if (!form.authors.length) nextErrors.push('At least one author is required.'); if (!form.authors.some((author) => author.is_corresponding)) nextErrors.push('Select a corresponding author.'); form.authors.forEach((author, index) => { if (!author.name || !author.email || !author.affiliation) nextErrors.push(`Author ${index + 1} requires name, email, and affiliation.`); }); }
    if (target === 2) { if (!form.sections.length) nextErrors.push('At least one publication section is required.'); form.sections.forEach((section, index) => { if (!section.title.trim()) nextErrors.push(`Section ${index + 1} needs a title.`); }); }
    if (target === 3 && !primaryId) nextErrors.push('Select a clean final PDF as the publication PDF.');
    if (target === 4) { if (!form.magazine_issue_id) nextErrors.push('Issue is required.'); if (!form.doi) nextErrors.push('DOI is required.'); if (!form.online_publication_date) nextErrors.push('Online publication date is required.'); if (!form.page_start || !form.page_end) nextErrors.push('A page range is required.'); if (form.page_start && form.page_end && Number(form.page_end) < Number(form.page_start)) nextErrors.push('Ending page must be greater than or equal to starting page.'); }
    setErrors(nextErrors); return nextErrors.length === 0;
  };
  const next = async () => {
    if (nextInProgressRef.current) return;
    nextInProgressRef.current = true;
    try {
      if (!validateStep()) return;
      if (step <= 2 && !await save()) return;
      if (step === 3) {
        const settings = files.map((file) => ({ file_id: file.id, ...(form.file_settings[file.id] || {}) }));
        if (!await action('public-assets', { publication_file_settings: settings }, 'Publication file visibility saved.')) return;
      }
      if (step === 4 && !await save()) return;
      setStep((value) => Math.min(STEPS.length - 1, value + 1)); window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      nextInProgressRef.current = false;
    }
  };

  const updateAuthor = (index, patch) => update('authors', form.authors.map((author, i) => i === index ? { ...author, ...patch } : author));
  const updateSection = (id, patch) => update('sections', form.sections.map((section) => section.client_id === id ? { ...section, ...patch } : section));
  const addSection = () => update('sections', [...form.sections, { client_id: newId(), section_key: `custom_section_${form.sections.length + 1}`, title: 'Custom Section', content_html: '', sort_order: form.sections.length + 1, media_upload_session_id: null, image_url: null }]);
  const removeSection = (index) => update('sections', form.sections.filter((_, i) => i !== index).map((section, i) => ({ ...section, sort_order: i + 1 })));
  const moveSection = (index, delta) => { const target = index + delta; if (target < 0 || target >= form.sections.length) return; const sections = [...form.sections]; [sections[index], sections[target]] = [sections[target], sections[index]]; update('sections', sections.map((section, i) => ({ ...section, sort_order: i + 1 }))); };
  const setFileSetting = (fileId, key, value) => update('file_settings', { ...form.file_settings, [fileId]: { ...(form.file_settings[fileId] || {}), [key]: value } });

  const uploadSectionImage = async (section, file) => {
    if (!file) return;
    setUploadingSection(section.client_id); const preview = URL.createObjectURL(file); updateSection(section.client_id, { preview_url: preview });
    try { const id = draftIdRef.current || await ensureDraft(); const upload = await uploadAndAwaitClean({ file, purpose: 'publication_section_image', attachableId: Number(id), onProgress: setUploadProgress }); updateSection(section.client_id, { media_upload_session_id: upload.id, preview_url: preview }); toast('Section image uploaded and scanned.', 'success'); }
    catch (error) { updateSection(section.client_id, { preview_url: null }); setErrors([error.userMessage || safeApiMessage(error, 'Section image upload failed.')]); }
    finally { setUploadingSection(null); }
  };
  const patchUploadItem = (itemId, patch) => setUploadItems((current) => ({ ...current, [itemId]: { ...current[itemId], ...patch } }));
  const processUploadItem = async (item) => {
    patchUploadItem(item.id, { status: 'initiating', progress: 0, error: '' });
    try {
      const id = draftIdRef.current || await ensureDraft();
      const upload = await uploadAndAwaitClean({
        file: item.file, purpose: item.purpose, attachableId: Number(id),
        onProgress: (progress) => patchUploadItem(item.id, { status: 'uploading', progress }),
        onState: (state) => patchUploadItem(item.id, { status: state }),
        onStatus: (uploadStatus) => patchUploadItem(item.id, { status: uploadStatus.status === 'scanning' ? 'scanning' : 'awaiting_scan' }),
      });
      patchUploadItem(item.id, { status: 'attaching', progress: 100 });
      await api.post(`/admin/direct-publications/${id}/files`, { upload_id: upload.id, purpose: item.purpose }, { headers: { 'Idempotency-Key': `direct-file-attach:${upload.id}` } });
      patchUploadItem(item.id, { status: 'ready', progress: 100, uploadId: upload.id });
      await refresh(id);
    } catch (error) {
      patchUploadItem(item.id, { status: 'failed', error: error.userMessage || safeApiMessage(error, 'File upload failed.') });
    }
  };
  const uploadFile = (event, purpose) => {
    const selected = selectedDirectPublicationFiles(event.target.files, purpose);
    event.target.value = '';
    if (selected.length === 0) return;
    const items = selected.map((file) => ({ id: requestKey(), file, purpose, status: 'queued', progress: 0, error: '' }));
    setUploadItems((current) => ({ ...current, ...Object.fromEntries(items.map((item) => [item.id, item])) }));
    items.forEach((item) => { void processUploadItem(item); });
  };
  const retryUpload = (item) => { void processUploadItem(item); };
  const dismissUpload = (itemId) => setUploadItems((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== itemId)));
  const selectPrimary = async (fileId) => { await action('select-primary-file', { article_file_id: fileId }, status === 'published' ? 'Public PDF replaced and audited.' : 'Final publication PDF selected.'); };
  const removeFile = async (file) => {
    if (!window.confirm(`Remove ${file.original_name}? This keeps the storage object available for safe cleanup and cannot affect shared files.`)) return;
    const id = draftIdRef.current; if (!id) return;
    await run(() => api.delete(`/admin/direct-publications/${id}/files/${file.id}`, { headers: headers() }), 'File removed from the draft.');
  };

  if (loading || authLoading) return <div className="p-10 text-center text-sm text-[var(--muted)]">Preparing direct-publication workspace…</div>;
  if (!allowed) return <div className="m-6 rounded-xl border border-red-300 bg-red-50 p-5 text-red-700">Direct publications are restricted to Super Admins and assigned Publishers.</div>;

  return <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">
    <header className="mb-6"><Link href="/admin/direct-publications" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)]"><ArrowLeft className="h-4 w-4"/>Back to direct publications</Link><div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">Direct Publication</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)]">{article ? article.title : 'Build Direct Publication'}</h1><p className="mt-2 max-w-3xl text-sm text-amber-700">This privileged workflow bypasses submission, review, acceptance, copyediting, and proofreading.</p></div><span className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]">{status.replaceAll('_', ' ')} · browser draft recovery</span></div></header>
    <ol className="mb-7 grid gap-2 md:grid-cols-3 xl:grid-cols-6" aria-label="Direct publication progress">{STEPS.map((label, index) => <li key={label}><button type="button" onClick={() => index <= step && setStep(index)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${index === step ? 'border-[var(--accent)] bg-amber-500/10' : index < step ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[var(--border)] bg-[var(--surface)]'}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index < step ? 'bg-emerald-600 text-white' : index === step ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-muted)] text-[var(--muted)]'}`}>{index < step ? <Check className="h-4 w-4"/> : index + 1}</span><span className="text-xs font-bold text-[var(--foreground)]">{label}</span></button></li>)}</ol>
    {errors.length > 0 && <div className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700"><ul className="list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

    <div className="space-y-5">
      {step === 0 && <><Card title="Core publication information" description="Choose the publication scope and establish the article record."><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Field label="Magazine or journal" required><Select value={form.magazine_id} onChange={(event) => { update('magazine_id', event.target.value); update('magazine_issue_id', ''); }}><option value="">Select publication</option>{options.magazines.map((magazine) => <option key={magazine.id} value={magazine.id}>{magazine.title} ({magazine.publication_type})</option>)}</Select></Field><Field label="Publication title" required><Input value={form.title} onChange={(event) => update('title', event.target.value)}/></Field><Field label="Subtitle"><Input value={form.subtitle || ''} onChange={(event) => update('subtitle', event.target.value)}/></Field><Field label="Article type"><Input list="direct-types" value={form.article_type || ''} onChange={(event) => update('article_type', event.target.value)}/><datalist id="direct-types">{options.article_types.map((item) => <option key={item.id} value={item.name}/>)}</datalist></Field><Field label="Category"><Input value={form.article_category || ''} onChange={(event) => update('article_category', event.target.value)}/></Field><Field label="Subject area"><Input value={form.subject_area || ''} onChange={(event) => update('subject_area', event.target.value)}/></Field><Field label="Language"><Input value={form.language || ''} onChange={(event) => update('language', event.target.value)}/></Field><Field label="Open access label"><Input value={form.open_access_label || ''} onChange={(event) => update('open_access_label', event.target.value)}/></Field><Field label="Received date"><FlatpickrInput value={form.received_at || ''} onChange={(value) => update('received_at', value)}/></Field></div></Card></>}

      {step === 1 && <><Card title="Abstract and authors" description="Author accounts are never created automatically."><div className="space-y-5"><Field label="Abstract" required><Textarea rows={6} value={form.abstract} onChange={(event) => { update('abstract', event.target.value); const abstract = form.sections.find((section) => section.section_key === 'abstract'); if (abstract && !abstract.content_html) updateSection(abstract.client_id, { content_html: event.target.value }); }}/></Field><Field label="Keywords (comma separated)"><Input value={form.keywords_text} onChange={(event) => update('keywords_text', event.target.value)}/></Field>{form.authors.map((author, index) => <article key={index} className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-2 lg:grid-cols-3"><Field label={`Author ${index + 1} name`} required><Input value={author.name} onChange={(event) => updateAuthor(index, { name: event.target.value })}/></Field><Field label="Email" required><Input type="email" value={author.email} onChange={(event) => updateAuthor(index, { email: event.target.value })}/></Field><Field label="Affiliation" required><Input value={author.affiliation} onChange={(event) => updateAuthor(index, { affiliation: event.target.value })}/></Field><Field label="Department"><Input value={author.department} onChange={(event) => updateAuthor(index, { department: event.target.value })}/></Field><Field label="Country"><Input value={author.country} onChange={(event) => updateAuthor(index, { country: event.target.value })}/></Field><Field label="ORCID"><Input value={author.orcid} onChange={(event) => updateAuthor(index, { orcid: event.target.value })}/></Field><label className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="corresponding-author" checked={author.is_corresponding} onChange={() => update('authors', form.authors.map((item, i) => ({ ...item, is_corresponding: i === index })))}/>Corresponding author</label>{form.authors.length > 1 && <button type="button" onClick={() => update('authors', form.authors.filter((_, i) => i !== index))} className="justify-self-end text-sm font-bold text-red-600"><Trash2 className="mr-1 inline h-4 w-4"/>Remove</button>}</article>)}<button type="button" onClick={() => update('authors', [...form.authors, blankAuthor()])} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-bold"><Plus className="h-4 w-4"/>Add author</button></div></Card><Card title="Declarations"><div className="grid gap-4 md:grid-cols-2">{[['ethical_approval_statement','Ethics'],['conflict_of_interest_statement','Conflict of interest'],['funding_statement','Funding'],['data_availability_statement','Data availability'],['author_contribution_statement','Author contributions'],['license_statement','Copyright / license']].map(([name, label]) => <Field key={name} label={label}><Textarea rows={3} value={form[name] || ''} onChange={(event) => update(name, event.target.value)}/></Field>)}</div></Card></>}

      {step === 2 && <Card title="Publication sections" description="Add any number of rich-text sections, reorder them, attach images, and preview each section." actions={<button type="button" onClick={addSection} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-bold"><Plus className="h-4 w-4"/>Add section</button>}><div className="space-y-5">{form.sections.map((section, index) => <article key={section.client_id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:p-5"><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_auto]"><Field label={`Section ${index + 1} title`} required><Input value={section.title} onChange={(event) => updateSection(section.client_id, { title: event.target.value, section_key: sectionKey(event.target.value, section.section_key) })}/></Field><div><Label>Section image</Label><label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold"><Upload className="h-4 w-4"/>{uploadingSection === section.client_id ? `Uploading ${uploadProgress || 0}%…` : 'Upload image'}<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploadingSection) || !form.magazine_id || !form.title.trim()} onChange={(event) => uploadSectionImage(section, event.target.files?.[0])}/></label></div><div className="flex items-end gap-1"><button type="button" disabled={index === 0} onClick={() => moveSection(index, -1)} className="rounded-lg border border-[var(--border)] p-2 disabled:opacity-30"><ArrowUp className="h-4 w-4"/></button><button type="button" disabled={index === form.sections.length - 1} onClick={() => moveSection(index, 1)} className="rounded-lg border border-[var(--border)] p-2 disabled:opacity-30"><ArrowDown className="h-4 w-4"/></button><button type="button" disabled={section.section_key === 'abstract'} onClick={() => removeSection(index)} className="rounded-lg border border-red-200 p-2 text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4"/></button></div></div>{(section.preview_url || section.image_url) && <div className="mt-4 overflow-hidden rounded-xl border bg-white"><img src={section.preview_url || section.image_url} alt={`${section.title} preview`} className="mx-auto max-h-72 w-full object-contain"/></div>}<div className="mt-4"><RichEditor value={section.content_html} onChange={(value) => updateSection(section.client_id, { content_html: value })} minHeight="190px"/></div><details className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><summary className="cursor-pointer text-xs font-bold uppercase tracking-wider">Preview section</summary><div className="prose prose-sm mt-4 max-w-none dark:prose-invert"><h2>{section.title}</h2>{(section.preview_url || section.image_url) && <img src={section.preview_url || section.image_url} alt="" className="max-h-72 object-contain"/>}<div dangerouslySetInnerHTML={{ __html: section.content_html }}/></div></details></article>)}</div></Card>}

      {step === 3 && <><Card title="Upload publication files" description="Figures and supplementary files accept multi-file batches. Every file is uploaded, scanned, attached, retried, and reported independently."><div className="grid gap-3 md:grid-cols-5">{[['direct_publication_manuscript','Final PDF','application/pdf'],['direct_publication_figure','Figures','image/png,image/jpeg,image/webp,image/tiff,.tif,.tiff'],['direct_publication_cover','Cover image','image/png,image/jpeg,image/webp'],['direct_publication_supplementary','Supplementary files',''],['direct_publication_source','Source file','']].map(([purpose, label, accept]) => { const uploadAllowed = canStartDirectPublicationUpload({ magazineId: form.magazine_id, title: form.title, status, purpose }); const multiple = isMultiFileDirectPublicationPurpose(purpose); const singletonBusy = !multiple && queuedUploads.some((item) => item.purpose === purpose && !['ready', 'failed'].includes(item.status)); return <label key={purpose} className={`rounded-xl border-2 border-dashed p-5 text-center text-sm font-bold ${uploadAllowed && !singletonBusy ? 'cursor-pointer text-[var(--primary)]' : 'cursor-not-allowed text-[var(--muted)]'}`}><FileUp className="mx-auto mb-2 h-5 w-5"/>{status === 'published' && purpose === 'direct_publication_manuscript' ? 'Replacement PDF' : label}<span className="mt-1 block text-[10px] font-medium text-[var(--muted)]">{multiple ? 'Select one or many' : 'Single active file'}</span><input type="file" className="sr-only" accept={accept} multiple={multiple} disabled={!uploadAllowed || singletonBusy} onChange={(event) => uploadFile(event, purpose)}/></label>; })}</div><UploadQueue items={queuedUploads} onRetry={retryUpload} onDismiss={dismissUpload}/></Card><Card title="Publication file package" description="Each figure and supplementary file is independently removable and independently selectable for public exposure."><div className="grid gap-7 lg:grid-cols-2"><FileGroup title="Final PDF" files={groups.manuscripts} primaryId={primaryId} onPrimary={selectPrimary} onRemove={removeFile} settings={form.file_settings} onSetting={setFileSetting} published={status === 'published'}/><FileGroup title="Cover Image" files={groups.covers} primaryId={primaryId} onPrimary={selectPrimary} onRemove={removeFile} settings={form.file_settings} onSetting={setFileSetting} published={status === 'published'}/><FileGroup title="Figures" files={groups.figures} primaryId={primaryId} onPrimary={selectPrimary} onRemove={removeFile} settings={form.file_settings} onSetting={setFileSetting} published={status === 'published'}/><FileGroup title="Supplementary Files" files={groups.supplementary} primaryId={primaryId} onPrimary={selectPrimary} onRemove={removeFile} settings={form.file_settings} onSetting={setFileSetting} published={status === 'published'}/><FileGroup title="Source Files" files={groups.sources} primaryId={primaryId} onPrimary={selectPrimary} onRemove={removeFile} settings={form.file_settings} onSetting={setFileSetting} published={status === 'published'}/></div></Card></>}

      {step === 4 && <><Card title="Issue placement and identifiers" description="These values are checked for issue ownership, DOI uniqueness, and page overlap."><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"><Field label="Issue" required><Select value={form.magazine_issue_id} onChange={(event) => update('magazine_issue_id', event.target.value)}><option value="">Select issue</option>{issues.map((issue) => <option key={issue.id} value={issue.id}>{directPublicationIssueLabel(issue)}</option>)}</Select></Field><Field label="DOI" required><Input value={form.doi || ''} placeholder="10.1234/article" onChange={(event) => update('doi', event.target.value)}/></Field><Field label="Online publication date" required><FlatpickrInput value={form.online_publication_date || ''} onChange={(value) => update('online_publication_date', value)}/></Field><Field label="Print publication date"><FlatpickrInput value={form.print_publication_date || ''} onChange={(value) => update('print_publication_date', value)}/></Field><Field label="Starting page" required><Input type="number" min="1" value={form.page_start || ''} onChange={(event) => update('page_start', event.target.value)}/></Field><Field label="Ending page" required><Input type="number" min="1" value={form.page_end || ''} onChange={(event) => update('page_end', event.target.value)}/></Field></div></Card><Card title="Citation details"><div className="grid gap-4 md:grid-cols-2"><Field label="Citation text"><Textarea rows={4} value={form.citation_text || ''} onChange={(event) => update('citation_text', event.target.value)}/></Field><Field label="Abbreviations"><Textarea rows={4} value={form.abbreviations || ''} onChange={(event) => update('abbreviations', event.target.value)}/></Field></div></Card></>}

      {step === 5 && <><Card title="Publication readiness" description="The same release package is revalidated by the server immediately before scheduling or publishing.">{readiness?.ready ? <p className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><CheckCircle2 className="mr-2 inline h-5 w-5"/>All direct-publication requirements are satisfied.</p> : <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800"><p className="font-bold">Missing requirements</p><ul className="mt-2 list-disc space-y-1 pl-5">{Object.entries(readiness?.errors || {}).flatMap(([name, values]) => values.map((value) => <li key={`${name}-${value}`}>{value}</li>))}</ul></div>}</Card><Card title="Publication summary"><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[['Publication', options.magazines.find((item) => String(item.id) === String(form.magazine_id))?.title || 'Missing'],['Issue', issues.find((item) => String(item.id) === String(form.magazine_issue_id)) ? `Volume ${issues.find((item) => String(item.id) === String(form.magazine_issue_id)).volume_number}, Issue ${issues.find((item) => String(item.id) === String(form.magazine_issue_id)).issue_number}` : 'Missing'],['DOI', form.doi || 'Missing'],['Final PDF', files.find((file) => Number(file.id) === Number(primaryId))?.original_name || 'Missing'],['Publication sections', String(form.sections.length)],['Section images', String(form.sections.filter((section) => section.media_upload_session_id).length)],['Authors', String(form.authors.length)],['Public files', String(Object.values(form.file_settings).filter((setting) => setting.show_on_article || setting.show_in_downloads).length)],['Page range', form.page_start && form.page_end ? `${form.page_start}–${form.page_end}` : 'Missing']].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"><dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</dt><dd className="mt-2 text-sm font-bold text-[var(--foreground)]">{value}</dd></div>)}</dl></Card><Card title="Final confirmation"><label className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm font-semibold"><input className="mt-0.5" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/>I confirm this complete publication package is correct and may bypass the standard editorial workflow.</label><div className="mt-5 flex flex-wrap gap-3">{status === 'direct_publication_draft' && <button disabled={busy} onClick={() => action('mark-ready', {}, 'Article marked ready.')} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Mark Ready</button>}{status === 'direct_publication_ready' && <><button disabled={busy} onClick={() => action('move-to-draft', {}, 'Article returned to draft.')} className="rounded-lg border px-4 py-2 text-sm font-bold">Move to Draft</button><input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"/><button disabled={busy || !confirmed || !scheduleAt} onClick={() => action('schedule', { scheduled_at: new Date(scheduleAt).toISOString(), confirmed: true }, 'Publication scheduled.')} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Schedule</button><button disabled={busy || !confirmed} onClick={() => action('publish', { confirmed: true }, 'Article published.')} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Publish Now</button></>}{status === 'scheduled_for_publication' && <><button disabled={busy} onClick={() => action('unschedule', {}, 'Schedule removed.')} className="rounded-lg border border-amber-400 px-4 py-2 text-sm font-bold text-amber-700">Unschedule</button><button disabled={busy || !confirmed} onClick={() => action('publish', { confirmed: true }, 'Article published.')} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Publish Now</button></>}{status === 'published' && <><button disabled={busy} onClick={save} className="rounded-lg border px-4 py-2 text-sm font-bold">Save Audited Corrections</button><button disabled={busy} onClick={() => { const reason = window.prompt('Reason for unpublishing (minimum 10 characters):'); if (reason) action('unpublish', { reason }, 'Article unpublished.'); }} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white">Unpublish</button></>}</div></Card></>}
    </div>

    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><button type="button" disabled={step === 0 || busy || hasActiveUploads} onClick={() => setStep((value) => value - 1)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-bold disabled:opacity-40"><ArrowLeft className="h-4 w-4"/>Back</button><div className="flex items-center gap-3"><p className="hidden text-xs font-semibold text-[var(--muted)] sm:block">Step {step + 1} of {STEPS.length}</p>{status === 'direct_publication_draft' && <button type="button" disabled={busy || hasActiveUploads || Boolean(uploadingSection)} onClick={save} className="inline-flex min-h-10 items-center rounded-lg border border-[var(--border)] px-4 text-sm font-bold disabled:opacity-40">Save Draft</button>}</div>{step < STEPS.length - 1 ? <button type="button" disabled={busy || hasActiveUploads || Boolean(uploadingSection)} onClick={next} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-bold text-[var(--primary-foreground)] disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : null}{busy ? 'Saving…' : hasActiveUploads ? 'Processing files…' : 'Next'}{!busy && !hasActiveUploads && <ArrowRight className="h-4 w-4"/>}</button> : <Link href="/admin/direct-publications" className="inline-flex min-h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-bold">Return to Dashboard</Link>}</div></footer>
    {step === 6 && activeDraftId && <div className="mb-20"><ArticleThreadWorkspace articleId={activeDraftId} availableFiles={files} initialThreadId={searchParams.get('thread')} directPublication /></div>}
  </main>;
}
