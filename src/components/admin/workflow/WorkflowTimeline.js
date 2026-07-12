import React from 'react';
import { History } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import WorkflowSection from './WorkflowSection';
import { eventLabel, formatDate, labelize } from './workflowDisplay';

export default function WorkflowTimeline({ article }) {
  const events = (article.audit_logs || [])
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

  const versions = (article.versions || [])
    .slice()
    .sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0))
    .slice(0, 5);

  return (
    <WorkflowSection title="Workflow History" description="A concise record of meaningful manuscript movement." icon={History}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Milestones</h3>
          {events.length === 0 ? (
            <EmptyState className="mt-3" title="No visible history">No workflow history is visible for your role.</EmptyState>
          ) : (
            <ol className="mt-3 space-y-3" aria-label="Workflow history">
              {events.map((event) => (
                <li key={event.id} className="relative border-l border-[var(--border)] pl-4">
                  <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    {eventLabel((event.event === 'notification.sent' && event.payload?.workflow_event) ? event.payload.workflow_event : (event.event || event.action))}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                    {formatDate(event.created_at, { hour: 'numeric', minute: '2-digit' })}
                    {event.actor?.name ? ` · ${event.actor.name}` : ''}
                  </p>
                  {(event.from_status || event.to_status) && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {event.from_status ? labelize(event.from_status) : 'Start'} to {event.to_status ? labelize(event.to_status) : 'current state'}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Versions</h3>
          {versions.length === 0 ? (
            <EmptyState className="mt-3" title="No versions">Version snapshots will appear after revision or workflow updates.</EmptyState>
          ) : (
            <ul className="mt-3 space-y-2">
              {versions.map((version) => (
                <li key={version.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                  <p className="text-sm font-bold text-[var(--foreground)]">Version {version.version_number}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                    {version.label || labelize(version.status_snapshot)} · {formatDate(version.created_at)}
                  </p>
                  {version.change_summary && <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">{version.change_summary}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </WorkflowSection>
  );
}
