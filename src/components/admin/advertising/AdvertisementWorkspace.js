'use client';

import { useCallback, useEffect, useState } from 'react';
import { uploadAndAwaitClean } from '../../../lib/mediaUploads/DirectUploadClient';
import api from '../../../utils/api';
import { Button } from '../../ui/Button';

const emptyForm = { title: '', alt_text: '', redirect_url: '', placement: 'sidebar_sticky', priority: 0, status: 'draft', open_in_new_tab: true, starts_at: '', ends_at: '', image_media_id: null, target_area: 'website', target_mode: 'single_page', publication_type: 'magazine', publication_id: '', page_key: 'home', article_id: '' };

export default function AdvertisementWorkspace({ initialId = null }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(initialId);
  const [options, setOptions] = useState([]);
  const [pages, setPages] = useState([]);
  const [articles, setArticles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploadText, setUploadText] = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/admin/advertisements');
    setItems(data.data || []);
  }, []);

  useEffect(() => { load().catch(() => setError('Could not load advertisements.')); }, [load]);
  useEffect(() => {
    if (form.target_area === 'website') api.get('/admin/advertisements/static-pages').then(({ data }) => setPages(data.data || []));
    else api.get('/admin/advertisements/publications', { params: { publication_type: form.publication_type } }).then(({ data }) => setOptions(data.data || []));
  }, [form.target_area, form.publication_type]);
  useEffect(() => {
    if (!form.publication_id) return;
    if (form.target_mode === 'specific_pages') api.get(`/admin/advertisements/publications/${form.publication_id}/pages`).then(({ data }) => setPages(data.data || []));
    if (form.target_mode === 'specific_articles') api.get(`/admin/advertisements/publications/${form.publication_id}/published-articles`).then(({ data }) => setArticles(data.data || []));
  }, [form.publication_id, form.target_mode]);
  useEffect(() => {
    if (!initialId) return;
    api.get(`/admin/advertisements/${initialId}`).then(({ data }) => {
      const t = data.targets?.[0] || {};
      setForm({ ...emptyForm, ...data, ...t, starts_at: data.starts_at?.slice(0, 16) || '', ends_at: data.ends_at?.slice(0, 16) || '' });
    });
  }, [initialId]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const beginEdit = (ad) => { const t = ad.targets?.[0] || {}; setEditingId(ad.id); setForm({ ...emptyForm, ...ad, ...t, starts_at: ad.starts_at?.slice(0, 16) || '', ends_at: ad.ends_at?.slice(0, 16) || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => { setEditingId(null); setForm(emptyForm); setError(''); };

  const upload = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Use a JPG, PNG, or WebP image no larger than 5 MB.'); return; }
    setBusy(true); setError('');
    try {
      const result = await uploadAndAwaitClean({ file, purpose: 'advertisement_image', onProgress: (p) => setUploadText(`Uploading ${p}%`), onState: (s) => setUploadText(s.replaceAll('_', ' ')) });
      update('image_media_id', result.record.media_id); setUploadText('Image ready');
    } catch (e) { setError(e.message || 'Image upload failed.'); } finally { setBusy(false); }
  };

  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const target = { target_area: form.target_area, target_mode: form.target_area === 'website' ? 'single_page' : form.target_mode, publication_type: form.target_area === 'website' ? null : form.publication_type, publication_id: form.target_area === 'website' ? null : Number(form.publication_id), page_key: ['single_page', 'specific_pages'].includes(form.target_area === 'website' ? 'single_page' : form.target_mode) ? form.page_key : null, article_id: form.target_mode === 'specific_articles' ? Number(form.article_id) : null };
    const payload = { title: form.title, image_media_id: form.image_media_id, alt_text: form.alt_text || null, redirect_url: form.redirect_url || null, placement: form.placement, priority: Number(form.priority), status: form.status, open_in_new_tab: form.open_in_new_tab, starts_at: form.starts_at || null, ends_at: form.ends_at || null, targets: [target] };
    try { editingId ? await api.put(`/admin/advertisements/${editingId}`, payload) : await api.post('/admin/advertisements', payload); reset(); await load(); }
    catch (e) { setError(e.response?.data?.message || Object.values(e.response?.data?.errors || {})[0]?.[0] || 'Could not save advertisement.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-8">
    <form onSubmit={save} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between"><div><h1 className="font-serif text-2xl font-bold">Advertising Management</h1><p className="mt-1 text-sm text-zinc-500">{editingId ? 'Edit advertisement' : 'Create and target a new advertisement'}</p></div>{editingId && <Button type="button" onClick={reset}>Cancel edit</Button>}</div>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="text-sm font-semibold">Title<input required value={form.title} onChange={(e) => update('title', e.target.value)} className="mt-2 w-full rounded-lg border p-3 dark:bg-zinc-950" /></label>
        <label className="text-sm font-semibold">Advertisement image<input required={!form.image_media_id} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => upload(e.target.files?.[0])} className="mt-2 block w-full text-sm" /><span className="mt-2 block text-xs font-normal text-zinc-500">Recommended sidebar image: 300×250 px (336×280 accepted). Banner: 970×250 px or 728×90 px. Mobile: 320×100 px or 300×250 px. JPG, PNG, WebP; max 5 MB. {uploadText}</span></label>
        <label className="text-sm font-semibold">Alt text<input value={form.alt_text} onChange={(e) => update('alt_text', e.target.value)} className="mt-2 w-full rounded-lg border p-3 dark:bg-zinc-950" /></label>
        <label className="text-sm font-semibold">Redirect URL<input type="url" value={form.redirect_url} onChange={(e) => update('redirect_url', e.target.value)} className="mt-2 w-full rounded-lg border p-3 dark:bg-zinc-950" /></label>
        <Select label="Placement" value={form.placement} onChange={(v) => update('placement', v)} options={[['sidebar_sticky','Sticky sidebar (300×250)'],['content_top','Top banner (970×250 / 728×90)'],['content_middle','Inline content (728×90)'],['content_bottom','Bottom banner (970×250 / 728×90)'],['header_banner','Header banner'],['footer_banner','Footer banner']]} />
        <Select label="Status" value={form.status} onChange={(v) => update('status', v)} options={['draft','active','inactive','expired'].map((v) => [v,v])} />
        <label className="text-sm font-semibold">Priority<input type="number" value={form.priority} onChange={(e) => update('priority', e.target.value)} className="mt-2 w-full rounded-lg border p-3 dark:bg-zinc-950" /></label>
        <Select label="Target area" value={form.target_area} onChange={(v) => update('target_area', v)} options={[['website','Website page'],['publication','Magazine / Journal pages'],['article','Magazine / Journal articles']]} />
        {form.target_area !== 'website' && <><Select label="Publication type" value={form.publication_type} onChange={(v) => update('publication_type', v)} options={[['magazine','Magazine'],['journal','Journal']]} /><Select label="Publication" value={form.publication_id} onChange={(v) => update('publication_id', v)} options={options.map((o) => [o.id,o.title])} /><Select label="Target mode" value={form.target_mode} onChange={(v) => update('target_mode', v)} options={(form.target_area === 'article' ? [['all_articles','All published articles'],['specific_articles','Specific published article']] : [['all_pages','All pages'],['specific_pages','Specific page']])} /></>}
        {(form.target_area === 'website' || form.target_mode === 'specific_pages') && <Select label="Page" value={form.page_key} onChange={(v) => update('page_key', v)} options={pages.map((p) => [p.page_key,p.label])} />}
        {form.target_mode === 'specific_articles' && <Select label="Published article" value={form.article_id} onChange={(v) => update('article_id', v)} options={articles.map((a) => [a.id,a.title])} />}
        <label className="text-sm font-semibold">Starts at<input type="datetime-local" value={form.starts_at} onChange={(e) => update('starts_at', e.target.value)} className="mt-2 w-full rounded-lg border p-3 dark:bg-zinc-950" /></label>
        <label className="text-sm font-semibold">Ends at<input type="datetime-local" value={form.ends_at} onChange={(e) => update('ends_at', e.target.value)} className="mt-2 w-full rounded-lg border p-3 dark:bg-zinc-950" /></label>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.open_in_new_tab} onChange={(e) => update('open_in_new_tab', e.target.checked)} /> Open redirect in a new tab</label>
      </div>
      <div className="mt-6"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Update advertisement' : 'Create advertisement'}</Button></div>
    </form>
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><table className="w-full text-left text-sm"><thead className="bg-zinc-50 dark:bg-zinc-950"><tr>{['Title','Placement','Status','Priority','Target','Actions'].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead><tbody>{items.map((ad) => <tr key={ad.id} className="border-t dark:border-zinc-800"><td className="p-4 font-semibold">{ad.title}</td><td className="p-4">{ad.placement}</td><td className="p-4">{ad.status}</td><td className="p-4">{ad.priority}</td><td className="p-4">{ad.targets?.[0]?.target_mode}</td><td className="p-4"><button onClick={() => beginEdit(ad)} className="font-bold text-amber-700">Edit</button></td></tr>)}</tbody></table></div>
  </div>;
}

function Select({ label, value, onChange, options }) { return <label className="text-sm font-semibold">{label}<select required value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-lg border p-3 dark:bg-zinc-950"><option value="">Select…</option>{options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>; }
