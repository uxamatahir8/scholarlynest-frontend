'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCheck, RefreshCw, Settings } from 'lucide-react';
import api from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import ErrorState from '../ui/ErrorState';
import Skeleton from '../ui/Skeleton';
import NotificationCard from './NotificationCard';
import NotificationEmptyState from './NotificationEmptyState';
import NotificationFilters from './NotificationFilters';

const tabs = [
  ['all', 'All'], ['unread', 'Unread'], ['action_required', 'Action Required'], ['archived', 'Archived'], ['dismissed', 'Dismissed'],
];

const initialFilters = { q: '', category: '', priority: '', article_tracking_code: '', from: '', to: '' };

export default function NotificationCenter() {
  const { counts, refreshCounts } = useNotifications();
  const [tab, setTab] = useState('all');
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.q.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filters.q]);

  const params = useMemo(() => Object.fromEntries(Object.entries({
    tab,
    category: filters.category || undefined,
    priority: filters.priority || undefined,
    article_tracking_code: filters.article_tracking_code.trim() || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    q: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    limit: 25,
  }).filter(([, value]) => value !== undefined)), [tab, filters.category, filters.priority, filters.article_tracking_code, filters.from, filters.to, debouncedSearch]);

  const load = useCallback(async ({ cursor = null, append = false } = {}) => {
    const requestId = ++requestRef.current;
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const response = await api.get('/notifications', { params: { ...params, cursor: cursor || undefined } });
      if (requestId !== requestRef.current) return;
      setItems((current) => append ? [...current, ...(response.data?.data || [])] : (response.data?.data || []));
      setNextCursor(response.data?.meta?.next_cursor || null);
      setError(null);
      await refreshCounts();
    } catch (err) {
      if (requestId === requestRef.current) setError(err);
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [params, refreshCounts]);

  useEffect(() => { load(); }, [load]);

  const mutate = async (id, request) => {
    setBusyId(id);
    try {
      const response = await request();
      const updated = response.data.data;
      setItems((current) => current.map((item) => item.id === id ? updated : item).filter((item) => {
        if (tab === 'archived') return item.visibility === 'archived';
        if (tab === 'dismissed') return item.visibility === 'dismissed';
        if (tab === 'unread') return !item.read_at;
        return item.visibility !== 'archived' && item.visibility !== 'dismissed';
      }));
      await refreshCounts();
    } catch (err) {
      setError(err);
    } finally {
      setBusyId(null);
    }
  };

  const markRead = (id, read) => mutate(id, () => api.patch(`/notifications/${id}/read`, { read }));
  const changeVisibility = (id, state) => mutate(id, () => api.patch(`/notifications/${id}/visibility`, { state }));

  const markAllRead = async () => {
    setBusyId('all');
    try {
      await api.post('/notifications/read-all', { before: new Date().toISOString(), scope: { tab, category: filters.category || null } });
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })).filter(() => tab !== 'unread'));
      await refreshCounts();
    } catch (err) {
      setError(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Assignments, decisions, deadlines, support, and account updates.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={RefreshCw} onClick={() => load()} disabled={loading}>Refresh</Button>
          <Link href="/admin/settings/notifications" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"><Settings className="h-4 w-4" aria-hidden="true" /> Preferences</Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <div className="flex max-w-full gap-1 overflow-x-auto" role="tablist" aria-label="Notification views">
            {tabs.map(([value, label]) => (
              <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`min-h-11 whitespace-nowrap rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${tab === value ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--muted)] hover:bg-[var(--surface-muted)]'}`}>
                {label}{value === 'unread' ? ` ${counts.unread_count}` : value === 'action_required' ? ` ${counts.action_required_count}` : ''}
              </button>
            ))}
          </div>
          {!['archived', 'dismissed'].includes(tab) && <Button variant="ghost" icon={CheckCheck} onClick={markAllRead} disabled={!counts.unread_count || busyId === 'all'}>Mark all read</Button>}
        </div>
        <div className="border-b border-[var(--border)] p-4"><NotificationFilters filters={filters} onChange={setFilters} /></div>

        {error && <ErrorState className="m-4" title={items.length ? 'Showing the last available results' : 'Notifications unavailable'}>{items.length ? 'Refresh to retrieve newer notifications.' : 'Check your connection and try again.'}</ErrorState>}
        {loading && items.length === 0 ? (
          <div className="space-y-3 p-5" aria-label="Loading notifications"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        ) : items.length === 0 ? (
          <NotificationEmptyState archived={tab === 'archived'} />
        ) : (
          <div aria-live="polite">
            {items.map((notification) => <NotificationCard key={notification.id} notification={notification} onRead={markRead} onVisibility={changeVisibility} busy={busyId === notification.id} />)}
          </div>
        )}

        {nextCursor && <div className="flex justify-center border-t border-[var(--border)] p-4"><Button variant="outline" onClick={() => load({ cursor: nextCursor, append: true })} isLoading={loadingMore}>Load more</Button></div>}
      </Card>
    </div>
  );
}
