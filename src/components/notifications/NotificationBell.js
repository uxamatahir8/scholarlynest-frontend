'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, RefreshCw } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationCountBadge from './NotificationCountBadge';
import NotificationCard from './NotificationCard';

export default function NotificationBell() {
  const { counts, recent, loading, error, refreshRecent, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const dialogRef = useRef(null);
  const actionItems = recent.filter((notification) => notification.action?.status === 'pending');
  const informationalItems = recent.filter((notification) => notification.action?.status !== 'pending');

  useEffect(() => {
    if (!open) return undefined;
    refreshRecent();
    const focusFrame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      window.cancelAnimationFrame(focusFrame);
    };
  }, [open, refreshRecent]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        aria-label={`Notifications, ${counts.unread_count} unread`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        <NotificationCountBadge count={counts.unread_count} className="absolute -right-1 -top-1" />
      </button>

      {open && (
        <section ref={dialogRef} tabIndex={-1} role="dialog" aria-label="Notifications" className="fixed inset-x-3 top-[calc(var(--console-topbar-height)+0.5rem)] z-50 max-h-[calc(100dvh-var(--console-topbar-height)-1rem)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-2xl outline-none sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(28rem,calc(100vw-2rem))]">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div>
              <h2 className="font-bold text-[var(--foreground)]">Notifications</h2>
              <p className="text-xs text-[var(--muted)]">{counts.action_required_count} require action</p>
            </div>
            <button type="button" onClick={() => refreshRecent()} className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" aria-label="Refresh notifications">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </header>
          <div className="max-h-[60dvh] overflow-y-auto" aria-live="polite">
            {error && <p className="p-5 text-sm text-red-700 dark:text-red-300">Notifications are temporarily unavailable.</p>}
            {!error && loading && recent.length === 0 && <p className="p-5 text-sm text-[var(--muted)]">Loading notifications…</p>}
            {!error && !loading && recent.length === 0 && <p className="p-8 text-center text-sm text-[var(--muted)]">You&apos;re all caught up.</p>}
            {actionItems.length > 0 && <h3 className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Action required</h3>}
            {actionItems.map((notification) => <NotificationCard key={notification.id} notification={notification} compact onRead={markRead} />)}
            {informationalItems.length > 0 && actionItems.length > 0 && <h3 className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Recent</h3>}
            {informationalItems.map((notification) => <NotificationCard key={notification.id} notification={notification} compact onRead={markRead} />)}
          </div>
          <footer className="border-t border-[var(--border)] p-3 text-center">
            <Link href="/admin/notifications" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-bold text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">View all notifications</Link>
          </footer>
        </section>
      )}
    </div>
  );
}
