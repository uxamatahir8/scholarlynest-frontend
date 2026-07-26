'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarClock, CheckCircle2, FilePenLine, Plus, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import ThreadUnreadSummary from '../threads/ThreadUnreadSummary';

const statuses = [
  ['direct_publication_draft', 'Drafts'], ['direct_publication_ready', 'Ready'],
  ['scheduled_for_publication', 'Scheduled'], ['published', 'Published'], ['unpublished', 'Unpublished'],
  ['blocked_by_validation', 'Missing requirements'],
];

export default function DirectPublicationDashboard() {
  const { hasRole, loading: authLoading } = useAuth();
  const allowed = hasRole('super_admin') || hasRole('publisher');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true); setError('');
    try {
      const response = await api.get('/admin/direct-publications', { params: { status: status || undefined, search: search || undefined } });
      setItems(response.data?.data?.data || []); setCounts(response.data?.counts || {});
    } catch (err) { setError(err.response?.data?.message || 'Direct publications could not be loaded.'); }
    finally { setLoading(false); }
  }, [allowed, search, status]);

  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);
  if (authLoading) return <div className="p-8 text-slate-500">Checking access…</div>;
  if (!allowed) return <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">Direct publications are restricted to Super Admins and assigned Publishers.</div>;

  return <div className="space-y-6 p-4 md:p-7">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div><div className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Privileged flow</div>
        <h1 className="text-2xl font-bold text-slate-950">Direct Publications</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">Create publication-ready articles outside the editorial and peer-review lifecycle.</p></div>
      <Link href="/admin/direct-publications/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"><Plus size={17}/> Create Direct Publication</Link>
    </div>
    <ThreadUnreadSummary />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{statuses.map(([value, label], index) =>
      <button key={value} onClick={() => value !== 'blocked_by_validation' && setStatus(status === value ? '' : value)} className={`rounded-xl border p-4 text-left ${status === value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between text-slate-500">{index === 0 ? <FilePenLine size={18}/> : index === 2 ? <CalendarClock size={18}/> : index === 3 ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}<span className="text-2xl font-bold text-slate-950">{counts[value] || 0}</span></div>
        <div className="mt-2 text-sm font-semibold text-slate-700">{label}</div>
      </button>)}</div>
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4"><label className="relative block max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or tracking code" className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm"/></label></div>
      {error && <div className="m-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading direct publications…</div> : items.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No direct publications match this view.</div> :
        <div className="divide-y divide-slate-100">{items.map((article) => <Link key={article.id} href={`/admin/direct-publications/${article.id}`} className="grid gap-2 p-4 hover:bg-slate-50 md:grid-cols-[1fr_180px_180px] md:items-center">
          <div><div className="font-semibold text-slate-900">{article.title}</div><div className="mt-1 text-xs text-slate-500">{article.tracking_code} · {article.magazine?.title}</div></div>
          <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{String(article.status).replaceAll('_', ' ')}</span>
          <span className="text-xs text-slate-500 md:text-right">Updated {new Date(article.updated_at).toLocaleDateString()}</span>
        </Link>)}</div>}
    </div>
  </div>;
}
