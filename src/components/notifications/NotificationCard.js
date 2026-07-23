'use client';

import React from 'react';
import Link from 'next/link';
import { Archive, ArchiveRestore, Check, Circle, ExternalLink, EyeOff } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import NotificationActionBadge from './NotificationActionBadge';
import { exactTime, relativeTime, safeNotificationHref } from '../../utils/notifications';

const priorityTone = { critical: 'danger', high: 'warning', normal: 'info', low: 'neutral' };

export default function NotificationCard({ notification, onRead, onVisibility, compact = false, busy = false }) {
  const href = safeNotificationHref(notification.deep_link);
  const unread = !notification.read_at;
  const archived = notification.visibility === 'archived';
  const dismissed = notification.visibility === 'dismissed';

  return (
    <article className={`relative border-b border-[var(--border)] ${unread ? 'bg-blue-500/[0.04]' : 'bg-[var(--surface-raised)]'} ${compact ? 'p-3' : 'p-4 sm:p-5'}`}>
      <div className="flex gap-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? 'bg-blue-600' : 'bg-transparent ring-1 ring-[var(--border)]'}`} aria-label={unread ? 'Unread' : 'Read'} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-[var(--foreground)]`}>{notification.title}</h3>
            <Badge tone={priorityTone[notification.priority]}>{notification.priority}</Badge>
            <NotificationActionBadge action={notification.action} />
          </div>
          <p className={`mt-1 text-sm leading-relaxed text-[var(--muted)] ${compact ? 'line-clamp-2' : ''}`}>{notification.body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
            {notification.context?.tracking_code && <span>{notification.context.tracking_code}</span>}
            {notification.context?.publication && <span>{notification.context.publication}</span>}
            <time dateTime={notification.created_at} title={exactTime(notification.created_at)}>{relativeTime(notification.created_at)} · {exactTime(notification.created_at)}</time>
          </div>
          {notification.unavailable && (
            <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">This item is no longer available or outside your current access.</p>
          )}
          <div className={`mt-3 flex flex-wrap items-center gap-2 ${compact ? 'text-xs' : ''}`}>
            {href && (
              <Link href={href} onClick={() => unread && onRead?.(notification.id, true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                {notification.action?.available ? notification.action.label || 'Open workflow' : 'Open'}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
            {onRead && (
              <Button type="button" size="sm" variant="ghost" className="min-h-11" disabled={busy} onClick={() => onRead(notification.id, unread)} icon={unread ? Check : Circle}>
                {unread ? 'Mark read' : 'Mark unread'}
              </Button>
            )}
            {onVisibility && !compact && (
              <>
                <Button type="button" size="sm" variant="ghost" className="min-h-11" disabled={busy} onClick={() => onVisibility(notification.id, archived || dismissed ? 'active' : 'archived')} icon={archived || dismissed ? ArchiveRestore : Archive}>
                  {archived || dismissed ? 'Restore' : 'Archive'}
                </Button>
                {!archived && !dismissed && (
                  <Button type="button" size="sm" variant="ghost" className="min-h-11" disabled={busy} onClick={() => onVisibility(notification.id, 'dismissed')} icon={EyeOff}>Dismiss</Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
