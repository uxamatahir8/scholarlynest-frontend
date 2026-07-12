'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileText, Globe2, ImagePlus, LibraryBig, Newspaper, NotebookTabs } from 'lucide-react';
import { uploadAndAwaitClean } from '../../../lib/mediaUploads/DirectUploadClient';
import api from '../../../utils/api';
import { Button } from '../../ui/Button';

const STEPS = ['Destination', 'Target', 'Creative', 'Display', 'Review'];
const DESTINATIONS = [
  { id: 'website', label: 'Website Pages', description: 'Show this ad on Home, About, Contact, FAQ, or other static pages.', icon: Globe2, area: 'website' },
  { id: 'magazine_pages', label: 'Magazine Pages', description: 'Show this ad on selected magazine public pages.', icon: LibraryBig, area: 'publication', type: 'magazine' },
  { id: 'journal_pages', label: 'Journal Pages', description: 'Show this ad on selected journal public pages.', icon: NotebookTabs, area: 'publication', type: 'journal' },
  { id: 'magazine_articles', label: 'Magazine Articles', description: 'Show this ad on published article pages of a magazine.', icon: Newspaper, area: 'article', type: 'magazine' },
  { id: 'journal_articles', label: 'Journal Articles', description: 'Show this ad on published article pages of a journal.', icon: FileText, area: 'article', type: 'journal' },
];
const PLACEMENTS = [
  { id: 'sidebar_sticky', label: 'Sticky Sidebar', description: 'Best for article detail sidebars. Recommended image: 300×250.' },
  { id: 'content_top', label: 'Content Top', description: 'Appears near the top of the selected page.' },
  { id: 'content_bottom', label: 'Content Bottom', description: 'Appears after main page content.' },
];
const emptyForm = { title: '', alt_text: '', redirect_url: '', placement: 'sidebar_sticky', priority: 0, status: 'draft', open_in_new_tab: true, starts_at: '', ends_at: '', image_media_id: null, target_area: '', target_mode: '', publication_type: '', publication_id: '', page_key: '', article_id: '' };

