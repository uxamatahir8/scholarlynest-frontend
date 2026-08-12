'use client';

import React, { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import { Select } from '../../ui/Input';
import WorkflowSection from './WorkflowSection';
import { eventLabel, formatDate, labelize, submissionVersionLabel } from './workflowDisplay';

export default function WorkflowTimeline({ article }) {
  const [versionId, setVersionId] = useState('all');
  const [stage, setStage] = useState('all');
  const [eventType, setEventType] = useState('all');
  const events = article.audit_logs || [];
  const versions = [...(article.versions || [])].sort((a, b) => Number(a.version_number) - Number(b.version_number));
  const stages = [...new Set(events.map((event) => event.workflow_stage).filter(Boolean))];
  const eventTypes = [...new Set(events.map((event) => event.display_event || event.event).filter(Boolean))];
  const filtered = useMemo(() => events
    .filter((event) => versionId === 'all' || Number(event.article_version_id) === Number(versionId))
    .filter((event) => stage === 'all' || event.workflow_stage === stage)
    .filter((event) => eventType === 'all' || (event.display_event || event.event) === eventType)
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [events, versionId, stage, eventType]);

  return (
    <WorkflowSection title="Workflow History" description="Article lifecycle events, limited to details permitted for your role." icon={History}>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Version
          <Select className="mt-1" value={versionId} onChange={(event) => setVersionId(event.target.value)}>
            <option value="all">All versions</option>
            {versions.map((version) => <option key={version.id} value={version.id}>{submissionVersionLabel(version)}</option>)}
          </Select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Workflow stage
          <Select className="mt-1" value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="all">All stages</option>
            {stages.map((value) => <option key={value} value={value}>{labelize(value)}</option>)}
          </Select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Event type
          <Select className="mt-1" value={eventType} onChange={(event) => setEventType(event.target.value)}>
            <option value="all">All event types</option>
            {eventTypes.map((value) => <option key={value} value={value}>{eventLabel(value)}</option>)}
          </Select>
        </label>
      </div>
      {filtered.length === 0 ? (
        <EmptyState className="mt-4" title="No visible history">No workflow events match the selected filters.</EmptyState>
      ) : (
        <ol className="mt-5 space-y-4" aria-label="Workflow history">
          {filtered.map((event) => {
            const version = versions.find((item) => Number(item.id) === Number(event.article_version_id));
            return (
              <li key={event.id} className="relative border-l border-[var(--border)] pl-4">
                <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                <p className="text-sm font-bold text-[var(--foreground)]">{eventLabel(event.display_event || event.event || event.action)}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  {formatDate(event.created_at, { hour: 'numeric', minute: '2-digit' })}
                  {event.actor?.name ? ` · ${event.actor.name}` : ''}
                  {version ? ` · ${submissionVersionLabel(version)}` : ''}
                  {event.workflow_stage ? ` · ${labelize(event.workflow_stage)}` : ''}
                </p>
                {(event.from_status || event.to_status) && <p className="mt-1 text-xs text-[var(--muted)]">{event.from_status ? labelize(event.from_status) : 'Start'} to {event.to_status ? labelize(event.to_status) : 'current state'}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </WorkflowSection>
  );
}
