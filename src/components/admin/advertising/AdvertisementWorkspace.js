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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploadText, setUploadText] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const selectedDestination = DESTINATIONS.find((item) => item.id === destination);
  const selectedPublication = publications.find((item) => String(item.id) === String(form.publication_id));
  const selectedPage = pages.find((item) => item.page_key === form.page_key);
  const selectedArticle = articles.find((item) => String(item.id) === String(form.article_id));

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
    if (!form.publication_id) return;
    if (form.target_mode === 'specific_pages') api.get(`/admin/advertisements/publications/${form.publication_id}/pages`).then(({ data }) => setPages(data.data || []));
    if (form.target_mode === 'specific_articles') api.get(`/admin/advertisements/publications/${form.publication_id}/published-articles`).then(({ data }) => setArticles(data.data || []));
  }, [form.publication_id, form.target_mode]);
  useEffect(() => {
    if (!initialId) return;
    api.get(`/admin/advertisements/${initialId}`).then(({ data }) => {
      const target = data.targets?.[0] || {};
      const destinationId = target.target_area === 'website' ? 'website' : `${target.publication_type}_${target.target_area === 'article' ? 'articles' : 'pages'}`;
      setDestination(destinationId);
      setForm({ ...emptyForm, ...data, ...target, starts_at: data.starts_at?.slice(0, 16) || '', ends_at: data.ends_at?.slice(0, 16) || '' });
    }).catch(() => setError('Could not load this advertisement.'));
  }, [initialId]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const chooseDestination = (item) => {
    setDestination(item.id); setPublications([]); setPages([]); setArticles([]); setError('');
    setForm((current) => ({ ...current, target_area: item.area, publication_type: item.type || '', publication_id: '', page_key: '', article_id: '', target_mode: item.area === 'website' ? 'single_page' : item.area === 'article' ? 'all_articles' : 'all_pages' }));
  };
  const changePublication = (publicationId) => { setPages([]); setArticles([]); setForm((current) => ({ ...current, publication_id: publicationId, page_key: '', article_id: '' })); };
  const changeTargetMode = (targetMode) => { setPages([]); setArticles([]); setForm((current) => ({ ...current, target_mode: targetMode, page_key: '', article_id: '' })); };

  const beginEdit = (ad) => {
    const target = ad.targets?.[0] || {};
    const destinationId = target.target_area === 'website' ? 'website' : `${target.publication_type}_${target.target_area === 'article' ? 'articles' : 'pages'}`;
    setEditingId(ad.id); setDestination(destinationId); setStep(1); setPreviewUrl(''); setError('');
    setForm({ ...emptyForm, ...ad, ...target, starts_at: ad.starts_at?.slice(0, 16) || '', ends_at: ad.ends_at?.slice(0, 16) || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const reset = () => { setEditingId(null); setDestination(''); setStep(1); setForm(emptyForm); setPreviewUrl(''); setUploadText(''); setError(''); };

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
      if (form.target_area === 'website' && !form.page_key) return 'Select a website page.';
      if (form.target_area !== 'website' && !form.publication_id) return `Select a ${form.publication_type}.`;
      if (form.target_mode === 'specific_pages' && !form.page_key) return 'Select a publication page.';
      if (form.target_mode === 'specific_articles' && !form.article_id) return 'Select a published article.';
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
    if (destination === 'website') return selectedPage?.label || form.page_key || 'Website page';
    if (form.target_mode === 'all_pages') return `All pages of ${selectedPublication?.title || 'this publication'}`;
    if (form.target_mode === 'specific_pages') return selectedPage?.label || form.page_key || 'Specific page';
    if (form.target_mode === 'all_articles') return 'All published articles';
    return selectedArticle?.title || 'Specific published article';
  }, [destination, form.page_key, form.target_mode, selectedArticle, selectedPage, selectedPublication]);

  const save = async () => {
    const message = validateStep(4); if (message) { setError(message); setStep(4); return; }
    setBusy(true); setError('');
    const target = { target_area: form.target_area, target_mode: form.target_mode, publication_type: form.target_area === 'website' ? null : form.publication_type, publication_id: form.target_area === 'website' ? null : Number(form.publication_id), page_key: ['single_page', 'specific_pages'].includes(form.target_mode) ? form.page_key : null, article_id: form.target_mode === 'specific_articles' ? Number(form.article_id) : null };
    const payload = { title: form.title, image_media_id: form.image_media_id, alt_text: form.alt_text || null, redirect_url: form.redirect_url || null, placement: form.placement, priority: Number(form.priority), status: form.status, open_in_new_tab: form.open_in_new_tab, starts_at: form.starts_at || null, ends_at: form.ends_at || null, targets: [target] };
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
        {step === 2 && <TargetStep destination={selectedDestination} form={form} publications={publications} pages={pages} articles={articles} onPublication={changePublication} onMode={changeTargetMode} update={update} />}
        {step === 3 && <CreativeStep form={form} previewUrl={previewUrl} uploadText={uploadText} busy={busy} update={update} upload={upload} editing={Boolean(editingId)} />}
        {step === 4 && <DisplayStep form={form} update={update} />}
        {step === 5 && <ReviewStep destination={selectedDestination} publication={selectedPublication} target={targetSummary} form={form} previewUrl={previewUrl} />}
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

function DestinationStep({ destination, onChoose }) { return <div><StepHeading title="Where should this advertisement appear?" description="Choose one destination. You will configure its exact scope in the next step." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{DESTINATIONS.map((item) => { const Icon = item.icon; const selected = destination === item.id; return <button key={item.id} type="button" aria-pressed={selected} onClick={() => onChoose(item)} className={`group rounded-2xl border p-5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${selected ? 'border-amber-500 bg-amber-50 shadow-sm dark:bg-amber-950/20' : 'border-zinc-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-zinc-700'}`}><div className="flex items-start justify-between"><span className={`rounded-xl p-3 ${selected ? 'bg-amber-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}><Icon className="h-5 w-5" /></span>{selected && <Check className="h-5 w-5 text-amber-600" />}</div><h3 className="mt-5 font-serif text-lg font-bold">{item.label}</h3><p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.description}</p></button>; })}</div></div>; }

function TargetStep({ destination, form, publications, pages, articles, onPublication, onMode, update }) {
  if (!destination) return null;
  const isWebsite = destination.area === 'website'; const isArticle = destination.area === 'article'; const noun = destination.type === 'journal' ? 'Journal' : 'Magazine';
  return <div className="mx-auto max-w-3xl"><StepHeading title="Select the target" description={`${destination.label} selected. Choose exactly where the advertisement should appear.`} /><div className="space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 sm:p-7 dark:border-zinc-800 dark:bg-zinc-950/30">
    {isWebsite ? <SelectField label="Website page" value={form.page_key} onChange={(value) => update('page_key', value)} options={pages.map((page) => [page.page_key, page.label])} /> : <><SelectField label={`Select ${noun}`} value={form.publication_id} onChange={onPublication} options={publications.map((publication) => [publication.id, publication.title])} /><ChoiceCards label="Target mode" value={form.target_mode} onChange={onMode} options={isArticle ? [['all_articles', `All published articles of this ${noun}`], ['specific_articles', `Specific published articles of this ${noun}`]] : [['all_pages', `All pages of this ${noun}`], ['specific_pages', `Specific pages of this ${noun}`]]} /></>}
    {form.target_mode === 'specific_pages' && <SelectField label={`${noun} page`} value={form.page_key} onChange={(value) => update('page_key', value)} options={pages.map((page) => [page.page_key, page.label])} empty={`No public pages are available for this ${noun.toLowerCase()}.`} />}
    {form.target_mode === 'specific_articles' && <SearchableArticleSelect noun={noun} articles={articles} value={form.article_id} onChange={(value) => update('article_id', value)} />}
    {isArticle && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Advertisements can only be attached to published article pages.</div>}
  </div></div>;
}

function SearchableArticleSelect({ noun, articles, value, onChange }) { const [query, setQuery] = useState(''); const filtered = articles.filter((article) => article.title.toLowerCase().includes(query.toLowerCase())); return <div><label className="text-sm font-bold">Published Articles</label><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search published articles…" className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900" />{articles.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700">No published articles are available for this {noun.toLowerCase()}.</p> : <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">{filtered.map((article) => <label key={article.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${String(value) === String(article.id) ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-zinc-200 dark:border-zinc-700'}`}><input type="radio" name="published-article" checked={String(value) === String(article.id)} onChange={() => onChange(String(article.id))} /><span className="font-semibold">{article.title}</span></label>)}{filtered.length === 0 && <p className="p-4 text-center text-sm text-zinc-500">No published articles match your search.</p>}</div>}</div>; }

function CreativeStep({ form, previewUrl, uploadText, busy, update, upload, editing }) { return <div className="mx-auto max-w-3xl"><StepHeading title="Upload advertisement creative" description="Add a clear title, accessible description, and the image visitors will see." /><div className="space-y-6"><TextField label="Advertisement title" required value={form.title} onChange={(value) => update('title', value)} placeholder="Example: Annual Research Conference" /><div><label className="text-sm font-bold">Advertisement image</label><label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files?.[0]); }} className={`mt-2 flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition-colors ${previewUrl ? 'border-amber-400 bg-zinc-950' : 'border-zinc-300 bg-zinc-50 hover:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950/40'}`}>{previewUrl ? <img src={previewUrl} alt="Advertisement preview" className="max-h-72 w-full object-contain" /> : <><span className="rounded-full bg-amber-100 p-4 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><ImagePlus className="h-7 w-7" /></span><span className="mt-4 font-bold">Choose an image to upload</span><span className="mt-1 text-sm text-zinc-500">or drop it into this area</span>{editing && form.image_media_id && <span className="mt-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Existing verified image will be kept</span>}</>}<input type="file" accept=".jpg,.jpeg,.png,.webp" disabled={busy} onChange={(event) => upload(event.target.files?.[0])} className="sr-only" /></label>{uploadText && <p className="mt-2 text-sm font-semibold text-emerald-700">{uploadText}</p>}</div><TextField label="Alt text" value={form.alt_text} onChange={(value) => update('alt_text', value)} placeholder="Describe the advertisement image" /><div className="rounded-xl bg-zinc-100 p-4 text-xs leading-6 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300"><p className="font-bold text-zinc-800 dark:text-white">Recommended sizes</p><p>Sidebar: 300×250 or 336×280 · Banner: 970×250 or 728×90 · Inline: 728×90 · Mobile: 320×100 or 300×250</p><p>Allowed: JPG, PNG, WebP. Max 5 MB.</p></div></div></div>; }