export default function AdvertisementWorkspace({ initialId = null }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [destination, setDestination] = useState('');
  const [step, setStep] = useState(1);
  const [editingId, setEditingId] = useState(initialId);
  const [publications, setPublications] = useState([]);
  const [pages, setPages] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedPublicationIds, setSelectedPublicationIds] = useState([]);
  const [selectedPageKeys, setSelectedPageKeys] = useState([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState([]);
  const [originalTargets, setOriginalTargets] = useState([]);
  const [mixedTargetGroups, setMixedTargetGroups] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploadText, setUploadText] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const selectedDestination = DESTINATIONS.find((item) => item.id === destination);
  const selectedPublications = publications.filter((item) => selectedPublicationIds.includes(String(item.id)));
  const selectedPages = pages.filter((item) => selectedPageKeys.includes(item.page_key));
  const selectedArticles = articles.filter((item) => selectedArticleIds.includes(String(item.id)));

  const load = useCallback(async () => {
    const { data } = await api.get('/admin/advertisements');
    setItems(data.data || []);
  }, []);

  useEffect(() => { load().catch(() => setError('Could not load advertisements.')); }, [load]);
  useEffect(() => () => { if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => {
    if (!destination) return;
    if (destination === 'website') {
      api.get('/admin/advertisements/static-pages').then(({ data }) => setPages(data.data || [])).catch(() => setError('Could not load website pages.'));
      return;
    }
    api.get('/admin/advertisements/publications', { params: { publication_type: form.publication_type } })
      .then(({ data }) => setPublications(data.data || [])).catch(() => setError('Could not load publications.'));
  }, [destination, form.publication_type]);
  useEffect(() => {
    if (selectedPublicationIds.length === 0) return;
    const endpoint = form.target_mode === 'specific_pages' ? 'pages' : form.target_mode === 'specific_articles' ? 'published-articles' : null;
    if (!endpoint) return;
    Promise.all(selectedPublicationIds.map((id) => api.get(`/admin/advertisements/publications/${id}/${endpoint}`)))
      .then((responses) => {
        const rows = responses.flatMap(({ data }) => data.data || []);
        if (endpoint === 'pages') setPages(Array.from(new Map(rows.map((page) => [page.page_key, page])).values()));
        else setArticles(rows);
      }).catch(() => setError(`Could not load ${endpoint === 'pages' ? 'publication pages' : 'published articles'}.`));
  }, [selectedPublicationIds, form.target_mode]);
  useEffect(() => {
    if (!initialId) return;
    api.get(`/admin/advertisements/${initialId}`).then(({ data }) => {
      const targets = data.targets || [];
      const target = targets[0] || {};
      const signatures = new Set(targets.map((item) => `${item.target_area}:${item.publication_type || ''}:${item.target_mode}`));
      const destinationId = target.target_area === 'website' ? 'website' : `${target.publication_type}_${target.target_area === 'article' ? 'articles' : 'pages'}`;
      setDestination(destinationId);
      setSelectedPublicationIds([...new Set(targets.map((item) => item.publication_id).filter(Boolean).map(String))]);
      setSelectedPageKeys([...new Set(targets.map((item) => item.page_key).filter(Boolean))]);
      setSelectedArticleIds([...new Set(targets.map((item) => item.article_id).filter(Boolean).map(String))]);
      setOriginalTargets(targets); setMixedTargetGroups(signatures.size > 1);
      setForm({ ...emptyForm, ...data, ...target, starts_at: data.starts_at?.slice(0, 16) || '', ends_at: data.ends_at?.slice(0, 16) || '' });
    }).catch(() => setError('Could not load this advertisement.'));
  }, [initialId]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const chooseDestination = (item) => {
    setDestination(item.id); setPublications([]); setPages([]); setArticles([]); setSelectedPublicationIds([]); setSelectedPageKeys([]); setSelectedArticleIds([]); setOriginalTargets([]); setMixedTargetGroups(false); setError('');
    setForm((current) => ({ ...current, target_area: item.area, publication_type: item.type || '', publication_id: '', page_key: '', article_id: '', target_mode: item.area === 'website' ? 'single_page' : item.area === 'article' ? 'all_articles' : 'all_pages' }));
  };
  const changePublications = (ids) => {
    setPages([]); setSelectedPublicationIds(ids); setSelectedPageKeys([]);
    setSelectedArticleIds((current) => current.filter((articleId) => { const article = articles.find((item) => String(item.id) === articleId); return article && ids.includes(String(article.magazine_id)); }));
    setArticles((current) => current.filter((article) => ids.includes(String(article.magazine_id))));
  };
  const changeTargetMode = (targetMode) => { setPages([]); setArticles([]); setSelectedPageKeys([]); setSelectedArticleIds([]); setForm((current) => ({ ...current, target_mode: targetMode })); };

  const beginEdit = (ad) => {
    const targets = ad.targets || []; const target = targets[0] || {};
    const signatures = new Set(targets.map((item) => `${item.target_area}:${item.publication_type || ''}:${item.target_mode}`));
    const destinationId = target.target_area === 'website' ? 'website' : `${target.publication_type}_${target.target_area === 'article' ? 'articles' : 'pages'}`;
    setEditingId(ad.id); setDestination(destinationId); setStep(1); setPreviewUrl(''); setError('');
    setSelectedPublicationIds([...new Set(targets.map((item) => item.publication_id).filter(Boolean).map(String))]);
    setSelectedPageKeys([...new Set(targets.map((item) => item.page_key).filter(Boolean))]);
    setSelectedArticleIds([...new Set(targets.map((item) => item.article_id).filter(Boolean).map(String))]);
    setOriginalTargets(targets); setMixedTargetGroups(signatures.size > 1);
    setForm({ ...emptyForm, ...ad, ...target, starts_at: ad.starts_at?.slice(0, 16) || '', ends_at: ad.ends_at?.slice(0, 16) || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const reset = () => { setEditingId(null); setDestination(''); setStep(1); setForm(emptyForm); setSelectedPublicationIds([]); setSelectedPageKeys([]); setSelectedArticleIds([]); setOriginalTargets([]); setMixedTargetGroups(false); setPreviewUrl(''); setUploadText(''); setError(''); };

  const upload = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Use a JPG, PNG, or WebP image no larger than 5 MB.'); return; }
    setPreviewUrl(URL.createObjectURL(file)); setBusy(true); setError('');
    try {
      const result = await uploadAndAwaitClean({ file, purpose: 'advertisement_image', onProgress: (progress) => setUploadText(`Uploading ${progress}%`), onState: (state) => setUploadText(state.replaceAll('_', ' ')) });
      update('image_media_id', result.record.media_id); setUploadText('Image uploaded and verified');
    } catch (uploadError) { setError(uploadError.message || 'Image upload failed.'); update('image_media_id', null); } finally { setBusy(false); }
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1 && !destination) return 'Choose where this advertisement should appear.';
    if (currentStep === 2) {
      if (mixedTargetGroups) return '';
      if (form.target_area === 'website' && selectedPageKeys.length === 0) return 'Select at least one website page.';
      if (form.target_area !== 'website' && selectedPublicationIds.length === 0) return `Select at least one ${form.publication_type}.`;
      if (form.target_mode === 'specific_pages' && selectedPageKeys.length === 0) return 'Select at least one publication page.';
      if (form.target_mode === 'specific_articles' && selectedArticleIds.length === 0) return 'Select at least one published article.';
    }
    if (currentStep === 3) {
      if (!form.title.trim()) return 'Enter an advertisement title.';
      if (!form.image_media_id) return editingId ? 'Keep the existing image or upload a replacement.' : 'Upload an advertisement image.';
    }
    if (currentStep === 4) {
      if (!form.placement || !form.status) return 'Choose a placement and status.';
      if (form.redirect_url) { try { new URL(form.redirect_url); } catch { return 'Enter a valid redirect URL, including https://.'; } }
      if (form.starts_at && form.ends_at && new Date(form.ends_at) < new Date(form.starts_at)) return 'End date must be after the start date.';
    }
    return '';
  };
  const next = () => { const message = validateStep(step); if (message) { setError(message); return; } setError(''); setStep((value) => Math.min(5, value + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const back = () => { setError(''); setStep((value) => Math.max(1, value - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const targetSummary = useMemo(() => {
    if (destination === 'website') return `${selectedPageKeys.length} website page${selectedPageKeys.length === 1 ? '' : 's'}`;
    if (form.target_mode === 'all_pages') return 'All pages of selected publications';
    if (form.target_mode === 'specific_pages') return `${selectedPageKeys.length} selected page${selectedPageKeys.length === 1 ? '' : 's'}`;
    if (form.target_mode === 'all_articles') return 'All published articles of selected publications';
    return `${selectedArticleIds.length} selected published article${selectedArticleIds.length === 1 ? '' : 's'}`;
  }, [destination, form.target_mode, selectedArticleIds.length, selectedPageKeys.length]);

  const save = async () => {
    const message = validateStep(4); if (message) { setError(message); setStep(4); return; }
    setBusy(true); setError('');
    let targets = mixedTargetGroups ? originalTargets.map(({ target_area, target_mode, publication_type, publication_id, page_key, article_id }) => ({ target_area, target_mode, publication_type, publication_id, page_key, article_id })) : [];
    if (!mixedTargetGroups && form.target_area === 'website') targets = selectedPageKeys.map((pageKey) => ({ target_area: 'website', target_mode: 'single_page', publication_type: null, publication_id: null, page_key: pageKey, article_id: null }));
    else if (!mixedTargetGroups && (form.target_mode === 'all_pages' || form.target_mode === 'all_articles')) targets = selectedPublicationIds.map((publicationId) => ({ target_area: form.target_area, target_mode: form.target_mode, publication_type: form.publication_type, publication_id: Number(publicationId), page_key: null, article_id: null }));
    else if (!mixedTargetGroups && form.target_mode === 'specific_pages') targets = selectedPublicationIds.flatMap((publicationId) => selectedPageKeys.map((pageKey) => ({ target_area: 'publication', target_mode: 'specific_pages', publication_type: form.publication_type, publication_id: Number(publicationId), page_key: pageKey, article_id: null })));
    else if (!mixedTargetGroups) targets = selectedArticleIds.map((articleId) => { const article = articles.find((item) => String(item.id) === articleId); return { target_area: 'article', target_mode: 'specific_articles', publication_type: form.publication_type, publication_id: Number(article?.magazine_id), page_key: null, article_id: Number(articleId) }; });
    const payload = { title: form.title, image_media_id: form.image_media_id, alt_text: form.alt_text || null, redirect_url: form.redirect_url || null, placement: form.placement, priority: Number(form.priority), status: form.status, open_in_new_tab: form.open_in_new_tab, starts_at: form.starts_at || null, ends_at: form.ends_at || null, targets };
    try { editingId ? await api.put(`/admin/advertisements/${editingId}`, payload) : await api.post('/admin/advertisements', payload); reset(); await load(); }
    catch (saveError) { setError(saveError.response?.data?.message || Object.values(saveError.response?.data?.errors || {})[0]?.[0] || 'Could not save advertisement.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-8">
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 px-5 py-6 sm:px-8 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">Advertising Management</p><h1 className="mt-2 font-serif text-2xl font-bold text-zinc-950 dark:text-white">{editingId ? 'Edit advertisement' : 'Create advertisement'}</h1></div>{editingId && <Button type="button" variant="outline" onClick={reset}>Cancel edit</Button>}</div>
        <WizardProgress step={step} />
      </header>
      <div className="min-h-[420px] px-5 py-7 sm:px-8 sm:py-9">
        {error && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
        {step === 1 && <DestinationStep destination={destination} onChoose={chooseDestination} />}
        {step === 2 && (mixedTargetGroups ? <MixedTargetsNotice count={originalTargets.length} /> : <TargetStep destination={selectedDestination} form={form} publications={publications} pages={pages} articles={articles} selectedPublicationIds={selectedPublicationIds} selectedPageKeys={selectedPageKeys} selectedArticleIds={selectedArticleIds} onPublications={changePublications} onPages={setSelectedPageKeys} onArticles={setSelectedArticleIds} onMode={changeTargetMode} />)}
        {step === 3 && <CreativeStep form={form} previewUrl={previewUrl} uploadText={uploadText} busy={busy} update={update} upload={upload} editing={Boolean(editingId)} />}
        {step === 4 && <DisplayStep form={form} update={update} />}
        {step === 5 && <ReviewStep destination={selectedDestination} publications={selectedPublications} pages={selectedPages} articles={selectedArticles} target={targetSummary} form={form} previewUrl={previewUrl} />}
      </div>
      <footer className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/70 px-5 py-4 sm:px-8 dark:border-zinc-800 dark:bg-zinc-950/40">
        <Button type="button" variant="outline" onClick={back} disabled={step === 1 || busy} icon={ChevronLeft}>Back</Button>
        {step < 5 ? <Button type="button" onClick={next} disabled={busy}>Next <ChevronRight className="h-4 w-4" /></Button> : <Button type="button" onClick={save} disabled={busy}>{busy ? 'Saving…' : editingId ? 'Update Advertisement' : 'Create Advertisement'}</Button>}
      </footer>
    </section>
    <AdvertisementList items={items} onEdit={beginEdit} />
  </div>;
}

function WizardProgress({ step }) { return <ol className="mt-7 grid grid-cols-5 gap-1" aria-label="Advertisement creation progress">{STEPS.map((label, index) => { const number = index + 1; const complete = number < step; const active = number === step; return <li key={label} className="min-w-0"><div className={`h-1.5 rounded-full ${number <= step ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} /><div className={`mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide sm:text-xs ${active ? 'text-amber-700 dark:text-amber-400' : complete ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}`}><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${number <= step ? 'bg-amber-100 dark:bg-amber-950' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{complete ? <Check className="h-3 w-3" /> : number}</span><span className="hidden truncate sm:block">{label}</span></div></li>; })}</ol>; }
function MixedTargetsNotice({ count }) { return <div className="mx-auto max-w-3xl"><StepHeading title="Multiple target groups" description="This advertisement uses target groups from more than one wizard path." /><div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">This advertisement uses {count} targets across multiple target groups. You can edit its creative and display settings here, but its existing targets will be preserved and target editing is limited in this wizard.</div></div>; }

function DestinationStep({ destination, onChoose }) { return <div><StepHeading title="Where should this advertisement appear?" description="Choose one destination. You will configure its exact scope in the next step." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{DESTINATIONS.map((item) => { const Icon = item.icon; const selected = destination === item.id; return <button key={item.id} type="button" aria-pressed={selected} onClick={() => onChoose(item)} className={`group rounded-2xl border p-5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${selected ? 'border-amber-500 bg-amber-50 shadow-sm dark:bg-amber-950/20' : 'border-zinc-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-zinc-700'}`}><div className="flex items-start justify-between"><span className={`rounded-xl p-3 ${selected ? 'bg-amber-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}><Icon className="h-5 w-5" /></span>{selected && <Check className="h-5 w-5 text-amber-600" />}</div><h3 className="mt-5 font-serif text-lg font-bold">{item.label}</h3><p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.description}</p></button>; })}</div></div>; }

function TargetStep({ destination, form, publications, pages, articles, selectedPublicationIds, selectedPageKeys, selectedArticleIds, onPublications, onPages, onArticles, onMode }) {
  if (!destination) return null;
  const isWebsite = destination.area === 'website'; const isArticle = destination.area === 'article'; const noun = destination.type === 'journal' ? 'Journal' : 'Magazine';
  return <div className="mx-auto max-w-3xl"><StepHeading title="Select the target" description={`${destination.label} selected. Choose exactly where the advertisement should appear.`} /><div className="space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 sm:p-7 dark:border-zinc-800 dark:bg-zinc-950/30">
    {isWebsite ? <SearchableChecklist label="Website Pages" items={pages.map((page) => ({ id: page.page_key, label: page.label }))} selected={selectedPageKeys} onChange={onPages} empty="No website pages are available." /> : <><SearchableChecklist label={`Select ${noun}s`} items={publications.map((publication) => ({ id: String(publication.id), label: `${noun} · ${publication.title}` }))} selected={selectedPublicationIds} onChange={onPublications} empty={`No ${noun.toLowerCase()}s are available.`} /><ChoiceCards label="Target mode" value={form.target_mode} onChange={onMode} options={isArticle ? [['all_articles', `All published articles of selected ${noun}s`], ['specific_articles', 'Specific published articles']] : [['all_pages', `All pages of selected ${noun}s`], ['specific_pages', `Specific pages of selected ${noun}s`]]} /></>}
    {form.target_mode === 'specific_pages' && <SearchableChecklist label="Specific Pages" items={pages.map((page) => ({ id: page.page_key, label: page.label }))} selected={selectedPageKeys} onChange={onPages} empty={`No public pages are available for the selected ${noun.toLowerCase()}s.`} />}
    {form.target_mode === 'specific_articles' && <SearchableChecklist label="Published Articles" items={articles.map((article) => ({ id: String(article.id), label: article.title, meta: publications.find((publication) => publication.id === article.magazine_id)?.title }))} selected={selectedArticleIds} onChange={onArticles} empty={`No published articles are available for the selected ${noun.toLowerCase()}s.`} searchPlaceholder="Search published articles…" itemName="articles" />}
    {isArticle && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Advertisements can only be attached to published article pages.</div>}
  </div></div>;
}

function SearchableChecklist({ label, items, selected, onChange, empty, searchPlaceholder = 'Search…', itemName = 'items' }) {
  const [query, setQuery] = useState('');
  const filtered = items.filter((item) => `${item.label} ${item.meta || ''}`.toLowerCase().includes(query.toLowerCase()));
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  const selectVisible = () => onChange([...new Set([...selected, ...filtered.map((item) => item.id)])]);
  return <fieldset><legend className="text-sm font-bold">{label}</legend><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Selected: {selected.length} {itemName}</span><div className="flex gap-2"><button type="button" onClick={selectVisible} disabled={filtered.length === 0} className="text-xs font-bold text-amber-700 disabled:opacity-40 dark:text-amber-400">Select all visible</button><button type="button" onClick={() => onChange([])} disabled={selected.length === 0} className="text-xs font-bold text-zinc-500 disabled:opacity-40">Clear selection</button></div></div>{items.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700">{empty}</p> : <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{filtered.map((item) => <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${selected.includes(item.id) ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-zinc-200 dark:border-zinc-700'}`}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} className="mt-0.5 h-4 w-4" /><span><span className="font-semibold">{item.label}</span>{item.meta && <span className="mt-1 block text-xs text-zinc-500">{item.meta}</span>}</span></label>)}{filtered.length === 0 && <p className="p-4 text-center text-sm text-zinc-500">No items match your search.</p>}</div>}</fieldset>;
}

function CreativeStep({ form, previewUrl, uploadText, busy, update, upload, editing }) { return <div className="mx-auto max-w-3xl"><StepHeading title="Upload advertisement creative" description="Add a clear title, accessible description, and the image visitors will see." /><div className="space-y-6"><TextField label="Advertisement title" required value={form.title} onChange={(value) => update('title', value)} placeholder="Example: Annual Research Conference" /><div><label className="text-sm font-bold">Advertisement image</label><label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files?.[0]); }} className={`mt-2 flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition-colors ${previewUrl ? 'border-amber-400 bg-zinc-950' : 'border-zinc-300 bg-zinc-50 hover:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950/40'}`}>{previewUrl ? <img src={previewUrl} alt="Advertisement preview" className="max-h-72 w-full object-contain" /> : <><span className="rounded-full bg-amber-100 p-4 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><ImagePlus className="h-7 w-7" /></span><span className="mt-4 font-bold">Choose an image to upload</span><span className="mt-1 text-sm text-zinc-500">or drop it into this area</span>{editing && form.image_media_id && <span className="mt-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Existing verified image will be kept</span>}</>}<input type="file" accept=".jpg,.jpeg,.png,.webp" disabled={busy} onChange={(event) => upload(event.target.files?.[0])} className="sr-only" /></label>{uploadText && <p className="mt-2 text-sm font-semibold text-emerald-700">{uploadText}</p>}</div><TextField label="Alt text" value={form.alt_text} onChange={(value) => update('alt_text', value)} placeholder="Describe the advertisement image" /><div className="rounded-xl bg-zinc-100 p-4 text-xs leading-6 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300"><p className="font-bold text-zinc-800 dark:text-white">Recommended sizes</p><p>Sidebar: 300×250 or 336×280 · Banner: 970×250 or 728×90 · Inline: 728×90 · Mobile: 320×100 or 300×250</p><p>Allowed: JPG, PNG, WebP. Max 5 MB.</p></div></div></div>; }

function DisplayStep({ form, update }) { return <div className="mx-auto max-w-3xl"><StepHeading title="Configure display settings" description="Control where the creative sits, what happens on click, and when it is visible." /><div className="space-y-7"><ChoiceCards label="Placement" value={form.placement} onChange={(value) => update('placement', value)} options={PLACEMENTS.map((item) => [item.id, item.label, item.description])} /><TextField label="Redirect URL" type="url" value={form.redirect_url} onChange={(value) => update('redirect_url', value)} placeholder="https://example.com/campaign" /><label className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 text-sm font-semibold dark:border-zinc-700"><input type="checkbox" checked={form.open_in_new_tab} onChange={(event) => update('open_in_new_tab', event.target.checked)} className="h-4 w-4" />Open redirect in a new tab</label><div className="grid gap-5 sm:grid-cols-2"><SelectField label="Status" value={form.status} onChange={(value) => update('status', value)} options={[[ 'draft', 'Draft' ], [ 'active', 'Active' ], [ 'inactive', 'Inactive' ]]} /><TextField label="Priority" type="number" value={form.priority} onChange={(value) => update('priority', value)} helper="Higher priority ads appear first when multiple ads use the same placement." /></div><div><div className="grid gap-5 sm:grid-cols-2"><TextField label="Start date" type="datetime-local" value={form.starts_at} onChange={(value) => update('starts_at', value)} /><TextField label="End date" type="datetime-local" value={form.ends_at} onChange={(value) => update('ends_at', value)} /></div><p className="mt-2 text-xs text-zinc-500">Leave dates empty to show the ad whenever it is active.</p></div></div></div>; }

function ReviewStep({ destination, publications, pages, articles, target, form, previewUrl }) { const placement = PLACEMENTS.find((item) => item.id === form.placement)?.label || form.placement; return <div className="mx-auto max-w-3xl"><StepHeading title="Review advertisement" description="Confirm the destination, creative, and display rules before saving." />{previewUrl && <div className="mb-6 overflow-hidden rounded-2xl bg-zinc-950 p-4"><img src={previewUrl} alt={form.alt_text || form.title} className="mx-auto max-h-64 object-contain" /></div>}<div className="grid gap-4 sm:grid-cols-2"><Summary label="Destination" value={destination?.label} /><SummaryList label={destination?.type === 'journal' ? 'Selected Journals' : destination?.type === 'magazine' ? 'Selected Magazines' : 'Selected Website Pages'} values={publications.length ? publications.map((item) => `${destination.type === 'journal' ? 'Journal' : 'Magazine'} · ${item.title}`) : pages.map((item) => item.label)} /><Summary label="Target" value={target} />{pages.length > 0 && destination?.area !== 'website' && <SummaryList label="Selected Pages" values={pages.map((item) => item.label)} />}{articles.length > 0 && <SummaryList label="Selected Articles" values={articles.map((item) => item.title)} />}<Summary label="Creative" value={form.title} /><Summary label="Placement" value={placement} /><Summary label="Status" value={form.status} /><Summary label="Redirect" value={form.redirect_url ? `${form.redirect_url}${form.open_in_new_tab ? ' · Opens in new tab' : ''}` : 'No redirect'} /><Summary label="Schedule" value={form.starts_at || form.ends_at ? `${form.starts_at || 'Immediately'} → ${form.ends_at || 'No end date'}` : 'Whenever active'} /></div></div>; }

function AdvertisementList({ items, onEdit }) { return <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="border-b border-zinc-200 p-5 dark:border-zinc-800"><h2 className="font-serif text-lg font-bold">Advertisements</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-zinc-50 dark:bg-zinc-950"><tr>{['Title','Placement','Status','Priority','Target','Actions'].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead><tbody>{items.map((ad) => <tr key={ad.id} className="border-t dark:border-zinc-800"><td className="p-4 font-semibold">{ad.title}</td><td className="p-4">{ad.placement}</td><td className="p-4 capitalize">{ad.status}</td><td className="p-4">{ad.priority}</td><td className="p-4">{ad.targets?.[0]?.target_mode?.replaceAll('_', ' ')}</td><td className="p-4"><button onClick={() => onEdit(ad)} className="font-bold text-amber-700 hover:underline">Edit</button></td></tr>)}{items.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-zinc-500">No advertisements have been created yet.</td></tr>}</tbody></table></div></section>; }

function StepHeading({ title, description }) { return <div className="mb-7"><h2 className="font-serif text-2xl font-bold text-zinc-950 dark:text-white">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p></div>; }
function TextField({ label, value, onChange, type = 'text', placeholder = '', helper = '', required = false }) { return <label className="block text-sm font-bold">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950" />{helper && <span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">{helper}</span>}</label>; }
function SelectField({ label, value, onChange, options, empty = '' }) { return <label className="block text-sm font-bold">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"><option value="">Select…</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select>{empty && options.length === 0 && <span className="mt-2 block text-xs font-normal text-zinc-500">{empty}</span>}</label>; }
function ChoiceCards({ label, value, onChange, options }) { return <fieldset><legend className="mb-3 text-sm font-bold">{label}</legend><div className="grid gap-3 sm:grid-cols-2">{options.map(([optionValue, optionLabel, description]) => <button key={optionValue} type="button" onClick={() => onChange(optionValue)} className={`rounded-xl border p-4 text-left ${value === optionValue ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-zinc-200 dark:border-zinc-700'}`}><span className="flex items-center justify-between font-bold">{optionLabel}{value === optionValue && <Check className="h-4 w-4 text-amber-600" />}</span>{description && <span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">{description}</span>}</button>)}</div></fieldset>; }
function Summary({ label, value }) { return <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{label}</p><p className="mt-2 break-words text-sm font-semibold capitalize text-zinc-900 dark:text-white">{value || 'Not set'}</p></div>; }
function SummaryList({ label, values }) { return <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{label}</p>{values.length ? <ul className="mt-2 space-y-1 text-sm font-semibold text-zinc-900 dark:text-white">{values.map((value) => <li key={value}>• {value}</li>)}</ul> : <p className="mt-2 text-sm text-zinc-500">Not set</p>}</div>; }
