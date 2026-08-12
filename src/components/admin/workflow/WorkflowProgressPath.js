'use client';

import React from 'react';
import { Check, ChevronRight, AlertOctagon } from 'lucide-react';
import { currentMilestoneIndex, workflowMilestones } from './workflowDisplay';
import { normalizeStatus } from '../../../utils/status';

export default function WorkflowProgressPath({ article }) {
  const projectedStatus = article?.status_projection?.canonical || article?.lifecycle_status || article?.status;
  const normalized = normalizeStatus(projectedStatus);
  const isRejected = ['rejected', 'desk_rejected'].includes(normalized);
  const statusLabel = normalized === 'in_transit'
    ? 'Transfer Pending Author Decision'
    : article?.status_projection?.canonical_label || article?.author_status || article?.status;
  
  const activeIndex = currentMilestoneIndex(projectedStatus || 'draft');

  // Build the list of steps to show
  const steps = workflowMilestones.map((milestone) => ({
    id: milestone.id,
    label: milestone.label,
    statuses: milestone.statuses,
  }));

  // If rejected, append a terminal "Rejected" milestone
  if (isRejected) {
    steps.push({
      id: 'rejected',
      label: 'Rejected',
      statuses: ['rejected'],
    });
  }

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2 mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Workflow Progress</h3>
        <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-bold border border-[var(--border)] text-[var(--foreground)]">
          {statusLabel ? String(statusLabel).replaceAll('_', ' ').toUpperCase() : 'UNKNOWN'}
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-zinc-200 dark:scrollbar-zinc-800">
        <ol className="flex items-center gap-1.5 min-w-max">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            let isCurrent = false;
            let isCompleted = false;

            if (isRejected) {
              if (step.id === 'rejected') {
                isCurrent = true;
              } else {
                isCompleted = true;
              }
            } else {
              isCurrent = index === activeIndex;
              isCompleted = index < activeIndex;
            }

            let statusColor = 'text-[var(--muted)] border-[var(--border)] bg-[var(--surface)]';
            let dotColor = 'bg-zinc-300 dark:bg-zinc-700';

            if (isCurrent) {
              if (step.id === 'rejected') {
                statusColor = 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold';
                dotColor = 'bg-rose-500';
              } else {
                statusColor = 'border-[var(--accent)] bg-amber-500/10 text-[var(--accent)] font-bold';
                dotColor = 'bg-[var(--accent)]';
              }
            } else if (isCompleted) {
              statusColor = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold';
              dotColor = 'bg-emerald-500';
            }

            return (
              <li key={step.id} className="flex items-center gap-1.5">
                <div
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all ${statusColor}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor} ${isCurrent ? 'animate-pulse' : ''}`} />
                  <span>{step.label}</span>
                  {isCompleted && <Check className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                  {isCurrent && step.id === 'rejected' && <AlertOctagon className="h-3 w-3 shrink-0 text-rose-500" />}
                </div>
                {!isLast && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