function DisplayStep({ form, update }) { return <div className="mx-auto max-w-3xl"><StepHeading title="Configure display settings" description="Control where the creative sits, what happens on click, and when it is visible." /><div className="space-y-7"><ChoiceCards label="Placement" value={form.placement} onChange={(value) => update('placement', value)} options={PLACEMENTS.map((item) => [item.id, item.label, item.description])} /><TextField label="Redirect URL" type="url" value={form.redirect_url} onChange={(value) => update('redirect_url', value)} placeholder="https://example.com/campaign" /><label className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 text-sm font-semibold dark:border-zinc-700"><input type="checkbox" checked={form.open_in_new_tab} onChange={(event) => update('open_in_new_tab', event.target.checked)} className="h-4 w-4" />Open redirect in a new tab</label><div className="grid gap-5 sm:grid-cols-2"><SelectField label="Status" value={form.status} onChange={(value) => update('status', value)} options={[[ 'draft', 'Draft' ], [ 'active', 'Active' ], [ 'inactive', 'Inactive' ]]} /><TextField label="Priority" type="number" value={form.priority} onChange={(value) => update('priority', value)} helper="Higher priority ads appear first when multiple ads use the same placement." /></div><div><div className="grid gap-5 sm:grid-cols-2"><TextField label="Start date" type="datetime-local" value={form.starts_at} onChange={(value) => update('starts_at', value)} /><TextField label="End date" type="datetime-local" value={form.ends_at} onChange={(value) => update('ends_at', value)} /></div><p className="mt-2 text-xs text-zinc-500">Leave dates empty to show the ad whenever it is active.</p></div></div></div>; }

function ReviewStep({ destination, publication, target, form, previewUrl }) { const placement = PLACEMENTS.find((item) => item.id === form.placement)?.label || form.placement; return <div className="mx-auto max-w-3xl"><StepHeading title="Review advertisement" description="Confirm the destination, creative, and display rules before saving." />{previewUrl && <div className="mb-6 overflow-hidden rounded-2xl bg-zinc-950 p-4"><img src={previewUrl} alt={form.alt_text || form.title} className="mx-auto max-h-64 object-contain" /></div>}<div className="grid gap-4 sm:grid-cols-2"><Summary label="Destination" value={destination?.label} /><Summary label={destination?.type === 'journal' ? 'Journal' : destination?.type === 'magazine' ? 'Magazine' : 'Target'} value={publication?.title || target} /><Summary label="Target" value={target} /><Summary label="Creative" value={form.title} /><Summary label="Placement" value={placement} /><Summary label="Status" value={form.status} /><Summary label="Redirect" value={form.redirect_url ? `${form.redirect_url}${form.open_in_new_tab ? ' · Opens in new tab' : ''}` : 'No redirect'} /><Summary label="Schedule" value={form.starts_at || form.ends_at ? `${form.starts_at || 'Immediately'} → ${form.ends_at || 'No end date'}` : 'Whenever active'} /></div></div>; }

function AdvertisementList({ items, onEdit }) { return <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="border-b border-zinc-200 p-5 dark:border-zinc-800"><h2 className="font-serif text-lg font-bold">Advertisements</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-zinc-50 dark:bg-zinc-950"><tr>{['Title','Placement','Status','Priority','Target','Actions'].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead><tbody>{items.map((ad) => <tr key={ad.id} className="border-t dark:border-zinc-800"><td className="p-4 font-semibold">{ad.title}</td><td className="p-4">{ad.placement}</td><td className="p-4 capitalize">{ad.status}</td><td className="p-4">{ad.priority}</td><td className="p-4">{ad.targets?.[0]?.target_mode?.replaceAll('_', ' ')}</td><td className="p-4"><button onClick={() => onEdit(ad)} className="font-bold text-amber-700 hover:underline">Edit</button></td></tr>)}{items.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-zinc-500">No advertisements have been created yet.</td></tr>}</tbody></table></div></section>; }

function StepHeading({ title, description }) { return <div className="mb-7"><h2 className="font-serif text-2xl font-bold text-zinc-950 dark:text-white">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p></div>; }
function TextField({ label, value, onChange, type = 'text', placeholder = '', helper = '', required = false }) { return <label className="block text-sm font-bold">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950" />{helper && <span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">{helper}</span>}</label>; }
function SelectField({ label, value, onChange, options, empty = '' }) { return <label className="block text-sm font-bold">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"><option value="">Select…</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select>{empty && options.length === 0 && <span className="mt-2 block text-xs font-normal text-zinc-500">{empty}</span>}</label>; }
function ChoiceCards({ label, value, onChange, options }) { return <fieldset><legend className="mb-3 text-sm font-bold">{label}</legend><div className="grid gap-3 sm:grid-cols-2">{options.map(([optionValue, optionLabel, description]) => <button key={optionValue} type="button" onClick={() => onChange(optionValue)} className={`rounded-xl border p-4 text-left ${value === optionValue ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-zinc-200 dark:border-zinc-700'}`}><span className="flex items-center justify-between font-bold">{optionLabel}{value === optionValue && <Check className="h-4 w-4 text-amber-600" />}</span>{description && <span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">{description}</span>}</button>)}</div></fieldset>; }
function Summary({ label, value }) { return <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{label}</p><p className="mt-2 break-words text-sm font-semibold capitalize text-zinc-900 dark:text-white">{value || 'Not set'}</p></div>; }
